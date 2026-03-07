# Architecture Patterns: FWC API Integration for Multi-Award Pay Verification SPA

**Domain:** React SPA payslip verification tool with external API-driven pay rates
**Researched:** 2026-03-07
**Current stack:** React 19 SPA, Create React App, no backend, no routing
**Constraint:** Preserve existing minute-by-minute penalty calculation engine

---

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    React App (App.js)                           │
│                  Centralized State Manager                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Award Selector   │  │ Employee Details │  │  Work Hours  │ │
│  │ (NEW)            │  │ (REFACTORED)     │  │ (EXISTING)   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   Allowances     │  │  Mode Toggle     │  │ Comparison   │ │
│  │  (REFACTORED)    │  │   (NEW)          │  │  Input (NEW) │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
│                     Payment Results                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Overview Mode: Week Summary + Pass/Fail by Day           │ │
│  │ Drill-Down Mode: Single Day Segment Breakdown            │ │
│  │ Comparison Mode: Actual vs Calculated with Discrepancy   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
          ┌─────────────────────────────────────┐
          │  API Service Layer (NEW)            │
          ├─────────────────────────────────────┤
          │ • fetchAwardRates(awardId)          │
          │ • getAwardList()                    │
          │ • Cache management (localStorage)   │
          │ • Error handling & fallback         │
          └─────────────────────────────────────┘
                            ↓
          ┌─────────────────────────────────────┐
          │  FWC MAAPI v1                       │
          │  (Modern Awards Pay Database)       │
          └─────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Status |
|-----------|---|---|---|
| **AwardSelector** | User selects from 2-4 awards; fetches rates on change | App.js, APIService | NEW |
| **EmployeeDetails** | Select classification and employment type based on current award | App.js, AwardSelector | REFACTORED |
| **WorkHours** | Enter shift times and public holiday flags | App.js | EXISTING |
| **Allowances** | Allowance selection based on selected award | App.js, AwardSelector | REFACTORED |
| **ModeToggle** | Switch between Overview (week), Drill-Down (day), and Comparison modes | App.js | NEW |
| **PaySummary** | Show totals; trigger detail view toggle | App.js | EXISTING (evolves) |
| **OverviewBreakdown** | Weekly grid: days with calculated vs actual pay, pass/fail indicator | App.js | NEW |
| **DrillDownBreakdown** | Single day: segment-by-segment breakdown (time, hours, rate, penalty, pay) | App.js | NEW |
| **ComparisonView** | Side-by-side: calculated vs actual paid; highlight discrepancies | App.js | NEW |

### Data Flow

#### 1. Award Selection → Rate Fetch → State Update

```
User selects award in AwardSelector
  ↓
handleAwardChange(awardId)
  ↓
APIService.fetchAwardRates(awardId)
  ├─ Check localStorage cache
  ├─ If miss: call FWC MAAPI v1
  ├─ Parse response into normalized structure
  └─ Store in localStorage with expiry (e.g., 90 days)
  ↓
setRates(parsedRates)
setAwardMetadata(metadata)
  ↓
EmployeeDetails re-renders with new classifications
Allowances re-renders with new allowance names/amounts
Calculation engine stays unchanged
```

#### 2. Calculation Pipeline (Unchanged Core Logic)

```
User enters shift times → Click Calculate
  ↓
calculatePay()
  ├─ Get baseRate from rates[classification][employmentType]
  ├─ Apply junior rates if applicable (award-specific logic)
  ├─ Loop through weeklyData:
  │   └─ calculatePayForTimePeriod(day, times, baseRate, ...)
  │       └─ [EXISTING PENALTY ENGINE - NO CHANGES]
  │           ├─ Split shift by penalty boundaries (00:00, 07:00, 19:00)
  │           ├─ Apply multipliers minute-by-minute
  │           └─ Return segments with rates, multipliers, pay
  ├─ Calculate overtime (38 hrs threshold for FT/PT)
  ├─ Calculate allowances from rates.allowances
  └─ Aggregate into results state
  ↓
setResults(aggregatedResults)
  ↓
Display via OverviewBreakdown (week) or DrillDownBreakdown (day)
```

#### 3. Multi-Award Support: Rate Object Structure

**Current (Hardcoded Pharmacy Rates):**
```javascript
const pharmacyAwardRates = {
  fullTimePartTime: { 'pharmacy-assistant-1': { base: 25.99 }, ... },
  casual: { 'pharmacy-assistant-1': { base: 32.49 }, ... },
  juniorPercentages: { 'under-16': 0.45, ... },
  allowances: { homeMedicineReview: 17.96, ... }
}
```

**Proposed (API-Driven, Award-Agnostic):**
```javascript
const awardRates = {
  awardId: 'MA000012',           // Pharmacy
  awardName: 'Pharmacy Industry Award',
  effectiveDate: '2024-07-01',
  classifications: [
    {
      id: 'pharmacy-assistant-1',
      name: 'Pharmacy Assistant Level 1',
      fullTimePartTime: { base: 25.99 },
      casual: { base: 32.49 },
      juniorRates: { 'under-16': 0.45, ... }
    },
    ...
  ],
  allowances: [
    {
      id: 'homeMedicineReview',
      name: 'Home Medicine Review',
      fullTime: 17.96,
      partTime: null,
      casual: null
    },
    ...
  ],
  penalties: {
    saturday: 1.5,
    sunday: 2.0,
    publicHoliday: 2.0 || 2.5,  // Award-specific
    earlyMorning: { start: '00:00', end: '07:00', rate: 1.25 },
    evening: { start: '19:00', end: '00:00', rate: 1.25 },
    casualLoading: 1.25
  }
}
```

### State Management Strategy

**App.js state shape (evolved):**

```javascript
const [selectedAward, setSelectedAward] = useState('MA000012');  // NEW
const [awardRates, setAwardRates] = useState(null);              // NEW
const [awardLoading, setAwardLoading] = useState(false);         // NEW
const [awardError, setAwardError] = useState(null);              // NEW

// Existing state (minimal changes)
const [classification, setClassification] = useState('pharmacy-assistant-1');
const [employmentType, setEmploymentType] = useState('full-time');
const [weeklyData, setWeeklyData] = useState([...]);
const [allowances, setAllowances] = useState({...});
const [results, setResults] = useState(null);

// NEW: Mode and comparison
const [viewMode, setViewMode] = useState('overview');             // 'overview' | 'drillDown' | 'comparison'
const [selectedDayForDrillDown, setSelectedDayForDrillDown] = useState('Monday');  // NEW
const [actualPaidAmount, setActualPaidAmount] = useState('');     // NEW (for comparison)
```

**State initialization & side effects:**

```javascript
useEffect(() => {
  // On mount: load award list and preload default award
  loadAwardList();
  if (selectedAward) {
    loadAwardRates(selectedAward);
  }
}, []);

useEffect(() => {
  // When award changes: refetch rates, reset classification
  if (selectedAward) {
    loadAwardRates(selectedAward);
    setClassification(null);  // Force user to re-select
    setResults(null);         // Clear old calculation
  }
}, [selectedAward]);
```

---

## Component Changes Required

### 1. AwardSelector (NEW)

**Purpose:** Allow users to select from 2-4 major awards

**Props:** `selectedAward`, `onAwardChange`, `awardLoading`, `awardError`

**Internal state:** None (controlled by parent)

**Behavior:**
- Dropdown list of awards: Pharmacy, Retail, Hospitality, etc.
- Disable selection while loading
- Show error message if fetch fails
- On change: trigger `onAwardChange(awardId)` in parent

**Example JSX:**
```jsx
<select value={selectedAward} onChange={(e) => onAwardChange(e.target.value)} disabled={awardLoading}>
  <option value="">Select an Award</option>
  <option value="MA000012">Pharmacy Industry Award</option>
  <option value="MA000010">General Retail Industry Award</option>
  ...
</select>
```

### 2. EmployeeDetails (REFACTORED)

**Changes:**
- Remove hardcoded `classifications` import from helpers.js
- Receive `classifications` as prop from App.js (derived from `awardRates`)
- Receive `juniorAgeOptions` as prop (award-specific age tiers)
- Validate selected classification against current award

**Example prop changes:**
```jsx
// Old
<EmployeeDetails classification={classification} ... />

// New
<EmployeeDetails
  classification={classification}
  classifications={awardRates?.classifications || []}
  ageOptions={getAgeOptionsForClassification(classification, awardRates)}
  ...
/>
```

### 3. Allowances (REFACTORED)

**Changes:**
- Remove hardcoded `allowances` object lookups from App.js
- Receive allowance names and amounts from `awardRates.allowances`
- Dynamically render checkboxes/inputs based on award's allowance list
- Calculate allowance amounts using award-specific values

**Example:**
```jsx
// Old
if (allowances.homeMedicineReview) {
  totalAllowances += pharmacyAwardRates.allowances.homeMedicineReview;
}

// New
const allowanceConfig = awardRates.allowances.find(a => a.id === 'homeMedicineReview');
if (allowances.homeMedicineReview && allowanceConfig) {
  const amount = employmentType === 'fullTime' ? allowanceConfig.fullTime : allowanceConfig.casual;
  totalAllowances += amount;
}
```

### 4. ModeToggle (NEW)

**Purpose:** Switch between week overview, single-day drill-down, and comparison view

**Props:** `currentMode`, `onModeChange`, `selectedDay`, `onDaySelect`

**Behavior:**
- Three buttons: Overview, Drill-Down, Comparison
- When Drill-Down selected: show day selector
- On day click: set `selectedDayForDrillDown`

**Example JSX:**
```jsx
<div className="mode-toggle">
  <button className={currentMode === 'overview' ? 'active' : ''} onClick={() => onModeChange('overview')}>
    Week Overview
  </button>
  <button className={currentMode === 'drillDown' ? 'active' : ''} onClick={() => onModeChange('drillDown')}>
    Single Day
  </button>
  <button className={currentMode === 'comparison' ? 'active' : ''} onClick={() => onModeChange('comparison')}>
    Compare Pay
  </button>
</div>
```

### 5. OverviewBreakdown (NEW)

**Purpose:** Display week summary with calculated vs actual pay, pass/fail per day

**Props:** `results`, `actualPaidAmount`

**Rendering logic:**
```
Row per day:
  Day name | Hours | Calculated Pay | Actual Paid | Discrepancy | Status (✓/✗)

Footer:
  Weekly Total | Calculated | Actual | Total Discrepancy | Pass/Fail
```

**Example table row:**
```
Monday  | 8.5 | $246.50 | $240.00 | -$6.50 | ✗ UNDERPAID
```

### 6. DrillDownBreakdown (NEW)

**Purpose:** Display segment-by-segment breakdown for a selected day (replaces current DetailedBreakdown for single-day view)

**Props:** `results`, `selectedDay`

**Rendering logic:**
```
Selected day: [Day selector dropdown]

Segments table (same as current DetailedBreakdown):
  Start | End | Hours | Rate ($) | Multiplier | Description | Pay ($)

Day Total: [hours] hours = $[pay]
```

### 7. ComparisonView (NEW)

**Purpose:** Side-by-side actual vs calculated, highlight underpayment

**Props:** `results`, `actualPaidAmount`, `onActualAmountChange`

**Behavior:**
- Input field for "Actual amount paid" (currency)
- Display boxes:
  - Calculated Total Pay
  - Actual Paid
  - Discrepancy (color-coded: red for underpay, green for overpay)
- Message: "You may have been underpaid $X.XX"

**Example:**
```
┌─────────────────┬─────────────────┬──────────────────┐
│ Calculated Pay  │ Actual Paid      │ Discrepancy      │
├─────────────────┼─────────────────┼──────────────────┤
│ $1,847.32       │ $1,824.00        │ -$23.32 UNDERPAY │
└─────────────────┴─────────────────┴──────────────────┘

You may have been underpaid $23.32 for the week.
```

---

## API Service Layer

### Module: `src/services/awardRatesService.js` (NEW)

**Responsibilities:**
- Fetch award list from FWC MAAPI v1
- Fetch individual award rates and cache them
- Normalize API responses to internal structure
- Handle network errors and provide fallback data

**Key functions:**

```javascript
export const getAwardList = async () => {
  // Returns: [{ id: 'MA000012', name: 'Pharmacy Industry Award' }, ...]
  // Caches for session
}

export const getAwardRates = async (awardId) => {
  // Check localStorage cache first (expiry: 90 days)
  // If miss: call FWC MAAPI v1
  // Normalize response to internal structure
  // Return: awardRates object (see structure above)
}

export const normalizeAwardRates = (apiResponse) => {
  // Transform FWC API response to internal format
  // Handle missing/optional fields
  // Return: awardRates object
}

export const getCachedAwardRates = (awardId) => {
  // Get from localStorage if available and not expired
  // Return: awardRates object or null
}

export const setCachedAwardRates = (awardId, rates, expiryDays = 90) => {
  // Store in localStorage with expiry timestamp
}
```

**Error handling strategy:**
```javascript
// If API call fails:
// 1. Check if stale cache exists (past expiry) → use it with warning banner
// 2. If no cache at all → show error, disable award selection
// 3. Network error handling: retry logic or offline detection

export const getAwardRatesWithFallback = async (awardId) => {
  try {
    return await fetchFromAPI(awardId);
  } catch (error) {
    const staleCache = getStaleCache(awardId);
    if (staleCache) {
      showWarningBanner('Using cached rates — latest data unavailable');
      return staleCache;
    }
    throw new Error('Unable to load award rates');
  }
}
```

---

## Refactoring the Calculation Engine

### Strategy: Minimal Changes, Data-Driven Approach

**Current state:**
- `calculatePayForTimePeriod()` in helpers.js uses hardcoded penalty rates and employment type logic
- `App.js` uses hardcoded `pharmacyAwardRates` for lookups
- `getPenaltyDescription()` in App.js is tightly coupled to Pharmacy Award

**Changes needed:**

#### 1. Extract Penalty Rates to State

Move penalty boundaries from helpers.js to App.js state, derived from `awardRates`:

```javascript
// Current (hardcoded in helpers.js line 135-142)
const penaltyBoundaries = [0, 7 * 60, 19 * 60, 24 * 60];

// New (from award config)
const penaltyBoundaries = awardRates?.penalties?.timeBoundaries || [0, 7 * 60, 19 * 60, 24 * 60];
const saturdayRate = awardRates?.penalties?.saturday || 1.5;
const sundayRate = awardRates?.penalties?.sunday || 2.0;
```

#### 2. Parameterize `calculatePayForTimePeriod()`

Add optional `penaltyConfig` parameter (falls back to defaults if not provided):

```javascript
// Old signature
export const calculatePayForTimePeriod = (day, startTime, endTime, baseRate, employmentType, customRate, classification)

// New signature (backwards compatible)
export const calculatePayForTimePeriod = (day, startTime, endTime, baseRate, employmentType, customRate, classification, penaltyConfig = null)

// Inside function:
const effectivePenaltyConfig = penaltyConfig || DEFAULT_PHARMACY_PENALTIES;
```

This preserves existing behavior if `penaltyConfig` is not provided.

#### 3. Make `getPenaltyDescription()` Award-Aware

Receive penalty config as parameter instead of hardcoding Pharmacy values:

```javascript
// Old (in App.js)
const getPenaltyDescription = (segmentDay, timeString, penaltyRate) => {
  if (segmentDay === 'Saturday' && penaltyRate === 1.5) return 'Saturday (Time and a half)';
  ...
}

// New (in helpers.js)
export const getPenaltyDescription = (segmentDay, timeString, penaltyRate, penaltyConfig) => {
  if (segmentDay === 'Saturday' && penaltyRate === penaltyConfig?.saturday) {
    return `Saturday (${(penaltyConfig.saturday * 100).toFixed(0)}%)`;
  }
  ...
}
```

---

## Build Order & Dependencies

### Phase 1: Foundation (API & State Management)

**What:** Create API service layer and add award selection state
**Why:** Everything depends on fetching the right rates
**Depends on:** Nothing
**Blockers:** None

1. Create `src/services/awardRatesService.js`
   - Stub FWC MAAPI v1 calls (mock responses for testing)
   - Implement caching logic
   - Create normalizers

2. Add award selection to `App.js` state
   - `selectedAward`, `awardRates`, `awardLoading`, `awardError`
   - `useEffect` to load award on mount

3. Create `AwardSelector` component
   - Static dropdown with 2-4 awards
   - Connect to App state

4. Run e2e tests: Award selection → Rate fetch → State update

**Output:** Award can be selected, rates fetched, state updated. Calculation still uses old hardcoded rates.

---

### Phase 2: Decouple Calculations from Hardcoded Data

**What:** Refactor calculation engine to use `awardRates` state instead of `pharmacyAwardRates`
**Why:** Enable support for any award's rates
**Depends on:** Phase 1
**Blockers:** None

1. Add penalty config to App.js state
   ```javascript
   const penaltyConfig = awardRates?.penalties || DEFAULT_PHARMACY_PENALTIES;
   ```

2. Refactor `calculatePay()` in App.js
   - Use `awardRates.classifications[classification]` instead of `pharmacyAwardRates`
   - Pass `penaltyConfig` to `calculatePayForTimePeriod()`
   - Use `awardRates.allowances` for allowance lookups

3. Update `calculatePayForTimePeriod()` in helpers.js
   - Add optional `penaltyConfig` parameter
   - Use provided config or defaults

4. Refactor `getPenaltyDescription()` in helpers.js
   - Move from App.js to helpers.js
   - Accept `penaltyConfig` as parameter
   - Remove hardcoded Pharmacy references

5. Run unit tests: Calculation with Pharmacy rates produces same results as before

6. Run e2e tests: Multi-award calculation produces correct results

**Output:** Calculation engine is award-agnostic. Existing Pharmacy calculations unchanged.

---

### Phase 3: Refactor Components for Multi-Award Support

**What:** Update EmployeeDetails, Allowances to derive values from `awardRates`
**Why:** Show correct classifications and allowances for selected award
**Depends on:** Phase 2
**Blockers:** None

1. Refactor `EmployeeDetails` component
   - Accept `classifications` as prop
   - Render classifications from `awardRates.classifications`
   - Accept `ageOptions` as prop (award-specific)
   - Validate against current award

2. Refactor `Allowances` component
   - Accept `allowanceList` as prop
   - Render checkboxes/inputs from `awardRates.allowances`
   - Use award-specific allowance amounts in `calculatePay()`

3. Update `App.js` to pass new props
   ```javascript
   <EmployeeDetails
     classifications={awardRates?.classifications || []}
     ageOptions={deriveAgeOptions(awardRates)}
     ...
   />
   ```

4. Run component tests: Classifications and allowances update when award changes

5. Run e2e tests: User changes award → classifications and allowances refresh

**Output:** Components dynamically reflect selected award.

---

### Phase 4: Add Week Overview & Drill-Down Modes

**What:** Create ModeToggle, OverviewBreakdown, DrillDownBreakdown components
**Why:** Support full week overview and single-day drill-down
**Depends on:** Phase 2 (for working calculations)
**Blockers:** None

1. Create `ModeToggle` component
   - Three buttons: Overview, Drill-Down, Comparison
   - Connect to App state: `viewMode`, `selectedDayForDrillDown`

2. Create `OverviewBreakdown` component
   - Weekly grid: days with calculated pay
   - "Actual paid" input field
   - Pass/fail indicator per day

3. Refactor existing `DetailedBreakdown` into `DrillDownBreakdown`
   - Select day with dropdown
   - Show segment breakdown for selected day

4. Update `PaySummary` component
   - Integrate mode toggle
   - Show summary total with pass/fail for full week

5. Update App.js to conditionally render:
   ```javascript
   {viewMode === 'overview' && <OverviewBreakdown ... />}
   {viewMode === 'drillDown' && <DrillDownBreakdown ... />}
   {viewMode === 'comparison' && <ComparisonView ... />}
   ```

6. Run e2e tests: Toggle modes, select days, view breakdowns

**Output:** Users can view week overview or drill down to single day.

---

### Phase 5: Add Actual vs Calculated Comparison

**What:** Create ComparisonView component with discrepancy detection
**Why:** Help users identify underpayment
**Depends on:** Phase 4
**Blockers:** None

1. Create `ComparisonView` component
   - Input: "Actual amount paid"
   - Display: Calculated, Actual, Discrepancy, Recommendation

2. Update App.js state
   - `actualPaidAmount`, `setActualPaidAmount`

3. Implement discrepancy calculation
   ```javascript
   const discrepancy = results.total - parseFloat(actualPaidAmount);
   const status = discrepancy > 0 ? 'UNDERPAID' : discrepancy < 0 ? 'OVERPAID' : 'CORRECT';
   ```

4. Add warning/info banner:
   - Red for underpayment: "You may have been underpaid $X.XX"
   - Green for overpayment: "You may have been overpaid $X.XX"

5. Run e2e tests: Enter actual amount → see discrepancy with message

**Output:** Users can compare calculated pay against what they actually received.

---

### Phase 6: Real API Integration & Testing

**What:** Connect real FWC MAAPI v1 endpoints, test with multiple awards
**Why:** Validate integration before launch
**Depends on:** Phase 5
**Blockers:** FWC API key setup, API availability

1. Update `awardRatesService.js` with real FWC MAAPI v1 endpoints
   - Implement actual fetch calls
   - Add authentication (subscription key handling)
   - Implement retry logic for failures

2. Test with 2-4 real awards
   - Pharmacy (MA000012)
   - Retail (MA000010)
   - Hospitality (MA000020) — if available
   - One other award

3. Validate normalization:
   - Does every award's rates structure normalize correctly?
   - Are edge cases handled (missing allowances, non-standard penalties)?

4. Test cache expiry and invalidation

5. Load test: Can we handle popular awards without rate limiting?

6. Run full e2e tests: Multi-award calculation, mode switching, comparison

**Output:** Real FWC API integration complete and tested.

---

## Data Flow Diagrams

### Initial Load Sequence

```
Mount App.js
  ↓
useEffect: loadAwardList()
  ├─ fetch() FWC MAAPI /awards
  ├─ normalize to [{ id, name }, ...]
  └─ setState(awardList, selectedAward='MA000012')
  ↓
useEffect: loadAwardRates('MA000012')
  ├─ check localStorage cache
  ├─ if miss: fetch() FWC MAAPI /rates/MA000012
  ├─ normalize to awardRates object
  ├─ cache in localStorage
  └─ setState(awardRates)
  ↓
Render: AwardSelector + EmployeeDetails + Allowances (all using awardRates)
```

### Award Change Sequence

```
User selects new award in AwardSelector
  ↓
onAwardChange('MA000010')
  ├─ setSelectedAward('MA000010')
  ├─ setClassification(null)  // Force re-selection
  ├─ setResults(null)         // Clear old calculation
  └─ setViewMode('overview')  // Reset to overview
  ↓
useEffect: loadAwardRates('MA000010')
  ├─ check cache
  ├─ if miss: fetch FWC MAAPI
  ├─ normalize
  └─ setState(awardRates)
  ↓
EmployeeDetails re-renders with new classifications
Allowances re-renders with new allowances
Calculation results cleared
```

### Calculation Sequence

```
User enters shifts → clicks Calculate
  ↓
calculatePay()
  ├─ getClassification from awardRates
  ├─ getBaseRate: awardRates.classifications[classification][employmentType]
  ├─ Loop weeklyData:
  │   └─ calculatePayForTimePeriod(..., awardRates.penalties)
  │       ├─ Use penalty boundaries from awardRates
  │       ├─ Apply multipliers minute-by-minute
  │       └─ Return segments with breakdown
  ├─ Calculate overtime using base rate from awardRates
  ├─ Loop allowances:
  │   └─ Use amounts from awardRates.allowances[allowanceId][employmentType]
  └─ setState(results)
  ↓
Conditional render:
  - viewMode='overview' → OverviewBreakdown (week grid)
  - viewMode='drillDown' → DrillDownBreakdown (selected day)
  - viewMode='comparison' → ComparisonView (actual vs calculated)
```

---

## Backwards Compatibility Strategy

### Preserve Existing Behavior

1. **Hardcoded Pharmacy Rates as Default:**
   ```javascript
   const DEFAULT_PHARMACY_PENALTIES = {
     saturday: 1.5,
     sunday: 2.0,
     publicHoliday: 2.0,
     earlyMorning: { start: '00:00', end: '07:00', rate: 1.25 },
     evening: { start: '19:00', end: '00:00', rate: 1.25 },
     casualLoading: 1.25,
     timeBoundaries: [0, 7*60, 19*60, 24*60]
   };

   // If API fetch fails, fall back to hardcoded pharmacy rates
   if (!awardRates) {
     setAwardRates(normalizeLegacyPharmacyRates(pharmacyAwardRates));
   }
   ```

2. **Optional Parameters in Calculation Functions:**
   - `calculatePayForTimePeriod(..., classification, penaltyConfig = null)`
   - If `penaltyConfig` omitted, use Pharmacy defaults
   - Existing tests pass without modification

3. **Component Prop Defaults:**
   ```javascript
   <EmployeeDetails
     classifications={awardRates?.classifications || defaultPharmacyClassifications}
     ...
   />
   ```

4. **No Breaking Changes to Existing Components:**
   - All existing props and callbacks remain
   - New functionality additive, not replacing

### Testing Strategy for Backwards Compatibility

1. Run existing unit tests unchanged
   - All Pharmacy award calculations should produce identical results
   - Break-time deductions unchanged
   - Overtime calculations unchanged

2. Add regression tests for each component
   - EmployeeDetails: selected classification still updates base rate correctly
   - Allowances: selected allowances still calculate correctly
   - DetailedBreakdown: segment breakdown still displays correctly

3. Add compatibility tests for API fallback
   - If API fails, hardcoded rates take over
   - Calculations continue to work
   - Warning banner shown to user

---

## Scalability Considerations

### At 10 Awards

| Concern | Approach |
|---------|----------|
| Award list size | Static dropdown (2-4 awards at launch) — no pagination |
| Rate data size | ~50KB per award in localStorage — acceptable |
| Cache management | Expiry: 90 days per award; manual clear button |
| UI complexity | Single AwardSelector dropdown; no search needed yet |

### At 50+ Awards (Future Expansion)

| Concern | Approach |
|---------|----------|
| Award list size | Searchable dropdown (react-select or custom) |
| Rate data size | Index only selected award in localStorage; lazy load others |
| Cache management | LRU cache: keep 5 most recent, evict oldest |
| Parallel requests | Batch fetch for related awards (same industry category) |

### Performance Targets

- Award list load: < 1s (cached in sessionStorage)
- Single award rate fetch: < 2s (cached in localStorage, expires 90d)
- Calculation: < 100ms (pure CPU, no I/O)
- Component re-render on award change: < 500ms (React optimization with useMemo)

---

## Error Handling & Resilience

### Network Errors

```javascript
try {
  const rates = await fetchFromFWCAPI(awardId);
  return normalizeRates(rates);
} catch (error) {
  // 1. Check stale cache
  const stale = getStaleCache(awardId);
  if (stale) {
    showWarningBanner('Using outdated rates — latest data unavailable');
    return stale;
  }

  // 2. Check for offline mode
  if (!navigator.onLine) {
    showErrorBanner('Offline — cannot fetch rates. Enter custom rate to continue.');
    return null;
  }

  // 3. Retry with exponential backoff
  for (let i = 0; i < 3; i++) {
    try {
      return await fetchWithDelay(awardId, i);
    } catch (retryError) {
      if (i === 2) throw retryError;
    }
  }
}
```

### Missing Data Gracefully

```javascript
// If award has no casual rates
const casualRate = awardRates.classifications[id].casual?.base || awardRates.classifications[id].fullTimePartTime?.base;

// If award has no junior rates
const juniorPercentage = awardRates.juniorRates?.[age] || 1.0;

// If allowance doesn't apply to employment type
const amount = awardRates.allowances[id][employmentType] || 0;
```

### Validation Before Calculation

```javascript
if (!awardRates) {
  showError('Award rates not loaded. Please select a valid award.');
  return;
}

if (!awardRates.classifications[classification]) {
  showError(`Classification "${classification}" not available for selected award.`);
  setClassification(null);
  return;
}

if (!weeklyData.some(d => d.startTime && d.endTime)) {
  showError('Enter at least one shift time.');
  return;
}

calculatePay();
```

---

## Testing Strategy

### Unit Tests

- **awardRatesService.js**: Normalization, caching, fallback logic
- **calculatePayForTimePeriod()**: Pharmacy rates vs. API rates produce same output
- **calculatePay()**: Base rate lookup, overtime, allowances with different awards
- **getPenaltyDescription()**: Correct descriptions for all penalty types

### Component Tests (React Testing Library)

- **AwardSelector**: Renders list, calls onAwardChange on selection
- **EmployeeDetails**: Displays classifications from prop, disables unavailable options
- **Allowances**: Renders award-specific allowances, calculates amounts correctly
- **OverviewBreakdown**: Shows week grid with calculated pay, pass/fail per day
- **DrillDownBreakdown**: Switches day, shows segment breakdown
- **ComparisonView**: Calculates discrepancy, shows warning/info message

### E2E Tests (Cypress or Playwright)

1. Select award → classifications update
2. Select classification → base rate changes
3. Enter shifts → calculation produces correct pay
4. Toggle overview/drill-down/comparison → correct view renders
5. Enter actual paid amount → discrepancy shown correctly
6. Change award → calculation resets, new rates applied

### Regression Tests

- All existing Pharmacy award tests pass unchanged
- Calculation results match historical values within 0.01 (rounding tolerance)

---

## Deployment & Rollout Strategy

### Phase 1: Pharmacy Award Hardcoded (Current)
**Status:** Live
**Features:** Pharmacy only, hardcoded rates
**Risk:** None (no API dependency)

### Phase 2: Add API, Default to Pharmacy
**Status:** Staged rollout
**Features:** API integrated, Pharmacy as default, fallback to hardcoded
**Risk:** Low (hardcoded backup works)
**Rollout:** 10% → 50% → 100% with monitoring

### Phase 3: Multi-Award Support
**Status:** Full launch
**Features:** 2-4 awards, API-driven rates, week overview + drill-down + comparison
**Risk:** Medium (API dependency, new modes)
**Rollout:** Beta → Limited release → General availability

### Monitoring & Observability

- API call success rate (target: >99%)
- Cache hit rate (target: >90%)
- Calculation accuracy (validate against payroll samples)
- User mode usage (overview vs. drill-down vs. comparison)
- Error rates by award type

---

## Conclusion

This architecture preserves the existing penalty calculation engine while adding multi-award support and new UI modes. The key design decisions:

1. **Minimal changes to core logic**: `calculatePayForTimePeriod()` remains unchanged; penalty config becomes parameterized
2. **API service abstraction**: All FWC communication centralized; caching and normalization handled consistently
3. **Data-driven instead of hardcoded**: Rates, penalties, allowances derived from API; no code changes per award
4. **Progressive enhancement**: Award selection is additive; existing single-award flow still works
5. **Component boundaries clear**: Each component owns one responsibility; App.js orchestrates state and calculations

**Build order prioritizes:** Foundation (API service) → Core logic refactoring → Component updates → UI enhancements → Real API integration.

This enables shipping multi-award support within 5-6 phases while maintaining code quality and test coverage.
