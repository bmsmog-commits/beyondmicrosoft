// Phase 2 — structured project-discovery data for BMS AI.
//
// The model returns a `discovery` object with every reply; the browser keeps
// the latest one and sends it back with the next request so facts survive
// history trimming. Both directions go through `sanitiseDiscovery`, so the
// only service IDs / focus areas that can ever appear are the ones in
// src/ai/services.js, whatever the model or a tampered client sends.
import { FOCUS_AREAS, SERVICE_IDS, serviceById } from '../../src/ai/services.js';

// Internal conversation state — never shown to visitors.
export const DISCOVERY_STAGES = Object.freeze([
  'none', // normal assistant Q&A
  'discovery', // visitor described a need; understanding the situation
  'requirements', // gathering the details that decide the service
  'mapping', // relevant BMS services identified
  'summary', // recap of what the visitor said
  'ready', // ready to start a project
]);

const TEXT_FIELDS = [
  'businessType',
  'businessDescription',
  'targetAudience',
  'currentSituation',
  'problem',
  'desiredOutcome',
  'existingSystem',
];
const LIST_FIELDS = ['requestedCapabilities', 'constraints', 'unansweredQuestions'];
const PROJECT_TYPES = ['new', 'improvement', 'unknown'];

const MAX_TEXT = 300;
const MAX_LIST_ITEMS = 8;
const MAX_LIST_TEXT = 160;
const MAX_SERVICES = 4;
export const MAX_QUICK_REPLIES = 6;
const MAX_QUICK_REPLY_TEXT = 60;

const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const stringList = { type: 'array', items: { type: 'string' } };

export const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    stage: { type: 'string', enum: [...DISCOVERY_STAGES] },
    ...Object.fromEntries(TEXT_FIELDS.map((field) => [field, nullableString])),
    projectType: { type: 'string', enum: PROJECT_TYPES },
    ...Object.fromEntries(LIST_FIELDS.map((field) => [field, stringList])),
    relevantServices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          service: { type: 'string', enum: [...SERVICE_IDS] },
          focusArea: { anyOf: [{ type: 'string', enum: [...FOCUS_AREAS] }, { type: 'null' }] },
          role: { type: 'string', enum: ['primary', 'supporting'] },
          confidence: { type: 'string', enum: ['high', 'low'] },
          reason: { type: 'string' },
        },
        required: ['service', 'focusArea', 'role', 'confidence', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['stage', ...TEXT_FIELDS, 'projectType', ...LIST_FIELDS, 'relevantServices'],
  additionalProperties: false,
};

const cleanText = (value, max) => {
  if (typeof value !== 'string') return null;
  const text = value.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

const cleanList = (value, maxItems = MAX_LIST_ITEMS, maxText = MAX_LIST_TEXT) =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => cleanText(item, maxText)).filter(Boolean))].slice(0, maxItems)
    : [];

export const emptyDiscovery = () => ({
  stage: 'none',
  ...Object.fromEntries(TEXT_FIELDS.map((field) => [field, null])),
  projectType: 'unknown',
  ...Object.fromEntries(LIST_FIELDS.map((field) => [field, []])),
  relevantServices: [],
});

/** Normalises untrusted discovery data to the known shape. Returns null for non-objects. */
export function sanitiseDiscovery(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const discovery = emptyDiscovery();
  if (DISCOVERY_STAGES.includes(raw.stage)) discovery.stage = raw.stage;
  TEXT_FIELDS.forEach((field) => {
    discovery[field] = cleanText(raw[field], MAX_TEXT);
  });
  if (PROJECT_TYPES.includes(raw.projectType)) discovery.projectType = raw.projectType;
  LIST_FIELDS.forEach((field) => {
    discovery[field] = cleanList(raw[field]);
  });

  const seen = new Set();
  discovery.relevantServices = (Array.isArray(raw.relevantServices) ? raw.relevantServices : [])
    .flatMap((entry) => {
      const service = serviceById(entry?.service);
      if (!service) return [];
      // A focus area must belong to its service; otherwise drop the focus, keep the service.
      const focusArea = service.focusAreas.some((area) => area.name === entry.focusArea) ? entry.focusArea : null;
      const key = `${service.id}:${focusArea}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [
        {
          service: service.id,
          serviceName: service.name,
          focusArea,
          role: entry.role === 'primary' ? 'primary' : 'supporting',
          // Internal-only model judgment; null when absent (e.g. notes echoed back by the browser).
          confidence: entry.confidence === 'high' || entry.confidence === 'low' ? entry.confidence : null,
          reason: cleanText(entry.reason, MAX_TEXT) || '',
        },
      ];
    })
    .slice(0, MAX_SERVICES);

  return discovery;
}

export function sanitiseQuickReplies(raw) {
  return cleanList(raw, MAX_QUICK_REPLIES, MAX_QUICK_REPLY_TEXT);
}

/** True when the discovery notes hold anything worth sending back to the model. */
export function hasDiscoveryContent(discovery) {
  return Boolean(
    discovery &&
      (discovery.stage !== 'none' ||
        TEXT_FIELDS.some((field) => discovery[field]) ||
        LIST_FIELDS.some((field) => discovery[field].length) ||
        discovery.relevantServices.length),
  );
}

/**
 * Discovery data as sent to the browser. The model's confidence label is an
 * unverifiable judgment, so it never leaves the server (not in the chat UI,
 * the handoff event or sessionStorage); it is used only for primaryServiceName().
 */
export function toClientDiscovery(discovery) {
  if (!discovery) return null;
  return {
    ...discovery,
    relevantServices: discovery.relevantServices.map(({ confidence: _internal, ...entry }) => entry),
  };
}

/** The service name used to pre-select the contact form: the first high-confidence primary service. */
export function primaryServiceName(discovery) {
  const primary =
    discovery?.relevantServices.find((entry) => entry.role === 'primary' && entry.confidence === 'high') || null;
  return primary ? primary.serviceName : null;
}

/**
 * Discovery notes appended to the latest visitor turn. Labelled as the
 * assistant's own earlier notes and treated by the system prompt as data.
 */
export function discoveryNotesBlock(discovery) {
  const notes = {
    ...discovery,
    relevantServices: discovery.relevantServices.map(({ service, focusArea, role, confidence, reason }) => ({
      service,
      focusArea,
      role,
      ...(confidence ? { confidence } : {}),
      reason,
    })),
  };
  return `<discovery_notes>\n${JSON.stringify(notes)}\n</discovery_notes>`;
}
