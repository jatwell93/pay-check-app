# Research Summary: v1.1 Integration Features

**Project:** Pay Check App (Pharmacy Awards Pay Calculator)
**Researched:** 2026-03-09
**Scope:** Pitfalls specific to adding Netlify Functions proxy, live FWC API hydration, Tailwind CSS redesign, and loading/error states to an existing working React SPA
**Overall Confidence:** HIGH

---

## Executive Summary

v1.1 adds four major features to a v1.0 app that currently works correctly with hardcoded data and no error UX. These features carry high integration risk because they interact at critical points:

1. **Netlify Functions proxy** introduces serverless latency, cold starts, and timeout complexity.
2. **Live API hydration** introduces data synchronization, type mismatches, and race conditions between async operations.
3. **Tailwind CSS migration** can break existing styling silently and requires careful progressive rollout.
4. **Loading/error states** require coordination across multiple async operations and new error paths.

The primary risk is **desynchronization**: the calculation engine (calculatePayForTimePeriod) must receive correct rates at the right time, but async API loading, browser caching, and race conditions can cause mismatches between what rates the user expects and what the calculation uses. Silent failures (showing $0.00 with no error) are the worst outcome because users might file complaints based on incorrect data.

Secondary risks involve breaking existing functionality (Tailwind CSS reset breaking component styling) and hidden failures (proxy timeout or CORS error triggering fallback without surfacing the bug).

The mitigation strategy is **sequential phase completion**: Phase 1 (API integration) must be fully stable and validated before Phase 2 (Tailwind redesign and error UX) begins. Parallelizing phases creates debugging chaos when hidden bugs appear mid-redesign.

---

## Key Findings

### Stack

**Proxy:** Netlify Functions (serverless, no custom PostCSS, limited timeout to ~10-30 seconds)
**Data validation:** Zod recommended (currently using passthrough schema)
**CSS framework:** Tailwind CSS with CRA (limited PostCSS config, CSS reset side effects)
**State management:** React hooks only, no data-fetching library (TanStack Query recommended for future)
**Testing:** Jest + React Testing Library, must include integration tests with mocked network latency

### Architecture

The v1.1 architecture has two critical data flows that must not desynchronize:

```
User Input (AwardSelector, WorkHours, etc.)
    ↓
[BLOCK] Calculate disabled until awardRates loaded
    ↓
calculatePayForTimePeriod(baseRate, penaltyConfig, ...)
    ↓
Results displayed

API Data Flow (parallel):
    ↓
App.js useEffect fetches from /.netlify/functions/fwc-proxy
    ↓
awardRatesService validates and caches
    ↓
awardRates state updated
    ↓
[UNBLOCK] Calculate button enabled
```

The danger: Calculate button can be clicked before awardRates is populated, or Tailwind CSS setup breaks the visual layout before the logic is stable.

### Features

**Table stakes:**
- Netlify Functions proxy working end-to-end
- Live FWC API rates loaded and hydrated into calculations
- Error messages for API failures (not silent fallback)
- Loading spinners that don't flicker

**Differentiators:**
- Cache behavior coordinated (HTTP cache + localStorage cache)
- Race condition handling (award switching while loading)
- Cold start optimization (warm-up cron or timeout handling)

**Anti-features:**
- Silent data type coercion (must validate or error)
- Multiple overlapping spinners (must coordinate loading states)
- Breaking existing component styling (must test immediately after Tailwind)

---

## Implications for Roadmap

### Phase 1: Netlify Functions Proxy & API Integration

**Critical path items:**
1. Build Netlify Functions proxy to FWC MAAPI
   - Set CORS headers explicitly in response
   - Configure Cache-Control headers for 1-hour freshness
   - Set client-side timeout to 5 seconds
   - Log errors with context for debugging

2. Validate FWC API response shape with Zod
   - Coerce string numbers to actual numbers
   - Reject missing or NaN rates
   - Add error field to results object

3. Block Calculate button until rates load
   - Show "Loading award rates..." message
   - Disable Calculate if awardLoading === true
   - Test with DevTools network throttling (Slow 3G)

4. Implement proper error handling
   - Catch CORS errors, timeout errors, 502 errors
   - Fall back to localStorage cache (not hardcoded rates)
   - Surface errors to UI (add error banner component)

5. Test in production (not just localhost)
   - Wait 20+ minutes to trigger cold start
   - Measure latency end-to-end
   - Verify CORS headers with browser DevTools

**Pitfalls to validate before moving to Phase 2:**
- Pitfall 1: Calculation desynchronization (block button until rates loaded)
- Pitfall 2: Cold start timeout (test in production)
- Pitfall 3: CORS headers missing (test with browser fetch)
- Pitfall 6: Data type mismatch (Zod validation)
- Pitfall 7: Browser cache staleness (Cache-Control headers)
- Pitfall 8: Race condition on award switching (AbortController)

**Exit criteria:**
- Proxy responds in <5 seconds consistently
- All error paths have handlers (no silent failures)
- Same calculation produces same result on page refresh
- Award switching doesn't cause calculation mismatches
- Test coverage includes network latency scenarios

---

### Phase 2: Tailwind CSS Redesign & Loading/Error UX

**Critical path items:**
1. Add Tailwind CSS to CRA
   - Use official CRA integration guide
   - Add prefix (tw-) to avoid conflicts with existing CSS
   - Test immediately after installation (before writing Tailwind)
   - Create visual regression checklist for every component

2. Add loading/error UX
   - Define composite "isAppReady" state
   - Show single "Loading award rates..." spinner (not multiple spinners)
   - Add error banners for every error path
   - Test with Network throttling in DevTools

3. Design error states
   - Display error message clearly
   - Provide recovery action ("Refresh" button)
   - Verify error is NOT hidden behind loading state
   - Test every error scenario (timeout, CORS, validation, missing data)

4. Migrate components gradually
   - Week 1: Tailwind setup + core components (AwardSelector, PaySummary)
   - Week 2: Secondary components (EmployeeDetails, Allowances)
   - Week 3: Polish and refinement

**Pitfalls to validate before shipping:**
- Pitfall 4: Tailwind CSS breaks existing styling (immediate test after setup)
- Pitfall 5: Loading states not coordinated (test all async state combinations)
- Pitfall 9: Utility classes overflow (establish style guide)
- Pitfall 10: Error messages silent (verify every error shows UI message)
- Pitfall 11: Fallback hiding bugs (add monitoring, alert on spikes)

**Exit criteria:**
- All existing components render correctly (visual regression check)
- Loading spinners don't flicker
- Every error path shows clear user message
- Users can't click Calculate until rates are ready
- No silent failures (any error state shows to user)

---

### Phase 3: Sustainability & Monitoring

**Items deferred from v1.1 but needed for production:**
1. Add error tracking (Sentry or LogRocket)
   - Log proxy errors, API failures, fallback triggers
   - Set up alerts for failure rate spikes

2. Add rate version monitoring
   - Display "rates last updated: X hours ago" to user
   - Warn if rates are older than 7 days
   - Refresh rates on user action

3. Establish Tailwind style guide
   - Create utility classes for repeated patterns
   - Use `clsx` for conditional styling
   - Document component API

4. Warm up Netlify Functions
   - Optional: cron job to ping proxy every 10 minutes
   - Reduces cold start impact (not eliminating it)

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Proxy setup & CORS | HIGH | Multiple authoritative sources (Netlify docs, community patterns) |
| Netlify timeout limits | HIGH | Documented in Netlify support (10-30 second limit is firm) |
| React race conditions | HIGH | Established patterns (AbortController, cleanup functions) |
| API data validation | HIGH | Zod is production-standard (strong typing, error messages) |
| Tailwind CSS migration | MEDIUM | CRA compatibility issues documented, but gradual approach reduces risk |
| Loading state coordination | MEDIUM | Pattern is clear, but details vary by app state shape |
| Error handling UX | MEDIUM | Best practices documented, but requires careful testing |
| Browser caching | MEDIUM | HTTP caching is complex, interactions between layers can be surprising |
| Race conditions (awards) | MEDIUM | AbortController is the solution, but requires careful cleanup in useEffect |

**Why not all HIGH:** Some pitfalls are discovered only through integration testing (multiple async operations, real network latency, real FWC API response shapes). Testing plan must include these scenarios.

---

## Roadmap Implications

### Sequential Phase Execution (Critical)

**DO NOT parallelize Phase 1 and Phase 2.** Reasons:

1. **API stability must be proven first.** If proxy has bugs (race conditions, timeout, CORS), debugging becomes nightmare when Tailwind redesign is underway. You'll have two moving targets (API integration + styling).

2. **Error handling design depends on API stability.** You can't design error UX for a feature that still has unknown bugs. Phase 1 completion means "API is reliable", which is prerequisite for Phase 2's error UX design.

3. **Testing order matters.** Phase 1 tests focus on data correctness and synchronization (calculatePayForTimePeriod receives correct rates). Phase 2 tests focus on visual correctness and UX (spinners, error messages). Testing in reverse order (styling first) masks data bugs.

**Recommended timeline:**
- Phase 1: 2-3 weeks (proxy build, validation, production testing)
- Phase 2: 2-3 weeks (Tailwind setup, gradual component migration, error UX)
- Phase 3: 1 week (monitoring, polish, documentation)

### Production Deployment Checklist

Before deploying v1.1 to production:

- [ ] Phase 1 exit criteria met (proxy stable, no race conditions, all errors handled)
- [ ] Proxy tested in production (wait 20+ minutes for cold start, measure latency)
- [ ] CORS headers verified with browser DevTools (not just curl)
- [ ] Error paths tested (timeout, CORS, validation, missing data)
- [ ] Tailwind setup tested immediately (visual regression check on all components)
- [ ] Loading spinners tested with Network throttling (Slow 3G)
- [ ] Error messages verified (every error path shows UI message, not console-only)
- [ ] Fallback behavior monitored (track when it triggers, alert if spike)
- [ ] FWC API response shapes validated (Zod schema reflects real responses)

### Tech Debt & Future Phases

**Recommended for Phase 4+:**
- Migrate to TanStack Query for automatic caching, invalidation, retry logic
- Add error boundary component for graceful error handling
- Establish Tailwind component library (styled inputs, buttons, etc.)
- Add rate change history tracking (show when rates were last updated)
- Implement manual cache-clear UI button

---

## Research Gaps

### Resolved During Research
- CORS header requirements (explicit headers in Netlify Function response)
- Timeout limits (10-30 seconds for Netlify Functions)
- CRA + Tailwind compatibility (official guide available, CSS reset side effects documented)
- React race condition patterns (AbortController, cleanup functions)

### Remaining Unknowns (Validate in Phase 1)

1. **FWC API actual response shape.** Current validation uses `z.object({}).passthrough()`. After first production request, tighten schema based on actual response.

2. **FWC API latency under load.** We know "can take 5-10 seconds", but what's realistic? Test with real FWC API during Phase 1.

3. **Cold start frequency in production.** Netlify docs say ~15 minutes, but actual behavior may vary. Monitor Netlify logs during Phase 1 to understand real patterns.

4. **Browser HTTP cache behavior.** Cache-Control headers interact with localStorage caching in complex ways. Monitor in production to verify cached data is fresh.

5. **Actual Tailwind CSS performance impact.** CRA bundle size with Tailwind is unknown. Check production bundle before shipping if size is concern.

---

## Quality Gates for Phase Transitions

### Phase 1 → Phase 2 Gate

**Do NOT proceed to Phase 2 if:**
- Any test shows different calculation output on page refresh (desynchronization bug)
- Proxy timeout handling not tested in production (still a cold start risk)
- CORS errors not surfaced to UI (silent failure)
- Award switching produces calculation mismatches (race condition)
- Error paths are console-logged but not shown to user

**Checklist:**
- [ ] calculatePayForTimePeriod receives same baseRate on every call for same input
- [ ] proxy latency measured in production (document cold start observations)
- [ ] CORS headers verified with browser DevTools fetch (not just curl)
- [ ] Award switching under slow network (DevTools throttle) produces correct results
- [ ] Error handler exists for every error path (timeout, CORS, validation, missing data)
- [ ] Tests cover both hardcoded rates and API rates (compare outputs)

### Phase 2 → Phase 3 Gate

**Do NOT ship if:**
- Visual regression detected (Tailwind CSS broke component styling)
- Loading spinners flicker or show in mismatched states
- Error messages are silent (shown in console, not UI)
- Users can click Calculate before rates are loaded (race condition)

**Checklist:**
- [ ] Visual regression checklist completed for every component
- [ ] Loading/error states tested with Network throttling (Slow 3G)
- [ ] Every error path shows UI message (not console-only)
- [ ] Calculate button disabled until awardLoading === false
- [ ] Production monitoring configured (error tracking, fallback alerts)

---

## Sources

### Critical Pitfalls (HIGH confidence)
- [Netlify Support: Handling CORS](https://answers.netlify.com/t/support-guide-handling-cors-on-netlify/107739)
- [Netlify Support: Function Timeouts](https://answers.netlify.com/t/support-guide-why-is-my-function-taking-long-or-timing-out/71689)
- [Aaron Saray: CORS Proxy with Netlify](https://aaronsaray.com/2022/use-netlify-functions-to-proxy-api-for-cors/)
- [Josh Comeau: Perils of Hydration](https://www.joshwcomeau.com/react/the-perils-of-rehydration/)
- [Max Rozen: Race Conditions in React](https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect/)
- [React Router: Race Conditions](https://reactrouter.com/explanation/race-conditions)

### Architecture & Pattern Sources
- [Tailwind CSS + CRA Installation Guide](https://tailwindcss.com/docs/guides/create-react-app)
- [HyperUI: Tailwind Migration without Breaking Changes](https://www.hyperui.dev/blog/move-to-tailwindcss-without-breaking-changes/)
- [LogRocket: UI Best Practices (Loading, Error, Empty States)](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/)
- [FreeCodeCamp: Stale Data and Caching in React](https://www.freecodecamp.org/news/why-your-ui-wont-update-debugging-stale-data-and-caching-in-react-apps/)

---

**Last Updated:** 2026-03-09
**Next Review:** After Phase 1 completion (recommend internal design review of proxy + API integration before Phase 2 starts)
