---
phase: 2
slug: award-agnostic-calculation-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (CRA default) + @testing-library/react |
| **Config file** | None — CRA manages jest.config internally |
| **Quick run command** | `npm test -- pharmacyRegression.test.js --watchAll=false` |
| **Full suite command** | `npm test -- --watchAll=false` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- pharmacyRegression.test.js --watchAll=false`
- **After every plan wave:** Run `npm test -- --watchAll=false`
- **Before `/gsd:verify-work`:** Full suite must be green + manual verification of Retail/Hospitality dropdown
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-W0-01 | W0 | 0 | AWARD-04, REG-02, REG-03 | integration | `npm test -- pharmacyRegression.test.js --watchAll=false` | ❌ W0 | ⬜ pending |
| 2-W0-02 | W0 | 0 | AWARD-02 | unit | `npm test -- EmployeeDetails.test.js --watchAll=false` | ❌ W0 | ⬜ pending |
| 2-W0-03 | W0 | 0 | AWARD-03 | unit | `npm test -- Allowances.test.js --watchAll=false` | ❌ W0 | ⬜ pending |
| 2-01-01 | 01 | 1 | AWARD-04 | unit+integration | `npm test -- pharmacyRegression.test.js --watchAll=false` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | REG-02 | integration | `npm test -- pharmacyRegression.test.js --watchAll=false` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | REG-03 | unit | `npm test -- pharmacyRegression.test.js --watchAll=false` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | AWARD-02 | unit | `npm test -- EmployeeDetails.test.js --watchAll=false` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | AWARD-03 | unit | `npm test -- Allowances.test.js --watchAll=false` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | AWARD-01 | unit | `npm test -- AwardSelector.test.js --watchAll=false` | ✅ Phase 1 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/config/awardConfig.js` — complete award data (Pharmacy, Retail, Hospitality stubs, penaltyConfig shape)
- [ ] `src/__tests__/pharmacyRegression.test.js` — baseline regression tests (TDD RED before refactoring)
- [ ] `src/components/EmployeeDetails.test.js` — stubs for AWARD-02 classification prop tests
- [ ] `src/components/Allowances.test.js` — stubs for AWARD-03 allowances prop tests

*Framework is already in place from Phase 1; no new npm packages needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Retail award selected → penalty boundary shifts to 22:00 in calculation | AWARD-04 | Config data is placeholder; full FWC rates unverified | Select Retail, enter shift 21:00–23:00, verify evening rate applied at 22:00 not 19:00 |
| Hospitality award selected → classification dropdown shows Hospitality roles | AWARD-02 | Placeholder classifications not from real FWC data | Select Hospitality, verify dropdown shows hospitality-specific roles only |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
