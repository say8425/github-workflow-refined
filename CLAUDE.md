# CLAUDE.md

## Project Overview

Browser extension to enhance GitHub Actions workflow pages with customizable time formatting.

- **Framework**: WXT (https://wxt.dev) + React + TypeScript
- **Target**: GitHub Actions pages (`github.com/*/actions*`)

## Project Structure

```
entrypoints/
  popup/       # Extension popup UI (React)
  content.ts   # Content script for GitHub Actions pages
  background.ts
utils/
  storage.ts   # WXT storage utilities for settings
```

## Commands

```bash
npm run dev          # Development mode
npm run build        # Production build (.output/chrome-mv3)
npm run compile      # TypeScript check
```

## Conventions

- Follow Conventional Commits (https://www.conventionalcommits.org)
- Use `gh` CLI for GitHub operations (issues, PRs)
- Time formatting uses Day.js format tokens
