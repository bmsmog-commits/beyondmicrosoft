// BMS AI action registry — the only buttons the assistant can put in front of
// a visitor. Shared by the Netlify function (which lists these IDs to the
// model and filters its output against them) and the React chat UI (which
// turns an ID into navigation). Every `section` is an existing section ID in
// src/App.jsx and every `filter` is an existing value in `portfolioFilters`,
// so the assistant can never produce a broken route.
import { footerContacts, portfolioFilters } from '../data/content.js';

const contactByType = Object.fromEntries(footerContacts.map((contact) => [contact.type, contact]));

const sectionActions = {
  'start-project': {
    label: 'Start a Project',
    section: 'contact',
    primary: true,
    description: 'Opens the business inquiry form. Use whenever the visitor shows intent to hire, build, or discuss a project.',
  },
  'view-services': {
    label: 'View Services',
    section: 'services',
    description: 'The Services section listing all BMS services.',
  },
  'view-portfolio': {
    label: 'View Portfolio',
    section: 'work',
    filter: 'All',
    description: 'The full portfolio grid.',
  },
  'view-ai-automation': {
    label: 'View AI Automation',
    section: 'work',
    filter: 'AI Automation',
    description: 'Portfolio filtered to AI Automation projects.',
  },
  'view-ai-lab': {
    label: 'Open AI Automation Lab',
    section: 'ai-lab',
    description: 'The AI & Automation Lab case-study section (trigger → logic → automation → result).',
  },
  'view-web-development': {
    label: 'View Web Development',
    section: 'work',
    filter: 'Web Development',
    description: 'Portfolio filtered to Web Development projects.',
  },
  'view-applications': {
    label: 'View Application Development',
    section: 'work',
    filter: 'Application Development',
    description: 'Portfolio filtered to Application Development projects.',
  },
  'view-brand-design': {
    label: 'View Brand Design',
    section: 'work',
    filter: 'Brand Design',
    description: 'Portfolio filtered to Brand Design projects.',
  },
  'view-graphic-design': {
    label: 'View Graphic Design',
    section: 'work',
    filter: 'Graphic Design',
    description: 'Portfolio filtered to Graphic Design projects.',
  },
  'view-copywriting': {
    label: 'View Copywriting',
    section: 'copywriting',
    description: 'The Copywriting section with real writing samples.',
  },
  'view-about': {
    label: 'View About',
    section: 'about',
    description: "The About section with Gabriel Owolabi's founder biography.",
  },
  'view-credentials': {
    label: 'View Credentials',
    section: 'credentials',
    description: 'The Credentials section with certificate files.',
  },
  'view-testimonials': {
    label: 'View Testimonials',
    section: 'testimonials',
    description: 'The Testimonials section with client feedback screenshots.',
  },
};

// Contact channels come straight from `footerContacts`, so a phone number or
// email change in content.js flows through to the assistant automatically.
const contactActions = {};
if (contactByType.email) {
  contactActions['contact-email'] = {
    label: 'Email BMS',
    href: contactByType.email.url,
    description: `Opens an email to ${contactByType.email.name}.`,
  };
}
if (contactByType.whatsapp) {
  contactActions['contact-whatsapp'] = {
    label: 'WhatsApp BMS',
    href: contactByType.whatsapp.url,
    external: true,
    description: `Opens a WhatsApp chat with BMS (${contactByType.whatsapp.name}).`,
  };
}
if (contactByType.linkedin) {
  contactActions['contact-linkedin'] = {
    label: 'LinkedIn',
    href: contactByType.linkedin.url,
    external: true,
    description: `Opens ${contactByType.linkedin.name}'s LinkedIn profile.`,
  };
}

// Drop (and warn about) any action whose filter no longer exists in
// content.js, instead of letting the assistant offer a dead button. Never
// throws — this module is loaded with the main site bundle.
const validActions = Object.entries({ ...sectionActions, ...contactActions }).filter(([id, action]) => {
  if (action.filter && !portfolioFilters.includes(action.filter)) {
    console.warn(`[BMS AI] Skipping action "${id}": unknown portfolio filter "${action.filter}"`);
    return false;
  }
  return true;
});

export const AI_ACTIONS = Object.freeze(Object.fromEntries(validActions));

export const AI_ACTION_IDS = Object.freeze(Object.keys(AI_ACTIONS));

export const AI_MAX_ACTIONS = 3;
