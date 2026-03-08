# Phase 3: Multi-View UI & Pay Comparison - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

After calculating, users see a week overview showing calculated pay per day alongside actual paid
inputs and discrepancy comparison. Users can drill into any day's segment breakdown. Phase 3 does
NOT change penalty calculation logic, award data, or the API/caching layer — those are Phase 1 and 2
deliverables. Weekly and fortnightly pay cycle support must continue to work.

</domain>

<decisions>
## Implementation Decisions

### Result layout
- Week overview replaces the existing PaySummary component as the main result after Calculate
- The existing DetailedBreakdown component is NOT shown below by default — it becomes the drill-down
  view, rendered inline via accordion when a day row is clicked
- Week overview table columns: Day | Hours | Calculated | Actual Paid (input) | Discrepancy | Status
- Period-level discrepancy summary line appears below the table (not above)
- No separate "mode toggle" — the week overview is the single result view

### Actual paid input
- Per-day "Actual Paid" column inputs are optional — most users will only know their period total
- One "Total Actual Paid" input field lives below the week table, above the discrepancy summary line
- Actual paid inputs clear on each new Calculate — no localStorage persistence
- Discrepancy values and status badges update live as the user types (no submit button needed)

### Pass/fail display
- Status column per row: colored badge — green "OK" / red "Underpaid"
  - Tolerance: <= $0.01 discrepancy = OK (Fair Work rounding tolerance)
  - Underpaid by > $0.01 = red "Underpaid"
  - Overpaid: no specific label decided — use neutral format
- Before any Actual Paid is entered: hint text "Enter actual paid to compare" in the Status column
- Period-level summary uses neutral factual format:
  `Calculated: $350.00 | Paid: $326.67 | Difference: -$23.33`
  This same format is used for all three outcomes (underpaid, overpaid, correct)

### Drill-down UX
- Clicking a day row expands the segment breakdown inline below that row (accordion pattern)
- Only one day can be expanded at a time — clicking a new row collapses the previous one
- Expanded segment table shows full detail: Time | Hours | Rate Type | Rate | Amount
  (reuses the existing DetailedBreakdown segment table structure)
- Drill-down is available immediately after Calculate, regardless of whether Actual Paid is entered
- Click the expanded row again to collapse it

### REG-01 (weekly/fortnightly)
- Week overview adapts to the pay cycle — 7 rows for weekly, 14 rows for fortnightly
- No changes to how the cycle is selected or how calculatePay() is called
- Period total "Actual Paid" label should reflect the cycle ("Weekly Actual Paid" vs "Fortnightly Actual Paid")

### Claude's Discretion
- Exact Tailwind CSS classes and visual polish (consistent with existing blue-600/gray-50 palette)
- Row hover state styling for clickable day rows
- Animation/transition on accordion expand/collapse
- Table footer row for Calculated total (if needed for layout)
- Error/edge case handling (days with no hours entered showing blank vs zero)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DetailedBreakdown.js`: Renders per-day segment tables. Phase 3 re-uses the segment table for
  a single selected day inside the accordion. May need a prop to accept a single day's data
  rather than the full results object.
- `PaySummary.js`: Will be replaced (or hidden) by the new week overview component. Its
  `results` prop shape is the reference for what data is available post-calculation.
- `results.dailyBreakdown` array in App.js: Each entry has `{ day, pay, hours, startTime,
  endTime, segments[] }` — this is the data source for the week overview table rows.
- `results.total`, `results.totalHours`, `results.overtimePay`, `results.allowances`:
  Available from calculatePay() for the table footer and period summary line.

### Established Patterns
- All new state (selectedDay, actualPaidPerDay, totalActualPaid) lives in App.js and is passed
  as props to the new OverviewBreakdown component
- Components are purely presentational — the accordion toggle logic (which day is expanded) lives
  in App.js as `selectedDayIndex` state, passed down and updated via callback
- Tailwind CSS inline classes: blue-600 for headings, gray-50 for panel backgrounds, border-rounded
  for card containers — match existing PaySummary and DetailedBreakdown styling
- Live update on typing: `onChange` on input fields calls setter directly (no debounce needed)

### Integration Points
- App.js: Add state — `selectedDayIndex` (null | number), `actualPaidByDay` (array),
  `totalActualPaid` (string), `showDetails` may need updating or repurposing
- PaySummary: Replace with new `OverviewBreakdown` component in App.js JSX
- DetailedBreakdown: Pass a single `day` object instead of full `results` when rendering
  inside the accordion, or add a `selectedDay` prop to filter internally

</code_context>

<specifics>
## Specific Ideas

- No specific references — open to standard approaches for table layout and accordion
- Period summary format exactly: `Calculated: $350.00 | Paid: $326.67 | Difference: -$23.33`
  (neutral, factual, no emotive language — the app is informational)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 3 scope

</deferred>

---

*Phase: 03-multi-view-ui-and-pay-comparison*
*Context gathered: 2026-03-09*
