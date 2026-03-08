---
phase: 02-award-agnostic-calculation-engine
plan: 01
subsystem: testing
tags: [jest, react, pharmacy, award-config, regression-testing, penalty-rates]

# Dependency graph
requires:
  - phase: 01-api-foundation-award-selection
    provides: "App.js pharmacyAwardRates — base rates and allowances copied verbatim into awardConfig.js"
provides:
  - "src/config/awardConfig.js — single source of truth for all 3 award configurations (MA000012, MA000003, MA000009)"
  - "src/__tests__/pharmacyRegression.test.js — 9-test GREEN baseline + 1-test RED differentiation suite"
affects: [02-02, helpers.js parameterization, Plan 02 refactoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Award config keyed by FWC award ID (MA000012, MA000003, MA000009) with penaltyConfig shape"
    - "getAwardConfig(awardId) factory — throws on unknown ID, no silent fallback"
    - "Self-contained config file — no imports from helpers.js or App.js"
    - "TDD RED/GREEN split: regression tests GREEN immediately, differentiation test RED until parameterization"

key-files:
  created:
    - src/config/awardConfig.js
    - src/__tests__/pharmacyRegression.test.js
  modified: []

key-decisions:
  - "awardConfig.js is self-contained — no imports from helpers.js or App.js; prevents circular dependencies when Plan 02 makes helpers.js import from awardConfig"
  - "Differentiation test uses identical base rate for both calls — only penaltyConfig differs — so test is genuinely RED (not artificially RED from lower base rate)"
  - "juniorPercentages use age-16/age-17 keys (matching App.js) not 16/17 plain keys — preserves compatibility"
  - "Retail casual rates computed as FT * 1.25; Hospitality same — realistic stubs, clearly marked for v2 replacement"

patterns-established:
  - "penaltyConfig shape: { earlyMorningThreshold, eveningThreshold, earlyMorningMultiplier, eveningMultiplier, casualLoadingMultiplier, saturdayMultiplier, sundayMultiplier, phMultiplier, overtimeThresholdHours, overtimeFirstTierMultiplier, overtimeSecondTierMultiplier }"
  - "Regression test style: toBeCloseTo(value, 2) for minute-by-minute floating-point tolerance"
  - "TDD split: helpers-regression tests are GREEN immediately (capture baseline); differentiation tests are RED (drive Plan 02)"

requirements-completed: [AWARD-01, AWARD-02, AWARD-03, AWARD-04, REG-02, REG-03]

# Metrics
duration: 8min
completed: 2026-03-08
---

# Phase 2 Plan 01: Award Config & Regression Baseline Summary

**awardConfig.js with penaltyConfig shape for MA000012/MA000003/MA000009, plus 9-pass/1-fail pharmacyRegression test suite that captures the baseline before Plan 02 refactors helpers.js**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-08T05:44:26Z
- **Completed:** 2026-03-08T05:53:02Z
- **Tasks:** 2
- **Files modified:** 2 created

## Accomplishments

- Created `src/config/awardConfig.js` as self-contained single source of truth — MA000012 rates byte-for-byte identical to App.js pharmacyAwardRates; MA000003 and MA000009 stubs with differentiable penaltyConfig values (eveningThreshold 1320/1260, saturdayMultiplier 1.25)
- Established locked penaltyConfig shape with 11 fields that helpers.js will consume in Plan 02
- Created 10-test pharmacyRegression suite: 9 GREEN (weekday FT/casual, early morning, evening, Saturday, Sunday, public holiday, junior FT, junior casual) + 1 RED differentiation test
- Differentiation test proves helpers.js must be parameterized: currently ignores penaltyConfig so both Pharmacy and Retail get 1.5x Saturday — test fails as designed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/config/awardConfig.js** - `fcda369` (feat)
2. **Task 2: Write pharmacyRegression.test.js RED baseline** - `c887b75` (test)

## Files Created/Modified

- `src/config/awardConfig.js` — Self-contained award config map with MA000012/MA000003/MA000009 entries; exports `awardConfig` (default) and `getAwardConfig` (named)
- `src/__tests__/pharmacyRegression.test.js` — Regression baseline suite; 9 passing GREEN tests + 1 RED differentiation test that drives Plan 02

## Decisions Made

- **Differentiation test uses same base rate ($25.99) for both Pharmacy and Retail calls** — ensures the test is RED because penaltyConfig is ignored (not just because retail has a lower base rate). After Plan 02, the retail call will correctly use 1.25x Saturday multiplier producing less pay.
- **awardConfig.js has no imports** — self-contained by design to prevent circular dependency when Plan 02 makes helpers.js import from awardConfig.
- **juniorPercentages keys match App.js** — `age-16`, `age-17` etc. (not plain `16`, `17`) to maintain backward compatibility with existing code paths.
- **Evening test value corrected from 116.96 to 116.95** — minute-by-minute floating-point accumulation produces 116.95, not the naive arithmetic result of 116.96 (auto-fix Rule 1 during TDD verification).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Evening penalty expected value corrected from 116.96 to 116.95**
- **Found during:** Task 2 (pharmacyRegression.test.js TDD verification)
- **Issue:** Manual arithmetic predicted 116.96 but minute-by-minute accumulation in helpers.js produces 116.95 due to floating-point ordering differences
- **Fix:** Updated assertion from `toBeCloseTo(116.96, 2)` to `toBeCloseTo(116.95, 2)` — confirmed via running test suite
- **Files modified:** src/__tests__/pharmacyRegression.test.js
- **Verification:** Test passed after correction
- **Committed in:** c887b75 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Trivial fix — floating-point arithmetic difference in test value, not a logic error. No scope creep.

## Issues Encountered

- awardConfig.js already existed (uncommitted) from a prior partial session — verified it matched plan requirements exactly, staged and committed as Task 1. No content changes needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `awardConfig.js` penaltyConfig shape is locked — Plan 02 will pass `penaltyConfig` as 8th argument to `calculatePayForTimePeriod`
- Regression suite (9 GREEN) provides safety net — if any Pharmacy value changes after Plan 02 refactoring, tests will catch it
- Differentiation test (1 RED) will turn GREEN when Plan 02 makes helpers.js respect penaltyConfig argument
- No blockers — Plan 02 (parameterize helpers.js) can proceed immediately

---
*Phase: 02-award-agnostic-calculation-engine*
*Completed: 2026-03-08*
