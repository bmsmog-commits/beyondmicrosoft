// BMS AI — Netlify Function. Served at /.netlify/functions/bms-ai.
//
// Browser → this function → AI provider. The API key lives only in the
// Netlify environment (AI_API_KEY) and never reaches the client. Every
// failure returns the same friendly message; details are logged here only.
import { createProvider } from '../lib/ai-provider.mjs';
import { RESPONSE_SCHEMA, SYSTEM_PROMPT } from '../lib/bms-prompt.mjs';
import {
  LIMITS,
  RequestError,
  assertSameOrigin,
  createRateLimiter,
  jsonResponse,
  normaliseMessages,
  readJsonBody,
} from '../lib/request-guard.mjs';
import {
  discoveryNotesBlock,
  hasDiscoveryContent,
  primaryServiceName,
  sanitiseDiscovery,
  sanitiseQuickReplies,
  toClientDiscovery,
} from '../lib/discovery.mjs';
import { MAX_PROJECT_RESULTS, portfolioRecordsBlock, retrievePortfolio } from '../lib/portfolio-search.mjs';
import { BRIEF_RESPONSE_SCHEMA, briefReady, briefRequestBlock, groundBrief, sanitiseBrief } from '../lib/brief.mjs';
import { AI_ACTION_IDS, AI_MAX_ACTIONS } from '../../src/ai/actions.js';
import { cardSummary, portfolioRecordById } from '../../src/ai/portfolio.js';

const FRIENDLY_ERROR =
  "I'm having trouble connecting right now. Please try again or contact Beyond Microsoft directly.";
const RATE_LIMITED =
  "You've sent a lot of messages in a short time. Please wait a few minutes, or contact Beyond Microsoft directly.";
const BRIEF_ERROR = "I couldn't generate the brief right now. We can continue the conversation and try again.";
const BRIEF_NEEDS_MORE =
  "I need a little more information before I can prepare a useful project brief. Could you tell me about your business and what you'd like to build or improve?";
const REFUSAL_REPLY =
  "I can't help with that one, but I'm happy to answer questions about Beyond Microsoft's services, portfolio or how to start a project.";

const MAX_OUTPUT_TOKENS = 4096;

const isAllowedRequest = createRateLimiter({
  windowMs: LIMITS.rateLimitWindowMs,
  maxRequests: LIMITS.rateLimitMaxRequests,
});

const json = jsonResponse;

const log = (level, event, details = {}) => console[level](JSON.stringify({ source: 'bms-ai', event, ...details }));

// Discovery stages at which the visitor should always be offered the contact handoff.
const HANDOFF_STAGES = new Set(['summary', 'ready']);

/**
 * Project cards for the chat, built from trusted portfolio data. Only IDs that
 * were retrieved for this request are accepted, so the model cannot surface a
 * project that wasn't in its <portfolio_records>. Its only free text is "reason".
 */
function projectCards(rawProjects, allowedIds) {
  if (!Array.isArray(rawProjects)) return [];
  const seen = new Set();
  return rawProjects
    .flatMap((entry) => {
      const record = allowedIds.has(entry?.id) ? portfolioRecordById(entry.id) : null;
      if (!record || seen.has(record.id)) return [];
      seen.add(record.id);
      const reason = typeof entry.reason === 'string' ? entry.reason.replace(/\s+/g, ' ').trim().slice(0, 220) : '';
      return [
        {
          id: record.id,
          title: record.title,
          category: record.category,
          status: record.status,
          summary: cardSummary(record),
          // Only site-relative public asset paths are passed through.
          image: record.image && record.image.startsWith('/assets/') ? record.image : null,
          reason,
          labCaseStudy: record.caseStudySection === 'ai-lab',
        },
      ];
    })
    .slice(0, MAX_PROJECT_RESULTS);
}

/** Validates the IDs of projects the browser showed last turn (for follow-up questions). */
function projectContextIds(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id) => portfolioRecordById(id)))].slice(0, MAX_PROJECT_RESULTS);
}

/** Keeps only known action IDs, services, projects and discovery fields, whatever the model returned. */
function sanitiseModelOutput(data, previousDiscovery, allowedProjectIds) {
  const reply = typeof data?.reply === 'string' ? data.reply.trim() : '';
  if (!reply) return null;
  const discovery = sanitiseDiscovery(data.discovery) || previousDiscovery;
  let actions = Array.isArray(data.actions) ? [...new Set(data.actions.filter((id) => AI_ACTION_IDS.includes(id)))] : [];
  if (discovery && HANDOFF_STAGES.has(discovery.stage) && !actions.includes('start-project')) {
    actions = ['start-project', ...actions];
  }
  return {
    reply: reply.slice(0, 4_000),
    actions: actions.slice(0, AI_MAX_ACTIONS),
    projects: projectCards(data.projects, allowedProjectIds),
    quickReplies: sanitiseQuickReplies(data.quickReplies),
    // Phase 4: a brief is only offered/generated once the visitor has given enough information.
    briefOffer: ['offer', 'generate'].includes(data.briefOffer) && briefReady(discovery) ? data.briefOffer : 'none',
    discovery: toClientDiscovery(discovery),
    // Contact-form pre-selection comes from the validated catalog and the
    // internal confidence judgment, which itself is not sent to the browser.
    suggestedService: primaryServiceName(discovery),
  };
}

/**
 * Appends server-built context to the latest visitor turn: the (sanitised)
 * discovery notes, so they survive history trimming, and the portfolio records
 * retrieved for this question. The cached system prompt stays unchanged.
 */
function withTurnContext(messages, discovery, retrieval, briefExists = false) {
  const blocks = [];
  if (briefExists) blocks.push('<brief_status>A project brief has already been generated in this conversation.</brief_status>');
  if (hasDiscoveryContent(discovery)) blocks.push(discoveryNotesBlock(discovery));
  if (retrieval.records.length) blocks.push(portfolioRecordsBlock(retrieval));
  if (!blocks.length) return messages;
  const last = messages[messages.length - 1];
  return [
    ...messages.slice(0, -1),
    { role: 'user', content: [{ type: 'text', text: last.content }, ...blocks.map((text) => ({ type: 'text', text }))] },
  ];
}

/**
 * Phase 4 — brief mode: turns the conversation, the discovery notes and any
 * related portfolio records into a validated project brief. Nothing is sent
 * or stored anywhere; the brief is returned to the visitor only.
 */
async function handleBrief(body, startedAt) {
  const messages = normaliseMessages(body, { allowAssistantLast: true });
  const discovery = toClientDiscovery(sanitiseDiscovery(body?.discovery));
  const previousBrief = sanitiseBrief(body?.brief);
  if (!briefReady(discovery) && !previousBrief) {
    return json(200, { mode: 'brief', brief: null, insufficient: true, message: BRIEF_NEEDS_MORE });
  }

  // Related projects may only come from projects shown in this conversation
  // (validated IDs), the current brief, or discovery-based retrieval.
  const contextIds = [
    ...projectContextIds(body?.projectContext),
    ...(previousBrief?.relatedProjects || []).map((project) => project.id),
  ];
  const retrieval = retrievePortfolio({ message: '', discovery, contextIds: [...new Set(contextIds)] });
  const allowedProjectIds = new Set(retrieval.records.map((record) => record.id));

  const blocks = [briefRequestBlock(previousBrief)];
  if (hasDiscoveryContent(discovery)) blocks.push(discoveryNotesBlock(discovery));
  if (retrieval.records.length) blocks.push(portfolioRecordsBlock(retrieval));
  const last = messages[messages.length - 1];
  const turnMessages =
    last.role === 'user'
      ? [...messages.slice(0, -1), { role: 'user', content: [{ type: 'text', text: last.content }, ...blocks.map((text) => ({ type: 'text', text }))] }]
      : [...messages, { role: 'user', content: blocks.map((text) => ({ type: 'text', text })) }];

  try {
    const provider = createProvider(process.env);
    const result = await provider.generate({
      system: SYSTEM_PROMPT,
      messages: turnMessages,
      schema: BRIEF_RESPONSE_SCHEMA,
      maxTokens: MAX_OUTPUT_TOKENS,
    });
    const brief = result.refused ? null : sanitiseBrief(result.data?.brief, { allowedProjectIds });
    log('info', 'brief', { ms: Date.now() - startedAt, refused: result.refused, ok: Boolean(brief), records: retrieval.records.length, usage: result.usage });
    if (!brief) return json(502, { error: 'unavailable', message: BRIEF_ERROR });

    // Budget, timeline and business name must be traceable to the visitor's own words.
    const visitorText = [
      ...messages.filter((message) => message.role === 'user').map((message) => message.content),
      previousBrief?.budget,
      previousBrief?.timeline,
      previousBrief?.business?.name,
    ]
      .filter(Boolean)
      .join('\n');
    groundBrief(brief, { visitorText, previousBrief });
    const now = new Date().toISOString();
    brief.createdAt = previousBrief?.createdAt || now;
    brief.updatedAt = now;
    const message =
      typeof result.data?.message === 'string' && result.data.message.trim()
        ? result.data.message.trim().slice(0, 600)
        : "Here's a project brief based on what you've told me. Please review it and correct anything that isn't right.";
    return json(200, { mode: 'brief', message, brief });
  } catch (error) {
    log('error', 'brief_failed', { kind: error?.kind || 'unknown', status: error?.status, detail: error?.message, ms: Date.now() - startedAt });
    return json(error?.kind === 'rate_limit' ? 503 : 502, { error: 'unavailable', message: BRIEF_ERROR });
  }
}

export default async function handler(request, context) {
  if (request.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' }, { allow: 'POST' });
  }

  const startedAt = Date.now();
  try {
    assertSameOrigin(request, process.env.AI_ALLOWED_ORIGINS || '');

    const clientKey = context?.ip || request.headers.get('x-nf-client-connection-ip') || 'unknown';
    if (!isAllowedRequest(clientKey)) {
      log('warn', 'rate_limited');
      return json(429, { error: 'rate_limited', message: RATE_LIMITED }, { 'retry-after': '300' });
    }

    const body = await readJsonBody(request);
    if (body?.mode === 'brief') return await handleBrief(body, startedAt);
    const messages = normaliseMessages(body);
    // Untrusted: comes back from the browser. Sanitised to known fields/services before use;
    // any confidence label is dropped because the real client never holds one.
    const previousDiscovery = toClientDiscovery(sanitiseDiscovery(body?.discovery));
    // Phase 3: portfolio records relevant to this question (server-side data only).
    const retrieval = retrievePortfolio({
      message: messages[messages.length - 1].content,
      discovery: previousDiscovery,
      contextIds: projectContextIds(body?.projectContext),
    });
    const allowedProjectIds = new Set(retrieval.records.map((record) => record.id));

    const provider = createProvider(process.env);
    const result = await provider.generate({
      system: SYSTEM_PROMPT,
      messages: withTurnContext(messages, previousDiscovery, retrieval, body?.briefExists === true),
      schema: RESPONSE_SCHEMA,
      maxTokens: MAX_OUTPUT_TOKENS,
    });

    log('info', 'completed', {
      ms: Date.now() - startedAt,
      turns: messages.length,
      refused: result.refused,
      stage: result.data?.discovery?.stage,
      portfolio: retrieval.mode,
      records: retrieval.records.length,
      usage: result.usage,
    });

    if (result.refused) {
      return json(200, {
        reply: REFUSAL_REPLY,
        actions: ['view-services'],
        projects: [],
        quickReplies: [],
        briefOffer: 'none',
        discovery: toClientDiscovery(previousDiscovery),
        suggestedService: null,
      });
    }

    const output = sanitiseModelOutput(result.data, previousDiscovery, allowedProjectIds);
    if (!output) {
      log('error', 'empty_output', { ms: Date.now() - startedAt });
      return json(502, { error: 'unavailable', message: FRIENDLY_ERROR });
    }
    return json(200, output);
  } catch (error) {
    if (error instanceof RequestError) {
      log('warn', 'rejected', { code: error.code });
      const message =
        error.code === 'message_too_long'
          ? `Please keep messages under ${LIMITS.maxUserMessageChars} characters.`
          : FRIENDLY_ERROR;
      return json(error.status, { error: error.code, message });
    }
    // Provider/config errors: log the category (never the key or visitor text).
    log('error', 'provider_failed', {
      kind: error?.kind || 'unknown',
      status: error?.status,
      detail: error?.message,
      ms: Date.now() - startedAt,
    });
    const status = error?.kind === 'rate_limit' ? 503 : 502;
    return json(status, { error: 'unavailable', message: FRIENDLY_ERROR });
  }
}
