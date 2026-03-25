# Technology Stack: v1.1 API Integration & UX Redesign

**Project:** Pay Check App v1.1
**Researched:** 2026-03-09

---

## Recommended Stack (No Changes from v1.0)

v1.1 **does not change the core tech stack**. React 19 SPA remains the foundation. v1.1 adds:
- **Netlify Functions** (serverless proxy)
- **Tailwind CSS** (for professional redesign)
- **Enhanced error handling** (retry logic, graceful degradation)

### Core Framework (Unchanged)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19 (via CRA) | UI rendering | Familiar, stable, suitable for SPA. No migration needed. |
| Create React App | Latest | Build tooling | No changes. Existing setup works for Netlify deployment. |
| TypeScript | Latest | Type safety | v1.0 uses TypeScript; continue for stability. |
| Zod | Latest | Runtime validation | Already in use for awardRatesService validation. Extend for Netlify response validation. |

### Styling (v1.1 Addition)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Tailwind CSS** | v4 (current 2026) | Professional component styling | Industry standard for professional UX. Provides navy/white + green/red color tokens out-of-box. |
| PostCSS | v8+ | CSS processing | Required for Tailwind. Already available in CRA via build config. |

### Serverless Proxy (v1.1 Addition)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Netlify Functions** | Node.js runtime (latest) | Server-side FWC API proxy | Eliminates CORS issues. Secure API key storage (env vars, not client-side). No backend infrastructure needed. |
| Node.js (Netlify runtime) | 18+ LTS | Execution environment | Standard Netlify default. Sufficient for simple HTTP forwarding. |

### API Integration (Enhanced)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| FWC MAAPI v1 | Live (quarterly updates) | Official award rates | Official source. Same as v1.0; no version change needed. |
| axios or native fetch | Latest | HTTP client (Netlify function) | Use native fetch in Netlify function (no package needed). Simple and reliable. |

### Testing (Unchanged)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Jest | Latest (via CRA) | Unit testing | Existing test suite continues to work. Test new hydration logic with same framework. |
| React Testing Library | Latest (via CRA) | Component testing | Existing patterns work for Tailwind-styled components. |

### Development Tools (Unchanged)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ESLint | Latest | Linting | Existing config continues. No changes needed. |
| Prettier | Latest | Code formatting | Existing config continues. |

---

## Installation & Setup for v1.1

### Install Tailwind CSS

```bash
# Install Tailwind CSS v4 and dependencies
npm install -D tailwindcss postcss autoprefixer

# Generate tailwind.config.js and postcss.config.js
npx tailwindcss init -p
```

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
module default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Navy/white theme for professional design
        navy: {
          50: '#f8fafc',
          900: '#0f172a',
        },
        // Green/red for pass/fail status
        success: '#22c55e',  // green-500
        danger: '#ef4444',   // red-500
      },
    },
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Set Up Netlify Functions

```bash
# Create functions directory
mkdir -p netlify/functions

# Create environment variable file for API key
echo "REACT_APP_FWC_API_KEY=your_key_here" > .env
echo "REACT_APP_FWC_API_KEY=your_key_here" > .env.local
```

**netlify/functions/fwc-proxy.js:**
```javascript
export async function handler(event) {
  const { awardIds } = event.queryStringParameters || {};

  if (!awardIds) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'awardIds parameter required' }),
    };
  }

  try {
    const apiKey = process.env.REACT_APP_FWC_API_KEY;
    const baseUrl = 'https://api.fwc.gov.au/awardrates/find';

    // Fetch from FWC API (server-side, no CORS)
    const response = await fetch(`${baseUrl}?awardIds=${awardIds}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`FWC API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "build"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Update awardRatesService.js

```javascript
// Current (v1.0): Calls FWC directly, hits CORS wall
// const response = await fetch('https://api.fwc.gov.au/awardrates/find?awardIds=...');

// v1.1: Call Netlify proxy instead
const response = await fetch('/.netlify/functions/fwc-proxy?awardIds=MA000012,MA000003,MA000009');
```

### Environment Variables

**Development (.env.local):**
```
REACT_APP_FWC_API_KEY=your_sandbox_key
```

**Production (Netlify):**
Set via Netlify Dashboard → Site Settings → Build & Deploy → Environment:
```
REACT_APP_FWC_API_KEY=your_production_key
```

---

## Alternatives Considered & Rejected

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Proxy Strategy | Netlify Functions | CORS Anywhere / cors-anywhere package | Public CORS proxy is unreliable, insecure (API key exposed), no rate limiting. Netlify Functions keeps API key server-side. |
| Proxy Strategy | Netlify Functions | AWS API Gateway + Lambda | Overkill for simple forwarding. Netlify Functions simpler to deploy with existing Netlify hosting. |
| Styling | Tailwind CSS | Material-UI (MUI) | MUI adds 500KB+ overhead. Tailwind is lightweight, utility-first, gives us full control over navy/white theme. |
| Styling | Tailwind CSS | Styled Components | Less performant than Tailwind. No built-in design system. Would require custom navy/green/red palette. |
| Styling | Tailwind CSS | CSS Modules | No design system tokens. Would require manual color/spacing definitions. Tailwind provides them out-of-box. |
| Error Handling | Custom retry logic | React Query (TanStack Query) | React Query adds 40KB dependency. Custom retry (3x with backoff) is simpler for a single API call. Defer Query for v2. |
| Error Handling | useEffect + setState | React Suspense | Suspense is newer and less stable in CRA build. Traditional useEffect/setState is safer for v1.1. Consider Suspense in v2. |
| Caching Strategy | localStorage (90-day TTL) | IndexedDB | localStorage sufficient for FWC rates (small JSON). IndexedDB overkill. Stick with localStorage. |

---

## Deployment Targets

### Development
```bash
npm start
# Netlify dev server (supports /.netlify/functions/ endpoints locally)
netlify dev
```

### Production (Netlify)
- No additional infrastructure needed
- Netlify Functions automatically deployed with site
- Environment variables set via Netlify Dashboard
- 100% managed, no server scaling concerns

---

## Dependencies Summary

### npm install
```bash
npm install
# Core: React, TypeScript, Zod, axios (if using; or stick with fetch)
```

### npm install -D
```bash
npm install -D tailwindcss postcss autoprefixer
# Tailwind utilities for build-time CSS generation
```

### No New Runtime Dependencies
v1.1 **does not add new npm packages** beyond Tailwind. Keeps bundle size minimal.

---

## Breaking Changes: None

v1.1 is backward-compatible with v1.0:
- Same React API
- Same calculation logic (calculatePay, calculatePayForTimePeriod)
- Same component interfaces (props remain unchanged, only styling updates)
- Existing tests continue to pass

---

## Version Upgrade Path (If Needed in Future)

| Scenario | Action |
|----------|--------|
| React 20+ released | Defer to v2. v19 receives LTS security updates until 2027. |
| TypeScript vNext | Upgrade to latest. No breaking changes expected. Automated update via npm. |
| Tailwind v5+ | Upgrade when stable. Tailwind follows semantic versioning; minor version upgrades are safe. |
| Node.js LTS cycle | Netlify automatically updates runtime. No action needed. |

---

## Security Considerations

### API Key Management
- **NEVER** commit `.env` files or API keys to git
- Use `.env.local` for development (git-ignored)
- Use Netlify Dashboard for production environment variables
- Rotation: If key is compromised, rotate immediately via FWC portal

### CORS Proxy Security
- Netlify Functions endpoint is **not exposed** to client (proxy forwards calls)
- FWC API key lives on Netlify server, never sent to browser
- Client calls `/.netlify/functions/fwc-proxy` (same-origin, no CORS issue)

### Data Validation
- Zod schema validates all FWC API responses before use
- Schema is permissive (`passthrough()`) until FWC response shape is confirmed
- Tighten schema in v2 once shape is known

---

## Performance Considerations

### Bundle Size Impact
- Tailwind CSS: ~15KB minified + gzipped (good: utility-first, tree-shakes unused classes)
- No new npm packages added (vs React Query, axios, etc.)
- Expected total: same or slightly smaller than v1.0 (if unused CSS from v1.0 removed)

### API Hydration Performance
- Fetch rates on App mount (before user enters shifts)
- If fetch > 2 seconds, show loading spinner
- If fetch fails, fallback to hardcoded rates (no delay)
- Caching: 90-day localStorage TTL means rates rarely re-fetch

### Netlify Function Latency
- Cold start: ~100-500ms (depends on Netlify infrastructure)
- Warm start: ~10-50ms
- Acceptable for user-facing tool (not real-time)
- Consider adding "Connecting to FWC..." loading message for UX

---

## Sources

**Netlify Functions & Deployment:**
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify Dev CLI](https://docs.netlify.com/cli/get-started/)

**Tailwind CSS:**
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS with Create React App](https://tailwindcss.com/docs/guides/create-react-app)

**React 19 & TypeScript:**
- [React 19 Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

**Node.js LTS (Netlify Runtime):**
- [Node.js LTS Schedule](https://nodejs.org/en/about/releases)
