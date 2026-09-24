// Contact handoff for BMS AI business discovery.
//
// When a visitor clicks "Start a Project", the useful parts of the
// conversation go with them: the recommended service pre-selects the
// existing contact form, and a plain-text recap (only facts the visitor
// gave) pre-fills its message box for them to review and edit. Nothing is
// submitted automatically.
//
// Phase 5 hook: the full structured discovery object is also published as a
// `bms-ai:handoff` DOM event and kept in sessionStorage under
// HANDOFF_STORAGE_KEY, so a future lead workflow can pick it up without
// changing the chat.
import { MAX_MESSAGE_CHARS } from './chatService';

export const HANDOFF_STORAGE_KEY = 'bms-ai-handoff';

const LINES = [
  ['Business', (d) => [d.businessType, d.businessDescription].filter(Boolean).join(' — ')],
  ['Customers', (d) => d.targetAudience],
  ['Current situation', (d) => d.currentSituation],
  ['Problem', (d) => d.problem],
  ['Goal', (d) => d.desiredOutcome],
  ['Current tools', (d) => d.existingSystem],
  ['Requested', (d) => d.requestedCapabilities?.join('; ')],
  ['Constraints', (d) => d.constraints?.join('; ')],
  [
    'Service areas discussed',
    (d) =>
      d.relevantServices
        ?.map((entry) => (entry.focusArea && entry.focusArea !== entry.serviceName ? `${entry.serviceName} (${entry.focusArea})` : entry.serviceName))
        .join('; '),
  ],
  ['Still to clarify', (d) => d.unansweredQuestions?.join('; ')],
];

/** Returns a contact-form recap, or '' when discovery holds nothing the visitor said. */
export function buildContactMessage(discovery) {
  if (!discovery) return '';
  const lines = LINES.map(([label, pick]) => [label, pick(discovery)]).filter(([, value]) => value);
  if (!lines.some(([label]) => label !== 'Service areas discussed' && label !== 'Still to clarify')) return '';
  const text = ['Project notes from my BMS AI conversation:', ...lines.map(([label, value]) => `${label}: ${value}`)].join('\n');
  // The contact form has no length limit, but keep the recap readable.
  return text.length > MAX_MESSAGE_CHARS * 2 ? `${text.slice(0, MAX_MESSAGE_CHARS * 2 - 1)}…` : text;
}

export function publishHandoff(discovery) {
  if (!discovery) return;
  const detail = { discovery, createdAt: new Date().toISOString() };
  try {
    sessionStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(detail));
  } catch {
    // Storage unavailable — the event below still fires.
  }
  try {
    window.dispatchEvent(new CustomEvent('bms-ai:handoff', { detail }));
  } catch {
    // Never let the handoff hook interfere with navigation.
  }
}
