// BMS service capability catalog — the only services BMS AI may recommend.
//
// Built from src/data/content.js: the four official services (names,
// descriptions, capabilities), the portfolio categories that act as focus
// areas within them, and BMS's own problem/outcome statements. Nothing here
// adds a capability; the table below only says which existing records
// belong together. Consumed server-side (system prompt, response schema,
// output validation) — the browser cannot redefine it.
import { portfolioFilters, problems, services, solutions } from '../data/content.js';

// Links official service titles (content.js `services`) to existing
// portfolio categories, `problems` and `solutions` by their titles.
const SERVICE_LINKS = [
  {
    id: 'design',
    title: 'Design',
    focusAreas: ['Brand Design', 'Graphic Design'],
    problems: ['Weak digital presence'],
    outcomes: ['Build Stronger Brands'],
  },
  {
    id: 'ai-automation',
    title: 'AI & Automation',
    focusAreas: ['AI Automation'],
    problems: ['Manual work slows growth', 'Disconnected tools'],
    outcomes: ['Automate Repetitive Work'],
  },
  {
    id: 'web-app-development',
    title: 'Web & Application Development',
    focusAreas: ['Web Development', 'Application Development'],
    problems: ['Weak digital presence', 'No technical team'],
    outcomes: ['Build Digital Experiences', 'Develop Software'],
  },
  {
    id: 'copywriting',
    title: 'Copywriting',
    focusAreas: ['Copywriting'],
    problems: ['Unclear messaging'],
    outcomes: ['Communicate Better'],
  },
];

const warn = (message) => console.warn(`[BMS AI services] ${message}`);

function pickByTitle(records, titles, kind) {
  return titles.flatMap((title) => {
    const record = records.find((item) => item.title === title);
    if (!record) warn(`Unknown ${kind} "${title}" — skipped`);
    return record ? [record] : [];
  });
}

/** Structured, content-derived service catalog. Services missing from content.js are skipped. */
export const SERVICE_CATALOG = Object.freeze(
  SERVICE_LINKS.flatMap((link) => {
    const service = services.find((item) => item.title === link.title);
    if (!service) {
      warn(`Service "${link.title}" not found in content.js — skipped`);
      return [];
    }
    return [
      {
        id: link.id,
        name: service.title,
        description: service.text,
        capabilities: service.capabilities,
        focusAreas: link.focusAreas
          .filter((area) => {
            const known = portfolioFilters.includes(area);
            if (!known) warn(`Unknown portfolio category "${area}" — skipped`);
            return known;
          })
          .map((area) => ({ name: area })),
        relatedProblems: pickByTitle(problems, link.problems, 'problem').map((problem) => `${problem.title}: ${problem.text}`),
        outcomes: pickByTitle(solutions, link.outcomes, 'outcome').map((solution) => `${solution.title}: ${solution.text}`),
      },
    ];
  }),
);

export const SERVICE_IDS = Object.freeze(SERVICE_CATALOG.map((service) => service.id));

export const FOCUS_AREAS = Object.freeze([...new Set(SERVICE_CATALOG.flatMap((service) => service.focusAreas.map((area) => area.name)))]);

export const serviceById = (id) => SERVICE_CATALOG.find((service) => service.id === id) || null;
