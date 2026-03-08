# Phase 3: Multi-View UI & Pay Comparison - Research

**Researched:** 2026-03-09
**Domain:** React UI components, state management, financial data display
**Confidence:** HIGH

## Summary

Phase 3 delivers the pay comparison view by replacing PaySummary with a new OverviewBreakdown component that displays a week-level pay table (7 rows for weekly, 14 for fortnightly), allows per-day actual paid entry, detects discrepancies, and provides drill-down access to segment breakdowns via accordion. All new state (selectedDayIndex, actualPaidByDay, totalActualPaid) lives in App.js; components remain presentational. The penalty calculation engine and award data are unchanged (Phase 1-2 deliverables). Weekly and fortnightly pay cycles continue to function without modification.

**Primary recommendation:** Build OverviewBreakdown as a single presentational component that renders a bordered table with day rows, status badges (green "OK"/red "Underpaid" based on $0.01 tolerance), an accordion for segment drill-down, and live-updating discrepancy summary. Reuse DetailedBreakdown's segment table structure internally for the expanded day view. Store all comparison state (selected day, actual paid inputs) in App.js and pass as props.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Week overview layout:** Replaces existing PaySummary component as the main result view post-Calculate
- **Table columns:** Day | Hours | Calculated | Actual Paid (input) | Discrepancy | Status
- **Actual paid inputs:** Optional per-day inputs PLUS one period-level total input below the table
- **Status column behavior:**
  - Green "OK" badge if discrepancy <= $0.01 (Fair Work rounding tolerance)
  - Red "Underpaid" badge if discrepancy > $0.01
  - Neutral factual format for overpaid (no specific label)
  - "Enter actual paid to compare" hint before any input
- **Period summary format:** `Calculated: $350.00 | Paid: $326.67 | Difference: -$23.33` (neutral, factual, no emotive language)
- **Drill-down UX:** Accordion pattern — only one day expanded at a time, click to expand/collapse, reuses existing DetailedBreakdown segment table
- **Weekly/fortnightly adaptation:** Week overview table adapts to pay cycle (7 rows weekly, 14 rows fortnightly); period total label reflects cycle ("Weekly Actual Paid" vs "Fortnightly Actual Paid")
- **Data clearing:** Actual paid inputs clear on each Calculate; no localStorage persistence

### Claude's Discretion
- Exact Tailwind/Bootstrap CSS classes and visual polish (maintain blue-600/gray-50 palette)
- Row hover state styling for clickable day rows
- Accordion animation/transition on expand/collapse
- Table footer row for calculated total (if needed for layout)
- Error/edge case handling (days with zero/blank hours)

### Deferred Ideas (OUT OF SCOPE)
- None identified — Phase 3 scope is complete

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAY-01 | After calculating, user sees a week overview with calculated pay per day and a clear pass/fail indicator per day | OverviewBreakdown component with per-row status badges based on actual vs calculated discrepancy and $0.01 tolerance threshold |
| PAY-02 | User can enter the amount they were actually paid (for the pay period) to compare against the calculated amount | Period-level "Total Actual Paid" input + optional per-day inputs; live update via onChange handlers calling setters in App.js |
| PAY-03 | App shows the total discrepancy between calculated pay and actual pay | Period summary line using factual format: `Calculated: $X | Paid: $Y | Difference: $Z`; displayed below week table |
| PAY-04 | User can select a specific day from the week overview to see the full segment breakdown | Accordion on each day row; clicking toggles selectedDayIndex in App.js; expanded row renders segment table for selected day only |
| REG-01 | Weekly and fortnightly pay cycle selection continues to work as before | OverviewBreakdown receives results.dailyBreakdown array (7 or 14 items); period total label derived from cycle length; no changes to calculatePay() or cycle logic |

</phase_requirements>

## Standard Stack

No new packages required. Existing dependencies support Phase 3 fully:
- React 19 (CRA), react-bootstrap 2.10.9, Bootstrap 5.3.5
- @testing-library/react 16.3.0, @testing-library/user-event 13.5.0

## Architecture Patterns

### Presentational Component with State in Parent

All state (selectedDayIndex, actualPaidByDay, totalActualPaid) lives in App.js. OverviewBreakdown is purely presentational, receives props + callbacks.

```js
// App.js
const [selectedDayIndex, setSelectedDayIndex] = useState(null);
const [actualPaidByDay, setActualPaidByDay] = useState([]);
const [totalActualPaid, setTotalActualPaid] = useState('');
```

### Accordion Toggle (single-expand)

```js
onDayToggle={(index) => setSelectedDayIndex(selectedDayIndex === index ? null : index)}
```

### Discrepancy at Render Time (not stored in state)

```js
const discrepancy = day.pay - parseFloat(actualPaidByDay[index] || 0);
const isUnderpaid = discrepancy > 0.01;
const isOK = Math.abs(discrepancy) <= 0.01;
```

## Common Pitfalls

1. **Floating-point discrepancy without tolerance** — Use `Math.abs(val1 - val2) <= 0.01`, never `=== 0.01`
2. **Clearing actual paid on award switch** — Only clear inside calculatePay handler, NOT in handleSelectAward
3. **Storing discrepancy in state** — Calculate at render time from input values; derived state causes lag
4. **Multiple accordion rows open** — Single `selectedDayIndex` prevents multiple expansions
5. **Not passing cycleLength** — Derive from `results.dailyBreakdown.length`; label = cycleLength === 7 ? 'Weekly' : 'Fortnightly'

## Validation Architecture

| Framework | Command |
|-----------|---------|
| Jest + RTL | `npm test -- --watchAll=false src/components/OverviewBreakdown.test.js` |
| Full suite | `npm test -- --watchAll=false` |

---

*Research complete. Ready for planning.*
