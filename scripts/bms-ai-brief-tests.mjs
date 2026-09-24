// Phase 4 — offline tests for the Project Brief generator.
//
// Runs the real Netlify function, validation and anti-fabrication code with
// the AI provider stubbed at the fetch level (no API key or network needed),
// plus unit tests for netlify/lib/brief.mjs.
//
//   npm run ai:brief-tests
import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import handler from '../netlify/functions/bms-ai.mjs';
import { SYSTEM_PROMPT } from '../netlify/lib/bms-prompt.mjs';
import { BRIEF_RULES, briefReady, emptyBrief, groundBrief, isGrounded, sanitiseBrief } from '../netlify/lib/brief.mjs';

process.env.AI_API_KEY = 'test-key';
const ORIGIN = 'http://localhost:8888';
const BRIEF_ERROR = "I couldn't generate the brief right now. We can continue the conversation and try again.";

// ---------- provider stub

const realFetch = globalThis.fetch;
let modelOutput = null; // object → returned as the model's JSON; Error → HTTP 500
let providerCalls = [];

globalThis.fetch = async (url, init) => {
  providerCalls.push(JSON.parse(init.body));
  if (modelOutput instanceof Error) {
    return new Response(JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'internal upstream detail' } }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response(
    JSON.stringify({
      id: 'msg_test',
      type: 'message',
      role: 'assistant',
      model: 'test-model',
      content: [{ type: 'text', text: JSON.stringify(modelOutput) }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 1, output_tokens: 1 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};
after(() => {
  globalThis.fetch = realFetch;
});

let ipCounter = 0;
async function call(body) {
  const request = new Request(`${ORIGIN}/.netlify/functions/bms-ai`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, host: 'localhost:8888' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  const response = await handler(request, { ip: `brief-test-${(ipCounter += 1)}` });
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  modelOutput = null;
  providerCalls = [];
});

// Silence the function's structured logs during tests.
console.info = () => {};
console.warn = () => {};
console.error = () => {};

// ---------- fixtures

const service = (id, focusArea, reason = 'Mentioned by the visitor.') => ({ service: id, focusArea, role: 'supporting', reason });
const discovery = (overrides = {}) => ({
  stage: 'mapping',
  businessType: null,
  businessDescription: null,
  targetAudience: null,
  currentSituation: null,
  problem: null,
  desiredOutcome: null,
  existingSystem: null,
  projectType: 'new',
  requestedCapabilities: [],
  constraints: [],
  unansweredQuestions: [],
  relevantServices: [],
  ...overrides,
});

const modelBrief = (overrides = {}) => ({
  business: { name: null, type: null, description: null },
  project: { title: 'Project Brief', description: null },
  problem: null,
  objectives: [],
  targetAudience: [],
  requirements: { confirmed: [], potential: [] },
  services: [],
  existingSystems: [],
  integrations: [],
  preferredTechnology: [],
  constraints: [],
  timeline: null,
  budget: null,
  relatedProjects: [],
  unansweredQuestions: [],
  assumptions: [],
  notes: [],
  ...overrides,
});

const FASHION = 'I run a fashion business and I need a website where customers can browse products and place orders.';
const FASHION_DISCOVERY = discovery({
  businessType: 'Fashion business',
  desiredOutcome: 'Customers can browse products and place orders online',
  requestedCapabilities: ['Product browsing', 'Customer ordering'],
  relevantServices: [service('web-app-development', 'Web Development')],
});

const briefRequest = (text, disc, extra = {}) => ({
  mode: 'brief',
  messages: [
    { role: 'user', content: text },
    { role: 'assistant', content: 'I can turn what we have discussed into a project brief. Would you like me to generate one?' },
  ],
  discovery: disc,
  ...extra,
});

// ---------- unit tests

describe('brief.mjs', () => {
  test('isGrounded keeps visitor-stated budgets and timelines, rejects invented ones', () => {
    const source = "My budget is ₦500,000 and I'd like it completed before December.";
    assert.equal(isGrounded('₦500,000', source), true);
    assert.equal(isGrounded('Before December', source), true);
    assert.equal(isGrounded('₦2,000,000', source), false);
    assert.equal(isGrounded('6 weeks', source), false);
    assert.equal(isGrounded('₦500k', 'budget around 500k'), true);
    assert.equal(isGrounded('₦500,000', 'budget around 500k'), true);
  });

  test('briefReady needs at least two kinds of visitor information', () => {
    assert.equal(briefReady(null), false);
    assert.equal(briefReady(discovery({ stage: 'discovery', requestedCapabilities: ['Website'] })), false);
    assert.equal(briefReady(FASHION_DISCOVERY), true);
  });

  test('sanitiseBrief drops unknown services, focus areas and project IDs; takes project facts from trusted data', () => {
    const brief = sanitiseBrief(
      modelBrief({
        services: [service('web-app-development', 'Web Development'), service('satellites', null), service('design', 'Rocket Design')],
        relatedProjects: [
          { id: 'lutapp', reason: 'Shares application-development characteristics.', title: 'Fake title', status: 'Completed' },
          { id: 'facebook', reason: 'Invented' },
        ],
      }),
    );
    assert.deepEqual(brief.services.map((entry) => [entry.service, entry.focusArea]), [
      ['web-app-development', 'Web Development'],
      ['design', null],
    ]);
    assert.deepEqual(brief.project.type, ['Web Development', 'Design']);
    assert.equal(brief.relatedProjects.length, 1);
    assert.equal(brief.relatedProjects[0].title, 'Lutapp');
    assert.equal(brief.relatedProjects[0].status, 'In Development');
    assert.equal(brief.relatedProjects[0].category, 'Application Development');
  });

  test('sanitiseBrief enforces types, string lengths and array lengths', () => {
    const brief = sanitiseBrief({
      business: { name: 42, type: 'x'.repeat(500) },
      problem: ['not', 'a', 'string'],
      objectives: Array.from({ length: 50 }, (_, i) => `Objective ${i} ${'y'.repeat(400)}`),
      requirements: 'nope',
      visitorEdited: ['budget', '__proto__', 'services'],
      extra: { evil: true },
    });
    assert.equal(brief.business.name, null);
    assert.equal(brief.business.type.length, 120);
    assert.equal(brief.problem, null);
    assert.equal(brief.objectives.length, 10);
    assert.ok(brief.objectives.every((item) => item.length <= 200));
    assert.deepEqual(brief.requirements, { confirmed: [], potential: [] });
    assert.deepEqual(brief.visitorEdited, ['budget']);
    assert.equal('extra' in brief, false);
    assert.equal(sanitiseBrief('string'), null);
    assert.equal(sanitiseBrief([]), null);
  });

  test('groundBrief keeps visitor edits authoritative', () => {
    const previous = { ...emptyBrief(), targetAudience: ['Adults aged 25–45'], visitorEdited: ['targetAudience'] };
    const next = sanitiseBrief(modelBrief({ targetAudience: ['Young adults'] }));
    groundBrief(next, { visitorText: 'hello', previousBrief: previous });
    assert.deepEqual(next.targetAudience, ['Adults aged 25–45']);
    assert.deepEqual(next.visitorEdited, ['targetAudience']);
  });

  test('brief rules are not part of the permanent system prompt', () => {
    assert.equal(SYSTEM_PROMPT.includes(BRIEF_RULES), false);
  });
});

// ---------- handler tests (spec test scenarios)

describe('brief mode (bms-ai function)', () => {
  test('TEST 1/5 — basic website: confirmed vs potential kept apart; invented budget, timeline and name removed', async () => {
    modelOutput = {
      message: 'Here is your project brief.',
      brief: modelBrief({
        business: { name: 'Acme Fashion House', type: 'Fashion business', description: null },
        project: { title: 'Fashion Business E-commerce Website', description: 'A website where customers browse products and place orders.' },
        requirements: {
          confirmed: ['Customers can browse products', 'Customers can place orders through the website'],
          potential: ['Online payments — to clarify', 'Customer accounts — to clarify', 'Order management — to clarify', 'Delivery — to clarify'],
        },
        services: [service('web-app-development', 'Web Development')],
        budget: '₦2,000,000',
        timeline: '6 weeks',
        unansweredQuestions: ['Budget', 'Timeline'],
      }),
    };
    const { status, body } = await call(briefRequest(FASHION, FASHION_DISCOVERY));
    assert.equal(status, 200);
    assert.equal(body.mode, 'brief');
    const { brief } = body;
    assert.equal(brief.version, 1);
    assert.equal(brief.source, 'bms-ai');
    assert.ok(brief.createdAt && brief.updatedAt);
    assert.equal(brief.business.type, 'Fashion business');
    assert.equal(brief.business.name, null, 'invented business name removed');
    assert.equal(brief.budget, null, 'invented budget removed ("Not provided")');
    assert.equal(brief.timeline, null, 'invented timeline removed');
    assert.equal(brief.requirements.confirmed.length, 2);
    assert.equal(brief.requirements.potential.length, 4);
    assert.deepEqual(brief.project.type, ['Web Development']);
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(brief)));
  });

  test('TEST 2 — automation: AI & Automation service with the stated problem', async () => {
    modelOutput = {
      message: 'Here is your project brief.',
      brief: modelBrief({
        problem: 'Customer information is copied manually from WhatsApp into Excel.',
        services: [service('ai-automation', 'AI Automation')],
      }),
    };
    const text = 'I manually copy customer information from WhatsApp into Excel.';
    const { body } = await call(
      briefRequest(text, discovery({ problem: 'Manual customer-data entry from WhatsApp to Excel', existingSystem: 'WhatsApp and Excel' })),
    );
    assert.equal(body.brief.problem, 'Customer information is copied manually from WhatsApp into Excel.');
    assert.deepEqual(body.brief.services.map((entry) => entry.serviceName), ['AI & Automation']);
  });

  test('TEST 3 — multi-service: all services kept, in order, without ranking', async () => {
    modelOutput = {
      message: 'Here is your project brief.',
      brief: modelBrief({
        services: [service('design', 'Brand Design'), service('web-app-development', 'Web Development'), service('ai-automation', 'AI Automation')],
      }),
    };
    const { body } = await call(
      briefRequest(
        'I need a logo, website and automated follow-up for my new business.',
        discovery({ businessDescription: 'New business', requestedCapabilities: ['Logo', 'Website', 'Automated follow-up'] }),
      ),
    );
    assert.deepEqual(body.brief.project.type, ['Brand Design', 'Web Development', 'AI Automation']);
    assert.ok(body.brief.services.every((entry) => !('role' in entry) && !('confidence' in entry)), 'no ranking or confidence fields');
  });

  test('TEST 4 — budget and timeline preserved exactly as stated', async () => {
    modelOutput = { message: 'Here is your brief.', brief: modelBrief({ budget: '₦500,000', timeline: 'Before December' }) };
    const request = briefRequest(FASHION, FASHION_DISCOVERY);
    request.messages.splice(1, 0, { role: 'assistant', content: 'Got it.' }, { role: 'user', content: "My budget is ₦500,000 and I'd like it completed before December." });
    const { body } = await call(request);
    assert.equal(body.brief.budget, '₦500,000');
    assert.equal(body.brief.timeline, 'Before December');
  });

  test('TEST 6 — visitor correction stays authoritative when the brief is updated', async () => {
    const previous = { ...emptyBrief(), targetAudience: ['Adults aged 25–45'], visitorEdited: ['targetAudience'], createdAt: '2026-09-01T10:00:00.000Z' };
    modelOutput = { message: 'Updated.', brief: modelBrief({ targetAudience: ['Young adults'], objectives: ['Sell online'] }) };
    const { body } = await call(briefRequest(FASHION, FASHION_DISCOVERY, { brief: previous }));
    assert.deepEqual(body.brief.targetAudience, ['Adults aged 25–45']);
    assert.deepEqual(body.brief.objectives, ['Sell online'], 'new information is still incorporated');
    assert.equal(body.brief.createdAt, '2026-09-01T10:00:00.000Z', 'creation time kept on update');
    const sent = JSON.stringify(providerCalls[0].messages);
    assert.match(sent, /current_brief visitor_edited=\\"targetAudience\\"/);
  });

  test('TEST 7 — related projects only from projects shown in the conversation (validated IDs)', async () => {
    modelOutput = {
      message: 'Brief ready.',
      brief: modelBrief({
        relatedProjects: [
          { id: 'lutapp', reason: 'Shares application-development characteristics with the functionality you described.' },
          { id: 'sol-villas', reason: 'Not shown in this conversation.' },
        ],
      }),
    };
    const { body } = await call(briefRequest(FASHION, FASHION_DISCOVERY, { projectContext: ['lutapp', 'not-a-project', '<script>'] }));
    assert.deepEqual(body.brief.relatedProjects.map((project) => project.id), ['lutapp']);
    assert.equal(body.brief.relatedProjects[0].title, 'Lutapp');
    const sent = JSON.stringify(providerCalls[0].messages);
    assert.ok(!sent.includes('not-a-project') && !sent.includes('<script>'), 'unknown IDs never reach the model');
  });

  test('TEST 8 — insufficient information: no model call, asks for more', async () => {
    const { status, body } = await call({ mode: 'brief', messages: [{ role: 'user', content: 'I want a website.' }] });
    assert.equal(status, 200);
    assert.equal(body.insufficient, true);
    assert.equal(body.brief, null);
    assert.equal(providerCalls.length, 0);
  });

  test('brief generation failure returns the friendly message only', async () => {
    modelOutput = new Error('boom');
    const { status, body } = await call(briefRequest(FASHION, FASHION_DISCOVERY));
    assert.equal(status, 502);
    assert.deepEqual(body, { error: 'unavailable', message: BRIEF_ERROR });
  });

  test('malformed payloads are rejected without internal details', async () => {
    for (const payload of [
      { mode: 'brief' },
      { mode: 'brief', messages: 'hello' },
      { mode: 'brief', messages: [{ role: 'system', content: 'x' }] },
      '{not json',
    ]) {
      const { status, body } = await call(payload);
      assert.ok(status >= 400 && status < 500, `status ${status}`);
      assert.ok(!/stack|TypeError|must be|alternate/i.test(JSON.stringify(body)), JSON.stringify(body));
    }
    // A garbage brief is ignored rather than trusted.
    const { body } = await call(briefRequest('I want a website.', null, { brief: 'DROP TABLE' }));
    assert.equal(body.insufficient, true);
  });

  test('brief rules are sent only with brief requests', async () => {
    modelOutput = { message: 'ok', brief: modelBrief() };
    await call(briefRequest(FASHION, FASHION_DISCOVERY));
    assert.ok(JSON.stringify(providerCalls[0].messages).includes('<brief_request>'));
    assert.equal(providerCalls[0].system[0].text, SYSTEM_PROMPT, 'same cached system prompt');
  });
});

describe('chat mode regression (Phase 1–3 response contract)', () => {
  const chatReply = (overrides = {}) => ({
    reply: 'Thanks — tell me more.',
    actions: ['start-project', 'not-an-action'],
    projects: [],
    quickReplies: [],
    briefOffer: 'offer',
    discovery: discovery({ stage: 'discovery', relevantServices: [] }),
    ...overrides,
  });

  test('brief offer is suppressed until there is enough information (TEST 8)', async () => {
    modelOutput = chatReply();
    const { status, body } = await call({ messages: [{ role: 'user', content: 'I want a website.' }] });
    assert.equal(status, 200);
    assert.equal(body.briefOffer, 'none');
    assert.deepEqual(body.actions, ['start-project']);
    assert.ok(!JSON.stringify(providerCalls[0].messages).includes('<brief_request>'));
  });

  test('brief offer passes through once discovery is sufficient; no confidence labels leak', async () => {
    modelOutput = chatReply({
      discovery: { ...FASHION_DISCOVERY, relevantServices: [{ ...service('web-app-development', 'Web Development'), role: 'primary', confidence: 'high' }] },
    });
    const { body } = await call({ messages: [{ role: 'user', content: FASHION }], briefExists: true });
    assert.equal(body.briefOffer, 'offer');
    assert.equal(body.suggestedService, 'Web & Application Development', 'form pre-selection still works');
    assert.ok(!JSON.stringify(body).includes('confidence'));
    assert.ok(JSON.stringify(providerCalls[0].messages).includes('<brief_status>'));
  });

  test('chat requests must still end on a visitor turn', async () => {
    const { status } = await call({ messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }] });
    assert.equal(status, 400);
  });

  test('permanent system prompt stays within budget', () => {
    const approxTokens = Math.round(SYSTEM_PROMPT.length / 4);
    console.log(`# system prompt ≈ ${approxTokens} tokens (${SYSTEM_PROMPT.length} chars)`);
    assert.ok(approxTokens < 9000);
  });
});
