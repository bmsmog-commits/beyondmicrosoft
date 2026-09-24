// Runs the Phase 2 (business discovery, tests 1-8), Phase 3 (portfolio
// navigator, tests 9-19) and Phase 4 (project brief, tests 20-28) scenarios
// against the real BMS AI function and the live AI provider, printing each
// reply, the returned project cards, the structured discovery notes and, for
// Phase 4, the generated brief for review.
//
//   npm run ai:scenarios              (reads AI_API_KEY from .env if present)
//   npm run ai:scenarios -- 3 5       (only scenarios 3 and 5)
//   npm run ai:scenarios -- 9-19      (only the Phase 3 scenarios)
//   npm run ai:scenarios -- 20-28     (only the Phase 4 scenarios)
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
  // ---- Phase 4: project brief (`brief: true` requests a brief after the turns)
  {
    name: 'P4 basic website',
    expect: 'Business: fashion; confirmed: browsing + ordering; payments/accounts/delivery only as potential; budget & timeline Not provided.',
    turns: ['I run a fashion business and I need a website where customers can browse products and place orders.'],
    brief: true,
  },
  {
    name: 'P4 automation',
    expect: 'Problem: manual customer-data entry; service AI & Automation; no invented workflow.',
    turns: ['I manually copy customer information from WhatsApp into Excel.', 'It takes hours every week and I make mistakes. I want it to happen automatically.'],
    brief: true,
  },
  {
    name: 'P4 multi-service',
    expect: 'Services: Brand Design, Web Development, AI & Automation (not ranked).',
    turns: ['I need a logo, website and automated follow-up for my new business.', "It's a small bakery. Customers find us on Instagram."],
    brief: true,
  },
  {
    name: 'P4 budget & timeline',
    expect: 'Budget "₦500,000"; timeline "Before December" — exactly as stated.',
    turns: [
      'I run a fashion business and I need a website where customers can browse products and place orders.',
      "My budget is ₦500,000 and I'd like it completed before December.",
    ],
    brief: true,
  },
  {
    name: 'P4 correction',
    expect: 'Target audience: adults aged 25–45.',
    turns: [
      'I run a fashion business for young adults and need a website where customers can browse and order.',
      'No, the target audience is adults aged 25–45.',
    ],
    brief: true,
  },
  {
    name: 'P4 related portfolio',
    expect: 'Related projects only from the ones shown (e.g. Lutapp), with neutral reasons.',
    turns: ['Have you built an app?', 'I want a mobile app where my customers can book appointments and pay. I run a hair salon.'],
    brief: true,
  },
  { name: 'P4 insufficient', expect: 'Continues discovery; no brief offered; brief request returns "need more information".', turns: ['I want a website.'], brief: true },
  { name: 'P4 pricing', expect: 'No invented price; pricing depends on confirmed scope.', turns: ['I need an online store for my shoe business. How much will the project cost?'] },
  {
    name: 'P4 unknown capability',
    expect: 'Satellite software is not presented as a confirmed BMS capability; listed as something to clarify.',
    turns: ['I run a logistics company and need a website plus custom satellite-tracking firmware for our trucks.'],
    brief: true,
  },
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

async function call(messages, discovery, projectContext, extra = {}) {
  const request = new Request(`${ORIGIN}/.netlify/functions/bms-ai`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, host: 'localhost:8888' },
    body: JSON.stringify({ messages, discovery, projectContext, ...extra }),
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
  const shownProjects = new Set();
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
    projectContext.forEach((id) => shownProjects.add(id));
    messages.push({ role: 'assistant', content: body.reply });
    console.log(`BMS AI:\n${indent(body.reply)}`);
    console.log(`  stage: ${discovery?.stage}   actions: ${body.actions.join(', ') || '-'}   form service: ${body.suggestedService || '-'}`);
    for (const project of body.projects) {
      console.log(`  project card: ${project.title} [${project.category}, ${project.status}] — ${project.reason}`);
    }
    if (body.briefOffer !== 'none') console.log(`  brief offer: ${body.briefOffer}`);
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
  if (scenario.brief) {
    const { status, body } = await call(messages, discovery, [...shownProjects].slice(0, 4), { mode: 'brief' });
    if (status !== 200) console.log(`\n  BRIEF ERROR ${status}: ${body.message}`);
    else if (!body.brief) console.log(`\n  BRIEF: not generated — ${body.message}`);
    else console.log(`\n  BRIEF (${body.message}):\n${indent(JSON.stringify(body.brief, null, 2))}`);
  }
}
