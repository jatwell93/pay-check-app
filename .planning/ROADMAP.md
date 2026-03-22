# Roadmap: Pay Check App

## Milestones

- ✅ **v1.0 Multi-Award Support** — Phases 1-3 (shipped 2026-03-09)
- 🔄 **v1.1 API Integration & UX Redesign** — Phases 1-3 (in progress)

---

## v1.0 (Archived)

<details>
<summary>✅ v1.0 Multi-Award Support (Phases 1-3) — SHIPPED 2026-03-09</summary>

- [x] Phase 1: API Foundation & Award Selection (2/2 plans) — completed 2026-03-07
- [x] Phase 2: Award-Agnostic Calculation Engine (4/4 plans) — completed 2026-03-08
- [x] Phase 3: Multi-View UI & Pay Comparison (2/2 plans) — completed 2026-03-08

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

---

## v1.1: API Integration & UX Redesign

**Core Value:** A worker can enter their shifts, see exactly how much they should have been paid and why, and know with confidence whether they have been underpaid.

**Milestone Goal:** Fix the broken FWC API integration via a Netlify Functions proxy, wire live rates into calculations, and give the app a full Tailwind-based professional redesign.

### Phases

- [x] **Phase 1: Netlify Proxy & Live Rate Hydration** — Route FWC API calls through a Netlify Function to bypass CORS, wire live rates into calculatePay, implement fallback and loading/error states (completed 2026-03-13)
- [x] **Phase 2: Tailwind CSS Redesign** — Full Tailwind CSS redesign of all components with navy/white theme and green/red status indicators (completed 2026-03-22)
- [x] **Phase 3: Polish** — Cache refresh indicator, wire clearCache() to UI, retry logic, user-friendly error messages (completed 2026-03-22)

---

## Phase Details

### Phase 1: Netlify Proxy & Live Rate Hydration

**Goal:** Eliminate the CORS error that blocks FWC API calls by creating a Netlify Functions proxy, then wire live award rates from the proxy into calculatePay so the app uses real FWC data at runtime. Include a fallback to hardcoded rates and clear loading/error states so the app is never silently broken.

**Depends on:** Nothing (foundation phase)

**Requirements mapped:** PROXY-01, PROXY-02, PROXY-03, UX-03

**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md — Netlify Function proxy + netlify.toml + Wave 0 test stubs
- [x] 01-02-PLAN.md — Redirect service to proxy + wire calculatePay to awardRates state + Calculate button disabled during load
- [x] 01-03-PLAN.md — Human verification checkpoint (netlify dev end-to-end)

**Success Criteria** (what must be TRUE when complete):
1. App loads without CORS errors — FWC API calls go through the Netlify Function proxy
2. `calculatePay` reads award rates hydrated from the live FWC API response (via proxy + localStorage cache), not from `awardConfig.js` hardcoded values
3. If the proxy is unreachable or returns an error, the app falls back to hardcoded `awardConfig.js` rates with a visible warning banner
4. A loading spinner is shown while rates are being fetched; Calculate button is disabled until rates are ready
5. All 61 existing tests continue to pass (no regression in calculation logic)

**Implementation notes:**
- `netlify/functions/award-rates.js` — server-side proxy that forwards requests to `api.fwc.gov.au` with API key in headers
- `netlify.toml` — configure functions directory and SPA redirect rules
- `awardRatesService.js` — update to call `/api/award-rates` (local Netlify dev) or `/.netlify/functions/award-rates` (production)
- `App.js` — wire `awardRates` state into `calculatePay` (currently reads `awardConfig.js` directly — this is the v1.0 deferred step)
- Hydration mapping: map FWC API response fields into the `penaltyConfig + classifications + allowances` shape `calculatePay` expects
- Fallback chain: proxy → localStorage cache → `awardConfig.js` hardcoded
- `REACT_APP_FWC_API_KEY` moves to Netlify env vars (not .env); remove from client build

---

### Phase 2: Tailwind CSS Redesign

**Goal:** Redesign all app components with Tailwind CSS using a clean professional look. Navy/white palette, green/red status indicators for pay verification results, responsive forms that work on mobile.

**Depends on:** Phase 1 (stable API layer)

**Requirements mapped:** UX-01, UX-02

**Plans:** 4/4 plans complete

Plans:
- [x] 02-01-PLAN.md — Install Tailwind CSS v3, configure index.css/tailwind.config.js, redesign App.js shell (header, loading overlay, error banner)
- [x] 02-02-PLAN.md — Redesign AwardSelector, EmployeeDetails, Allowances with Tailwind form styling
- [x] 02-03-PLAN.md — Redesign WorkHours (horizontal scroll table), OverviewBreakdown (weekly summary row), ImportantNotes
- [x] 02-04-PLAN.md — Human verification checkpoint (visual + mobile responsive + full test suite)

**Success Criteria** (what must be TRUE when complete):
1. All components use Tailwind utility classes — no raw browser-default styles remain
2. Colour palette: navy (`#1e3a5f` or similar) for header/navigation, white for content areas
3. Pay verification rows: green background/text for "Paid Correctly", red for "Underpaid"
4. Forms are usable on mobile (≥375px width), tested on real or emulated device
5. All existing functionality preserved — no changes to calculation logic or data flow

**Implementation notes:**
- Install Tailwind CSS v3 (not v4 — CRA 5.0.1 compatibility), configure via `tailwind.config.js` + `postcss.config.js`
- Redesign order: App.js shell (Wave 1) → form components + result components (Wave 2, parallel) → checkpoint (Wave 3)
- Preserve accordion drill-down UX from Phase 3 v1.0 — just restyle
- Loading spinner and error banner (from Phase 1) get Tailwind classes here
- App title updated: "Pay Check App" (remove "Pharmacy Industry Award Pay Calculator")
- Weekly summary row added to OverviewBreakdown per CONTEXT.md D-12/D-13

---

### Phase 3: Polish

**Goal:** Add the finishing touches: cache transparency (show when rates were last fetched + manual refresh button), user-friendly error messages, and retry logic. Wire the already-exported `clearCache()` function to a UI button.

**Depends on:** Phase 2

**Requirements mapped:** POLISH-01

**Plans:** 1/1 plans complete

Plans:
- [x] 03-01-PLAN.md — Retry logic in fetchAwardRates, wire clearCache() in handleRefreshRates, fix error message wording per D-08

**Success Criteria** (what must be TRUE when complete):
1. A cache status line shows "Rates last updated: [date]" near the award selector
2. A "Refresh Rates" button triggers `clearCache()` + re-fetch from proxy
3. Error messages are user-friendly ("Couldn't connect to Fair Work Commission — using saved rates") not technical
4. Retry logic: on proxy failure, retry 3× with exponential backoff before falling back to cache/hardcoded

**Implementation notes:**
- `getLastCacheUpdateTime()` already exported from `awardRatesService.js` — use directly
- `clearCache()` already exported — wire to button click in `AwardSelector` or header
- Error message strings extracted to constants for easy editing
- Retry is NOT via axios-retry (service uses native fetch) — implemented as manual for-loop with Math.pow(2, attempt) * 1000 backoff

---

## Phase Progress

| Phase | Goal | Plans Complete | Status | Completed |
|-------|------|----------------|--------|-----------|
| 1 - Netlify Proxy & Live Rate Hydration | Proxy + live rate hydration | 3/3 | Complete | 2026-03-20 |
| 2 - Tailwind CSS Redesign | Full Tailwind redesign | 4/4 | Complete   | 2026-03-22 |
| 3 - Polish | Cache indicator + retry | 1/1 | Complete   | 2026-03-22 |

---

## Coverage Summary

**Total v1.1 requirements:** 7
**Requirements mapped:** 7
**Unmapped (orphaned):** 0

**Coverage by phase:**
- Phase 1 (Proxy & Hydration): 4 requirements (PROXY-01, PROXY-02, PROXY-03, UX-03)
- Phase 2 (Tailwind): 2 requirements (UX-01, UX-02)
- Phase 3 (Polish): 1 requirement (POLISH-01)

**Status:** ✓ 100% coverage, no gaps

---

## Dependencies

```
Phase 1 (Proxy + Live Rates)
    ↓
Phase 2 (Tailwind Redesign)
    ↓
Phase 3 (Polish)
```

---

*Roadmap created: 2026-03-13 (from v1.1 research + PROJECT.md active requirements)*
*Phase 1 planned: 2026-03-13*
*Phase 2 planned: 2026-03-22*
*Phase 3 planned: 2026-03-22*
