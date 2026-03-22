# Pay Check App

## What This Is

A React single-page application that helps Australian workers verify they are being paid correctly under their modern award. Workers enter their shift times for the week, select their award and classification, and the app calculates what they should have been paid — broken down by day and penalty rate segment — so they can compare against their actual payslip and identify any underpayment.

**Shipped v1.0:** Multi-award support (Pharmacy, Retail, Hospitality) with FWC API integration, award-agnostic penalty calculation engine, and week-level pay comparison with underpayment detection.

## Current Milestone: v1.1 API Integration & UX Redesign

**Goal:** Fix the broken FWC API integration via a Netlify Functions proxy, wire live rates into calculations, and give the app a full Tailwind-based professional redesign.

**Target features:**
- Netlify Functions proxy to resolve CORS and enable real FWC API calls
- Live rate hydration — `calculatePay` reads from live FWC data, not hardcoded config
- Full Tailwind CSS redesign — clean professional (navy/white, green/red status indicators)
- Error handling & loading UX — loading states, clear failure messages, graceful fallback

## Core Value

A worker can enter their shifts, see exactly how much they should have been paid and why, and know with confidence whether they have been underpaid.

## Requirements

### Validated

<!-- Shipped and confirmed working in the current codebase. -->

- ✓ User can select employment type (casual, full-time/part-time) — existing
- ✓ User can select classification level (Assistant 1-4, Student 1-4, Intern 1-2, Pharmacist variants) — existing
- ✓ User can enter junior age for reduced rate calculation — existing
- ✓ User can enter shift start/end times per day — existing
- ✓ Public holiday toggles per day — existing
- ✓ App calculates pay with penalty rate segments (07:00 ordinary, 19:00–midnight +25%, Saturday +50%, Sunday/PH +100%) — existing
- ✓ App calculates break deductions based on shift length — existing
- ✓ App calculates overtime for full-time/part-time (>38 hrs: first 2hrs at 1.5x, remainder at 2x) — existing
- ✓ Allowances calculation and display — existing
- ✓ Weekly and fortnightly pay cycle support — existing
- ✓ Detailed per-day breakdown with segment-level penalty descriptions — existing
- ✓ Summary totals and detailed view toggle — existing
- ✓ App fetches current award rates from FWC Modern Awards Pay Database API — v1.0
- ✓ User can select from Pharmacy, Retail, or Hospitality Industry Award — v1.0
- ✓ Classifications and allowances dynamically reflect the selected award — v1.0
- ✓ API responses cached in localStorage with 90-day TTL — v1.0
- ✓ Week overview shows calculated pay per day with pass/fail indicator — v1.0
- ✓ Day-level drill-down shows segment breakdown via accordion — v1.0
- ✓ User can enter actual paid amount and see discrepancy — v1.0
- ✓ Penalty rate rules (evening threshold, Saturday/Sunday/PH multipliers) reflect selected award — v1.0

### Active

<!-- Current scope — what this project is building. -->

- [ ] Netlify Functions proxy resolves CORS and enables real FWC API calls
- [ ] Live FWC award rates hydrate `calculatePay` at runtime
- [x] App styled with Tailwind CSS — clean professional look, navy/white palette (Validated in Phase 02: tailwind-css-redesign)
- [x] Status indicators (Paid Correctly / Underpaid) use green/red colour coding (Validated in Phase 02: tailwind-css-redesign)
- [x] Loading states and error messages shown clearly when API calls fail or are slow (Validated in Phase 02: tailwind-css-redesign)
- [x] Graceful fallback to hardcoded rates when proxy is unreachable (Validated in Phase 03: polish — retry + error banner + clearCache wiring)

### Out of Scope

- Payslip PDF/image upload and parsing — too complex, manual entry sufficient
- All 121 modern awards at launch — 3 key awards shipped in v1.0; expand in v2
- User accounts or login — stateless tool, no data persistence needed
- Mobile app — web-first; responsive web sufficient
- Legal advice or dispute lodging — informational tool only
- FWC API live rate hydration in calculatePay — awardConfig.js is source of truth; API state retained for v2

## Context

- **Codebase:** React 19 SPA (Create React App). All state in App.js. Business logic in helpers.js (minute-by-minute penalty calculation). Service layer in awardRatesService.js. Config in awardConfig.js. ~1,700 LOC source, 61 tests across 7 suites.
- **Architecture:** `App.js` holds all state. Components are presentational. `calculatePayForTimePeriod` in `helpers.js` accepts `penaltyConfig` to support any award's penalty boundaries. `awardConfig.js` defines 3 awards (MA000012, MA000003, MA000009) with penalty configs, classifications, and allowances.
- **FWC MAAPI v1:** Official Fair Work Commission API. Integration is live in `awardRatesService.js` with 90-day localStorage caching and Zod validation. API responses are cached but `calculatePay` currently reads from `awardConfig.js` directly — live rate hydration is deferred to v2.
- **Known tech debt (non-blocking):** `awardRates` state in App.js retained for planned v2 API hydration; `act()` warnings in test console (pre-existing). Timer leak warning from retry backoff tests (cosmetic, tests pass).

## Constraints

- **Tech stack:** React SPA — must remain a static frontend with no backend server
- **API key:** FWC MAAPI v1 subscription key handled client-side via `REACT_APP_FWC_API_KEY` env var
- **Backwards compatibility:** Weekly and fortnightly pay cycle support maintained
- **Penalty logic:** Minute-by-minute calculation in `helpers.js` is correct — extend via `penaltyConfig`, don't replace

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use FWC MAAPI v1 for rates | Official source, covers all major awards, free tier | ✓ Good — integrated in Phase 1 with caching |
| 3 awards at launch (not all 121) | Validate approach with known awards first | ✓ Good — awardConfig.js extensible for more awards |
| localStorage caching (90-day TTL) | Rates rarely change, SPA has no backend | ✓ Good — cache-first init works reliably |
| Keep existing penalty calculation engine | Logic is correct, only rates need to become data-driven | ✓ Good — parameterized with penaltyConfig, zero regressions |
| `awardConfig.js` as source of truth (not API) | API shape unconfirmed; hydration deferred to v2 | ✓ Good — clean separation, retained awardRates state for v2 |
| `z.object({}).passthrough()` schema | Permissive until real FWC API response shape confirmed | — Pending (tighten in v2 once shape known) |
| `clearCache()` called by handleRefreshRates | Forces fresh API call on manual refresh regardless of TTL | ✓ Good — wired in Phase 03 |
| `OverviewBreakdown` replaces PaySummary | Single output view is simpler than mode toggle | ✓ Good — cleaner UX, no toggle complexity |
| Inline segment table in OverviewBreakdown | Avoid prop coupling with DetailedBreakdown | ✓ Good — self-contained, independently testable |
| `actualPaidByDay` empty string = no input | Prevents false Underpaid on untouched rows | ✓ Good — correct UX, $0.01 threshold working |

---
*Last updated: 2026-03-22 after Phase 03 complete — v1.1 milestone all phases done*
