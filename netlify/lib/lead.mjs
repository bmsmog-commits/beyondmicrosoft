// Phase 5 — project inquiry: validation, the normalised automation-ready
// event, duplicate protection and the delivery boundary.
//
// The inquiry is built from the visitor's reviewed Phase 4 brief. There is
// no scoring, ranking or judgment of the visitor here or anywhere else: the
// event only organises what the visitor submitted, for human review.
import { createHash } from 'node:crypto';
import { CONSENT_TEXT, INQUIRY_SCHEMA_VERSION, normaliseContact, validateContact } from '../../src/ai/inquiry.js';
import { sanitiseBrief } from './brief.mjs';
import { RequestError } from './request-guard.mjs';

export const INQUIRY_EVENT = 'project_inquiry_submitted';
export const INQUIRY_SOURCE = 'bms-ai-project-flow';
// Netlify Forms form that stores inquiries (mirrored in index.html so Netlify provisions it).
export const INQUIRY_FORM_NAME = 'project-inquiry';

const TOP_LEVEL_KEYS = new Set(['submissionId', 'contact', 'brief', 'consent', 'website']);
const CONTACT_KEYS = new Set(['name', 'email', 'phone', 'preferredContactMethod']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Brief fields whose text was written by BMS AI unless the visitor edited them.
const SUMMARY_FIELDS = [
  'project.title',
  'project.description',
  'business.type',
  'business.description',
  'problem',
  'objectives',
  'targetAudience',
  'requirements.confirmed',
  'existingSystems',
  'integrations',
  'preferredTechnology',
  'constraints',
  'unansweredQuestions',
  'notes',
];

const getPath = (object, path) => path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), object);
const hasValue = (value) => (Array.isArray(value) ? value.length > 0 : value != null && value !== '');

/**
 * Validates an untrusted inquiry body. Throws RequestError(400) with a list of
 * invalid field names (never values or internals). Returns
 * { honeypot: true } for bot submissions, else { submissionId, contact, brief }.
 */
export function parseInquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid(['body']);
  const unknown = Object.keys(body).filter((key) => !TOP_LEVEL_KEYS.has(key));
  if (unknown.length) throw invalid(['body']);
  // Honeypot: a hidden field people never see or fill.
  if (typeof body.website === 'string' && body.website.trim()) return { honeypot: true };

  const fields = [];
  if (typeof body.submissionId !== 'string' || !UUID_PATTERN.test(body.submissionId)) fields.push('submissionId');
  const rawContact = body.contact;
  if (!rawContact || typeof rawContact !== 'object' || Array.isArray(rawContact) || Object.keys(rawContact).some((key) => !CONTACT_KEYS.has(key))) {
    fields.push('contact');
  }
  const contact = normaliseContact(fields.includes('contact') ? {} : rawContact);
  if (!fields.includes('contact')) {
    // Non-string values are treated as missing by normaliseContact; flag them explicitly too.
    for (const key of CONTACT_KEYS) if (rawContact[key] != null && typeof rawContact[key] !== 'string') fields.push(key);
    fields.push(...Object.keys(validateContact(contact)));
  }
  // Consent must be the literal boolean true; the checkbox state alone is not trusted.
  if (body.consent !== true) fields.push('consent');
  // Same validation as Phase 4: known fields, types, lengths, services and portfolio IDs only.
  const brief = sanitiseBrief(body.brief);
  if (!brief) fields.push('brief');
  if (fields.length) throw invalid([...new Set(fields)]);
  return { submissionId: body.submissionId.toLowerCase(), contact, brief };
}

function invalid(fields) {
  const error = new RequestError(400, 'invalid_inquiry', 'Invalid inquiry');
  error.fields = fields;
  return error;
}

/** The normalised, automation-ready event (JSON). This is the Phase 5 → n8n/CRM contract. */
export function buildInquiryEvent({ submissionId, contact, brief }, now = new Date()) {
  const visitorEdited = brief.visitorEdited;
  const submittedAt = now.toISOString();
  return {
    event: INQUIRY_EVENT,
    source: INQUIRY_SOURCE,
    version: INQUIRY_SCHEMA_VERSION,
    submissionId,
    contact: {
      name: contact.name,
      email: contact.email,
      phone: contact.phone || null,
      preferredContactMethod: contact.preferredContactMethod,
    },
    project: {
      projectName: brief.project.title,
      projectType: brief.project.type,
      projectDescription: brief.project.description,
      business: brief.business,
      problem: brief.problem,
      objectives: brief.objectives,
      targetAudience: brief.targetAudience,
      // confirmed = what the visitor asked for; potential = BMS AI interpretation, to clarify.
      requirements: brief.requirements,
      relevantServices: brief.services.map(({ service, serviceName, focusArea }) => ({ service, serviceName, focusArea })),
      existingSystems: brief.existingSystems,
      technology: brief.preferredTechnology,
      integrations: brief.integrations,
      constraints: brief.constraints,
      // null = not provided by the visitor. Never estimated.
      timeline: brief.timeline,
      budget: brief.budget,
      referenceProjects: brief.relatedProjects.map(({ id, title, category, status }) => ({ id, title, category, status })),
    },
    discovery: {
      unansweredQuestions: brief.unansweredQuestions,
      assumptions: brief.assumptions,
      notes: brief.notes,
    },
    // Where each piece of text came from. Everything was reviewed by the visitor before submitting.
    provenance: {
      visitorEdited,
      aiSummary: SUMMARY_FIELDS.filter((path) => !visitorEdited.includes(path) && hasValue(getPath(brief, path))),
      toClarify: brief.requirements.potential.length ? ['requirements.potential'] : [],
    },
    consent: { projectContactConsent: true, text: CONSENT_TEXT, consentedAt: submittedAt },
    metadata: {
      submittedAt,
      schemaVersion: INQUIRY_SCHEMA_VERSION,
      briefCreatedAt: brief.createdAt,
      briefUpdatedAt: brief.updatedAt,
    },
  };
}

const list = (items) => (items?.length ? items.join('; ') : null);

/** Plain-text version for people reading the stored submission or its notification email. */
export function inquirySummaryText(event) {
  const { contact, project, discovery } = event;
  const business = [project.business.name, project.business.type, project.business.description].filter(Boolean).join(' — ');
  const lines = [
    ['Project', project.projectName],
    ['Project type', list(project.projectType)],
    ['Business', business],
    ['Project description', project.projectDescription],
    ['Problem', project.problem],
    ['Objectives', list(project.objectives)],
    ['Target audience', list(project.targetAudience)],
    ['Requirements (visitor)', list(project.requirements.confirmed)],
    ['Potential requirements (AI interpretation — to clarify)', list(project.requirements.potential)],
    ['Relevant BMS services', list(project.relevantServices.map((entry) => entry.focusArea || entry.serviceName))],
    ['Current systems', list(project.existingSystems)],
    ['Technology', list(project.technology)],
    ['Integrations', list(project.integrations)],
    ['Constraints', list(project.constraints)],
    ['Timeline', project.timeline || 'Not provided'],
    ['Budget', project.budget || 'Not provided'],
    ['Related BMS projects', list(project.referenceProjects.map((entry) => entry.title))],
    ['Still to clarify', list(discovery.unansweredQuestions)],
    ['Assumptions', list(discovery.assumptions)],
    ['Notes', list(discovery.notes)],
    ['Edited by the visitor', list(event.provenance.visitorEdited)],
    ['Written by BMS AI (reviewed by the visitor)', list(event.provenance.aiSummary)],
  ].filter(([, value]) => value);
  return [
    `Project inquiry from ${contact.name} (preferred contact: ${contact.preferredContactMethod})`,
    ...lines.map(([label, value]) => `${label}: ${value}`),
  ].join('\n');
}

// ---------- duplicate protection

const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;

/**
 * Best-effort, per-instance duplicate guard (like the rate limiter): the same
 * submissionId, or the same visitor sending identical content, within 30
 * minutes is acknowledged without delivering again. Concurrent repeats share
 * one delivery. Downstream automation should also dedupe on `submissionId`.
 */
export function createDuplicateGuard({ windowMs = DUPLICATE_WINDOW_MS } = {}) {
  const seen = new Map(); // key → { at, promise }
  const prune = (now) => {
    for (const [key, entry] of seen) if (now - entry.at > windowMs) seen.delete(key);
  };
  return async function once(keys, deliver) {
    const now = Date.now();
    prune(now);
    const existing = keys.map((key) => seen.get(key)).find(Boolean);
    if (existing) {
      await existing.promise;
      return { duplicate: true };
    }
    const promise = deliver();
    keys.forEach((key) => seen.set(key, { at: now, promise }));
    try {
      await promise;
    } catch (error) {
      // Failed deliveries can be retried with the same submissionId.
      keys.forEach((key) => seen.delete(key));
      throw error;
    }
    return { duplicate: false };
  };
}

/** Keys for duplicate detection: the submission ID and a hash of who + what (no raw PII kept). */
export function duplicateKeys(event) {
  const { submissionId, metadata, consent, ...content } = event;
  const digest = createHash('sha256').update(JSON.stringify(content)).digest('hex');
  return [`id:${submissionId}`, `content:${digest}`];
}

// ---------- delivery boundary

/**
 * Where inquiries go. `LEAD_DELIVERY` overrides; otherwise deployed sites use
 * Netlify Forms and local `netlify dev` / tests only validate and log.
 *   - "netlify-forms": stored in the site's Netlify Forms ("project-inquiry"),
 *     with Netlify's own form notifications. No credentials needed.
 *   - "log": development only. Nothing is stored; a receipt without personal data is logged.
 * Future automation (n8n, Brevo, CRM, WhatsApp, email) plugs in here as another
 * target that receives `event` unchanged. See docs/BMS-AI.md.
 */
export function deliveryTarget(env, deployContext) {
  const configured = (env.LEAD_DELIVERY || '').trim().toLowerCase();
  if (configured === 'netlify-forms' || configured === 'log') return configured;
  if (configured) throw new Error(`Unsupported LEAD_DELIVERY "${configured}"`);
  return deployContext && deployContext !== 'dev' ? 'netlify-forms' : 'log';
}

export async function deliverInquiry(event, { target, siteUrl, fetchImpl = fetch }) {
  if (target === 'log') return;
  if (!siteUrl) throw new Error('Site URL unavailable for Netlify Forms delivery');
  const fields = {
    'form-name': INQUIRY_FORM_NAME,
    submissionId: event.submissionId,
    name: event.contact.name,
    email: event.contact.email,
    phone: event.contact.phone || '',
    preferredContactMethod: event.contact.preferredContactMethod,
    projectName: event.project.projectName,
    services: event.project.relevantServices.map((entry) => entry.focusArea || entry.serviceName).join(', '),
    summary: inquirySummaryText(event),
    payload: JSON.stringify(event),
  };
  const response = await fetchImpl(new URL('/', siteUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
  });
  // Netlify Forms answers 200 (or a 3xx to a success page) once the submission is stored.
  if (!(response.ok || (response.status >= 300 && response.status < 400))) {
    throw new Error(`Netlify Forms responded ${response.status}`);
  }
}
