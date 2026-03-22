---
phase: 3
slug: polish
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-22
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (Create React App) |
| **Config file** | package.json (react-scripts test) |
| **Quick run command** | `npm test -- --watchAll=false --testPathPattern="awardRatesService\|App"` |
| **Full suite command** | `npm test -- --watchAll=false` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --watchAll=false --testPathPattern="awardRatesService\|App"`
- **After every plan wave:** Run `npm test -- --watchAll=false`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | POLISH-01 | unit | `npm test -- --watchAll=false --testPathPattern="awardRatesService"` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | POLISH-01 | unit | `npm test -- --watchAll=false --testPathPattern="awardRatesService"` | ✅ | ⬜ pending |
| 3-01-03 | 01 | 2 | POLISH-01 | unit | `npm test -- --watchAll=false --testPathPattern="App"` | ✅ | ⬜ pending |
| 3-01-04 | 01 | 2 | POLISH-01 | unit | `npm test -- --watchAll=false --testPathPattern="App"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cache status line displays "Rates last updated: X minutes ago" near award selector | POLISH-01 | Visual placement requires browser check | Load app, verify status line visible near award selector |
| "Refresh Rates" button triggers re-fetch and updates status line | POLISH-01 | UI interaction flow | Click Refresh Rates, verify loading state, then updated timestamp |
| Error banner shows user-friendly message on proxy failure | POLISH-01 | Requires network simulation | Disable proxy, verify banner text matches D-08 spec |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
