---
phase: 02-award-agnostic-calculation-engine
plan: 03
subsystem: ui
tags: [react, award-config, penalty-config, multi-award]

# Dependency graph
requires:
  - phase: 02-01
    provides: awardConfig.js with getAwardConfig(awardId) and full penaltyConfig shape
  - phase: 02-02
    provides: parameterized calculatePayForTimePeriod accepting penaltyConfig as 8th arg
provides:
  - App.js wired end-to-end to getAwardConfig(selectedAward) — no more hardcoded pharmacyAwardRates
  - Award-agnostic calculatePay() reading baseRates, juniorPercentages, allowances, penaltyConfig from config
  - Award-aware handleSelectAward resetting classification to first classification in new award
  - Dynamic header showing selected award name
affects:
  - 03-multi-view-ui-pay-comparison

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getAwardConfig(selectedAward) call at top of calculatePay() — single config derivation per calculation"
    - "currentAwardConfig derived before JSX return for render-time access to award name and config"
    - "Optional chaining + nullish coalescing (?? 0) on all allowance reads — graceful across awards"

key-files:
  created: []
  modified:
    - src/App.js

key-decisions:
  - "pharmacyAwardRates constant in App.js removed entirely — awardConfig.js is now the single source of truth"
  - "getPenaltyDescription now accepts penaltyConfig as 4th param, derives threshold strings from minutes values — no hardcoded 07:00/19:00"
  - "calculatePayForTimePeriod call bug fixed: was passing getPenaltyDescription as 7th arg (classification position); corrected to pass classification as 7th and penaltyConfig as 8th"
  - "useEffect fallback changed from setAwardRates({'MA000012': pharmacyAwardRates}) to setAwardRates({}) — calculatePay no longer reads from awardRates state"
  - "currentAwardConfig computed before JSX return (separate from selectedAwardConfig inside calculatePay) to drive dynamic header and important notes"

patterns-established:
  - "All award-specific data flows from getAwardConfig(awardId) — no other hardcoded award data in App.js"
  - "Allowance reads use ?. and ?? 0 — awards without a given allowance silently contribute $0"
  - "Overtime threshold and multipliers read from penaltyConfig — not hardcoded 38/1.5/2.0"

requirements-completed: [AWARD-04, REG-02, REG-03]

# Metrics
duration: 15min
completed: 2026-03-08
---

# Phase 02 Plan 03: Wire App.js to Award-Agnostic Config Summary

**App.js fully decoupled from hardcoded pharmacyAwardRates — calculatePay(), getPenaltyDescription(), and handleSelectAward() now read all data from getAwardConfig(selectedAward)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-08T07:00:00Z
- **Completed:** 2026-03-08T07:15:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Removed the 59-line `pharmacyAwardRates` constant from App.js; awardConfig.js is now the single source of truth
- Fixed a pre-existing bug where `calculatePayForTimePeriod` was called with `getPenaltyDescription` as the 7th arg (classification position) — corrected to pass `classification` as 7th and `selectedAwardConfig.penaltyConfig` as 8th
- `getPenaltyDescription` updated to derive penalty boundary time strings from `penaltyConfig.earlyMorningThreshold` and `penaltyConfig.eveningThreshold` (minutes values), eliminating hardcoded "07:00" and "19:00" strings
- `handleSelectAward` now resets classification to `getAwardConfig(awardId).classifications[0].id` — award-aware instead of hardcoded 'pharmacy-assistant-1'
- All 40 tests pass after changes (pharmacyRegression + App integration + AwardSelector + awardRatesService)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire App.js calculatePay() and helpers to awardConfig — remove pharmacyAwardRates** - `7343bcf` (feat)

## Files Created/Modified
- `src/App.js` — Removed pharmacyAwardRates; added getAwardConfig import; updated calculatePay, getPenaltyDescription, handleSelectAward, JSX header, and Important Notes

## Decisions Made
- `pharmacyAwardRates` constant removed entirely — awardConfig.js contains byte-for-byte identical data and is now the single source of truth
- `useEffect` error fallback changed to `setAwardRates({})` since `calculatePay` no longer reads from `awardRates` state; the state is retained for future v2 API hydration
- `currentAwardConfig` computed before the JSX `return` statement (separate from `selectedAwardConfig` inside `calculatePay`) to provide render-time access without calling `getAwardConfig` inside JSX

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed calculatePayForTimePeriod call passing wrong 7th argument**
- **Found during:** Task 1 (reviewing existing App.js calculatePayForTimePeriod call)
- **Issue:** The call passed `getPenaltyDescription` as the 7th argument (which should be `classification`). This was noted in the plan's context as a known bug to fix.
- **Fix:** Corrected to pass `classification` as 7th arg and `selectedAwardConfig.penaltyConfig` as 8th arg, matching the updated signature from Plan 02.
- **Files modified:** src/App.js
- **Verification:** All 40 tests pass; helpers.js correctly receives classification for above-award rate override logic
- **Committed in:** 7343bcf (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug fix, was already documented in plan as a required fix)
**Impact on plan:** Fix was necessary for correct calculation behavior. No scope creep.

## Issues Encountered
None — all changes applied cleanly. The plan's interface specifications precisely matched the current codebase.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 is now complete: awardConfig.js built (Plan 01), helpers.js parameterized (Plan 02), App.js wired (Plan 03)
- Selecting Retail or Hospitality award now produces calculations using that award's penalty boundaries, base rates, junior percentages, and allowances
- Phase 3 (Multi-View UI & Pay Comparison) is unblocked — the award-agnostic engine is stable

## Self-Check: PASSED

All files and commits verified:
- src/App.js: FOUND
- 02-03-SUMMARY.md: FOUND
- Commit 7343bcf: FOUND

---
*Phase: 02-award-agnostic-calculation-engine*
*Completed: 2026-03-08*
