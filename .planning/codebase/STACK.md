# Technology Stack

**Analysis Date:** 2026-03-07

## Languages

**Primary:**
- JavaScript (ES6+) - All source code including React components, utilities, and helpers
- HTML5 - Static markup in `public/index.html`
- CSS3 - Styling in `src/App.css` and `src/index.css`

## Runtime

**Environment:**
- Node.js (version not explicitly specified in .nvmrc, determined by react-scripts 5.0.1)

**Package Manager:**
- npm - Primary package manager
- Lockfile: `package-lock.json` (present and committed)

## Frameworks

**Core:**
- React 19.1.0 - Component-based UI framework and state management
  - Location: `src/` with components in `src/components/`
  - Entry: `src/index.js`
  - Root component: `src/App.js`

**Build/Dev:**
- react-scripts 5.0.1 - Create React App build toolchain
  - Includes webpack, Babel, ESLint configuration
  - Scripts: `start`, `build`, `test`, `eject`

**Testing:**
- @testing-library/react 16.3.0 - React component testing utilities
- @testing-library/dom 10.4.0 - DOM testing utilities
- @testing-library/jest-dom 6.6.3 - DOM matchers for Jest
- @testing-library/user-event 13.5.0 - User interaction simulation
- Jest (bundled with react-scripts) - Test runner via `react-scripts test`

## Key Dependencies

**Critical:**
- date-fns 4.1.0 - Date manipulation and formatting
  - Used in `src/helpers.js` for time period calculations
  - Functions: `format`, `parse`, `differenceInMinutes`, `isAfter`, `addMinutes`

**Infrastructure:**
- react-dom 19.1.0 - React rendering engine for web
- web-vitals 2.1.4 - Performance metrics for production monitoring (optional integration point via `reportWebVitals()` in `src/index.js`)

## Configuration

**Environment:**
- No `.env` configuration required for basic operation
- Patterns for environment files defined in `.gitignore`:
  - `.env.local` - Local overrides
  - `.env.development.local` - Development-specific
  - `.env.test.local` - Testing-specific
  - `.env.production.local` - Production-specific

**Build:**
- `package.json` with ESLint configuration extending `react-app` and `react-app/jest`
- Browser support defined via `browserslist` in `package.json`:
  - Production: >0.2% market share, not dead, not IE/Opera Mini
  - Development: Latest Chrome, Firefox, Safari versions

**Code Quality:**
- ESLint - Linting via react-app preset
- Prettier - Formatting (not explicitly configured, likely via Create React App defaults)

## Platform Requirements

**Development:**
- Node.js with npm
- Modern browser with ES6 support
- No additional build tools required (Create React App abstracts complexity)

**Production:**
- Deployment target: Static SPA (Single Page Application)
- Builds to: `build/` directory
- Built-in support for CSP (Content Security Policy) and browser caching
- No server-side runtime dependencies

## Scripts

**Available Commands:**
```bash
npm start              # Development server on http://localhost:3000
npm build              # Production build to build/ directory
npm test               # Run tests in watch mode
npm run eject          # Expose Create React App configuration (irreversible)
```

---

*Stack analysis: 2026-03-07*
