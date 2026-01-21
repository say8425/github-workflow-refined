# GitHub Workflow Refined

Browser extension to enhance GitHub Actions workflow pages.

## Features

- **Time Format**: Configurable time display (Relative, Absolute, Auto)
- **Auto Language**: Detects browser language on first install
- **Auto-expand**: Automatically expands "Show more workflows..." button
- **Multi-language**: Supports EN, KO, JA, ZH-CN, ZH-TW, DE, FR, ES, PT, RU

## Install

```bash
npm install
npm run build
```

Load `.output/chrome-mv3` as unpacked extension in Chrome.

## Development

```bash
npm run dev          # Development mode with HMR
npm run build        # Production build
npm run type-check   # TypeScript check
```

## Tech Stack

- [WXT](https://wxt.dev) - Browser extension framework
- [@wxt-dev/auto-icons](https://wxt.dev/auto-icons.html) - Auto icon generation
- React + TypeScript
- TailwindCSS v4
- Day.js for time formatting
- Biome for linting/formatting
