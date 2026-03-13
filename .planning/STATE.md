---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: API Integration & UX Redesign
current_phase: Not started (defining requirements)
status: unknown
last_updated: "2026-03-13T23:07:30.762Z"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 3
  completed_plans: 2
---

# STATE: Pay Check App

**Project:** Pay Check App — API Integration & UX Redesign
**Last Updated:** 2026-03-09
**Current Phase:** Not started (defining requirements)

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** A worker can enter their shifts, see exactly how much they should have been paid and why, and know with confidence whether they have been underpaid.
**Current focus:** v1.1 milestone — defining requirements

---

## Current Position

| Aspect | Status | Details |
|--------|--------|---------|
| **Milestone** | Not started | Defining requirements for v1.1 |
| **Phase** | — | Roadmap not yet created |
| **Progress** | 0 requirements complete | Requirements being defined |
| **Blocker** | None | Ready to define requirements |

---

## Accumulated Context

### Decisions Made

1. **Netlify Functions for proxy** — Resolves CORS by forwarding requests server-side. Keeps SPA architecture; co-located with app. Free tier. Platform decided: Netlify.

2. **Live rate hydration in v1.1** — `calculatePay` will read from live FWC data (via proxy + cache), completing the goal deferred from v1.0. `awardConfig.js` remains fallback source.

3. **Full Tailwind redesign** — Install Tailwind CSS, redesign all components. Clean professional look: navy/white, green/red status indicators for paid/underpaid states.

4. **FWC CORS root cause confirmed** — `api.fwc.gov.au` returns 200 but omits `Access-Control-Allow-Origin` header. Not fixable client-side. Requires server-side proxy.
- [Phase 01-netlify-proxy-live-rate-hydration]: FWC_API_KEY has no REACT_APP_ prefix — server-side only, prevents CRA bundling key into client JS
- [Phase 01-netlify-proxy-live-rate-hydration]: Wave 0 stubs use test.todo() — test contracts defined before implementation to prevent blockers
- [Phase 01-netlify-proxy-live-rate-hydration]: calculatePay falls back to getAwardConfig when awardRates[selectedAward] is falsy — ensures no breakage if proxy is down
- [Phase 01-netlify-proxy-live-rate-hydration]: App.test.js weekly pay cycle uses empty rates map so calculatePay exercises getAwardConfig fallback, avoiding coupling to mock data shape

### Known Issues

- FWC API (`api.fwc.gov.au/awards/{id}`) is completely blocked by CORS from browser — app spams retry errors on load
- App title still says "Pharmacy Industry Award Pay Calculator" (not updated for multi-award)
- UI is completely unstyled (browser defaults) — v1.0 built components but no CSS applied

---

*State file created: 2026-03-09*
*Maintained by: /gsd:new-milestone orchestrator*
