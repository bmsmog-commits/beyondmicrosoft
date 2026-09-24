// BMS AI portfolio layer (Phase 3) — a normalised, read-only view of the
// public portfolio in src/data/content.js. It adds no project data: every
// field is copied or derived from the existing project objects (which
// already include the AI Automation Lab and Copywriting entries), and fields
// the site doesn't have (client, results, features...) are simply absent.
//
// Used server-side for retrieval and by the chat UI to open a project in the
// site's existing project modal.
import { automationLab, projects } from '../data/content.js';
import { SERVICE_CATALOG } from './services.js';

const slug = (text) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Which BMS service a portfolio category belongs to (from services.js focus areas).
const serviceForCategory = (category) =>
  SERVICE_CATALOG.find((service) => service.focusAreas.some((area) => area.name === category))?.name || null;

const CASE_STUDY_LABELS = {
  'ai-lab': 'AI & Automation Lab',
  copywriting: 'Copywriting section',
};

const labFlowFor = (title) => automationLab.find((flow) => flow.title === title) || null;

// Only projects the site shows publicly. A project can be hidden from the
// assistant later by adding `isPublic: false` to it in content.js.
const publicProjects = projects.filter((project) => project.isPublic !== false);

const seenIds = new Set();

/** Normalised public portfolio records. `source` is the original content.js object. */
export const PORTFOLIO = Object.freeze(
  publicProjects.map((project) => {
    let id = slug(project.title) || 'project';
    while (seenIds.has(id)) id = `${id}-2`;
    seenIds.add(id);
    const flow = labFlowFor(project.title);
    return Object.freeze({
      id,
      title: project.title,
      category: project.category,
      service: serviceForCategory(project.category),
      status: project.status,
      featured: Boolean(project.featured),
      description: project.description,
      tags: project.technologies || [],
      image: project.image || null,
      hasLiveBuild: Boolean(project.projectUrl),
      hasGallery: (project.gallery?.length || 0) > 1,
      hasDocument: Boolean(project.reportUrl),
      caseStudySection: project.caseStudySection || null,
      caseStudy: CASE_STUDY_LABELS[project.caseStudySection] || null,
      labFlow: flow ? { trigger: flow.trigger, logic: flow.logic, automation: flow.automation, result: flow.result } : null,
      source: project,
    });
  }),
);

export const PORTFOLIO_IDS = Object.freeze(PORTFOLIO.map((record) => record.id));

const byId = new Map(PORTFOLIO.map((record) => [record.id, record]));

export const portfolioRecordById = (id) => (typeof id === 'string' && byId.get(id)) || null;

/** Category → number of public projects, in the site's own category order. */
export function portfolioIndex() {
  const counts = new Map();
  PORTFOLIO.forEach((record) => counts.set(record.category, (counts.get(record.category) || 0) + 1));
  return [...counts].map(([category, count]) => ({ category, projects: count }));
}

/** Short, verified card text: the project's own description, trimmed at a word boundary. */
export function cardSummary(record, max = 150) {
  const text = record.description;
  if (!text || text.length <= max) return text || '';
  return `${text.slice(0, text.lastIndexOf(' ', max - 1)).replace(/[,;:—–-]\s*$/, '')}…`;
}
