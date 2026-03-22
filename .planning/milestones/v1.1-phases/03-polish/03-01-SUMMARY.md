---
phase: 03-polish
plan: 01
subsystem: api
tags: [react, jest, retry, exponential-backoff, cache, fetch]

# Dependency graph
requires:
  - phase: 02-tailwind-css-redesign
    provides: AwardSelector component with Refresh Rates button and isLoading/onRefresh props

provides:
  - fetchAwardRates with 3-attempt exponential backoff retry (1s/2s/4s) before throwing
  - clearCache() called with no args before fetchAwardRates on manual refresh (D-03/D-04)
  - Error wording locked: "Couldn't connect to Fair Work Commission — using saved rates" (D-08)
  - 4 new tests covering retry logic and D-08 error wording

affects: [any phase touching awardRatesService, handleRefreshRates, or error banner copy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Retry loop: for (let attempt = 0; attempt < 3; attempt++) wrapping fetch block"
    - "Exponential backoff: Math.pow(2, attempt) * 1000 ms (1s, 2s, 4s)"
    - "Test setTimeout bypass: spy on global.setTimeout, run fn() immediately for ms < 15000"

key-files:
  created: []
  modified:
    - src/services/awardRatesService.js
    - src/services/awardRatesService.test.js
    - src/App.js
    - src/App.test.js

key-decisions:
  - "D-03/D-04: clearCache() called with no argument before fetchAwardRates to force fresh API call (clears all award caches)"
  - "D-05: retry loop is internal to fetchAwardRates — 3 attempts, invisible to callers"
  - "D-06: retry applies to all fetchAwardRates calls (initial load and manual refresh)"
  - "D-07: user sees only Refreshing... during all retry attempts — no retry count shown"
  - "D-08: refresh failure error = exactly 'Couldn't connect to Fair Work Commission — using saved rates'"
  - "Jest 27 setTimeout spy pattern: mock global.setTimeout to run backoff callbacks immediately (ms < 15000), leave abort timer real"

patterns-established:
  - "Retry pattern: wrap fetch block in for-loop, save lastError, backoff with setTimeout, throw lastError after exhaustion"
  - "TDD RED/GREEN: write failing tests first, implement to pass, commit each phase separately"

requirements-completed: [POLISH-01]

# Metrics
duration: 26min
completed: 2026-03-22
---

# Phase 3 Plan 01: Cache-Refresh Flow and Retry Logic Summary

**3-attempt exponential backoff retry added to fetchAwardRates, clearCache() wired before manual refresh, and D-08 error wording locked — bringing test count from 89 to 93**

## Performance

- **Duration:** 26 min
- **Started:** 2026-03-22T07:50:12Z
- **Completed:** 2026-03-22T08:16:25Z
- **Tasks:** 3 (TDD: RED, GREEN-service, GREEN-App)
- **Files modified:** 4

## Accomplishments
- `fetchAwardRates` now retries up to 3 times with 1s/2s/4s exponential backoff before throwing — network errors and HTTP 5xx errors both trigger retries
- `handleRefreshRates` calls `clearCache()` (no-arg) before `fetchAwardRates`, forcing a fresh API call that bypasses the 90-day TTL cache
- Refresh failure error message locked to D-08 wording: "Couldn't connect to Fair Work Commission — using saved rates"
- 4 new tests added (3 retry service tests + 1 D-08 App test); all 93 tests pass; build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Add failing tests for retry logic and D-08 error wording (RED)** - `b9d6ef1` (test)
2. **Task 2: Implement retry loop inside fetchAwardRates (GREEN)** - `33f5d88` (feat)
3. **Task 3: Wire clearCache() in handleRefreshRates and fix error strings (GREEN)** - `c0a5543` (feat)

_Note: TDD tasks committed as test (RED) then feat (GREEN) per TDD protocol._

## Files Created/Modified
- `src/services/awardRatesService.js` - fetchAwardRates wrapped in 3-attempt for-loop with exponential backoff
- `src/services/awardRatesService.test.js` - 3 new retry tests using setTimeout spy pattern for Jest 27 compatibility
- `src/App.js` - clearCache imported and called before fetchAwardRates; D-08 error wording fixed
- `src/App.test.js` - 1 new D-08 wording test for handleRefreshRates failure path

## Decisions Made

- **Jest 27 setTimeout spy for retry tests:** `jest.runAllTimersAsync()` doesn't exist in Jest 27 (only Jest 28+). Used `jest.spyOn(global, 'setTimeout').mockImplementation((fn, ms) => { if (ms < 15000) { fn(); } ... })` to bypass backoff delays (< 15000ms) while leaving the 15000ms AbortController timeout real. This lets retry tests run fast while still verifying call counts.
- **Retry implemented as for-loop (Option A):** Clean `for (let attempt = 0; attempt < 3; attempt++)` loop storing `lastError` and `throw lastError` after exhaustion. Matches plan artifact specification exactly.
- **clearCache() called with no arguments (D-04):** Clears all award_rates_v1_ keys so all 3 awards are refreshed together, not individually.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rewrote retry tests to use Jest 27-compatible timer approach**
- **Found during:** Task 1 (RED phase test writing)
- **Issue:** Plan tests used `jest.runAllTimersAsync()` which doesn't exist in Jest 27 (Create React App ships with Jest 27.5.1). Tests crashed the entire test runner with "TypeError: jest.runAllTimersAsync is not a function".
- **Fix:** Replaced fake timer approach with `jest.spyOn(global, 'setTimeout')` — backoff delays (ms < 15000) run immediately, abort controller timers (15000ms) use real timers. Tests verify retry behavior via `toHaveBeenCalledTimes(3)` call counts.
- **Files modified:** src/services/awardRatesService.test.js
- **Verification:** All 14 awardRatesService tests pass; retry call counts verified correctly
- **Committed in:** b9d6ef1 (Task 1 commit), refined in 33f5d88 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test approach incompatible with Jest 27)
**Impact on plan:** Fix required for tests to run at all. Test intent (verify retry call count + error wording) fully preserved. No scope creep.

## Issues Encountered
- `jest.runAllTimersAsync()` not available in Jest 27 — CRA 5.0.1 ships with Jest 27.5.1, not Jest 28+. Resolved by switching to `setTimeout` spy pattern.
- The "throws when response is not ok" existing test now takes ~3s because it retries 3 times (HTTP 500 triggers retry loop). Expected — test still passes and verifies correct behavior.

## Known Stubs
None — no stub patterns found in files created or modified in this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 Plan 01 (POLISH-01) is the only plan in Phase 03 — all polish work is complete
- v1.1 milestone ready for final review: retry logic hardened, cache-refresh flow correct, error messaging standardized
- No blockers

## Self-Check: PASSED

- SUMMARY.md: FOUND at .planning/phases/03-polish/03-01-SUMMARY.md
- src/services/awardRatesService.js: FOUND
- src/App.js: FOUND
- Commit b9d6ef1 (Task 1 RED): FOUND
- Commit 33f5d88 (Task 2 GREEN service): FOUND
- Commit c0a5543 (Task 3 GREEN App): FOUND

---
*Phase: 03-polish*
*Completed: 2026-03-22*
