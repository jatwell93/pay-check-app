# Phase 1: Netlify Proxy & Live Rate Hydration - Research

**Researched:** 2026-03-13
**Domain:** Serverless proxy architecture for CORS bypass + live award rate hydration into React SPA
**Confidence:** HIGH (architecture well-established; FWC API response shape requires validation)

## Summary

Phase 1 addresses the critical blocker that prevents the app from loading live award rates: the FWC API returns CORS-blocked responses when called from the browser. The solution is a Netlify Functions proxy that runs server-side, forwards requests to FWC API, and returns responses without CORS restrictions.

The phase also wires the fetched rates into the calculation engine (`calculatePay`), replacing hardcoded rates from `awardConfig.js`. A fallback mechanism ensures the app never breaks: if the proxy fails, rates default to hardcoded values with a visible warning banner.

**Core challenge:** The FWC MAAPI v1 API response structure is unknown and undocumented. This phase's success depends on validating the real API response shape before coding the hydration layer.

**Primary recommendation:**
1. Before building the proxy, test the FWC API directly with sandbox credentials to document the actual response structure.
2. Build strict Zod validation based on the real response, not assumptions.
3. Implement graceful fallback: if API response doesn't match expected shape, fall back to hardcoded rates with clear messaging.
4. All 61 existing tests must pass without modification (no changes to calculation logic).

## Standard Stack

### Core (No Changes from v1.0)
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| React | 19 (CRA) | UI rendering + state management | Stable, v1.0 foundation, no migration needed |
| Create React App | Latest | Build tooling | Handles CRA 5+ setup, Netlify deployment works out-of-box |
| TypeScript | Latest | Type safety | v1.0 uses TS; continue for stability |
| Jest + React Testing Library | CRA bundled | Unit & component testing | Existing test suite, no changes needed |
| Zod | Latest | Runtime schema validation | Already in use; extend for proxy response validation |

### New Additions (v1.1)
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| **Netlify Functions** | Node.js runtime (18+ LTS) | Server-side HTTP proxy | Eliminates CORS; keeps API key server-side; no backend infrastructure |
| **netlify-cli** | ^18.0+ | Local development (netlify dev) | Supports `/.netlify/functions/` during npm start |

### Supporting Libraries (Already Installed)
| Library | Version | Purpose | Usage |
|---------|---------|---------|-------|
| axios | ^1.6+ | HTTP client (awardRatesService) | Continue using; already mocked in tests |
| axios-retry | ^2.0+ | Automatic retry with backoff | Already configured; 3 retries + exponential delay |
| date-fns | ^2.30+ | Date formatting (cache display) | Used in AwardSelector for "Rates last updated..." |

### Installation
```bash
# Tailwind CSS (for Phase 2; Phase 1 won't style yet)
npm install -D tailwindcss postcss autoprefixer

# netlify-cli for local development (optional but recommended)
npm install -D netlify-cli

# No new runtime dependencies — all validation/HTTP already installed
```

### Deployment Targets
| Environment | Command | Behavior |
|-----------|---------|----------|
| **Local Dev** | `netlify dev` | Starts localhost:8888, supports /.netlify/functions/ endpoints |
| **Production** | Netlify.com | Functions deployed automatically, env vars via Dashboard |

## Architecture Patterns

### Data Flow: Rates Hydration & Fallback Chain

```
App.js (useEffect on mount)
  ↓
fetchAwardRates(['MA000012', 'MA000003', 'MA000009'])
  ↓
[Check localStorage cache]
  ├─ Cache valid & complete? → Use cached rates (instant)
  └─ Cache missing/expired?
      ↓
      Call /.netlify/functions/fwc-proxy?awardIds=...
        ↓
        [Netlify Function]
        ├─ Fetch from api.fwc.gov.au with API key
        ├─ Validate response shape with Zod
        ├─ Return { MA000012: {...}, MA000003: {...}, MA000009: {...} }
        └─ On error: throw (let client handle)
      ↓
      [Client receives rates]
      ├─ Store in localStorage (cache hit for next load)
      ├─ setAwardRates(fetched)
      ├─ setLoading(false)
      └─ Enable Calculate button

      [On fetch error]
      ├─ Check localStorage for partial cache
      ├─ If partial cache exists: use it + show warning
      ├─ If no cache exists: use hardcoded awardConfig.js + show error
      ├─ Show error banner: "Couldn't load rates. Using [cached/default] rates. [Retry]"
      ├─ setLoading(false)
      └─ Calculate button enabled (with fallback rates)
```

### Pattern 1: Netlify Functions Proxy

**What:** Server-side HTTP forwarding of FWC API requests. Eliminates CORS by making the request from Netlify's server, not the browser.

**When to use:** Whenever a browser-based SPA needs to call an API that omits CORS headers. Netlify Functions are perfect for lightweight proxies.

**Implementation:**

```javascript
// netlify/functions/award-rates.js
// Source: Adapted from Netlify Functions docs + STACK.md

export async function handler(event) {
  // Parse query params: ?awardIds=MA000012,MA000003,MA000009
  const { awardIds } = event.queryStringParameters || {};

  if (!awardIds) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'awardIds parameter required' }),
    };
  }

  try {
    // API key is server-side only — never exposed to browser
    const apiKey = process.env.REACT_APP_FWC_API_KEY;
    const baseUrl = 'https://api.fwc.gov.au/awardrates/find';

    // Server-side fetch — no CORS issues
    const response = await fetch(`${baseUrl}?awardIds=${awardIds}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000, // Abort if FWC slow
    });

    if (!response.ok) {
      throw new Error(`FWC API error: ${response.status}`);
    }

    const data = await response.json();

    // Return to client (client will validate with Zod)
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
```

```toml
# netlify.toml
# Source: Netlify Functions docs + STACK.md

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

**Error handling:**
- Function timeout (FWC slow): `response` never resolves → 10-second timeout fires → error thrown → client receives 500 → falls back to hardcoded rates
- FWC 4xx error (invalid award): error thrown → client receives 500 → falls back
- FWC 5xx error (server down): error thrown → client receives 500 → falls back

### Pattern 2: Rate Hydration Mapping

**What:** Transform FWC API response into the shape expected by `calculatePay()` (penaltyConfig, classifications, baseRates, allowances).

**When to use:** When integrating an external API response with internal calculation engine. Hydration isolates API schema changes from business logic.

**Current unknown:** FWC API response shape is undocumented. Before coding hydration, must:
1. Test FWC API with real sandbox credentials
2. Document actual JSON response (example for MA000012)
3. Map fields to `awardConfig.js` structure
4. Build Zod schema from real data (not assumptions)

**Example flow (placeholder — must validate):**

```javascript
// After FWC API returns data, hydration maps it to awardConfig.js shape
const hydrateAwardRates = (apiResponse) => {
  const hydrated = {};

  // Assuming FWC returns: { awards: [ { awardId, rates, classifications, ... } ] }
  apiResponse.awards?.forEach((apiAward) => {
    hydrated[apiAward.awardId] = {
      awardId: apiAward.awardId,
      name: apiAward.name,
      penaltyConfig: {
        earlyMorningThreshold: apiAward.earlyMorningThreshold || 420,
        eveningThreshold: apiAward.eveningThreshold || 1140,
        earlyMorningMultiplier: apiAward.earlyMorningMultiplier || 1.25,
        eveningMultiplier: apiAward.eveningMultiplier || 1.25,
        casualLoadingMultiplier: apiAward.casualLoadingMultiplier || 1.25,
        saturdayMultiplier: apiAward.saturdayMultiplier || 1.5,
        sundayMultiplier: apiAward.sundayMultiplier || 2.0,
        phMultiplier: apiAward.phMultiplier || 2.0,
        overtimeThresholdHours: apiAward.overtimeThresholdHours || 38,
        overtimeFirstTierMultiplier: apiAward.overtimeFirstTierMultiplier || 1.5,
        overtimeSecondTierMultiplier: apiAward.overtimeSecondTierMultiplier || 2.0,
      },
      baseRates: {
        fullTimePartTime: apiAward.fullTimePartTime || {},
        casual: apiAward.casual || {},
      },
      classifications: apiAward.classifications || [],
      ageOptions: sharedAgeOptions, // Static
      juniorClassificationIds: apiAward.juniorClassificationIds || [],
      juniorPercentages: apiAward.juniorPercentages || {},
      allowances: apiAward.allowances || {},
    };
  });

  return hydrated;
};
```

### Pattern 3: Graceful Fallback

**What:** When API fails, use cached rates if available; if no cache, use hardcoded rates. Always show user which source is active.

**Why critical:** App must never break. User must always see a clear message about which rates are being used.

**Implementation:**

```javascript
// In App.js useEffect
const initializeAwardRates = async () => {
  try {
    // 1. Check cache for all awards
    const cachedRates = {};
    AWARD_IDS.forEach(id => {
      const cached = getCachedAwardRates(id);
      if (cached) cachedRates[id] = cached;
    });

    // 2. If all cached and valid, use immediately (no spinner needed)
    if (Object.keys(cachedRates).length === AWARD_IDS.length) {
      setAwardRates(cachedRates);
      setLastUpdated(getLastCacheUpdateTime(AWARD_IDS[0]));
      setAwardLoading(false);
      return;
    }

    // 3. Fetch from proxy (cache miss or partial)
    setAwardLoading(true);
    const fetched = await fetchAwardRates(AWARD_IDS);

    // 4. Success: use fresh rates
    setAwardRates(fetched);
    setLastUpdated(getLastCacheUpdateTime(AWARD_IDS[0]));
    setAwardError(null); // Clear any previous error
    setAwardLoading(false);

  } catch (err) {
    // 5. Failure: try cache → if cache partial, use it + warning
    const cachedRates = {};
    AWARD_IDS.forEach(id => {
      const cached = getCachedAwardRates(id);
      if (cached) cachedRates[id] = cached;
    });

    if (Object.keys(cachedRates).length > 0) {
      // Partial cache exists
      setAwardRates(cachedRates);
      setLastUpdated(getLastCacheUpdateTime(AWARD_IDS[0]));
      setAwardError("Couldn't load rates. Using cached rates — click Retry to try again.");
    } else {
      // No cache: use hardcoded awardConfig.js
      // Signals to calculatePay(): if awardRates[awardId] missing, use getAwardConfig(awardId)
      setAwardRates({});
      setAwardError("Couldn't load rates. Using default rates — click Retry to try again.");
    }
    setAwardLoading(false);
  }
};
```

### Anti-Patterns to Avoid

- **Silent fallback:** Never use hardcoded rates without telling the user. Error banner is mandatory.
- **Partial hydration:** Don't mix API rates for award X with hardcoded rates for award Y. Use all API or all fallback.
- **API key in client code:** `REACT_APP_FWC_API_KEY` in browser is a security leak. Key lives in `process.env` server-side only.
- **No timeout on proxy call:** If FWC API is slow, the browser fetch could hang forever. Set 10-second client timeout.
- **Zod schema too permissive:** `passthrough()` allows invalid fields through. Build strict schema once API shape confirmed.
- **Calculate button enabled during load:** User can click Calculate while rates are loading, using stale/fallback rates unknowingly. Disable button during `loading === true`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **CORS bypass** | Custom CORS workaround or public CORS proxy | Netlify Functions proxy | Secure (API key server-side), reliable, integrated with Netlify, no quota limits |
| **Rate caching** | Manual Date.now() + localStorage logic | localStorage with timestamp + TTL (already in awardRatesService.js) | Existing service is battle-tested; lazy expiry logic handles stale entries correctly |
| **HTTP retry logic** | Manual Promise.retry loop | axios-retry (already installed) | Already configured, 3 retries + exponential backoff, battle-tested |
| **Response validation** | Manual if/else checks on API response | Zod schema validation | Runtime safety, clear error messages, prevents silent failures |
| **Loading state management** | Complex async/await orchestration | Simple useState + useEffect pattern (already in App.js) | Proven React pattern, easier to reason about |
| **Error boundaries** | Try-catch in useEffect without fallback | Error boundary component (defer to v2) | Phase 1 uses simple error state; v2 adds boundary for runtime safety |

## Common Pitfalls

### Pitfall 1: FWC API Response Shape Mismatch (CRITICAL)
**What goes wrong:** Assume FWC API returns data matching hardcoded `awardConfig.js`. Reality: API returns different field names, nesting, or missing classifications.

**Why it happens:** FWC MAAPI v1 is external, undocumented API. No type definitions available. Training data is stale (Feb 2025 cutoff).

**Consequences:**
- Zod validation catches mismatch, but fallback hides the problem
- In production, users silently fall back to stale rates without realizing
- Major refactor needed if API structure fundamentally differs
- Testing regression: "Why do calculations for Retail award different than v1.0?"

**How to avoid:**
- **BEFORE ANY CODING:** Test FWC API directly with sandbox key
- Document exact response JSON (not guesses)
- Example: fetch `https://api.fwc.gov.au/awardrates/find?awardIds=MA000012` with your key, log full response
- Compare response fields vs `awardConfig.js` structure
- Build Zod schema from **real** response, not assumptions
- Add `console.log('FWC API response:', data)` for debugging

**Warning signs:**
- Zod schema keeps rejecting responses (mismatch)
- Tests expect `awardRates[awardId].baseRates.fullTimePartTime` but API returns `awardRates[awardId].rates.ftPT`
- Fallback to hardcoded rates always triggered (silent API failures)

**Validation step:** Add unit test that fetches one real award from proxy, compares response to expected shape.

### Pitfall 2: API Key Exposed in Client-Side Code (SECURITY)
**What goes wrong:** Developer hardcodes `REACT_APP_FWC_API_KEY` in `.env` or React code.

**Why it happens:** Convenience. Forgot that `REACT_APP_*` vars are bundled into JS and visible to anyone inspecting browser.

**Consequences:**
- API key in public GitHub repo → anyone can call FWC API with your quota
- Quota exhaustion → API disabled for our app
- Potential billing charges if FWC charges per request
- Credentials leaked via browser DevTools → malicious actor can impersonate our app

**How to avoid:**
- **NEVER** use `REACT_APP_*` for secrets
- API key lives **ONLY** in Netlify environment variables (Dashboard → Build & Deploy → Environment)
- Netlify function reads `process.env.REACT_APP_FWC_API_KEY` (server-side, not bundled)
- Client calls `/.netlify/functions/fwc-proxy` (same-origin, no CORS, no key sent)
- `.env.local` for development (git-ignored in .gitignore)
- Remove any `REACT_APP_FWC_API_KEY` from `.env` before commit

**Detection:**
- Search codebase: `grep -r "REACT_APP_FWC_API_KEY" src/` (should be zero results)
- Inspect browser DevTools → Application → LocalStorage (should be empty)
- Inspect bundled JS: `grep "FWC.*KEY" build/static/js/*.js` (should not appear)

### Pitfall 3: Calculate Button Enabled While Rates Loading
**What goes wrong:** User enters shifts and clicks Calculate before rates finish loading. App uses fallback rates silently.

**Why it happens:** No loading state enforced on button. Calculate button never disabled.

**Consequences:**
- User sees calculation with stale/fallback rates, doesn't realize
- Debugging confusion: "My rates look wrong"
- User may lodge dispute based on outdated rates

**How to avoid:**
- Disable Calculate button when `awardLoading === true`
- Show loading spinner: "Fetching rates from FWC..."
- After rates load, enable button and spinner disappears
- In WorkHours component: `<button disabled={isLoading} onClick={calculatePay}>`

**Detection:**
- Manual testing: open app, click Calculate immediately → button should be disabled
- Verify spinner shows while loading
- After 2-3 seconds, spinner gone and button enabled

### Pitfall 4: Caching Stale Rates for 90 Days Without User Knowing
**What goes wrong:** FWC updates rates (e.g., Annual Wage Review in July). App loads with 89-day-old cached rates. User sees outdated pay calculation.

**Why it happens:** 90-day TTL seemed safe, but didn't account for unannounced FWC updates or misunderstanding when updates occur.

**Consequences:**
- Worker thinks they're underpaid, but actually paid correctly (rates were old)
- Confidence in app shaken
- Potential for incorrect dispute lodging
- Phase 3 will mitigate by adding "Rates from [date]" + refresh button, but Phase 1 should set foundation

**How to avoid:**
- Phase 1: Implement cache with clear TTL (90 days is okay for v1.1)
- Phase 3: Display cache age to user ("Rates last updated: 2 days ago")
- Phase 3: Offer "Refresh Rates" button (calls clearCache() + re-fetch)
- Monitor FWC update patterns (will track in v1.1 release)
- In future: subscribe to FWC update notifications or check Last-Modified header

**Detection:**
- Manual testing: check browser localStorage for cache timestamp
- Compare displayed rates vs FWC website (manual spot check)
- In Phase 3 QA: set up alerts if rates change unexpectedly

### Pitfall 5: Netlify Function Timeout on Slow Network
**What goes wrong:** User on slow connection. Function calls FWC API, takes >30 seconds. Netlify times out.

**Why it happens:** FWC API can be slow (peak times, network latency). Simple proxy doesn't handle timeout.

**Consequences:**
- User sees blank screen or HTTP 504 error
- No graceful fallback message shown
- App unusable until they refresh

**How to avoid:**
- Set timeout in fetch: if FWC API takes >10 seconds, abort
- Let error propagate to client, which falls back to hardcoded rates
- Retry logic in awardRatesService already handles 3x retry with backoff
- Show loading spinner with message: "Connecting to FWC (this may take a moment)..."

**Detection:**
- Test with slow network: Chrome DevTools → Network tab → throttle to "Slow 3G"
- Verify spinner appears
- Verify fallback message appears after timeout (not blank screen)
- Check browser console for fetch timeout error

## Code Examples

Verified patterns from official sources and codebase:

### Netlify Function Setup (FWC Proxy)

```javascript
// netlify/functions/award-rates.js
// Source: Netlify Functions docs (https://docs.netlify.com/functions/overview/)

export const handler = async (event) => {
  const { awardIds } = event.queryStringParameters || {};

  if (!awardIds) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing awardIds query parameter' }),
    };
  }

  try {
    const apiKey = process.env.REACT_APP_FWC_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // Timeout wrapper: abort if FWC slow (>10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.fwc.gov.au/awardrates/find?awardIds=${awardIds}`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`FWC API ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Award rates proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to fetch award rates',
      }),
    };
  }
};
```

### Rate Hydration with Zod Validation

```javascript
// src/services/awardRatesService.js (updated for Phase 1)
// Source: Existing awardRatesService.js + Zod docs

import { z } from 'zod';

// MUST TIGHTEN THIS SCHEMA ONCE FWC RESPONSE SHAPE IS CONFIRMED
const FWC_AWARD_SCHEMA = z.object({
  awardId: z.string(),
  name: z.string(),
  penaltyConfig: z.object({
    earlyMorningThreshold: z.number(),
    eveningThreshold: z.number(),
    earlyMorningMultiplier: z.number(),
    eveningMultiplier: z.number(),
    casualLoadingMultiplier: z.number(),
    saturdayMultiplier: z.number(),
    sundayMultiplier: z.number(),
    phMultiplier: z.number(),
    overtimeThresholdHours: z.number(),
    overtimeFirstTierMultiplier: z.number(),
    overtimeSecondTierMultiplier: z.number(),
  }).passthrough(), // Allow extra fields for now
  baseRates: z.object({
    fullTimePartTime: z.record(z.object({ base: z.number() }).passthrough()),
    casual: z.record(z.object({ base: z.number() }).passthrough()),
  }).passthrough(),
  classifications: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).passthrough(),
  allowances: z.record(z.number()).passthrough(),
}).passthrough();

export async function fetchAwardRates(awardIds) {
  const idsString = awardIds.join(',');

  try {
    // Call proxy instead of FWC directly (eliminates CORS)
    const response = await fetch(
      `/.netlify/functions/award-rates?awardIds=${idsString}`
    );

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status}`);
    }

    const data = await response.json();
    const ratesMap = {};

    // Validate each award response before storing
    awardIds.forEach((id) => {
      const awardData = data[id]; // Assume FWC returns { MA000012: {...}, MA000003: {...}, ... }
      const parseResult = FWC_AWARD_SCHEMA.safeParse(awardData);

      if (!parseResult.success) {
        console.error(`Validation failed for ${id}:`, parseResult.error);
        throw new Error(`Invalid response shape for award ${id}`);
      }

      ratesMap[id] = parseResult.data;

      // Cache the validated data
      const cacheEntry = {
        data: parseResult.data,
        timestamp: Date.now(),
        expiry: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
      };
      localStorage.setItem(`award_rates_v1_${id}`, JSON.stringify(cacheEntry));
    });

    return ratesMap;
  } catch (error) {
    throw error; // Let caller handle (will use fallback)
  }
}
```

### Loading & Error State in App.js

```javascript
// src/App.js (useEffect + state pattern)
// Source: Existing App.js + React docs

const [awardRates, setAwardRates] = useState(null);
const [awardLoading, setAwardLoading] = useState(true);
const [awardError, setAwardError] = useState(null);

useEffect(() => {
  const initializeAwardRates = async () => {
    try {
      // Check cache first
      const cachedRates = {};
      AWARD_IDS.forEach(id => {
        const cached = getCachedAwardRates(id);
        if (cached) cachedRates[id] = cached;
      });

      if (Object.keys(cachedRates).length === AWARD_IDS.length) {
        // All cached — use immediately
        setAwardRates(cachedRates);
        setAwardLoading(false);
        return;
      }

      // Fetch from proxy
      setAwardLoading(true);
      const fetched = await fetchAwardRates(AWARD_IDS);
      setAwardRates(fetched);
      setAwardError(null);
    } catch (err) {
      // Fallback: use cache if available, else empty (will use awardConfig.js)
      const cachedRates = {};
      AWARD_IDS.forEach(id => {
        const cached = getCachedAwardRates(id);
        if (cached) cachedRates[id] = cached;
      });

      setAwardRates(Object.keys(cachedRates).length > 0 ? cachedRates : {});
      setAwardError("Couldn't load award rates. Using fallback. [Retry]");
    } finally {
      setAwardLoading(false);
    }
  };

  initializeAwardRates();
}, []);

// Disable Calculate button while loading
// <button disabled={awardLoading} onClick={calculatePay}>Calculate</button>
```

## State of the Art

| Old Approach (v1.0) | Current Approach (v1.1) | When Changed | Impact |
|-------------------|------------------------|-------------|--------|
| Hardcoded rates in `awardConfig.js` | Live rates from FWC API + cache fallback | v1.1 Phase 1 | Users see up-to-date rates; app never breaks |
| Browser fetch to FWC (blocked by CORS) | Netlify Functions proxy (server-side) | v1.1 Phase 1 | No CORS errors; API key secure |
| No error handling for API calls | Loading spinner + error banner + retry | v1.1 Phase 1 | Clear UX; users know app status |
| Manual rate entry required | Automatic rate fetch on app load | v1.1 Phase 1 | Better UX; no data entry step |

**Deprecated/outdated:**
- Hardcoding rates: Still used as fallback, but no longer primary source. Phase 1 makes live rates primary; Phase 3 adds transparency (show when rates were fetched).
- Browser-based API calls to CORS-blocked endpoints: Replaced by Netlify proxy.

## Open Questions

1. **FWC API response shape** (BLOCKING)
   - **What we know:** FWC MAAPI v1 exists; returns JSON. Used in v1.0 hardcoded structure as reference.
   - **What's unclear:** Does API return `{ awards: [...] }` or flat object keyed by awardId? Are classifications arrays or objects? Do allowances have separate structure?
   - **Recommendation:** Test with real sandbox key before writing code. Document JSON response in RESEARCH.md addendum.
   - **Mitigation:** Implement strict Zod validation; if API shape differs, validation fails → fallback to hardcoded rates + error message.

2. **FWC API rate limits**
   - **What we know:** No documented rate limits found in v1.0 research.
   - **What's unclear:** Are there quota limits? Throttling? Concurrent request limits?
   - **Recommendation:** Test by making multiple concurrent requests from proxy. Monitor error rates in production.
   - **Mitigation:** Cache for 90 days reduces API calls to ~4/year per user; unlikely to hit limits.

3. **FWC API update frequency**
   - **What we know:** Rates change at least annually (Wage Review in July).
   - **What's unclear:** Do rates change quarterly? Are there emergency updates? When is the best time to cache-bust?
   - **Recommendation:** Monitor actual FWC update patterns in v1.1. Document findings for v2 cache strategy.
   - **Mitigation:** Phase 3 adds "Refresh Rates" button for manual cache-bust.

4. **Netlify Function cold start latency**
   - **What we know:** Typical cold start 100-500ms, warm start 10-50ms.
   - **What's unclear:** Will cold starts be noticeable to users? Should we add loading message for >1s?
   - **Recommendation:** Profile latency in production. If >2s, add "Connecting to FWC..." message.
   - **Mitigation:** Cache (90 days) means cold starts rare after initial load.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via Create React App) |
| Config file | Built-in (CRA); no jest.config.js needed |
| Component testing | React Testing Library (RTL) |
| Test discovery | `src/**/*.test.js` and `src/**/*.spec.js` |
| Quick run command | `npm test -- --testPathPattern="awardRatesService" --watchAll=false` |
| Full suite command | `npm test -- --watchAll=false` |

### Existing Test Count
- **awardRatesService.test.js** — 10 tests (cache, fetch, validation)
- **App.test.js** — Basic smoke tests
- **Component tests** — AwardSelector, EmployeeDetails, Allowances, OverviewBreakdown, WorkHours
- **Regression test** — pharmacyRegression.test.js (covers all v1.0 calculations)
- **Total:** ~61 tests across 7 test files

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? | Wave 0 Gap? |
|--------|----------|-----------|-------------------|-------------|------------|
| PROXY-01 | Netlify Function proxy forwards request to FWC API (no CORS error) | Integration | `npm test -- --testPathPattern="proxy" --watchAll=false` | ❌ Wave 0 | Create `src/__tests__/netlifyProxy.test.js` |
| PROXY-01 | Function returns 200 and valid JSON on success | Unit | Same | ❌ Wave 0 | Mock fetch in function test |
| PROXY-01 | Function returns 500 on FWC API error | Unit | Same | ❌ Wave 0 | Test error paths |
| PROXY-02 | `calculatePay` reads rates from `awardRates` state (not `awardConfig.js`) | Unit | `npm test -- src/App.test.js --watchAll=false` | ⚠️ Partial | Update App.test.js to pass `awardRates` prop to calculatePay |
| PROXY-02 | Hydration maps FWC response to penaltyConfig/baseRates/allowances shape | Unit | `npm test -- --testPathPattern="hydration" --watchAll=false` | ❌ Wave 0 | Create `src/__tests__/hydration.test.js` |
| PROXY-02 | All 61 existing tests still pass (no regression) | Regression | `npm test -- --watchAll=false` | ✅ | None — existing tests should pass as-is |
| PROXY-03 | If proxy fails, app falls back to hardcoded `awardConfig.js` rates | Unit | `npm test -- --testPathPattern="fallback" --watchAll=false` | ❌ Wave 0 | Create `src/__tests__/fallback.test.js` |
| PROXY-03 | Error banner visible when fallback active | Component | `npm test -- src/components/AwardSelector.test.js --watchAll=false` | ⚠️ Partial | Add test for error message rendering |
| UX-03 | Loading spinner shown while rates fetching | Component | Same | ❌ Wave 0 | Add test for `awardLoading === true` state |
| UX-03 | Calculate button disabled while `awardLoading === true` | Component | `npm test -- --testPathPattern="button" --watchAll=false` | ❌ Wave 0 | Test disabled state in WorkHours |
| UX-03 | Retry button re-fetches rates | Component | `npm test -- --testPathPattern="retry" --watchAll=false` | ❌ Wave 0 | Test `onRefresh()` handler in AwardSelector |

### Sampling Rate
- **Per task commit:** Run quick tests for changed module: `npm test -- --testPathPattern="awardRatesService|App" --watchAll=false`
- **Per wave merge:** Run full test suite: `npm test -- --watchAll=false`
- **Phase gate:** Full suite **must pass** (all 61 tests + new tests for Phase 1) before `/gsd:verify-work`

### Wave 0 Gaps

The following test files need to be created to fully validate Phase 1:

- [ ] `src/__tests__/netlifyProxy.test.js` — Test Netlify Function proxy behavior (mock fetch to FWC API; verify function forwards correctly; test error paths)
  - Tests: success case, FWC 4xx error, FWC 5xx error, FWC timeout, invalid response JSON
  - Setup: Mock `fetch` globally; don't call real FWC API

- [ ] `src/__tests__/hydration.test.js` — Test rate hydration mapping (FWC response → awardConfig shape)
  - Tests: Valid FWC response maps correctly; missing classifications detected; Zod validation rejects invalid shape
  - Setup: Define sample FWC responses; test mapping logic

- [ ] `src/__tests__/fallback.test.js` — Test fallback logic (cache miss → fallback to hardcoded)
  - Tests: All cache hit; partial cache hit; no cache hit; localStorage corrupted
  - Setup: Mock localStorage; spy on getCachedAwardRates

- [ ] Update `src/App.test.js` — Add tests for loading/error state
  - Tests: AwardLoading state true/false; error banner appears on failure; success message appears on retry

- [ ] Update `src/components/AwardSelector.test.js` — Add error message + retry button tests
  - Tests: Error message renders when `error` prop set; Retry button calls `onRefresh` prop; button disabled during loading

- [ ] Update `src/components/WorkHours.test.js` — Add Calculate button disabled test
  - Tests: Button disabled when `awardLoading === true`; enabled when false

- [ ] `src/setupTests.js` (if needed) — Global mocks for fetch, localStorage
  - Already exists with jest-dom setup; may need to add fetch mock here for integration tests

**Framework install (if not already present):**
```bash
npm test -- --version  # Verify Jest is present (via CRA)
# No additional install needed — Jest + RTL already in CRA
```

**Validation approach:**
1. **Wave 0 (before implementation):** Create test skeleton files with test names and comments
2. **During implementation:** Implement each test as corresponding code is written
3. **Code review:** Verify all Wave 0 gaps have corresponding tests before merge
4. **Phase gate:** All tests green before `/gsd:verify-work`

## Sources

### Primary (HIGH confidence)
- **Context7 / Codebase:**
  - `src/App.js` — State management, calculatePay signature
  - `src/services/awardRatesService.js` — Cache logic, axios usage, Zod validation
  - `src/config/awardConfig.js` — Rate structure (target for hydration mapping)
  - `src/helpers.js` — calculatePayForTimePeriod signature (unmodified by Phase 1)
  - `.planning/milestones/v1.1-api-integration-ux-redesign/STACK.md` — Netlify Functions setup, Zod usage

### Secondary (MEDIUM confidence)
- **Official Documentation:**
  - [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
  - [Netlify Environment Variables](https://docs.netlify.com/functions/overview/#environment-variables)
  - [Create React App Deployment on Netlify](https://create-react-app.dev/deployment/)
  - [Zod Documentation](https://zod.dev/) — Runtime validation patterns

### Tertiary (Used for context, not critical)
- **Community/Learning:**
  - [CORS Proxy with Netlify | Jim Nielsen](https://blog.jim-nielsen.com/2020/a-cors-proxy-with-netlify/)
  - [React Data Fetching Patterns | freeCodeCamp](https://www.freecodecamp.org/news/the-modern-react-data-fetching-handbook/)

## Metadata

**Confidence breakdown:**
- **Netlify Functions proxy pattern:** HIGH — Well-documented, many examples, proven pattern for CORS bypass
- **React useEffect + state data fetching:** HIGH — v1.0 uses same pattern; stable in React 19
- **Zod validation:** HIGH — Already used in awardRatesService.js; extend for proxy responses
- **localStorage caching:** HIGH — Existing implementation in awardRatesService.js; no changes needed
- **FWC API integration:** LOW-MEDIUM — API response shape unconfirmed; requires real testing before hydration code
- **Rate hydration mapping:** MEDIUM — Pattern is straightforward once API shape known; currently hypothetical
- **Error handling UX:** MEDIUM — Best practices established; execution depends on actual error scenarios

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days; stable architecture, but FWC API shape may change)

**Must-validate before coding:**
1. FWC API response structure (test with sandbox key)
2. Netlify Function cold start latency (profile in dev environment)
3. Cache hit/miss behavior under real network conditions
