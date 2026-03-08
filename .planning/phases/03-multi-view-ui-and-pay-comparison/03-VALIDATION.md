---
phase: 3
slug: multi-view-ui-and-pay-comparison
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (via react-scripts) + React Testing Library |
| **Config file** | Built into CRA (embedded in react-scripts) |
| **Quick run command** | `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js` |
| **Full suite command** | `npm test -- --watchAll=false` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js`
- **After every plan wave:** Run `npm test -- --watchAll=false`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | PAY-01 | unit | `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js -k "renders week table"` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | PAY-01 | unit | `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js -k "status badge OK"` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 0 | PAY-01 | unit | `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js -k "status badge underpaid"` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 0 | PAY-02 | unit | `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js -k "actual paid input change"` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 0 | PAY-02 | unit | `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js -k "period total input"` | ❌ W0 | ⬜ pending |
| 3-02-03 | 02 | 0 | PAY-03 | unit | `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js -k "period summary format"` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 1 | PAY-04 | unit | `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js -k "accordion expand"` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 1 | PAY-04 | unit | `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js -k "accordion single expand"` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | REG-01 | integration | `npm test -- --watchAll=false src/App.test.js -k "weekly pay cycle"` | ❌ W0 | ⬜ pending |
| 3-04-02 | 04 | 2 | REG-01 | integration | `npm test -- --watchAll=false src/App.test.js -k "fortnightly pay cycle"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/OverviewBreakdown.test.js` — stubs for PAY-01, PAY-02, PAY-03, PAY-04 (10–12 unit tests)
- [ ] `src/App.test.js` additions — stubs for REG-01 cycle-aware integration tests (2 tests)

*Note: Existing test infrastructure (Jest + RTL) is already installed. Wave 0 only needs test file creation, no framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual color coding (green OK / red Underpaid badges) | PAY-01 | CSS color rendering not reliable in jsdom | Open app, enter actual paid less than calculated, verify badge color |
| Accordion animation/transition smoothness | PAY-04 | CSS transitions not tested in jsdom | Click day row, verify expand/collapse animation |
| Period summary neutral tone ("Difference: -$23.33") | PAY-03 | Text copy review | Open app, enter underpaid value, verify exact format |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
