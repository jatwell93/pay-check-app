---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Multi-Award Support
current_phase: 03
status: milestone_complete
last_updated: "2026-03-09T00:00:00.000Z"
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
---

# STATE: Pay Check App

**Project:** Pay Check App — Multi-Award Support Initiative
**Last Updated:** 2026-03-09
**Current Phase:** v1.0 SHIPPED — next milestone TBD

---

## Project Reference

**Core Value:** A worker can enter their shifts, see exactly how much they should have been paid and why, and know with confidence whether they have been underpaid.

**Tech Stack:** React 19 (Create React App), axios, localStorage, zod/yup for validation

**Architecture:** Single-page React app (no backend server). All state in App.js. Components are presentational (receive props/callbacks). New service layer: awardRatesService.js for FWC API integration and caching.

**Key Asset:** Existing minute-accurate penalty calculation engine in helpers.js (calculatePayForTimePeriod). Must be preserved and parameterized, not replaced.

---

## Current Position

| Aspect | Status | Details |
|--------|--------|---------|
| **Milestone** | Phase 2 Complete | 3-phase plan, Phase 1 and 2 all plans done — 4/4 summaries created for Phase 2 |
| **Phase** | Phase 2: All 4 Plans Complete | awardConfig.js, parameterized helpers.js, App.js wired, EmployeeDetails/Allowances award-agnostic — human-verified |
| **Progress** | 9/14 requirements complete | API-01–03, AWARD-01–04, REG-02, REG-03 satisfied; Phase 3 unblocked |
| **Blocker** | None | Ready to start Phase 3 (Multi-View UI & Pay Comparison) |

---

## Roadmap Summary

**3 Phases (Coarse Granularity)**

1. **Phase 1: API Foundation & Award Selection** (API-01, API-02, API-03)
   - Integrate FWC MAAPI v1, implement localStorage caching, build AwardSelector component
   - Fallback to Pharmacy rates if API fails
   - Status: Complete (Plan 01: awardRatesService, Plan 02: AwardSelector — both done)

2. **Phase 2: Award-Agnostic Calculation Engine** (AWARD-01–04, REG-02, REG-03)
   - Refactor calculatePayForTimePeriod, getPenaltyDescription to accept penaltyConfig
   - Extract penalty boundaries to API data
   - Ensure Pharmacy regression test passes
   - Status: Depends on Phase 1

3. **Phase 3: Multi-View UI & Pay Comparison** (PAY-01–04, REG-01)
   - ModeToggle, OverviewBreakdown, DrillDownBreakdown, ComparisonView components
   - Week overview with pass/fail per day, drill-down to segment breakdown
   - Actual amount input and discrepancy detection
   - Validate weekly/fortnightly cycles
   - Status: Depends on Phase 2

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Requirements mapped | 14/14 | 14/14 ✓ |
| Phase dependencies | Acyclic chain | 1 → 2 → 3 ✓ |
| API key exposure risk | Mitigated | Research noted, Phase 1 must decide (public tier vs backend proxy) |
| Pharmacy regression | Identical results | Phase 2 deliverable (must not change existing Pharmacy calculation) |
| Caching strategy | Versioned, with expiry | Implemented: award_rates_v1_{awardId}, 90-day TTL |
| Phase 02-award-agnostic-calculation-engine P01 | 8 | 2 tasks | 2 files |
| Phase 02-award-agnostic-calculation-engine P02 | 18min | 1 tasks | 1 files |
| Phase 02-award-agnostic-calculation-engine P03 | 15min | 1 tasks | 1 files |
| Phase 02-award-agnostic-calculation-engine P04 | 11min | 3 tasks | 6 files |
| Phase 03-multi-view-ui-and-pay-comparison P01 | 153 | 2 tasks | 2 files |
| Phase 03-multi-view-ui-and-pay-comparison P02 | 20min+human-verify | 2 tasks | 2 files |

### Execution Metrics

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01-api-foundation-award-selection P01 | 715s | 2 | 3 |
| Phase 01-api-foundation-award-selection P02 | ~25min | 2 | 4 |

---

## Accumulated Context

### Decisions Made

1. **3-phase structure (coarse granularity)** — Compress research recommendations (1-6 phases) to essential dependencies only:
   - Phase 1: API layer (must come first)
   - Phase 2: Calculation refactoring (unblocks multi-award support)
   - Phase 3: UI and new features (built on stable engine)

2. **Regression requirements (REG-01–03) distributed strategically:**
   - REG-02, REG-03 (Pharmacy calculation equivalence, junior rates) → Phase 2 (core refactoring)
   - REG-01 (weekly/fortnightly cycles) → Phase 3 (validates UI layer supports it)

3. **API key exposure deferred to Phase 1 implementation:**
   - Research identified two paths: public tier (embed in code with caching) or backend proxy (Node.js)
   - Roadmap does not prescribe which; Phase 1 planning must research FWC authentication and decide

4. **Mock FWC responses for Phase 1 testing:**
   - Phase 1 develops service layer with mocked award rates
   - Real FWC integration deferred (no Phase 6 in coarse roadmap; could be v2 or inline Phase 3)

5. **__mockInstance pattern for jest.mock factories (Phase 1 Plan 01):**
   - Expose mock instance as named property on jest.mock return object to avoid babel-jest hoisting issues with const variables

6. **clearCache() uses localStorage.key(i)/length loop:**
   - Object.keys(localStorage) bypasses Storage prototype spies in jsdom; key(i) + length respects mock chain

7. **Zod schema is z.object({}).passthrough() (Phase 1 Plan 01):**
   - Permissive until Phase 2 confirms real FWC API response shape; tighten in Phase 2

8. **AwardSelector is purely presentational (Phase 1 Plan 02):**
   - All loading/error/success/timestamp state lives in App.js, flows down as props — keeps component testable in isolation

9. **Award switch resets classification to pharmacy-assistant-1 (Phase 1 Plan 02):**
   - Hardcoded for Phase 1; Phase 2 will make classification lists award-aware

10. **weeklyData preserved on award switch (Phase 1 Plan 02):**
    - Only classification and results are cleared on award switch — shift hours are intentionally preserved per CONTEXT.md spec
- [Phase 02]: awardConfig.js is self-contained (no imports from helpers.js or App.js) — prevents circular dependencies when Plan 02 makes helpers.js import from awardConfig
- [Phase 02]: Differentiation test uses identical base rate for both Pharmacy and Retail calls — ensures test is RED because penaltyConfig is ignored, not because of different base rates
- [Phase 02]: Dynamic description strings in getPenaltyRateDetails use Math.round(multiplier*100) to ensure displayed percentages always match actual config values for any award
- [Phase 02]: getPenaltyRateDetails receives penaltyConfig as explicit 5th arg (not closure) keeping it pure and independently testable
- [Phase 02]: pharmacyAwardRates constant in App.js removed entirely — awardConfig.js is now the single source of truth for all award data
- [Phase 02]: calculatePayForTimePeriod call bug fixed: was passing getPenaltyDescription as 7th arg (classification position); corrected to pass classification as 7th and penaltyConfig as 8th
- [Phase 02]: currentAwardConfig computed before JSX return (separate from selectedAwardConfig inside calculatePay) for render-time access without calling getAwardConfig inside JSX expressions
- [Phase 02-award-agnostic-calculation-engine]: pharmacistIds hardcoded in Allowances.js — homeMedicineReview eligibility check uses hardcoded pharmacist IDs since this allowance is only rendered under Pharmacy award (config guards it at the conditional level)
- [Phase 02-award-agnostic-calculation-engine]: allowanceConfig uses != null not falsy check — allows zero-value allowances to still render if explicitly configured
- [Phase 03]: Inline segment table (not importing DetailedBreakdown) to avoid prop shape coupling and keep OverviewBreakdown self-contained
- [Phase 03]: actualPaidByDay empty string treated as no-input (hint text) not zero — prevents false Underpaid on untouched rows
- [Phase 03]: actualPaidByDay reset uses dailyBreakdown.map(() => '') local variable in calculatePay — guarantees correct array length on same render cycle
- [Phase 03]: cycleLength derived from results.dailyBreakdown.length at render time — automatically correct for any cycle length without additional state

### Critical Path

```
Phase 1: awardRatesService.js + AwardSelector
    ↓
Phase 2: Parameterized calculatePayForTimePeriod + componentRefactoring
    ↓
Phase 3: ModeToggle + OverviewBreakdown + ComparisonView
```

Each phase unblocks the next. No parallel work possible.

### Known Pitfalls (from Research)

1. **API Key Exposure** — If FWC requires secret key, SPA cannot hide it. Decision needed: use public tier with aggressive caching, or build backend proxy.
2. **Award Penalty Variance** — Pharmacy (19:00 threshold), Retail (22:00?), Hospitality (21:00?) differ. Must extract to data-driven penaltyConfig, not hardcode.
3. **Casual Loading Variance** — Different awards apply casual loading differently (baked-in vs separate). Must map per-award rules.
4. **Cache Collision** — Multi-tab scenarios + same localStorage key = stale data. Solution: versioned keys, deduplication.
5. **FWC Schema Mismatch** — API may return unexpected structure. Solution: zod/yup validation.

**Phase 1 implementation must address pitfalls 1, 4, 5 upfront. Phases 2 and 3 handle 2 and 3.**

### TODOs

- [ ] Phase 1 planning: FWC MAAPI v1 authentication verification (public tier available?)
- [ ] Phase 1 planning: Fetch real FWC API responses for MA000012, MA000003, MA000010 to validate schema
- [ ] Phase 1 planning: Design awardRatesService.js and caching layer
- [ ] Phase 1 planning: Define mock FWC responses for local testing
- [ ] Phase 2 planning: Extract penalty boundary values from API schema
- [ ] Phase 2 planning: Write Pharmacy regression test suite
- [ ] Phase 3 planning: Define pass/fail threshold (currently $0.01; confirm with Fair Work)

### Blockers

None currently. Phase 1 complete. Ready to start Phase 2 (Award-Agnostic Calculation Engine).

---

## Session Continuity

**Session 0 (2026-03-07):** Roadmap creation
- Read PROJECT.md, REQUIREMENTS.md, research/SUMMARY.md, config.json
- Identified 14 v1 requirements across 4 categories
- Created 3-phase structure with goal-backward success criteria
- Validated 100% requirement coverage
- Wrote ROADMAP.md, STATE.md, updated REQUIREMENTS.md traceability
- Ready for Phase 1 planning

**Session 1 (2026-03-07):** Phase 1 Plan 01 execution — awardRatesService
- Installed axios ^1.13.6, axios-retry ^4.5.0, zod ^4.3.6
- Created src/services/awardRatesService.js with 4 exports (TDD GREEN)
- Created src/services/awardRatesService.test.js with 11 tests (TDD RED→GREEN)
- Created .env.example documenting REACT_APP_FWC_API_KEY
- All 11 tests passing; API-01, API-02, API-03 requirements complete
- Stopped at: 01-api-foundation-award-selection/01-01-PLAN.md complete

**Session 2 (2026-03-07):** Phase 1 Plan 02 execution — AwardSelector component
- Created src/components/AwardSelector.js (presentational, TDD GREEN — 13 tests)
- Created src/components/AwardSelector.test.js (13 unit tests, TDD RED→GREEN)
- Updated src/App.js: 6 new state vars, useEffect cache-first init, handleRefreshRates, handleSelectAward, AwardSelector rendered
- Updated src/App.test.js: replaced CRA boilerplate with 6 integration tests
- Total: 30 tests passing across all layers (AwardSelector 13 + awardRatesService 11 + App 6)
- Human-verify checkpoint approved: award selector UI confirmed working
- Stopped at: 01-api-foundation-award-selection/01-02-PLAN.md complete — Phase 1 done

---

---

## Quick Tasks Completed

| # | Description | Commit | Date |
|---|-------------|--------|------|
| 1 | Clean up v1.0 tech debt — remove stale TODO, document clearCache reserved status | a50ad2b | 2026-03-09 |

---

*State file created: 2026-03-07*
*Maintained by: /gsd:roadmap orchestrator*
