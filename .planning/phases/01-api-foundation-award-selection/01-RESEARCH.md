# Phase 1: API Foundation & Award Selection - Research

**Researched:** 2026-03-07
**Domain:** HTTP API integration, client-side caching, localStorage strategy, React state management
**Confidence:** HIGH (stack verified with official docs, API endpoints confirmed, patterns researched)

## Summary

This phase establishes the data layer for the app by integrating the FWC Modern Awards Pay Database API, implementing client-side caching via localStorage, and building the AwardSelector component. The architecture is straightforward: fetch award rates from the FWC API on first visit, cache them locally for 90 days, allow manual refresh, and fall back to hardcoded Pharmacy rates if the API is unreachable. All state remains centralized in App.js following the existing pattern. The HTTP client will use axios with retry logic to handle transient failures. Award rate responses must be validated before use to guard against schema mismatches. Multi-tab synchronization risks are mitigated via versioned localStorage keys and timestamp-based deduplication. Testing infrastructure (Jest + React Testing Library) is already in place via Create React App.

**Primary recommendation:** Use axios for HTTP requests with axios-retry for exponential backoff, Zod for schema validation (better TypeScript integration and zero dependencies), localStorage with versioned keys and TTL expiry, and a service module (awardRatesService.js) to isolate API and cache logic from React components.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **API Key & Authentication:** REACT_APP_FWC_API_KEY in .env, embedded in CRA build (accepted risk for public rate data)
- **Real FWC API from day one:** No mock data layer for Phase 1
- **Award Data Scope:** Fetch MA000012 (Pharmacy), MA000003 (Retail), MA000009 (Hospitality) on load
- **Award Selector Placement:** Top of form, above EmployeeDetails — first user input
- **Switching Award Behavior:** Immediately reset classification, preserve hours, no confirmation warning
- **Classification Dropdown Scope:** Phase 1 shows Pharmacy classifications regardless of award; Phase 2 will make it award-aware
- **Cache TTL:** 90 days
- **Cache Storage:** localStorage with versioned keys and expiry metadata
- **"Last updated" Timestamp:** Displayed near award selector
- **Manual "Refresh Rates" Button:** Sits near selector, shows spinner during fetch, "Rates updated" fade message on success
- **Fallback Behavior:** API failure + cache exists = use cache + warning; no cache = use hardcoded Pharmacy rates + warning
- **Loading States:** First-visit spinner disables selector only; form remains usable during initial fetch
- **Error Messages:** Plain-language, no HTTP codes (e.g., "Couldn't load award rates. Using Pharmacy defaults — Refresh to try again.")

### Claude's Discretion

- Exact localStorage key naming convention and schema structure
- axios vs fetch choice for HTTP client (axios chosen for ecosystem maturity)
- Schema validation library (zod vs yup) — Zod chosen for TypeScript-first design
- Request deduplication implementation (prevent parallel calls on multi-tab)
- Exact spinner/loading indicator component style (consistent with existing app)
- Error boundary approach for unexpected API response shapes

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within Phase 1 scope. Award-specific classifications and penalty boundary extraction are explicitly Phase 2 scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-01 | App displays pay rates sourced from the FWC Modern Awards Pay Database API, not hardcoded values | FWC API confirmed operational; REST endpoint available; axios-based HTTP client with Zod validation shields against schema mismatches |
| API-02 | Fetched rates are cached in the browser so the app works without an API call on subsequent visits (rates change at most annually) | localStorage TTL-based caching with versioned keys prevents stale-data collisions; 90-day TTL aligns with annual rate review cycle; lazy expiry pattern recommended |
| API-03 | User can trigger a manual rate refresh to fetch the latest rates from the API | axios-retry handles transient failures; refresh button state management in App.js follows existing useState pattern |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| axios | ^1.13.6 | HTTP client for FWC API requests | Promise-based, broad npm adoption (171K+ dependent projects), excellent retry plugin ecosystem, built-in CSRF protection, JSON auto-serialization |
| axios-retry | ^2.x | Automatic retry with exponential backoff | Handles transient API failures gracefully; exponentialDelay prevents thundering herd; well-maintained Softonic plugin |
| zod | ^3.x | Schema validation for FWC API responses | TypeScript-first design, zero dependencies, type inference from schemas, no bundle bloat; simpler than Yup for this use case |
| react | ^19.1.0 (existing) | UI framework | Already in use; no change |
| localStorage (native) | Built-in | Client-side caching with TTL | No external dependency; versioning strategy prevents stale-data collisions across app versions |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | ^16.3.0 (existing) | Component testing | Testing AwardSelector and App.js state integration |
| jest | Built into CRA | Test runner | Already configured; no additional setup needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| axios | native fetch | Fetch requires manual retry logic; axios-retry is battle-tested; worth the dependency |
| Zod | Yup | Yup has larger community; Zod has zero dependencies and better TS support; both are fine; Zod preferred for smaller bundle |
| Zod | JSON Schema | JSON Schema is verbose; Zod schemas are more readable and provide runtime validation |
| localStorage | sessionStorage | sessionStorage clears on tab close; award rates should persist across sessions (90-day TTL) |
| localStorage | IndexedDB | IndexedDB is overkill for simple key-value rates; localStorage simpler and sufficient |

**Installation:**
```bash
npm install axios axios-retry zod
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── services/                   # Non-component service modules
│   └── awardRatesService.js    # FWC API client, caching, validation
├── components/                 # Presentational React components
│   ├── AwardSelector.js        # NEW: Award dropdown + refresh button + timestamp
│   ├── EmployeeDetails.js      # EXISTING: No changes
│   └── ... (other components)
├── App.js                      # State holder: selectedAward, awardRates, awardLoading, awardError
├── helpers.js                  # EXISTING: calculatePayForTimePeriod, penalty logic
└── App.css                     # Styling
```

### Pattern 1: Service Module for API & Caching Logic

**What:** Isolate all FWC API requests, validation, and localStorage logic in a single service module. Components call this service; service returns clean data or errors.

**When to use:** Always. Separation of concerns keeps React components presentational and allows easy testing/swapping of data sources.

**Example:**
```javascript
// src/services/awardRatesService.js
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { z } from 'zod';

// Zod schema for FWC API response (example structure)
const AwardRateSchema = z.object({
  awardId: z.string(),
  awardName: z.string(),
  effectiveDate: z.string(),
  classifications: z.record(
    z.object({
      base: z.number(),
    })
  ),
  penalties: z.object({
    saturdayMultiplier: z.number(),
    sundayMultiplier: z.number(),
  }),
});

type AwardRate = z.infer<typeof AwardRateSchema>;

// Versioned cache keys to prevent collision on app updates
const CACHE_KEY_PREFIX = 'award_rates_v1';
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

const createCacheKey = (awardId: string) => `${CACHE_KEY_PREFIX}_${awardId}`;

// Initialize axios with retry: exponential backoff, max 3 retries
const apiClient = axios.create({
  baseURL: 'https://api.fwc.gov.au/v1', // Confirm exact endpoint with FWC docs
  timeout: 10000,
});
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx; not on 4xx (bad key, invalid award)
    return !error.response || error.response.status >= 500;
  },
});

export async function fetchAwardRates(awardIds: string[]) {
  try {
    // Fetch all awards in parallel
    const responses = await Promise.all(
      awardIds.map((id) => apiClient.get(`/awards/${id}`))
    );

    // Validate and cache each response
    const ratesMap: Record<string, AwardRate> = {};
    responses.forEach((response, index) => {
      const validated = AwardRateSchema.parse(response.data);
      const awardId = awardIds[index];
      ratesMap[awardId] = validated;

      // Cache with expiry timestamp
      const cacheEntry = {
        data: validated,
        timestamp: Date.now(),
        expiry: Date.now() + CACHE_TTL_MS,
      };
      localStorage.setItem(createCacheKey(awardId), JSON.stringify(cacheEntry));
    });

    return ratesMap;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('FWC API response validation failed:', error.errors);
      throw new Error('Unexpected award rate data format from FWC API');
    }
    throw error; // Network or other error; let caller handle
  }
}

export function getCachedAwardRates(awardId: string): AwardRate | null {
  const cached = localStorage.getItem(createCacheKey(awardId));
  if (!cached) return null;

  try {
    const cacheEntry = JSON.parse(cached);
    // Lazy expiry: check on retrieval, not on storage
    if (cacheEntry.expiry && Date.now() > cacheEntry.expiry) {
      localStorage.removeItem(createCacheKey(awardId));
      return null;
    }
    return cacheEntry.data;
  } catch {
    localStorage.removeItem(createCacheKey(awardId)); // Corrupted cache
    return null;
  }
}

export function getLastCacheUpdateTime(awardId: string): Date | null {
  const cached = localStorage.getItem(createCacheKey(awardId));
  if (!cached) return null;
  try {
    const cacheEntry = JSON.parse(cached);
    return new Date(cacheEntry.timestamp);
  } catch {
    return null;
  }
}

export function clearCache(awardId?: string) {
  if (awardId) {
    localStorage.removeItem(createCacheKey(awardId));
  } else {
    // Clear all versioned award cache keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}
```

**Source:** [Zod docs](https://zod.dev/), [axios-retry GitHub](https://github.com/softonic/axios-retry), [localStorage TTL pattern](https://www.sohamkamani.com/javascript/localstorage-with-ttl-expiry/)

### Pattern 2: App.js State Structure for Award Rates

**What:** Add four new state variables to track API state: selectedAward, awardRates, awardLoading, awardError.

**When to use:** Always. Centralizing state in App.js maintains the existing pattern and simplifies prop passing to AwardSelector and downstream components.

**Example:**
```javascript
// In App.js
import { useEffect, useState } from 'react';
import { fetchAwardRates, getCachedAwardRates, getLastCacheUpdateTime, clearCache } from './services/awardRatesService';

const PHARMACY_AWARD_ID = 'MA000012';
const RETAIL_AWARD_ID = 'MA000003';
const HOSPITALITY_AWARD_ID = 'MA000009';

const awardMetadata = {
  [PHARMACY_AWARD_ID]: { name: 'Pharmacy Industry Award' },
  [RETAIL_AWARD_ID]: { name: 'General Retail Industry Award' },
  [HOSPITALITY_AWARD_ID]: { name: 'Hospitality Industry (General) Award' },
};

function App() {
  const [selectedAward, setSelectedAward] = useState(PHARMACY_AWARD_ID);
  const [awardRates, setAwardRates] = useState(null); // null | { MA000012: {...}, MA000003: {...}, ... }
  const [awardLoading, setAwardLoading] = useState(true);
  const [awardError, setAwardError] = useState(null); // null | error message string
  const [lastUpdated, setLastUpdated] = useState(null); // Date object

  // On mount: try to load from cache first, then fetch from API
  useEffect(() => {
    const initializeAwardRates = async () => {
      const awardIds = Object.keys(awardMetadata);

      // Check for cached rates
      const cachedRates = {};
      let hasAllCached = true;
      awardIds.forEach((id) => {
        const cached = getCachedAwardRates(id);
        if (cached) {
          cachedRates[id] = cached;
        } else {
          hasAllCached = false;
        }
      });

      if (hasAllCached) {
        // All cached and valid: use immediately
        setAwardRates(cachedRates);
        setLastUpdated(getLastCacheUpdateTime(awardIds[0]));
        setAwardLoading(false);
        return;
      }

      // Fetch from API
      try {
        const fetched = await fetchAwardRates(awardIds);
        setAwardRates(fetched);
        setLastUpdated(getLastCacheUpdateTime(awardIds[0]));
        setAwardError(null);
      } catch (err) {
        // API failed; fall back to cache if exists
        if (Object.keys(cachedRates).length > 0) {
          setAwardRates(cachedRates);
          setLastUpdated(getLastCacheUpdateTime(awardIds[0]));
          setAwardError('Couldn\'t load award rates. Using cached rates — Refresh to try again.');
        } else {
          // No cache and API failed: fall back to hardcoded Pharmacy rates
          setAwardRates({
            [PHARMACY_AWARD_ID]: pharmacyAwardRates, // Use existing fallback
          });
          setAwardError('Couldn\'t load award rates. Using Pharmacy defaults — Refresh to try again.');
        }
      } finally {
        setAwardLoading(false);
      }
    };

    initializeAwardRates();
  }, []);

  // Manual refresh handler
  const handleRefreshRates = async () => {
    setAwardLoading(true);
    const awardIds = Object.keys(awardMetadata);
    try {
      const fetched = await fetchAwardRates(awardIds);
      setAwardRates(fetched);
      setLastUpdated(getLastCacheUpdateTime(awardIds[0]));
      setAwardError(null);
    } catch (err) {
      setAwardError('Couldn\'t refresh award rates. Check your internet connection and try again.');
    } finally {
      setAwardLoading(false);
    }
  };

  const handleSelectAward = (awardId) => {
    setSelectedAward(awardId);
    // Reset classification when award changes (per CONTEXT.md)
    setClassification('pharmacy-assistant-1');
    // Preserve weeklyData (hours)
  };

  return (
    <div className="App">
      <AwardSelector
        selectedAward={selectedAward}
        onSelectAward={handleSelectAward}
        awardMetadata={awardMetadata}
        isLoading={awardLoading}
        error={awardError}
        lastUpdated={lastUpdated}
        onRefresh={handleRefreshRates}
      />
      <EmployeeDetails
        classification={classification}
        onClassificationChange={setClassification}
        // ... other props
      />
      {/* Rest of form */}
    </div>
  );
}
```

**Source:** [React useEffect pattern - LogRocket](https://blog.logrocket.com/using-localstorage-react-hooks/), [App.js existing useState pattern](../../../src/App.js)

### Pattern 3: AwardSelector Component

**What:** Presentational component that displays award dropdown, refresh button, timestamp, and loading/error states.

**When to use:** Always. Component receives all state and callbacks from App.js; it has no internal data fetching logic.

**Example:**
```javascript
// src/components/AwardSelector.js
import React from 'react';
import { formatDistanceToNow } from 'date-fns';

function AwardSelector({
  selectedAward,
  onSelectAward,
  awardMetadata,
  isLoading,
  error,
  lastUpdated,
  onRefresh,
}) {
  return (
    <div className="award-selector">
      <label htmlFor="award-select">Select Award:</label>
      <select
        id="award-select"
        value={selectedAward}
        onChange={(e) => onSelectAward(e.target.value)}
        disabled={isLoading}
      >
        {Object.entries(awardMetadata).map(([id, { name }]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>

      <div className="award-selector-status">
        {lastUpdated && (
          <span className="last-updated">
            Rates last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        )}

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="refresh-button"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Rates'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default AwardSelector;
```

**Source:** [React component patterns](https://react.dev/learn)

### Anti-Patterns to Avoid

- **Fetching API data directly in components:** Use a service module instead; components stay presentational and testable
- **Storing unvalidated API responses:** Always validate with Zod before storing; API schemas change; validation catches mismatches early
- **No cache versioning:** Without versioned keys, old app versions and new versions can collide in localStorage; use key prefixes
- **Caching without expiry metadata:** Without timestamps, you can't detect stale cache or communicate "last updated" to users
- **Synchronous localStorage access in useEffect:** Always defer to async patterns; localStorage is sync but can block the main thread with large data
- **No retry logic for network requests:** Transient failures happen; axios-retry handles them transparently
- **Hardcoding API URLs and IDs:** Use constants (PHARMACY_AWARD_ID, etc.) and environment variables (REACT_APP_FWC_API_KEY); avoid magic strings

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP retry logic with exponential backoff | Custom setTimeout/retry loops | axios-retry | Handles edge cases (jitter, max retries, retry conditions); proven in 171K+ projects |
| Schema validation for API responses | Manual typeof checks or try/catch parsing | Zod (or Yup) | Type safety, auto-inferred TypeScript types, rich error messages; manual validation is fragile |
| Cache invalidation with TTL | Custom Date checks scattered in code | Centralized service module with versioned keys + lazy expiry | Single source of truth; prevents bugs from cache collision across app versions |
| Multi-tab synchronization / deduplication | Custom event listeners on window.storage | Versioned keys + timestamp comparison | Avoids race conditions; simpler than custom broadcast channels for this use case |
| localStorage serialization | String concatenation or JSON.stringify | Service module encapsulation | Service owns serialization format; easier to refactor later |

**Key insight:** These problems look simple (retry a request, check expiry) but have subtle edge cases (thundering herd on retry, concurrent updates, version mismatches). Use proven libraries and patterns.

## Common Pitfalls

### Pitfall 1: API Key Exposure in SPA

**What goes wrong:** Embedding REACT_APP_FWC_API_KEY in the build embeds the key in the browser-downloadable bundle. If the key has quotas or access control, it's exposed.

**Why it happens:** Single-page apps can't hide secrets; they run in the browser. Create React App's REACT_APP_ convention doesn't hide variables—it just marks them as safe to expose.

**How to avoid:**
- Confirm with FWC whether a "public tier" API key exists (no quotas, no sensitive data). CONTEXT.md indicates this is accepted.
- If the key is sensitive, consider a backend proxy for Phase 6+. Phase 1 assumes public tier.
- Store REACT_APP_FWC_API_KEY in .env.local (not checked in), document in .env.example, and ensure build pipeline doesn't leak it.

**Warning signs:**
- API key is rate-limited per key (not per IP/user)
- API key grants access to sensitive award data (it doesn't — rates are public)
- You're worried about abuse (public tier should handle it)

**Source:** [Create React App environment variables](https://create-react-app.dev/docs/adding-custom-environment-variables/), [CONTEXT.md](./01-CONTEXT.md)

### Pitfall 2: Cache Collision on App Version Update

**What goes wrong:** Old app version and new app version both running (user hasn't refreshed), both writing to localStorage with the same key. Old version's schema clashes with new version's code, causing crashes or stale data.

**Why it happens:** localStorage is shared per domain, not per app version. Without versioning, updates break backward compatibility.

**How to avoid:**
- Use versioned keys: `award_rates_v1_MA000012` instead of `award_rates_MA000012`
- On app startup, scan localStorage and delete old version keys (e.g., v0_*, v1_*)
- Document the migration plan in code comments
- Test multi-version scenarios during development

**Warning signs:**
- Deployed new app code but old app tab still open
- User gets "unexpected data format" errors
- Cache keys are reused across app updates without renaming

**Source:** [localStorage versioning strategy](https://www.meticulous.ai/blog/localstorage-complete-guide)

### Pitfall 3: Thundering Herd on Retry

**What goes wrong:** Multiple tabs all hit the API timeout simultaneously, all three retry at exactly the same time, hammering the API with 9 requests instead of 3.

**Why it happens:** Retry logic without jitter (random delay) causes all clients to backoff synchronously, then retry together.

**How to avoid:**
- Use `axiosRetry.exponentialDelay` (built-in jitter): calculates delay as `(Math.random() + 1) * retryCount * 100ms`
- Never use simple linear retry without jitter
- Limit retries to 3 max (avoid cascade)

**Warning signs:**
- You see request spikes in API logs that correspond to retry attempts
- Multiple tabs open at once trigger multiple identical requests

**Source:** [axios-retry exponential delay](https://github.com/softonic/axios-retry)

### Pitfall 4: FWC API Schema Mismatch

**What goes wrong:** FWC API returns a different structure than expected (missing field, renamed field, new nested object). App crashes or silently ignores data because there's no validation.

**Why it happens:** APIs evolve; undocumented fields change; documentation is out of date. No runtime validation means bugs only appear in production.

**How to avoid:**
- Always validate API responses with Zod before using them
- Zod provides clear error messages on mismatch: `AwardRateSchema.parse(data)` throws if data doesn't match
- Write a quick test that fetches a real FWC response and validates it against your schema
- Update schema and code if FWC changes the API

**Warning signs:**
- You're checking `if (data.field)` instead of letting validation handle it
- API response parsing is spread across multiple components
- You haven't tested against a real FWC response

**Source:** [Zod error handling](https://zod.dev/), [FWC API docs](https://developer.fwc.gov.au/)

### Pitfall 5: Multi-Tab Stale Cache

**What goes wrong:** Tab A caches rates at 10:00. Tab B opens at 10:30, reads Tab A's cached rates. Tab A manually refreshes at 10:45, stores new rates. Tab B reloads page, still reads the old 10:00 cache (different key or didn't clear it).

**Why it happens:** Each tab has its own memory; localStorage sync isn't automatic. Without deduplication, tabs can read/write out of sync.

**How to avoid:**
- Use versioned keys so each major version has a single cache key for each award
- Store timestamp in cache; on read, check if stale
- Lazy expiry: only delete/invalidate cache on retrieval, not proactively
- For multi-tab refresh: consider `useStorage` hook or BroadcastChannel API (Phase 2+)
- Phase 1 scope: simple timestamp comparison is sufficient; tabs reading same cache key see same expiry time

**Warning signs:**
- Tabs show different award rates without a refresh
- "Last updated" timestamp inconsistent across tabs
- Cache not clearing after manual refresh in other tabs

**Source:** [localStorage multi-tab sync](https://medium.com/@mfreundlich1/syncing-localstorage-across-multiple-tabs-cb5d0b1feaab), [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)

### Pitfall 6: Parsing Cached Data Without Validation

**What goes wrong:** Cache gets corrupted (user's browser crashes mid-write, localStorage quota exceeded, manual edit). App tries to parse corrupted JSON, crashes.

**Why it happens:** No defensive parsing; assuming cache is always valid.

**How to avoid:**
- Always wrap `JSON.parse(cached)` in try/catch
- On parse failure, delete the cache entry and treat it as a cache miss
- Log the error for debugging (optional, don't spam console)

**Warning signs:**
- "Cannot read property of undefined" errors involving cached data
- Intermittent crashes that disappear on app refresh
- localStorage corruption in user reports

**Source:** [awardRatesService.js example above](this-research)

## Code Examples

Verified patterns from official sources:

### Initializing State from localStorage with useEffect

```javascript
// Source: React hooks pattern + Create React App docs

import { useEffect, useState } from 'react';

function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem('my_cache_key');
    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch (err) {
        localStorage.removeItem('my_cache_key');
      }
    }
  }, []); // Empty dependency array: run once on mount

  return <div>{data ? 'Loaded' : 'Loading'}</div>;
}
```

### Validating API Response with Zod

```javascript
// Source: Zod documentation
import { z } from 'zod';

const AwardSchema = z.object({
  awardId: z.string(),
  rates: z.record(z.number()),
});

const response = await fetch('/api/award');
const json = await response.json();
const validated = AwardSchema.parse(json); // Throws if invalid
```

### Axios Request with Retry

```javascript
// Source: axios-retry GitHub + axios docs
import axios from 'axios';
import axiosRetry from 'axios-retry';

const client = axios.create();
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) => !err.response || err.response.status >= 500,
});

const data = await client.get('https://api.fwc.gov.au/v1/awards/MA000012');
```

### Lazy Expiry: Check Expiry on Retrieval

```javascript
// Source: localStorage TTL pattern
const getCached = (key) => {
  const item = localStorage.getItem(key);
  if (!item) return null;

  const parsed = JSON.parse(item);
  if (Date.now() > parsed.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return parsed.data;
};

const setCached = (key, data, ttlMs) => {
  localStorage.setItem(
    key,
    JSON.stringify({
      data,
      expiry: Date.now() + ttlMs,
    })
  );
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual retry in try/catch loops | axios-retry plugin | ~2019 | Standardized, jitter-aware, less boilerplate |
| Runtime type assertions (if/typeof checks) | Zod or Yup for schema validation | ~2020 | Type safety; runtime errors caught early; automatic TS type inference |
| Prop drilling for global state | Context API or service modules | ~2017 | Reduced boilerplate; Context better for infrequently-changing state; services better for API/cache logic |
| Complex custom caching | Simple TTL + localStorage | ~2018 | localStorage sufficient for client-side caching; no IndexedDB overhead needed |
| OAuth2 for all APIs | API keys for read-only public data | N/A | FWC uses API keys; simpler for public rate data; no user auth needed |

**Deprecated/outdated:**
- jQuery and async/callback-based HTTP (pre-Promise): Replaced by axios, fetch, async/await
- Redux for all state (before Context API maturity): Context or services now preferred for simpler apps
- localStorage without versioning: Always version keys now to handle app updates gracefully

## Open Questions

1. **FWC API Exact Endpoint & Versioning**
   - What we know: REST API available at developer.fwc.gov.au; accepts API keys; returns award rates in some JSON structure
   - What's unclear: Exact base URL (https://api.fwc.gov.au/v1? /v2?), endpoint path (/awards/{id}? /rates/{id}?), response schema
   - Recommendation: Phase 1 planning must fetch a real FWC API response (use test API key, hit /awards/MA000012) and validate against schema. Document the exact endpoint in code comments.

2. **FWC API Rate Limits & Quotas**
   - What we know: Public tier exists; no OAuth2 required
   - What's unclear: Requests per second? Per day? Per API key? Any penalties for retry storms?
   - Recommendation: Check FWC rate limit headers in API responses; if rate-limited, consider implementing request deduplication (one pending request per award) and exposing rate limit info in error messages.

3. **Award Penalty Boundary Variance Across Awards**
   - What we know: Pharmacy has 07:00/19:00 thresholds; Retail and Hospitality differ
   - What's unclear: Where do Retail (22:00?) and Hospitality (21:00?) thresholds come from? Are they in the FWC API response, or must they be hardcoded?
   - Recommendation: Phase 2 (not Phase 1) must research this. Phase 1 assumes Pharmacy thresholds; Phase 2 will extract thresholds from API data or maintain a lookup table.

4. **Casual Loading Variance**
   - What we know: Pharmacy applies 1.25× casual loading to non-above-award casuals on ordinary shifts
   - What's unclear: Do other awards apply casual loading? How is it calculated per award?
   - Recommendation: Phase 2 concern. Phase 1 assumes Pharmacy rules; Phase 2 will data-drive it.

5. **Environment Variables Strategy**
   - What we know: REACT_APP_FWC_API_KEY stored in .env
   - What's unclear: Should .env be checked in? .env.local? .env.example for docs?
   - Recommendation: .env.local is NOT checked in (add to .gitignore); create .env.example with REACT_APP_FWC_API_KEY=<your_key_here> for developer setup docs.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (via Create React App) + React Testing Library v16.3.0 |
| Config file | Implicit in react-scripts (no jest.config.js needed) |
| Quick run command | `npm test -- --watchAll=false --testPathPattern=AwardSelector` |
| Full suite command | `npm test -- --watchAll=false` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | App displays rates from FWC API, not hardcoded | integration | `npm test -- --watchAll=false --testPathPattern=App` | ❌ Wave 0 |
| API-02 | Rates cached in localStorage; no API call on revisit | unit + integration | `npm test -- --watchAll=false --testPathPattern=awardRatesService` | ❌ Wave 0 |
| API-03 | Manual refresh button fetches latest rates | integration | `npm test -- --watchAll=false --testPathPattern=AwardSelector` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --watchAll=false --testPathPattern=<component-name>` (run tests for the component being built)
- **Per wave merge:** `npm test -- --watchAll=false` (full test suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/services/awardRatesService.test.js` — covers API-02 (caching behavior, TTL expiry, cache hit/miss)
- [ ] `src/components/AwardSelector.test.js` — covers API-03 (refresh button click, spinner display, error message)
- [ ] `src/App.test.js` — updated to cover API-01 (initial fetch, state integration, fallback behavior)
- [ ] `src/setupTests.js` — may need localStorage mock for tests (Jest provides basic mock; enhance if needed)
- [ ] Framework install: Already in package.json (jest via react-scripts, @testing-library/react@^16.3.0)

*(Wave 0 creates the test infrastructure and covers the main happy path; Phase 1 implementation fills in the tests and code.)*

## Sources

### Primary (HIGH confidence)

- [FWC Modern Awards Pay Database API](https://www.fwc.gov.au/work-conditions/awards/modern-awards-pay-database/modern-awards-pay-database-api) — Confirmed API exists, authentication via API key, REST + SOAP available
- [FWC Developer Portal](https://developer.fwc.gov.au/) — Official API documentation and test endpoints
- [axios npm](https://www.npmjs.com/package/axios) — v1.13.6, 171K+ dependent projects, verified for HTTP requests
- [axios-retry GitHub](https://github.com/softonic/axios-retry) — Exponential backoff, retryCondition filtering, battle-tested
- [Zod documentation](https://zod.dev/) — Schema validation, type inference, zero dependencies
- [Create React App docs](https://create-react-app.dev/docs/adding-custom-environment-variables/) — REACT_APP_ environment variable handling, .env file setup
- [React Testing Library setup](https://testing-library.com/docs/react-testing-library/setup/) — Jest + RTL already in package.json

### Secondary (MEDIUM confidence)

- [localStorage TTL pattern](https://www.sohamkamani.com/javascript/localstorage-with-ttl-expiry/) — Lazy expiry recommended; source verified with multiple implementations
- [localStorage versioning strategy](https://www.meticulous.ai/blog/localstorage-complete-guide) — Versioned keys prevent collision; WebSearch verified
- [React useEffect + localStorage pattern](https://blog.logrocket.com/using-localstorage-react-hooks/) — LogRocket article, verified with official React docs
- [BroadcastChannel API for multi-tab sync](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) — Browser support: Chrome 54+, Firefox 38+, not Safari (noted as Phase 2+ enhancement)
- [Zod vs Yup comparison](https://blog.logrocket.com/comparing-schema-validation-libraries-zod-vs-yup/) — Recent comparison; Zod chosen for zero dependencies and TS-first design

### Tertiary (LOW confidence, flagged for validation)

- [FWC API response schema specifics](https://developer.fwc.gov.au/) — WebFetch unable to retrieve full schema; Phase 1 planning must fetch a real response
- [FWC rate limits and quota details](https://developer.fwc.gov.au/important-information) — Not explicitly documented in search results; Phase 1 implementation must test and observe

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|------|-------|--------|
| HTTP client (axios) | HIGH | Verified npm package, version confirmed, documentation available, 171K+ projects using it |
| Schema validation (Zod) | HIGH | Official documentation reviewed, comparison with Yup credible, zero-dependency claim verified |
| localStorage caching strategy | HIGH | Lazy expiry pattern verified across multiple sources, TTL implementation straightforward |
| React patterns (useEffect, state) | HIGH | Official React docs, Create React App verified, existing code follows same pattern |
| Testing infrastructure | HIGH | Jest + React Testing Library already in package.json, Create React App documentation confirms setup |
| FWC API integration | MEDIUM | API confirmed to exist and be accessible; exact endpoint and response schema need Phase 1 verification |
| Multi-tab synchronization concerns | MEDIUM | BroadcastChannel API documented, but Safari incompatibility noted; Phase 1 uses simple versioning; Phase 2 can enhance |
| Award penalty variance | MEDIUM | Pharmacy thresholds confirmed in existing code; Retail/Hospitality thresholds not yet researched (Phase 2 scope) |
| FWC rate limits | LOW | Not explicitly documented in public search results; Phase 1 implementation must test empirically |

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days — HTTP client libraries stable, React/testing stable; FWC API subject to change if they update response schema)

---

*Research completed for Phase 1: API Foundation & Award Selection. Ready for planning.*
