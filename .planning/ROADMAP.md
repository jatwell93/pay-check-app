# Roadmap: Pay Check App Multi-Award Support

**Version:** 1.0
**Created:** 2026-03-07
**Granularity:** Coarse (3 phases)
**Core Value:** A worker can enter their shifts, see exactly how much they should have been paid and why, and know with confidence whether they have been underpaid.

---

## Phases

- [ ] **Phase 1: API Foundation & Award Selection** - Integrate FWC MAAPI v1 with caching and award selector component
- [x] **Phase 2: Award-Agnostic Calculation Engine** - Decouple calculation logic from hardcoded Pharmacy data, support multi-award penalty structures (completed 2026-03-08)
- [ ] **Phase 3: Multi-View UI & Pay Comparison** - Add week overview, drill-down, and pay discrepancy detection

---

## Phase Details

### Phase 1: API Foundation & Award Selection

**Goal:** Enable the app to fetch award rates from the FWC Modern Awards Pay Database API, cache them locally, and allow users to select from 2-4 key awards. Pharmacy rates remain available as fallback.

**Depends on:** Nothing (foundation phase)

**Requirements mapped:** API-01, API-02, API-03

**Success Criteria** (what must be TRUE when complete):
1. User can click an award selector dropdown and see at least 3 awards available (Pharmacy, Retail, Hospitality)
2. App fetches award rate data from FWC MAAPI v1 on first visit, displays rates from fetched data, not hardcoded values
3. If user refreshes the page or returns later, app uses locally cached rates without making a new API call
4. User can click a "Refresh Rates" button to manually fetch fresh data from the API
5. If API is unreachable, app falls back to last-cached rates with clear visual indicator (Pharmacy if no cache exists)

**Plans:** 1/2 plans executed

**Implementation notes:**
- awardRatesService.js with axios + axios-retry for HTTP client
- localStorage with versioned keys, expiry metadata, request deduplication
- Schema validation (zod or yup) for FWC API responses before processing
- AwardSelector component (static dropdown, no search yet)
- App.js state additions: selectedAward, awardRates, awardLoading, awardError
- Mock FWC responses for local testing; real integration in Phase 6
- Address pitfalls: API key exposure strategy (public tier vs backend proxy), cache collision in multi-tab scenarios

---

### Phase 2: Award-Agnostic Calculation Engine

**Goal:** Refactor the existing penalty calculation logic to work with award-specific penalty boundaries, casual loading rules, and allowance structures. Ensure Pharmacy Award calculations produce identical results to current hardcoded implementation (regression-proof). Enable support for Retail and Hospitality awards.

**Depends on:** Phase 1 (awardRates state and API service available)

**Requirements mapped:** AWARD-01, AWARD-02, AWARD-03, AWARD-04, REG-02, REG-03

**Success Criteria** (what must be TRUE when complete):
1. User selects an award → classification dropdown updates to show only classifications relevant to that award
2. User selects an award → allowances section dynamically displays allowances for that award (no hardcoded Pharmacy allowances)
3. App calculates pay using penalty boundaries from the selected award (Pharmacy 19:00 evening threshold, or Retail 22:00 if Retail selected), not fixed values
4. Pharmacy Award calculation produces identical pay results as current hardcoded implementation for identical shift inputs (regression test passes)
5. Junior rate percentages apply correctly for junior classifications (e.g., Pharmacy Assistant Level 1 at 70% for under-21, or Retail equivalent if applicable to award)
6. Casual loading is applied according to award rules (e.g., baked-in for Pharmacy casual rate, or separate if per-award rule differs)

**Plans:** 4/4 plans complete

Plans:
- [ ] 02-01-PLAN.md — Create awardConfig.js (3-award data) + pharmacyRegression.test.js RED baseline
- [ ] 02-02-PLAN.md — Parameterize calculatePayForTimePeriod in helpers.js, regression tests GREEN
- [ ] 02-03-PLAN.md — Wire App.js calculatePay() to awardConfig, remove pharmacyAwardRates
- [ ] 02-04-PLAN.md — Refactor EmployeeDetails + Allowances to accept award props, human-verify

**Implementation notes:**
- Parameterize calculatePayForTimePeriod(shifts, penaltyConfig) to accept award-specific penalty config
- Extract penalty boundaries (evening threshold time, Saturday %, Sunday %, public holiday %) from API response to penaltyConfig
- Refactor getPenaltyDescription() to accept penaltyConfig parameter (currently hardcoded to Pharmacy)
- Calculate base rates and allowances from awardRates state instead of pharmacyAwardRates object
- Map casual loading type per award (baked-in vs separate-loading) and apply correctly
- Overtime threshold (38 hrs) and multipliers (1.5x, 2x) passed as award properties if they vary
- EmployeeDetails component: accept classifications array from awardRates, validate selection against current award
- Allowances component: render allowances array from awardRates, enforce eligibility checks per classification
- Age options passed as prop (award-specific junior rate age tiers)
- Comprehensive regression test suite: run identical inputs for Pharmacy, verify output matches current hardcoded results
- Do NOT change calculation output for Pharmacy; only refactor how data flows to the calculation

---

### Phase 3: Multi-View UI & Pay Comparison

**Goal:** Provide users with week-level and day-level pay analysis, enable comparison of calculated pay against actual pay received, and detect underpayment. Ensure weekly and fortnightly pay cycles continue to work.

**Depends on:** Phase 2 (calculation engine refactored and award-agnostic)

**Requirements mapped:** PAY-01, PAY-02, PAY-03, PAY-04, REG-01

**Success Criteria** (what must be TRUE when complete):
1. After calculation, user sees a week overview showing each day with calculated pay, actual paid input field, discrepancy amount, and a green/red pass/fail indicator
2. User can enter the amount they were actually paid (for the pay period) in the overview, and the app immediately shows discrepancy: (calculated - actual)
3. Discrepancy output clearly displays whether user was underpaid, overpaid, or correctly paid using neutral factual format: "Calculated: $X.XX | Paid: $Y.YY | Difference: $Z.ZZ"
4. User can select a specific day from the week overview and drill down to see segment-level breakdown via accordion expansion
5. Fortnightly pay cycle selection (if enabled) continues to work as before; user can calculate for 14 days and compare total paid amount
6. Weekly pay cycle selection continues to work as before (7 days, same comparison flow)

**Plans:** 1/2 plans executed

Plans:
- [ ] 03-01-PLAN.md — TDD: OverviewBreakdown component (week table, status badges, accordion, discrepancy)
- [ ] 03-02-PLAN.md — Wire App.js (resolve merge conflict, add state, replace PaySummary), REG-01 tests, human-verify

**Implementation notes:**
- OverviewBreakdown replaces PaySummary as the main post-Calculate view — no separate mode toggle
- Table columns: Day | Hours | Calculated | Actual Paid (input) | Discrepancy | Status
- Accordion drill-down: clicking a day row expands segment breakdown inline; one day expanded at a time
- Segment table reuses same column structure as existing DetailedBreakdown (Time, Hours, Rate Type, Rate, Amount)
- App.js state additions: selectedDayIndex, actualPaidByDay, totalActualPaid
- Actual paid inputs clear on Calculate; preserved on award switch
- Pass/fail threshold: $0.01 (Fair Work rounding tolerance)
- Period summary format exactly: "Calculated: $X.XX | Paid: $Y.YY | Difference: $Z.ZZ"
- No changes to penalty calculation or award config from Phase 2
- App.js has an unresolved git merge conflict from a pre-planning failed merge — Plan 02 resolves it by keeping HEAD (Phase 2) version throughout

---

## Phase Progress

| Phase | Goal | Plans Complete | Status | Completed |
|-------|------|----------------|--------|-----------|
| 1 - API Foundation & Award Selection | FWC API + award selector | 2/2 | Complete | 2026-03-07 |
| 2 - Award-Agnostic Calculation Engine | 4/4 | Complete   | 2026-03-08 | — |
| 3 - Multi-View UI & Pay Comparison | 1/2 | In Progress|  | — |

---

## Coverage Summary

**Total v1 requirements:** 14
**Requirements mapped:** 14
**Unmapped (orphaned):** 0

**Coverage by category:**
- API Integration (3/3): API-01, API-02, API-03 → Phase 1
- Multi-Award Support (4/4): AWARD-01, AWARD-02, AWARD-03, AWARD-04 → Phase 2
- Pay Verification (4/4): PAY-01, PAY-02, PAY-03, PAY-04 → Phase 3
- Regression (3/3): REG-01 → Phase 3, REG-02, REG-03 → Phase 2

**Status:** ✓ 100% coverage, no gaps

---

## Dependencies

```
Phase 1 (API Foundation)
    ↓
Phase 2 (Award-Agnostic Calculation)
    ↓
Phase 3 (Multi-View UI & Pay Comparison)
```

Phase 1 provides awardRates state and API service layer.
Phase 2 consumes awardRates to refactor calculations; provides regression-safe foundation.
Phase 3 builds new UI modes on stable calculation engine.

---

*Roadmap created: 2026-03-07*
*Ready for planning: yes*
*Next step: /gsd:execute-phase 03*
