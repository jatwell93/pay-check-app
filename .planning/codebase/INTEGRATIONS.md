# External Integrations

**Analysis Date:** 2026-03-07

## APIs & External Services

**Web References:**
- Fair Work Ombudsman (https://www.fairwork.gov.au/)
  - Used in: `src/App.js` line 315
  - Purpose: External link to employment law reference
  - Embedded in footer, no SDK integration

## Data Storage

**Databases:**
- None - Fully client-side application

**File Storage:**
- Local filesystem only
  - No cloud storage integration
  - No file upload/download functionality

**Client-Side Storage:**
- Browser localStorage/sessionStorage - Not implemented
- State managed entirely in memory via React hooks

**Caching:**
- Browser HTTP caching via standard response headers
- No service workers or explicit caching layer

## Authentication & Identity

**Auth Provider:**
- None - Fully public, no authentication required
- No user accounts or session management
- All calculations performed client-side, no user tracking

## Monitoring & Observability

**Error Tracking:**
- None configured - No error reporting service

**Logs:**
- Console logging only
  - `console.warn()` in `src/helpers.js` line 106 for invalid base rate warnings
  - No structured logging framework
  - No log aggregation service

**Performance Monitoring:**
- Optional via web-vitals integration
  - Entry point: `src/index.js` comment lines 14-16
  - Integration point: `reportWebVitals()` function in `src/reportWebVitals.js`
  - Can be connected to analytics endpoint but not configured by default

## CI/CD & Deployment

**Hosting:**
- Not configured in codebase
- Designed for static hosting (Vercel, Netlify, GitHub Pages, AWS S3, etc.)
- No backend API server required

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, or other pipeline configuration

**Build Artifacts:**
- `build/` directory (production build output)
- Entry point: `build/index.html`
- All assets bundled and minified

## Environment Configuration

**Required env vars:**
- None required for default operation
- Optional patterns available via Create React App (as per `.gitignore`)

**Secrets location:**
- Not applicable - No sensitive credentials in use

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- Optional: `reportWebVitals()` can send performance metrics to an endpoint
  - Implementation location: `src/reportWebVitals.js`
  - Must be manually configured with endpoint URL
  - Not enabled by default

## Accessibility & Resources

**Public Resources:**
- All calculations use hardcoded pharmacy award rates embedded in `src/App.js`:
  - Effective as of July 1, 2024 (Pharmacy Industry Award MA000012)
  - Rates for full-time, part-time, and casual employees
  - Junior wage percentages for age cohorts
  - Allowances (home medicine review, laundry, broken hill, motor vehicle, meals)
  - No external data source - all data bundled with application

## Browser APIs Used

**Modern Web APIs:**
- HTML5 Date/Time input via `<input type="time">` in components
- No Geolocation, Camera, Microphone, or other restricted APIs
- No Service Workers
- No Web Workers

---

*Integration audit: 2026-03-07*
