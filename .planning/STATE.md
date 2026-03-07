# STATE: Pay Check App

**Project:** Pay Check App — Multi-Award Support Initiative
**Last Updated:** 2026-03-07
**Current Phase:** Planning → Phase 1 (ready to start)

---

## Project Reference

**Core Value:** A worker can enter their shifts, see exactly how much they should have been paid and why, and know with confidence whether they have been underpaid.

**Tech Stack:** React 19 (Create React App), axios, localStorage, zod/yup for validation

**Architecture:** Single-page React app (no backend server). All state in App.js. Components are presentational (receive props/callbacks). New service layer: awardRatesService.js for FWC API integration and caching.

**Key Asset:** Existing minute-accurate penalty calculation engine in helpers.js (calculatePayForTimePeriod). Must be preserved and parameterized, not replaced.

---

## Current Position

| Aspect | Status | Details |
|--------|--------|---------|
| **Milestone** | Roadmap Approved | 3-phase plan created, 100% requirement coverage |
| **Phase** | Phase 1 Ready | API Foundation & Award Selection — not yet started |
| **Progress** | 0/14 requirements complete | All in "Pending" status |
| **Blocker** | None | Ready to start Phase 1 planning |

---

## Roadmap Summary

**3 Phases (Coarse Granularity)**

1. **Phase 1: API Foundation & Award Selection** (API-01, API-02, API-03)
   - Integrate FWC MAAPI v1, implement localStorage caching, build AwardSelector component
   - Fallback to Pharmacy rates if API fails
   - Status: Not started

2. **Phase 2: Award-Agnostic Calculation Engine** (AWARD-01–04, REG-02, REG-03)
   - Refactor calculatePayForTimePeriod, getPenaltyDescription to accept penaltyConfig
   - Extract penalty boundaries to API data
   - Ensure Pharmacy regression test passes
   - Status: Depends on Phase 1

3. **Phase 3: Multi-View UI & Pay Comparison** (PAY-01–04, REG-01)
   - ModeToggle, OverviewBreakdown, DrillDownBreakdown, ComparisonView components
   - Week overview with pass/fail per day, drill-down to segment breakdown
   - Actual amount input and discrepancy detection
   - Validate weekly/fortnightly cycles
   - Status: Depends on Phase 2

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Requirements mapped | 14/14 | 14/14 ✓ |
| Phase dependencies | Acyclic chain | 1 → 2 → 3 ✓ |
| API key exposure risk | Mitigated | Research noted, Phase 1 must decide (public tier vs backend proxy) |
| Pharmacy regression | Identical results | Phase 2 deliverable (must not change existing Pharmacy calculation) |
| Caching strategy | Versioned, with expiry | Phase 1 implementation detail |

---

## Accumulated Context

### Decisions Made

1. **3-phase structure (coarse granularity)** — Compress research recommendations (1-6 phases) to essential dependencies only:
   - Phase 1: API layer (must come first)
   - Phase 2: Calculation refactoring (unblocks multi-award support)
   - Phase 3: UI and new features (built on stable engine)

2. **Regression requirements (REG-01–03) distributed strategically:**
   - REG-02, REG-03 (Pharmacy calculation equivalence, junior rates) → Phase 2 (core refactoring)
   - REG-01 (weekly/fortnightly cycles) → Phase 3 (validates UI layer supports it)

3. **API key exposure deferred to Phase 1 implementation:**
   - Research identified two paths: public tier (embed in code with caching) or backend proxy (Node.js)
   - Roadmap does not prescribe which; Phase 1 planning must research FWC authentication and decide

4. **Mock FWC responses for Phase 1 testing:**
   - Phase 1 develops service layer with mocked award rates
   - Real FWC integration deferred (no Phase 6 in coarse roadmap; could be v2 or inline Phase 3)

### Critical Path

```
Phase 1: awardRatesService.js + AwardSelector
    ↓
Phase 2: Parameterized calculatePayForTimePeriod + componentRefactoring
    ↓
Phase 3: ModeToggle + OverviewBreakdown + ComparisonView
```

Each phase unblocks the next. No parallel work possible.

### Known Pitfalls (from Research)

1. **API Key Exposure** — If FWC requires secret key, SPA cannot hide it. Decision needed: use public tier with aggressive caching, or build backend proxy.
2. **Award Penalty Variance** — Pharmacy (19:00 threshold), Retail (22:00?), Hospitality (21:00?) differ. Must extract to data-driven penaltyConfig, not hardcode.
3. **Casual Loading Variance** — Different awards apply casual loading differently (baked-in vs separate). Must map per-award rules.
4. **Cache Collision** — Multi-tab scenarios + same localStorage key = stale data. Solution: versioned keys, deduplication.
5. **FWC Schema Mismatch** — API may return unexpected structure. Solution: zod/yup validation.

**Phase 1 implementation must address pitfalls 1, 4, 5 upfront. Phases 2 and 3 handle 2 and 3.**

### TODOs

- [ ] Phase 1 planning: FWC MAAPI v1 authentication verification (public tier available?)
- [ ] Phase 1 planning: Fetch real FWC API responses for MA000012, MA000003, MA000010 to validate schema
- [ ] Phase 1 planning: Design awardRatesService.js and caching layer
- [ ] Phase 1 planning: Define mock FWC responses for local testing
- [ ] Phase 2 planning: Extract penalty boundary values from API schema
- [ ] Phase 2 planning: Write Pharmacy regression test suite
- [ ] Phase 3 planning: Define pass/fail threshold (currently $0.01; confirm with Fair Work)

### Blockers

None currently. Ready to start Phase 1 planning.

---

## Session Continuity

**Session 0 (2026-03-07):** Roadmap creation
- Read PROJECT.md, REQUIREMENTS.md, research/SUMMARY.md, config.json
- Identified 14 v1 requirements across 4 categories
- Created 3-phase structure with goal-backward success criteria
- Validated 100% requirement coverage
- Wrote ROADMAP.md, STATE.md, updated REQUIREMENTS.md traceability
- Ready for Phase 1 planning

---

*State file created: 2026-03-07*
*Maintained by: /gsd:roadmap orchestrator*
