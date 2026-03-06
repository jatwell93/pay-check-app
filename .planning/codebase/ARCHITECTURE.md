# Architecture

**Analysis Date:** 2026-03-07

## Pattern Overview

**Overall:** Single-page application (SPA) with monolithic component architecture using React's built-in state management (`useState`).

**Key Characteristics:**
- Unidirectional data flow from App component to child components
- All state management centralized in top-level `App.js`
- Presentation logic tightly coupled with business logic
- Heavy calculation logic in helpers module
- No routing, single view application
- Inline award rates and penalty calculation rules

## Layers

**Presentation Layer:**
- Purpose: Render UI and handle user interactions (inputs, buttons, displays)
- Location: `src/components/`
- Contains: React functional components for UI rendering
- Depends on: App.js for state and callbacks, helpers.js for data lookups
- Used by: App.js orchestrates component composition

**Business Logic / Calculation Layer:**
- Purpose: Compute pay calculations, penalties, allowances, and break time
- Location: `src/helpers.js`
- Contains: `calculatePayForTimePeriod()`, `calculateBreakTime()`, penalty rate logic, classification/age data
- Depends on: date-fns library for time manipulation
- Used by: App.js calls main calculation functions

**State Management Layer:**
- Purpose: Manage application state (employee data, work hours, allowances, results)
- Location: `src/App.js`
- Contains: useState hooks for all state, calculation orchestration, event handlers
- Depends on: helpers.js for calculations
- Used by: Provides props to all child components

**Styling Layer:**
- Purpose: Visual presentation and layout
- Location: `src/App.css`, `src/index.css`
- Contains: CSS rules for components, layout, colors, animations
- Depends on: Tailwind CSS utility classes (applied inline in JSX)
- Used by: Applied through className attributes in components

## Data Flow

**User Input to Calculation:**

1. User selects employee details in `EmployeeDetails` component
2. `handleTimeChange()` in App.js updates `weeklyData` state
3. User enters work hours in `WorkHours` component
4. User clicks "Calculate Pay" button
5. `calculatePay()` in App.js orchestrates calculation:
   - Extracts base rate from `pharmacyAwardRates` object
   - Applies junior rates if applicable (pharmacy assistants only)
   - Calls `calculatePayForTimePeriod()` from helpers for each day
   - Calculates overtime (full-time/part-time only, >38 hours)
   - Calculates allowances based on selections
   - Aggregates results into `results` state object
6. Results displayed in `PaySummary` and `DetailedBreakdown` components

**State Object Structure:**
```javascript
{
  baseRate: number,           // Hourly base rate
  totalHours: number,         // Total hours worked (less breaks)
  totalPay: number,           // Pay for ordinary hours
  overtimeHours: number,      // Hours exceeding 38
  overtimePay: number,        // Overtime pay calculation
  allowances: number,         // Total allowances
  total: number,              // Sum of all pay components
  dailyBreakdown: [           // Per-day details
    {
      day: string,
      startTime: string,
      endTime: string,
      hours: number,
      pay: number,
      segments: [             // Segments with different penalty rates
        {
          startTime: string,
          endTime: string,
          day: string,
          hours: number,
          rate: number,
          penaltyMultiplier: number,
          penaltyDescription: string,
          pay: number
        }
      ]
    }
  ],
  allowanceBreakdown: [       // Per-allowance details
    {
      name: string,
      amount: number
    }
  ]
}
```

**State Management:**

State updates occur through event handlers triggered by:
- User input changes → calls `set*` functions
- Calculate button click → calls `calculatePay()`

No side effects, no async operations, no external API calls.

## Key Abstractions

**pharmacyAwardRates Object:**
- Purpose: Centralized source of truth for award rates and allowances
- Location: `src/App.js` (lines 35-93)
- Structure:
  - `fullTimePartTime`: Base rates by classification level
  - `casual`: Casual loading rates by classification
  - `juniorPercentages`: Age-based rate reductions for assistants
  - `allowances`: Fixed dollar amounts for various allowances
- Pattern: Lookup table accessed during calculation

**Classification System:**
- Purpose: Define employee roles with associated pay rates
- Location: `src/helpers.js` (classifications array, lines 15-31)
- Categories: Assistant levels 1-4, Student 1-4, Intern 1-2, Pharmacist variants, Above Award
- Pattern: Array of objects with `id` and `name` properties

**Penalty Rate System:**
- Purpose: Apply multipliers to base rate for different work conditions
- Location: `src/helpers.js` (getPenaltyRateDetails function)
- Rates:
  - Saturday: 1.5x
  - Sunday/Public Holiday: 2x
  - Early morning (00:00-07:00): 1.25x
  - Evening (19:00-23:59): 1.25x
  - Casual loading: 1.25x
  - Ordinary time: 1x
- Pattern: Rule-based multiplier lookup

**Break Time Calculation:**
- Purpose: Deduct unpaid break time from total hours
- Location: `src/helpers.js` (calculateBreakTime function)
- Rules:
  - < 4 hours: No break
  - 4-5 hours: Paid 10-minute break (no deduction)
  - 5-7.6 hours: 30-minute unpaid break (0.5 hour deduction)
  - 7.6+ hours: 30-minute unpaid + two 10-minute paid (0.5 hour deduction)
- Pattern: Conditional break deduction

## Entry Points

**Application Root:**
- Location: `src/index.js`
- Triggers: Page load in browser
- Responsibilities: Mount React app to DOM, render App component

**Main App Component:**
- Location: `src/App.js`
- Triggers: Initial render and state updates
- Responsibilities:
  - Manage all application state (employee, hours, allowances, results)
  - Render header, grid layout with three columns, work hours table, detailed breakdown
  - Orchestrate pay calculation when button clicked
  - Pass props down to child components

**Calculate Pay Handler:**
- Location: `src/App.js` (calculatePay function, lines 145-284)
- Triggers: User clicks "Calculate Pay" button
- Responsibilities:
  - Determine base rate (award or custom)
  - Apply junior rates if applicable
  - Loop through daily data and calculate pay for each day
  - Apply overtime rules for full-time/part-time
  - Calculate allowances
  - Aggregate and store results in state

## Error Handling

**Strategy:** Graceful degradation with console warnings

**Patterns:**
- Invalid base rate: Returns `{ hours: 0, pay: 0, breakdown: [] }` and logs warning (helpers.js line 106)
- Missing required fields: Skipped in loop (dailyBreakdown iteration only processes days with times)
- Invalid age selection: Filtered by classification restrictions (EmployeeDetails disables age select)
- No error boundaries implemented
- No try/catch blocks in place

## Cross-Cutting Concerns

**Logging:**
- Console.warn used for invalid base rate scenarios in `calculatePayForTimePeriod()`
- No structured logging or log levels

**Validation:**
- Client-side HTML5 validation on number inputs (min="0")
- Type checking on input values before calculations (parseFloat, isNaN checks)
- Disabled form fields for inapplicable options (age select, home medicine review checkbox)
- No server-side validation

**Authentication:**
- Not applicable - no user login or authentication
- No access control or role-based restrictions
- Purely informational tool, no data persistence

**Calculation Precision:**
- Fixed to 2 decimal places for currency display (toFixed(2))
- Minute-by-minute pay calculation for accuracy across penalty boundaries
- Time parsing and manipulation using date-fns library

---

*Architecture analysis: 2026-03-07*
