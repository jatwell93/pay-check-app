---
phase: 02-tailwind-css-redesign
plan: 01
subsystem: ui
tags: [tailwindcss, postcss, autoprefixer, react, css, redesign]

# Dependency graph
requires:
  - phase: 01-netlify-proxy-live-rate-hydration
    provides: awardLoading/awardError state in App.js wired to UI components
provides:
  - Tailwind CSS v3 installed and configured (tailwind.config.js, postcss.config.js)
  - @tailwind directives in index.css — Tailwind active across all components
  - Navy header (bg-slate-900) with "Pay Check App" title and static subtitle
  - Dismissible error banner (aria-label="Dismiss error") wired to awardError state
  - Loading overlay with animate-spin spinner wired to awardLoading state
  - App.js shell fully converted from legacy CSS class names to Tailwind utilities
affects:
  - 02-02 (AwardSelector redesign — builds on Tailwind being active)
  - 02-03 (EmployeeDetails/Allowances/WorkHours redesign)
  - 02-04 (OverviewBreakdown weekly summary)

# Tech tracking
tech-stack:
  added:
    - tailwindcss@3.4.19 (devDependency)
    - postcss (devDependency)
    - autoprefixer (devDependency)
  patterns:
    - Tailwind utility-first CSS — all component styling via className utility strings
    - PostCSS pipeline via postcss.config.js (CRA 5.0.1 reads automatically, no eject)
    - App-level error banner pattern — awardError rendered once in App.js banner, not passed to child error props

key-files:
  created:
    - tailwind.config.js (content paths for purge)
    - postcss.config.js (tailwindcss + autoprefixer plugins)
  modified:
    - src/index.css (@tailwind directives + body reset)
    - src/App.css (legacy rules removed; only code font-family retained)
    - src/App.js (shell JSX redesigned with Tailwind; header, banner, overlay)
    - src/App.test.js (2 new TDD tests: header title, error banner dismiss)

key-decisions:
  - "Install tailwindcss@3 (not v4) — npm resolved to v4 initially; corrected to v3 for CRA 5 compatibility (v4 has no tailwindcss init CLI, no postcss plugin pattern)"
  - "Pass error={null} to AwardSelector — App.js banner is the primary error UI (D-09/D-10); avoids duplicate text causing findByText('...').toBeInTheDocument() to fail with multiple matches"
  - "bg-slate-900 for navy header — uses Tailwind built-in rather than custom config color per UI-SPEC decision"

patterns-established:
  - "Error display centralized in App.js banner — child components receive error={null} when App has primary error banner"
  - "Tailwind config content path: ./src/**/*.{js,jsx,ts,tsx} — required to prevent class purging"
  - "PostCSS config at project root — CRA 5.0.1 picks it up automatically without ejecting"

requirements-completed: [UX-01]

# Metrics
duration: 9min
completed: 2026-03-22
---

# Phase 02 Plan 01: Tailwind CSS Installation and App Shell Redesign Summary

**Tailwind CSS v3 installed via PostCSS pipeline, App.js shell converted to navy header/white layout with dismissible error banner and loading overlay spinner**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-22T05:32:26Z
- **Completed:** 2026-03-22T05:41:09Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Tailwind CSS v3 active in CRA build pipeline (tailwind.config.js + postcss.config.js + @tailwind directives)
- App.js JSX shell fully redesigned: navy header with "Pay Check App" title, responsive max-w-4xl layout
- Dismissible error banner (D-09/D-10) with aria-label="Dismiss error" wired to setAwardError(null)
- Loading overlay (D-08) with CSS animate-spin spinner covering form area, header remains visible
- All 83 tests pass (10 App.test.js, 73 component tests across 11 suites)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Tailwind CSS v3 and create config files** - `6c93214` (chore)
2. **Task 2: Update index.css with Tailwind directives and update App.css** - `f12ca52` (chore)
3. **Task 3 RED: Add failing tests for header title and error banner dismiss** - `11b2665` (test)
4. **Task 3 GREEN: Redesign App.js shell with Tailwind** - `435ae68` (feat)

_Note: Task 3 is TDD — separate test commit (RED) and implementation commit (GREEN)_

## Files Created/Modified

- `tailwind.config.js` — Tailwind v3 config with content path `./src/**/*.{js,jsx,ts,tsx}`
- `postcss.config.js` — PostCSS pipeline: tailwindcss + autoprefixer plugins
- `src/index.css` — @tailwind base/components/utilities directives + body reset (bg #f9fafb)
- `src/App.css` — Legacy .container/.section/.button rules removed; only code font-family retained
- `src/App.js` — Shell JSX redesigned: navy header, error banner, loading overlay, Tailwind layout
- `src/App.test.js` — 2 new tests: header h1 "Pay Check App", error banner dismiss

## Decisions Made

1. **Tailwind v3 not v4** — npm installed v4 by default; corrected to `tailwindcss@3` because v4 removed `npx tailwindcss init`, has no postcss plugin pattern compatible with CRA 5.
2. **error={null} passed to AwardSelector** — Both App.js banner and AwardSelector rendered the same error text, causing `findByText` to find multiple elements and fail. Since App.js banner is the primary error UI per D-09/D-10, AwardSelector receives `error={null}` to avoid duplication.
3. **bg-slate-900 for navy header** — Uses Tailwind's built-in color; no custom config needed per UI-SPEC decision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Downgraded from Tailwind v4 to v3**
- **Found during:** Task 1 (npm install)
- **Issue:** `npm install -D tailwindcss` resolved to v4.2.2 which has no CLI `npx tailwindcss init`, no `tailwind.config.js` pattern, and incompatible PostCSS integration for CRA 5
- **Fix:** Ran `npm install -D tailwindcss@3` to install v3.4.19 — the version specified by the plan and compatible with CRA 5.0.1
- **Files modified:** package.json, package-lock.json
- **Verification:** `tailwindcss init` succeeded, config file created
- **Committed in:** `6c93214` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed duplicate error text causing test failure**
- **Found during:** Task 3 GREEN (App.js implementation)
- **Issue:** Both App.js error banner and AwardSelector rendered identical `awardError` text. `findByText(exact)` throws when multiple DOM elements match, causing existing test to fail.
- **Fix:** Changed `error={awardError}` to `error={null}` in AwardSelector prop; App-level banner is single source of error display per D-09/D-10.
- **Files modified:** src/App.js
- **Verification:** All 10 App.test.js tests pass including original error message test
- **Committed in:** `435ae68` (Task 3 feat commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. Tailwind v3 was explicitly specified by plan; v4 was incompatible. Duplicate error text was a testability/UX correctness issue.

## Issues Encountered

None beyond the deviations documented above. act() warnings in console are pre-existing (noted in STATE.md known tech debt) and not caused by this plan.

## Known Stubs

None — all wired to real state (awardLoading, awardError). No hardcoded empty values or placeholder text in App.js shell.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Tailwind CSS v3 is active — all utility classes in components will now be processed
- App.js shell uses Tailwind exclusively — no legacy CSS class names remain in JSX
- Plan 02-02 (AwardSelector redesign) can proceed immediately
- AwardSelector currently passes `error={null}` — Plan 02-02 should style AwardSelector with Tailwind and can restore its own inline error styling if needed for refresh errors

## Self-Check: PASSED

All key files verified:
- tailwind.config.js: FOUND
- postcss.config.js: FOUND
- src/index.css: FOUND
- src/App.css: FOUND
- src/App.js: FOUND
- 02-01-SUMMARY.md: FOUND

All commits verified:
- 6c93214: FOUND
- f12ca52: FOUND
- 11b2665: FOUND
- 435ae68: FOUND

---
*Phase: 02-tailwind-css-redesign*
*Completed: 2026-03-22*
