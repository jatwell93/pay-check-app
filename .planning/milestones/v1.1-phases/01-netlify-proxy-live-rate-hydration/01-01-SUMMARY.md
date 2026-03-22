---
phase: 01-netlify-proxy-live-rate-hydration
plan: 01
subsystem: infra
tags: [netlify, netlify-functions, fwc-api, cors-proxy, testing, jest]

# Dependency graph
requires: []
provides:
  - "Netlify Function proxy at netlify/functions/award-rates.js — forwards GET requests to api.fwc.gov.au server-side"
  - "netlify.toml with build config, esbuild functions bundler, and SPA redirect rule"
  - "netlify-cli devDependency for local development"
  - "Wave 0 test stubs for all Plan 02-04 test contracts (24 todo tests across 4 files)"
affects:
  - "02-service-layer-proxy-redirect"
  - "03-hydration-mapping"
  - "04-fallback-chain"

# Tech tracking
tech-stack:
  added:
    - "netlify-cli@24.2.0 (devDependency)"
  patterns:
    - "Server-side proxy pattern: FWC_API_KEY in Netlify env only (no REACT_APP_ prefix)"
    - "AbortController timeout pattern: 10s timeout on external API fetch"
    - "Wave 0 stub pattern: test.todo() files define contract before implementation"
    - "CommonJS exports.handler: Netlify Functions use CJS format (not ESM)"

key-files:
  created:
    - netlify/functions/award-rates.js
    - netlify.toml
    - src/__tests__/netlifyProxy.test.js
    - src/__tests__/hydration.test.js
    - src/__tests__/fallback.test.js
    - src/components/WorkHours.test.js
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "FWC_API_KEY has no REACT_APP_ prefix — server-side only, prevents CRA bundling key into client JS"
  - "node_bundler = esbuild in netlify.toml — faster cold starts than default zip bundler"
  - "Wave 0 stubs use test.todo() not test.skip() — todo shows as pending, not skipped, in Jest output"
  - "Proxy is transparent passthrough — no FWC response transformation in Plan 01 (deferred to Plan 02)"

patterns-established:
  - "Netlify Function proxy: CommonJS exports.handler async function pattern"
  - "10-second AbortController timeout on all external API calls from proxy"
  - "Wave 0 stub files: create test contracts before implementation to prevent 'test does not exist' blockers"

requirements-completed: [PROXY-01]

# Metrics
duration: 90min
completed: 2026-03-13
---

# Phase 01 Plan 01: Netlify Proxy Setup & Wave 0 Test Stubs Summary

**Netlify Function CORS proxy for FWC API with server-side API key isolation and 24 Wave 0 test stubs across 4 files**

## Performance

- **Duration:** 90 min
- **Started:** 2026-03-13T12:01:35Z
- **Completed:** 2026-03-13T13:31:35Z
- **Tasks:** 2 of 2
- **Files modified:** 8

## Accomplishments

- Created server-side Netlify Function proxy that bypasses CORS by forwarding FWC API requests from Node.js runtime, keeping the API key out of the browser bundle
- Created netlify.toml with esbuild bundler and SPA redirect rule so direct URL loads work on Netlify
- Created 4 Wave 0 test stub files (24 todo tests) covering proxy behavior, hydration mapping, fallback chain, and WorkHours loading state — ensures test infrastructure is ready for Plans 02-04
- Installed netlify-cli@24.2.0 for local development with `netlify dev`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Netlify Function proxy and netlify.toml** - `a7b6833` (feat)
2. **Task 2: Install netlify-cli and create Wave 0 test stubs** - `237bf21` (feat)

**Plan metadata:** committed in final docs commit (docs(01-01))

## Files Created/Modified

- `netlify/functions/award-rates.js` — Server-side proxy: reads FWC_API_KEY from env, forwards GET with Authorization header, 10s AbortController timeout, structured JSON error responses
- `netlify.toml` — Netlify build config: `npm run build`, functions dir, esbuild bundler, SPA `/*` redirect to `/index.html`
- `src/__tests__/netlifyProxy.test.js` — 7 todo stubs for proxy behavior (400/500/success/timeout/network-error cases)
- `src/__tests__/hydration.test.js` — 6 todo stubs for FWC response hydration to awardConfig shape
- `src/__tests__/fallback.test.js` — 8 todo stubs for initializeAwardRates fallback chain (cache/fetch/error/corrupt JSON)
- `src/components/WorkHours.test.js` — 3 todo stubs for Calculate button disabled state during loading
- `package.json` — Added netlify-cli@24.2.0 to devDependencies
- `package-lock.json` — Updated with netlify-cli dependency tree

## Decisions Made

- **No REACT_APP_ prefix on API key** — Using `FWC_API_KEY` (not `REACT_APP_FWC_API_KEY`) ensures CRA does not bundle the key into client-side JS. Server-side only.
- **Transparent proxy passthrough** — Plan 01 proxy returns raw FWC response without transformation. Hydration mapping deferred to Plan 02 when actual API response shape is confirmed via integration testing.
- **esbuild bundler** — Faster Netlify cold starts vs. default zip bundler. No behavior change for this use case.
- **test.todo() over test.skip()** — todo tests show as "pending" in Jest output (visible contract), while skip is more invisible. Both pass without failing.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - installation and file creation succeeded without issues. The `console.error act()` warnings in test output are pre-existing in `src/App.test.js` (unrelated to this plan's changes) and are out of scope per deviation rules.

## User Setup Required

**FWC_API_KEY must be set before the proxy can forward requests.**

Once the app is deployed to Netlify:
1. Go to Netlify Dashboard > Site Settings > Environment Variables
2. Add `FWC_API_KEY` with the FWC API key value
3. Redeploy (environment variables require a new deploy to take effect)

For local development:
- Create a `.env` file at project root with `FWC_API_KEY=your-key-here`
- Run `netlify dev` (uses netlify-cli) to serve both CRA and functions locally
- The proxy will be available at `http://localhost:8888/.netlify/functions/award-rates`

## Next Phase Readiness

- Proxy function is live and ready for Plan 02 to redirect `awardRatesService.js` from direct FWC API to `/.netlify/functions/award-rates`
- Wave 0 stub files are in place — Plan 02-04 implementors can fill in test bodies without creating new files
- FWC API response shape is still unknown — Plan 02 will confirm shape via integration test before writing hydration mapping

---
*Phase: 01-netlify-proxy-live-rate-hydration*
*Completed: 2026-03-13*
