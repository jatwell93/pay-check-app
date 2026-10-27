# Plan: Align pay-check-app with the PharmIQ consumer brand

## Context

pay-check-app is the consumer-facing PharmIQ surface: a pay-checker for pharmacy,
retail and hospitality workers (often young, on mobile, checking for underpayment
after a shift). Brand personality: **Clear, Warm, Confident** — a personal advocate,
not corporate HR software.

Sources of truth (read these first):

- `.impeccable.md` — design context: users, personality, aesthetic direction, principles
- `brand-identity-pharma-apps/brand-identity/brand-guidelines.md` — PharmIQ umbrella
  guide. The Quick Reference lists **Consumer Font: Bricolage Grotesque + DM Sans** —
  that pairing applies to this app.
- `tailwind.config.js` — design tokens. Already well-structured (`brand.teal`,
  semantic colors, `font-heading`/`font-sans`/`font-mono`, ink/edge/surface
  neutrals). Prefer extending tokens over hardcoding values.

Playbooks (read before any UI edit):

- `.claude/skills/impeccable/reference/craft-floor.md` — quality floor and absolute bans
- `.claude/skills/impeccable/reference/audit.md` — audit method
- `.claude/skills/impeccable/reference/mode-operate.md` — this is an **Operate** surface

## Task 1 — Rewrite `DESIGN.md`

The current `DESIGN.md` is the wrong document: it describes ExpiryMate (the PharmIQ
operations product) — it references `frontend/src/theme/` paths, handheld scanner /
PDT workflows, sidebar navigation, and Outfit/Inter typography. None of that exists
in this repository (a CRA single-page app under `src/`).

Replace it with this app's real design doc. Keep a similar section structure
(Visual Theme, Brand Personality, Colour System, Typography, Components, Layout,
Motion, Accessibility, Bans) but write it for THIS app:

- Consumer surface of the PharmIQ brand; light mode; teal `#0F766E` is the anchor
- Bricolage Grotesque headings, DM Sans body (the consumer pairing)
- Body and label text ≥16px; tabular numerals for money values
- Single-page vertical flow, mobile-first; sections = cards on a neutral page surface
- The existing motion system in `src/index.css` (fadeSlideUp/fadeIn/slideDown,
  `prefers-reduced-motion` support) is the house style — document it, don't change it
- Point back to `brand-identity-pharma-apps/brand-identity/brand-guidelines.md` as
  the umbrella source and to `tailwind.config.js` as the token source

The new DESIGN.md must contain no references to `frontend/`, ExpiryMate, scanners,
PDTs, sidebars, or Outfit/Inter.

## Task 2 — Font alignment (highest leverage)

The token architecture is right but the font values are stale (pre-rebrand
pairing). Make the smallest possible change set:

- `tailwind.config.js`: `fontFamily.sans` → `'DM Sans'`; `fontFamily.heading` →
  `'Bricolage Grotesque'`
- `public/index.html`: update the Google Fonts link — add DM Sans (weights
  400;500;700), keep Bricolage Grotesque, drop Space Grotesk and Inter (verify
  nothing else still references them first)
- `src/index.css`: body `font-family` Inter → `'DM Sans'`; the `h1–h4` stack
  Space Grotesk → `'Bricolage Grotesque'`
- `font-mono` (JetBrains Mono) is declared in tokens but never loaded or used —
  leave the token as-is (harmless), no change needed

## Task 3 — Fix dead/misaligned utilities

- `text-brand` in `src/components/PaySummary.js` and
  `src/components/DetailedBreakdown.js` resolves to nothing — `colors.brand` has no
  `DEFAULT` key. Replace with `text-brand-teal`.
- Add `tabular-nums` (or `font-variant-numeric: tabular-nums`) to currency/hour
  values: totals in `PaySummary`, `OverviewBreakdown`, `DetailedBreakdown` tables.
- Scan every component for styling that bypasses the token system (hardcoded hex
  in classnames, inline `style` colors, non-token fonts) and route it through
  tokens. Do not restyle — align.

## Task 4 — View-by-view audit

Audit each rendered section against the plan and craft-floor bans (no gradient
text, no glassmorphism, no nested cards, no decorative amber, ≥16px readable
text, clear hierarchy): `EmployeeDetails`, `AwardSelector`, `Allowances`,
`WorkHours`, `PaySummary`, `OverviewBreakdown`, `DetailedBreakdown`,
`ImportantNotes`. Fix only genuine misalignments — preserve behaviour, layout
structure, and all functionality.

## Constraints

- Do NOT change pay-calculation logic: `src/helpers.js`, `calculatePay` in
  `src/App.js`, award rates, or any `.test.js` file (unless a snapshot/class name
  legitimately needs updating)
- Confine changes to: `DESIGN.md`, `tailwind.config.js`, `public/index.html`,
  `src/index.css`, `src/App.css`, `src/components/*.js`
- No new dependencies
- This is alignment, not redesign — keep the current component structure and copy

## Acceptance criteria

- `CI=true npm test -- --watchAll=false` — all 87 tests pass
- `CI=true npm run build` — succeeds with zero ESLint warnings
- `ubs .` — 0 criticals, warning count ≤ 15 (baseline: 0 critical / 15 warning /
  257 info)
- `DESIGN.md` describes this app — no `frontend/`, ExpiryMate, scanner, or
  Outfit/Inter references
- Google Fonts link loads Bricolage Grotesque + DM Sans only; rendered headings
  use Bricolage, body uses DM Sans
- `text-brand` dead classes gone
