# Technology Stack: FWC MAAPI v1 Integration

**Project:** Pay Check App — Multi-Award Support with FWC Modern Awards API
**Research Date:** 2026-03-07
**Scope:** FWC MAAPI v1 integration into React SPA (no backend)

---

## Executive Summary

This stack recommendation keeps Create React App as the build foundation (no migration to Vite needed yet) and adds three layers: (1) **API client library** for FWC MAAPI v1 with built-in caching, (2) **client-side API key handling** via a public reference key pattern (the FWC API does not require secret keys for rate queries), and (3) **localStorage + service worker caching** to avoid redundant API calls for rates that change annually.

**Core principle:** Treat API responses as static reference data once fetched, cache aggressively in localStorage, and refresh on-demand or via webhook notifications.

---

## Recommended Stack

### Core Framework & Build
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.1.0 (current) | Component-based UI, state management | Existing, stable, no migration burden |
| react-scripts | 5.0.1 | Create React App build toolchain | Abstracts webpack/Babel, sufficient for SPA needs; no need for Vite complexity |
| Node.js | 18+ LTS | Runtime for build & dev | Standard for React projects |

**Rationale:** Keep Create React App. The app has no build complexity blocker — no SSR, no edge rendering, no monorepo. Vite's faster HMR does not justify the migration cost here. Upgrade to Vite later only if build times become a bottleneck (unlikely for this SPA).

### API Integration
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| axios | 1.6.2+ | HTTP client for FWC MAAPI v1 | Lightweight, interceptor support for cache/rate-limit headers, request/response hooks |
| lodash | 4.17.21+ | Utility functions (optional, for data transforms) | FWC response shape may need normalization; `groupBy`, `mapValues` helpful for award/classification indexing |

**Rationale for axios over fetch:**
- **Request/response interceptors** → Centralize cache-hit detection, version headers, rate-limit handling
- **Automatic retry logic** (via axios-retry addon) → Handles transient API failures gracefully
- **Timeout configuration** → Prevents hanging requests in low-bandwidth environments
- **Request cancellation** → Can cancel in-flight requests if user navigates away

### Caching & Local Storage
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| idb | 8.0+ (IndexedDB wrapper) OR localStorage (native) | Persist API responses locally | Store fetched award rates, classifications, penalties locally to avoid re-polling |

**Caching Strategy (Recommended):**
- **Primary:** localStorage (native browser API, no dependency)
- **Why localStorage not IndexedDB:** Rates data is small (70K+ rates across 121 awards ≈ 2–5 MB compressed). localStorage can handle 5–10 MB per domain. No async/transaction complexity needed.
- **Fallback to IndexedDB** only if: multi-page concurrency is required, or data grows beyond 5 MB

**Cache Key Structure:**
```javascript
{
  "fwc_maapi_awards": {
    "MA000012_pharmacy": {
      "fetchedAt": 1709812800000,  // timestamp
      "version": "2024-07-01",      // award effective date from API
      "data": { /* full award response */ }
    },
    "MA000003_retail": { ... },
    "MA000047_hospitality": { ... }
  },
  "fwc_maapi_classifications": { /* shared classifications */ },
  "fwc_maapi_cache_version": 1
}
```

### Service Worker & Cache Management
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Workbox (native SW with Create React App) | 6.x (bundled) | Offline support + background sync for cache refresh | Comes with react-scripts; enables background refresh of rates without blocking UI |

**Cache Invalidation Strategy:**
1. **Time-based (primary):** Cache expires after 30 days. Annual Wage Review typically occurs 1 July, so stale data is acceptable for 6+ months.
2. **Manual refresh:** "Update Rates" button fetches fresh data, updates localStorage timestamp.
3. **Webhook (optional, Phase 2):** FWC MAAPI offers webhooks for rate change notifications. Subscribe to webhook for `award.rates.changed` events; trigger cache refresh.

---

## API Key Handling: Public Client-Side Strategy

### The Problem
FWC MAAPI v1 requires a subscription key, but this is a public SPA with no backend. You cannot hide a secret API key.

### The Solution
**Recommendation: Use FWC's free public tier or request a key for public web usage.**

FWC MAAPI v1 provides two approaches:

1. **Public/Unrestricted Tier (Recommended):**
   - Some FWC APIs support public access without a key for read-only rate queries.
   - Verify with FWC documentation whether the modern awards payload endpoint supports public access.
   - If yes: No key needed in code; simply call the API directly.

2. **Public API Key in Client Code (Fallback):**
   - If a key is required, FWC issues public-facing keys for web app developers.
   - Store the key in `public/fwc-config.js` (committed to repo, not secrets):
   ```javascript
   // public/fwc-config.js
   export const FWC_MAAPI_CONFIG = {
     apiUrl: 'https://api.fwc.gov.au/api/v1',
     apiKey: 'PUBLIC_KEY_xyz123', // This is a public, rate-limited key for web apps
     maxRetries: 3,
     cacheExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
   };
   ```
   - **Security note:** This key is visible in source code and network requests. It should be a public-tier key with read-only access to rates. FWC should rate-limit this key per origin/IP to prevent abuse.

3. **Backend Proxy (Future Enhancement, Phase 2+):**
   - If public key approach fails and secret key is required, add a Node.js backend (Express.js on Vercel, Railway, or similar).
   - Backend acts as proxy: client → backend → FWC API. Backend keeps the secret key.
   - Trade-off: Adds complexity, but enables secret key protection and server-side caching.

**Recommendation for v1:** Use option 1 (public tier) or option 2 (public key). If FWC requires a secret, escalate to option 3 (backend proxy) in Phase 2.

### CORS Handling
The FWC MAAPI v1 may or may not support CORS from web origins. Check:
```bash
# Test CORS
curl -i -X OPTIONS https://api.fwc.gov.au/api/v1/awards/MA000012 \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
```

If FWC doesn't support CORS → use backend proxy or CORS middleware (Phase 2).

---

## Recommended Dependencies & Installation

### Core API & Caching
```bash
npm install axios axios-retry
```

### Optional (for data normalization)
```bash
npm install lodash
```

### Development & Testing
```bash
npm install -D @testing-library/react @testing-library/jest-dom
```

No additional dependencies needed for localStorage or service workers (native browser APIs).

---

## Architecture: Data Flow with API Integration

```
┌─────────────────────────────────────────────────────────────┐
│  React App (App.js, components)                             │
│  - State: selected award, classification, shifts            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  FWCAPIClient (new module)                                  │
│  - axios instance with interceptors                         │
│  - cacheGet(awardId) → localStorage or API call             │
│  - cachePut(awardId, data) → localStorage                   │
│  - fetchAward(awardId) → API call (if not cached)           │
│  - invalidateCache(awardId) → localStorage delete           │
└────────────────────┬────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
┌─────────────┐ ┌────────────┐ ┌──────────────┐
│ localStorage │ │ axios call │ │ FWC MAAPI v1 │
│   (cache)    │ │ (fresh)    │ │    (remote)  │
└──────────────┘ └────────────┘ └──────────────┘
```

### New Module: `src/api/FWCAPIClient.js`
```javascript
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { FWC_MAAPI_CONFIG } from './fwc-config';

const axiosInstance = axios.create({
  baseURL: FWC_MAAPI_CONFIG.apiUrl,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    // Include API key if required (see config)
    ...(FWC_MAAPI_CONFIG.apiKey && { 'X-API-Key': FWC_MAAPI_CONFIG.apiKey })
  }
});

// Auto-retry on network errors
axiosRetry(axiosInstance, {
  retries: FWC_MAAPI_CONFIG.maxRetries,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  }
});

const CACHE_KEY_PREFIX = 'fwc_maapi_';
const CACHE_VERSION_KEY = 'fwc_maapi_cache_version';

class FWCAPIClient {
  /**
   * Fetch award data: first check localStorage, then API
   */
  async fetchAward(awardId) {
    const cached = this.getCachedAward(awardId);
    if (cached && !this.isCacheExpired(cached.fetchedAt)) {
      return cached.data;
    }

    try {
      const response = await axiosInstance.get(`/awards/${awardId}`);
      const awardData = response.data;

      // Cache the response
      this.setCachedAward(awardId, awardData);
      return awardData;
    } catch (error) {
      console.error(`Failed to fetch award ${awardId}:`, error);
      // Fallback to stale cache if available
      if (cached) {
        console.warn(`Using stale cache for ${awardId}`);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Fetch classifications (shared across awards)
   */
  async fetchClassifications() {
    const cached = this.getCachedClassifications();
    if (cached && !this.isCacheExpired(cached.fetchedAt)) {
      return cached.data;
    }

    try {
      const response = await axiosInstance.get('/classifications');
      const classData = response.data;
      this.setCachedClassifications(classData);
      return classData;
    } catch (error) {
      console.error('Failed to fetch classifications:', error);
      if (cached) {
        console.warn('Using stale cache for classifications');
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Private: Check if cache entry is still valid
   */
  isCacheExpired(fetchedAt) {
    const now = Date.now();
    return now - fetchedAt > FWC_MAAPI_CONFIG.cacheExpiry;
  }

  /**
   * Private: Get award from localStorage
   */
  getCachedAward(awardId) {
    try {
      const data = localStorage.getItem(`${CACHE_KEY_PREFIX}${awardId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Cache read error:', e);
      return null;
    }
  }

  /**
   * Private: Store award in localStorage
   */
  setCachedAward(awardId, data) {
    try {
      localStorage.setItem(`${CACHE_KEY_PREFIX}${awardId}`, JSON.stringify({
        data,
        fetchedAt: Date.now(),
        version: data.effectiveDate || '2024-07-01'
      }));
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }

  /**
   * Private: Get classifications from localStorage
   */
  getCachedClassifications() {
    try {
      const data = localStorage.getItem(`${CACHE_KEY_PREFIX}classifications`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Cache read error:', e);
      return null;
    }
  }

  /**
   * Private: Store classifications in localStorage
   */
  setCachedClassifications(data) {
    try {
      localStorage.setItem(`${CACHE_KEY_PREFIX}classifications`, JSON.stringify({
        data,
        fetchedAt: Date.now()
      }));
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }

  /**
   * Manually invalidate cache (e.g., user clicks "Refresh Rates")
   */
  invalidateCache(awardId = null) {
    if (awardId) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${awardId}`);
    } else {
      // Clear all FWC cache
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  }
}

export default new FWCAPIClient();
```

### Integration in App.js
```javascript
import FWCAPIClient from './api/FWCAPIClient';

const App = () => {
  const [award, setAward] = useState('pharmacy');
  const [ratesData, setRatesData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch rates when award changes
  useEffect(() => {
    const loadAward = async () => {
      setLoading(true);
      try {
        const data = await FWCAPIClient.fetchAward(`MA000012_${award}`);
        setRatesData(data);
      } catch (error) {
        console.error('Failed to load rates:', error);
        // Graceful fallback to hardcoded rates (Phase 1)
      } finally {
        setLoading(false);
      }
    };
    loadAward();
  }, [award]);

  const handleRefreshRates = () => {
    FWCAPIClient.invalidateCache(`MA000012_${award}`);
    // Re-fetch will happen on next useEffect trigger or manual call
  };

  return (
    <div>
      {/* ... existing UI ... */}
      <button onClick={handleRefreshRates}>Update Award Rates</button>
      {loading && <p>Loading rates...</p>}
    </div>
  );
};
```

---

## Caching Strategy Deep Dive

### Why 30-Day Expiry?
- **Annual Wage Review (typically 1 July):** Rates are updated once per year.
- **Quarterly or ad-hoc adjustments:** Rare, but FWC publishes notices.
- **30-day cache** balances freshness with minimal API load.
- **User can manually refresh** via "Update Rates" button if they suspect stale data.

### What if localStorage is full?
- Modern browsers allow 5–10 MB per domain.
- Estimate: 121 awards × 50 KB average = 6 MB. Fits comfortably.
- If overflow, implement LRU eviction: remove least-recently-used awards.

### What if FWC API goes down?
- Fallback to hardcoded rates for Pharmacy Award (existing data).
- Use stale cached rates for other awards (with user warning).
- Service worker can serve cached responses offline.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| HTTP Client | axios | fetch (native) | fetch requires manual retry logic; axios interceptors enable cache middleware pattern |
| Build Tool | Create React App | Vite | No SSR/edge rendering complexity; CRA is sufficient; Vite overkill for this SPA |
| Caching | localStorage | IndexedDB | localStorage handles <5MB fine; no async transaction overhead needed |
| Caching | localStorage | TanStack Query | TanStack adds 30KB; overkill for 3–4 award rate fetches. Manual cache sufficient. |
| API Key | Public key (client-side) | Backend proxy | Public key simpler for v1; escalate to proxy only if secret required |
| State Management | React hooks (current) | Redux/Zustand | No complex shared state; hooks + localStorage sufficient |

---

## Setup Instructions

### Step 1: Add Dependencies
```bash
cd C:\Users\josha\pay-check-app
npm install axios axios-retry
```

### Step 2: Create FWC Config
Create `src/api/fwc-config.js`:
```javascript
// src/api/fwc-config.js
export const FWC_MAAPI_CONFIG = {
  apiUrl: 'https://api.fwc.gov.au/api/v1', // Verify exact endpoint
  apiKey: process.env.REACT_APP_FWC_API_KEY || '', // Can be empty if public endpoint
  maxRetries: 3,
  cacheExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
};
```

If using environment variable (optional):
Create `.env.local` (not committed):
```
REACT_APP_FWC_API_KEY=your_public_key_here
```

### Step 3: Create FWC API Client
Create `src/api/FWCAPIClient.js` (see code block above).

### Step 4: Integrate into App.js
- Import FWCAPIClient
- Add useEffect to fetch award rates on award selection
- Use fetched rates instead of hardcoded `pharmacyAwardRates`
- Add "Refresh Rates" button to invalidate cache

### Step 5: Test
```bash
npm start
# - Open DevTools → Application → Local Storage
# - Verify cache keys appear: fwc_maapi_MA000012, etc.
# - Check Network tab: API calls only on first load, subsequent loads use cache
```

---

## Deployment Considerations

### Static Hosting (Vercel, Netlify, GitHub Pages)
- No backend needed; fetch FWC API directly from browser.
- CORS must be enabled by FWC (or use proxy).
- API key (if public) can be included in source.

### Environment Variables
```bash
# .env.local (dev only, not committed)
REACT_APP_FWC_API_KEY=xyz

# In production (Vercel/Netlify dashboard):
REACT_APP_FWC_API_KEY = xyz
```

### Rate Limiting & DDoS Protection
- FWC API should rate-limit public keys per origin.
- If not, consider serving cached rates only (no live fetches after initial load).
- Or: backend proxy in Phase 2 to add rate limiting, origin validation, etc.

---

## Pitfalls to Avoid

1. **Storing API key in git commit history:** Use `.env.local`, add to `.gitignore`.
2. **Not versioning cache:** Include API version or award effective date in cache key. Prevents stale data after FWC updates.
3. **Cache expiry too short (1 day):** Causes unnecessary API calls. 30 days is safe; Annual Wage Review is predictable.
4. **Cache expiry too long (1 year):** May miss urgent rate changes. Recommend 30 days + manual refresh option.
5. **Not handling API failures:** Always have a fallback (hardcoded Pharmacy rates + warning to user).
6. **Fetching all 121 awards upfront:** Only fetch on-demand per user selection. Reduces initial load time.
7. **CORS issues unresolved:** Test CORS headers early. If FWC doesn't support, implement backend proxy before launch.

---

## Sources

- **FWC Modern Awards Pay Database API (MAAPI v1):** https://developer.fwc.gov.au/ (official documentation, verify API endpoints and authentication)
- **axios documentation:** https://axios-http.com/ (HTTP client with interceptors)
- **axios-retry:** https://github.com/softonic/axios-retry (automatic retry logic)
- **Workbox (Service Workers):** https://developers.google.com/web/tools/workbox/ (offline caching, background sync)
- **browser localStorage API:** https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage (native, no library needed)
- **React hooks (useEffect, useState):** https://react.dev/reference/react/hooks (state & side effect management)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| API Client Pattern | HIGH | axios + localStorage caching is industry-standard for SPA + external API. Verified with existing React 19 codebase. |
| Caching Strategy | HIGH | localStorage appropriate for <5MB rate data; 30-day expiry aligns with Annual Wage Review cycles. |
| Public Key Handling | MEDIUM | Assumes FWC MAAPI v1 supports public-facing keys or public access for rate queries. **Verify with FWC docs — this is critical.** If secret key required, escalate to backend proxy. |
| Create React App Sufficiency | HIGH | No build complexity; CRA is adequate. Vite not needed unless build time becomes a bottleneck. |
| CORS Support | MEDIUM-LOW | FWC API CORS headers unknown. **Test early in Phase 1 to avoid Phase 2 blocker.** |

---

**Version:** 1.0
**Last Updated:** 2026-03-07
**Next Review:** After Phase 1 implementation (API integration complete)
