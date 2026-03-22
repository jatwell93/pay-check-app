# Milestones

## v1.1 API Integration & UX Redesign (Shipped: 2026-03-22)

**Phases completed:** 3 phases, 8 plans, 18 tasks

**Key accomplishments:**

- Netlify Function CORS proxy for FWC API with server-side API key isolation and 24 Wave 0 test stubs across 4 files
- calculatePay reads live award rates from proxy state with awardConfig.js fallback, and Calculate button disabled during fetch using isLoading prop
- Human verification APPROVED — proxy flow confirmed end-to-end; FWC API details confirmed and fixes committed in 9442fdd
- Tailwind CSS v3 installed via PostCSS pipeline, App.js shell converted to navy header/white layout with dismissible error banner and loading overlay spinner
- Three form components (AwardSelector, EmployeeDetails, Allowances) converted from BEM/legacy CSS to Tailwind utility classes with white card panels, standard input class strings, and blue focus rings
- WorkHours table with mobile horizontal scroll (D-06), OverviewBreakdown weekly summary row with status badges (D-12/D-13), and ImportantNotes stub replaced with real component wired into App.js
- Human-approved sign-off on Phase 02 Tailwind redesign: navy header, white card panels, green/red/yellow status badges, and mobile-responsive forms at 375px all verified correct with 89/89 tests passing.
- 3-attempt exponential backoff retry added to fetchAwardRates, clearCache() wired before manual refresh, and D-08 error wording locked — bringing test count from 89 to 93

---

## v1.0 Multi-Award Support (Shipped: 2026-03-08)

**Phases completed:** 3 phases, 8 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---
