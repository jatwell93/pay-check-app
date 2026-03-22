---
phase: 1
slug: netlify-proxy-live-rate-hydration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (via Create React App) |
| **Config file** | Built-in (CRA); no jest.config.js needed |
| **Quick run command** | `npm test -- --testPathPattern="awardRatesService" --watchAll=false` |
| **Full suite command** | `npm test -- --watchAll=false` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="awardRatesService|App" --watchAll=false`
- **After every plan wave:** Run `npm test -- --watchAll=false`
- **Before `/gsd:verify-work`:** Full suite must be green (61 + new tests)
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-proxy | TBD | 1 | PROXY-01 | Unit/Integration | `npm test -- --testPathPattern="proxy" --watchAll=false` | ❌ W0 | ⬜ pending |
| 1-hydration | TBD | 1 | PROXY-02 | Unit | `npm test -- --testPathPattern="hydration" --watchAll=false` | ❌ W0 | ⬜ pending |
| 1-fallback | TBD | 1 | PROXY-03 | Unit | `npm test -- --testPathPattern="fallback" --watchAll=false` | ❌ W0 | ⬜ pending |
| 1-loading | TBD | 1 | UX-03 | Component | `npm test -- --testPathPattern="AwardSelector\|WorkHours" --watchAll=false` | ⚠️ Partial | ⬜ pending |
| 1-regression | TBD | 1 | PROXY-02 | Regression | `npm test -- --watchAll=false` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/netlifyProxy.test.js` — stubs for PROXY-01 (success, 4xx, 5xx, timeout, invalid JSON)
- [ ] `src/__tests__/hydration.test.js` — stubs for PROXY-02 (valid response maps; missing fields; Zod rejects invalid)
- [ ] `src/__tests__/fallback.test.js` — stubs for PROXY-03 (all cache hit; partial; none; corrupted localStorage)
- [ ] Update `src/App.test.js` — add loading/error state tests for PROXY-03, UX-03
- [ ] Update `src/components/AwardSelector.test.js` — error message + retry button tests (UX-03)
- [ ] Update `src/components/WorkHours.test.js` — Calculate button disabled when `awardLoading === true` (UX-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Netlify dev server correctly proxies to FWC API | PROXY-01 | Requires `netlify dev` running; can't mock real CORS headers in Jest | Run `netlify dev`, open app, check Network tab — no CORS error on load |
| Error banner visible with correct copy | PROXY-03 | Visual check for styling/positioning | Simulate API failure (kill netlify dev), check banner appears |
| Loading spinner visible during fetch | UX-03 | Visual timing check | Throttle network in DevTools, reload app, verify spinner shows |
| Calculate button actually disabled during load | UX-03 | Visual state verification | Throttle network, click Calculate before spinner disappears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
