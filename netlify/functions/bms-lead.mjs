// BMS AI Phase 5 — project inquiry endpoint. Served at /.netlify/functions/bms-lead.
//
// Only called when the visitor explicitly submits the "Start a Project"
// inquiry (reviewed details + consent). Validates everything, builds the
// normalised inquiry event and hands it to the delivery boundary in
// ../lib/lead.mjs. No AI call, no scoring, no secrets. Visitors only ever
// see pre-written messages; logs never contain names, emails or phones.
import {
  LIMITS,
  RequestError,
  assertJsonContentType,
  assertSameOrigin,
  createRateLimiter,
  jsonResponse as json,
  readJsonBody,
} from '../lib/request-guard.mjs';
import { buildInquiryEvent, createDuplicateGuard, deliverInquiry, deliveryTarget, duplicateKeys, parseInquiry } from '../lib/lead.mjs';

const SUCCESS = 'Project inquiry received.';
const FAILED = "We couldn't submit your project inquiry right now. Your information is still here. Please try again.";
const INVALID = 'Please check the highlighted details and try again.';
const RATE_LIMITED = "You've sent several inquiries in a short time. Please wait a few minutes, or contact Beyond Microsoft directly.";
const TOO_LARGE = 'Your inquiry is too long to send. Please shorten some of the project details and try again.';

// Submissions are rarer than chat messages: 5 per 10 minutes per client.
const isAllowedRequest = createRateLimiter({ windowMs: LIMITS.rateLimitWindowMs, maxRequests: 5 });
const once = createDuplicateGuard();

const log = (level, event, details = {}) => console[level](JSON.stringify({ source: 'bms-lead', event, ...details }));

export default async function handler(request, context) {
  if (request.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' }, { allow: 'POST' });
  }
  const startedAt = Date.now();
  try {
    assertSameOrigin(request, process.env.AI_ALLOWED_ORIGINS || '');
    assertJsonContentType(request);

    const clientKey = context?.ip || request.headers.get('x-nf-client-connection-ip') || 'unknown';
    if (!isAllowedRequest(clientKey)) {
      log('warn', 'rate_limited');
      return json(429, { error: 'rate_limited', message: RATE_LIMITED }, { 'retry-after': '600' });
    }

    const inquiry = parseInquiry(await readJsonBody(request));
    if (inquiry.honeypot) {
      // Look like success so bots learn nothing; nothing is delivered.
      log('warn', 'honeypot');
      return json(200, { ok: true, message: SUCCESS });
    }

    const event = buildInquiryEvent(inquiry);
    const target = deliveryTarget(process.env, context?.deploy?.context);
    // Post the form back to the deploy that served this request (production,
    // deploy preview or branch deploy), whose HTML declares "project-inquiry".
    // Not context.site.url: that is always the site's main (production) address.
    const { duplicate } = await once(duplicateKeys(event), () =>
      deliverInquiry(event, { target, siteUrl: new URL(request.url).origin }),
    );
    log('info', duplicate ? 'duplicate' : 'delivered', {
      target,
      submissionId: event.submissionId,
      services: event.project.relevantServices.map((entry) => entry.service),
      ms: Date.now() - startedAt,
    });
    return json(200, { ok: true, message: SUCCESS });
  } catch (error) {
    if (error instanceof RequestError) {
      log('warn', 'rejected', { code: error.code, fields: error.fields });
      if (error.code === 'invalid_inquiry') return json(400, { error: error.code, message: INVALID, fields: error.fields });
      if (error.code === 'too_large') return json(413, { error: error.code, message: TOO_LARGE });
      return json(error.status, { error: error.code, message: FAILED });
    }
    log('error', 'delivery_failed', { detail: error?.message, ms: Date.now() - startedAt });
    return json(502, { error: 'unavailable', message: FAILED });
  }
}
