import { useEffect, useMemo, useRef, useState } from 'react';
import {
  articles,
  automationLab,
  certificates,
  copywritingItems,
  expertise,
  footerContacts,
  personal,
  pillars,
  portfolioFilters,
  projects,
  services,
  sidebarCategories,
  socials,
  techStack,
  testimonialShots,
} from './data/content';
import BMSAILauncher from './components/BMSAI/BMSAILauncher';

/* -------------------------------------------------------------------- */
/* Icons                                                                  */
/* -------------------------------------------------------------------- */

const ICONS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.4 4 5.4 4 8.5s-1.4 6.1-4 8.5c-2.6-2.4-4-5.4-4-8.5s1.4-6.1 4-8.5Z" /></>,
  code: <path d="m9 8-4 4 4 4M15 8l4 4-4 4M13 6l-2 12" />,
  layers: <><path d="M12 3l8 4.5-8 4.5-8-4.5L12 3Z" /><path d="M4 12.5 12 17l8-4.5M4 16.5 12 21l8-4.5" /></>,
  pen: <><path d="M4 20l1-4.2L15.8 5A2 2 0 0 1 18.6 5l.4.4A2 2 0 0 1 19 8.2L8.2 19 4 20Z" /><path d="M13.2 6.8 17.2 10.8" /></>,
  megaphone: <><path d="M4 10v4h3l6 4V6l-6 4H4Z" /><path d="M17 9a4 4 0 0 1 0 6M20 7a7 7 0 0 1 0 10" /></>,
  briefcase: <><rect x="3" y="7.5" width="18" height="12" rx="2" /><path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5M3 12h18" /></>,
  cube: <><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="M4 7l8 4 8-4M12 11v10" /></>,
  file: <><path d="M7 3h7l5 5v13H7Z" /><path d="M14 3v5h5M9 13h6M9 16.5h6" /></>,
  person: <><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>,
  message: <><path d="M5 6.5h14v9H9l-4 3v-12Z" /><path d="M8 10h8M8 13h5" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></>,
  moon: <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  arrow: <path d="M6 12h11M13 7l5 5-5 5" />,
  flow: <><circle cx="6" cy="7" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="12" cy="17" r="2" /><path d="M8 7h8M7 9l4 6M17 9l-4 6" /></>,
  merge: <path d="M6 4v6a4 4 0 0 0 4 4h8M14 10l4 4-4 4M18 4v5" />,
  window: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 9h16M8 5v4" /></>,
};

function Icon({ name, className = 'icon' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name] || ICONS.spark}
    </svg>
  );
}

function ContactIcon({ type }) {
  const common = { fill: 'currentColor', 'aria-hidden': 'true', className: 'footer-contact-icon', viewBox: '0 0 24 24' };
  if (type === 'linkedin') {
    return (
      <svg {...common}>
        <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.03-3.04-1.86-3.04-1.86 0-2.14 1.45-2.14 2.94v5.68H9.33V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.31 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.53V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z" />
      </svg>
    );
  }
  if (type === 'whatsapp') {
    return (
      <svg {...common}>
        <path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.55 0 .22 5.33.22 11.88c0 2.09.55 4.14 1.59 5.94L.12 24l6.33-1.66a11.9 11.9 0 0 0 5.65 1.44h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.18-1.23-6.16-3.47-8.42ZM12.1 21.77h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.22-3.75.98 1-3.66-.24-.38a9.82 9.82 0 0 1-1.5-5.23c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.98 2.9a9.8 9.8 0 0 1 2.9 6.99c0 5.45-4.44 9.88-9.89 9.88Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    );
  }
  if (type === 'x') {
    return (
      <svg {...common}>
        <path d="M18.24 2H21l-6.5 7.43L22.2 22h-6.19l-4.85-6.34L5.6 22H2.83l6.95-7.94L2 2h6.34l4.38 5.8L18.24 2Zm-1.08 18.2h1.72L7.9 3.7H6.05l11.11 16.5Z" />
      </svg>
    );
  }
  if (type === 'github') {
    return (
      <svg {...common}>
        <path d="M12 .5A11.5 11.5 0 0 0 .5 12.14c0 5.16 3.29 9.53 7.86 11.08.58.11.79-.26.79-.57v-2.17c-3.2.71-3.88-1.4-3.88-1.4-.52-1.36-1.28-1.72-1.28-1.72-1.04-.73.08-.72.08-.72 1.16.08 1.77 1.22 1.77 1.22 1.02 1.79 2.68 1.27 3.34.97.1-.76.4-1.27.72-1.56-2.55-.3-5.24-1.31-5.24-5.82 0-1.29.44-2.34 1.16-3.16-.12-.3-.5-1.51.11-3.14 0 0 .95-.31 3.12 1.2a10.6 10.6 0 0 1 5.68 0c2.16-1.51 3.11-1.2 3.11-1.2.62 1.63.23 2.84.12 3.14.72.82 1.16 1.87 1.16 3.16 0 4.52-2.7 5.51-5.26 5.8.41.37.78 1.08.78 2.19v3.24c0 .31.21.69.8.57A11.51 11.51 0 0 0 23.5 12.14 11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    );
  }
  if (type === 'instagram') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (type === 'tiktok') {
    return (
      <svg {...common}>
        <path d="M14.5 2h2.6c.2 1.6 1.2 3.2 2.9 3.7v2.7c-1.1 0-2.1-.3-3-.9v6.4a5.6 5.6 0 1 1-4.8-5.5v2.8a2.9 2.9 0 1 0 2.3 2.8V2Z" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function AssetImage({ src, alt, className = '', fallback = 'BMS' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`asset-fallback ${className}`} role="img" aria-label={alt}>
        <span>{fallback}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

function SectionHeading({ eyebrow, title, text, center = false }) {
  return (
    <div className={`section-heading ${center ? 'center' : ''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <span className="empty-kicker">Ready for verified content</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Searchable index                                                      */
/* -------------------------------------------------------------------- */

function buildSearchIndex() {
  const entries = [];
  projects.forEach((p) => entries.push({ group: 'Projects', label: p.title, hint: p.category, id: `project-${p.title}` }));
  services.forEach((s) => entries.push({ group: 'Services', label: s.title, hint: s.text, id: 'services' }));
  articles.forEach((a) => entries.push({ group: 'Insights', label: a.title, hint: a.category, id: 'insights' }));
  techStack.forEach((t) => entries.push({ group: 'Technology', label: t, hint: 'Tech stack', id: 'tech' }));
  certificates.forEach((c) => entries.push({ group: 'Credentials', label: c.title, hint: c.organization, id: 'credentials' }));
  copywritingItems.forEach((c) => entries.push({ group: 'Copywriting', label: c.title, hint: c.category, id: 'copywriting' }));
  return entries;
}

const SEARCH_INDEX = buildSearchIndex();

/* -------------------------------------------------------------------- */
/* App                                                                    */
/* -------------------------------------------------------------------- */

function App() {
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' && localStorage.getItem('bms-theme')) || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [formStatus, setFormStatus] = useState('');
  const [formState, setFormState] = useState('idle'); // idle | submitting | success | error
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [newsletterState, setNewsletterState] = useState('idle'); // idle | submitting | success | error
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeExpertise, setActiveExpertise] = useState('Creative');
  const searchInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bms-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setModal(null);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All') return projects;
    return projects.filter((project) => project.category === activeFilter);
  }, [activeFilter]);

  const featuredProject = useMemo(() => projects.find((p) => p.featured) || projects[0], []);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return SEARCH_INDEX.filter((entry) => entry.label.toLowerCase().includes(q) || entry.hint?.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const goToCategory = (category) => {
    setActiveCategory(category.key);
    setActiveFilter(category.filter);
    setSidebarOpen(false);
    const el = document.getElementById(category.section);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const jumpTo = (id) => {
    setSearchOpen(false);
    setSidebarOpen(false);
    setModal(null);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // BMS AI action buttons (src/ai/actions.js) reuse the site's own navigation:
  // portfolio filters, the sidebar highlight and section scrolling.
  const handleAIAction = (action, { suggestedService, contactMessage } = {}) => {
    if (action.project) {
      // "View Project" from a BMS AI card: the same modal as clicking the portfolio card.
      setSearchOpen(false);
      setSidebarOpen(false);
      setModal({ type: 'project', item: action.project });
      return;
    }
    if (action.filter) {
      setActiveFilter(action.filter);
      const category = sidebarCategories.find((c) => c.section === 'work' && c.filter === action.filter);
      if (category) setActiveCategory(category.key);
    }
    if (action.section === 'contact') {
      // Pre-fill (never submit) the existing form from the AI conversation,
      // leaving anything the visitor already entered untouched.
      const serviceSelect = document.querySelector('.contact-form select[name="service"]');
      if (suggestedService && serviceSelect && !serviceSelect.value) serviceSelect.value = suggestedService;
      const messageField = document.querySelector('.contact-form textarea[name="message"]');
      // Fill an empty message, or replace an earlier BMS AI pre-fill with
      // newer discovery notes; never the visitor's own text.
      const current = messageField?.value.trim() || '';
      const isAIPrefill = /^Project notes from my BMS AI conversation:/.test(current);
      if (contactMessage && messageField && (!current || isAIPrefill)) messageField.value = contactMessage;
    }
    jumpTo(action.section);
  };

  const encodeFormData = (data) =>
    Object.keys(data)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');

  const submitForm = (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      setFormState('error');
      setFormStatus('Please complete the required fields (name, email, service and message) before submitting.');
      return;
    }

    if (formState === 'submitting') return; // guard against duplicate submissions

    const data = new FormData(form);
    setFormState('submitting');
    setFormStatus('Sending your message...');

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeFormData(Object.fromEntries(data.entries())),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Submission failed with status ${response.status}`);
        setFormState('success');
        setFormStatus("Thanks — your project request has been received. I'll get back to you shortly.");
        form.reset();
      })
      .catch(() => {
        setFormState('error');
        setFormStatus('Something went wrong sending your message. Please try again, or reach out directly via WhatsApp or email.');
      });
  };

  const submitNewsletter = (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      setNewsletterState('error');
      setNewsletterStatus('Please enter a valid email address.');
      return;
    }

    if (newsletterState === 'submitting') return; // guard against duplicate submissions

    const data = new FormData(form);
    setNewsletterState('submitting');
    setNewsletterStatus('Subscribing...');

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeFormData(Object.fromEntries(data.entries())),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Subscription failed with status ${response.status}`);
        setNewsletterState('success');
        setNewsletterStatus("You're subscribed. Watch your inbox for updates from Beyond Microsoft.");
        form.reset();
      })
      .catch(() => {
        setNewsletterState('error');
        setNewsletterStatus('Something went wrong subscribing. Please try again.');
      });
  };

  const SidebarNav = (
    <nav className="sidebar-nav" aria-label="Catalog categories">
      {sidebarCategories.map((category) => (
        <button
          key={category.key}
          type="button"
          className={`sidebar-nav-item ${activeCategory === category.key ? 'active' : ''}`}
          onClick={() => goToCategory(category)}
        >
          <Icon name={category.icon} className="sidebar-icon" />
          <span>{category.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="bms-shell">
      <div className="cursor-glow" aria-hidden="true" />

      {/* Desktop fixed sidebar */}
      <aside className="bms-sidebar" aria-label="Primary navigation">
        <a className="sidebar-brand" href="#home" aria-label="Beyond Microsoft home" onClick={() => goToCategory(sidebarCategories[0])}>
          <AssetImage src={personal.logo} alt="Beyond Microsoft BMS logo" className="sidebar-logo" fallback="BMS" />
          <span className="sidebar-brand-text">
            <strong>{personal.brand}</strong>
            <small>{personal.founder}</small>
            <em>{personal.title}</em>
          </span>
        </a>
        {SidebarNav}
      </aside>

      {/* Mobile top bar */}
      <div className="bms-mobile-bar">
        <a className="sidebar-brand compact" href="#home" aria-label="Beyond Microsoft home" onClick={() => goToCategory(sidebarCategories[0])}>
          <AssetImage src={personal.logo} alt="Beyond Microsoft BMS logo" className="sidebar-logo" fallback="BMS" />
          <strong>{personal.shortBrand}</strong>
        </a>
        <button type="button" className="icon-btn" aria-label="Open menu" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}>
          <Icon name="menu" />
        </button>
      </div>

      {/* Mobile slide-out panel */}
      {sidebarOpen && (
        <div className="mobile-nav-overlay" role="dialog" aria-modal="true" onClick={() => setSidebarOpen(false)}>
          <div className="mobile-nav-panel" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-nav-head">
              <span>
                <strong>{personal.brand}</strong>
                <small>{personal.founder} — {personal.title}</small>
              </span>
              <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setSidebarOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            {SidebarNav}
          </div>
        </div>
      )}

      <div className="bms-main">
        <header className="bms-topbar">
          <span className="topbar-title">{sidebarCategories.find((c) => c.key === activeCategory)?.label.toUpperCase() || 'ALL WORK'}</span>
          <div className="topbar-actions">
            <button type="button" className="icon-btn" aria-label="Search (Ctrl+K)" onClick={() => setSearchOpen(true)}>
              <Icon name="search" />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button type="button" className="btn secondary compact" onClick={() => jumpTo('contact')}>
              Request Project
            </button>
            <a className="btn primary compact" href="#contact" onClick={() => jumpTo('contact')}>
              Contact
            </a>
          </div>
        </header>

        <main>
          <section id="home" className="hero section">
            <div className="hero-grid">
              <div className="hero-copy">
                <span className="eyebrow">{personal.founder} · {personal.title}</span>
                <h1>
                  CREATIVITY
                  <span>MEETS</span>
                  <span>TECHNOLOGY.</span>
                </h1>
                <p>{personal.intro}</p>
                <div className="hero-positioning">
                  <strong>{personal.positioning}</strong>
                  <span>{personal.supportingPositioning}</span>
                </div>
                <strong className="descriptor">Founder of {personal.brand} ({personal.shortBrand})</strong>
                <div className="button-row">
                  <button className="btn primary" type="button" onClick={() => jumpTo('work')}>
                    Explore Work
                  </button>
                  <button className="btn secondary" type="button" onClick={() => jumpTo('contact')}>
                    Let's Work Together
                  </button>
                  <a className="btn ghost" href={personal.cvPath} target="_blank" rel="noreferrer">
                    Download CV
                  </a>
                </div>
              </div>

              <div className="hero-visual" aria-label="Gabriel Owolabi brand portrait panel">
                <div className="circuit-field" aria-hidden="true" />
                <AssetImage
                  src={personal.headshot}
                  alt="Gabriel Owolabi, Creative Technologist and Founder of Beyond Microsoft"
                  className="hero-person"
                  fallback="Gabriel Owolabi"
                />
                <div className="signature-card">
                  <span>{personal.founder}</span>
                  <strong>{personal.title}</strong>
                  <small>{personal.brand} ({personal.shortBrand})</small>
                  <small>{personal.positioning}</small>
                </div>
              </div>
            </div>
          </section>

          <section className="section catalog-intro">
            <SectionHeading
              eyebrow="Selected Work"
              title="SELECTED WORK"
              text={`A curated collection of digital experiences, technology projects, creative work and experiments from ${personal.brand}.`}
            />
            <span className="catalog-count">{projects.length} entries in the catalog</span>
          </section>

          {featuredProject && (
            <section className="section featured-section">
              <SectionHeading eyebrow="Featured" title="FEATURED" />
              <article className="featured-card" onClick={() => setModal({ type: 'project', item: featuredProject })}>
                <AssetImage
                  src={featuredProject.image || featuredProject.cover}
                  alt={featuredProject.title}
                  className="featured-image"
                  fallback={featuredProject.title}
                />
                <div className="featured-copy">
                  <span className="project-category">{featuredProject.category}</span>
                  <h3>{featuredProject.title}</h3>
                  <p>{featuredProject.description}</p>
                  <span className="card-arrow"><Icon name="arrow" /></span>
                </div>
              </article>
            </section>
          )}

          <section id="work" className="section work-section">
            <div className="filter-row" aria-label="Portfolio filters">
              {portfolioFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={activeFilter === filter ? 'active' : ''}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {filteredProjects.length > 0 ? (
              <div className="portfolio-grid">
                {filteredProjects.map((project, index) => (
                  <article
                    className={`portfolio-card size-${project.size || (index % 5 === 0 ? 'wide' : 'standard')}`}
                    key={project.title}
                    onClick={() => setModal({ type: 'project', item: project })}
                  >
                    <div className="project-image-wrap">
                      <AssetImage
                        src={project.image || project.cover}
                        alt={project.title}
                        className="portfolio-image"
                        fallback={project.title.slice(0, 2).toUpperCase() || 'Project'}
                      />
                      <span className={`project-status status-${project.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {project.status}
                      </span>
                      <span className="card-overlay-arrow"><Icon name="arrow" /></span>
                    </div>
                    <span className="project-category">{project.category}</span>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="project-tech-wrap">
                      {project.technologies?.slice(0, 3).map((tag) => (
                        <span key={`${project.title}-${tag}`}>{tag}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No projects match this category yet."
                text="The catalog is structured to grow with verified work, future launches and additional case studies."
              />
            )}
          </section>

          <section id="services" className="section services-section">
            <SectionHeading
              eyebrow="What I Do"
              title="Capabilities across creativity and technology."
              text="Focused disciplines that come together to build, automate and communicate for a business."
            />
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.title}>
                  <div className="service-visual">
                    {service.image ? (
                      <AssetImage src={service.image} alt={service.title} className="service-card-image" fallback={service.title} />
                    ) : (
                      <Icon name={service.icon} />
                    )}
                  </div>
                  <div className="service-copy">
                    <span className="card-number">{service.number}</span>
                    <Icon name={service.icon} />
                    <h3>{service.title}</h3>
                    <p>{service.text}</p>
                    <button className="text-link" type="button" onClick={() => jumpTo('contact')}>
                      Learn More &rarr;
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="ai-lab" className="section lab-section">
            <SectionHeading
              eyebrow="AI Automation Lab"
              title="AI & AUTOMATION LAB"
              text="Verified automation systems, shown as trigger, logic, automation and result — not a generic diagram."
            />
            {automationLab.length > 0 ? (
              <div className="lab-grid">
                {automationLab.map((flow) => (
                  <article className="lab-card" key={flow.title}>
                    <AssetImage src={flow.image} alt={flow.title} className="lab-image" fallback={flow.title} />
                    <h3>{flow.title}</h3>
                    <div className="lab-flow">
                      <span><strong>Trigger</strong>{flow.trigger}</span>
                      <Icon name="arrow" />
                      <span><strong>AI / Logic</strong>{flow.logic}</span>
                      <Icon name="arrow" />
                      <span><strong>Automation</strong>{flow.automation}</span>
                      <Icon name="arrow" />
                      <span><strong>Result</strong>{flow.result}</span>
                    </div>
                    {(flow.gallery?.length > 0 || flow.reportUrl) && (
                      <div className="lab-links">
                        {flow.gallery?.length > 0 && (
                          <button type="button" className="text-link" onClick={() => setModal({ type: 'project', item: { ...flow, category: 'AI & Automation', status: 'Completed', description: `${flow.trigger} → ${flow.logic} → ${flow.automation} → ${flow.result}` } })}>
                            View Workflow Gallery &rarr;
                          </button>
                        )}
                        {flow.reportUrl && (
                          <a className="text-link" href={flow.reportUrl} target="_blank" rel="noreferrer">
                            View Full Report (PDF) &rarr;
                          </a>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="Automation case studies are being prepared." text="Verified n8n and AI workflow builds will publish here." />
            )}
          </section>

          <section id="about" className="section founder-section">
            <div className="founder-grid">
              <div className="founder-image-card">
                <AssetImage
                  src={personal.headshot}
                  alt="Gabriel Owolabi, Creative Technologist and Founder of Beyond Microsoft"
                  className="founder-image"
                  fallback="Gabriel Owolabi"
                />
              </div>
              <div className="founder-copy">
                <SectionHeading eyebrow="About" title={`${personal.founder.toUpperCase()}`} text="CREATIVE TECHNOLOGIST" />
                {personal.founderBio.map((paragraph, index) => (
                  <p key={`founder-bio-${index}`}>{paragraph}</p>
                ))}
                <blockquote className="philosophy-quote">&ldquo;{personal.philosophy}&rdquo;</blockquote>
                <div className="button-row">
                  <a className="btn primary" href={personal.cvPath} target="_blank" rel="noreferrer">
                    View CV
                  </a>
                  <a className="btn secondary" href={personal.cvPath} download>
                    Download CV
                  </a>
                  {personal.card && (
                    <button className="btn ghost" type="button" onClick={() => jumpTo('brand-identity')}>
                      View Brand Identity
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {personal.card && (
            <section id="brand-identity" className="section brand-identity-section">
              <SectionHeading
                eyebrow="Physical Brand Identity"
                title="PHYSICAL BRAND IDENTITY"
                text="Beyond Microsoft extends beyond digital experiences. These physical brand assets bring the BMS identity into professional interactions, promotional materials, and real-world brand touchpoints."
              />

              <div className="brand-identity-block">
                <h3>BMS Complimentary Card</h3>
                <p>
                  Official Beyond Microsoft complimentary card design created to carry the BMS identity into
                  professional and real-world interactions.
                </p>
                <div className="card-pair-grid">
                  <button
                    type="button"
                    className="card-pair-item"
                    onClick={() => setModal({ type: 'image', item: { src: personal.card, title: 'Beyond Microsoft complimentary card — front' } })}
                  >
                    <AssetImage
                      src={personal.card}
                      alt="Beyond Microsoft complimentary card front"
                      className="card-pair-image"
                      fallback="Card front"
                    />
                    <span>Front</span>
                  </button>
                  {personal.cardBack && (
                    <button
                      type="button"
                      className="card-pair-item"
                      onClick={() => setModal({ type: 'image', item: { src: personal.cardBack, title: 'Beyond Microsoft complimentary card — back' } })}
                    >
                      <AssetImage
                        src={personal.cardBack}
                        alt="Beyond Microsoft complimentary card back"
                        className="card-pair-image"
                        fallback="Card back"
                      />
                      <span>Back</span>
                    </button>
                  )}
                </div>
              </div>

              {personal.sticker && (
                <div className="brand-identity-block">
                  <h3>BMS Brand Sticker</h3>
                  <p>
                    A physical BMS brand asset designed to extend the Beyond Microsoft identity into everyday brand
                    touchpoints.
                  </p>
                  <button
                    type="button"
                    className="sticker-item"
                    onClick={() => setModal({ type: 'image', item: { src: personal.sticker, title: 'Beyond Microsoft BMS sticker' } })}
                  >
                    <AssetImage src={personal.sticker} alt="Beyond Microsoft BMS sticker" className="sticker-image" fallback="BMS Sticker" />
                  </button>
                </div>
              )}
            </section>
          )}

          <section id="tech" className="section tech-section">
            <SectionHeading eyebrow="Tech Stack" title="TECH STACK" text="Tools and technologies actually used in the work above." center />
            <div className="tech-grid">
              {techStack.map((tool) => (
                <span className="tech-tile" key={tool}>{tool}</span>
              ))}
            </div>
          </section>

          <section className="section capability-section">
            <SectionHeading eyebrow="Capabilities" title="Technical and creative capabilities, shaped around outcomes." center />
            <div className="capability-layout">
              <div className="capability-tabs" role="tablist" aria-label="Capability categories">
                {Object.keys(expertise).map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={activeExpertise === category ? 'active' : ''}
                    onClick={() => setActiveExpertise(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="capability-cloud" role="tabpanel">
                {expertise[activeExpertise].map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          </section>

          <section id="credentials" className="section proof-section">
            <SectionHeading
              eyebrow="Credentials"
              title="CREDENTIALS"
              text="Real certificate files. Organization, date and credential ID publish once independently verified."
              center
            />
            <div className="proof-grid">
              {certificates.length > 0 ? (
                certificates.map((cert) => (
                  <article className="credential-card" key={cert.title} onClick={() => setModal({ type: 'certificate', item: cert })}>
                    <div className="credential-file-icon"><Icon name="file" /></div>
                    <h3>{cert.title}</h3>
                    <p>{cert.organization || 'Organization pending verification'}</p>
                    <small>{cert.date || 'Date pending verification'}</small>
                  </article>
                ))
              ) : (
                <EmptyState title="No certificates published yet." text="Add verified certificate files to /assets/certificates to populate this catalog." />
              )}
            </div>
          </section>

          <section id="copywriting" className="section insights-section">
            <SectionHeading
              eyebrow="Copywriting"
              title="COPYWRITING"
              text="Real writing samples — website, social and content pieces, opened as documents rather than summarized."
            />
            <div className="insight-grid">
              {copywritingItems.map((item) => (
                <article className="insight-card" key={item.title}>
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <a className="text-link" href={item.file} target="_blank" rel="noreferrer">
                    View Document &rarr;
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section id="testimonials" className="section proof-section">
            <SectionHeading
              eyebrow="Testimonials"
              title="WHAT PEOPLE SAY"
              text="Real client-message screenshots, shown as supplied. Names were not visible in the source material."
              center
            />
            {testimonialShots.length > 0 ? (
              <div className="testimonial-shot-grid">
                {testimonialShots.map((shot) => (
                  <button
                    type="button"
                    className="testimonial-shot"
                    key={shot}
                    onClick={() => setModal({ type: 'image', item: { src: shot, title: 'Client Feedback' } })}
                  >
                    <AssetImage src={shot} alt="Client feedback message screenshot" className="testimonial-shot-image" fallback="Feedback" />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="No testimonials published yet." text="Verified client feedback will publish here." />
            )}
          </section>

          <section id="insights" className="section insights-section">
            <SectionHeading
              eyebrow="Insights"
              title="Thinking beyond the build."
              text="Ideas and observations from the intersection of technology, creativity, AI, communication and professional growth."
            />
            <div className="insight-grid">
              {articles.map((article) => (
                <article className="insight-card" key={article.slug}>
                  <span>{article.category}</span>
                  <small>{article.date}</small>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <small className="read-time">{article.readTime}</small>
                  <button className="text-link" type="button" onClick={() => setModal({ type: 'article', item: article })}>
                    Read More &rarr;
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section id="contact" className="section contact-section">
            <div className="contact-layout">
              <div>
                <SectionHeading
                  eyebrow="Contact"
                  title="HAVE SOMETHING WORTH BUILDING?"
                  text="Tell me what you're trying to build, improve or automate."
                />
                <div className="contact-links">
                  {footerContacts.map((contact) => (
                    <a
                      key={contact.type}
                      href={contact.url}
                      target={contact.type === 'linkedin' || contact.type === 'whatsapp' ? '_blank' : undefined}
                      rel={contact.type === 'linkedin' || contact.type === 'whatsapp' ? 'noreferrer' : undefined}
                      aria-label={`${contact.label}: ${contact.name}`}
                    >
                      <ContactIcon type={contact.type} />
                      <span>{contact.name}</span>
                    </a>
                  ))}
                </div>
              </div>
              <form
                className="contact-form"
                name="contact"
                method="POST"
                data-netlify="true"
                netlify-honeypot="bot-field"
                onSubmit={submitForm}
              >
                <input type="hidden" name="form-name" value="contact" />
                <p className="visually-hidden">
                  <label>
                    Don&apos;t fill this out if you&apos;re human: <input name="bot-field" />
                  </label>
                </p>
                <label>
                  Name
                  <input name="name" type="text" required placeholder="Your name" disabled={formState === 'submitting'} />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required placeholder="you@example.com" disabled={formState === 'submitting'} />
                </label>
                <label>
                  Company
                  <input name="company" type="text" placeholder="Company or brand" disabled={formState === 'submitting'} />
                </label>
                <label>
                  Service
                  <select name="service" required defaultValue="" disabled={formState === 'submitting'}>
                    <option value="" disabled>
                      Select a service
                    </option>
                    {services.map((service) => (
                      <option key={service.title}>{service.title}</option>
                    ))}
                    <option>Collaboration</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  Budget
                  <input name="budget" type="text" placeholder="Project budget or range" disabled={formState === 'submitting'} />
                </label>
                <label className="full">
                  Message
                  <textarea
                    name="message"
                    required
                    rows="5"
                    placeholder="What are you trying to build, improve or automate?"
                    disabled={formState === 'submitting'}
                  />
                </label>
                <button className="btn primary full" type="submit" disabled={formState === 'submitting'}>
                  {formState === 'submitting' ? 'Sending...' : 'Start the Conversation'}
                </button>
                {formStatus && (
                  <p className={`form-status form-status-${formState}`} role="status">
                    {formStatus}
                  </p>
                )}
              </form>
            </div>
          </section>

          <section className="premium-cta">
            <h2>READY TO BUILD SOMETHING REMARKABLE?</h2>
            <p>Have an idea, problem or process that could be better? Let's turn it into something useful.</p>
            <div className="button-row center-row">
              <a className="btn light" href={`mailto:${personal.email}`}>
                Start a Conversation
              </a>
              <button className="btn ghost" type="button" onClick={() => jumpTo('work')}>
                Explore the Work
              </button>
            </div>
          </section>
        </main>

        <footer className="footer">
          <div className="footer-grid compact">
            <div className="footer-brand">
              <AssetImage src={personal.logo} alt="" className="footer-logo" fallback="BMS" />
              <h2>{personal.brand} ({personal.shortBrand})</h2>
              <p>{personal.founder} — {personal.title}</p>
              <p>Creativity, technology and intelligent solutions — built to move ideas forward.</p>
              <div className="social-row">
                {socials.map((social) => {
                  const isMailto = social.href.startsWith('mailto:');
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      target={isMailto ? undefined : '_blank'}
                      rel={isMailto ? undefined : 'noopener noreferrer'}
                    >
                      <ContactIcon type={social.icon} />
                    </a>
                  );
                })}
              </div>
            </div>
            <div className="footer-column">
              <h3>Explore</h3>
              <button className="text-link" type="button" onClick={() => jumpTo('work')}>Work</button>
              <button className="text-link" type="button" onClick={() => jumpTo('about')}>About</button>
              <button className="text-link" type="button" onClick={() => jumpTo('services')}>Services</button>
              <button className="text-link" type="button" onClick={() => jumpTo('insights')}>Insights</button>
              <button className="text-link" type="button" onClick={() => jumpTo('contact')}>Contact</button>
            </div>
            <div className="footer-column footer-contact-column">
              <h3>Connect</h3>
              <div className="footer-contact-list">
                {footerContacts.map((contact) => (
                  <a
                    key={contact.type}
                    className="footer-contact-item"
                    href={contact.url}
                    target={contact.type === 'linkedin' || contact.type === 'whatsapp' ? '_blank' : undefined}
                    rel={contact.type === 'linkedin' || contact.type === 'whatsapp' ? 'noreferrer' : undefined}
                    aria-label={`${contact.label}: ${contact.name}`}
                  >
                    <span className="footer-contact-icon-wrap">
                      <ContactIcon type={contact.type} />
                    </span>
                    <span>
                      <small>{contact.label}</small>
                      <strong>{contact.name}</strong>
                    </span>
                  </a>
                ))}
              </div>
            </div>
            <div className="footer-column footer-newsletter-column">
              <h3>Stay Connected with BMS</h3>
              <p>
                Get thoughtful insights, quotes, investment perspectives, and updates from Beyond Microsoft
                delivered to your inbox.
              </p>
              <form
                className="subscribe-form"
                name="newsletter"
                method="POST"
                data-netlify="true"
                netlify-honeypot="newsletter-bot-field"
                onSubmit={submitNewsletter}
              >
                <input type="hidden" name="form-name" value="newsletter" />
                <p className="visually-hidden">
                  <label>
                    Don&apos;t fill this out if you&apos;re human: <input name="newsletter-bot-field" />
                  </label>
                </p>
                <label className="visually-hidden" htmlFor="newsletter-email">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  required
                  placeholder="Email address"
                  disabled={newsletterState === 'submitting'}
                />
                <button className="btn primary" type="submit" disabled={newsletterState === 'submitting'}>
                  {newsletterState === 'submitting' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              {newsletterStatus && (
                <p className={`form-status form-status-${newsletterState}`} role="status">
                  {newsletterStatus}
                </p>
              )}
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 {personal.brand} ({personal.shortBrand}). All rights reserved.</span>
            <span>Built with creativity + technology.</span>
          </div>
        </footer>
      </div>

      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" onClick={() => setSearchOpen(false)}>
          <div className="search-panel" onClick={(event) => event.stopPropagation()}>
            <div className="search-input-row">
              <Icon name="search" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search projects, services, insights, technology..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="button" className="icon-btn" aria-label="Close search" onClick={() => setSearchOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <div className="search-results">
              {query.trim() && searchResults.length === 0 && <p className="search-empty">No matches yet.</p>}
              {searchResults.map((result) => (
                <button key={`${result.group}-${result.label}`} type="button" className="search-result" onClick={() => jumpTo(result.id.startsWith('project-') ? 'work' : result.id)}>
                  <span className="search-result-group">{result.group}</span>
                  <span className="search-result-label">{result.label}</span>
                </button>
              ))}
              {!query.trim() && (
                <div className="search-shortcuts">
                  <button type="button" onClick={() => jumpTo('work')}>Go to Work</button>
                  <button type="button" onClick={() => jumpTo('about')}>Go to About</button>
                  <button type="button" onClick={() => jumpTo('services')}>Go to Services</button>
                  <button type="button" onClick={() => jumpTo('contact')}>Go to Contact</button>
                  <a href={personal.cvPath} target="_blank" rel="noreferrer">Open CV</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setModal(null)} aria-label="Close dialog">
              <Icon name="close" />
            </button>
            {modal.type === 'article' && (
              <article>
                <span className="eyebrow">{modal.item.category}</span>
                <h2>{modal.item.title}</h2>
                <p>{modal.item.body}</p>
              </article>
            )}
            {modal.type === 'certificate' && (
              <article>
                <span className="eyebrow">{modal.item.organization || 'Organization pending verification'}</span>
                <h2>{modal.item.title}</h2>
                <p>{modal.item.date || 'Date pending verification'}</p>
                <p className="empty-kicker">Credential metadata publishes once independently verified.</p>
                <div className="button-row">
                  {modal.item.file && (
                    <a className="btn primary" href={modal.item.file} target="_blank" rel="noreferrer">
                      View Certificate (PDF)
                    </a>
                  )}
                  {modal.item.verificationUrl && (
                    <a className="btn secondary" href={modal.item.verificationUrl} target="_blank" rel="noreferrer">
                      Verify Credential
                    </a>
                  )}
                </div>
              </article>
            )}
            {modal.type === 'image' && (
              <article>
                <span className="eyebrow">{modal.item.title}</span>
                <AssetImage src={modal.item.src} alt={modal.item.title} className="project-modal-image" fallback={modal.item.title} />
              </article>
            )}
            {modal.type === 'project' && (
              <article className="project-modal-content">
                <span className="eyebrow">{modal.item.category} · {modal.item.year || ''}</span>
                <h2>{modal.item.title}</h2>
                <span className={`project-status status-${modal.item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {modal.item.status}
                </span>
                <AssetImage
                  src={modal.item.image || modal.item.cover}
                  alt={modal.item.title}
                  className="project-modal-image"
                  fallback={modal.item.title}
                />
                <h4>Overview</h4>
                <p>{modal.item.description}</p>
                {modal.item.problem && (<><h4>The Challenge</h4><p>{modal.item.problem}</p></>)}
                {modal.item.strategy && (<><h4>The Approach</h4><p>{modal.item.strategy}</p></>)}
                {modal.item.solution && (<><h4>The Solution</h4><p>{modal.item.solution}</p></>)}
                {modal.item.result && (<><h4>Result</h4><p>{modal.item.result}</p></>)}
                {modal.item.technologies?.length > 0 && (
                  <>
                    <h4>Technology</h4>
                    <div className="project-tech-wrap">
                      {modal.item.technologies.map((tag) => (
                        <span key={`${modal.item.title}-${tag}`}>{tag}</span>
                      ))}
                    </div>
                  </>
                )}
                {modal.item.gallery?.length > 1 && (
                  <>
                    <h4>Project Gallery</h4>
                    <div className="project-gallery-grid">
                      {modal.item.gallery.map((src) => (
                        <button
                          type="button"
                          className="project-gallery-thumb"
                          key={src}
                          onClick={() => setModal({ type: 'image', item: { src, title: modal.item.title } })}
                        >
                          <AssetImage src={src} alt={`${modal.item.title} gallery image`} className="project-gallery-image" fallback={modal.item.title} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {modal.item.video && (
                  <video className="project-modal-video" src={modal.item.video} controls preload="none" />
                )}
                {modal.item.reportUrl && (
                  <p>
                    <a className="text-link" href={modal.item.reportUrl} target="_blank" rel="noreferrer">
                      View Full Report (PDF) &rarr;
                    </a>
                  </p>
                )}
                <div className="button-row">
                  {modal.item.projectUrl && (
                    <a className="btn primary" href={modal.item.projectUrl} target="_blank" rel="noreferrer">
                      {modal.item.status === 'In Development' ? 'View Current Build' : 'Live Project'}
                    </a>
                  )}
                  {modal.item.githubUrl && (
                    <a className="btn secondary" href={modal.item.githubUrl} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  )}
                  {modal.item.caseStudySection && (
                    <button className="btn secondary" type="button" onClick={() => jumpTo(modal.item.caseStudySection)}>
                      View Case Study
                    </button>
                  )}
                  <button className="btn ghost" type="button" onClick={() => setModal(null)}>
                    Back to Catalog
                  </button>
                </div>
              </article>
            )}
          </div>
        </div>
      )}

      <BMSAILauncher onAction={handleAIAction} />
    </div>
  );
}

export default App;
