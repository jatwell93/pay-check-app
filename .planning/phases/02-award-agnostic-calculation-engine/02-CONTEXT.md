# Phase 2: Award-Agnostic Calculation Engine - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Refactor the calculation engine so that penalty boundaries, base rates, allowances, classification
lists, and junior rate percentages are read from award-specific configuration rather than the
hardcoded Pharmacy values. The FWC API integration (awardRatesService.js) is already in place from
Phase 1 — Phase 2 does not change the API/caching layer. Phase 2 also does not implement the pay
comparison UI (Phase 3). When Phase 2 is complete, a user who selects Retail or Hospitality will
see correct classifications, allowances, and penalty calculations for that award — and Pharmacy
calculations must produce identical results to the current hardcoded implementation.

Awards in scope: MA000012 (Pharmacy), MA000003 (Retail), MA000009 (Hospitality).

</domain>

<decisions>
## Implementation Decisions

### penaltyConfig shape
- Flat threshold object (not time-window array): `{ earlyMorningThreshold, eveningThreshold,
  saturdayMultiplier, sundayMultiplier, phMultiplier, overtimeThresholdHours,
  overtimeFirstTierMultiplier, overtimeSecondTierMultiplier }`
- `calculatePayForTimePeriod` in helpers.js accepts penaltyConfig as a parameter; hardcoded
  `[0, 7*60, 19*60, 24*60]` boundaries are replaced by values from penaltyConfig
- `getPenaltyDescription` in App.js also accepts penaltyConfig so it can generate correct labels
  for non-Pharmacy awards (e.g., "Evening Shift (after 22:00)" for Retail)
- Overtime rules included in penaltyConfig (overtimeThresholdHours: 38, multipliers 1.5x/2.0x)
  to allow per-award variation, even if all 3 target awards share identical rules

### awardConfig.js — single source of truth
- New file: `src/config/awardConfig.js`
- Each entry is keyed by FWC award ID (MA000012, MA000003, MA000009) and contains:
  - `awardId` — matches the FWC API ID for future API mapping
  - `name` — human-readable award name
  - `penaltyConfig` — flat threshold object (see above)
  - `classifications` — array of `{ id, name }` objects for that award
  - `baseRates` — `{ fullTimePartTime: { [classificationId]: { base } }, casual: { ... } }`
  - `juniorPercentages` — `{ 'under-16': 0.45, ... }` (per award, even if identical for v1)
  - `allowances` — award-specific allowance amounts (e.g., homeMedicineReview, laundry, etc.)
- `pharmacyAwardRates` in App.js is replaced by the MA000012 entry in awardConfig.js
- `classifications` and `ageOptions` exports are removed from helpers.js — helpers.js becomes
  pure calculation logic only

### FWC API response — deferred mapping
- Phase 2 calculation uses static awardConfig.js, NOT awardRates state
- The FWC API data fetched by awardRatesService.js is not used by the calc engine in Phase 2
- Zod schema tightening (currently `z.object({}).passthrough()`) deferred to v2 when real API
  mapping work happens
- awardConfig.js includes `awardId` on each entry to prepare for future API-driven hydration

### Regression test strategy
- New dedicated file: `src/__tests__/pharmacyRegression.test.js`
- Comprehensive per-scenario suite with hardcoded expected values (captured from the current
  implementation before any refactoring begins):
  - Weekday ordinary rate (full-time and casual)
  - Weekday early morning (before 07:00, full-time and casual)
  - Weekday evening (after 19:00, full-time and casual)
  - Saturday (full-time and casual)
  - Sunday (full-time and casual)
  - Public holiday (full-time)
  - Junior rate application (Pharmacy Assistant Level 1, under-18)
  - Overtime (>38 hrs/week, first 2hrs at 1.5x, remainder at 2x)
- Also includes award-differentiation tests: a Retail Saturday shift with the same hours as a
  Pharmacy Saturday shift must produce a different pay total, proving penaltyConfig is actually
  consumed (not ignored)

### Claude's Discretion
- Exact shape of `ageOptions` in awardConfig.js (whether it's per-award or shared across all)
- Whether to export a `getAwardConfig(awardId)` helper function or just export the raw config map
- File location for awardConfig.js (src/config/ directory or src/ root)
- Whether to remove `pharmacyAwardRates` from App.js in a single PR or incrementally

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `calculatePayForTimePeriod` (helpers.js:97): Takes `(day, startTime, endTime, baseRate,
  employmentType, customRate, classification)` — Phase 2 adds `penaltyConfig` as a parameter.
  The penalty boundary array at line 137 is the primary target for parameterization.
- `getPenaltyRateDetails` (helpers.js:47): Inner function with hardcoded 07:00 and 19:00
  thresholds — must accept penaltyConfig to read `earlyMorningThreshold` and `eveningThreshold`.
- `pharmacyAwardRates` (App.js:37): The Pharmacy data structure (fullTimePartTime, casual,
  juniorPercentages, allowances) defines the target shape for awardConfig.js entries.
- `getPenaltyDescription` (App.js:11): Hardcodes 19:00 comparisons — must accept penaltyConfig.

### Established Patterns
- All state in App.js, passed as props to presentational components — Phase 2 adds
  `selectedAwardConfig` derived from `selectedAward` + `awardConfig.js` lookup, passed down.
- `calculatePay()` in App.js (line 232): Currently reads from `pharmacyAwardRates` directly —
  Phase 2 replaces these reads with `selectedAwardConfig.baseRates`, `selectedAwardConfig.penaltyConfig`, etc.
- TDD pattern from Phase 1: regression tests written RED (pre-refactor values captured) then
  refactoring makes them GREEN.

### Integration Points
- `EmployeeDetails` component receives `classification`, `setClassification`, etc. — Phase 2 must
  also pass `classifications` from `selectedAwardConfig.classifications` so the dropdown shows
  award-specific options (AWARD-02).
- `Allowances` component — Phase 2 must pass the allowances list from `selectedAwardConfig.allowances`
  so it renders per-award allowances (AWARD-03).
- `handleSelectAward` in App.js (line 195): Currently hardcodes `pharmacy-assistant-1` reset —
  Phase 2 resets to the first classification in `selectedAwardConfig.classifications[0].id`.

</code_context>

<specifics>
## Specific Ideas

- No specific references — open to standard approaches for awardConfig.js structure.

</specifics>

<deferred>
## Deferred Ideas

- Real FWC API → awardConfig.js mapping (reading from awardRates state) — v2 work
- Zod schema tightening in awardRatesService.js — v2 work
- ageOptions per-award differentiation (if awards have different junior age tiers) — v2 work

</deferred>

---

*Phase: 02-award-agnostic-calculation-engine*
*Context gathered: 2026-03-07*
