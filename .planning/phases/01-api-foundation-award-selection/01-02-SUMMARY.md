---
phase: 01-api-foundation-award-selection
plan: 02
subsystem: ui
tags: [react, component, tdd, award-selector, date-fns, localStorage, api-integration]

# Dependency graph
requires:
  - phase: 01-api-foundation-award-selection plan 01
    provides: awardRatesService (fetchAwardRates, getCachedAwardRates, getLastCacheUpdateTime, clearCache)
provides:
  - AwardSelector presentational component (dropdown, refresh button, loading/error/success states, timestamp)
  - App.js award state layer (selectedAward, awardRates, awardLoading, awardError, lastUpdated, awardSuccessMessage)
  - Cache-first initialization useEffect with pharmacy fallback on total API failure
  - handleSelectAward (resets classification, clears results, preserves shift hours)
  - handleRefreshRates (re-fetches all awards, 3-second success flash)
  - Integration tests for App.js + AwardSelector wiring
affects:
  - Phase 2 (award-agnostic engine will read from awardRates state set here)
  - Phase 3 (ModeToggle and comparison views will coexist with AwardSelector)

# Tech tracking
tech-stack:
  added:
    - date-fns (existing dep, newly used) — formatDistanceToNow for "Rates last updated X ago" display
  patterns:
    - TDD (RED-GREEN): AwardSelector tests written first (13 tests), then implementation
    - Presentational component pattern: AwardSelector has zero internal state, zero API calls — all state owned by App.js
    - Cache-first initialization: useEffect checks localStorage before triggering API fetch
    - Success flash pattern: App.js sets successMessage, clears after 3s with setTimeout — not managed by AwardSelector

key-files:
  created:
    - src/components/AwardSelector.js
    - src/components/AwardSelector.test.js
  modified:
    - src/App.js
    - src/App.test.js

key-decisions:
  - "AwardSelector is purely presentational — no internal state, no API calls. All loading/error/success/timestamp state lives in App.js and flows down as props."
  - "Success flash (Rates updated) is an App.js concern via successMessage prop and setTimeout — AwardSelector only renders what it receives."
  - "Award switch resets classification to pharmacy-assistant-1 (hardcoded for Phase 1); Phase 2 will make this award-aware."
  - "weeklyData (shift hours) is preserved on award switch per CONTEXT.md spec — only classification and results are cleared."
  - "Error messages are plain-text in .award-selector__error div — no HTTP codes or stack traces exposed to users."

patterns-established:
  - "Presentational + container split: AwardSelector (presentational) receives all state as props; App.js owns all award-related state and handlers."
  - "successMessage as nullable prop: non-null string = render it; null = render nothing. Pattern reusable for other transient success indicators."
  - "Cache-first + graceful degradation: try cache, fallback to API, fallback to partial cache, fallback to hardcoded pharmacy rates — each level documented with inline comments."

requirements-completed: [API-01, API-02, API-03]

# Metrics
duration: ~25min
completed: 2026-03-07
---

# Phase 1 Plan 02: AwardSelector Component Summary

**AwardSelector presentational component wired into App.js with cache-first initialization, 3-award dropdown, refresh-with-success-flash, and Pharmacy hardcoded fallback — 30 tests passing across all layers.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-07T15:35:00+11:00 (approx)
- **Completed:** 2026-03-07T05:09:05Z
- **Tasks:** 2 (+ 1 human-verify checkpoint, approved)
- **Files modified:** 4

## Accomplishments

- AwardSelector presentational component built with TDD (13 tests, RED-GREEN)
- App.js fully wired: 6 new state vars, useEffect cache-first init, handleRefreshRates, handleSelectAward
- Total test suite: 30 passing (13 AwardSelector + 11 awardRatesService + 6 App integration)
- Broken CRA boilerplate App.test.js replaced with real integration tests
- Award selector renders above EmployeeDetails; switching award resets classification and results, preserves shift hours

## Task Commits

Each task was committed atomically:

1. **Task 1: Build AwardSelector component with tests** - `4767fa1` (feat)
2. **Task 2: Integrate AwardSelector into App.js and update App.test.js** - `a7a910c` (feat)

**Plan metadata:** (this commit — docs)

_Note: Task 1 used TDD (RED-GREEN): test file written first (13 tests failing), then implementation to pass._

## Files Created/Modified

- `src/components/AwardSelector.js` — Presentational component: award dropdown, refresh button, loading/error/success states, formatDistanceToNow timestamp
- `src/components/AwardSelector.test.js` — 13 unit tests covering all props and states (dropdown render, loading disable, onSelectAward callback, refresh button states, error display, timestamp, success flash)
- `src/App.js` — Added AWARD_IDS + awardMetadata constants, 6 new state vars, useEffect cache-first initialization, handleRefreshRates, handleSelectAward, AwardSelector rendered as first child in container
- `src/App.test.js` — Replaced CRA boilerplate with 6 integration tests: AwardSelector renders, service called on init, loading resolves, fallback error on total miss, award switch clears results

## Decisions Made

1. **AwardSelector purely presentational:** All loading/error/success/timestamp state lives in App.js. AwardSelector renders only what props provide. This keeps the component testable in isolation and avoids embedding side-effects in UI components.

2. **successMessage as nullable prop:** `successMessage: string | null` allows App.js to control the flash lifecycle via `setTimeout(() => setAwardSuccessMessage(null), 3000)`. AwardSelector does not need to know how long to show it.

3. **Award switch resets to pharmacy-assistant-1:** Phase 1 preserves the existing pharmacy classification list. Phase 2 will make classification lists award-aware and this default will be replaced.

4. **weeklyData preserved on award switch:** Hours entered for shifts are not cleared — only classification (award-dependent) and results (calculated from old award rates) are cleared. This matches the CONTEXT.md requirement explicitly.

5. **Plain-text errors only:** `award-selector__error` div contains plain-language messages only — no HTTP status codes, no stack traces. Styling is deferred to App.css (out of scope for this plan).

## Deviations from Plan

None — plan executed exactly as written. The TDD flow for Task 1 produced 13 tests (plan required a minimum of 11 behaviors tested; 13 because the test for "does NOT render error when null" and "does NOT render timestamp when null" were each implemented alongside their positive counterparts).

## Issues Encountered

None. The App.test.js noted in 01-01-SUMMARY.md as a pre-existing failure (CRA boilerplate "learn react" test) was in scope for Task 2 — it was replaced with real integration tests as planned.

## User Setup Required

None — no external service configuration required beyond what was documented in `.env.example` (created in Plan 01).

## Next Phase Readiness

- Phase 1 complete: API-01, API-02, API-03 all satisfied
- `awardRates` state in App.js holds `{ [awardId]: ratesData }` — Phase 2 engine will consume this
- `selectedAward` state identifies which award is active — Phase 2 uses this to select the right penaltyConfig
- Pharmacy hardcoded fallback (`pharmacyAwardRates`) remains in App.js for graceful degradation
- No blockers for Phase 2

---
*Phase: 01-api-foundation-award-selection*
*Completed: 2026-03-07*

## Self-Check: PASSED

All required files found:
- FOUND: src/components/AwardSelector.js
- FOUND: src/components/AwardSelector.test.js
- FOUND: .planning/phases/01-api-foundation-award-selection/01-02-SUMMARY.md

All commits verified:
- FOUND: 4767fa1 (feat(01-02): build AwardSelector presentational component)
- FOUND: a7a910c (feat(01-02): integrate AwardSelector into App.js with full state management)
