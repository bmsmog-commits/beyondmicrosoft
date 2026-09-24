// The only place the browser talks to the AI backend. It knows nothing about
// the AI provider — just the BMS AI endpoint and its JSON contract:
//   request  { messages: [{ role: 'user' | 'assistant', content }], discovery?, projectContext? }
//   response { reply, actions: string[], projects: object[], quickReplies: string[],
//              discovery: object | null, suggestedService: string | null }
// `discovery` is the assistant's latest structured project notes (Phase 2),
// echoed back so they survive history trimming; the server re-validates it.
// `projectContext` holds the IDs of projects shown in the previous reply (Phase 3),
// so follow-ups like "tell me more about that one" work; the server validates them.
export const AI_ENDPOINT = '/.netlify/functions/bms-ai';

export const MAX_MESSAGE_CHARS = 1000;
// Mirrors the server's history limit so we never send more than it will use.
export const MAX_HISTORY_MESSAGES = 12;

const REQUEST_TIMEOUT_MS = 30_000;

export const FRIENDLY_ERROR =
  "I'm having trouble connecting right now. Please try again or contact Beyond Microsoft directly.";

// Shown instead when the failure happens mid business-discovery.
export const DISCOVERY_ERROR =
  "I'm having trouble processing that right now. You can still contact Beyond Microsoft directly to discuss your project.";

export class ChatServiceError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'ChatServiceError';
    this.kind = kind; // network | timeout | rate_limited | invalid | server | aborted
  }
}

/** Trims the conversation to the most recent turns, starting on a user message. */
export function toRequestHistory(messages) {
  let history = messages
    .filter((message) => (message.role === 'user' || message.role === 'assistant') && message.content)
    .map(({ role, content }) => ({ role, content }))
    .slice(-MAX_HISTORY_MESSAGES);
  while (history.length && history[0].role !== 'user') history = history.slice(1);
  return history;
}

export async function sendChatMessage(messages, { signal, discovery = null, projectContext = [] } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort('aborted');
  signal?.addEventListener('abort', onExternalAbort);

  let response;
  try {
    response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: toRequestHistory(messages),
        ...(discovery ? { discovery } : {}),
        ...(projectContext.length ? { projectContext } : {}),
      }),
      signal: controller.signal,
    });
  } catch {
    const reason = controller.signal.reason;
    throw new ChatServiceError(reason === 'timeout' ? 'timeout' : reason === 'aborted' ? 'aborted' : 'network', FRIENDLY_ERROR);
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
    quickReplies: Array.isArray(data.quickReplies) ? data.quickReplies.filter((item) => typeof item === 'string') : [],
    discovery: data.discovery && typeof data.discovery === 'object' ? data.discovery : null,
  };
}
