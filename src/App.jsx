import { useEffect, useMemo, useRef, useState } from 'react';
import {
  articles,
  automationLab,
  certificates,
  experience,
  expertise,
  footerContacts,
  personal,
  pillars,
  portfolioFilters,
  projects,
  services,
  sidebarCategories,
  techStack,
  testimonials,
} from './data/content';

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
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submitForm = (event) => {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      setFormStatus('Please complete the required fields before starting the conversation.');
      return;
    }
    setFormStatus('Your message is ready for an email/API integration. No message has been sent yet.');
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
        <a className="sidebar-brand" href="#home" onClick={() => goToCategory(sidebarCategories[0])}>
          <AssetImage src={personal.logo} alt="" className="sidebar-logo" fallback="BMS" />
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
        <a className="sidebar-brand compact" href="#home">
          <AssetImage src={personal.logo} alt="" className="sidebar-logo" fallback="BMS" />
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
                <span className="eyebrow">Creative Technologist</span>
                <h1>
                  CREATIVITY
                  <span>MEETS</span>
                  <span>TECHNOLOGY.</span>
                </h1>
                <p>{personal.intro}</p>
                <strong className="descriptor">{personal.founder} — {personal.title}, {personal.brand}</strong>
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
                <p>
                  {personal.founder} is a Creative Technologist working at the intersection of creativity and
                  technology. He combines copywriting, software development, AI automation, web development and
                  graphic design to transform ideas into practical digital solutions.
                </p>
                <p>He enjoys simplifying complex problems and turning them into useful experiences.</p>
                <blockquote className="philosophy-quote">&ldquo;{personal.philosophy}&rdquo;</blockquote>
                <div className="button-row">
                  <a className="btn primary" href={personal.cvPath} target="_blank" rel="noreferrer">
                    View CV
                  </a>
                  <a className="btn secondary" href={personal.cvPath} download>
                    Download CV
                  </a>
                  {personal.card && (
                    <button className="btn ghost" type="button" onClick={() => setModal({ type: 'card' })}>
                      View Card
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

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
            <SectionHeading eyebrow="Credentials" title="CREDENTIALS" text="Certificates publish here once verified files are supplied." center />
            <div className="proof-grid">
              {certificates.length > 0 ? (
                certificates.map((cert) => (
                  <article className="credential-card" key={cert.title} onClick={() => setModal({ type: 'certificate', item: cert })}>
                    <AssetImage src={cert.image} alt={cert.title} className="credential-image" fallback={cert.title} />
                    <h3>{cert.title}</h3>
                    <p>{cert.organization}</p>
                    <small>{cert.date}</small>
                  </article>
                ))
              ) : (
                <EmptyState title="No certificates published yet." text="Add verified certificate files to /assets/certificates to populate this catalog." />
              )}
              {testimonials.length > 0 &&
                testimonials.map((testimonial) => (
                  <article className="testimonial-card" key={testimonial.name}>
                    <p>{testimonial.testimonial}</p>
                    <strong>{testimonial.name}</strong>
                  </article>
                ))}
              {experience.length > 0 &&
                experience.map((role) => (
                  <article className="testimonial-card" key={role.title}>
                    <strong>{role.title}</strong>
                    <p>{role.text}</p>
                  </article>
                ))}
            </div>
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
              <form className="contact-form" onSubmit={submitForm}>
                <label>
                  Name
                  <input name="name" type="text" required placeholder="Your name" />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required placeholder="you@example.com" />
                </label>
                <label>
                  Company
                  <input name="company" type="text" placeholder="Company or brand" />
                </label>
                <label>
                  Service
                  <select name="service" required defaultValue="">
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
                  <input name="budget" type="text" placeholder="Project budget or range" />
                </label>
                <label className="full">
                  Message
                  <textarea name="message" required rows="5" placeholder="What are you trying to build, improve or automate?" />
                </label>
                <button className="btn primary full" type="submit">
                  Start the Conversation
                </button>
                {formStatus && <p className="form-status" role="status">{formStatus}</p>}
              </form>
            </div>
          </section>

          <section className="premium-cta">
            <h2>READY TO BUILD SOMETHING REMARKABLE?</h2>
            <p>Have an idea, problem or process that could be better? Let's turn it into something useful.</p>
            <div className="button-row center-row">
              <button className="btn light" type="button" onClick={() => jumpTo('contact')}>
                Start a Conversation
              </button>
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
                <span className="eyebrow">{modal.item.organization}</span>
                <h2>{modal.item.title}</h2>
                <AssetImage src={modal.item.image} alt={modal.item.title} className="certificate-lightbox-image" fallback={modal.item.title} />
                <p>{modal.item.date}</p>
                {modal.item.verificationUrl && (
                  <a className="btn primary" href={modal.item.verificationUrl} target="_blank" rel="noreferrer">
                    Verify Credential
                  </a>
                )}
              </article>
            )}
            {modal.type === 'card' && (
              <article className="project-modal-content">
                <span className="eyebrow">{personal.brand}</span>
                <h2>Digital Identity Card</h2>
                <div className="card-lightbox-grid">
                  <AssetImage src={personal.card} alt="BMS complimentary card — front" className="card-lightbox-image" fallback="Card front" />
                  {personal.cardBack && (
                    <AssetImage src={personal.cardBack} alt="BMS complimentary card — back" className="card-lightbox-image" fallback="Card back" />
                  )}
                </div>
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
                <div className="button-row">
                  {modal.item.projectUrl && (
                    <a className="btn primary" href={modal.item.projectUrl} target="_blank" rel="noreferrer">
                      Live Project
                    </a>
                  )}
                  {modal.item.githubUrl && (
                    <a className="btn secondary" href={modal.item.githubUrl} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
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
    </div>
  );
}

export default App;
