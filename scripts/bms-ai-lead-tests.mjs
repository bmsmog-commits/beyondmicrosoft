// Phase 5 — offline tests for the project inquiry endpoint
// (netlify/functions/bms-lead.mjs). No network: Netlify Forms delivery is
// stubbed at the fetch level.
//
//   npm run ai:lead-tests
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, beforeEach, describe, test } from 'node:test';
import handler from '../netlify/functions/bms-lead.mjs';
import { emptyBrief } from '../netlify/lib/brief.mjs';
import { deliveryTarget } from '../netlify/lib/lead.mjs';
import { CONSENT_TEXT, normaliseContact, validateContact } from '../src/ai/inquiry.js';

const SECRET = 'sk-test-secret-should-never-leak';
process.env.AI_API_KEY = SECRET;
const ORIGIN = 'http://localhost:8888';
const FAILED = "We couldn't submit your project inquiry right now. Your information is still here. Please try again.";

// ---------- stubs

const realFetch = globalThis.fetch;
let deliveries = [];
let formsStatus = 200;
let formsDelayMs = 0;
globalThis.fetch = async (url, init) => {
  if (formsDelayMs) await new Promise((resolve) => setTimeout(resolve, formsDelayMs));
  deliveries.push({ url: String(url), fields: Object.fromEntries(new URLSearchParams(init.body)) });
  return new Response('ok', { status: formsStatus });
};
const logs = [];
for (const level of ['info', 'warn', 'error']) console[level] = (line) => logs.push(String(line));
after(() => {
  globalThis.fetch = realFetch;
});
beforeEach(() => {
  deliveries = [];
  formsStatus = 200;
  formsDelayMs = 0;
});

let ipCounter = 0;
const PRODUCTION = { deploy: { context: 'production' }, site: { url: 'https://bms.example' } };
async function call(body, { method = 'POST', contentType = 'application/json', origin = ORIGIN, context = PRODUCTION, ip } = {}) {
  const request = new Request(`${ORIGIN}/.netlify/functions/bms-lead`, {
    method,
    headers: { 'content-type': contentType, origin, host: 'localhost:8888' },
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const response = await handler(request, { ...context, ip: ip || `lead-test-${(ipCounter += 1)}` });
  const text = await response.text();
  return { status: response.status, text, body: JSON.parse(text) };
}

// ---------- fixtures

const brief = (overrides = {}) => ({
  ...emptyBrief(),
  createdAt: '2026-09-24T10:00:00.000Z',
  updatedAt: '2026-09-24T10:05:00.000Z',
  business: { name: null, type: 'Fashion business', description: null },
  project: { title: 'Fashion Business E-commerce Website', type: ['Web Development'], description: 'Customers browse products and place orders.' },
  requirements: { confirmed: ['Product browsing', 'Customer ordering'], potential: ['Online payments — to clarify'] },
  services: [{ service: 'web-app-development', serviceName: 'Web & Application Development', focusArea: 'Web Development', reason: 'Website with ordering.' }],
  relatedProjects: [{ id: 'lutapp', title: 'Lutapp', category: 'Application Development', status: 'In Development', reason: 'Shares characteristics.' }],
  unansweredQuestions: ['Budget', 'Timeline'],
  ...overrides,
});

// Unique email per fixture: identical content is (correctly) treated as a duplicate.
let visitorCounter = 0;
const inquiry = (overrides = {}) => ({
  submissionId: crypto.randomUUID(),
  contact: { name: 'Ada Obi', email: `Ada.${(visitorCounter += 1)}@Example.com`, phone: '+234 801 234 5678', preferredContactMethod: 'whatsapp' },
  brief: brief(),
  consent: true,
  website: '',
  ...overrides,
});

const withContact = (patch) => {
  const body = inquiry();
  body.contact = { ...body.contact, ...patch };
  return body;
};

const payloadOf = (delivery) => JSON.parse(delivery.fields.payload);
const allKeys = (value, out = []) => {
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) out.push(key, ...allKeys(child));
  return out;
};

// ---------- tests

describe('valid submissions', () => {
  test('1/12 — valid inquiry is delivered to Netlify Forms as a normalised event built from the brief', async () => {
    const body = inquiry();
    const { status, body: response } = await call(body);
    assert.equal(status, 200);
    assert.deepEqual(response, { ok: true, message: 'Project inquiry received.' });
    assert.equal(deliveries.length, 1);
    const { url, fields } = deliveries[0];
    assert.equal(url, `${ORIGIN}/`, 'posted back to the deploy that served the request');
    assert.equal(fields['form-name'], 'project-inquiry');
    assert.equal(fields.email, body.contact.email.toLowerCase());
    assert.match(fields.summary, /Budget: Not provided/);

    const event = payloadOf(deliveries[0]);
    assert.equal(event.event, 'project_inquiry_submitted');
    assert.equal(event.source, 'bms-ai-project-flow');
    assert.equal(event.version, 1);
    assert.equal(event.submissionId, body.submissionId);
    assert.deepEqual(event.contact, { name: 'Ada Obi', email: body.contact.email.toLowerCase(), phone: '+234 801 234 5678', preferredContactMethod: 'whatsapp' });
    assert.equal(event.project.projectName, 'Fashion Business E-commerce Website');
    assert.deepEqual(event.project.projectType, ['Web Development']);
    assert.deepEqual(event.project.requirements, body.brief.requirements);
    assert.deepEqual(event.project.relevantServices, [{ service: 'web-app-development', serviceName: 'Web & Application Development', focusArea: 'Web Development' }]);
    assert.deepEqual(event.project.referenceProjects, [{ id: 'lutapp', title: 'Lutapp', category: 'Application Development', status: 'In Development' }]);
    assert.deepEqual(event.discovery.unansweredQuestions, ['Budget', 'Timeline']);
    assert.deepEqual(event.provenance.toClarify, ['requirements.potential']);
    assert.ok(event.provenance.aiSummary.includes('requirements.confirmed'));
    assert.deepEqual(event.consent, { projectContactConsent: true, text: CONSENT_TEXT, consentedAt: event.metadata.submittedAt });
    assert.equal(event.metadata.briefUpdatedAt, '2026-09-24T10:05:00.000Z');
  });

  test('international phone numbers are accepted; phone is optional for email contact', () => {
    for (const phone of ['+44 20 7946 0958', '+1 (415) 555-2671', '0801 234 5678', '+234 801 234 5678', '+81-3-1234-5678', '']) {
      assert.deepEqual(validateContact(normaliseContact({ name: 'Ada Obi', email: 'a@b.co', phone, preferredContactMethod: 'email' })), {}, phone);
    }
    for (const phone of ['abc', '123', '+1234567890123456789', '555-CALL-NOW']) {
      assert.ok(validateContact(normaliseContact({ name: 'Ada Obi', email: 'a@b.co', phone })).phone, phone);
    }
  });

  test('13 — visitor-edited values are submitted and recorded as visitor-edited', async () => {
    const edited = brief({ targetAudience: ['Adults aged 25–45'], budget: '₦500,000', visitorEdited: ['targetAudience', 'budget'] });
    await call(inquiry({ brief: edited }));
    const event = payloadOf(deliveries[0]);
    assert.deepEqual(event.project.targetAudience, ['Adults aged 25–45']);
    assert.equal(event.project.budget, '₦500,000');
    assert.deepEqual(event.provenance.visitorEdited, ['targetAudience', 'budget']);
    assert.ok(!event.provenance.aiSummary.includes('targetAudience'));
  });

  test('14/15/16 — unknown Phase 4 fields stay unknown: no invented budget, timeline or name', async () => {
    await call(inquiry());
    const event = payloadOf(deliveries[0]);
    assert.equal(event.project.budget, null);
    assert.equal(event.project.timeline, null);
    assert.equal(event.project.business.name, null);
    assert.deepEqual(event.project.technology, []);
    assert.deepEqual(event.project.integrations, []);
    assert.doesNotMatch(deliveries[0].fields.payload, /₦|\$|€|£|\bweeks?\b|\bmonths?\b/);
  });

  test('17/18 — no lead scoring, ranking or confidence anywhere, even if the client sends them', async () => {
    const tampered = brief();
    tampered.services[0] = { ...tampered.services[0], role: 'primary', confidence: 'high', score: 99 };
    tampered.leadScore = 100;
    await call(inquiry({ brief: tampered }));
    const keys = allKeys(payloadOf(deliveries[0]));
    const flagged = keys.filter((key) => /score|confidence|rating|rank|priority|qualif|hot|warm|cold|likel|probab|role/i.test(key));
    assert.deepEqual(flagged, []);
    assert.doesNotMatch(deliveries[0].fields.summary, /score|confidence|qualified|hot|warm|cold/i);
  });

  test('untrusted brief content is re-validated: fake project IDs dropped, titles from trusted data', async () => {
    const tampered = brief({
      relatedProjects: [
        { id: 'lutapp', title: 'Totally different title', category: 'X', status: 'Completed' },
        { id: 'facebook', title: 'Facebook' },
      ],
      services: [{ service: 'satellites', serviceName: 'Satellites' }],
    });
    await call(inquiry({ brief: tampered }));
    const event = payloadOf(deliveries[0]);
    assert.deepEqual(event.project.referenceProjects, [{ id: 'lutapp', title: 'Lutapp', category: 'Application Development', status: 'In Development' }]);
    assert.deepEqual(event.project.relevantServices, []);
  });

  test('same-origin requests from every deployment are accepted and delivered to that same deploy', async () => {
    const hosts = [
      ['http://localhost:8888', 'dev'],
      ['https://deploy-preview-12--beyondmicrosoft.netlify.app', 'deploy-preview'],
      ['https://feature-x--beyondmicrosoft.netlify.app', 'branch-deploy'],
      ['https://beyondmicrosoft.com', 'production'],
      ['https://www.beyondmicrosoft.com', 'production'],
    ];
    for (const [origin, deployContext] of hosts) {
      deliveries = [];
      const request = new Request(`${origin}/.netlify/functions/bms-lead`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin, host: new URL(origin).host },
        body: JSON.stringify(inquiry()),
      });
      const response = await handler(request, { ip: `origin-${origin}`, deploy: { context: deployContext }, site: { url: 'https://beyondmicrosoft.com' } });
      assert.equal(response.status, 200, origin);
      assert.deepEqual(deliveries.map((d) => d.url), deployContext === 'dev' ? [] : [`${origin}/`], origin);
    }
    // Another site's page (or a preview calling production) is still rejected.
    const crossSite = new Request('https://beyondmicrosoft.com/.netlify/functions/bms-lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://deploy-preview-12--beyondmicrosoft.netlify.app', host: 'beyondmicrosoft.com' },
      body: JSON.stringify(inquiry()),
    });
    assert.equal((await handler(crossSite, { ip: 'origin-cross', deploy: { context: 'production' } })).status, 403);
  });

  test('invalid LEAD_DELIVERY fails safely (502, pre-written message, nothing delivered)', async () => {
    process.env.LEAD_DELIVERY = 'crm-typo';
    try {
      const { status, body, text } = await call(inquiry());
      assert.equal(status, 502);
      assert.deepEqual(body, { error: 'unavailable', message: FAILED });
      assert.doesNotMatch(text, /crm-typo|LEAD_DELIVERY/);
      assert.equal(deliveries.length, 0);
    } finally {
      delete process.env.LEAD_DELIVERY;
    }
    assert.equal(deliveryTarget({ LEAD_DELIVERY: 'netlify-forms' }, 'dev'), 'netlify-forms');
    assert.equal(deliveryTarget({}, 'branch-deploy'), 'netlify-forms');
  });

  test('local development ("log" target) validates without delivering anywhere', async () => {
    const { status } = await call(inquiry(), { context: { deploy: { context: 'dev' } } });
    assert.equal(status, 200);
    assert.equal(deliveries.length, 0);
    assert.equal(deliveryTarget({}, undefined), 'log');
    assert.equal(deliveryTarget({}, 'deploy-preview'), 'netlify-forms');
    assert.equal(deliveryTarget({ LEAD_DELIVERY: 'log' }, 'production'), 'log');
  });
});

describe('validation (safe 4xx responses)', () => {
  const expectInvalid = async (body, field) => {
    const { status, body: response } = await call(body);
    assert.equal(status, 400);
    assert.equal(response.message, 'Please check the highlighted details and try again.');
    assert.ok(response.fields.includes(field), `${field} in ${response.fields}`);
    assert.equal(deliveries.length, 0);
  };

  test('2 — missing name', () => expectInvalid(withContact({ name: '' }), 'name'));
  test('3 — missing email', () => expectInvalid(withContact({ email: undefined }), 'email'));
  test('4 — invalid email', async () => {
    for (const email of ['not-an-email', 'a@b', 'a b@c.com', '<script>@x.com']) await expectInvalid(withContact({ email }), 'email');
  });
  test('5 — consent must be the literal boolean true (client cannot bypass)', async () => {
    for (const consent of [false, 'true', 1, null, undefined]) await expectInvalid(inquiry({ consent }), 'consent');
  });
  test('6 — invalid preferred contact method', () => expectInvalid(withContact({ preferredContactMethod: 'telegram' }), 'preferredContactMethod'));
  test('phone or WhatsApp preference requires a phone number', () => expectInvalid(withContact({ phone: '' }), 'phone'));
  test('non-string contact values are rejected', () => expectInvalid(withContact({ name: { $gt: '' } }), 'name'));
  test('missing or invalid submission ID', () => expectInvalid(inquiry({ submissionId: '1; DROP TABLE' }), 'submissionId'));
  test('missing brief', () => expectInvalid(inquiry({ brief: 'x' }), 'brief'));
  test('unknown fields are rejected', async () => {
    await expectInvalid({ ...inquiry(), isAdmin: true }, 'body');
    await expectInvalid(withContact({ ssn: '123' }), 'contact');
  });

  test('7 — oversized payload → 413', async () => {
    const { status, body } = await call(inquiry({ website: 'x'.repeat(50_000) }));
    assert.equal(status, 413);
    assert.equal(deliveries.length, 0);
    assert.doesNotMatch(JSON.stringify(body), /Request body too large/);
  });

  test('8 — malformed JSON → 400', async () => {
    const { status, body } = await call('{"contact": ');
    assert.equal(status, 400);
    assert.equal(body.message, FAILED);
  });

  test('9 — unsupported method → 405', async () => {
    const { status } = await call(null, { method: 'GET' });
    assert.equal(status, 405);
  });

  test('wrong content type → 415; cross-origin → 403', async () => {
    assert.equal((await call(inquiry(), { contentType: 'application/x-www-form-urlencoded' })).status, 415);
    assert.equal((await call(inquiry(), { origin: 'https://evil.example' })).status, 403);
    assert.equal(deliveries.length, 0);
  });
});

describe('abuse and duplicate protection', () => {
  test('10 — the same submission ID is delivered once (sequential and concurrent repeats)', async () => {
    const body = inquiry();
    const first = await call(body);
    const second = await call(body);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(deliveries.length, 1);

    formsDelayMs = 50;
    const concurrent = inquiry();
    const results = await Promise.all([call(concurrent), call(concurrent), call(concurrent)]);
    assert.ok(results.every((result) => result.status === 200));
    assert.equal(deliveries.length, 2);
  });

  test('identical content with a new submission ID (e.g. a second tab) is not delivered twice', async () => {
    const body = inquiry({ contact: { name: 'Dup Test', email: 'dup@example.com', phone: '', preferredContactMethod: 'email' } });
    await call(body);
    await call({ ...body, submissionId: crypto.randomUUID() });
    assert.equal(deliveries.length, 1);
  });

  test('11 — delivery failure returns a safe message and the same submission can be retried', async () => {
    const body = inquiry();
    formsStatus = 500;
    const failed = await call(body);
    assert.equal(failed.status, 502);
    assert.deepEqual(failed.body, { error: 'unavailable', message: FAILED });
    formsStatus = 200;
    const retried = await call(body);
    assert.equal(retried.status, 200);
    assert.equal(deliveries.length, 2);
  });

  test('honeypot submissions look successful but are never delivered', async () => {
    const { status, body } = await call(inquiry({ website: 'https://spam.example' }));
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(deliveries.length, 0);
  });

  test('rate limit: a sixth submission in 10 minutes from one client → 429', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i += 1) statuses.push((await call(inquiry(), { ip: 'rate-limit-test' })).status);
    assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
  });
});

describe('security', () => {
  test('responses never contain secrets, env values, stack traces or internal errors', async () => {
    formsStatus = 500;
    const responses = [
      await call(inquiry()),
      await call('{bad'),
      await call(inquiry({ consent: false })),
      await call(inquiry({ website: 'y'.repeat(60_000) })),
    ];
    for (const { text } of responses) {
      assert.ok(!text.includes(SECRET));
      assert.doesNotMatch(text, /stack|at .+\.mjs|TypeError|Netlify Forms responded|process\.env|AI_API_KEY/);
    }
  });

  test('logs never contain visitor names, emails or phone numbers', async () => {
    logs.length = 0;
    await call(inquiry());
    formsStatus = 500;
    await call(inquiry());
    await call(withContact({ email: 'bad' }));
    const joined = logs.join('\n');
    assert.ok(logs.length >= 3);
    assert.doesNotMatch(joined, /Ada|@example\.com|801 234|Fashion Business/i);
  });

  test('19 — brief generation cannot submit a lead: the AI function has no path to the lead code', () => {
    const aiFunction = readFileSync(new URL('../netlify/functions/bms-ai.mjs', import.meta.url), 'utf8');
    assert.doesNotMatch(aiFunction, /lead\.mjs|bms-lead|deliverInquiry/);
  });
});
