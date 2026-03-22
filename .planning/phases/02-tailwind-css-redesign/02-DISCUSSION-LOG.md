# Phase 2: Tailwind CSS Redesign - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 02-tailwind-css-redesign
**Areas discussed:** Header design, Section layout & mobile, Loading & error states, Status indicators

---

## Header design

| Option | Description | Selected |
|--------|-------------|----------|
| Title + subtitle only | Clean, minimal. Award selector stays below. | ✓ |
| Title + award selector integrated | Award selector in header bar. | |
| Title only, no subtitle | No subtitle at all. | |

**Subtitle question:**

| Option | Description | Selected |
|--------|-------------|----------|
| "Check if you're being paid correctly" (static) | Direct, worker-focused. | ✓ |
| Dynamic subtitle (changes with award name) | Current behaviour. | |
| No subtitle | Title only. | |

**Header size:**

| Option | Description | Selected |
|--------|-------------|----------|
| Compact — py-4 | Moderate padding, doesn't dominate screen. | ✓ |
| Generous — py-8 | More visual impact. | |
| You decide | Claude picks. | |

---

## Section layout & mobile

**3-col grid on mobile:**

| Option | Description | Selected |
|--------|-------------|----------|
| 1 column, stacked | Existing md:grid-cols-3 collapses correctly. | ✓ |
| 2 columns on tablet, 1 on mobile | md:grid-cols-2 lg:grid-cols-3. | |

**WorkHours table on small screens:**

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll (overflow-x-auto) | Table keeps structure, user swipes. | ✓ |
| Card-per-day layout on mobile | Each day becomes a stacked card. | |
| You decide | Claude picks. | |

**Section order:**

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current order | Award → Employee → Allowances → Hours → Results. | ✓ |
| Move AwardSelector into EmployeeDetails | Consolidate fields. | |
| You decide | Claude reorders if better. | |

---

## Loading & error states

**Loading state:**

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle — spinner near Calculate button | Non-intrusive, form visible. | |
| Banner at top of page | Yellow/blue info banner while loading. | |
| Spinner overlay on the whole form | Semi-transparent overlay, blocks interaction. | ✓ |

**Error banner:**

| Option | Description | Selected |
|--------|-------------|----------|
| Red banner at top of page | Full-width, prominent. | ✓ |
| Subtle inline note near award selector | Small yellow/orange text, easy to miss. | |
| You decide | Claude picks. | |

**Dismissible:**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — × close button | User can acknowledge and dismiss. | ✓ |
| No — persistent until resolved | Always visible while error exists. | |

---

## Status indicators

**Overpaid colour:**

| Option | Description | Selected |
|--------|-------------|----------|
| Keep yellow for Overpaid | Three distinct states: green/red/yellow. | ✓ |
| Make Overpaid green | Only good/bad states. | |
| You decide | Claude picks. | |

**Weekly summary row:**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — prominent summary below table | Green/red "Underpaid by $X.XX" banner. | ✓ |
| No — per-day statuses sufficient | User adds up mentally. | |
| You decide | Claude adds if it improves UX. | |

**Weekly summary before data entered:**

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden — only appears after actual paid entered | Clean until user starts comparing. | ✓ |
| Placeholder text to guide the user | Visible instructional text. | |

---

## Claude's Discretion

- Exact navy hex value
- Spinner design (CSS or SVG)
- Form input focus ring styling
- Card/section border radius and shadow depth
- Footer and ImportantNotes section styling

## Deferred Ideas

None — discussion stayed within phase scope.
