// The only place the browser talks to the AI backend. It knows nothing about
// the AI provider — just the BMS AI endpoint and its JSON contract:
//   request  { messages: [{ role: 'user' | 'assistant', content }], discovery?, projectContext? }
//   response { reply, actions: string[], projects: object[], quickReplies: string[],
//              discovery: object | null, suggestedService: string | null }
// `discovery` is the assistant's latest structured project notes (Phase 2),
// echoed back so they survive history trimming; the server re-validates it.
// `projectContext` holds the IDs of projects shown in the previous reply (Phase 3),
// so follow-ups like "tell me more about that one" work; the server validates them.
// Phase 4: `requestProjectBrief()` calls the same endpoint in brief mode:
//   request  { mode: 'brief', messages, discovery?, projectContext?, brief? }
//   response { mode: 'brief', message, brief | null, insufficient? }
// Phase 5: `submitProjectInquiry()` posts the visitor's reviewed inquiry to the
// separate lead endpoint (no AI involved):
//   request  { submissionId, contact, brief, consent: true, website: '' }
//   response { ok: true, message } | { error, message, fields? }
export const AI_ENDPOINT = '/.netlify/functions/bms-ai';
export const LEAD_ENDPOINT = '/.netlify/functions/bms-lead';

export const MAX_MESSAGE_CHARS = 1000;
// Mirrors the server's history limit so we never send more than it will use.
export const MAX_HISTORY_MESSAGES = 12;

const REQUEST_TIMEOUT_MS = 30_000;

export const FRIENDLY_ERROR =
  "I'm having trouble connecting right now. Please try again or contact Beyond Microsoft directly.";

// Shown instead when the failure happens mid business-discovery.
export const DISCOVERY_ERROR =
  "I'm having trouble processing that right now. You can still contact Beyond Microsoft directly to discuss your project.";

export const BRIEF_ERROR = "I couldn't generate the brief right now. We can continue the conversation and try again.";

export const INQUIRY_ERROR = "We couldn't submit your project inquiry right now. Your information is still here. Please try again.";

export class ChatServiceError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'ChatServiceError';
    this.kind = kind; // network | timeout | rate_limited | invalid | server | aborted
  }
}

/**
 * Trims the conversation to the most recent turns, starting on a user message.
 * Consecutive assistant turns (e.g. a reply followed by a generated brief)
 * are merged so the history keeps strict user/assistant alternation.
 */
export function toRequestHistory(messages) {
  const merged = [];
  messages
    .filter((message) => (message.role === 'user' || message.role === 'assistant') && message.content)
    .forEach((message) => {
      const content = message.kind === 'brief' ? `${message.content}\n(A project brief was shown to the visitor.)` : message.content;
      const previous = merged[merged.length - 1];
      if (previous && previous.role === 'assistant' && message.role === 'assistant') previous.content += `\n\n${content}`;
      else merged.push({ role: message.role, content });
    });
  let history = merged.slice(-MAX_HISTORY_MESSAGES);
  while (history.length && history[0].role !== 'user') history = history.slice(1);
  return history;
}

/** POSTs JSON to a BMS endpoint with a timeout; returns { response, data } or throws ChatServiceError. */
async function postJson(payload, { signal, errorMessage, endpoint = AI_ENDPOINT }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort('aborted');
  signal?.addEventListener('abort', onExternalAbort);
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch {
    const reason = controller.signal.reason;
    throw new ChatServiceError(reason === 'timeout' ? 'timeout' : reason === 'aborted' ? 'aborted' : 'network', errorMessage);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON (e.g. the SPA fallback page when the function isn't deployed).
  }
  return { response, data };
}

/** Phase 4: asks the server to generate (or update) the project brief. */
export async function requestProjectBrief(messages, { signal, discovery = null, projectContext = [], brief = null } = {}) {
  const { response, data } = await postJson(
    {
      mode: 'brief',
      messages: toRequestHistory(messages),
      ...(discovery ? { discovery } : {}),
      ...(projectContext.length ? { projectContext } : {}),
      ...(brief ? { brief } : {}),
    },
    { signal, errorMessage: BRIEF_ERROR },
  );
  if (!response.ok || !data || data.mode !== 'brief' || (!data.brief && !data.insufficient)) {
    const kind = response.status === 429 ? 'rate_limited' : 'server';
    throw new ChatServiceError(kind, kind === 'rate_limited' && typeof data?.message === 'string' ? data.message : BRIEF_ERROR);
  }
  return { brief: data.brief || null, insufficient: Boolean(data.insufficient), message: typeof data.message === 'string' ? data.message : '' };
}

export async function sendChatMessage(messages, { signal, discovery = null, projectContext = [], briefExists = false } = {}) {
  const { response, data } = await postJson(
    {
      messages: toRequestHistory(messages),
      ...(discovery ? { discovery } : {}),
      ...(projectContext.length ? { projectContext } : {}),
      ...(briefExists ? { briefExists: true } : {}),
    },
    { signal, errorMessage: FRIENDLY_ERROR },
  );

  if (!response.ok || !data || typeof data.reply !== 'string') {
    const kind = response.status === 429 ? 'rate_limited' : response.status === 400 || response.status === 413 ? 'invalid' : 'server';
    // The server only ever returns pre-written, visitor-safe messages.
    const message = typeof data?.message === 'string' && kind !== 'server' ? data.message : FRIENDLY_ERROR;
    throw new ChatServiceError(kind, message);
  }

  return {
    reply: data.reply,
    actions: Array.isArray(data.actions) ? data.actions : [],
    suggestedService: typeof data.suggestedService === 'string' ? data.suggestedService : null,
    projects: Array.isArray(data.projects) ? data.projects.filter((item) => item && typeof item.id === 'string') : [],
    briefOffer: data.briefOffer === 'offer' || data.briefOffer === 'generate' ? data.briefOffer : 'none',
    quickReplies: Array.isArray(data.quickReplies) ? data.quickReplies.filter((item) => typeof item === 'string') : [],
    discovery: data.discovery && typeof data.discovery === 'object' ? data.discovery : null,
  };
}

/**
 * Phase 5: submits the visitor's project inquiry. Throws ChatServiceError with
 * a visitor-safe message; `fields` lists fields the server rejected.
 */
export async function submitProjectInquiry(payload, { signal } = {}) {
  const { response, data } = await postJson(payload, { signal, errorMessage: INQUIRY_ERROR, endpoint: LEAD_ENDPOINT });
  if (response.ok && data?.ok === true) return { message: typeof data.message === 'string' ? data.message : '' };
  const kind = response.status === 429 ? 'rate_limited' : response.status === 400 || response.status === 413 ? 'invalid' : 'server';
  const error = new ChatServiceError(kind, kind !== 'server' && typeof data?.message === 'string' ? data.message : INQUIRY_ERROR);
  error.fields = Array.isArray(data?.fields) ? data.fields.filter((field) => typeof field === 'string') : [];
  throw error;
}
