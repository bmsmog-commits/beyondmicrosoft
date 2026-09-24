// Phase 4 — Project Brief: schema, validation and anti-fabrication checks.
//
// A brief is generated from the conversation, the Phase 2 discovery notes
// and the Phase 3 portfolio records. It is a discovery summary, not a
// proposal. Everything that reaches the browser passes through
// `sanitiseBrief()` + `groundBrief()`:
//   - only known services / focus areas and allowed portfolio project IDs,
//   - budget, timeline and business name must be traceable to the visitor's
//     own words (otherwise they become null, i.e. "Not provided"),
//   - fields the visitor edited are authoritative and are never overwritten.
import { FOCUS_AREAS, SERVICE_IDS, serviceById } from '../../src/ai/services.js';
import { PORTFOLIO_IDS, portfolioRecordById } from '../../src/ai/portfolio.js';

export const BRIEF_VERSION = 1;

const LIMITS = { short: 120, text: 400, item: 200, items: 10, services: 4, related: 4 };

// Fields a visitor may edit in the brief view (dot paths).
export const EDITABLE_FIELDS = Object.freeze([
  'business.name',
  'business.type',
  'business.description',
  'project.title',
  'project.description',
  'problem',
  'objectives',
  'targetAudience',
  'requirements.confirmed',
  'requirements.potential',
  'existingSystems',
  'integrations',
  'preferredTechnology',
  'constraints',
  'timeline',
  'budget',
  'unansweredQuestions',
  'notes',
]);

const LIST_FIELDS = new Set([
  'objectives',
  'targetAudience',
  'requirements.confirmed',
  'requirements.potential',
  'existingSystems',
  'integrations',
  'preferredTechnology',
  'constraints',
  'unansweredQuestions',
  'notes',
]);

const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const stringList = { type: 'array', items: { type: 'string' } };
const object = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });

/** What the model must return in brief mode. */
export const BRIEF_RESPONSE_SCHEMA = object({
  message: { type: 'string' },
  brief: object({
    business: object({ name: nullableString, type: nullableString, description: nullableString }),
    project: object({ title: { type: 'string' }, description: nullableString }),
    problem: nullableString,
    objectives: stringList,
    targetAudience: stringList,
    requirements: object({ confirmed: stringList, potential: stringList }),
    services: {
      type: 'array',
      items: object({
        service: { type: 'string', enum: [...SERVICE_IDS] },
        focusArea: { anyOf: [{ type: 'string', enum: [...FOCUS_AREAS] }, { type: 'null' }] },
        reason: { type: 'string' },
      }),
    },
    existingSystems: stringList,
    integrations: stringList,
    preferredTechnology: stringList,
    constraints: stringList,
    timeline: nullableString,
    budget: nullableString,
    relatedProjects: { type: 'array', items: object({ id: { type: 'string', enum: [...PORTFOLIO_IDS] }, reason: { type: 'string' } }) },
    unansweredQuestions: stringList,
    assumptions: stringList,
    notes: stringList,
  }),
});

// ---------- helpers

const cleanText = (value, max = LIMITS.text) => {
  if (typeof value !== 'string') return null;
  const text = value.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

const cleanList = (value) =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => cleanText(item, LIMITS.item)).filter(Boolean))].slice(0, LIMITS.items)
    : [];

const getPath = (object, path) => path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), object);
const setPath = (object, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  const parent = keys.reduce((node, key) => node[key], object);
  parent[last] = value;
};

export const emptyBrief = () => ({
  version: BRIEF_VERSION,
  source: 'bms-ai',
  createdAt: null,
  updatedAt: null,
  business: { name: null, type: null, description: null },
  project: { title: 'Project Brief', type: [], description: null },
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
  visitorEdited: [],
});

/**
 * Normalises an untrusted brief (from the model or the browser) to the known
 * shape. `allowedProjectIds` limits related projects (a Set of IDs).
 * Returns null for non-objects.
 */
export function sanitiseBrief(raw, { allowedProjectIds = new Set(PORTFOLIO_IDS) } = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const brief = emptyBrief();
  brief.business = {
    name: cleanText(raw.business?.name, LIMITS.short),
    type: cleanText(raw.business?.type, LIMITS.short),
    description: cleanText(raw.business?.description),
  };
  brief.project.title = cleanText(raw.project?.title, LIMITS.short) || 'Project Brief';
  brief.project.description = cleanText(raw.project?.description);
  brief.problem = cleanText(raw.problem);
  for (const field of LIST_FIELDS) {
    if (!field.includes('.')) brief[field] = cleanList(raw[field]);
  }
  brief.requirements = { confirmed: cleanList(raw.requirements?.confirmed), potential: cleanList(raw.requirements?.potential) };
  brief.timeline = cleanText(raw.timeline, LIMITS.short);
  brief.budget = cleanText(raw.budget, LIMITS.short);
  brief.assumptions = cleanList(raw.assumptions);

  const seenServices = new Set();
  brief.services = (Array.isArray(raw.services) ? raw.services : [])
    .flatMap((entry) => {
      const service = serviceById(entry?.service);
      if (!service) return [];
      const focusArea = service.focusAreas.some((area) => area.name === entry.focusArea) ? entry.focusArea : null;
      const key = `${service.id}:${focusArea}`;
      if (seenServices.has(key)) return [];
      seenServices.add(key);
      return [{ service: service.id, serviceName: service.name, focusArea, reason: cleanText(entry.reason, LIMITS.item) || '' }];
    })
    .slice(0, LIMITS.services);
  // Project type = the official services / focus areas the brief involves (not ranked).
  brief.project.type = brief.services.map((entry) => entry.focusArea || entry.serviceName);

  const seenProjects = new Set();
  brief.relatedProjects = (Array.isArray(raw.relatedProjects) ? raw.relatedProjects : [])
    .flatMap((entry) => {
      const record = allowedProjectIds.has(entry?.id) ? portfolioRecordById(entry.id) : null;
      if (!record || seenProjects.has(record.id)) return [];
      seenProjects.add(record.id);
      // Title, category and status always come from trusted portfolio data.
      return [{ id: record.id, title: record.title, category: record.category, status: record.status, reason: cleanText(entry.reason, LIMITS.item) || '' }];
    })
    .slice(0, LIMITS.related);

  brief.visitorEdited = Array.isArray(raw.visitorEdited) ? [...new Set(raw.visitorEdited.filter((path) => EDITABLE_FIELDS.includes(path)))] : [];
  const iso = (value) => (typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null);
  brief.createdAt = iso(raw.createdAt);
  brief.updatedAt = iso(raw.updatedAt);
  return brief;
}

// ---------- anti-fabrication

// "₦500k" / "2 million" / "500,000" → comparable numbers.
function numbersIn(text) {
  const out = [];
  const pattern = /(\d[\d,.\s]*\d|\d)\s*(k|thousand|m|mil|million|b|bn|billion)?\b/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const base = Number(match[1].replace(/[,\s]/g, ''));
    if (!Number.isFinite(base)) continue;
    const unit = (match[2] || '').toLowerCase();
    const factor = unit.startsWith('k') || unit === 'thousand' ? 1e3 : unit.startsWith('m') ? 1e6 : unit.startsWith('b') ? 1e9 : 1;
    out.push(base * factor);
  }
  return out;
}

const WORD_STOPLIST = new Set('the and for with by of in to a an is be it this that at on or as its our my'.split(' '));
const wordsIn = (text) => (text.toLowerCase().match(/[a-z]{3,}/g) || []).filter((word) => !WORD_STOPLIST.has(word));

/** True when a value (budget/timeline) is traceable to what the visitor wrote. */
export function isGrounded(value, sourceText) {
  if (!value) return false;
  const source = sourceText.toLowerCase();
  const valueNumbers = numbersIn(value);
  if (valueNumbers.length) {
    const sourceNumbers = new Set(numbersIn(sourceText));
    if (!valueNumbers.every((number) => sourceNumbers.has(number))) return false;
  }
  const words = wordsIn(value);
  if (!words.length) return valueNumbers.length > 0;
  const present = words.filter((word) => source.includes(word)).length;
  return present / words.length >= 0.5;
}

/**
 * Enforces "never invent" rules on a sanitised model brief:
 * - budget / timeline must be grounded in visitor text, else null;
 * - business name must appear in visitor text, else null;
 * - fields the visitor edited keep the visitor's value.
 */
export function groundBrief(brief, { visitorText, previousBrief = null }) {
  const edited = new Set(previousBrief?.visitorEdited || []);
  // Visitor-edited values count as visitor-provided text.
  const editedText = [...edited].map((path) => [].concat(getPath(previousBrief, path) ?? []).join(' ')).join(' ');
  const source = `${visitorText}\n${editedText}`;

  if (brief.budget && !isGrounded(brief.budget, source)) brief.budget = null;
  if (brief.timeline && !isGrounded(brief.timeline, source)) brief.timeline = null;
  if (brief.business.name && !source.toLowerCase().includes(brief.business.name.toLowerCase())) brief.business.name = null;

  for (const path of edited) {
    const value = getPath(previousBrief, path);
    setPath(brief, path, LIST_FIELDS.has(path) ? [...(value || [])] : value ?? null);
  }
  brief.visitorEdited = [...edited];
  return brief;
}

// ---------- readiness + request block

/** At least two kinds of visitor-provided information → enough for a useful brief. */
export function briefReady(discovery) {
  if (!discovery) return false;
  const signals = [
    discovery.businessType || discovery.businessDescription,
    discovery.problem || discovery.currentSituation,
    discovery.desiredOutcome,
    discovery.requestedCapabilities?.length,
    discovery.existingSystem,
  ].filter(Boolean).length;
  return signals >= 2;
}

// Brief-generation rules. Sent only with brief requests (not in the cached
// system prompt), so ordinary chat turns don't pay for them.
export const BRIEF_RULES = `Fill every field only from what the visitor said or from verified BMS data:
- "requirements.confirmed": what the visitor explicitly asked for, in plain wording ("Customers can place orders through the website").
- "requirements.potential": your interpretation of what may also be needed, phrased as something to clarify ("Online payments may be needed — to clarify"). Never present these as confirmed.
- "budget" and "timeline": exactly as the visitor stated them (for example "₦500,000", "Before December"); null if not provided. Never estimate, convert or suggest values.
- "business.name": only if the visitor gave it. "project.title": the visitor's name for the project, otherwise a descriptive working title from their own information (for example "Fashion Business E-commerce Website"), or "Project Brief" if there is too little. Never invent a brand or company name.
- Never add clients, user numbers, revenue, results, integrations, technologies, hosting, payment providers or features the visitor did not mention. Leave fields empty or null instead, and list the open points in "unansweredQuestions" (always include budget and timeline there if not provided).
- "services": the relevant official BMS services (with focus area) and why, based on the visitor's needs; several are fine, not ranked. Capabilities the visitor wants that BMS has not verified must not be presented as BMS capabilities; list them as questions to clarify instead.
- "relatedProjects": only projects from <portfolio_records>, with a short, neutral reason tied to shared characteristics. Never call a project "exactly what you need".
- "assumptions": anything you had to assume; keep it short or empty. "notes": other relevant points the visitor made.
- The visitor's corrections are authoritative: if <current_brief> lists fields in visitor_edited, keep those values exactly, and apply any correction the visitor made in the conversation.
- "message": one or two sentences introducing the brief and inviting the visitor to review and correct it.`;

/** Instruction + current brief appended to the visitor turn in brief mode (treated as data). */
export function briefRequestBlock(previousBrief) {
  const lines = [
    '<brief_request>',
    previousBrief
      ? 'The visitor asked to update their project brief. Update the current brief below with any new information from the conversation, keeping everything still accurate.'
      : 'The visitor asked for a project brief. Generate it from the conversation, the discovery notes and any portfolio records.',
    'Respond with the brief JSON only (the chat fields do not apply to this request).',
    BRIEF_RULES,
    '</brief_request>',
  ];
  if (previousBrief) {
    const { createdAt, updatedAt, version, source, ...content } = previousBrief;
    lines.push(`<current_brief visitor_edited="${previousBrief.visitorEdited.join(',')}">\n${JSON.stringify(content)}\n</current_brief>`);
  }
  return lines.join('\n');
}
