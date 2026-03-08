---
phase: 1
slug: api-foundation-award-selection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (via Create React App) + React Testing Library v16.3.0 |
| **Config file** | Implicit in react-scripts (no jest.config.js needed) |
| **Quick run command** | `npm test -- --watchAll=false --testPathPattern=AwardSelector` |
| **Full suite command** | `npm test -- --watchAll=false` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --watchAll=false --testPathPattern=<component-name>`
- **After every plan wave:** Run `npm test -- --watchAll=false`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | API-02 | unit | `npm test -- --watchAll=false --testPathPattern=awardRatesService` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 0 | API-03 | unit | `npm test -- --watchAll=false --testPathPattern=AwardSelector` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 0 | API-01 | integration | `npm test -- --watchAll=false --testPathPattern=App` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | API-02 | unit | `npm test -- --watchAll=false --testPathPattern=awardRatesService` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | API-01 | integration | `npm test -- --watchAll=false --testPathPattern=App` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 1 | API-03 | integration | `npm test -- --watchAll=false --testPathPattern=AwardSelector` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 2 | API-01 | integration | `npm test -- --watchAll=false --testPathPattern=App` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/services/awardRatesService.test.js` — stubs for API-02 (caching behavior, TTL expiry, cache hit/miss)
- [ ] `src/components/AwardSelector.test.js` — stubs for API-03 (refresh button click, spinner display, error message)
- [ ] `src/App.test.js` — updated stubs for API-01 (initial fetch, state integration, fallback behavior)
- [ ] `src/setupTests.js` — localStorage mock if needed for Jest environment

*Existing jest + @testing-library/react infrastructure via react-scripts; no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| API unreachable fallback shows visual indicator | API-01 | Requires network simulation (disable network in DevTools) | Open app with DevTools → Network → Offline; verify warning banner appears and hardcoded Pharmacy rates load |
| Cache persists across browser refresh | API-02 | Requires real browser localStorage | Load app, check Network tab shows API call; refresh, confirm no new API call; check Application → localStorage |
| Award selector dropdown shows 3+ awards | API-01 | Requires visual verification | Open app, click award selector, verify Pharmacy, Retail, Hospitality options present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
