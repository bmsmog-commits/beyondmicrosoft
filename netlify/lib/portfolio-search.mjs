// Phase 3 — server-side portfolio retrieval for BMS AI.
//
// Instead of putting every project in the system prompt, each request gets
// only the portfolio records relevant to it:
//   visitor message (+ Phase 2 discovery notes, + projects shown last turn)
//     → concept vocabulary (e.g. "NGO" ⇒ humanitarian/foundation, "apps" ⇒ Application Development)
//     → weighted matching over title, tags, category, description and Lab fields
//     → a short candidate list, which the model then interprets and explains.
// The model can only return project IDs from this list (checked in the function).
import { PORTFOLIO, portfolioRecordById } from '../../src/ai/portfolio.js';

export const MAX_CANDIDATES = 6;
export const MAX_PROJECT_RESULTS = 4;
const MAX_CONTEXT_IDS = 4;

// How visitors describe work → the site's own portfolio categories and the
// words that appear in project data. This is search vocabulary only; it adds
// no facts about any project.
const CONCEPTS = [
  { terms: ['website', 'websites', 'web', 'site', 'sites', 'webpage', 'web page', 'landing page', 'homepage', 'online presence', 'web design', 'web development'], categories: ['Web Development'] },
  { terms: ['app', 'apps', 'application', 'applications', 'mobile', 'software', 'platform', 'account', 'accounts', 'login', 'sign up', 'register', 'registration', 'dashboard', 'android', 'ios', 'personal information'], categories: ['Application Development'] },
  { terms: ['ecommerce', 'e-commerce', 'online store', 'online shop', 'shop', 'store', 'products', 'orders', 'checkout', 'sell online', 'cart'], categories: ['Web Development', 'Application Development'] },
  { terms: ['automation', 'automate', 'automated', 'automating', 'workflow', 'workflows', 'n8n', 'ai', 'bot', 'chatbot', 'manual', 'manually', 'spreadsheet', 'excel', 'integration', 'compliance', 'data entry'], categories: ['AI Automation'] },
  { terms: ['brand', 'branding', 'brands', 'identity', 'visual identity', 'brand identity', 'rebrand', 'colors', 'colours', 'typography'], categories: ['Brand Design'] },
  { terms: ['logo', 'logos'], categories: ['Brand Design', 'Graphic Design'] },
  { terms: ['graphic', 'graphics', 'graphic design', 'flyer', 'flyers', 'poster', 'posters', 'social media', 'signage', 'banner', 'banners', 'mockup', 'mockups', 'print', 'book cover', 'campaign', 'marketing design'], categories: ['Graphic Design'] },
  { terms: ['ui', 'ux', 'ui/ux', 'interface', 'user interface', 'user experience', 'app design'], categories: ['Graphic Design'] },
  { terms: ['copy', 'copywriting', 'writing', 'written', 'writer', 'content', 'article', 'articles', 'blog', 'content plan', 'messaging', 'marketing copy', 'script', 'ebook'], categories: ['Copywriting'] },
  { terms: ['ngo', 'ngos', 'nonprofit', 'non-profit', 'charity', 'charities', 'foundation', 'humanitarian', 'mission', 'donation', 'donations', 'widows', 'orphans', 'vulnerable', 'community', 'communities'], categories: [] },
  { terms: ['real estate', 'property', 'properties', 'estate', 'estates', 'housing', 'homes', 'realtor'], categories: [] },
  { terms: ['fashion', 'clothing', 'apparel', 'clothes', 'wear'], categories: [] },
  { terms: ['led', 'video wall', 'hardware', 'installation', 'screen', 'screens', 'display', 'control room', 'operations room'], categories: ['Featured Project'] },
];

// Signals that the visitor is asking about BMS's previous work.
const PORTFOLIO_INTENT =
  /\b(portfolio|projects?|your work|past work|previous work|work (?:you(?:'ve| have)?|bms has) done|examples?|samples?|case stud(?:y|ies)|show(?: me)?|showcase|built|have you (?:built|made|done|created|designed|worked|developed|written)|done (?:before|anything|something)|similar|like (?:this|that|mine|it|lutapp)|closest|experience (?:with|in)|anything (?:for|like)|something (?:for|like)|do you have|what have you|worked on)\b/i;

const STOPWORDS = new Set(
  'a an and are as at be been but by can could did do does for from had has have how i if in into is it its just me my of on or our so some than that the their them then there these they this to too was we were what when where which who why will with would you your yours about any anything something show tell want need looking like also more please thanks thank work project projects portfolio built build made make done business company design designs bms beyond microsoft help similar kind type sort'.split(' '),
);
const SHORT_TOKENS = new Set(['ai', 'ui', 'ux', 'led', 'app', 'ngo', 'web', 'seo']);

const normalise = (text) => ` ${String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9/+&\- ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
const has = (haystack, term) => haystack.includes(` ${term} `) || haystack.includes(` ${term}s `);

const tokensOf = (text) =>
  normalise(text)
    .trim()
    .split(' ')
    .filter((token) => token && !STOPWORDS.has(token) && (token.length > 2 || SHORT_TOKENS.has(token)));

// Title words too common to identify a project by name on their own.
const GENERIC_TITLE_WORDS = new Set(
  'collection installation workflow homes guide plan step beginners remote never successful parents financially video wall cross border'.split(' '),
);
const CONCEPT_TERMS = new Set(CONCEPTS.flatMap((concept) => concept.terms));

// Precomputed, normalised search fields per public project.
const INDEX = PORTFOLIO.map((record) => {
  // Distinctive title words (e.g. "lutapp", "ghofa", "wellora", "landnest") identify a project by
  // name. "Beyond Microsoft" deliberately has none, so ordinary questions about BMS don't match it.
  const nameWords = tokensOf(record.title).filter(
    (word) => !/[\d-]/.test(word) && !GENERIC_TITLE_WORDS.has(word) && !CONCEPT_TERMS.has(word),
  );
  return {
    record,
    title: normalise(record.title),
    nameWords,
    category: normalise(record.category),
    tags: normalise(record.tags.join(' ')),
    body: normalise([record.description, record.service, record.labFlow && Object.values(record.labFlow).join(' ')].filter(Boolean).join(' ')),
  };
});

function scoreEntry(entry, { tokens, expanded, categories, focusAreas }) {
  let score = 0;
  if (categories.has(entry.record.category)) score += 4;
  if (focusAreas.has(entry.record.category)) score += 2;
  const fieldScore = (term, weight) => {
    if (has(entry.title, term)) return 3 * weight;
    if (has(entry.tags, term) || has(entry.category, term)) return 2 * weight;
    if (has(entry.body, term)) return 1 * weight;
    return 0;
  };
  tokens.forEach((term) => {
    score += fieldScore(term, 1);
  });
  expanded.forEach((term) => {
    score += fieldScore(term, 0.6);
  });
  return score;
}

/**
 * @param {{ message: string, discovery?: object|null, contextIds?: string[] }} input
 * @returns {{ mode: 'none'|'matches'|'overview'|'related', totalMatches: number, records: object[] }}
 */
export function retrievePortfolio({ message, discovery = null, contextIds = [] }) {
  const text = normalise(message);
  const namedProjects = INDEX.filter((entry) => entry.nameWords.length && entry.nameWords.some((word) => has(text, word)));
  const intent = PORTFOLIO_INTENT.test(message) || namedProjects.length > 0;
  const discoveryActive = Boolean(
    discovery && (discovery.relevantServices?.length || ['requirements', 'mapping', 'summary', 'ready'].includes(discovery.stage)),
  );
  const context = contextIds.map(portfolioRecordById).filter(Boolean).slice(0, MAX_CONTEXT_IDS);

  if (!intent && !discoveryActive && !context.length) return { mode: 'none', totalMatches: 0, records: [] };

  // Query = the visitor's message, plus their own stated needs from Phase 2 discovery.
  const discoveryText = discoveryActive
    ? [discovery.businessType, discovery.businessDescription, discovery.problem, discovery.desiredOutcome, ...(discovery.requestedCapabilities || [])]
        .filter(Boolean)
        .join(' ')
    : '';
  const query = normalise(`${message} ${discoveryText}`);
  const tokens = new Set(tokensOf(query));
  const categories = new Set();
  const expanded = new Set();
  CONCEPTS.forEach((concept) => {
    if (concept.terms.some((term) => has(query, term))) {
      concept.categories.forEach((category) => categories.add(category));
      concept.terms.forEach((term) => {
        if (!tokens.has(term)) expanded.add(term);
      });
    }
  });
  const focusAreas = new Set((discovery?.relevantServices || []).map((entry) => entry.focusArea).filter(Boolean));

  const scored = INDEX.map((entry) => ({
    record: entry.record,
    score: scoreEntry(entry, { tokens, expanded, categories, focusAreas }) + (namedProjects.includes(entry) ? 10 : 0),
  }))
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score || Number(b.record.featured) - Number(a.record.featured));

  let mode;
  let picked;
  if (intent && scored.length) {
    mode = 'matches';
    picked = scored.slice(0, MAX_CANDIDATES).map((item) => item.record);
  } else if (intent) {
    // Nothing specific matched ("show me your projects", "have you built Facebook?"):
    // one representative project per category so the answer stays concise and honest.
    mode = 'overview';
    const perCategory = new Map();
    PORTFOLIO.forEach((record) => {
      const current = perCategory.get(record.category);
      if (!current || (record.featured && !current.featured)) perCategory.set(record.category, record);
    });
    picked = [...perCategory.values()];
  } else {
    // Mid business-discovery without an explicit portfolio question: only clearly related work.
    mode = 'related';
    picked = scored.filter((item) => item.score >= 5).slice(0, 3).map((item) => item.record);
  }

  const records = [...picked];
  context.forEach((record) => {
    if (!records.includes(record)) records.push(record);
  });
  if (!records.length) return { mode: 'none', totalMatches: 0, records: [] };
  return { mode, totalMatches: mode === 'matches' ? scored.length : 0, records };
}

/** Compact, public-only project facts for the model (no image paths, URLs or internal fields). */
function modelRecord(record) {
  const out = {
    id: record.id,
    title: record.title,
    category: record.category,
    service: record.service,
    status: record.status,
    description: record.description,
    tags: record.tags,
  };
  if (record.labFlow) out.aiAutomationLab = record.labFlow;
  if (record.caseStudy) out.alsoPresentedIn = record.caseStudy;
  if (record.hasLiveBuild) out.hasViewableBuild = true;
  if (record.hasDocument) out.hasDocument = true;
  return out;
}

export function portfolioRecordsBlock({ mode, totalMatches, records }) {
  const header =
    mode === 'overview'
      ? 'No project specifically matched; one representative project per portfolio category'
      : mode === 'related'
        ? 'Projects related to the visitor\'s stated needs'
        : `Projects matching the visitor's question (${totalMatches} matched; showing up to ${records.length})`;
  return `<portfolio_records mode="${mode}">\n${header}:\n${JSON.stringify(records.map(modelRecord))}\n</portfolio_records>`;
}
