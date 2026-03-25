# Domain Pitfalls: v1.1 API Integration & UX Redesign

**Domain:** Australian award calculator SPA with live FWC rate integration
**Researched:** 2026-03-09

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: FWC API Response Shape Mismatch
**What goes wrong:** Assuming FWC API returns data in shape matching hardcoded `awardConfig.js`. Reality: API returns different field names, nesting, or structure.

**Why it happens:** FWC MAAPI v1 is external API with undocumented response schema. Training data is stale (Feb 2025 cutoff). No type definitions available before integration.

**Consequences:**
- Hydration fails silently (Zod validation catches it, but fallback to hardcoded rates hides the problem)
- In production, users don't realize they're using stale rates
- Major refactor needed if API structure fundamentally differs

**Prevention:**
- Before coding proxy, test FWC API directly with actual sandbox credentials
- Document exact response shape (JSON examples)
- Build Zod schema based on **real** API response, not assumptions
- Add debug logging: log both API response and hydrated rates to browser console

**Detection:**
- Test in staging: compare API rates vs hardcoded rates for same award
- If rates differ unexpectedly → API response shape likely wrong
- Check browser console: `console.log('API response:', data)` before hydration

### Pitfall 2: Partial Rate Hydration (Some Classifications Missing)
**What goes wrong:** FWC API response omits some classifications or allowances. App falls back to hardcoded rates, but only for affected awards. Mixed sources = bugs.

**Why it happens:** FWC API may not expose all 100+ classifications per award, only commonly-used ones. Or API structure doesn't nest classifications under award ID as expected.

**Consequences:**
- User selects classification → dropdown shows it, but `awardRates[award][classification]` is undefined
- Calculation breaks or silently uses wrong rate
- Hard to debug: "Why does classification X calculate correctly but Y doesn't?"

**Prevention:**
- Validate completeness: After fetching, check that ALL expected classifications exist
- If any missing: log warning and fall back to hardcoded rates for entire award
- Don't do partial hydration: if API missing data, reject it and use fallback for all awards

**Detection:**
- Unit test: fetch rates for each award, assert all expected classifications present
- Regression test: calculate pay for each classification, compare v1.0 vs v1.1

### Pitfall 3: Caching Stale Rates for 90 Days
**What goes wrong:** FWC updates rates (quarterly). App loads with 89-day-old cached rates. User sees outdated pay calculation.

**Why it happens:** 90-day TTL seemed safe (rates rarely change), but didn't account for Annual Wage Review (typically July 1). Or FWC emergency update not captured by cache check.

**Consequences:**
- Worker thinks they're underpaid, but actually paid correctly (rates were old)
- Confidence in app shaken
- Potential for incorrect dispute lodging

**Prevention:**
- Display cache age to user: "Rates last updated: 2 days ago"
- Offer "Refresh Rates" button (calls clearCache() + re-fetch)
- Consider shorter TTL in initial v1.1 (14 days instead of 90), extend in v2 after observing FWC update patterns
- Subscribe to FWC updates or check Last-Modified header from API

**Detection:**
- Manual testing: check browser localStorage for cache timestamp
- Compare displayed rates vs FWC website (manual spot check)
- Set up alerts if rates change unexpectedly

### Pitfall 4: Netlify Function Timeout on Slow Network
**What goes wrong:** User on slow connection. Proxy function calls FWC API, takes >30 seconds. Netlify times out the function.

**Why it happens:** FWC API can be slow (especially at peak times). No timeout handling in simple proxy implementation.

**Consequences:**
- User sees blank screen or HTTP 504 error
- No graceful fallback message
- App unusable until they refresh

**Prevention:**
- Set timeout in Netlify function: if FWC API takes > 10 seconds, abort and throw error
- Let error propagate to client, which falls back to hardcoded rates
- Add retry logic in awardRatesService: retry 3x with exponential backoff before giving up
- Show loading spinner with "Connecting to FWC (this may take a moment)..."

**Detection:**
- Test with slow network: Chrome DevTools → Network tab → throttle to "Slow 3G"
- Verify fallback message appears (not blank screen)
- Check browser console for fetch timeout error

### Pitfall 5: API Key Exposed in Client-Side Code
**What goes wrong:** Developer hardcodes API key in React code or `.env` (committed to git).

**Why it happens:** Convenience. Forgot that REACT_APP_* env vars are bundled into JS and visible to anyone inspecting browser.

**Consequences:**
- API key in public GitHub repo → anyone can call FWC API with our quota
- Quota exhaustion → API disabled
- Potential billing charges (if FWC charges per request)

**Prevention:**
- **NEVER** use REACT_APP_* env var for API key
- API key lives ONLY in Netlify environment variables (Dashboard → Build & Deploy → Environment)
- Netlify proxy reads `process.env.REACT_APP_FWC_API_KEY` (server-side, not bundled)
- Client calls `/.netlify/functions/fwc-proxy` (no API key sent)
- `.env.local` for development (added to .gitignore)

**Detection:**
- Search codebase: grep for API key string (should not appear)
- Inspect browser → DevTools → Application → LocalStorage/SessionStorage (should be empty)
- Inspect bundled JS: key should never appear in build/ directory

---

## Moderate Pitfalls

### Pitfall 1: Calculating Pay Before Rates Load
**What goes wrong:** User enters shifts and clicks Calculate before rates finish loading. App uses fallback rates silently.

**Why it happens:** No loading state enforced. Calculate button is enabled even while fetching.

**Consequences:**
- User sees calculation with stale rates, doesn't realize
- Debugging confusion: "My rates look wrong"

**Prevention:**
- Disable Calculate button while `loading === true`
- Show loading spinner with "Fetching rates from FWC..."
- Only enable form inputs after rates finish loading

**Detection:**
- Manual testing: open app, click Calculate immediately
- Verify button is disabled and spinner shows

### Pitfall 2: Error Banner Dismissed Without Understanding
**What goes wrong:** User sees "API error: Failed to fetch" and clicks X to dismiss. They don't know rates are fallback.

**Why it happens:** Error message too technical or dismissible without acknowledging fallback.

**Consequences:**
- User calculates with fallback rates, unaware
- False sense of accuracy

**Prevention:**
- Error banner should be non-dismissible (no X button)
- Message should be user-friendly: "Couldn't reach FWC. Using last known rates. [Retry]"
- Include blue info icon with tooltip: "These are cached rates from [date]. Click Retry to get latest."

**Detection:**
- User testing: ask user "What does that error message mean?"
- If they can't explain it, message is too technical

### Pitfall 3: Tailwind CSS Styling Regressions
**What goes wrong:** Redesign looks good in Chrome, but breaks in Safari or on mobile. Form inputs misaligned. Tables overflow.

**Why it happens:** Tailwind is utility-first, easy to forget responsive prefixes (sm:, md:). CSS specificity issues if custom CSS mixed in.

**Consequences:**
- App unusable on mobile (input overflow, unreadable text)
- User frustration, credibility loss

**Prevention:**
- Mobile-first approach: style for mobile (sm) first, add md:/lg: for larger screens
- Test on actual devices: iPhone, Android, iPad
- Browser testing: Chrome, Safari, Firefox, Edge
- Use Chrome DevTools device emulation, but verify on real device

**Detection:**
- Automated: Lighthouse (Chrome DevTools) → Mobile performance
- Manual: open on phone, try entering shifts, verify form is usable

### Pitfall 4: Hardcoded Awards in Proxy (Not Extensible)
**What goes wrong:** Proxy function hardcodes `['MA000012', 'MA000003', 'MA000009']`. To add a 4th award, need to redeploy function.

**Why it happens:** Assumption that 3 awards are enough for v1.1. Didn't plan for v2 extensibility.

**Consequences:**
- v2 requires function redeploy just to add a new award
- More friction than needed

**Prevention:**
- Proxy should accept `awardIds` as query parameter: `?awardIds=MA000012,MA000003,MA000009`
- Client determines which awards to fetch based on UI selector
- Proxy is agnostic to specific awards

**Detection:**
- Code review: verify proxy loops over query param, not hardcoded array

---

## Minor Pitfalls

### Pitfall 1: localStorage Size Exceeds Limit
**What goes wrong:** Over 5MB of cached data stored. localStorage rejects new writes.

**Why it happens:** Unlikely (FWC rates JSON ~50KB), but possible if caching other data too.

**Prevention:**
- Monitor cache size: `console.log(JSON.stringify(localStorage).length)`
- Only cache essential data (rates, not user shifts)
- Trim old cache entries if approaching limit

### Pitfall 2: Network Request Cancellation on Page Unload
**What goes wrong:** User closes browser tab while rates are fetching. Request hangs, Netlify function charges compute time.

**Why it happens:** No cleanup on unmount.

**Prevention:**
- Minimal issue in practice (function completes in <1s), but can use AbortController for best practice:
```javascript
const controller = new AbortController();
fetch(url, { signal: controller.signal });
// On unmount: controller.abort();
```

### Pitfall 3: Zod Schema Too Permissive
**What goes wrong:** `passthrough()` allows any unexpected fields. If FWC API adds field, we don't validate it.

**Why it happens:** FWC response shape unknown at v1.0 design time. Chose permissive schema to avoid breakage.

**Consequences:**
- Validation is weak. Bugs slip through.

**Prevention:**
- At v1.1 start, test real FWC API response
- Build strict Zod schema based on actual response
- Tighten schema: remove `passthrough()`, define exact fields expected
- Update in v2 once API shape confirmed

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|-----------|
| **Netlify Function setup** | API key in client code | Use env vars server-side only; never commit .env |
| **Rate hydration** | API response shape mismatch | Test FWC API with real credentials before coding; document response shape |
| **Error handling** | Fallback rates used silently | Show UI indicator when fallback active; offer retry button |
| **Tailwind redesign** | Mobile UI breaks | Test on real devices; use mobile-first approach |
| **Loading UX** | User clicks Calculate before rates load | Disable Calculate button while loading; show spinner |
| **Caching** | Stale rates for 90 days | Display cache age; offer refresh button; monitor FWC updates |
| **Testing** | Existing tests fail with live rates | Mock awardRatesService in tests; ensure no regressions |

---

## Watchlist: Red Flags to Monitor in Code Review

1. **API key in source code** - Search for hardcoded strings matching key format
2. **Missing fallback** - Ensure all API calls have error handler + fallback data
3. **Partial hydration** - Check that ALL awards either use API or hardcoded, not mixed
4. **Disabled retry button** - Verify Retry button enabled and re-fetches
5. **Mobile styles missing** - Verify sm: prefix used on responsive components
6. **localStorage size** - Check cache size stays <1MB
7. **Proxy timeout unhandled** - Verify fetch has timeout; throws error on timeout
8. **Zod schema too loose** - Review schema; ensure it validates actual API fields

---

## Pre-Deployment Checklist

- [ ] Test FWC API with real sandbox credentials; document response shape
- [ ] Verify API key is NOT in codebase (grep for key pattern)
- [ ] Verify API key IS in Netlify Dashboard environment variables
- [ ] Test Netlify function locally: `netlify dev` → navigate to `/.netlify/functions/fwc-proxy?awardIds=MA000012`
- [ ] Test error scenario: Netlify function shut down → verify fallback rates appear + error message shown
- [ ] Test mobile: open app on iPhone; verify forms are usable (no overflow, readable text)
- [ ] Test slow network: Chrome DevTools throttle to Slow 3G → verify loading spinner appears
- [ ] Verify all existing tests still pass (no regressions)
- [ ] Test award selector: switch between Pharmacy, Retail, Hospitality → verify rates/classifications change
- [ ] Test cache: open app twice → second open should be instant (uses cache)
- [ ] Test cache clear: click "Clear Cache" button → next load is fresh
- [ ] Browser DevTools: verify no errors in Console tab

---

## Sources

**API Integration Best Practices:**
- [Building Resilient REST API Integrations | Medium](https://medium.com/@oshiryaeva/building-resilient-rest-api-integrations-graceful-degradation-and-combining-patterns-e8352d8e29c0)
- [Graceful Degradation in Web Development | LogRocket](https://blog.logrocket.com/guide-graceful-degradation-web-development/)

**Netlify Functions Best Practices:**
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Environment Variables in Netlify Functions](https://docs.netlify.com/functions/overview/#environment-variables)

**React Error Handling:**
- [Error Boundaries in React](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Modern React Error Handling](https://www.freecodecamp.org/news/the-modern-react-data-fetching-handbook-suspense-use-and-errorboundary-explained/)

**Tailwind CSS Testing:**
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Testing Responsive Design](https://www.smashingmagazine.com/2017/10/testing-mobile-first-approach/)
