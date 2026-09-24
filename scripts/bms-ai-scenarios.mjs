// Runs the Phase 2 (business discovery, tests 1-8) and Phase 3 (portfolio
// navigator, tests 9-19) scenarios against the real BMS AI function and the
// live AI provider, printing each reply, the returned project cards and the
// structured discovery notes for review.
//
//   npm run ai:scenarios              (reads AI_API_KEY from .env if present)
//   npm run ai:scenarios -- 3 5       (only scenarios 3 and 5)
//   npm run ai:scenarios -- 9-19      (only the Phase 3 scenarios)
//
// This makes real API calls (roughly 30 requests for all scenarios).
import handler from '../netlify/functions/bms-ai.mjs';

const SCENARIOS = [
  {
    name: 'Website',
    expect: 'Asks clarifying questions, then identifies Web & Application Development (Web Development).',
    turns: [
      "I have a small business and I don't have a website.",
      'We sell handmade furniture. Customers keep asking where they can see our work and prices.',
      "It's a new site. We mostly get customers through Instagram right now.",
    ],
  },
  {
    name: 'Automation',
    expect: 'Recognises a likely AI & Automation need and asks relevant follow-ups.',
    turns: [
      'I manually copy customer information from WhatsApp into a spreadsheet every day.',
      'Name, phone number and what they ordered. Then I send them a confirmation message by hand.',
    ],
  },
  {
    name: 'Branding',
    expect: 'Identifies Design (Brand Design).',
    turns: ['My business has no consistent logo, colors or visual identity.'],
  },
  {
    name: 'Application',
    expect: 'Identifies Web & Application Development (Application Development) and asks scope questions.',
    turns: ['I want customers to create accounts, browse products and place orders through a custom application.'],
  },
  {
    name: 'Multi-service',
    expect: 'Recognises Design, Web & Application Development and AI & Automation without ranking them.',
    turns: ["I'm starting a company and need branding, a website and automated customer follow-up."],
  },
  {
    name: 'Ambiguous',
    expect: 'Does not recommend a service; asks what they are trying to improve or build.',
    turns: ['I need help with my business.'],
  },
  {
    name: 'Unknown capability',
    expect: 'Does not claim BMS can do it; says there is no verified information and redirects.',
    turns: ['Can BMS build a satellite?'],
  },
  {
    name: 'Existing project context',
    expect: 'References ABJ Foundation accurately (In Development) without inventing another NGO project.',
    turns: ['I need something similar to the website you built for an NGO.'],
  },
  // ---- Phase 3: portfolio navigator
  { name: 'P3 websites', expect: 'Returns ABJ Foundation and Beyond Microsoft (both In Development).', turns: ['Show me your websites.'] },
  { name: 'P3 AI automation', expect: 'Returns the Cross-Border Customs Compliance Workflow; may offer the Lab case study.', turns: ['Show me AI automation work.'] },
  { name: 'P3 app', expect: 'Returns Lutapp as in development; does not present the UI/UX collection as a built app.', turns: ['Have you built an app?'] },
  { name: 'P3 NGO', expect: 'Returns ABJ Foundation as NGO-related web work (In Development); invents nothing else.', turns: ['Do you have anything for NGOs?'] },
  {
    name: 'P3 similar (discovery + portfolio)',
    expect: 'Relevant services named; overlapping characteristics explained; no project claimed identical or to have e-commerce features it lacks.',
    turns: ['I need a website where customers can register, browse products and place orders. Have you built something similar?'],
  },
  { name: 'P3 branding', expect: "Returns Brand Design projects (e.g. Sol Villa's, GHOFA as Concept, the Branding & Identity Collection).", turns: ['Show me branding work.'] },
  { name: 'P3 copywriting', expect: 'Returns real Copywriting samples only.', turns: ['Show me your copywriting.'] },
  { name: 'P3 all projects', expect: 'Concise, category-oriented answer with at most 4 projects.', turns: ['Show me your projects.'] },
  { name: 'P3 Facebook', expect: 'Does not invent a Facebook-related project.', turns: ['Have you built Facebook?'] },
  { name: 'P3 best', expect: 'Declines to rank; explains different projects show different capabilities.', turns: ['Which project is the best?'] },
  { name: 'P3 unknown project', expect: 'Does not invent details about a project that is not in the portfolio.', turns: ["Tell me about a project that isn't in the portfolio."] },
];

if (!process.env.AI_API_KEY) {
  console.error('AI_API_KEY is not set. Add it to .env (see .env.example) or export it, then run again.');
  process.exit(1);
}

const selected = process.argv.slice(2).flatMap((arg) => {
  const [from, to] = arg.split('-').map(Number);
  return to ? Array.from({ length: to - from + 1 }, (_, i) => from + i) : [from];
}).filter(Boolean);
const ORIGIN = 'http://localhost:8888';

async function call(messages, discovery, projectContext) {
  const request = new Request(`${ORIGIN}/.netlify/functions/bms-ai`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, host: 'localhost:8888' },
    body: JSON.stringify({ messages, discovery, projectContext }),
  });
  const response = await handler(request, { ip: `scenario-${Date.now()}` });
  return { status: response.status, body: await response.json() };
}

const indent = (text) => text.split('\n').map((line) => `    ${line}`).join('\n');

for (const [index, scenario] of SCENARIOS.entries()) {
  if (selected.length && !selected.includes(index + 1)) continue;
  console.log(`\n${'='.repeat(70)}\nTEST ${index + 1} — ${scenario.name.toUpperCase()}\nExpected: ${scenario.expect}\n${'='.repeat(70)}`);
  const messages = [];
  let discovery = null;
  let projectContext = [];
  for (const turn of scenario.turns) {
    messages.push({ role: 'user', content: turn });
    console.log(`\nVISITOR: ${turn}`);
    const { status, body } = await call(messages, discovery, projectContext);
    if (status !== 200) {
      console.log(`  ERROR ${status}: ${body.message || body.error}`);
      break;
    }
    discovery = body.discovery;
    projectContext = body.projects.map((project) => project.id);
    messages.push({ role: 'assistant', content: body.reply });
    console.log(`BMS AI:\n${indent(body.reply)}`);
    console.log(`  stage: ${discovery?.stage}   actions: ${body.actions.join(', ') || '-'}   form service: ${body.suggestedService || '-'}`);
    for (const project of body.projects) {
      console.log(`  project card: ${project.title} [${project.category}, ${project.status}] — ${project.reason}`);
    }
    if (body.quickReplies.length) console.log(`  quick replies: ${body.quickReplies.join(' | ')}`);
    for (const entry of discovery?.relevantServices || []) {
      console.log(`  service: ${entry.serviceName}${entry.focusArea ? ` (${entry.focusArea})` : ''} — ${entry.role}: ${entry.reason}`);
    }
  }
  const captured = Object.entries(discovery || {}).filter(
    ([key, value]) => !['stage', 'relevantServices', 'projectType'].includes(key) && value && (!Array.isArray(value) || value.length),
  );
  if (captured.length) {
    console.log('  captured:');
    captured.forEach(([key, value]) => console.log(`    ${key}: ${Array.isArray(value) ? value.join('; ') : value}`));
  }
}
