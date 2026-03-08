---
phase: 03-multi-view-ui-and-pay-comparison
plan: 01
subsystem: ui
tags: [react, testing-library, tdd, jest]

# Dependency graph
requires:
  - phase: 02-award-agnostic-calculation-engine
    provides: results object shape with dailyBreakdown.segments from calculatePayForTimePeriod
provides:
  - OverviewBreakdown component: week overview table with per-day discrepancy comparison and accordion drill-down
  - 12-test TDD suite covering all PAY-01 through PAY-04 acceptance criteria
affects: [03-02, 03-03, App.js integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD red-green cycle for presentational components
    - Render-time discrepancy calculation from props (not state)
    - Accordion pattern via selectedDayIndex prop + React.Fragment row pairs
    - onClick stopPropagation on input cell to prevent accordion trigger

key-files:
  created:
    - src/components/OverviewBreakdown.js
    - src/components/OverviewBreakdown.test.js
  modified: []

key-decisions:
  - "Inline segment table (not importing DetailedBreakdown) to avoid prop shape coupling and keep component self-contained"
  - "Status badge uses Math.abs tolerance check (<=0.01) so rounding differences show OK, not Underpaid"
  - "Period summary uses raw sign: negative value displays as $-23.33, giving instant underpaid/overpaid signal"
  - "actualPaidByDay empty string treated as no-input (show hint), not zero, to avoid false Underpaid on untouched rows"

patterns-established:
  - "Accordion pattern: selectedDayIndex prop (null | number) + onDayToggle callback — single expanded row enforced by parent state in App.js"
  - "Input stopPropagation: onClick on input cell calls e.stopPropagation() to prevent row click handler from firing"
  - "TDD fixture pattern: mockResults with 2 minimal days + defaultProps helper with jest.fn() callbacks used across all 12 tests"

requirements-completed: [PAY-01, PAY-02, PAY-03, PAY-04]

# Metrics
duration: 3min
completed: 2026-03-08
---

# Phase 3 Plan 01: OverviewBreakdown Component Summary

**Week overview table with per-day OK/Underpaid badges, actual paid inputs, accordion segment drill-down, and period discrepancy summary — TDD GREEN with 12 tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-08T14:39:13Z
- **Completed:** 2026-03-08T14:41:46Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 2

## Accomplishments

- Built OverviewBreakdown.js: week table with Day, Hours, Calculated, Actual Paid, Discrepancy, Status columns
- Status badges: green OK (within $0.01 tolerance), red Underpaid (> $0.01 difference), grey hint text when no input
- Accordion drill-down: clicking day row expands inline segment table (Time, Hours, Rate Type, Rate, Amount); only one row expandable at a time
- Period total input with weekly/fortnightly label; period summary line "Calculated: $X.XX | Paid: $Y.YY | Difference: $Z.ZZ" hidden when empty
- 12 tests RED→GREEN, full suite 59/59 passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for OverviewBreakdown (RED)** - `f11cb11` (test)
2. **Task 2: Implement OverviewBreakdown to pass all tests (GREEN)** - `b4a2102` (feat)

## Files Created/Modified

- `src/components/OverviewBreakdown.js` - Pure functional component, 110 lines; week overview table with accordion, discrepancy comparison, period summary
- `src/components/OverviewBreakdown.test.js` - 12 TDD tests covering all PAY-01 through PAY-04 acceptance criteria

## Decisions Made

- Inline segment table rather than importing DetailedBreakdown — avoids prop shape coupling, keeps OverviewBreakdown self-contained
- Status badge tolerance: `Math.abs(calculatedPay - actual) <= 0.01` — rounding differences ($0.005) correctly show OK
- Period summary sign is raw: `(parseFloat(totalActualPaid) - results.total).toFixed(2)` gives negative value for underpaid (displays as $-23.33)
- Empty string in actualPaidByDay shows hint text "Enter actual paid" rather than treating as zero — prevents false Underpaid badges on untouched rows

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Both TDD phases passed first run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- OverviewBreakdown component complete and tested; ready for App.js integration (plan 03-02 or equivalent)
- Props contract fully defined: results, selectedDayIndex, onDayToggle, actualPaidByDay, onActualPaidChange, totalActualPaid, onTotalActualPaidChange, cycleLength
- No blockers

## Self-Check: PASSED

- FOUND: src/components/OverviewBreakdown.js
- FOUND: src/components/OverviewBreakdown.test.js
- FOUND commit f11cb11 (test RED)
- FOUND commit b4a2102 (feat GREEN)
- Full test suite: 59/59 passing

---
*Phase: 03-multi-view-ui-and-pay-comparison*
*Completed: 2026-03-08*
