# Plan: Fix impeccable detector residuals

## Context

Follow-up to the brand-alignment change (on branch `fabro/brand-align`, PR #1).
An `impeccable detect` scan of the running app reported **21 anti-patterns** on
this branch (down from 27 on `main`). This plan clears the real residuals.

Sources: `DESIGN.md` (rewritten for this app — read it), `.impeccable.md`,
`.claude/skills/impeccable/reference/craft-floor.md` (bans),
`.claude/skills/impeccable/reference/mode-operate.md` (Operate surface).

## Task 1 — Sub-11px functional text → ≥ `text-xs` (12px floor)

Functional text must be at least `text-xs`. Apply in these files:

- `src/App.js:284` — "Module" header badge
- `src/App.js:291` — "Infrastructure for Choice…" tagline (also non-token, see Task 3)
- `src/components/EmployeeDetails.js:94` — "Not Applicable" badge
- `src/components/Allowances.js:82,99,116` — in-input "Qty"/"KM" unit labels
- `src/components/OverviewBreakdown.js:32` — PENALTY RATES / OVERTIME AUDIT / ALLOWANCE CHECK tag row
- `src/components/OverviewBreakdown.js:44,48` — "Pending Input" badges
- `src/components/OverviewBreakdown.js:53,60,66` — status pills
- `src/components/OverviewBreakdown.js:249,251,253` — Perfect Match / Underpaid / Overpaid verdict badges

Use `text-xs` for badges/pills (compactness matters); `text-sm` where the text is
a label for a control (Qty/KM unit labels). Keep the uppercase+tracking style.

## Task 2 — Contrast failures (WCAG AA on light surfaces)

`ink.muted` (`#94a3b8`) fails AA at ~2.5–2.6:1 on white/`surface-page`. It must
not be used for functional text on light surfaces (DESIGN.md already bans it for
body text — the detector confirms violations remain).

- Replace `text-ink-muted` with `text-ink-secondary` on functional text/adornments:
  `OverviewBreakdown.js` (tags row, "Pending Input", `$` input adornments),
  `Allowances.js` (Qty/KM labels, disabled checkbox labels can stay muted),
  `EmployeeDetails.js` (`$` adornment, "Not Applicable" badge),
  `WorkHours.js:64` (the `text-sm text-ink-muted italic` footnote → `text-ink-secondary`),
  `AwardSelector.js` (chevron adornment; keep `disabled:` variants on muted).
- Exempt: `disabled:`/placeholder variants (WCAG exempts inactive controls) and
  non-text decoration (`bg-ink-muted` dots, `border-ink-muted`).

## Task 3 — `src/App.js` header and error banner (styling only)

`App.js` was out of scope last run — allowed now for className/styling edits ONLY
(do not touch logic, state, handlers, or `calculatePay`).

- `text-slate-400` subtitle and `text-slate-500` tagline → dark-surface-appropriate
  token values (`edge.light` / `edge.mid` or `brand.teal-light`) — must pass AA on
  `brand.navy` `#0F172A`
- Error banner `border-l-4 border-critical` → remove the side-stripe; keep
  `bg-critical-bg border border-critical/20 rounded-md` (same treatment as the
  amber compliance card)
- The `$17.96/week per pharmacy` footer/meta text renders at ~1.1:1 via an
  opacity stack — find it and make it readable (`ink.secondary` on a light
  surface or an on-dark token as appropriate)

## Task 4 — Structural anti-patterns

- `src/components/EmployeeDetails.js:17` — remove `animate-pulse` from the header
  dot (static dot like `WorkHours`/`Allowances` headers; pulse is reserved for
  genuinely-live indicators)
- `src/components/DetailedBreakdown.js` — nested cards: the `p-3 border rounded
  bg-white` inner boxes inside the `p-4 border rounded-md bg-surface-page`
  container. Flatten: remove `border rounded bg-white` wrappers; separate days
  with spacing and/or `border-t border-edge-light` dividers. Also remove the
  nested boxing in the Overtime and Allowances sections the same way.
- `src/components/ImportantNotes.js` — `text-brand-amber-dark/80` →
  `text-brand-amber-dark` (drops the /80 opacity; `#92400E` on `#FFFBEB` passes AA)

## Constraints

- No changes to pay-calculation logic, state, handlers, test files, or
  `src/helpers.js`
- Styling-only in `src/App.js` (className attributes; no logic edits)
- No new dependencies
- Preserve layout structure and copy; alignment not redesign

## Acceptance

- `CI=true npm test -- --watchAll=false` — 87/87 pass
- `CI=true npm run build` — clean, zero ESLint warnings
- `ubs -q .` — 0 critical, ≤15 warnings (baseline: 0/15/265)
- `./.claude/skills/impeccable/scripts/impeccable detect src` — 0 anti-patterns
- No `text-[10px]`/`text-[9px]`/`text-slate-*`/`text-gray-*`/`border-l-4`/
  `animate-pulse` remaining in `src/*.js` (non-test files)
- No `text-ink-muted` on functional text (disabled/decorative uses exempt)
