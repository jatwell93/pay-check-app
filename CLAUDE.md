# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Dev server at http://localhost:3000
npm test         # Run tests in watch mode
npm test -- --watchAll=false  # Run tests once (CI mode)
npm run build    # Production build
```

## Architecture

Single-page React app (Create React App) — no backend, no routing, no state management library.

### Data Flow

All state lives in `App.js`. Components are presentational and receive props/callbacks from App.

```
App.js (state + calculatePay logic)
├── EmployeeDetails  — classification, employment type, age, custom rate inputs
├── Allowances       — checkbox/number inputs for award allowances
├── WorkHours        — time inputs per day, public holiday toggles, Calculate button
├── PaySummary       — totals display, toggle for detailed view
└── DetailedBreakdown — per-day segment breakdown table
```

### Key Files

- **`src/App.js`** — Holds `pharmacyAwardRates` (all base rates for both casual and full-time/part-time), junior percentage scales, allowance amounts, and the `calculatePay()` function. The `getPenaltyDescription` function here is separate from (and partially redundant with) the one in helpers.
- **`src/helpers.js`** — Core business logic: `calculatePayForTimePeriod` applies penalty rates **minute-by-minute** within penalty boundary windows (00:00, 07:00, 19:00, 24:00). Also exports `classifications`, `ageOptions`, `weekDays`.

### Penalty Rate Logic

Penalty boundaries split shifts into segments: midnight–07:00 (125%), 07:00–19:00 (ordinary), 19:00–midnight (125%). Saturday = 150%, Sunday = 200%, Public Holiday = 200%. Casual loading (125%) is applied for non-above-award casuals on standard weekday shifts. Overtime (>38 hrs/week) is calculated in `App.js` after per-day pay is summed — first 2 hours at 1.5×, remainder at 2×.

### Award Reference

Pharmacy Industry Award MA000012, effective July 1, 2024. All base rates are hardcoded in `pharmacyAwardRates` inside `App.js`. Junior rates only apply to Pharmacy Assistant Levels 1 and 2.

## Design Context

### Users
Pharmacy, retail, and hospitality workers (often young, often on mobile) checking whether they were paid correctly after a shift. The context is potentially stressful — they suspect underpayment and need to trust the tool's output. Mobile-first usage is common.

### Brand Personality
Approachable, trustworthy, and on the worker's side. Not corporate HR software — this is a personal advocate. Three words: **Clear, Warm, Confident.**

### Aesthetic Direction
Light mode. Teal brand (#0f766e) is strong and should be preserved. Typography uses Bricolage Grotesque for headings (bold personality, distinctive) + DM Sans for body (humanist, warm, readable). Anti-reference: cold, clinical fintech dashboards with gray everywhere.

### Design Principles
1. **Clarity over decoration** — every typographic choice should make data easier to read, not just more beautiful
2. **Hierarchy through contrast** — headings should be unmistakably different from body text in weight, size, and family
3. **Readable at small sizes** — body and label text must be ≥16px; workers reading on mobile after a shift need comfortable text
4. **Warm but precise** — rounded, humanist letterforms that feel approachable, paired with tabular numerics for data accuracy
5. **Mobile-first** — type scale tuned for small screens first
