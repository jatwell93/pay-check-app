# Architecture Patterns: v1.1 API Integration & UX Redesign

**Domain:** Australian award calculator SPA with live FWC rate integration
**Researched:** 2026-03-09

---

## Recommended Architecture

v1.1 extends v1.0's architecture with two new layers: (1) serverless proxy for FWC API, and (2) Tailwind styling layer.

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    React SPA (Browser)                   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              App.js (State Root)                  │   │
│  │  - awardRates: live API or fallback hardcoded    │   │
│  │  - loading: boolean (API fetch in progress)      │   │
│  │  - error: string | null (API fetch failed)       │   │
│  │  - calculatePay() logic                          │   │
│  └──────────────────────────────────────────────────┘   │
│     ↑              ↓              ↓              ↓        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Tailwind  │ │Form      │ │Summary   │ │Breakdown │   │
│  │Layout    │ │Inputs    │ │(green/   │ │Table     │   │
│  │Navy/     │ │(Award,   │ │red)      │ │(styled)  │   │
│  │White     │ │Time,     │ │          │ │          │   │
│  │Theme     │ │Allowance)│ │          │ │          │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         awardRatesService.js (Service)           │   │
│  │  - loadRates() → fetch from proxy, validate, cache │
│  │  - clearCache() → remove cached rates            │   │
│  └──────────────────────────────────────────────────┘   │
│                   ↓                                       │
│                /.netlify/functions/fwc-proxy             │
│                   (same-origin request)                  │
└─────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│          Netlify Edge (Serverless Function)              │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ netlify/functions/fwc-proxy.js                   │   │
│  │  - Accept awardIds from query param             │   │
│  │  - Use server-side API key from env vars        │   │
│  │  - Forward request to FWC MAAPI v1 (no CORS)    │   │
│  │  - Return response to client                    │   │
│  │  - Handle errors gracefully                     │   │
│  └──────────────────────────────────────────────────┘   │
│                   ↓                                       │
│      FWC MAAPI v1 (External API)                         │
│      https://api.fwc.gov.au/awardrates/find             │
└─────────────────────────────────────────────────────────┘

Storage (Client-Side)
├── localStorage: cached FWC rates (90-day TTL)
├── sessionStorage: shift data (current session only)
└── awardConfig.js: hardcoded fallback rates (embedded in bundle)
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **App.js** | State root for entire app. Holds `awardRates`, `loading`, `error`. Manages data flow. Calls `calculatePay()`. | EmployeeDetails, Allowances, WorkHours, OverviewBreakdown, awardRatesService |
| **awardRatesService.js** | Fetches rates from proxy, validates with Zod, caches to localStorage. Implements retry logic. | Netlify proxy function, localStorage, awardConfig.js (fallback) |
| **EmployeeDetails.js** | Form: award selector, employment type, classification, junior age. Presentational; all state in App. | App.js (via props/callbacks) |
| **Allowances.js** | Form: dynamically populated checkboxes/inputs based on selected award. Presentational. | App.js (via props/callbacks) |
| **WorkHours.js** | Form: daily shift start/end times, public holiday toggles, Calculate button. Presentational. | App.js (via props/callbacks) |
| **OverviewBreakdown.js** | Display: weekly pay summary + per-day breakdown table. Green/red status indicators. Presentational. | App.js (via props); DetailedBreakdown (accordion toggle) |
| **DetailedBreakdown.js** | Display: per-day segment table (times, rates, multipliers, amounts). Inline in OverviewBreakdown. | App.js (via props) |
| **LoadingSpinner.js** | Display: animated spinner while API fetch in progress. Shown while `loading === true`. | App.js (via conditional rendering) |
| **ErrorBanner.js** | Display: error message + retry button. Shown when API fetch fails. Calls `onRetry` callback. | App.js (via conditional rendering + callback) |

---

## Data Flow: Request → Validation → Hydration → Calculation

### Step 1: App Mount & Rate Load
```javascript
// App.js useEffect (on mount)
useEffect(() => {
  const loadRates = async () => {
    try {
      setLoading(true);
      const rates = await awardRatesService.loadRates();
      setAwardRates(rates);  // Live API or fallback
      setError(null);
    } catch (err) {
      setError(err.message);
      // awardRatesService already fell back to awardConfig.js
      setAwardRates(awardConfig);  // Hardcoded fallback
    } finally {
      setLoading(false);
    }
  };

  loadRates();
}, []);
```

### Step 2: Service Layer (awardRatesService.js)
```javascript
export async function loadRates(awardIds = ['MA000012', 'MA000003', 'MA000009']) {
  // Check cache first (localStorage, 90-day TTL)
  const cached = getFromCache(awardIds);
  if (cached && !isExpired(cached)) {
    return cached.data;  // Use cached rates
  }

  try {
    // Fetch from Netlify proxy (same-origin)
    const response = await fetch(`/.netlify/functions/fwc-proxy?awardIds=${awardIds}`);

    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status}`);
    }

    const data = await response.json();

    // Validate with Zod schema (permissive for now)
    const validated = ratesSchema.parse(data);

    // Cache to localStorage with timestamp
    saveToCache(awardIds, validated, 90 * 24 * 60 * 60 * 1000);  // 90 days in ms

    return validated;
  } catch (error) {
    console.error('Failed to fetch rates from FWC:', error);

    // Fallback to hardcoded rates
    return awardConfig.getAwardRates();
  }
}
```

### Step 3: Proxy Function (netlify/functions/fwc-proxy.js)
```javascript
export async function handler(event) {
  const { awardIds } = event.queryStringParameters || {};

  if (!awardIds) {
    return { statusCode: 400, body: JSON.stringify({ error: 'awardIds required' }) };
  }

  try {
    const apiKey = process.env.REACT_APP_FWC_API_KEY;
    const response = await fetch('https://api.fwc.gov.au/awardrates/find', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ awardIds: awardIds.split(',') }),
    });

    if (!response.ok) {
      throw new Error(`FWC API error: ${response.status}`);
    }

    const data = await response.json();

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

### Step 4: State Update & Re-render
```javascript
// App.js state after rates load
const [awardRates, setAwardRates] = useState(awardConfig.getAwardRates());  // Initial fallback
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Once rates load (API or fallback), state updates:
// awardRates = { MA000012: {...}, MA000003: {...}, ... }
// loading = false
// error = null | 'API error message'

// Components re-render with new rates
// calculatePay() now reads from awardRates (live or cached)
```

### Step 5: Calculate with Live Rates
```javascript
// App.js calculatePay() function (unchanged from v1.0)
const handleCalculate = () => {
  const result = calculatePay(
    shifts,          // User-entered shift times
    selectedAward,   // e.g., 'MA000012'
    employmentType,  // 'casual', 'full-time', 'part-time'
    classification,  // e.g., 'Pharmacy Assistant Level 1'
    awardRates[selectedAward],  // Live rates from API or fallback
    allowancesToApply
  );

  setPayResult(result);  // Display with green/red status
};
```

---

## Error Handling & Graceful Degradation

### Scenario 1: API Succeeds
```
User opens app → Loading spinner shows → FWC API returns rates →
rates cached → spinner hidden → App ready with live rates
```

### Scenario 2: API Fails (Network Error)
```
User opens app → Loading spinner shows → FWC API unreachable →
Proxy returns 500 → Service falls back to awardConfig.js →
Error banner shows "Using last known rates" → Spinner hidden →
App ready with hardcoded rates
```

### Scenario 3: User Retries After Error
```
Error banner visible → User clicks "Retry" button →
Service attempts fetch again → If succeeds: cache + hide error →
If fails: show error again, keep hardcoded rates active
```

### Scenario 4: Cached Rates Valid
```
User opens app → Loading spinner shows →
Service checks localStorage → Cache hit (< 90 days) →
Spinner hidden immediately → App ready with cached rates →
No API call made
```

---

## Styling Architecture (Tailwind CSS)

### Theme Structure
```
tailwind.config.js
├── Colors
│   ├── navy-50 through navy-900 (professional blue-grey palette)
│   ├── green-500 (for "Paid Correctly" status)
│   ├── red-500 (for "Underpaid" status)
│   └── gray-100 through gray-900 (for neutral backgrounds)
├── Typography
│   ├── font-sans (system fonts for performance)
│   ├── text-lg (inputs, labels)
│   └── text-sm (help text, segment details)
├── Spacing
│   └── gap-4, p-4, mb-4 (consistent 16px grid)
└── Responsive
    └── sm:, md:, lg: breakpoints (mobile-first)
```

### Component Classes (Examples)

**Form Input (Tailwind):**
```jsx
<input
  type="text"
  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
/>
```

**Status Badge (Green/Red):**
```jsx
{isUnderpaid ? (
  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
    Underpaid: ${discrepancy.toFixed(2)}
  </span>
) : (
  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
    Paid Correctly
  </span>
)}
```

**Loading Spinner:**
```jsx
{loading && (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-500" />
  </div>
)}
```

---

## Patterns to Follow

### Pattern 1: Fetch on Mount with Loading State
**What:** Load rates when App mounts, show loading state until complete.

**When:** Any external data fetch needed before rendering.

**Example:**
```javascript
useEffect(() => {
  (async () => {
    setLoading(true);
    try {
      const data = await fetchData();
      setState(data);
    } catch (err) {
      setError(err);
      setState(fallback);
    } finally {
      setLoading(false);
    }
  })();
}, []);
```

### Pattern 2: Fallback-First Architecture
**What:** Always provide a fallback (hardcoded rates) so the app never breaks.

**When:** Any external dependency that can fail gracefully.

**Example:**
```javascript
const rates = liveRates ?? fallbackRates;  // Use fallback if live unavailable
```

### Pattern 3: Conditional Rendering with Status
**What:** Show different UI based on loading/error/success states.

**When:** Multi-state async operations (fetch, calculation results).

**Example:**
```javascript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorBanner onRetry={handleRetry} />;
return <CalculatorForm />;
```

### Pattern 4: Tailwind Utility-First Styling
**What:** Use Tailwind utility classes instead of custom CSS.

**When:** Any component styling.

**Example:**
```jsx
<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
  {/* Content */}
</div>
```

### Pattern 5: Award-Agnostic Data Hydration
**What:** Fetch rates for ALL awards at once, then let user select without re-fetching.

**When:** Multi-award support with variable rates.

**Example:**
```javascript
const rates = await loadRates(['MA000012', 'MA000003', 'MA000009']);
// rates = { MA000012: {...}, MA000003: {...}, ... }
// User selects award → use rates[selectedAward]
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fetching Rates on Award Change
**What goes wrong:** User selects award → component fetches rates → UI stalls.

**Why bad:** Multiple fetches burn bandwidth, stall UX, poor caching.

**Instead:** Fetch all rates once on app mount, reuse by award ID.

### Anti-Pattern 2: Mixing Live & Hardcoded Rates
**What goes wrong:** Some classifications use API rates, others use hardcoded. Users confused.

**Why bad:** Unpredictable behavior. Hard to debug.

**Instead:** All-or-nothing: either ALL rates from API or ALL hardcoded. In v1.1, proxy ensures all come from one source.

### Anti-Pattern 3: Storing Actual Paid Amounts in localStorage
**What goes wrong:** User's private pay data persists across sessions.

**Why bad:** Privacy concern. Out-of-scope per PROJECT.md.

**Instead:** Keep session-only (in-memory state). User re-enters each time.

### Anti-Pattern 4: Inline Rate Editing
**What goes wrong:** User overwrites API rate manually. "What rate did I actually use?"

**Why bad:** Breaks audit trail. Defeats purpose of using official FWC rates.

**Instead:** Show rates read-only. Link to FWC lookup for disputes.

### Anti-Pattern 5: Complex Cache Invalidation UI
**What goes wrong:** "Clear cache for award X only", per-award TTL, etc.

**Why bad:** Over-engineering. Users don't care about cache internals.

**Instead:** Simple: 90-day global TTL, one "Clear Cache" button.

---

## Scalability Considerations

| Concern | At v1.1 (3 awards) | At v2 (10+ awards) | At Scale (100+ awards) |
|---------|-------------------|------------------|------------------------|
| **API Response Size** | ~50KB per request | ~150KB per request | Consider paginating by award |
| **Cache Storage** | <1MB (localStorage limit 5-10MB) | Still <5MB | May need IndexedDB |
| **Classification Dropdown** | 50-100 options | 100-200 options | Implement search/filter |
| **Component Render Time** | <50ms (fast) | <100ms (acceptable) | Profile with React Profiler |
| **Netlify Function Latency** | ~100-500ms cold start | Same (stateless) | No scaling issues |

---

## Testing Architecture

### Unit Tests (Existing, Extend)
- `calculatePayForTimePeriod()` with live rates
- `awardRatesService.loadRates()` with mock fetch
- Zod validation of API response

### Integration Tests
- App mounts → fetch triggered → rates loaded → calculatePay uses live rates
- Error scenario: fetch fails → fallback to hardcoded → no crash

### E2E Tests (Optional, future)
- User selects award → calculates pay → sees green/red status
- User clicks retry → fetches rates again
- User clears cache → forces fresh fetch

---

## Deployment Architecture

### Local Development
```
npm start                # Dev server (http://localhost:3000)
netlify dev             # Netlify dev server (/.netlify/functions/ available locally)
```

### Production (Netlify)
```
Git push to main
├── Netlify builds: npm run build
├── Deploys to edge: build/ → Netlify CDN
├── Deploys functions: netlify/functions/ → Netlify serverless runtime
└── Environment variables: FWC API key from Netlify Dashboard
```

---

## Sources

**Netlify Functions Best Practices:**
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Serverless Function Patterns](https://www.patterns.dev/posts/serverless)

**React Data Fetching Patterns:**
- [Data Fetching Patterns in Single-Page Applications | Martin Fowler](https://martinfowler.com/articles/data-fetch-spa.html)
- [React 19 useEffect Hook Documentation](https://react.dev/reference/react/useEffect)

**Graceful Degradation:**
- [AWS Well-Architected Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/)

**Tailwind CSS Architecture:**
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
