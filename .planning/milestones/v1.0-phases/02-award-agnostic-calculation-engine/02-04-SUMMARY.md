---
phase: 02-award-agnostic-calculation-engine
plan: 04
subsystem: ui
tags: [react, components, props, award-config, conditional-rendering, tdd]

# Dependency graph
requires:
  - phase: 02-award-agnostic-calculation-engine-plan-01
    provides: awardConfig.js with classifications, ageOptions, juniorClassificationIds, allowances per award
  - phase: 02-award-agnostic-calculation-engine-plan-03
    provides: App.js wired with getAwardConfig and currentAwardConfig computed before JSX return

provides:
  - Award-agnostic EmployeeDetails component driven by classifications/ageOptions/juniorClassificationIds props
  - Award-agnostic Allowances component driven by allowanceConfig prop with conditional rendering
  - EmployeeDetails.test.js: 4 tests for dynamic classification and age dropdown behaviour
  - Allowances.test.js: 3 tests for conditional allowance rendering based on award config
  - helpers.js stripped of static classifications/ageOptions exports (awardConfig.js is sole source)

affects:
  - Phase 3 (UI/view layer builds on award-aware components established here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Props-driven conditional rendering: Allowances renders only sections present in allowanceConfig (null-check pattern)
    - Prop injection from config: App.js extracts config fields and passes as explicit props to child components
    - juniorClassificationIds array membership check replaces hardcoded pharmacy ID strings

key-files:
  created:
    - src/components/EmployeeDetails.test.js
    - src/components/Allowances.test.js
  modified:
    - src/components/EmployeeDetails.js
    - src/components/Allowances.js
    - src/App.js
    - src/helpers.js

key-decisions:
  - "pharmacistIds for homeMedicineReview eligibility remains hardcoded in Allowances.js — this is a Pharmacy-only allowance that only appears when Pharmacy award is selected, so the hardcoded check is correct by construction"
  - "allowanceConfig uses null-check (!=null) not falsy check — allows zero-value allowances to still render if explicitly configured"

patterns-established:
  - "Null-check conditional rendering: {config?.field != null && <Section />} — use != null not truthiness to allow 0 values"
  - "Award config prop injection: App.js passes currentAwardConfig.{field} as explicit named prop rather than passing full config object"

requirements-completed: [AWARD-01, AWARD-02, AWARD-03]

# Metrics
duration: 11min
completed: 2026-03-08
---

# Phase 2 Plan 04: UI Prop Refactor Summary

**Award-agnostic EmployeeDetails and Allowances components with dynamic classification dropdowns and conditional allowance rendering driven by awardConfig props — completing Phase 2 UI surface**

## Performance

- **Duration:** ~11 min (automated tasks) + human verification
- **Started:** 2026-03-08T07:05:00Z
- **Completed:** 2026-03-08T07:20:00Z
- **Tasks:** 3 of 3 complete (2 automated + 1 human-verify checkpoint — approved)
- **Files modified:** 6

## Accomplishments
- EmployeeDetails.js removes helpers.js import; receives classifications, ageOptions, juniorClassificationIds as props — dropdown now updates immediately on award switch
- Allowances.js accepts allowanceConfig prop and renders only sections present in the award config — Retail shows only Meal Allowance and Motor Vehicle; Pharmacy shows all 5 sections
- helpers.js `classifications` and `ageOptions` static exports removed — awardConfig.js is now the single source of truth for all award-specific data
- 7 new component tests pass (4 EmployeeDetails + 3 Allowances) — 47 total tests passing across 6 suites

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor EmployeeDetails and Allowances, add tests (TDD RED→GREEN)** - `9e6f498` (feat)
2. **Task 2: Wire new props in App.js, remove helpers.js exports** - `52b48f5` (feat)
3. **Task 3: Checkpoint — human-verify award switching** - Approved by user (all 6 checks passed: AWARD-01, AWARD-02, AWARD-03, AWARD-04, REG-02, REG-03)

_Note: TDD RED committed as part of Task 1 implementation (tests written first, then components updated to pass)_

## Files Created/Modified
- `src/components/EmployeeDetails.js` - Removed helpers.js import; accepts classifications/ageOptions/juniorClassificationIds as props; disabled logic uses juniorClassificationIds.includes()
- `src/components/EmployeeDetails.test.js` - 4 tests: Pharmacy/Retail classification rendering, age dropdown enabled/disabled based on juniorClassificationIds
- `src/components/Allowances.js` - Accepts allowanceConfig prop; renders each allowance section only when the award config defines it (null-check conditional)
- `src/components/Allowances.test.js` - 3 tests: full Pharmacy config renders all sections, Retail config omits homeMedicineReview/laundry/brokenHill, Retail renders meal allowance
- `src/App.js` - Passes currentAwardConfig.classifications, .ageOptions, .juniorClassificationIds to EmployeeDetails; passes currentAwardConfig.allowances to Allowances
- `src/helpers.js` - Removed `export const classifications` and `export const ageOptions` blocks (17 lines removed)

## Decisions Made
- **pharmacistIds hardcoded in Allowances.js**: homeMedicineReview eligibility check keeps hardcoded pharmacist IDs since this allowance is only rendered when Pharmacy award is selected (allowanceConfig guards it). No practical need to make this configurable.
- **`!= null` not truthiness**: Used `allowanceConfig?.field != null` to guard rendering — allows zero-value amounts to still display if the award explicitly configures them.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The pre-existing `act()` warnings in App.test.js (from async award rate initialization) are present but do not affect test pass/fail status — they predate this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 2 is fully complete. Human verification (Task 3) approved — all 6 checks passed in browser:
- AWARD-01: Award selector shows Pharmacy, Retail, Hospitality options
- AWARD-02: Classification dropdown updates immediately on award switch (Retail shows Retail roles, etc.)
- AWARD-03: Allowances section shows only award-relevant sections (Retail omits Home Medicine Reviews, Broken Hill)
- AWARD-04: Penalty calculations use award-specific rates (Retail Saturday differs from Pharmacy Saturday)
- REG-02: Pharmacy weekday calculation matches expected output (~$194.93)
- REG-03: Junior rates apply correctly at age percentage (70% of adult rate)

Phase 3 (Multi-View UI & Pay Comparison) is unblocked.

## Self-Check: PASSED

All files and commits verified:
- src/components/EmployeeDetails.js: FOUND
- src/components/EmployeeDetails.test.js: FOUND
- src/components/Allowances.js: FOUND
- src/components/Allowances.test.js: FOUND
- src/App.js: FOUND
- src/helpers.js: FOUND
- Commit 9e6f498: FOUND
- Commit 52b48f5: FOUND
- 02-04-SUMMARY.md: FOUND

---
*Phase: 02-award-agnostic-calculation-engine*
*Completed: 2026-03-08*
