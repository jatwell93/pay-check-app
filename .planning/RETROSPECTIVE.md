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

## Milestone: v1.1 — API Integration & UX Redesign

**Shipped:** 2026-03-22
**Phases:** 3 | **Plans:** 8 | **Tests:** 93 (from 61 at v1.0 start)

### What Was Built

- Netlify Function proxy (`netlify/functions/award-rates.js`) — server-side FWC API calls, `FWC_API_KEY` never in client bundle (Phase 1)
- `calculatePay` now resolves award config from `awardRates[selectedAward]` with `getAwardConfig()` shape-guard fallback — live rates where available, hardcoded where not (Phase 1)
- FWC API confirmed end-to-end: base URL `/api/v1`, `Ocp-Apim-Subscription-Key` auth, `award_fixed_id=12` for MA000012, 175 pay-rate records (Phase 1)
- Tailwind CSS v3 installed via PostCSS pipeline; App.js shell: navy header, dismissible error banner, loading overlay (Phase 2)
- AwardSelector, EmployeeDetails, Allowances converted from BEM/legacy CSS to Tailwind utility classes with white card panels (Phase 2)
- WorkHours mobile-responsive table (overflow-x-auto + min-w-[500px]), OverviewBreakdown weekly summary row with status badges (D-12/D-13), ImportantNotes real component (Phase 2)
- 3-attempt exponential backoff retry in `fetchAwardRates`, `clearCache()` wired before manual refresh, D-08 error wording locked (Phase 3)

### What Worked

- **Wave-based parallel execution:** Plans 02-02 and 02-03 ran concurrently — saved real time on the largest phase (4 plans). Minor merge conflict resolved cleanly.
- **Human checkpoint pattern:** Plan 01-03 (proxy verification) and 02-04 (visual sign-off) were the right call — automated tests couldn't confirm FWC API auth details or visual fidelity.
- **Shape guard before hydration:** Adding `?.baseRates` check in calculatePay before building the hydration layer was exactly right. The app never broke while the stub remained.
- **TDD on retry logic:** Writing failing tests first caught the Jest 27 `runAllTimersAsync` incompatibility immediately — would have been a silent failure if tests were written after.
- **D-09 centralized error pattern:** Centralizing error display in App.js banner and passing `error={null}` to children eliminated a whole class of duplicate-text test failures.

### What Was Inefficient

- **Tailwind v4 install:** npm defaulted to v4 which is incompatible with CRA 5; downgrade required. Could have pinned v3 in the install command from the start (the plan said v3).
- **FWC API auth headers:** The proxy was initially built with the wrong auth header (`Authorization: Bearer` vs `Ocp-Apim-Subscription-Key`). Plan 01-03 verification caught it but it added a fix cycle. A 5-minute docs check before writing the proxy would have avoided this.
- **02-03 SUMMARY.md not quite complete at merge:** Status showed M (modified) in git status at start of this session. Minor trailing state left from phase execution.

### Patterns Established

- **Netlify proxy pattern:** `exports.handler` async function, `Ocp-Apim-Subscription-Key` header, 10s `AbortController` timeout, esbuild bundler in `netlify.toml`.
- **State-first config resolution:** `(awardRates && awardRates[award]?.baseRates) ? liveConfig : getAwardConfig(award)` — live when ready, hardcoded when not.
- **Jest 27 setTimeout spy for retry tests:** `jest.spyOn(global, 'setTimeout').mockImplementation((fn, ms) => { if (ms < 15000) fn(); })` — bypasses backoff delays while leaving AbortController timer real.
- **App-level error banner:** Child components accept `error` prop for API compatibility but don't render it; App.js banner is the single error display layer.

### Key Lessons

1. Always confirm external API auth headers from official docs before writing the proxy — costs 5 minutes upfront vs a full fix cycle during verification.
2. Pin version numbers explicitly in install commands when the plan specifies a version (e.g., `tailwindcss@3`, not `tailwindcss`).
3. The Wave 0 stub pattern (24 todo tests before any implementation) was effective — it kept the test scaffolding organized across parallel plans.
4. `hydrateAwardRates` as a passthrough stub was the right call — 175 raw records are genuinely non-trivial to map. Don't rush the hydration layer.

### Cost Observations

- Sessions: ~6 (v1.1 planning, Phase 1, Phase 2 setup, Phase 2 execution, Phase 3, milestone completion)
- Model: claude-sonnet-4-6 throughout
- Notable: GSD executor agents ran Phase 2 plans in parallel (02-02 + 02-03 concurrent); human visual sign-off was the main interactive gate.

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tests | Timeline | Gaps at Audit |
|-----------|--------|-------|-------|----------|---------------|
| v1.0 Multi-Award Support | 3 | 8 | 61 | 3 days | 0 (tech_debt status) |
| v1.1 API Integration & UX Redesign | 3 | 8 | 93 | 9 days | none (no audit run) |

---

*Retrospective started: 2026-03-09*
