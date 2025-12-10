# CLAUDE.md

> 이 파일은 [CLAUDE.md 작성 원칙](https://www.humanlayer.dev/blog/writing-a-good-claude-md)을 따릅니다.

## What

GitHub Actions workflow 페이지를 개선하는 브라우저 확장 프로그램.

- **Framework**: WXT (https://wxt.dev) + React + TypeScript
- **Target**: GitHub Actions 페이지 (`github.com/*/actions*`)

### Structure

```
entrypoints/
  popup/         # Extension popup UI (React)
  content.ts     # Content script for GitHub Actions pages
  background.ts  # Service worker
utils/
  storage.ts     # WXT storage utilities for settings
```

## How

```bash
npm run dev          # Development mode
npm run build        # Production build (.output/chrome-mv3)
npm run type-check   # TypeScript check
```

## Conventions

- Conventional Commits (https://www.conventionalcommits.org)
- `gh` CLI for GitHub operations
- Day.js format tokens for time formatting
