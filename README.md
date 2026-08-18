# Beyond Microsoft (BMS)

Premium personal brand website for Gabriel Owolabi, Creative Technologist.

## Setup

```bash
npm install
```

## Development

```bash
npm start
```

## Production Build

```bash
npm run build
```

## Environment Variables

No environment variables are required yet. Future email, analytics or API integrations should use environment variables and must not be hard-coded into frontend source.

## Assets

Replace assets without changing component code:

- Logo: `public/assets/brand/logo.png` or `public/assets/brand/logo.svg`
- Profile portrait: `public/assets/profile/gabriel-profile.jpg`
- Hero image: `public/assets/profile/header-image.jpg`
- Complimentary card: `public/assets/profile/complimentary-card.jpg`
- CV: `public/assets/documents/gabriel-cv.pdf`
- Certificates: `public/assets/certificates/`
- Portfolio: `public/assets/portfolio/project-name/`

Missing optional images render as BMS placeholders.

## Content Editing

Core editable content lives in `src/data/content.js`.

### Add Portfolio Projects

Add verified projects to the `projects` array with fields such as:

```js
{
  title: 'Project title',
  category: 'Web',
  description: 'Short verified description',
  problem: 'Actual challenge',
  strategy: 'Actual strategy',
  solution: 'Actual solution',
  technology: 'Tools used',
  design: 'Design notes',
  implementation: 'Build notes',
  outcome: 'Only verified outcomes',
  cover: '/assets/portfolio/project-01/cover.jpg',
  gallery: [],
  liveUrl: '',
  githubUrl: ''
}
```

### Add Certificates

Add certificate images to `public/assets/certificates/`, then add verified metadata to the `certificates` array. Do not publish issuing organization, dates, IDs or verification links unless they are present on the certificate or otherwise verified.

### Replace CV

Replace `public/assets/documents/gabriel-cv.pdf` with the current CV using the same filename.

## Contact Form

The form validates required fields and displays an integration-ready message. Connect Netlify Forms, Formspree, a serverless function or a custom API before claiming messages are sent.

## SEO

SEO metadata is in `public/index.html`. Update these placeholders before launch:

- Canonical URL
- Open Graph URL
- Sitemap URL in `public/sitemap.xml`
- Sitemap URL in `public/robots.txt`

## Netlify Deployment

1. Push the project to GitHub.
2. Create a Netlify site from the GitHub repository.
3. Set build command to `npm run build`.
4. Set publish directory to `build`.
5. `netlify.toml` and `public/_redirects` are included for SPA fallback routing.

## Notes

The site intentionally avoids fake clients, testimonials, employment history, certifications, awards and project outcomes. Authority comes from positioning, presentation, verified work, skills and credentials.
# beyondmicrosoft
