# Feature Landscape: v1.1 API Integration & UX Redesign

**Domain:** Australian award calculator SPA with live FWC rate integration
**Researched:** 2026-03-09
**Confidence:** MEDIUM (Netlify pattern + React data fetching well-established; specific FWC proxy implementation untested in this codebase)

---

## Table Stakes

Features users expect from a professional pay calculator SPA. Missing = app feels unpolished, untrustworthy, or broken.

| Feature | Why Expected | Complexity | Phase Notes |
|---------|--------------|------------|-------------|
| **Live rates from official FWC source** | Legal/credibility requirement. Hardcoded rates feel stale and manual. Users need confidence rates are current. | Medium | Requires Netlify Functions proxy + rate hydration logic. Core blocker for production SPA. |
| **Loading indicators during API calls** | Network requests delay responses. Users need visual feedback that work is happening. Blank UI = perceived hang. | Low | Show spinner/skeleton during fetch. Prevents confusion about app state. |
| **Clear error messages when API fails** | Network, API, or proxy failures happen. Users deserve to know why the app isn't working, not just blank screens. | Low | Human-readable message + recovery option (retry or use fallback rates). Prevents user frustration. |
| **Graceful fallback to known-good rates** | FWC API or proxy down? Show cached/hardcoded rates instead of breaking the calculator. App remains functional. | Low | Use `awardConfig.js` fallback when live fetch fails. Already in codebase; just needs wiring. |
| **Professional visual design (Tailwind CSS)** | V1.0 uses unstyled HTML. Professional tools justify user trust. Navy/white + green/red status is table stakes in 2026. | High | Full component redesign. Must be visually coherent across all forms, tables, and status states. |
| **Pay status indicators (Paid Correctly vs Underpaid)** | After calculating pay, users must see at a glance if discrepancy exists. Green checkmark = paid correctly. Red X = underpaid. | Low | Conditional rendering + Tailwind color classes (green-600, red-600). Already calculated; just needs UI. |
| **Responsive input forms (time entry, selectors)** | Calculator must work on different screen sizes. No horizontal scroll. Clear labeling. | Medium | Tailwind form utilities + mobile-first layout. Standard SPA requirement. |

---

## Differentiators

Features that set Pay Check App apart from other award calculators. Not baseline-expected, but valuable for user trust and engagement.

| Feature | Value Proposition | Complexity | Phase Notes |
|---------|-------------------|------------|-------------|
| **Award-agnostic penalty calculation that hydrates with live rates** | v1.0 hardcoded rates for 3 awards. v1.1 **live rates from FWC**, but calculation engine remains award-agnostic (parameterized `penaltyConfig`). Users get accuracy + flexibility. | High | Core differentiator: supports ANY award via FWC API, not just hardcoded 3. Deferred in v1.0, ships in v1.1. Requires live rate → calculation mapping. |
| **API rate caching with transparent cache status** | FWC rates rarely change (quarterly max). Cache 90 days to avoid redundant API calls. **Show users when cache was last refreshed** and offer manual refresh. | Medium | Current `awardRatesService.js` caches; add UI indicator (tooltip, timestamp) + refresh button. Builds trust in data age. |
| **Detailed segment-level penalty breakdown** | v1.0 already has this. v1.1 must display it alongside live rates to show **why** the amount is correct. Users see exact rate for each time segment. | Low | Already shipped in v1.0; ensure Tailwind redesign preserves clarity of breakdown table. |
| **Professional error recovery (retry with exponential backoff)** | Don't just fail once and give up. Retry transient API failures automatically. Offer manual "Retry" button for persistent failures. | Medium | Implement retry logic in `awardRatesService.js` (or new proxy caller). Retry 3x with backoff, then fallback to hardcoded rates + message. |

---

## Anti-Features

Features to explicitly NOT build or remove in v1.1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Switching rate sources mid-calculation without re-entering shifts** | Confuses users: "I entered shifts, then API fetched new rates—did my pay amount change? Which rates were used?" State management complexity explodes. | Fetch rates upfront before user enters shifts. Show rates in UI. If rates change, show banner "Rates updated, please verify." Require user action to confirm. |
| **Partial hydration (some rates from API, some hardcoded)** | Creates bugs: "Why does classification X use API rates but classification Y doesn't?" Unpredictable behavior. | All-or-nothing: either all 3 awards use API rates or all use hardcoded. Don't mix. In v1.1, proxy resolves CORS → all awards use live API or all use fallback. |
| **Complex cache invalidation UI (manual cache keys, per-award TTL)** | Over-engineering for a static SPA. Users don't care about cache internals. Adds confusion. | Simple: 90-day global cache TTL (already in v1.0). Offer one "Clear Cache" button. Done. |
| **Real-time rate updates (polling or WebSocket)** | FWC rates don't change frequently. Polling burns battery/bandwidth. WebSocket is overkill. | Fetch once on app load. Optional manual refresh button. That's enough. |
| **Storing actual paid amounts in localStorage between sessions** | PROJECT.md explicitly out-of-scope: "stateless tool, no data persistence." Adds privacy/GDPR concerns. Users expect each session fresh. | Keep current behavior: actual paid amounts are session-only. User enters them fresh each time. No persistence. |
| **Inline rate edit (users manually override API rates)** | Breaks audit trail. User enters rates themselves, calculator breaks. "What rate did I actually use?" becomes ambiguous. | Show fetched rates read-only. If user disputes rate, offer info link to FWC lookup tool. Don't allow edit. |

---

## Feature Dependencies

```
Live FWC Rate Hydration
├── Netlify Functions proxy (resolves CORS, fetches from FWC)
├── Rate validation & caching in awardRatesService.js
├── Mapping API response to penaltyConfig/classification objects
└── Re-calculation when rates change

Professional Tailwind Redesign
├── Form components (award selector, time inputs, allowance checkboxes)
├── Pay summary card (green/red status indicators)
├── Segment breakdown table (styled for readability)
├── Loading skeleton / spinner
└── Error banner with retry button

Error Handling & Graceful Fallback
├── Load awardRates on App mount with Suspense boundary
├── Catch fetch errors, show message + fallback rates
├── Retry logic in service layer
└── Display "Using cached/fallback rates" message to user
```

---

## MVP Recommendation for v1.1

**Prioritize (Phase 1 — API + Fallback):**
1. Netlify Functions proxy to FWC MAAPI v1 (resolves CORS, enables real calls)
2. Rate hydration: map FWC response into `penaltyConfig` + `classifications` + `allowances`
3. Graceful fallback to `awardConfig.js` hardcoded rates on proxy/API failure
4. Loading indicator + error banner + retry button (basic UX)

**Then (Phase 2 — Tailwind Redesign):**
5. Full Tailwind CSS redesign: forms, pay summary, breakdown table
6. Green/red status indicators for paid correctly vs underpaid
7. Cache refresh indicator + manual clear button
8. Responsive mobile-first layout

**Defer to v2:**
- Real-time rate polling / WebSocket updates
- All 121 modern awards (currently 3; expand scope later)
- User accounts or data persistence
- PDF/image payslip upload and parsing

---

## Why This Order

1. **API + Fallback first (non-visual, but critical):**
   - Unblocks live rate accuracy. Without proxy, FWC API unreachable; app fails on real data.
   - Fallback to hardcoded rates ensures app never breaks, even if proxy is down.
   - Can ship to early testers without redesign (MVP validation).

2. **Tailwind redesign second:**
   - Visual polish builds trust, but isn't a blocker for core functionality.
   - Fallback rates still work if Tailwind is incomplete; usability is maintained.
   - Easier to test redesign once API layer is stable.

3. **Defer complexity:**
   - Polling/WebSocket, accounts, PDF parsing: solve in v2 after v1.1 validates the live rate approach.

---

## Data Flow: Live Rate Hydration

### Current State (v1.0)
```
App.js (state: awardRates = hardcoded from awardConfig.js)
  ↓ (calculatePay reads from state.awardRates)
PaySummary / DetailedBreakdown
```

### v1.1 Target State
```
App.js mounts
  ↓
useEffect: fetch rates from Netlify proxy (`/.netlify/functions/fwc-proxy`)
  ↓
Proxy calls FWC MAAPI v1 (server-side, no CORS issue)
  ↓
Response: { [award_id]: { classifications: [...], allowances: [...], penalty_config: {...} } }
  ↓
Validation (Zod) + caching (localStorage, 90-day TTL)
  ↓
Set state: awardRates = API response (or fallback to awardConfig.js if error)
  ↓
calculatePay reads from state.awardRates (live or fallback)
  ↓
PaySummary / DetailedBreakdown (unchanged logic, different source data)
```

### Key Implementation Points

**Netlify Function (`netlify/functions/fwc-proxy.js`):**
- Accept award ID(s) as query param
- Fetch from FWC MAAPI v1 using server-side API key (not client-side, no CORS)
- Return structured JSON matching awardConfig.js shape
- Error handling: throw error if FWC is down; let client decide fallback

**awardRatesService.js (existing, enhance):**
- Call `/.netlify/functions/fwc-proxy` instead of FWC directly
- Validate response with Zod schema
- Cache to localStorage with 90-day TTL
- Export `clearCache()` (already done; wire to UI button in v1.1)
- Fallback to `awardConfig.js` on error

**App.js (state update):**
- Load awardRates on mount: `useEffect` calls `awardRatesService.loadRates()`
- Wrap in Suspense boundary or loading state
- On success: use API response
- On error: log to console, use `awardConfig.js` fallback, show error banner with retry
- Calculation logic unchanged (same `calculatePay()` function)

---

## Complexity Assessment

| Area | Complexity | Why | Risk Level |
|------|-----------|-----|-----------|
| **Netlify Functions proxy** | Low-Medium | Straightforward Node.js function forwarding; FWC API shape unknown (schema currently permissive `passthrough()`). | Medium (API response shape unconfirmed; may need iteration in v2) |
| **Rate hydration mapping** | Medium | Mapping FWC response fields to existing `penaltyConfig`, `classifications`, `allowances` objects. FWC data structure must match assumptions. | Medium (if FWC schema differs from hardcoded format, major refactor) |
| **Error handling + fallback** | Low | Conditional: if fetch fails, use hardcoded rates. Already have fallback data. Just wire error state → UI. | Low (straightforward error branch) |
| **Tailwind CSS redesign** | High | Full rewrite of unstyled HTML. Need to maintain all responsive breakpoints, form validation feedback, and table readability. | High (large surface area; easy to regress existing features if not careful) |
| **Loading states** | Low-Medium | Show spinner while fetching, hide on complete/error. Standard React pattern. | Low (well-understood, standard library options: Skeleton screens, spinners) |
| **Caching + manual refresh** | Low | Already have 90-day cache. Add UI button → call `clearCache()`, re-fetch. | Low (existing logic; just needs UI integration) |

---

## Existing Features to Preserve

v1.1 must maintain all v1.0 functionality while adding new features. Don't regress:

| Feature | How to Verify in v1.1 |
|---------|----------------------|
| Minute-accurate penalty calculation | Run existing test suite; ensure no regressions on calculatePayForTimePeriod |
| Award selector (3 awards) | Verify award dropdown works; API rates dynamically populate classifications/allowances |
| Weekly + fortnightly pay cycle | Test both modes with Tailwind redesign; ensure totals match v1.0 |
| Per-day breakdown | Ensure segment table renders in Tailwind; clarity of rates/times preserved |
| Underpayment detection | Green/red status still calculates correctly (no change to logic, just styling) |
| Break deductions | Verify break logic applies consistently with new rates |
| Overtime calculation | Ensure >38 hrs/week logic fires correctly with live rates |
| Allowances display | Dynamic allowance checkboxes populate from API; UI styled with Tailwind |

---

## Sources

**Netlify Functions Proxy Pattern:**
- [Setup a CORS Proxy With Netlify - Jim Nielsen's Blog](https://blog.jim-nielsen.com/2020/a-cors-proxy-with-netlify/)
- [Circumventing CORS with Netlify Functions & Nodejs | Medium](https://medium.com/@kamry.bowman/circumventing-cors-with-netlify-functions-nodejs-65aa6ec69a65)
- [Use Netlify functions to proxy an API without CORS | Aaron Saray](https://aaronsaray.com/2022/use-netlify-functions-to-proxy-api-for-cors/)
- [Circumvent CORS when Accessing a Third-Party API using Netlify Functions | egghead.io](https://egghead.io/lessons/netlify-circumvent-cors-when-accessing-a-third-party-api-using-netlify-functions)

**React Data Fetching & Error Handling Patterns:**
- [The Modern React Data Fetching Handbook: Suspense, use(), and ErrorBoundary Explained | freeCodeCamp](https://www.freecodecamp.org/news/the-modern-react-data-fetching-handbook-suspense-use-and-errorboundary-explained/)
- [UI best practices for loading, error, and empty states in React | LogRocket Blog](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/)
- [How Senior React Developers Handle Loading States & Error Handling | Medium](https://medium.com/@sainudheenp/how-senior-react-developers-handle-loading-states-error-handling-a-complete-guide-ffe9726ad00a)
- [Data Fetching Patterns in Single-Page Applications | Martin Fowler](https://martinfowler.com/articles/data-fetch-spa.html)

**Graceful Degradation & Fallback Strategies:**
- [Graceful Degradation: Handling Errors Without Disrupting User Experience | Medium](https://medium.com/@satyendra.jaiswal/graceful-degradation-handling-errors-without-disrupting-user-experience-fd4947a24011)
- [Building Resilient REST API Integrations: Graceful Degradation and Combining Patterns | Medium (Jan 2026)](https://medium.com/@oshiryaeva/building-resilient-rest-api-integrations-graceful-degradation-and-combining-patterns-e8352d8e29c0)
- [A guide to graceful degradation in web development | LogRocket Blog](https://blog.logrocket.com/guide-graceful-degradation-web-development/)
- [Implement graceful degradation to transform applicable hard dependencies into soft dependencies | AWS Well-Architected](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_graceful_degradation.html)

**Tailwind CSS Professional Forms & Components:**
- [Material Tailwind - Tailwind CSS Input](https://www.material-tailwind.com/docs/html/input)
- [Flowbite - Tailwind CSS Input Field](https://flowbite.com/docs/forms/input-field/)
- [Preline UI - Tailwind CSS Input](https://preline.co/docs/input.html)
- [Create Stunning Tailwind CSS Forms: A Step-by-Step Guide | Codecademy](https://www.codecademy.com/article/create-stunning-tailwind-css-forms-a-step-by-step-guide)
- [A Practical Guide to Styling Forms with Tailwind CSS | OpenReplay](https://blog.openreplay.com/practical-guide-styling-forms-tailwind-css/)

**SPA Best Practices (2026):**
- [React Stack Patterns](https://www.patterns.dev/react/react-2026/)
- [How to structure a React App in 2025 (SPA, SSR or Native) | Medium](https://ramonprata.medium.com/how-to-structure-a-react-app-in-2025-spa-ssr-or-native-10d8de7a245a)
