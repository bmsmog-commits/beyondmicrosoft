# React + Tailwind Portfolio

This folder contains a React + Tailwind version of the Personal Portfolio Website.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

## Build

```bash
npm run build
```

## GitHub Pages Deployment

1. Install `gh-pages`:

```bash
npm install --save-dev gh-pages
```

2. Add these scripts to `package.json`:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d build"
```

3. Add the homepage URL to `package.json`:

```json
"homepage": "https://<your-github-username>.github.io/<repository-name>"
```

4. Deploy:

```bash
npm run deploy
```

Replace `<your-github-username>` and `<repository-name>` with your GitHub account and repo name.
