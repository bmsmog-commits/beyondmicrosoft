// Request validation and basic abuse protection for the BMS AI endpoints
// (bms-ai chat/brief and, from Phase 5, bms-lead project inquiries).

export const LIMITS = Object.freeze({
  // Room for 12 messages at their limits plus a project brief (Phase 4).
  maxBodyBytes: 40_000,
  maxUserMessageChars: 1_000,
  maxAssistantMessageChars: 2_000,
  // Messages sent to the model per request (≈ the last 6 exchanges).
  maxHistoryMessages: 12,
  // Hard ceiling on what the client may send before trimming.
  maxIncomingMessages: 40,
  rateLimitWindowMs: 10 * 60 * 1000,
  rateLimitMaxRequests: 30,
});

export class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Rejects cross-site browser requests. Browsers always send `Origin` on a
 * POST fetch; it must match the host serving the function (production,
 * deploy previews and `netlify dev` all satisfy this automatically).
 */
export function assertSameOrigin(request, extraAllowedOrigins = '') {
  const origin = request.headers.get('origin');
  if (!origin) return;
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new RequestError(403, 'forbidden', 'Invalid origin');
  }
  const allowedHosts = new Set(
    [
      request.headers.get('x-forwarded-host'),
      request.headers.get('host'),
      new URL(request.url).host,
      ...extraAllowedOrigins.split(',').map((entry) => {
        try {
          return new URL(entry.trim()).host;
        } catch {
          return null;
        }
      }),
    ].filter(Boolean),
  );
  if (!allowedHosts.has(originHost)) {
    throw new RequestError(403, 'forbidden', 'Cross-origin requests are not allowed');
  }
}

/** JSON response with the no-store / nosniff / noindex headers every BMS endpoint uses. */
export const jsonResponse = (status, body, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-robots-tag': 'noindex',
      ...extraHeaders,
    },
  });

/** Rejects bodies that are not declared as JSON (e.g. form posts from other sites). */
export function assertJsonContentType(request) {
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') {
    throw new RequestError(415, 'unsupported_media_type', 'Content-Type must be application/json');
  }
}

export async function readJsonBody(request) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > LIMITS.maxBodyBytes) {
    throw new RequestError(413, 'too_large', 'Request body too large');
  }
  const raw = await request.text();
  if (raw.length > LIMITS.maxBodyBytes) {
    throw new RequestError(413, 'too_large', 'Request body too large');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new RequestError(400, 'invalid_json', 'Body must be valid JSON');
  }
}

/**
 * Validates and normalises the conversation: string content only, known
 * roles, strict user/assistant alternation, ending on a user turn, trimmed
 * to the history limit. Returns messages ready for the provider.
 * `allowAssistantLast` (brief mode) accepts a conversation ending on an
 * assistant turn; the caller then appends its own user turn.
 */
export function normaliseMessages(body, { allowAssistantLast = false } = {}) {
  const incoming = body?.messages;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    throw new RequestError(400, 'invalid_messages', 'messages must be a non-empty array');
  }
  if (incoming.length > LIMITS.maxIncomingMessages) {
    throw new RequestError(400, 'invalid_messages', 'Too many messages');
  }

  const cleaned = incoming.map((message, index) => {
    if (!message || typeof message !== 'object' || typeof message.content !== 'string') {
      throw new RequestError(400, 'invalid_messages', `Message ${index} is malformed`);
    }
    if (message.role !== 'user' && message.role !== 'assistant') {
      throw new RequestError(400, 'invalid_messages', `Message ${index} has an invalid role`);
    }
    // Strip control characters other than tab/newline.
    const content = message.content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    if (!content) {
      throw new RequestError(400, 'invalid_messages', `Message ${index} is empty`);
    }
    if (message.role === 'user' && content.length > LIMITS.maxUserMessageChars) {
      throw new RequestError(400, 'message_too_long', `Messages are limited to ${LIMITS.maxUserMessageChars} characters`);
    }
    return {
      role: message.role,
      content: message.role === 'assistant' ? content.slice(0, LIMITS.maxAssistantMessageChars) : content,
    };
  });

  let messages = cleaned.slice(-LIMITS.maxHistoryMessages);
  while (messages.length && messages[0].role !== 'user') messages = messages.slice(1);

  for (let i = 0; i < messages.length; i += 1) {
    const expected = i % 2 === 0 ? 'user' : 'assistant';
    if (messages[i].role !== expected) {
      throw new RequestError(400, 'invalid_messages', 'Messages must alternate between user and assistant');
    }
  }
  if (!messages.length || (messages[messages.length - 1].role !== 'user' && !allowAssistantLast)) {
    throw new RequestError(400, 'invalid_messages', 'The last message must come from the user');
  }
  return messages;
}

/**
 * Best-effort, per-instance sliding-window rate limiter. Serverless instances
 * don't share memory, so this caps bursts from a single client rather than
 * enforcing a global quota — pair it with a provider-side spend limit.
 */
export function createRateLimiter({ windowMs, maxRequests }) {
  const hits = new Map();
  return function check(key) {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
    if (recent.length >= maxRequests) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5_000) {
      // Evict the oldest entries so memory stays bounded on a warm instance.
      for (const staleKey of [...hits.keys()].slice(0, 1_000)) hits.delete(staleKey);
    }
    return true;
  };
}
