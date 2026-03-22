---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: API Integration & UX Redesign
current_phase: 3
status: unknown
last_updated: "2026-03-22T06:45:06.764Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 7
  completed_plans: 7
---

# STATE: Pay Check App

**Project:** Pay Check App — API Integration & UX Redesign
**Last Updated:** 2026-03-20
**Current Phase:** 3

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** A worker can enter their shifts, see exactly how much they should have been paid and why, and know with confidence whether they have been underpaid.
**Current focus:** Phase 03 — Polish

---

## Current Position

Phase: 02 (tailwind-css-redesign) — COMPLETE
Phase: 03 (polish) — NEXT

## Accumulated Context

### Decisions Made

1. **Netlify Functions for proxy** — Resolves CORS by forwarding requests server-side. Keeps SPA architecture; co-located with app. Free tier. Platform decided: Netlify.

2. **Live rate hydration in v1.1** — `calculatePay` reads from live FWC data (via proxy + cache) with `awardConfig.js` as fallback source. Pipeline is complete and human-verified.

3. **Full Tailwind redesign** — Install Tailwind CSS, redesign all components. Clean professional look: navy/white, green/red status indicators for paid/underpaid states.

4. **FWC CORS root cause confirmed** — `api.fwc.gov.au` returns 200 but omits `Access-Control-Allow-Origin` header. Resolved via Netlify Functions proxy.

5. **FWC API base URL confirmed as /api/v1** — Official FWC MAPD API docs confirm `https://api.fwc.gov.au/api/v1`. Endpoint: `/awards/{award_fixed_id}/pay-rates`. award_fixed_id=12 for MA000012.

6. **FWC auth via Ocp-Apim-Subscription-Key** — Azure API Management gateway pattern. API key passed as `Ocp-Apim-Subscription-Key` header (not `Authorization: Bearer`).

7. **hydrateAwardRates is a passthrough stub** — 175 raw FWC pay-rate records need non-trivial mapping to `penaltyConfig + classifications + allowances`. Deferred to a future phase. Shape guard in `calculatePay` ensures safe fallback to `getAwardConfig()` until then.

- [Phase 01-netlify-proxy-live-rate-hydration]: FWC_API_KEY has no REACT_APP_ prefix — server-side only, prevents CRA bundling key into client JS
- [Phase 01-netlify-proxy-live-rate-hydration]: Wave 0 stubs use test.todo() — test contracts defined before implementation to prevent blockers
- [Phase 01-netlify-proxy-live-rate-hydration]: calculatePay falls back to getAwardConfig when awardRates[selectedAward] is falsy or lacks .baseRates — ensures no breakage if proxy is down or data shape is wrong
- [Phase 01-netlify-proxy-live-rate-hydration]: App.test.js weekly pay cycle uses empty rates map so calculatePay exercises getAwardConfig fallback, avoiding coupling to mock data shape
- [Phase 01-netlify-proxy-live-rate-hydration]: netlify dev auto-adds .netlify/ to .gitignore — committed as standard chore in Plan 03 Task 1
- [Phase 01-netlify-proxy-live-rate-hydration]: .env added to .gitignore — prevents accidental FWC API key exposure
- [Phase 02-tailwind-css-redesign]: Install tailwindcss@3 (not v4) — npm resolves v4 by default; v4 incompatible with CRA 5.0.1 (no config file, no PostCSS plugin pattern)
- [Phase 02-tailwind-css-redesign]: Pass error={null} to AwardSelector — App.js banner is primary error UI (D-09/D-10); prevents duplicate error text causing findByText test failures
- [Phase 02]: AwardSelector error prop accepted but not rendered (D-09) — App.js banner is primary error display layer, prevents duplicate error text in child components
- [Phase 02-tailwind-css-redesign]: Weekly summary visibility gated on actualPaidByDay.some() not totalActualPaid — matches D-13 spec
- [Phase 02-tailwind-css-redesign]: ImportantNotes.js component accepts awardName and overtimeThresholdHours props — decouples notes from App.js
- [Phase 02-tailwind-css-redesign]: Phase 02 visual verification performed manually — automated tests confirm logic correctness but visual/responsive fidelity requires human sign-off

### Known Issues

- hydrateAwardRates is a passthrough stub — live FWC rates flow through proxy but are not yet mapped to calculatePay's expected shape; app uses hardcoded fallback until mapping is built

### Phase 01 Complete

All Phase 01 success criteria human-verified and approved (2026-03-20):

- CORS resolved via Netlify Functions proxy
- calculatePay reads live rates with shape guard fallback to hardcoded config
- Error banner visible when proxy unavailable
- Calculate button disabled during fetch; enabled after rates resolve
- All tests pass (0 failures)

### Phase 02 Complete

All Phase 02 success criteria human-verified and approved (2026-03-22):

- All components redesigned with Tailwind CSS (no raw browser-default styles)
- Navy header (slate-900), white content card panels
- Green/red/yellow status badges in OverviewBreakdown
- Forms usable on mobile at 375px; WorkHours table scrolls horizontally
- Weekly summary row hidden until actual-paid data entered (D-13)
- All 89 tests pass (0 failures)

---

*State file created: 2026-03-09*
*Updated: 2026-03-22 — Phase 02 complete, ready for Phase 03*
*Maintained by: /gsd:new-milestone orchestrator*
