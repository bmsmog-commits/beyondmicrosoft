# BMS AI — architecture

BMS AI is the website assistant for Beyond Microsoft. It answers questions about BMS, its services, portfolio, founder and process, helps visitors work out which service fits (Phase 2), finds relevant portfolio projects (Phase 3), and hands visitors off to the existing contact form.

## Request flow

```
Floating launcher (main bundle, ~2 KB)
  └─ lazy chunk: chat panel  src/components/BMSAI/BMSAI.jsx
       └─ chatService.js  POST /.netlify/functions/bms-ai   { messages, discovery?, projectContext? }
            └─ netlify/functions/bms-ai.mjs
                 ├─ request-guard.mjs   origin check, size/length limits, history trim, rate limit
                 ├─ discovery.mjs       sanitise discovery notes (in and out)
                 ├─ portfolio-search.mjs  retrieve the portfolio records relevant to this question
                 ├─ bms-prompt.mjs      system prompt + knowledge context + response schema
                 └─ ai-provider.mjs     provider adapter (Anthropic Claude)
            ◄─ { reply, actions: [actionId], projects: [card], quickReplies, discovery, suggestedService }
```

The browser only knows the endpoint and its JSON contract, never the provider or the API key.

## Files

| Path | Role |
| --- | --- |
| `src/data/content.js` | **Single source of truth** (unchanged). All BMS facts come from here. |
| `src/ai/knowledge.js` | Derives the compact knowledge object (brand, founder, services, portfolio, process, contact, not-published list) from `content.js`. |
| `src/ai/services.js` | Service capability catalog (Phase 2): the 4 official services from `content.js` with their capabilities, portfolio categories as focus areas (with real project examples), and related problems/outcomes. The only services the assistant can recommend. |
| `netlify/lib/discovery.mjs` | Discovery schema, stages and sanitiser (Phase 2). Validates discovery data from both the model and the browser. |
| `src/components/BMSAI/handoff.js` | Contact handoff (Phase 2): builds the contact-form pre-fill from what the visitor said and publishes the `bms-ai:handoff` event. |
| `scripts/bms-ai-scenarios.mjs` | Runs the Phase 2–4 test conversations against the live AI (`npm run ai:scenarios`). |
| `netlify/lib/brief.mjs` | Project brief (Phase 4): brief schema, sanitiser, readiness check, anti-fabrication grounding and the brief-only generation rules. |
| `src/components/BMSAI/ProjectBrief.jsx` | Project brief view and editor (Phase 4). Lazy-loaded the first time a brief is shown. |
| `scripts/bms-ai-brief-tests.mjs` | Offline tests for the brief pipeline with the provider stubbed (`npm run ai:brief-tests`). |
| `src/ai/inquiry.js` | Project inquiry rules (Phase 5) shared by the browser and the server: contact methods, consent text, contact validation. |
| `netlify/lib/lead.mjs` | Project inquiry (Phase 5): payload validation, the normalised `project_inquiry_submitted` event, duplicate guard and the delivery boundary. |
| `netlify/functions/bms-lead.mjs` | Project inquiry endpoint (Phase 5). No AI call. |
| `src/components/BMSAI/ProjectInquiry.jsx` | Start a Project inquiry UI (Phase 5): contact details → review + consent → submitted. Lazy-loaded. |
| `scripts/bms-ai-lead-tests.mjs` | Offline tests for the inquiry endpoint (`npm run ai:lead-tests`; `npm test` runs brief + lead tests). |
| `src/ai/portfolio.js` | Portfolio layer (Phase 3): a normalised, read-only view of the public projects in `content.js` (including the AI & Automation Lab and Copywriting entries). Adds no data; `isPublic: false` on a project hides it from the assistant. |
| `netlify/lib/portfolio-search.mjs` | Portfolio retrieval (Phase 3): picks the project records relevant to each question and formats them for the model. Server-only. |
| `src/ai/actions.js` | Registry of action buttons the assistant may return. Each one maps to an existing section ID or portfolio filter, or to a contact link from `footerContacts`. |
| `netlify/lib/bms-prompt.mjs` | System prompt (grounding rules, persona, style) and JSON response schema. Built once and kept byte-stable for prompt caching. |
| `netlify/lib/ai-provider.mjs` | Provider adapter. Add another provider here without touching the function or the UI. |
| `netlify/lib/request-guard.mjs` | Validation, limits and the best-effort rate limiter. |
| `netlify/functions/bms-ai.mjs` | The endpoint. Returns one friendly error message for every failure and logs details server-side. |
| `src/components/BMSAI/BMSAILauncher.jsx` | Floating button, lazy loader and error boundary. |
| `src/components/BMSAI/BMSAI.jsx` | Chat panel UI. |
| `src/components/BMSAI/RichText.jsx` | Safe reply renderer (paragraphs, lists, bold, https/mailto links). No `dangerouslySetInnerHTML`. |
| `src/components/BMSAI/chatService.js` | Fetch wrapper with timeout and typed errors. |
| `src/components/BMSAI/analytics.js` | Analytics hooks (DOM events, no third-party dependency). |

## Business discovery (Phase 2)

When a visitor describes a business problem or project idea, the model switches from Q&A to discovery. It asks one adaptive question at a time (usually 2 to 5 in total), maps the needs to the official services, and can recap before offering **Start a Project**.

- **Structured notes.** Every response carries a `discovery` object: `stage` (internal: none, discovery, requirements, mapping, summary, ready), visitor facts (`businessType`, `businessDescription`, `targetAudience`, `currentSituation`, `problem`, `desiredOutcome`, `existingSystem`, `projectType`, `requestedCapabilities`, `constraints`, `unansweredQuestions`), and `relevantServices` (service id, focus area, role, confidence, reason). Stage names are never shown to visitors.
- **Memory.** The browser sends the latest notes back with the next message. The server sanitises them and appends them to the visitor's turn as `<discovery_notes>`, which the prompt treats as data. Facts survive the 12-message history limit.
- **No invented services.** Service ids and focus areas are schema enums built from `src/ai/services.js`. The server drops unknown services, invalid focus areas, unknown fields and oversized text, whether they come from the model or a tampered client.
- **Handoff.** At the `summary`/`ready` stages the server always includes `start-project`. Clicking it pre-selects the service (only a high-confidence primary service) and pre-fills the contact message with the visitor's own facts, never overwriting what they typed. Nothing is submitted. The structured object is also published as `bms-ai:handoff` and stored in `sessionStorage['bms-ai-handoff']` for Phase 5.

## Portfolio navigator (Phase 3)

The permanent system prompt no longer lists projects; it only has a per-category project count. For each request, the function retrieves the relevant records and attaches them to the visitor's turn as `<portfolio_records>`:

1. **Retrieval** (`netlify/lib/portfolio-search.mjs`). A search vocabulary maps how visitors describe work to the site's categories and project wording ("websites" → Web Development, "apps" → Application Development, "NGO" → humanitarian/foundation, "logos" → Brand/Graphic Design...). Projects are then scored across title, tags, category, description and AI Lab fields, using the visitor's message plus their Phase 2 discovery notes. Named projects ("like Lutapp") match directly.
2. **Modes.** `matches` sends up to 6 relevant records. `overview` (a portfolio question with nothing specific, e.g. "show me your projects", "have you built Facebook?") sends one project per category, so the answer stays concise and honest. `related` (mid business discovery) sends up to 3 clearly related records. `none`: ordinary questions send no records at all.
3. **Interpretation.** The model decides which candidates actually relate, explains overlaps in neutral language, respects each project's status, and returns `projects: [{ id, reason }]`.
4. **Validation.** The function accepts only IDs that were retrieved for this request (max 4) and builds each card from trusted data (title, category, status, verified summary, image). The model's only free text on a card is the "reason".
5. **Navigation.** "View Project" opens the site's existing project modal (the same one as clicking the portfolio card). AI Automation cards also offer the existing AI & Automation Lab section. The IDs shown are sent back as `projectContext` for follow-up questions and validated server-side.

Token effect: the system prompt went from about 7,700 to 6,950 tokens (cached). Ordinary questions add nothing. Portfolio questions add about 200–750 uncached input tokens (2 to 7 records).

## Project brief (Phase 4)

Once the visitor has described their business or situation and what they need, BMS AI can turn the conversation into a structured, editable project brief. It is a discovery summary, not a proposal, quotation or contract, and the view says so.

- **Offer.** Chat responses carry `briefOffer` (`none` | `offer` | `generate`). The server forces `none` unless the discovery notes hold at least two kinds of visitor information (`briefReady()`), so "I want a website" leads to more discovery, not a brief. `offer` shows **Generate Project Brief** / **Continue Discussion**. `generate` (the visitor explicitly asked) starts generation right away. Once a brief exists, the request carries `briefExists` and the model offers **Update Project Brief** when new information comes in.
- **Generation.** The same endpoint with `mode: "brief"`. The request contains the conversation, the Phase 2 discovery notes, the IDs of projects shown in the conversation (Phase 3, validated server-side) and the current brief, if one exists. The brief-only rules (`BRIEF_RULES`) are attached to that turn only, so the cached system prompt stays byte-stable and ordinary turns don't pay for them.
- **Fact vs interpretation.** `requirements.confirmed` holds what the visitor asked for. `requirements.potential` holds the model's interpretation, shown as "to clarify, not confirmed". `unansweredQuestions` lists open points, `assumptions` lists anything assumed. Budget and timeline show "Not provided" when absent.
- **Anti-fabrication.** `sanitiseBrief()` keeps only known fields, types, lengths (strings ≤ 400, items ≤ 200, lists ≤ 10), official services/focus areas and portfolio IDs that were retrieved for this request. Project title, category and status come from trusted data. `groundBrief()` sets budget, timeline and business name to `null` unless they can be traced to the visitor's own words (numbers must match exactly).
- **Editing.** **Edit Brief** opens a labelled form. Edited fields are recorded in `visitorEdited`. On an update the server restores those values whatever the model returns, so visitor corrections stay authoritative.
- **Handoff.** **Start a Project** opens the Phase 5 project inquiry (below).
- **Storage.** The brief lives in `sessionStorage['bms-ai-brief']` (current tab only) and is cleared by **New conversation**.

Brief object (JSON-serialisable, for Phase 5):

```json
{ "version": 1, "source": "bms-ai", "createdAt": "…", "updatedAt": "…",
  "business": { "name": null, "type": null, "description": null },
  "project": { "title": "Project Brief", "type": [], "description": null },
  "problem": null, "objectives": [], "targetAudience": [],
  "requirements": { "confirmed": [], "potential": [] },
  "services": [{ "service": "web-app-development", "serviceName": "…", "focusArea": "Web Development", "reason": "…" }],
  "existingSystems": [], "integrations": [], "preferredTechnology": [], "constraints": [],
  "timeline": null, "budget": null,
  "relatedProjects": [{ "id": "lutapp", "title": "Lutapp", "category": "…", "status": "…", "reason": "…" }],
  "unansweredQuestions": [], "assumptions": [], "notes": [], "visitorEdited": [] }
```

Token effect: the permanent system prompt grew by about 390 tokens (to about 7,350, cached). A brief request adds about 500 uncached tokens of rules plus the current brief. The brief UI is a separate chunk (about 2.6 KB JS and 1 KB CSS gzipped) loaded only when a brief is shown.

## Project inquiry (Phase 5)

```
Project Brief → [Start a Project] → contact details → review (edit, consent) → [Submit Project Inquiry]
  → bms-lead: validation → normalised event → delivery boundary (Netlify Forms today; automation later)
```

- **Explicit only.** The inquiry opens only from the brief's **Start a Project** button and is sent only by **Submit Project Inquiry** after the consent box is ticked. Generating a brief, discovery, service mapping or the chat's own Start a Project action (which still pre-fills the normal contact form) never submit anything. `bms-ai.mjs` has no path to the lead code.
- **Data.** Contact: name and email (required), phone (optional unless phone/WhatsApp is preferred; international formats, 7–15 digits), preferred method (email, phone, WhatsApp; WhatsApp is only a stored preference). Project details are a copy of the brief. The visitor can edit them for the inquiry without changing the brief, and the submitted version is authoritative. No conversation transcript, IP, user agent or device data is sent or stored.
- **Facts vs AI summary.** The review labels each detail *Edited by you*, *AI summary* or *To clarify*, and shows *Not provided* for missing values. The event carries the same in `provenance` (`visitorEdited`, `aiSummary`, `toClarify`). Budget and timeline stay `null` unless the visitor gave them. There are no scores, rankings, confidence labels or qualification judgments anywhere.
- **Consent.** An unticked checkbox with the text in `src/ai/inquiry.js` (project contact only, not marketing; the footer newsletter stays separate). The server requires `consent === true` and stores its own copy of the text with the time.
- **Validation (server).** POST only (405), `application/json` only (415), same origin (403), 40 KB body limit (413), strict top-level and contact keys, types, lengths, email/phone formats, contact method, UUID `submissionId`, and the brief re-validated with Phase 4's `sanitiseBrief()` (known services, real portfolio IDs, trusted titles). 400 responses list only invalid field names.
- **Abuse and duplicates.** Honeypot field (fake success, nothing delivered), 5 submissions per 10 minutes per client, and a 30-minute duplicate guard on `submissionId` and on a hash of the content, with concurrent repeats sharing one delivery. Like the chat rate limiter, these are per function instance, so automation should also dedupe on `submissionId`. The client disables the button, ignores repeat clicks and keeps the same `submissionId` for retries.
- **Failures.** Visitors see only pre-written messages. The form keeps everything on failure. Logs contain the submission ID, services and error category, never names, emails, phone numbers or project text.
- **After success.** The confirmation screen makes no promises about response time, acceptance or pricing. Only a minimal marker (time + preferred method) is kept in `sessionStorage['bms-ai-inquiry-submitted']`, so the brief shows the inquiry as sent. **New conversation** clears it.

### Delivery and future automation

`deliveryTarget()` in `netlify/lib/lead.mjs` picks where the event goes:

| Target | When | What happens |
| --- | --- | --- |
| `netlify-forms` | Deployed sites (default) | The function posts to the site's `project-inquiry` Netlify form (declared in `index.html`): contact fields, a readable `summary`, and the full event JSON in `payload`. Turn on the form's email notification in Netlify (Forms → project-inquiry → Notifications). No credentials needed. |
| `log` | `netlify dev`, tests, or `LEAD_DELIVERY=log` | Validates and logs a receipt without personal data. Nothing is stored. |

To add automation later, add a target to `deliverInquiry()` that sends the unchanged `event` server-side. None of these are active; the variable names are suggestions and must be set only in Netlify, never with a `VITE_` prefix:

| Integration | Idea | Environment variables (future) |
| --- | --- | --- |
| n8n | POST the event to a webhook; dedupe on `submissionId`; fan out from there | `LEAD_WEBHOOK_URL`, `LEAD_WEBHOOK_SECRET` (HMAC signature header) |
| Email notification | Send `inquirySummaryText(event)` to BMS (or keep using Netlify Forms notifications) | `LEAD_NOTIFY_EMAIL`, plus the email provider's key (e.g. `BREVO_API_KEY`) |
| Brevo | Create/update a contact for project follow-up only; the inquiry consent does not cover marketing lists | `BREVO_API_KEY`, `BREVO_PROJECT_LIST_ID` |
| CRM | Create a contact + deal/note from the event | the CRM's key, e.g. `CRM_API_KEY` |
| WhatsApp | Only if the visitor chose WhatsApp, and only for a human follow-up or a template the visitor expects | the WhatsApp Business API token and phone-number ID |

## Updating what the assistant knows

Edit `src/data/content.js` and redeploy. The knowledge context is rebuilt from it at build time, so nothing is duplicated.

## Guardrails

- The API key exists only in the Netlify environment (`AI_API_KEY`) and is read by the function.
- The prompt restricts the assistant to the knowledge context. It never invents projects, clients, prices, metrics or credentials, says so when information isn't available, and never claims to be Gabriel.
- Structured output (a JSON schema with an enum of action IDs) means the model can only return buttons that exist. The server filters them again.
- Limits: 1,000 characters per visitor message, last 12 messages sent to the model, 40 KB request body (room for a brief), 4,096 output tokens, 22 s provider timeout (1 retry), 30 s client timeout. Rate limit: 30 requests per 10 minutes per IP, per function instance.
- Cross-origin browser requests are rejected.
- Visitor message text is never logged or sent to analytics.

## Cost notes

- Default model: `claude-opus-5` at `effort: "low"`, with the knowledge context prompt-cached, so repeat requests read the system prompt from cache at a fraction of the input price.
- To trade quality for cost, set `AI_MODEL` (for example `claude-sonnet-5` or `claude-haiku-4-5`). The adapter skips options a model doesn't support.
- The in-function rate limiter is per instance. Also set a **monthly spend limit** on the Anthropic Console for a hard ceiling.

## Analytics events

The panel dispatches `bms-ai:event` on `window` with `{ name, props }`:
`ai_opened`, `ai_closed`, `ai_first_message`, `ai_message_sent`, `ai_suggested_prompt_clicked`, `ai_quick_reply_clicked`, `ai_discovery_started`, `ai_project_handoff`, `ai_service_inquiry`, `ai_portfolio_inquiry`, `ai_project_viewed`, `ai_brief_offered`, `ai_brief_generated`, `ai_brief_edited`, `ai_brief_error`, `ai_inquiry_started`, `ai_inquiry_submitted`, `ai_inquiry_error`, `ai_action_clicked`, `ai_start_project_clicked`, `ai_error`.

```js
window.addEventListener('bms-ai:event', (e) => yourAnalytics.track(e.detail.name, e.detail.props));
```

## Extension points (future phases)

- **Phase 2**: implemented (see Business discovery above).
- **Phase 3**: implemented (see Portfolio navigator above). If the portfolio grows large, swap the scoring in `retrievePortfolio()` for embeddings; the rest of the pipeline stays the same.
- **Phase 4**: implemented (see Project brief above).
- **Phase 5**: implemented (see Project inquiry above). Next: connect a delivery target for n8n/CRM/email.
- **Later: documents and case studies**: the same per-question retrieval pattern can cover uploaded documents or longer case studies.
- **Later: client workspace**: add authenticated functions beside `bms-ai.mjs` that reuse `ai-provider.mjs`.
