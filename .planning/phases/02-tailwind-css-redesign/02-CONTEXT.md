# Phase 2: Tailwind CSS Redesign - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Install Tailwind CSS and redesign all app components with a clean professional look: navy header, white/light content areas, green/red/yellow status indicators for pay verification, and mobile-usable forms. App title changes to "Pay Check App". No changes to calculation logic or data flow.

</domain>

<decisions>
## Implementation Decisions

### Header design
- **D-01:** Navy header bar contains title ("Pay Check App") + static subtitle ("Check if you're being paid correctly") only — no award selector integrated into the header
- **D-02:** Subtitle is static — does NOT change dynamically with the selected award
- **D-03:** Compact header padding — `py-4` (not a tall hero section)
- **D-04:** Award selector stays as its own section below the header (current position preserved)

### Section layout & mobile
- **D-05:** 3-col grid (EmployeeDetails + Allowances) collapses to 1-column stacked on mobile — existing `md:grid-cols-3` pattern is correct, keep it
- **D-06:** WorkHours table uses horizontal scroll on small screens (`overflow-x-auto`) — do not reflow to card-per-day layout
- **D-07:** Section order unchanged: AwardSelector → EmployeeDetails+Allowances (3-col) → WorkHours → OverviewBreakdown → ImportantNotes → Footer

### Loading & error states
- **D-08:** While award rates are loading: spinner overlay on the whole form (semi-transparent overlay over the main content area, not just the button area). Form is not accessible during load.
- **D-09:** When API fails and app falls back to hardcoded rates: full-width red banner at the top of the page (below the header, above the award selector)
- **D-10:** Error banner is dismissible — include an × close button

### Status indicators
- **D-11:** Three pay status states — green (OK/Paid Correctly), red (Underpaid), yellow (Overpaid) — keep yellow for Overpaid
- **D-12:** Weekly summary status row: prominent summary below the OverviewBreakdown table, showing total calculated vs total paid + overall status (green/red/yellow). Hidden until the user has entered at least one "actual paid" amount.
- **D-13:** Weekly summary does NOT show a placeholder — it's completely hidden until actual paid data exists

### Claude's Discretion
- Exact navy hex (roadmap suggests `#1e3a5f` or similar — use judgment)
- Spinner design (CSS border-spin animation or SVG — whichever is simpler with no new deps)
- Form input styling details (border colour, focus ring colour)
- Card/section border styling (rounded corners, shadow depth)
- Footer styling
- ImportantNotes section styling (keep functional, make it tidy)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — UX-01 (Tailwind CSS, navy/white palette) and UX-02 (green/red status indicators) are the requirement IDs for this phase

### Roadmap & implementation notes
- `.planning/ROADMAP.md` — Phase 2 section has implementation notes: component order, Tailwind v4 mention, title change, accordion preservation

### Project instructions
- `CLAUDE.md` — project architecture, component structure, data flow rules

### Current styles to replace
- `src/App.css` — old CSS classes (`.container`, `.app-header`, `.section`, `.button`, etc.) — to be removed/replaced as components are converted
- `src/index.css` — global body styles — to be updated

### Key components to redesign
- `src/App.js` — shell, header, layout — uses old CSS class names (`container`, `app-header`) mixed with some Tailwind
- `src/components/AwardSelector.js` — award selection section
- `src/components/EmployeeDetails.js` — classification, employment type, age, custom rate
- `src/components/Allowances.js` — allowance checkboxes/inputs
- `src/components/WorkHours.js` — already has some Tailwind classes; needs review and completion
- `src/components/OverviewBreakdown.js` — already has green/red status badges and Tailwind; needs the weekly summary row added
- `src/components/ImportantNotes.js` — notes section at bottom

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OverviewBreakdown.js` already has green/red/yellow Tailwind status badges (`bg-green-100 text-green-800`, `bg-red-100 text-red-800`, `bg-yellow-100 text-yellow-800`) — these are the colour pattern to standardise across the app
- `WorkHours.js` already has partial Tailwind (`border rounded p-1`, `bg-green-600 text-white` Calculate button) — needs completion, not full rewrite
- `App.js` render already uses `grid grid-cols-1 md:grid-cols-3 gap-6 mb-8` for the 3-col section — correct, keep it

### Established Patterns
- Tailwind is NOT currently installed — utility classes in components are currently ignored (not in package.json, no CDN). Tailwind must be installed as part of this phase. Researcher should confirm the correct installation approach for react-scripts 5.0.1 (CRA). The roadmap mentions Tailwind v4, but compatibility with CRA needs verification — v3 is the safer default for CRA.
- Old CSS lives in `src/App.css` using traditional class names (`.container`, `.section`, `.button`, etc.). These conflict with Tailwind's utility approach. Plan should replace old CSS classes with Tailwind utilities as each component is converted, then remove App.css classes no longer needed.
- `awardLoading` (bool) and `awardError` (string|null) state already exists in App.js — the loading overlay and error banner just need styled components wired to these existing state values

### Integration Points
- Loading overlay wraps the main content area below the header — triggered by `awardLoading` state in App.js
- Error banner renders below header / above AwardSelector — triggered by `awardError` state in App.js; dismissal sets `awardError` to null (or a separate `errorDismissed` state flag)
- Weekly summary in OverviewBreakdown needs to read `actualPaidByDay` array to detect whether any entries exist before showing

</code_context>

<specifics>
## Specific Ideas

- App title update: "Pay Check App" (remove "Pharmacy Industry Award Pay Calculator" dynamic title from the header — it was award-specific and confusing)
- The spinner overlay should cover the form area but the navy header should remain visible above it (overlay goes inside `.container`, not over the whole viewport)
- Accordion drill-down UX in OverviewBreakdown (clicking a day row expands inline segment table) — preserve this interaction, just restyle

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-tailwind-css-redesign*
*Context gathered: 2026-03-22*
