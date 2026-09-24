// BMS AI knowledge context — a compact, structured view of the verified
// website content in src/data/content.js. Nothing here is written by hand:
// update content.js and the assistant's knowledge updates with the next
// deploy. Only visitor-relevant facts are included (no image paths or
// private data).
//
// Portfolio project details are NOT included here (Phase 3): only a
// category index. The relevant project records are retrieved per question
// by netlify/lib/portfolio-search.mjs and sent alongside the visitor's turn.
import {
  articles,
  certificates,
  expertise,
  footerContacts,
  personal,
  pillars,
  process,
  services,
  socials,
  techStack,
  testimonialShots,
} from '../data/content.js';
import { portfolioIndex } from './portfolio.js';
import { SERVICE_CATALOG } from './services.js';

export const SITE_URL = 'https://beyondmicrosoft.com';

export function buildKnowledge() {
  return {
    brand: {
      name: personal.brand,
      shortName: personal.shortBrand,
      website: SITE_URL,
      positioning: personal.positioning,
      supportingPositioning: personal.supportingPositioning,
      philosophy: personal.philosophy,
      pillars: pillars.map((pillar) => ({ name: pillar.title, summary: pillar.text })),
    },
    founder: {
      name: personal.founder,
      title: personal.title,
      role: `Founder of ${personal.brand} (${personal.shortBrand})`,
      // Approved biography, written in Gabriel's first-person voice on the
      // About section. The assistant must retell it in the third person.
      approvedBiography: personal.founderBio,
      cvAvailable: Boolean(personal.cvPath),
    },
    // The four official services, each with its verified capabilities, the
    // portfolio categories it covers (focus areas), and related problems.
    services: SERVICE_CATALOG,
    servicesNote:
      'These are the only BMS services. Consulting, strategy or "technology solutions" are not offered as separate services; describe that work only through the four services above.',
    process: process.map(([step, name, text]) => ({ step, name, text })),
    technologies: techStack,
    expertise,
    portfolio: {
      // Public projects per category. Project details arrive per question in <portfolio_records>.
      categories: portfolioIndex(),
      note: 'The site also has an AI & Automation Lab section (deeper automation case studies) and a Copywriting section (writing samples); both are part of the portfolio categories above.',
    },
    credentials: {
      certificates: certificates.map((cert) => cert.title),
      note: 'Certificate files are viewable on the site. Issuing organization, dates and credential IDs are still pending verification and are not published.',
    },
    testimonials: {
      count: testimonialShots.length,
      note: 'Real client-feedback message screenshots, shown anonymously on the site. Client names were not visible, so no names, quotes or companies are published.',
    },
    insights: {
      publishedArticles: articles.filter((article) => article.date !== 'Draft').map((article) => article.title),
      note: 'The Insights section currently holds draft article slots only; no articles have been published yet.',
    },
    contact: {
      channels: footerContacts.map((contact) => ({ channel: contact.label, value: contact.name, url: contact.url })),
      socialProfiles: socials
        .filter((social) => !social.href.startsWith('mailto:'))
        .map((social) => ({ network: social.label, url: social.href })),
      inquiryProcess:
        'The Contact section of the website has a business inquiry form (name, email, optional company, service, optional budget, and a message describing what the visitor wants to build, improve or automate). BMS follows up after receiving it.',
      inquiryFormServiceOptions: [...services.map((service) => service.title), 'Collaboration', 'Other'],
    },
    notPublished: [
      'Pricing, rates, packages or quotes',
      'Delivery timelines or turnaround times',
      'Client names other than the names of portfolio projects',
      'Business results, metrics or statistics',
      'Partnerships, awards or team size',
      'A physical office address',
    ],
  };
}
