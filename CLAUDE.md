# CLAUDE.md

> 이 파일은 [CLAUDE.md 작성 원칙](https://www.humanlayer.dev/blog/writing-a-good-claude-md)을 따릅니다.

## What

GitHub Actions workflow 페이지를 개선하는 브라우저 확장 프로그램.

- **Framework**: WXT (https://wxt.dev) + React + TypeScript
- **Styling**: TailwindCSS v4
- **Target**: GitHub Actions 페이지 (`github.com/*/actions*`)

### Structure

```
entrypoints/
  popup/           # Extension popup UI (React)
    components/    # TimeFormatSection, WorkflowSection
    style.css      # Tailwind imports & theme
  content.ts       # Content script for GitHub Actions pages
  content/         # Content script modules
    auto-expand.ts # Auto-expand workflow list
    time-format.ts # Time formatting logic
  background.ts    # Service worker
assets/
  icon.png         # Source icon (auto-resized by @wxt-dev/auto-icons)
public/
  _locales/        # i18n (en, ko, ja, zh-cn, zh-tw, de, fr, es, pt, ru)
utils/
  storage.ts       # WXT storage utilities & browser locale detection
```

## How

```bash
npm run dev          # Development mode
npm run build        # Production build (.output/chrome-mv3)
npm run type-check   # TypeScript check
npm run lint         # Biome lint check
npm run lint:fix     # Biome lint auto-fix
```

## Conventions

- Conventional Commits (https://www.conventionalcommits.org)
- `gh` CLI for GitHub operations
- Day.js format tokens for time formatting
- Biome for linting/formatting (`npx biome check --write`)
- TailwindCSS utility classes (sorted by Biome `useSortedClasses`)
