---
phase: 2
slug: tailwind-css-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (via react-scripts) |
| **Config file** | package.json (jest config embedded) |
| **Quick run command** | `npm test -- --watchAll=false --passWithNoTests` |
| **Full suite command** | `npm test -- --watchAll=false` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --watchAll=false --passWithNoTests`
- **After every plan wave:** Run `npm test -- --watchAll=false`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | UX-01 | unit | `npm test -- --watchAll=false` | ✅ | ⬜ pending |
| 2-01-02 | 01 | 1 | UX-01 | unit | `npm test -- --watchAll=false` | ✅ | ⬜ pending |
| 2-02-01 | 02 | 1 | UX-01 | unit | `npm test -- --watchAll=false` | ✅ | ⬜ pending |
| 2-02-02 | 02 | 1 | UX-01 | unit | `npm test -- --watchAll=false` | ✅ | ⬜ pending |
| 2-02-03 | 02 | 1 | UX-02 | unit | `npm test -- --watchAll=false` | ✅ | ⬜ pending |
| 2-02-04 | 02 | 2 | UX-02 | unit | `npm test -- --watchAll=false` | ✅ | ⬜ pending |
| 2-02-05 | 02 | 2 | UX-01 | manual | visual inspection at 375px | ❌ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements. (Jest/react-scripts already installed; styling changes don't require new test stubs — tests verify logic and component presence by text/ID, not CSS classes.)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile layout at 375px | UX-01 | Visual layout cannot be automated in jest | Open DevTools → Responsive Mode → 375px width; verify forms are usable, table scrolls horizontally |
| Navy header colour (#1e3a5f) | UX-01 | Colour perception is visual | Inspect header element, verify computed background-color matches navy |
| Green/red/yellow status badge colours | UX-02 | Colour contrast is visual | Enter a shift result; verify correct bg-green/bg-red/bg-yellow class applied |
| Loading spinner overlay | UX-01 | Animation and overlay z-index are visual | Trigger slow network or mock API delay; verify spinner covers form, header remains visible |
| Error banner dismissal | UX-01 | User interaction flow | Trigger API error; verify red banner appears; click × close button; verify banner disappears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
