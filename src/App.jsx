import { useEffect, useMemo, useState } from 'react';
import {
  articles,
  certificates,
  experience,
  expertise,
  navItems,
  personal,
  portfolioFilters,
  process,
  projects,
  services,
  socials,
  solutions,
  testimonials,
  trustStrip,
} from './data/content';

const Icon = ({ name }) => {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.7',
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
    spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" />,
    merge: <path d="M6 4v6a4 4 0 0 0 4 4h8M14 10l4 4-4 4M18 4v5" />,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon" {...common}>
      {paths[name] || paths.spark}
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

function SectionHeading({ eyebrow, title, text, align = 'left' }) {
  return (
    <div className={`section-heading ${align === 'center' ? 'center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <span className="empty-mark">BMS</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeExpertise, setActiveExpertise] = useState('Creative');
  const [modal, setModal] = useState(null);
  const [formStatus, setFormStatus] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('bms-theme') || 'light';
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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
    if (activeFilter === 'All') return projects;
    return projects.filter((project) => project.category === activeFilter);
  }, [activeFilter]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('bms-theme', next);
  };

  const submitForm = (event) => {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      setFormStatus('Please complete the required fields before starting the conversation.');
      return;
    }
    setFormStatus('Your message is prepared. Connect an email/API service to send submissions in production.');
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

        <div className="nav-actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle dark and light mode">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <a className="btn primary small" href="#contact">
            Let's Work Together
          </a>
        </div>
      </header>

      <main>
        <section id="home" className="hero section">
          <div className="hero-grid">
            <div className="hero-copy reveal">
              <span className="eyebrow">Beyond Microsoft - BMS</span>
              <h1>
                Creativity Meets Technology.
                <span>Ideas Become Intelligent Solutions.</span>
              </h1>
              <p>{personal.intro}</p>
              <strong className="descriptor">{personal.descriptor}</strong>
              <div className="button-row">
                <a className="btn primary" href="#work">
                  Explore My Work
                </a>
                <a className="btn secondary" href="#contact">
                  Let's Work Together
                </a>
                <a className="text-link" href={personal.cvPath} download>
                  Download CV &rarr;
                </a>
              </div>
            </div>
            <div className="hero-visual reveal">
              <div className="node-field" aria-hidden="true">
                {Array.from({ length: 18 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
              <AssetImage src={personal.headerImage} alt="Gabriel Owolabi brand header" className="hero-image" fallback="BMS" />
              <div className="profile-chip">
                <AssetImage src={personal.profile} alt="Gabriel Owolabi portrait" className="chip-image" fallback="GO" />
                <span>
                  <strong>Gabriel Owolabi</strong>
                  <small>Creative Technologist</small>
                </span>
              </div>
              <div className="floating-card one">AI workflows</div>
              <div className="floating-card two">Brand systems</div>
              <div className="floating-card three">Web + software</div>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Core disciplines">
          <div className="marquee">
            {[...trustStrip, ...trustStrip].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </section>

        <section id="about" className="section intro-section">
          <div className="two-column">
            <div className="reveal">
              <SectionHeading eyebrow="Core Introduction" title="I Don't Just Build. I Connect Ideas." />
              <p>I believe the best solutions are born where creativity meets technology.</p>
              <p>
                My journey began with storytelling through design and words and evolved into a multidisciplinary
                approach combining copywriting, software development, web development, AI automation and brand design.
              </p>
              <p>
                Today, I transform ideas into practical digital experiences, intelligent workflows and compelling
                communication.
              </p>
              <div className="idea-flow" aria-label="Idea to impact process">
                {['Idea', 'Strategy', 'Creative', 'Technology', 'Impact'].map((step) => (
                  <span key={step}>{step}</span>
                ))}
              </div>
            </div>
            <div className="portrait-panel reveal">
              <AssetImage src={personal.profile} alt="Gabriel Owolabi" className="portrait-image" fallback="GO" />
            </div>
          </div>
        </section>

        <section className="section">
          <SectionHeading eyebrow="What I Help People Do" title="From Problems to Possibilities." align="center" />
          <div className="solution-grid">
            {solutions.map((solution) => (
              <article className="solution-card reveal" key={solution.title}>
                <span className="icon-wrap">
                  <Icon name={solution.icon} />
                </span>
                <h3>{solution.title}</h3>
                <p>{solution.text}</p>
                <a href="#services">Learn More</a>
              </article>
            ))}
          </div>
        </section>

        <section id="services" className="section services-section">
          <SectionHeading
            eyebrow="Services"
            title="What I Do"
            text="Different disciplines. One objective: turning ideas into meaningful outcomes."
          />
          <div className="service-stack">
            {services.map((service) => (
              <article className="service-card reveal" key={service.title}>
                <span className="service-number">{service.number}</span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                  <div className="tag-row">
                    {service.capabilities.map((capability) => (
                      <span key={capability}>{capability}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section signature-section">
          <SectionHeading eyebrow="Signature BMS Experience" title="Where Creativity Meets Technology." align="center" />
          <div className="fusion-system">
            <div className="fusion-side creative">
              <h3>Creative</h3>
              {['Storytelling', 'Copywriting', 'Brand', 'Design', 'Communication'].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="fusion-core">
              <strong>BMS</strong>
              <small>Intelligent Digital Solutions</small>
            </div>
            <div className="fusion-side technology">
              <h3>Technology</h3>
              {['Software', 'Web', 'AI', 'Automation', 'Digital systems'].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="section founder-section">
          <div className="two-column reverse">
            <div className="portrait-panel tilt reveal">
              <AssetImage src={personal.profile} alt="Gabriel Owolabi portrait" className="portrait-image" fallback="GO" />
            </div>
            <div className="reveal">
              <SectionHeading eyebrow="About Gabriel" title="Meet Gabriel." />
              <p>I'm Gabriel Owolabi, the creative technologist behind Beyond Microsoft (BMS).</p>
              <p>
                I work at the intersection of creativity and technology, combining communication, design, software
                development, web development and AI automation to transform ideas into practical solutions.
              </p>
              <p>I enjoy taking complex problems and finding simpler, clearer and more effective ways to solve them.</p>
              <blockquote>
                <strong>My Philosophy</strong>
                <span>{personal.philosophy}</span>
              </blockquote>
            </div>
          </div>
        </section>

        <section id="expertise" className="section expertise-section">
          <SectionHeading eyebrow="Expertise" title="A Multidisciplinary System." align="center" />
          <div className="expertise-layout">
            <div className="expertise-tabs" role="tablist" aria-label="Expertise categories">
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
            <div className="expertise-cloud" role="tabpanel">
              {expertise[activeExpertise].map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="section process-section">
          <SectionHeading eyebrow="My Approach" title="From Idea to Impact." align="center" />
          <div className="timeline">
            {process.map(([number, title, text]) => (
              <article className="timeline-item reveal" key={title}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="work" className="section work-section">
          <SectionHeading
            eyebrow="Featured Work"
            title="Work That Speaks."
            text="Ideas are important. Execution makes them real."
          />
          {projects[0] ? (
            <article className="featured-project">
              <AssetImage src={projects[0].cover} alt={projects[0].title} className="project-image" fallback="Case Study" />
              <div>
                <span className="eyebrow">{projects[0].category}</span>
                <h3>{projects[0].title}</h3>
                <p>{projects[0].description}</p>
                <button className="text-link" type="button" onClick={() => setModal({ type: 'project', item: projects[0] })}>
                  View Case Study &rarr;
                </button>
              </div>
            </article>
          ) : (
            <EmptyState
              title="Featured case study ready."
              text="Add verified project data in src/data/content.js or project-info.json files to publish real work without inventing outcomes."
            />
          )}

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

          {filteredProjects.length ? (
            <div className="portfolio-grid">
              {filteredProjects.map((project) => (
                <article className="portfolio-card" key={project.title}>
                  <AssetImage src={project.cover} alt={project.title} className="portfolio-image" fallback="Project" />
                  <span>{project.category}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <button type="button" onClick={() => setModal({ type: 'project', item: project })}>
                    View Case Study
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Portfolio system ready."
              text="Drop project assets into /assets/portfolio and add verified project details to publish filterable case studies."
            />
          )}
        </section>

        <section id="credentials" className="section credentials-section">
          <SectionHeading eyebrow="Credentials" title="Credentials & Continuous Learning" />
          {certificates.length ? (
            <div className="certificate-grid">
              {certificates.map((certificate) => (
                <button
                  className="certificate-card"
                  key={certificate.title}
                  type="button"
                  onClick={() => setModal({ type: 'certificate', item: certificate })}
                >
                  <AssetImage src={certificate.image} alt={certificate.title} className="certificate-image" fallback="Certificate" />
                  <h3>{certificate.title}</h3>
                  <p>{certificate.issuer}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Credential gallery ready."
              text="Add certificate images and verified metadata before publishing credentials."
            />
          )}
        </section>

        <section className="section cv-card-section">
          <div className="cv-panel">
            <div>
              <span className="eyebrow">CV</span>
              <h2>Want the Full Story?</h2>
              <p>Explore my professional background, skills, experience and learning journey.</p>
            </div>
            <div className="button-row">
              <a className="btn secondary" href={personal.cvPath} target="_blank" rel="noreferrer">
                View CV
              </a>
              <a className="btn primary" href={personal.cvPath} download>
                Download CV
              </a>
            </div>
          </div>
        </section>

        <section className="section card-section">
          <div className="two-column">
            <div>
              <SectionHeading eyebrow="Visual Identity" title="Beyond the Screen." />
              <p>A dedicated space for Gabriel's complimentary card and brand touchpoints.</p>
              <button className="btn secondary" type="button" onClick={() => setModal({ type: 'card' })}>
                View My Card
              </button>
            </div>
            <button className="business-card tilt" type="button" onClick={() => setModal({ type: 'card' })}>
              <AssetImage src={personal.card} alt="Beyond Microsoft complimentary card" className="card-image" fallback="BMS Card" />
            </button>
          </div>
        </section>

        <section className="section journey-section">
          <SectionHeading eyebrow="Journey" title="The Journey So Far." />
          {experience.length ? (
            <div className="journey-list">
              {experience.map((item) => (
                <article key={`${item.year}-${item.role}`}>
                  <span>{item.year}</span>
                  <h3>{item.role}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Experience timeline ready."
              text="Add verified roles, organizations, projects and skills developed when Gabriel is ready to publish them."
            />
          )}
        </section>

        <section id="insights" className="section insights-section">
          <SectionHeading
            eyebrow="Insights"
            title="Thinking Beyond the Build."
            text="Ideas, lessons and observations from the intersection of technology, creativity, AI and professional growth."
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

        {testimonials.length > 0 && (
          <section className="section testimonials-section">
            <SectionHeading eyebrow="Testimonials" title="What People Say." />
          </section>
        )}

        <section id="contact" className="section contact-section">
          <div className="contact-layout">
            <div>
              <SectionHeading
                eyebrow="Contact"
                title="Have an Idea Worth Building?"
                text="Tell me what you're trying to build, improve or automate. Let's explore what technology and creativity can make possible."
              />
            </div>
            <form className="contact-form" onSubmit={submitForm} noValidate={false}>
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
                <input name="company" type="text" placeholder="Company or organization" />
              </label>
              <label>
                Service
                <select name="service" required defaultValue="">
                  <option value="" disabled>
                    Select a service
                  </option>
                  {[
                    'Copywriting',
                    'AI Automation',
                    'Web Development',
                    'Software Development',
                    'Brand Design',
                    'Graphic Design',
                    'Digital Solution',
                    'Collaboration',
                    'Other',
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
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
                Start the Conversation &rarr;
              </button>
              {formStatus && <p className="form-status" role="status">{formStatus}</p>}
            </form>
          </div>
        </section>

        <section className="section premium-cta">
          <h2>Ready to Build Something Remarkable?</h2>
          <p>Let's turn your ideas, challenges and opportunities into practical digital experiences and intelligent solutions.</p>
          <div className="button-row">
            <a className="btn light" href="#contact">
              Start the Conversation &rarr;
            </a>
            <a className="btn ghost" href="#work">
              Explore My Work
            </a>
          </div>
          <small>Creativity gives ideas a voice. Technology gives them the power to move.</small>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <AssetImage src={personal.logo} alt="" className="footer-logo" fallback="BMS" />
            <h2>Beyond Microsoft (BMS)</h2>
            <p>Gabriel Owolabi - Creative Technologist</p>
            <p>Creativity, technology and intelligent solutions - built to move ideas forward.</p>
            <div className="social-row">
              {socials.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label}>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          <FooterColumn title="Explore" items={navItems.map(([label, id]) => [label, `#${id}`])} />
          <FooterColumn title="Services" items={services.map((service) => [service.title.replace(' & Strategic Communication', ''), '#services'])} />
          <FooterColumn title="Resources" items={[['My CV', personal.cvPath], ['Certifications', '#credentials'], ['Case Studies', '#work'], ['Insights', '#insights'], ['Portfolio', '#work'], ['Articles', '#insights']]} />
          <div className="footer-column">
            <h3>Stay Connected</h3>
            <p>Follow the journey, explore new ideas and stay connected with Beyond Microsoft.</p>
            <form className="subscribe-form">
              <label className="sr-only" htmlFor="footer-email">Your email</label>
              <input id="footer-email" type="email" placeholder="Your email" />
              <button type="button" aria-label="Subscribe">&rarr;</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Beyond Microsoft (BMS). All rights reserved.</span>
          <span>Gabriel Owolabi - Creative Technologist</span>
          <span>Privacy Policy | Terms of Use</span>
        </div>
      </footer>

      {modal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setModal(null)} aria-label="Close dialog">
              x
            </button>
            {modal.type === 'card' && (
              <AssetImage src={personal.card} alt="Beyond Microsoft complimentary card" className="modal-image" fallback="BMS Card" />
            )}
            {modal.type === 'article' && (
              <article>
                <span className="eyebrow">{modal.item.category}</span>
                <h2>{modal.item.title}</h2>
                <p>{modal.item.body}</p>
              </article>
            )}
            {modal.type === 'project' && (
              <article>
                <span className="eyebrow">{modal.item.category}</span>
                <h2>{modal.item.title}</h2>
                <p>{modal.item.description}</p>
                <dl className="case-study-list">
                  {['problem', 'strategy', 'solution', 'technology', 'design', 'implementation', 'outcome'].map((key) => (
                    modal.item[key] ? (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>{modal.item[key]}</dd>
                      </div>
                    ) : null
                  ))}
                </dl>
              </article>
            )}
            {modal.type === 'certificate' && (
              <article>
                <AssetImage src={modal.item.image} alt={modal.item.title} className="modal-image" fallback="Certificate" />
                <h2>{modal.item.title}</h2>
                <p>{modal.item.issuer}</p>
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
