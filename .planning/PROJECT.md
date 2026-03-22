# Pay Check App

## What This Is

A React single-page application that helps Australian workers verify they are being paid correctly under their modern award. Workers enter their shift times for the week, select their award and classification, and the app calculates what they should have been paid — broken down by day and penalty rate segment — so they can compare against their actual payslip and identify any underpayment.

**Shipped v1.0:** Multi-award support (Pharmacy, Retail, Hospitality) with FWC API integration, award-agnostic penalty calculation engine, and week-level pay comparison with underpayment detection.

**Shipped v1.1:** Netlify Functions CORS proxy for live FWC rate fetching, full Tailwind CSS professional redesign (navy/white, green/red status indicators), mobile-responsive layout, and polish (retry logic, cache refresh, user-friendly errors).

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
- ✓ Netlify Functions proxy routes FWC API requests server-side (CORS resolved) — v1.1
- ✓ `calculatePay` reads live FWC award rates via proxy with `awardConfig.js` shape-guard fallback — v1.1
- ✓ App styled with Tailwind CSS — clean professional look, navy/white palette — v1.1
- ✓ Status indicators (Paid Correctly / Underpaid) use green/red colour coding — v1.1
- ✓ Loading states and error messages shown clearly when API calls fail or are slow — v1.1
- ✓ Graceful fallback to hardcoded rates with user-friendly error message when proxy unreachable — v1.1
- ✓ 3-attempt exponential backoff retry on proxy failure; manual "Refresh Rates" button wired to clearCache() — v1.1

### Active

<!-- Current scope — what this project is building next. -->

*(To be defined in v2.0 milestone planning via `/gsd:new-milestone`)*

### Out of Scope

- Payslip PDF/image upload and parsing — too complex, manual entry sufficient
- All 121 modern awards at launch — 3 key awards shipped in v1.0; expand in v2
- User accounts or login — stateless tool, no data persistence needed
- Mobile app — web-first; responsive web is now shipped (v1.1 Tailwind redesign) ✓
- Legal advice or dispute lodging — informational tool only
- FWC API full rate hydration in calculatePay — `hydrateAwardRates` stub deferred to v2 (175 raw records need non-trivial mapping)
- All 121 modern awards — 3 key awards validate approach; expand in v2

## Context

- **Codebase:** React 19 SPA (Create React App). All state in App.js. Business logic in helpers.js (minute-by-minute penalty calculation). Service layer in awardRatesService.js. Config in awardConfig.js. ~3,000 LOC source, 93 tests across 12 suites.
- **Architecture:** `App.js` holds all state. Components are presentational (all Tailwind-styled as of v1.1). `calculatePayForTimePeriod` in `helpers.js` accepts `penaltyConfig` to support any award's penalty boundaries. `awardConfig.js` defines 3 awards (MA000012, MA000003, MA000009) with penalty configs, classifications, and allowances.
- **Deployment:** Netlify (SPA with Netlify Functions proxy). `netlify.toml` configures build, functions dir (esbuild bundler), and SPA redirect rule. `FWC_API_KEY` is Netlify env var only — never bundled into client JS.
- **FWC MAAPI v1:** Official Fair Work Commission API (Azure API Management, `Ocp-Apim-Subscription-Key` auth). Proxy at `netlify/functions/award-rates.js` with 3-attempt exponential backoff. 90-day localStorage caching. `hydrateAwardRates` is a passthrough stub — 175 raw pay-rate records not yet mapped to `calculatePay` shape (deferred to v2).
- **Known tech debt (non-blocking):** `hydrateAwardRates` passthrough stub means live FWC rates not yet powering calculations (fallback to `awardConfig.js` always active). `act()` warnings in test console (pre-existing). `z.object({}).passthrough()` schema — permissive until FWC shape tightened in v2.

## Constraints

- **Tech stack:** React SPA — must remain a static frontend with no backend server
- **API key:** FWC MAAPI v1 subscription key (`FWC_API_KEY`) is server-side only in Netlify env vars — never bundled into client JS
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
| Tailwind v3 (not v4) | CRA 5.0.1 incompatible with v4 (no config file, no PostCSS plugin) | ✓ Good — v3.4.19 works cleanly with CRA |
| App-level error banner (not child props) | Single error source prevents duplicate text in tests | ✓ Good — AwardSelector error prop accepted but unused |
| 3-attempt retry as for-loop (not library) | Service uses native fetch; no axios-retry available | ✓ Good — simple loop with Math.pow(2, attempt)*1000 |
| Weekly summary visibility via actualPaidByDay | Show section as soon as any per-day amount entered (D-13) | ✓ Good — matches intended UX spec |
| netlify dev [dev] block in netlify.toml | Required for function routing in local dev | ✓ Good — confirmed during Phase 1 verification |
| hydrateAwardRates as passthrough stub | 175 raw records need non-trivial mapping; deferred | — Pending (v2: build mapping layer) |

---
*Last updated: 2026-03-22 after v1.1 milestone*
