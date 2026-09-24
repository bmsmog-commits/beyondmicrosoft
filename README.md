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

Set these in Netlify (**Site configuration → Environment variables**). For local development copy `.env.example` to `.env` (git-ignored). Never prefix secrets with `VITE_` — Vite ships those to the browser.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_API_KEY` | Yes, for BMS AI | Anthropic API key used by the BMS AI Netlify Function. Server-side only. |
| `AI_MODEL` | No | Model ID. Defaults to `claude-opus-5`. |
| `AI_PROVIDER` | No | AI provider adapter. Defaults to `anthropic`. |
| `AI_ALLOWED_ORIGINS` | No | Extra comma-separated origins allowed to call the endpoint. |

Without `AI_API_KEY` the website works normally; the assistant just shows its "trouble connecting" message.

## BMS AI assistant

A floating assistant (bottom-right) that answers questions about BMS, its services, portfolio and process, and guides visitors to the contact form. See [docs/BMS-AI.md](docs/BMS-AI.md) for the architecture.

Run the site together with the AI function locally:

```bash
npx netlify-cli dev
```

(`npm start` alone runs the site, but the assistant can't connect without the function.)

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

SEO metadata is in the root `index.html` (the Vite entry point). The production domain is `https://beyondmicrosoft.com/` and is used for:

- Canonical URL and Open Graph URL in `index.html`
- Homepage URL in `public/sitemap.xml`
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
