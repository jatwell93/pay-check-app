# Pay Check App

## What This Is

A React single-page application that helps Australian workers verify they are being paid correctly under their modern award. Workers enter their shift times for the week, select their award and classification, and the app calculates what they should have been paid — broken down by day and penalty rate segment — so they can compare against their actual payslip and identify any underpayment.

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

### Active

<!-- Current scope — what this project is building. -->

- [ ] App fetches current award rates from FWC Modern Awards Pay Database API (fwc-maapi-v1) instead of hardcoded values
- [ ] User can select from 2–4 key modern awards (Pharmacy, Retail, Hospitality at minimum)
- [ ] Classifications and rates dynamically reflect the selected award from the API
- [ ] API responses are locally cached to avoid unnecessary polling (rates change annually)
- [ ] Full week/pay period overview mode shows total calculated vs total entered pay with a pass/fail indicator per day
- [ ] Day-level drill-down shows the segment breakdown for a specific day (ordinary vs penalty hours + dollar amounts)
- [ ] User can enter their actual paid amount to compare against the calculated amount
- [ ] Comparison output shows any discrepancy (e.g. "You may have been underpaid $23.33 on Monday")

### Out of Scope

- Payslip PDF/image upload and parsing — too complex for v1, manual entry sufficient
- All 121 modern awards at launch — focusing on 2-4 key awards to validate the approach
- User accounts or login — stateless tool, no data persistence needed
- Mobile app — web-first
- Legal advice or dispute lodging — informational tool only

## Context

- **Existing codebase**: React 19 SPA built with Create React App. All state in App.js. Business logic in helpers.js (minute-by-minute penalty calculation across segment boundaries). No backend, no routing.
- **FWC MAAPI v1**: Official Fair Work Commission Modern Awards Pay Database API. Exposes 70,000+ pay rates, penalties, allowances, junior/casual rates across 121 awards. Requires a free subscription key via developer.fwc.gov.au. Rates change at most annually (Annual Wage Review). Webhooks available for change notifications.
- **Current limitation**: All award rates are hardcoded in `pharmacyAwardRates` object in App.js, locked to the Pharmacy Industry Award (MA000012), effective July 1, 2024.
- **API recommendation**: Cache responses locally — rates have a low rate of change. The app's stateless SPA architecture suits localStorage or sessionStorage caching.

## Constraints

- **Tech stack**: React SPA — must remain a static frontend with no backend server
- **API key**: FWC MAAPI v1 requires a subscription key — must be handled client-side (public-facing tool, no secrets)
- **Backwards compatibility**: Weekly and fortnightly pay cycle support must be maintained
- **Penalty logic**: Existing minute-by-minute penalty calculation in helpers.js is correct — refactor to data-driven rather than replace

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use FWC MAAPI v1 for rates | Official source, covers all major awards, free tier available | — Pending |
| 2–4 awards at launch | Validate API integration with known awards before expanding | — Pending |
| LocalStorage caching for API responses | Rates rarely change, SPA has no backend, avoids rate limiting | — Pending |
| Keep existing penalty calculation engine | Logic is correct and tested, only rates need to become data-driven | — Pending |

---
*Last updated: 2026-03-07 after initialization*
