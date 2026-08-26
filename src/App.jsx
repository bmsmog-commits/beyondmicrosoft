import { useEffect, useMemo, useState } from 'react';
import {
  articles,
  certificates,
  experience,
  expertise,
  footerContacts,
  navItems,
  personal,
  pillars,
  portfolioFilters,
  problems,
  projects,
  services,
  socials,
  testimonials,
  trustStrip,
} from './data/content';

const Icon = ({ name }) => {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const paths = {
    message: (
      <>
        <path d="M5 6.5h14v9H9l-4 3v-12Z" />
        <path d="M8 10h8M8 13h5" />
      </>
    ),
    window: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M4 9h16M8 5v4" />
      </>
    ),
    flow: (
      <>
        <circle cx="6" cy="7" r="2" />
        <circle cx="18" cy="7" r="2" />
        <circle cx="12" cy="17" r="2" />
        <path d="M8 7h8M7 9l4 6M17 9l-4 6" />
      </>
    ),
    code: <path d="m9 8-4 4 4 4M15 8l4 4-4 4M13 6l-2 12" />,
    spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />,
    merge: <path d="M6 4v6a4 4 0 0 0 4 4h8M14 10l4 4-4 4M18 4v5" />,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon" {...common}>
      {paths[name] || paths.spark}
    </svg>
  );
};

const ContactIcon = ({ type }) => {
  const common = {
    fill: 'currentColor',
    'aria-hidden': 'true',
    className: 'footer-contact-icon',
    viewBox: '0 0 24 24',
  };

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
};

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

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeExpertise, setActiveExpertise] = useState('Creative');
  const [modal, setModal] = useState(null);
  const [formStatus, setFormStatus] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 18);
      const visibleSections = navItems
        .map(([, id]) => document.getElementById(id))
        .filter((section) => section && section.getBoundingClientRect().top <= 140);
      const current = visibleSections[visibleSections.length - 1];
      if (current) setActiveSection(current.id);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMove = (event) => {
      document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`);
    };
    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All') return projects.filter((project) => project.featured !== false);
    return projects.filter((project) => project.category === activeFilter && project.featured !== false);
  }, [activeFilter]);

  const submitForm = (event) => {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      setFormStatus('Please complete the required fields before starting the conversation.');
      return;
    }
    setFormStatus('Your message is ready for an email/API integration. No message has been sent yet.');
  };

  return (
    <div className="site-shell">
      <div className="cursor-glow" aria-hidden="true" />
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <a className="brand-lockup" href="#home" aria-label="Beyond Microsoft home">
          <AssetImage src={personal.logo} alt="" className="brand-logo" fallback="BMS" />
          <span>
            <strong>BMS</strong>
            <small>Beyond Microsoft</small>
          </span>
        </a>

        <button className="menu-toggle" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
          {navItems.map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              className={activeSection === id ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>

        <a className="btn primary nav-cta" href="#contact">
          Let's Talk
        </a>
      </header>

      <main>
        <section id="home" className="hero section">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Creative Technologist & Founder</span>
              <h1>
                Building Brands.
                <span>Automating Growth.</span>
                <span>Creating Impact.</span>
              </h1>
              <p>{personal.intro}</p>
              <strong className="descriptor">Gabriel Owolabi - Creative Technologist & Founder, Beyond Microsoft</strong>
              <div className="button-row">
                <a className="btn primary" href="#contact">
                  Let's Talk
                </a>
                <a className="btn secondary" href="#work">
                  View My Work
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
                <span>Gabriel Owolabi</span>
                <strong>Creative Technologist & Founder</strong>
                <small>Beyond Microsoft (BMS)</small>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-panel" aria-label="BMS credibility and capabilities">
          <p>Built for businesses that need stronger digital presence, clearer communication and smarter operations.</p>
          <div className="trust-row">
            {trustStrip.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className="section problem-section">
          <SectionHeading
            eyebrow="The Problem"
            title="Great businesses struggle with the same digital bottlenecks."
            text="BMS exists for founders and teams who need design, technology, automation and messaging to work as one system."
            center
          />
          <div className="problem-grid">
            {problems.map((problem) => (
              <article className="problem-card" key={problem.title}>
                <Icon name={problem.icon} />
                <h3>{problem.title}</h3>
                <p>{problem.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section approach-section">
          <SectionHeading
            eyebrow="My Approach"
            title="I combine creativity, technology and strategy to help you build, automate and grow."
            center
          />
          <div className="pillar-grid">
            {pillars.map((pillar) => (
              <article className="pillar-card" key={pillar.title}>
                <Icon name={pillar.icon} />
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="services" className="section services-section">
          <div className="section-row">
            <SectionHeading
              eyebrow="What I Do"
              title="Services that drive real business clarity."
              text="Focused services for organizations that need a stronger brand, smarter workflows and communication that converts attention into trust."
            />
            <a className="btn secondary" href="#contact">
              Discuss a Project
            </a>
          </div>
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
                  <a href="#contact">Learn More &rarr;</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="work" className="section work-section">
          <div className="section-row">
            <SectionHeading
              eyebrow="Featured Work"
              title="A curated portfolio system built around real capability."
              text="The work is intentionally selective: each project speaks to a capability, a category and a clear stage of development without inventing outcomes."
            />
            <a className="btn secondary" href="#contact">
              Start a Project
            </a>
          </div>

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
              {filteredProjects.map((project) => (
                <article className="portfolio-card" key={project.title}>
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
                  </div>
                  <span className="project-category">{project.category}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-tech-wrap">
                    {project.technologies?.slice(0, 3).map((tag) => (
                      <span key={`${project.title}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                  <div className="portfolio-actions">
                    <button type="button" onClick={() => setModal({ type: 'project', item: project })}>
                      View Details
                    </button>
                    {project.projectUrl && (
                      <a href={project.projectUrl} target="_blank" rel="noreferrer">
                        Visit Project
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No projects match this category yet."
              text="The portfolio is structured to grow with verified work, future launches and additional case studies."
            />
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
              <SectionHeading eyebrow="About Me" title="I am Gabriel Owolabi." />
              <p>
                Creative Technologist and Founder of Beyond Microsoft (BMS). I help businesses and organizations grow
                through the power of design, technology, automation and words.
              </p>
              <ul className="check-list">
                <li>Creative Technologist</li>
                <li>AI Automation Specialist</li>
                <li>Web Developer</li>
                <li>Graphic & Brand Designer</li>
                <li>Copywriter</li>
              </ul>
              <div className="button-row">
                <a className="btn primary" href={personal.cvPath} target="_blank" rel="noreferrer">
                  View CV
                </a>
                <a className="text-link" href="#contact">
                  More About Me &rarr;
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section capability-section">
          <SectionHeading
            eyebrow="Capabilities"
            title="Technical and creative capabilities, shaped around outcomes."
            center
          />
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

        <section className="section proof-section">
          <SectionHeading eyebrow="Proof" title="Testimonials and credentials stay honest." center />
          <div className="proof-grid">
            {testimonials.length > 0 ? (
              testimonials.map((testimonial) => (
                <article className="testimonial-card" key={testimonial.name}>
                  <p>{testimonial.testimonial}</p>
                  <strong>{testimonial.name}</strong>
                </article>
              ))
            ) : (
              <EmptyState
                title="No verified testimonials are available yet."
                text="This section is structured for genuine client feedback only. Nothing has been invented."
              />
            )}
            {certificates.length > 0 || experience.length > 0 ? (
              <EmptyState title="Verified credentials can publish here." text="Add verified certificate or experience entries to the data file." />
            ) : (
              <EmptyState title="Credential space preserved." text="The site will display certificates, experience and associations once verified details are supplied." />
            )}
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
                title="Ready to build, automate and grow your brand?"
                text="Let's create digital solutions that make your business look better, work smarter and communicate with impact."
              />
              <div className="contact-links">
                {footerContacts.map((contact) => (
                  <a
                    key={contact.type}
                    href={contact.url}
                    target={contact.type === 'linkedin' ? '_blank' : undefined}
                    rel={contact.type === 'linkedin' ? 'noreferrer' : undefined}
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
                Let's Work Together
              </button>
              {formStatus && <p className="form-status" role="status">{formStatus}</p>}
            </form>
          </div>
        </section>

        <section className="premium-cta">
          <h2>Ready to build, automate and grow your brand?</h2>
          <p>Bring your website, brand, automation and messaging into one clear digital system.</p>
          <div className="button-row center-row">
            <a className="btn light" href="#contact">
              Let's Work Together
            </a>
            <a className="btn ghost" href="#work">
              View My Work
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <AssetImage src={personal.logo} alt="" className="footer-logo" fallback="BMS" />
            <h2>Beyond Microsoft (BMS)</h2>
            <p>Gabriel Owolabi - Creative Technologist & Founder</p>
            <p>Building brands, automating growth and creating impact through technology, design and words.</p>
            <div className="social-row">
  {socials.map((social) => (
    <a
      key={social.label}
      href={social.href}
      aria-label={social.label}
      target="_blank"
      rel="noopener noreferrer"
    >
      {social.icon}
    </a>
  ))}
</div>
          </div>
          <FooterColumn title="Quick Links" items={navItems.map(([label, id]) => [label, `#${id}`])} />
          <FooterColumn title="Services" items={services.map((service) => [service.title, '#services'])} />
          <FooterColumn
            title="Resources"
            items={[
              ['My CV', personal.cvPath],
              ['Case Studies', '#work'],
              ['Insights', '#insights'],
              ['Contact', '#contact'],
            ]}
          />
          <div className="footer-column footer-contact-column">
            <h3>Connect With Me</h3>
            <div className="footer-contact-list">
              {footerContacts.map((contact) => (
                <a
                  key={contact.type}
                  className="footer-contact-item"
                  href={contact.url}
                  target={contact.type === 'linkedin' ? '_blank' : undefined}
                  rel={contact.type === 'linkedin' ? 'noreferrer' : undefined}
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
          <div className="footer-column">
            <h3>Location</h3>
            <p>Available for Nigerian and international projects.</p>
            <p>Remote-first creative technology support for founders, teams and organizations.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Beyond Microsoft (BMS). All rights reserved.</span>
          <span>Gabriel Owolabi - Creative Technologist & Founder</span>
          <span>Privacy Policy | Terms of Use</span>
        </div>
      </footer>

      {modal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setModal(null)} aria-label="Close dialog">
              x
            </button>
            {modal.type === 'article' && (
              <article>
                <span className="eyebrow">{modal.item.category}</span>
                <h2>{modal.item.title}</h2>
                <p>{modal.item.body}</p>
              </article>
            )}
            {modal.type === 'project' && (
              <article className="project-modal-content">
                <span className="eyebrow">{modal.item.category}</span>
                <h2>{modal.item.title}</h2>
                <span className={`project-status status-${modal.item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {modal.item.status}
                </span>
                <p>{modal.item.description}</p>
                {modal.item.technologies?.length > 0 && (
                  <div className="project-tech-wrap">
                    {modal.item.technologies.map((tag) => (
                      <span key={`${modal.item.title}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                )}
                {modal.item.projectUrl && (
                  <a className="btn primary" href={modal.item.projectUrl} target="_blank" rel="noreferrer">
                    Visit Project
                  </a>
                )}
              </article>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FooterColumn({ title, items }) {
  return (
    <div className="footer-column">
      <h3>{title}</h3>
      {items.map(([label, href]) => (
        <a key={`${title}-${label}`} href={href}>
          {label}
        </a>
      ))}
    </div>
  );
}

export default App;
