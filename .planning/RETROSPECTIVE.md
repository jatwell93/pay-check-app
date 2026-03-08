# Retrospective: Pay Check App

Living retrospective — updated at each milestone completion.

---

## Milestone: v1.0 — Multi-Award Support

**Shipped:** 2026-03-09
**Phases:** 3 | **Plans:** 8 | **Tests:** 61

### What Was Built

- FWC MAAPI v1 service layer with 90-day localStorage cache, Zod validation, axios-retry (Phase 1)
- `AwardSelector` component with cache-first App.js initialization (Phase 1)
- `awardConfig.js` defining Pharmacy, Retail, and Hospitality awards with full penalty configs (Phase 2)
- `calculatePayForTimePeriod` parameterized with `penaltyConfig` — penalty rules now data-driven (Phase 2)
- App.js wired to `getAwardConfig()`; hardcoded `pharmacyAwardRates` removed; 10 pharmacy regression tests GREEN (Phase 2)
- `EmployeeDetails` + `Allowances` refactored to accept award data as props (Phase 2)
- `OverviewBreakdown` component: week table, pass/fail badges, accordion drill-down, discrepancy display (Phase 3)
- Weekly/fortnightly cycle regression verified; all 61 tests GREEN (Phase 3)

### What Worked

- **TDD discipline:** RED → GREEN → SUMMARY order was never skipped. Caught real bugs (clearCache mock, jest hoisting) before they could become hidden failures.
- **Parameterization over replacement:** Extending `calculatePayForTimePeriod` with a `penaltyConfig` arg (rather than rewriting) preserved all existing logic and made the regression test trivially easy to write.
- **`awardConfig.js` as single source of truth:** Separating config from both the API layer and App.js made it easy to reason about, test, and extend.
- **Phase-level SUMMARY discipline:** Having per-plan summaries made the audit and retrospective easy — no reconstruction required.

### What Was Inefficient

- **App.test.js `act()` warnings:** Pre-existing from async useEffect in Phase 1 — never fully resolved. Informational but noisy. Could have been addressed in Phase 1 with `waitFor` wrappers.
- **Merge conflict in App.js (Phase 3):** A pre-planning failed merge attempt left a conflict marker. Phase 3 Plan 02 had to explicitly resolve it — minor overhead that a clean branch would have avoided.
- **Stale TODO comment:** A `TODO Phase 2` comment in awardRatesService.js survived all 3 phases and required a dedicated quick task to clean up. Better to clean inline during each phase.

### Patterns Established

- **`penaltyConfig` object:** `{ eveningStartMin, saturdayMultiplier, sundayMultiplier, phMultiplier }` — all award-specific penalty behavior flows through this shape.
- **`__mockInstance` pattern for jest.mock factories:** Avoids babel-jest hoisting issues with `const` declarations inside mock factories.
- **`localStorage.key(i)/length` loop for jsdom mocks:** `Object.keys(localStorage)` bypasses spy chains in jsdom; `key(i)/length` loop routes through the mock correctly.
- **`actualPaidByDay` empty string = no input (not zero):** Prevents false Underpaid on untouched input rows.

### Key Lessons

1. Parameterize existing business logic rather than rewriting it — the penalty engine was correct and the parameterization was low-risk.
2. Keep TODO comments phase-scoped — if a TODO references a phase that's now complete, clean it in the same PR.
3. The FWC API shape remains unconfirmed — `z.object({}).passthrough()` is the right call until real API responses are available. Don't tighten prematurely.
4. Phase verification (VERIFICATION.md + 61 tests) provides genuine confidence — the audit found zero gaps, which matched expectations.

### Cost Observations

- Sessions: ~4 (project setup, Phase 1, Phase 2, Phase 3 + audit + cleanup)
- Model: claude-sonnet-4-6 throughout
- Notable: GSD executor agents handled all TDD work autonomously; human checkpoints were the main interactive touchpoints.

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tests | Timeline | Gaps at Audit |
|-----------|--------|-------|-------|----------|---------------|
| v1.0 Multi-Award Support | 3 | 8 | 61 | 3 days | 0 (tech_debt status) |

---

*Retrospective started: 2026-03-09*
