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
| `scripts/bms-ai-scenarios.mjs` | Runs the Phase 2 test conversations against the live AI (`npm run ai:scenarios`). |
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

## Updating what the assistant knows

Edit `src/data/content.js` and redeploy. The knowledge context is rebuilt from it at build time, so nothing is duplicated.

## Guardrails

- The API key exists only in the Netlify environment (`AI_API_KEY`) and is read by the function.
- The prompt restricts the assistant to the knowledge context. It never invents projects, clients, prices, metrics or credentials, says so when information isn't available, and never claims to be Gabriel.
- Structured output (a JSON schema with an enum of action IDs) means the model can only return buttons that exist. The server filters them again.
- Limits: 1,000 characters per visitor message, last 12 messages sent to the model, 24 KB request body, 4,096 output tokens, 22 s provider timeout (1 retry), 30 s client timeout. Rate limit: 30 requests per 10 minutes per IP, per function instance.
- Cross-origin browser requests are rejected.
- Visitor message text is never logged or sent to analytics.

## Cost notes

- Default model: `claude-opus-5` at `effort: "low"`, with the knowledge context prompt-cached, so repeat requests read the system prompt from cache at a fraction of the input price.
- To trade quality for cost, set `AI_MODEL` (for example `claude-sonnet-5` or `claude-haiku-4-5`). The adapter skips options a model doesn't support.
- The in-function rate limiter is per instance. Also set a **monthly spend limit** on the Anthropic Console for a hard ceiling.

## Analytics events

The panel dispatches `bms-ai:event` on `window` with `{ name, props }`:
`ai_opened`, `ai_closed`, `ai_first_message`, `ai_message_sent`, `ai_suggested_prompt_clicked`, `ai_quick_reply_clicked`, `ai_discovery_started`, `ai_project_handoff`, `ai_service_inquiry`, `ai_portfolio_inquiry`, `ai_project_viewed`, `ai_action_clicked`, `ai_start_project_clicked`, `ai_error`.

```js
window.addEventListener('bms-ai:event', (e) => yourAnalytics.track(e.detail.name, e.detail.props));
```

## Extension points (future phases)

- **Phase 2**: implemented (see Business discovery above).
- **Phase 3**: implemented (see Portfolio navigator above). If the portfolio grows large, swap the scoring in `retrievePortfolio()` for embeddings; the rest of the pipeline stays the same.
- **Phase 4** (project brief): generate the brief from the `discovery` object, which already holds the visitor-provided fields.
- **Phase 5** (lead workflow): listen for `bms-ai:handoff`, or read `sessionStorage['bms-ai-handoff']`, and send the structured data to email, CRM or n8n from a new server function.
- **Later: documents and case studies**: the same per-question retrieval pattern can cover uploaded documents or longer case studies.
- **Later: client workspace**: add authenticated functions beside `bms-ai.mjs` that reuse `ai-provider.mjs`.
