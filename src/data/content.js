export const personal = {
  brand: 'Beyond Microsoft',
  shortBrand: 'BMS',
  founder: 'Gabriel Owolabi',
  title: 'Creative Technologist',
  positioning: 'Elevating Standards. Enhancing Quality.',
  supportingPositioning: 'Where Creativity Meets Technology.',
  descriptor:
    'Creative Technologist & Founder of Beyond Microsoft',
  intro:
    "I'm Gabriel Owolabi, a Creative Technologist and the founder of Beyond Microsoft (BMS). I combine an engineering background with creativity and technology to build brands, digital experiences, software solutions and automation systems that create real value.",
  founderBio: [
    'I’m Gabriel Owolabi, a Creative Technologist and the founder of Beyond Microsoft (BMS).',
    'My journey didn’t start in technology. I come from an engineering background, with hands-on experience in metal fabrication and construction. Working with my hands taught me precision, problem-solving, patience, creativity, and the importance of turning ideas into something real.',
    'Over time, that same mindset led me into technology. I began exploring graphic design, branding, web development, software engineering, programming, copywriting, and AI automation. What started as curiosity gradually became a deeper passion for using technology to solve problems, build useful products, and help businesses grow.',
    'Today, through Beyond Microsoft, I combine creativity, engineering thinking, and technology to build brands, digital experiences, software solutions, and automation systems that create real value.',
    'I believe my background is not something I left behind—it is part of what shaped the way I build today.',
    'From metal fabrication to digital products, the principle remains the same: take an idea, understand the problem, build with precision, and create something that works.',
  ],
  philosophy:
    'Technology should not make things more complicated. It should make possibilities simpler.',
  // contact@beyondmicrosoft.com is the intended long-term business address,
  // but that inbox isn't live yet — using the working Gmail until it is.
  email: 'beyondmsoft@gmail.com',
  cvPath: '/assets/documents/gabriel-cv.pdf',
  // Official transparent BMS mark, used for the sidebar/mobile header logo
  // (site-wide "home" link) and the favicon set generated from it.
  logo: '/assets/brand/bms-logo-transparent.png',
  logoSvg: '/assets/brand/bms-logo-transparent.png',
  headshot: '/assets/profile/gabriel-profile.jpg.jpg',
  profile: '/assets/profile/gabriel-profile.jpg.jpg',
  headerImage: '/assets/profile/gabriel-profile.jpg.jpg',
  // Official 2026 physical brand identity artwork (complimentary card +
  // sticker), also reused as the Design/Copywriting service card imagery
  // below — the older /assets/design/bms-*.jpg renders are retired.
  card: '/assets/branding/bms-card-front.jpg',
  cardBack: '/assets/branding/bms-card-back.jpg',
  sticker: '/assets/branding/bms-sticker.jpg',
};

export const navItems = [
  ['Home', 'home'],
  ['About', 'about'],
  ['Services', 'services'],
  ['Work', 'work'],
  ['Insights', 'insights'],
  ['Contact', 'contact'],
];

// Sidebar catalog navigation. `filter` maps a category to a project-grid
// filter value from `portfolioFilters`; `section` scrolls to a page section.
export const sidebarCategories = [
  { key: 'all', label: 'All', icon: 'grid', section: 'work', filter: 'All' },
  // `projects` now includes an AI Automation card derived from
  // `automationLab` (see below), so filtering the work grid by category
  // 'AI Automation' resolves correctly again.
  { key: 'ai', label: 'AI & Automation', icon: 'spark', section: 'work', filter: 'AI Automation' },
  { key: 'web', label: 'Web', icon: 'globe', section: 'work', filter: 'Web Development' },
  { key: 'software', label: 'Software', icon: 'code', section: 'work', filter: 'Application Development' },
  { key: 'branding', label: 'Branding', icon: 'layers', section: 'work', filter: 'Brand Design' },
  { key: 'design', label: 'Design', icon: 'pen', section: 'work', filter: 'Graphic Design' },
  { key: 'copywriting', label: 'Copywriting', icon: 'message', section: 'copywriting', filter: 'All' },
  { key: 'marketing', label: 'Marketing', icon: 'megaphone', section: 'services', filter: 'All' },
  { key: 'portfolio', label: 'Portfolio', icon: 'briefcase', section: 'work', filter: 'All' },
  { key: 'digital-products', label: 'Digital Products', icon: 'cube', section: 'work', filter: 'Application Development' },
  { key: 'insights', label: 'Insights', icon: 'file', section: 'insights', filter: 'All' },
  { key: 'credentials', label: 'Credentials', icon: 'file', section: 'credentials', filter: 'All' },
  { key: 'testimonials', label: 'Testimonials', icon: 'message', section: 'testimonials', filter: 'All' },
  { key: 'about', label: 'About', icon: 'person', section: 'about', filter: 'All' },
  { key: 'contact', label: 'Contact', icon: 'message', section: 'contact', filter: 'All' },
];

// Flat, real technology list (no fabricated proficiency levels).
export const techStack = [
  'HTML',
  'CSS',
  'JavaScript',
  'PHP',
  'Python',
  'Laravel',
  'Node.js',
  'Express.js',
  'MongoDB',
  'Git',
  'GitHub',
  'VS Code',
  'n8n',
  'OpenAI',
  'Microsoft Copilot',
  'ChatGPT',
  'Photoshop',
  'Illustrator',
  'CorelDRAW',
  'Canva',
  'Figma',
  'Microsoft 365',
  'Google Workspace',
];

// AI Automation Lab — trigger -> logic -> automation -> result, built from
// verified project/service data only.
export const automationLab = [
  {
    title: 'Cross-Border Customs Compliance Workflow',
    trigger: 'New shipment document received',
    logic: 'AI reads and classifies the document against compliance rules',
    automation: 'n8n routes data, flags exceptions and updates records',
    result: 'Faster compliance checks with less manual review',
    image: '/assets/automation/customs-compliance-flow.png',
    gallery: [
      '/assets/automation/gallery/customs-compliance-flow.png',
      '/assets/automation/gallery/worlflowssss.png',
      '/assets/automation/gallery/screenshot-2026-06-16-165158-125616.png',
      '/assets/automation/gallery/screenshot-2026-07-07-040905-121114.png',
      '/assets/automation/gallery/screenshot-2026-07-07-040944-121026.png',
      '/assets/automation/gallery/screenshot-2026-08-03-000645-081430.png',
    ],
    reportUrl: '/assets/documents/cross-border-export-compliance-auditor-report.pdf',
  },
];

// Certificates load from /assets/certificates. Metadata (organization, date,
// credential ID, verification link) is left blank until it can be reliably
// confirmed — never fabricated. The PDF itself is still viewable.
export const certificates = [
  {
    title: 'AI Automation Certificate',
    organization: '',
    date: '',
    credentialId: '',
    verificationUrl: '',
    file: '/assets/certificates/certificate-ai-automation.pdf',
  },
  {
    title: 'Dominate With Copywriting Certificate',
    organization: '',
    date: '',
    credentialId: '',
    verificationUrl: '',
    file: '/assets/certificates/dominate-with-copywriting-certificate.pdf',
  },
  {
    title: 'Gabriel Owolabi — Certificate',
    organization: '',
    date: '',
    credentialId: '',
    verificationUrl: '',
    file: '/assets/certificates/gabriel-owolabi-certificate.pdf',
  },
];

// Real client-feedback screenshots. No names/organizations were legible in
// the supplied material, so none are invented — shown as anonymous feedback.
export const testimonialShots = [
  '/assets/testimonials/screenshot-20260702-162301.png',
  '/assets/testimonials/screenshot-20260702-164835.png',
  '/assets/testimonials/screenshot-20260702-164911.png',
  '/assets/testimonials/screenshot-20260702-165527.png',
  '/assets/testimonials/screenshot-20260702-165616.png',
  '/assets/testimonials/screenshot-20260702-183220.png',
  '/assets/testimonials/screenshot-20260703-075403.png',
  '/assets/testimonials/screenshot-20260703-084814.png',
  '/assets/testimonials/screenshot-20260703-162215.png',
  '/assets/testimonials/screenshot-20260712-213903.png',
  '/assets/testimonials/screenshot-20260808-234204.png',
];

// Copywriting samples — real supplied documents only.
export const copywritingItems = [
  {
    title: '30-Day Short-Form Social Media Content Plan — WELLORA',
    category: 'Social Content',
    description: 'A 30-day short-form content plan built for the WELLORA brand.',
    file: '/assets/documents/copywriting/wellora-30-day-social-content-plan.pdf',
  },
  {
    title: "A Beginner's Step-by-Step Guide to Remote Work",
    category: 'Content Writing',
    description: 'A structured guide walking beginners through starting remote work.',
    file: '/assets/documents/copywriting/beginners-guide-to-remote-work.pdf',
  },
  {
    title: 'If Your Parents Were Never Financially Successful...',
    category: 'Content Writing',
    description: 'A perspective piece on financial advice and where to actually source it from.',
    file: '/assets/documents/copywriting/financial-advice-from-parents.pdf',
  },
  {
    title: 'Capstone',
    category: 'Strategic Copy',
    description: 'A capstone writing project.',
    file: '/assets/documents/copywriting/capstone.docx',
  },
];

export const trustStrip = [
  'Brand Strategy',
  'Web Design',
  'AI Automation',
  'Copywriting',
  'Digital Strategy',
  'Technology Consulting',
];

export const problems = [
  {
    title: 'Weak digital presence',
    text: 'A business can be excellent offline and still lose trust online when the brand, website and message feel unclear.',
    icon: 'window',
  },
  {
    title: 'Manual work slows growth',
    text: 'Repetitive processes consume time that founders and teams could use for sales, service and strategy.',
    icon: 'flow',
  },
  {
    title: 'Unclear messaging',
    text: 'Many businesses know their value but struggle to explain it simply, persuasively and consistently.',
    icon: 'message',
  },
  {
    title: 'Disconnected tools',
    text: 'Websites, content, forms, data and operations often sit in separate places instead of working together.',
    icon: 'merge',
  },
  {
    title: 'No technical team',
    text: 'Growing organizations need capable digital solutions without immediately hiring a full in-house team.',
    icon: 'code',
  },
];

export const pillars = [
  {
    title: 'Build',
    icon: 'spark',
    text: 'Create professional brands, websites and digital experiences that make your business look credible and memorable.',
  },
  {
    title: 'Automate',
    icon: 'flow',
    text: 'Design AI-powered workflows and process automation that help teams save time and operate with more clarity.',
  },
  {
    title: 'Communicate',
    icon: 'message',
    text: 'Shape copy, messaging and content systems that make your value easier to understand and act on.',
  },
];

export const solutions = [
  {
    title: 'Communicate Better',
    icon: 'message',
    text: 'Strategic copywriting and communication that makes ideas clearer and more persuasive.',
  },
  {
    title: 'Build Digital Experiences',
    icon: 'window',
    text: 'Responsive websites and web applications designed around real user and business needs.',
  },
  {
    title: 'Automate Repetitive Work',
    icon: 'flow',
    text: 'AI-powered workflows that reduce manual processes and improve operational efficiency.',
  },
  {
    title: 'Develop Software',
    icon: 'code',
    text: 'Practical software solutions designed to solve real-world problems.',
  },
  {
    title: 'Build Stronger Brands',
    icon: 'spark',
    text: 'Visual identities and communication systems that create consistency and recognition.',
  },
  {
    title: 'Turn Ideas Into Solutions',
    icon: 'merge',
    text: 'Technology-driven solutions that connect strategy, creativity and execution.',
  },
];

export const services = [
  {
    number: '01',
    title: 'Design',
    text: 'Brand identity, marketing creatives and visual communication systems built to make businesses feel premium and memorable.',
    icon: 'spark',
    image: '/assets/branding/bms-sticker.jpg',
    capabilities: ['Graphic design', 'Brand identity', 'Marketing design', 'Social media creative', 'Print design'],
  },
  {
    number: '02',
    title: 'AI & Automation',
    text: 'AI-powered workflows and business process automation that reduce repetitive tasks and connect your tools into one system.',
    icon: 'flow',
    image: '/assets/automation/customs-compliance-flow.png',
    capabilities: ['n8n workflows', 'AI automation', 'Process optimization', 'System integration', 'Operational efficiency'],
  },
  {
    number: '03',
    title: 'Web & Application Development',
    text: 'Responsive websites and digital experiences designed for clarity, trust and conversion across devices.',
    icon: 'window',
    image: '/assets/projects/furniture-website-screenshot.png',
    capabilities: ['Landing pages', 'Web apps', 'UI/UX', 'Responsive design', 'Frontend implementation'],
  },
  {
    number: '04',
    title: 'Copywriting',
    text: 'Messaging and strategic communication that help founders and brands explain their value with clarity and confidence.',
    icon: 'message',
    image: '/assets/branding/bms-card-back.jpg',
    capabilities: ['Website copy', 'Brand messaging', 'Sales copy', 'Content strategy', 'Storytelling'],
  },
];

export const expertise = {
  Creative: ['Copywriting', 'Brand Design', 'Graphic Design', 'Storytelling', 'Visual Communication'],
  Technology: ['Web Development', 'Software Development', 'Laravel', 'Node.js', 'Express.js', 'MongoDB'],
  'AI & Automation': [
    'AI Automation',
    'n8n',
    'Workflow Automation',
    'AI-powered solutions',
    'Process Optimization',
  ],
  Digital: ['Digital Experiences', 'Responsive Design', 'Technology Strategy', 'Problem Solving'],
};

export const process = [
  ['01', 'Discover', 'Understand the problem, audience, goals and desired outcome.'],
  ['02', 'Design', 'Translate the challenge into a clear strategy and solution architecture.'],
  ['03', 'Build', 'Create the website, software, automation, communication or brand solution.'],
  ['04', 'Evolve', 'Test, refine, optimize and improve the solution over time.'],
];

const GALLERY_BRANDING = [
  '/assets/portfolio/branding-collection/20251109-073242.jpg',
  '/assets/portfolio/branding-collection/20251109-073246.jpg',
  '/assets/portfolio/branding-collection/20251117-220434.jpg',
  '/assets/portfolio/branding-collection/20251117-220444.jpg',
  '/assets/portfolio/branding-collection/20251204-224954.jpg',
  '/assets/portfolio/branding-collection/20251204-225031.jpg',
  '/assets/portfolio/branding-collection/20251204-225040.jpg',
  '/assets/portfolio/branding-collection/20251218-185403.jpg',
  '/assets/portfolio/branding-collection/20251218-185408.jpg',
  '/assets/portfolio/branding-collection/20251218-185414.jpg',
  '/assets/portfolio/branding-collection/20251218-185419.jpg',
  '/assets/portfolio/branding-collection/20251224-022300.jpg',
  '/assets/portfolio/branding-collection/20251224-022305.jpg',
  '/assets/portfolio/branding-collection/20260113-233745.jpg',
  '/assets/portfolio/branding-collection/20260113-233752.jpg',
  '/assets/portfolio/branding-collection/20260113-233859.jpg',
  '/assets/portfolio/branding-collection/20260113-234620.jpg',
  '/assets/portfolio/branding-collection/20260119-075202.jpg',
  '/assets/portfolio/branding-collection/20260119-075314.jpg',
  '/assets/portfolio/branding-collection/20260119-075552.jpg',
  '/assets/portfolio/branding-collection/20260123-163658.jpg',
  '/assets/portfolio/branding-collection/20260123-163706.jpg',
  '/assets/portfolio/branding-collection/20260123-163711.jpg',
  '/assets/portfolio/branding-collection/20260312-194826.jpg',
  '/assets/portfolio/branding-collection/20260411-170332.jpg',
  '/assets/portfolio/branding-collection/20260411-170334.jpg',
  '/assets/portfolio/branding-collection/20260411-170336.jpg',
  '/assets/portfolio/branding-collection/20260411-170340.jpg',
  '/assets/portfolio/branding-collection/20260411-171419.jpg',
  '/assets/portfolio/branding-collection/20260605-190150.jpg',
  '/assets/portfolio/branding-collection/20260605-190155.jpg',
  '/assets/portfolio/branding-collection/20260605-190159.jpg',
  '/assets/portfolio/branding-collection/20260605-190205.jpg',
  '/assets/portfolio/branding-collection/20260619-122123.jpg',
  '/assets/portfolio/branding-collection/ben-101-084124.png',
  '/assets/portfolio/branding-collection/fb-img-1747354303427.jpg',
  '/assets/portfolio/branding-collection/ho-lwijxkaaxr10.jpg',
  '/assets/portfolio/branding-collection/hsly4e6xaaadxpt.jpg',
  '/assets/portfolio/branding-collection/hsly4fca8aahjmi.jpg',
  '/assets/portfolio/branding-collection/image.jpg',
  '/assets/portfolio/branding-collection/image0001.jpg',
  '/assets/portfolio/branding-collection/img-20251231-wa0034.jpg',
  '/assets/portfolio/branding-collection/img-20260814-wa0014.jpg',
  '/assets/portfolio/branding-collection/ms4.jpg',
  '/assets/portfolio/branding-collection/screenshot-20250411-001742.png',
  '/assets/portfolio/branding-collection/screenshot-20250624-093243.png',
  '/assets/portfolio/branding-collection/screenshot-20260209-055136.png',
  '/assets/portfolio/branding-collection/screenshot-20260624-211042.png',
  '/assets/portfolio/branding-collection/screenshot-20260729-091954.png',
  '/assets/portfolio/branding-collection/screenshot-20260810-133845.png',
];

const GALLERY_LOGO = [
  '/assets/portfolio/logo-collection/20251116-054327.jpg',
  '/assets/portfolio/logo-collection/20260224-183304.jpg',
  '/assets/portfolio/logo-collection/20260417-001943.jpg',
  '/assets/portfolio/logo-collection/20260417-001956.jpg',
  '/assets/portfolio/logo-collection/20260417-002356.jpg',
  '/assets/portfolio/logo-collection/20260417-002358.jpg',
  '/assets/portfolio/logo-collection/20260417-002401.jpg',
  '/assets/portfolio/logo-collection/20260417-002403.jpg',
  '/assets/portfolio/logo-collection/image.jpg',
  '/assets/portfolio/logo-collection/img-20260225-232837.jpg',
  '/assets/portfolio/logo-collection/img-20260422-222151.jpg',
  '/assets/portfolio/logo-collection/projectlabub.jpg',
  '/assets/portfolio/logo-collection/screenshot-20250304-180801-2.png',
  '/assets/portfolio/logo-collection/screenshot-20260320-155944.png',
  '/assets/portfolio/logo-collection/screenshot-20260320-160206.png',
];

const GALLERY_UIUX = [
  '/assets/portfolio/uiux-collection/screenshot-20260223-194632.png',
  '/assets/portfolio/uiux-collection/screenshot-20260223-194638.png',
  '/assets/portfolio/uiux-collection/screenshot-20260223-194642.png',
  '/assets/portfolio/uiux-collection/screenshot-20260223-194646.png',
  '/assets/portfolio/uiux-collection/screenshot-20260223-194649.png',
  '/assets/portfolio/uiux-collection/screenshot-20260223-194652.png',
  '/assets/portfolio/uiux-collection/screenshot-20260223-194655.png',
  '/assets/portfolio/uiux-collection/screenshot-20260223-194657.png',
  '/assets/portfolio/uiux-collection/screenshot-20260913-110546.png',
  '/assets/portfolio/uiux-collection/screenshot-20260913-111014.png',
  '/assets/portfolio/uiux-collection/screenshot-20260913-111025.png',
  '/assets/portfolio/uiux-collection/screenshot-20260913-111030.png',
  '/assets/portfolio/uiux-collection/screenshot-20260913-111047.png',
];

const GALLERY_GRAPHIC = [
  '/assets/portfolio/signage-collection/img-20260719-wa0042.jpg',
  '/assets/portfolio/signage-collection/screenshot-20260615-130203.png',
  '/assets/portfolio/signage-collection/screenshot-20260907-083645.png',
  '/assets/portfolio/social-media-collection/20251010-212452.jpg',
  '/assets/portfolio/social-media-collection/20260113-233836.jpg',
  '/assets/portfolio/website-layout-collection/20251103-190257.jpg',
  '/assets/portfolio/website-layout-collection/20251116-054539.jpg',
  '/assets/portfolio/website-layout-collection/20260508-101239.jpg',
  '/assets/portfolio/mockup-collection/20260211-193701.jpg',
  '/assets/portfolio/mockup-collection/20260619-122128.jpg',
  '/assets/portfolio/mockup-collection/20260619-122134.jpg',
  '/assets/portfolio/mockup-collection/20260619-122139.jpg',
  '/assets/portfolio/book-cover/now-available.jpg',
];

export const projects = [
  {
    title: 'ABJ Foundation',
    category: 'Web Development',
    description: 'A web presence built around clarity, mission and trust for a humanitarian organization helping the needy, widows, children and vulnerable communities.',
    status: 'In Development',
    featured: true,
    image: '/assets/portfolio/websites-gallery/screenshot-2026-09-17-042819.png',
    gallery: ['/assets/portfolio/websites-gallery/screenshot-2026-09-17-042819.png'],
    technologies: ['Web Design', 'Brand Communication', 'Responsive Layout'],
    projectUrl: 'https://abjfondation.netlify.app/',
    size: 'wide',
  },
  {
    title: 'Beyond Microsoft',
    category: 'Web Development',
    description: 'The BMS personal brand and creative technology catalog platform, in active development.',
    status: 'In Development',
    featured: true,
    image: '/assets/portfolio/websites-gallery/screenshot-2026-09-17-043326.png',
    gallery: ['/assets/portfolio/websites-gallery/screenshot-2026-09-17-043326.png'],
    technologies: ['Brand Website', 'Creative Tech', 'Portfolio System'],
    projectUrl: 'https://beyondmsoft.netlify.app/',
  },
  {
    title: 'Lutapp',
    category: 'Application Development',
    description: 'A software application currently in development. No screenshots or public build are available yet.',
    status: 'In Development',
    featured: false,
    // No real Lutapp screenshot exists yet — leaving `image` unset so the
    // card shows an honest text fallback instead of an unrelated asset.
    technologies: ['Application Development'],
    projectUrl: '',
  },
  {
    title: 'GHOFA',
    category: 'Brand Design',
    description: '"Fashion for the Fearless" — a fashion brand identity built around a logo mark combining wool, a threaded needle and a technology symbol.',
    status: 'Concept',
    featured: true,
    image: '/assets/portfolio/ghofa/image.jpg',
    gallery: [
      '/assets/portfolio/ghofa/image.jpg',
      '/assets/portfolio/ghofa/image0001.jpg',
      '/assets/portfolio/ghofa/screenshot-20250913-191954.png',
      '/assets/portfolio/ghofa/screenshot-20250913-191959.png',
      '/assets/portfolio/ghofa/screenshot-20250913-192017.png',
    ],
    technologies: ['Logo Design', 'Brand Identity', 'Mockups'],
    projectUrl: '',
    size: 'tall',
  },
  {
    title: "Sol Villa's",
    category: 'Brand Design',
    description: 'A full luxury real-estate brand identity — "Luxury, Home & Culture." Logo system, color palette, typography and applied billboard, signage and door-hanger mockups.',
    status: 'Completed',
    featured: true,
    image: '/assets/portfolio/sol-villas/20251103-183813.jpg',
    gallery: [
      '/assets/portfolio/sol-villas/20251103-183813.jpg',
      '/assets/portfolio/sol-villas/20251103-183816.jpg',
      '/assets/portfolio/sol-villas/20251103-183818.jpg',
      '/assets/portfolio/sol-villas/20251103-183821.jpg',
    ],
    technologies: ['Brand Strategy', 'Visual Identity', 'Typography', 'Applied Mockups'],
    projectUrl: '',
    size: 'featured',
  },
  {
    title: 'Landnest Homes & Properties',
    category: 'Graphic Design',
    description: 'Promotional marketing graphics and campaign flyers for a real-estate brand, including festive-season pricing promos across multiple estate listings.',
    status: 'Completed',
    featured: true,
    image: '/assets/portfolio/landnest/screenshot-20260119-143936.png',
    gallery: [
      '/assets/portfolio/landnest/screenshot-20260119-143936.png',
      '/assets/portfolio/landnest/screenshot-20260202-231301.png',
      '/assets/portfolio/landnest/screenshot-20260202-231305.png',
      '/assets/portfolio/landnest/screenshot-20260202-231310.png',
    ],
    technologies: ['Marketing Design', 'Campaign Graphics', 'Social Media'],
    projectUrl: '',
  },
  {
    title: 'LED Video Wall Installation',
    category: 'Featured Project',
    description: 'End-to-end build of a large-format LED video wall for a control/operations room — from panel assembly and rack wiring to a live, powered display.',
    status: 'Completed',
    featured: true,
    image: '/assets/portfolio/led-installation/f39b650a96bd884c719d1152888e97c4.png',
    gallery: [
      '/assets/portfolio/led-installation/01d4d5b294c7042c2ad29565a3b412bd.png',
      '/assets/portfolio/led-installation/1b8a59f12dd12d17a86dad5678317568.png',
      '/assets/portfolio/led-installation/50f3538348c155bb40c2273b8b013299.png',
      '/assets/portfolio/led-installation/52783983b5d6f336c51f8d8ce36a9791.png',
      '/assets/portfolio/led-installation/529b4deebd8eafefde15efe36e8b6956.png',
      '/assets/portfolio/led-installation/ed3a9273884dce3b4523ad645ef30e27.png',
      '/assets/portfolio/led-installation/f39b650a96bd884c719d1152888e97c4.png',
      '/assets/portfolio/led-installation/screenshot-20260628-114448.png',
      '/assets/portfolio/led-installation/screenshot-20260628-114452.png',
      '/assets/portfolio/led-installation/screenshot-20260628-114454.png',
      '/assets/portfolio/led-installation/screenshot-20260628-114457.png',
      '/assets/portfolio/led-installation/screenshot-20260628-114459.png',
      '/assets/portfolio/led-installation/screenshot-20260628-114504.png',
      '/assets/portfolio/led-installation/screenshot-20260628-114506.png',
      '/assets/portfolio/led-installation/screenshot-20260628-114509.png',
      '/assets/portfolio/led-installation/screenshot-20260628-114516.png',
      '/assets/portfolio/led-installation/screenshot-20260628-114519.png',
    ],
    video: '/assets/portfolio/led-installation/screen-20260628-152938-2.mp4',
    technologies: ['LED Hardware', 'Rack & Network Wiring', 'System Installation'],
    projectUrl: '',
    size: 'wide',
  },
  {
    title: 'Branding & Identity Collection',
    category: 'Brand Design',
    description: 'An archive of branding and print design work across multiple clients and concepts — logos applied to real-world print, signage and packaging contexts.',
    status: 'Ongoing',
    featured: false,
    image: '/assets/portfolio/branding-collection/20260605-190150.jpg',
    gallery: GALLERY_BRANDING,
    technologies: ['Brand Identity', 'Print Design'],
    projectUrl: '',
  },
  {
    title: 'Logo Design Collection',
    category: 'Graphic Design',
    description: 'A collection of logo design concepts and finished marks created across different briefs.',
    status: 'Ongoing',
    featured: false,
    image: '/assets/portfolio/logo-collection/20260417-001943.jpg',
    gallery: GALLERY_LOGO,
    technologies: ['Logo Design', 'Visual Identity'],
    projectUrl: '',
  },
  {
    title: 'Mobile App UI/UX Collection',
    category: 'Graphic Design',
    description: 'Mobile application interface and user-experience design explorations.',
    status: 'Ongoing',
    featured: false,
    image: '/assets/portfolio/uiux-collection/screenshot-20260913-110546.png',
    gallery: GALLERY_UIUX,
    technologies: ['UI Design', 'UX Design', 'Mobile'],
    projectUrl: '',
  },
  {
    title: 'Graphic Design Collection',
    category: 'Graphic Design',
    description: 'Signage, social media graphics, website layout concepts, mockups and a book cover design, grouped as a single design archive.',
    status: 'Ongoing',
    featured: false,
    image: '/assets/portfolio/book-cover/now-available.jpg',
    gallery: GALLERY_GRAPHIC,
    technologies: ['Signage', 'Social Media Design', 'Mockups', 'Book Cover'],
    projectUrl: '',
  },
  // AI Automation and Copywriting portfolio cards are derived from
  // `automationLab` and `copywritingItems` (each defined above) rather than
  // duplicated here, so the Portfolio grid, the AI & Automation Lab and the
  // Copywriting section all read from a single source of truth per project.
  ...automationLab.map((flow) => ({
    title: flow.title,
    category: 'AI Automation',
    description: `${flow.trigger} → ${flow.logic} → ${flow.automation} → ${flow.result}`,
    status: 'Completed',
    featured: false,
    image: flow.image,
    gallery: flow.gallery,
    technologies: ['n8n', 'AI Automation', 'Workflow Automation'],
    projectUrl: '',
    reportUrl: flow.reportUrl,
    // Lets the project modal offer a "View Case Study" link into the
    // deeper Lab presentation instead of duplicating its content here.
    caseStudySection: 'ai-lab',
  })),
  ...copywritingItems.map((item) => ({
    title: item.title,
    category: 'Copywriting',
    description: item.description,
    status: 'Completed',
    featured: false,
    technologies: [item.category],
    projectUrl: '',
    reportUrl: item.file,
    caseStudySection: 'copywriting',
  })),
];

export const portfolioFilters = [
  'All',
  'AI Automation',
  'Web Development',
  'Application Development',
  'Brand Design',
  'Graphic Design',
  'Copywriting',
  'Featured Project',
];

export const experience = [];

export const articles = [
  {
    category: 'AI',
    date: 'Draft',
    title: 'How Creativity Shapes Better AI Automation',
    excerpt:
      'A publishing-ready article slot for future observations on useful, human-centered automation.',
    readTime: 'Ready for content',
    slug: 'creativity-and-ai-automation',
    body:
      'This article page is prepared for Gabriel to add original insight without fabricating credentials, clients or results.',
  },
  {
    category: 'Design',
    date: 'Draft',
    title: 'Why Clear Communication Belongs in Every Digital Product',
    excerpt:
      'A future essay space for lessons from the intersection of copywriting, design and software.',
    readTime: 'Ready for content',
    slug: 'communication-in-digital-products',
    body:
      'This draft page keeps the editorial system alive while waiting for verified content.',
  },
  {
    category: 'Career',
    date: 'Draft',
    title: 'Building Beyond One Discipline',
    excerpt:
      'A flexible article page for Gabriel to share his journey as a multidisciplinary creative technologist.',
    readTime: 'Ready for content',
    slug: 'building-beyond-one-discipline',
    body:
      'This article is intentionally marked as draft until Gabriel provides the finished text.',
  },
];
// Verified directly from the BMS complimentary card (Profile-and-Contact
// assets): phone +234 816 5871 570, handle BMS_MOG on X/TikTok/Instagram,
// LinkedIn under Gabriel Owolabi's name.
export const socials = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/gabriel-owolabi-13825b161',
    icon: 'linkedin',
  },
  {
    label: 'X',
    href: 'https://x.com/BMS_MOG',
    icon: 'x',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@BMS_MOG',
    icon: 'tiktok',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/BMS_MOG',
    icon: 'instagram',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/bmsmog-commits',
    icon: 'github',
  },
  {
    label: 'Email',
    href: `mailto:${personal.email}`,
    icon: 'email',
  },
];

export const footerContacts = [
  {
    type: 'linkedin',
    label: 'LinkedIn',
    name: 'Gabriel Owolabi',
    url: 'https://www.linkedin.com/in/gabriel-owolabi-13825b161',
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    name: '+234 816 5871 570',
    url: 'https://wa.me/2348165871570',
  },
  {
    type: 'email',
    label: 'Email',
    name: personal.email,
    url: `mailto:${personal.email}`,
  },
];