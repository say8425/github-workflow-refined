# GitHub Workflow Refined

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nanlhoijdkmlalnlhcnddandakicbdpl?logo=chromewebstore&logoColor=white&color=4285F4)](https://chromewebstore.google.com/detail/github-workflow-refined/nanlhoijdkmlalnlhcnddandakicbdpl)

Browser extension to enhance GitHub Actions workflow pages.

## Screenshots

| Relative Time | Absolute + Today Indicator |
|---|---|
| ![Relative Time](https://github.com/say8425/github-workflow-refined/raw/main/screenshots/actions-relative-ko.png) | ![Absolute Format](https://github.com/say8425/github-workflow-refined/raw/main/screenshots/actions-absolute-today-ko.png) |

### Multi-language

| 简体中文 | 繁體中文 | 日本語 |
|---|---|---|
| ![Simplified Chinese](https://github.com/say8425/github-workflow-refined/raw/main/screenshots/actions-auto-zh-cn.png) | ![Traditional Chinese](https://github.com/say8425/github-workflow-refined/raw/main/screenshots/actions-auto-zh-tw.png) | ![Japanese](https://github.com/say8425/github-workflow-refined/raw/main/screenshots/actions-auto-ja.png) |

| 한국어 | Español |
|---|---|
| ![Korean](https://github.com/say8425/github-workflow-refined/raw/main/screenshots/actions-auto-ko.png) | ![Spanish](https://github.com/say8425/github-workflow-refined/raw/main/screenshots/actions-auto-es.png) |

## Features

- **Time Format**: Configurable time display (Relative, Absolute, Auto)
- **Today Indicator**: Highlights today's workflow runs
- **Auto Language**: Detects browser language on first install
- **Auto-expand**: Automatically expands "Show more workflows..." button
- **Multi-language**: Supports EN, KO, JA, ZH-CN, ZH-TW, DE, FR, ES, PT, RU

## Install

### Chrome Web Store

[![Chrome Web Store](https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png)](https://chromewebstore.google.com/detail/nanlhoijdkmlalnlhcnddandakicbdpl)

### Manual Install

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
npm run lint         # Biome lint check
npm run lint:fix     # Biome lint auto-fix
```

## Tech Stack

- [WXT](https://wxt.dev) - Browser extension framework
- [@wxt-dev/auto-icons](https://wxt.dev/auto-icons.html) - Auto icon generation
- React + TypeScript
- TailwindCSS v4
- Day.js for time formatting
- Biome for linting/formatting
