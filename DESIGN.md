# Design

## Source of Truth

This is the design document for **Pay Checker** — the consumer-facing wage-checker
surface of the PharmIQ brand. It is used by pharmacy, retail, and hospitality
workers to check whether they were paid correctly after a shift.

- `brand-identity-pharma-apps/brand-identity/brand-guidelines.md` — the umbrella
  PharmIQ brand source. This app follows the **consumer pairing** from its Quick
  Reference (Fraunces + Source Sans 3) and the shared teal/amber colour
  system; it shares the platform display face (Fraunces) but not the platform
  UI faces.
- `tailwind.config.js` — the token source for this app (`brand.*`, semantic,
  `surface`, `edge`, `ink`, `fontFamily`, `borderRadius`, `boxShadow`).
- `.impeccable.md` — users, personality, and design principles.

When this file and the umbrella guide differ, the umbrella guide wins on brand
matters; this file wins on app-specific structure.

## Visual Theme

Light mode only. A single teal anchor (`#0F766E`) on calm neutral surfaces —
warm and human, never a cold clinical dashboard. The page surface is
`surface.page` (`#F8FAFC`); content sits in white cards with hairline
`edge.light` borders and soft shadows (`shadow-sm`). Depth comes from surfaces
and borders, not heavy shadow stacks.

## Brand Personality

**Clear, Warm, Confident** — a personal advocate, not corporate HR software.
The user is often young, on a phone, and stressed about a possible
underpayment. Every screen should feel like a trusted friend who is good at
reading payslips: plain language, obvious next actions, results they can trust.

## Colour System

All colour goes through the tokens in `tailwind.config.js` — no hardcoded hex
in classnames, no inline style colours.

- `brand.teal` `#0F766E` — the anchor: primary buttons, focus rings, active
  states, links. White text on teal passes AA (5.3:1).
- `brand.teal-50` / `brand.teal-100` — selection and active-state tints
  (selected rows, checked allowance items, active award panel).
- `brand.amber` `#D97706` — genuine urgency only (overpaid/discrepancy states).
  Scarce: if more than one amber element is visible at rest, reduce. Never put
  white text on amber — it fails contrast (2.8:1); use `brand.amber-dark`
  `#92400E` on amber surfaces instead.
- Semantic — `success` (verified), `critical` (underpaid, errors), `info`.
  Pair colour with text labels, never colour alone.
- `ink.primary` / `ink.secondary` — text. `ink.muted` `#94A3B8` is decorative
  only (badges, captions) — never informational body text.
- `surface` / `edge` — neutral page, card, and border tokens.

## Typography

The consumer pairing from the umbrella brand guide:

- **Headings: Fraunces** (`font-heading`, also the `h1–h4` stack in
  `src/index.css`). Optical-size serif, bold weights, tight tracking — a warm,
  editorial advocate voice with real personality.
- **Body: Source Sans 3** (`font-sans`, the body default in `src/index.css`).
  Humanist, highly legible at reading sizes, true tabular figures.
- Both are loaded from Google Fonts in `public/index.html` — keep that link to
  these two families only.
- Body and label text ≥16px; workers reading on mobile after a shift need
  comfortable text. Secondary helper text may use the app's 14px (`text-sm`)
  register; never go below it for words a user must read. Compact status
  chips/badges are the one exception — a 10px uppercase register, one to
  three words at most.
- **Tabular numerals on every money and hours value** (`tabular-nums`) — no
  exceptions. Amounts must align in tables and totals.
- Hierarchy through contrast: headings are unmistakably different from body in
  family, weight, and size. One `h1` (app header), `h2` per card section,
  `h3`/`h4` within.

## Components

- Sections are `.card` (see `src/index.css`): white surface, `edge.light`
  border, `rounded-lg`, `shadow-sm`. Do not nest cards — content inside a card
  uses tints (`brand.teal-50`), borders, and spacing, not more cards.
- Buttons: primary `bg-brand-teal` with white text, `rounded-md`, hover
  `brand.teal-dark`; one primary CTA per view.
- Forms: uppercase `brand.teal-dark` labels, inputs with `edge.mid` borders and
  teal focus rings; 44px-friendly touch targets on mobile.
- Tables: neutral `surface.page` header rows, uppercase teal-dark header labels,
  `divide-edge-light` row rules, `tabular-nums` on all numeric cells.
- Status: tinted badge pattern (`*-bg` surface + semantic text), e.g.
  `bg-critical-bg text-critical` for "Underpaid".
- Icons: inline SVG from one consistent stroke/weight system. No emoji or
  unicode glyphs standing in for icons.

## Layout

Single-page vertical flow, mobile-first. A slim navy app header, then a
`max-w-4xl` column: award selector → employee details + allowances → work
hours → pay audit breakdown → compliance notes → footer. No navigation chrome —
the whole tool is one scrolling document. Cards separate sections on the
neutral page surface; spacing is generous above headings, tight within groups.

## Motion

The existing system in `src/index.css` is the house style — document it, don't
change it:

- `fadeSlideUp` 420ms, `fadeIn` 220ms, `slideDown` 300ms — all with
  `--ease-out-quart` (`cubic-bezier(0.25, 1, 0.5, 1)`), applied via
  `.animate-fade-slide-up`, `.animate-fade-in`, `.animate-slide-down`.
- `detail-grid` / `detail-grid--open`: grid-template-rows `0fr → 1fr`
  expand/collapse for the day audit rows.
- `prefers-reduced-motion: reduce` disables all of the above.

Motion communicates state changes (results arriving, rows expanding), never
decorates. Keep it that way.

## Accessibility

Target WCAG AA. Body text ≥4.5:1 contrast; never informational text in
`ink.muted`. Focus rings are teal and always visible. Interactive rows are
keyboard-operable (Enter/Space) with `aria-expanded`. Live regions announce
loading states. Colour never carries meaning alone — pair it with text.

## Bans

- No gradient text; emphasis comes from weight or size
- No glassmorphism or blur as decoration
- No nested cards
- No decorative amber — amber only where urgency is real
- No coloured side-stripe borders above 1px on cards, list items, or callouts
- No monospace as a costume; code/measurement only
- No platform (non-consumer) typefaces on this surface — headings and body
  come from the Fraunces + Source Sans 3 pairing only
- No hardcoded colours bypassing the token system
