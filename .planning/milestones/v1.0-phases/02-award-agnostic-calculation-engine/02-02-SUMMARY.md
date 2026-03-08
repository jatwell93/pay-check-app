---
phase: 02-award-agnostic-calculation-engine
plan: 02
subsystem: calculation-engine
tags: [react, helpers, penalty-rates, award-config, tdd, parameterization]

# Dependency graph
requires:
  - phase: 02-award-agnostic-calculation-engine/02-01
    provides: awardConfig.js with penaltyConfig shape for MA000012, MA000003, MA000009
provides:
  - Parameterized calculatePayForTimePeriod accepting penaltyConfig as 8th argument
  - Backwards-compatible default (MA000012 Pharmacy) for existing App.js callers
  - Award-differentiated penalty calculations (Retail vs Pharmacy Saturday rates differ)
affects:
  - 02-03 (getPenaltyDescription parameterization will follow same pattern)
  - 02-04 (component refactoring will wire penaltyConfig from awardConfig into App.js calls)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "penaltyConfig parameter destructuring: inner functions receive penaltyConfig from outer scope via explicit argument"
    - "DEFAULT_PENALTY_CONFIG fallback: module-level constant ensures backwards compatibility without touching App.js"

key-files:
  created: []
  modified:
    - src/helpers.js

key-decisions:
  - "Description strings in getPenaltyRateDetails are dynamically generated from penaltyConfig values (Math.round * 100) rather than hardcoded strings — ensures displayed percentages match actual config values for all awards"
  - "getPenaltyRateDetails is an inner function (not exported) — penaltyConfig is passed as explicit 5th arg rather than closure, keeping the function pure and independently testable"

patterns-established:
  - "Parameterization pattern: add penaltyConfig param with DEFAULT_PENALTY_CONFIG fallback, thread it through to all inner consumers"
  - "Module-level default constant: DEFAULT_PENALTY_CONFIG = getAwardConfig('MA000012').penaltyConfig at module load time, avoids repeated getAwardConfig calls per invocation"

requirements-completed: [AWARD-04, REG-02, REG-03]

# Metrics
duration: 18min
completed: 2026-03-08
---

# Phase 02 Plan 02: Parameterized calculatePayForTimePeriod with penaltyConfig Summary

**helpers.js calculatePayForTimePeriod now accepts penaltyConfig as 8th parameter, replacing all hardcoded Pharmacy boundary literals with config-driven values and turning the Retail differentiation test GREEN**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-08T05:59:48Z
- **Completed:** 2026-03-08T06:18:18Z
- **Tasks:** 1 (TDD — RED baseline confirmed, GREEN implementation)
- **Files modified:** 1

## Accomplishments
- Parameterized `calculatePayForTimePeriod` with `penaltyConfig = DEFAULT_PENALTY_CONFIG` as 8th argument — zero breaking changes to App.js
- Replaced all hardcoded penalty literals (`1.5`, `2`, `1.25`, `7 * 60`, `19 * 60`) in `getPenaltyRateDetails` and `penaltyBoundaries` with config-driven values
- All 10 pharmacyRegression.test.js tests GREEN including the Retail differentiation test (was RED before this plan)
- Full test suite: 40 tests GREEN, no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Parameterize getPenaltyRateDetails and calculatePayForTimePeriod** - `fd68653` (feat)

**Plan metadata:** (docs commit follows)

_Note: TDD task — RED baseline verified first (differentiation test failing as expected), then GREEN implementation committed._

## Files Created/Modified
- `src/helpers.js` - Added penaltyConfig parameter to calculatePayForTimePeriod (8th arg, Pharmacy default) and getPenaltyRateDetails (5th arg); replaced all hardcoded boundary/multiplier literals

## Decisions Made
- Dynamic description strings: `'Saturday Rate (' + Math.round(penaltyConfig.saturdayMultiplier * 100) + '%)'` rather than hardcoded `'Saturday Rate (150%)'` — ensures displayed text is truthful for any award's multiplier values
- getPenaltyRateDetails receives penaltyConfig as explicit argument (not closure capture) — pure function, easier to unit test in isolation if needed in future

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The refactor was straightforward: 6 targeted edits to helpers.js following the step-by-step action plan. All 40 tests passed immediately after the change.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- helpers.js now fully parameterized — any award's penaltyConfig produces correct penalty calculations
- Plan 03 (getPenaltyDescription parameterization) can proceed: same pattern applies to the description helper in App.js
- Plan 04 (component refactoring / App.js wiring) can proceed: will update App.js to pass selectedAward's penaltyConfig when calling calculatePayForTimePeriod

---
*Phase: 02-award-agnostic-calculation-engine*
*Completed: 2026-03-08*
