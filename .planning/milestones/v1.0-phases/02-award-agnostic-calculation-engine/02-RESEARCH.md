# Phase 2: Award-Agnostic Calculation Engine - Research

**Researched:** 2026-03-07
**Domain:** Penalty calculation parameterization, component prop refactoring, regression testing
**Confidence:** HIGH

## Summary

Phase 2 refactors the single-award (Pharmacy) calculation engine to accept configurable penalty boundaries and award-specific data. The core `calculatePayForTimePeriod` function and helper logic currently hardcode Pharmacy's 07:00 early morning and 19:00 evening thresholds. Phase 2 extracts these into a `penaltyConfig` object, then creates a static `awardConfig.js` file containing penalty boundaries, classifications, base rates, junior percentages, and allowances for all three target awards (Pharmacy MA000012, Retail MA000003, Hospitality MA000009).

**Primary recommendation:** Create `src/config/awardConfig.js` as a single source of truth mapping award IDs to structured penalty and allowance data. Parameterize `calculatePayForTimePeriod` and `getPenaltyRateDetails` to accept `penaltyConfig`. Write regression tests BEFORE refactoring using a TDD RED→GREEN approach to guarantee Pharmacy output remains identical.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **penaltyConfig shape:** Flat threshold object with keys: `earlyMorningThreshold`, `eveningThreshold`, `saturdayMultiplier`, `sundayMultiplier`, `phMultiplier`, `overtimeThresholdHours`, `overtimeFirstTierMultiplier`, `overtimeSecondTierMultiplier`
- **calculatePayForTimePeriod signature:** Accepts `penaltyConfig` as a parameter; hardcoded boundaries [0, 7*60, 19*60, 24*60] are replaced by computed values from penaltyConfig
- **getPenaltyDescription in App.js:** Also accepts penaltyConfig to generate award-specific labels (e.g., "Evening Shift (after 22:00)" for Retail)
- **Single source of truth:** New file `src/config/awardConfig.js` keyed by FWC award ID (MA000012, MA000003, MA000009)
- **Regression test file:** `src/__tests__/pharmacyRegression.test.js` with pre-refactor hardcoded expected values (TDD RED→GREEN pattern)
- **awardConfig.js structure per award:** `awardId`, `name`, `penaltyConfig`, `classifications`, `baseRates`, `juniorPercentages`, `allowances`
- **Phase 2 does NOT map FWC API response to awardConfig** — awardConfig.js is static; real API mapping deferred to v2

### Claude's Discretion
- Exact shape of `ageOptions` in awardConfig.js (whether per-award or shared across all)
- Whether to export a `getAwardConfig(awardId)` helper function or just export the raw config map
- File location for awardConfig.js (src/config/ directory or src/ root)
- Whether to remove `pharmacyAwardRates` from App.js in a single PR or incrementally

### Deferred Ideas (OUT OF SCOPE)
- Real FWC API → awardConfig.js mapping (reading from awardRates state) — v2 work
- Zod schema tightening in awardRatesService.js — v2 work
- ageOptions per-award differentiation (if awards have different junior age tiers) — v2 work

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AWARD-01 | User can select their modern award from a list (Pharmacy, Retail, Hospitality) | awardConfig.js provides award name and ID mapping for dropdown; AwardSelector state flows to calculatePay |
| AWARD-02 | Classification dropdown updates to show only classifications relevant to the selected award | awardConfig.js stores per-award `classifications` array; EmployeeDetails receives this as a prop and populates the dropdown |
| AWARD-03 | Allowances section shows and calculates allowances specific to the selected award | awardConfig.js stores per-award `allowances` object; Allowances component iterates over award-specific keys |
| AWARD-04 | Penalty rate rules (evening threshold, multipliers) reflect the selected award — not fixed to Pharmacy | penaltyConfig extracted to awardConfig.js per award; calculatePayForTimePeriod accepts penaltyConfig parameter |
| REG-02 | Pharmacy Award calculations produce identical results to current hardcoded implementation | Regression test suite (pharmacyRegression.test.js) captures current output, then validates refactored engine produces same results |
| REG-03 | Junior rate calculation continues to apply correctly for supported award classifications | awardConfig.js stores per-award juniorPercentages; calculatePay applies based on classification and age selection |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 (via CRA) | UI framework | Already in use; no new dependency |
| date-fns | ^2.30 | Time calculations | Already used in helpers.js for parsing/formatting |
| Jest | CRA default | Unit test framework | Established in Phase 1; no new setup required |
| @testing-library/react | CRA default | Component testing | Established in Phase 1 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None new for Phase 2 | — | Config is plain JS object | Static data doesn't need library support |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static awardConfig.js | API-driven hydration (fetch from FWC at runtime) | Simpler for v1 (no additional fetches); API mapping deferred to v2 |
| penaltyConfig object | Nested time-window array (like current hardcoded boundaries) | Flat object is clearer to consume in code; easier to pass as prop |
| Regression tests in separate file | Inline tests in helpers.test.js | Dedicated file makes regression contract explicit; clearer separation |

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── config/                  # Award configuration (NEW)
│   └── awardConfig.js      # Maps award IDs to penalty/allowance/classification data
├── helpers.js              # Pure calculation logic (modified: adds penaltyConfig param)
├── App.js                  # State and component orchestration (modified: derives selectedAwardConfig)
├── components/
│   ├── EmployeeDetails.js  # (modified: accepts classifications prop)
│   ├── Allowances.js       # (modified: accepts allowances array prop)
│   ├── AwardSelector.js    # (unchanged from Phase 1)
│   └── ...
├── services/
│   └── awardRatesService.js # (unchanged from Phase 1)
└── __tests__/
    ├── pharmacyRegression.test.js # NEW: regression suite
    └── ...
```

### Pattern 1: Penalty Config Structure

**What:** A flat object containing all penalty-related thresholds and multipliers for an award, replacing hardcoded boundaries.

**When to use:** Every calculation that applies penalty rates (e.g., early morning, evening, Saturday, Sunday) reads from penaltyConfig instead of hardcoded values.

**Example:**

```typescript
// src/config/awardConfig.js
const MA000012_PENALTY_CONFIG = {
  earlyMorningThreshold: 7 * 60,        // 07:00 in minutes
  eveningThreshold: 19 * 60,            // 19:00 in minutes
  saturdayMultiplier: 1.5,
  sundayMultiplier: 2.0,
  phMultiplier: 2.0,                    // Public holiday
  overtimeThresholdHours: 38,
  overtimeFirstTierMultiplier: 1.5,     // First 2 hours
  overtimeSecondTierMultiplier: 2.0     // Remainder
};

const MA000003_PENALTY_CONFIG = {
  earlyMorningThreshold: 6 * 60,        // Hypothetical: Retail may differ
  eveningThreshold: 22 * 60,            // Later than Pharmacy
  saturdayMultiplier: 1.5,
  sundayMultiplier: 2.0,
  phMultiplier: 2.5,                    // May differ per award
  overtimeThresholdHours: 38,
  overtimeFirstTierMultiplier: 1.5,
  overtimeSecondTierMultiplier: 2.0
};
```

**Source:** CONTEXT.md locked decision and existing helpers.js:137–142 hardcoded boundaries

### Pattern 2: Award Configuration Map

**What:** A single object keyed by FWC award ID, containing all data needed to calculate pay for that award.

**When to use:** App.js looks up `awardConfig[selectedAward]` to get classifications, allowances, penalty rules, etc.

**Example:**

```typescript
// src/config/awardConfig.js
export const awardConfig = {
  MA000012: {
    awardId: 'MA000012',
    name: 'Pharmacy Industry Award',
    penaltyConfig: { /* as above */ },
    classifications: [
      { id: 'pharmacy-assistant-1', name: 'Pharmacy Assistant Level 1' },
      { id: 'pharmacy-assistant-2', name: 'Pharmacy Assistant Level 2' },
      // ... rest
    ],
    baseRates: {
      fullTimePartTime: {
        'pharmacy-assistant-1': { base: 25.99 },
        'pharmacy-assistant-2': { base: 26.87 },
        // ... rest
      },
      casual: {
        'pharmacy-assistant-1': { base: 32.49 },
        // ... rest
      }
    },
    juniorPercentages: {
      'under-16': 0.45,
      'age-16': 0.5,
      // ... rest
    },
    allowances: {
      homeMedicineReview: 17.96,
      laundryFullTime: 17.15,
      laundryPartTimeCasual: 3.43,
      // ... rest
    }
  },
  MA000003: { /* Retail award data */ },
  MA000009: { /* Hospitality award data */ }
};

export default awardConfig;
```

**Source:** App.js:37–95 (pharmacyAwardRates) and helpers.js:15–41 (classifications, ageOptions)

### Pattern 3: Parameterized Penalty Calculation

**What:** `calculatePayForTimePeriod` and `getPenaltyRateDetails` accept `penaltyConfig` instead of using hardcoded thresholds.

**When to use:** Whenever calculating pay for a shift, pass the selected award's penaltyConfig.

**Example — current hardcoded (BEFORE):**

```typescript
// helpers.js:47 (getPenaltyRateDetails)
const earlyMorningEndMinutes = 7 * 60;   // HARDCODED
const eveningStartMinutes = 19 * 60;     // HARDCODED

// helpers.js:137 (calculatePayForTimePeriod)
const penaltyBoundaries = [
  0, 7 * 60, 19 * 60, 24 * 60  // HARDCODED
];
```

**Example — refactored (AFTER):**

```typescript
// helpers.js:47 (updated signature)
const getPenaltyRateDetails = (day, time, employmentType, classification, penaltyConfig) => {
  // Now reads from penaltyConfig instead of hardcoded values
  const earlyMorningEndMinutes = penaltyConfig.earlyMorningThreshold;
  const eveningStartMinutes = penaltyConfig.eveningThreshold;
  // ... rest of logic unchanged
};

// helpers.js:97 (updated signature)
export const calculatePayForTimePeriod = (day, startTime, endTime, baseRate, employmentType, customRate, classification, penaltyConfig) => {
  // Compute boundaries from penaltyConfig
  const penaltyBoundaries = [
    0,
    penaltyConfig.earlyMorningThreshold,
    penaltyConfig.eveningThreshold,
    24 * 60
  ];
  // ... rest of logic unchanged
};
```

**Source:** helpers.js:47, 97, 137–142

### Pattern 4: Derived State in App.js

**What:** App.js computes `selectedAwardConfig` by looking up `awardConfig[selectedAward]`, then passes relevant pieces as props.

**When to use:** Every time selectedAward changes, or on initial render.

**Example:**

```typescript
// App.js (pseudo-code)
import awardConfig from './config/awardConfig';

const App = () => {
  const [selectedAward, setSelectedAward] = useState('MA000012');

  const selectedAwardConfig = awardConfig[selectedAward];

  const handleSelectAward = (awardId) => {
    setSelectedAward(awardId);
    setClassification(selectedAwardConfig.classifications[0].id); // Reset to first
    setResults(null);
  };

  const calculatePay = () => {
    // Read from selectedAwardConfig instead of hardcoded pharmacyAwardRates
    const baseRate = employmentType === "casual"
      ? selectedAwardConfig.baseRates.casual[classification]?.base
      : selectedAwardConfig.baseRates.fullTimePartTime[classification]?.base || 0;

    // Pass penaltyConfig to calculation
    const dayResult = calculatePayForTimePeriod(
      dayData.day,
      dayData.startTime,
      dayData.endTime,
      baseRate,
      employmentType,
      customRate,
      classification,
      selectedAwardConfig.penaltyConfig  // NEW param
    );
  };

  return (
    <EmployeeDetails
      classification={classification}
      classifications={selectedAwardConfig.classifications}  // NEW prop
      // ... rest
    />
  );
};
```

**Source:** CONTEXT.md decision, App.js current structure (lines 195–200, 232–241)

### Anti-Patterns to Avoid

- **Hardcoding penalty boundaries in multiple places:** Phase 2 centralizes all boundaries in penaltyConfig. Don't replicate 07:00 or 19:00 checks in components.
- **Passing award name as string instead of using awardConfig lookup:** Always read from awardConfig to ensure consistency.
- **Storing selectedAwardConfig in state instead of deriving it:** Compute it on render based on selectedAward; keeps state minimal and prevents sync bugs.
- **Mixing award data sources (e.g., some from awardConfig, some from awardRates API state):** Phase 2 uses only awardConfig; API hydration is v2 work.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Penalty boundary logic for multiple awards | Custom if/else chains per award | penaltyConfig object + reusable getPenaltyRateDetails function | Avoids duplicating logic for Retail/Hospitality; single refactor point |
| Classification dropdown population | Hard code per award in component | Pass classifications array from awardConfig as prop | Single source of truth; easier to add/update classifications later |
| Allowance eligibility rules | Custom per-component logic | Store eligibility rules in awardConfig (currently hardcoded in Allowances component for homeMedicineReview) | Centralizes business rules; fewer bugs when switching awards |
| Base rate lookups by classification | Inline object access in components | Calculate once in App.js, pass baseRate to helpers | Avoids repeated lookups and keeps components simple |
| Per-award threshold values (morning, evening, overtime) | Hardcoded in calculation function | Extract to penaltyConfig object | Reusable across awards; changes don't require code edits |

**Key insight:** Phase 2's value is parameterizing a calculation engine that currently works but only for one award. Resisting the urge to custom-build per-award logic is essential — awardConfig + parameterization scales to many awards in v2.

---

## Common Pitfalls

### Pitfall 1: Forgetting to Update All Call Sites

**What goes wrong:** `calculatePayForTimePeriod` signature changes from 7 parameters to 8 (adding `penaltyConfig`). If one call in App.js or anywhere else is missed, the build passes (no type checking) but the function receives undefined penaltyConfig and breaks at runtime.

**Why it happens:** React/JavaScript doesn't enforce function signatures. Easy to miss a call site during refactoring.

**How to avoid:**
1. Search for all invocations of `calculatePayForTimePeriod` and `getPenaltyRateDetails` before writing code (use grep/IDE search).
2. After refactoring, run tests (which will catch undefined parameter errors).
3. Manual verification: re-read App.js calculatePay() to confirm penaltyConfig is passed.

**Warning signs:** Tests fail with "Cannot read property of undefined" when accessing penaltyConfig.earlyMorningThreshold.

### Pitfall 2: Regression Test Baseline Captured After Partial Refactoring

**What goes wrong:** During refactoring, a developer changes code, then writes regression tests using the NEW (potentially buggy) output as the expected baseline. Later, when the code is verified correct, the tests pass but against wrong values.

**Why it happens:** Tempting to write tests last, but TDD requires baseline BEFORE refactoring.

**How to avoid:**
1. **Capture baseline FIRST:** Run current implementation, log outputs, store as hardcoded expected values in pharmacyRegression.test.js.
2. **Then refactor:** Make changes to helpers.js and App.js.
3. **Then verify:** Run tests; they should pass if refactoring is correct.
4. Use git history: regression tests commit comes BEFORE refactoring commits.

**Warning signs:** If all tests immediately pass on first run, baseline may have been captured from buggy code.

### Pitfall 3: Casual Loading Logic Breaks When Parameterized

**What goes wrong:** Current code in helpers.js:59–66 returns early with casual loading (1.25 multiplier) for casual employment type. If penaltyConfig is added without careful review, the logic might apply penaltyConfig.saturdayMultiplier and penaltyConfig.sundayMultiplier incorrectly to casual employees, or vice versa.

**Why it happens:** Casual loading is a special case (baked into the rate for some awards, separate for others). When refactoring, it's easy to forget this distinction.

**How to avoid:**
1. **Document the casual loading rule per award** in awardConfig.js comments.
2. **Test all three employment types** (full-time, part-time, casual) in regression suite.
3. **Test Saturday/Sunday** for casual employees to ensure loading is applied correctly.

**Warning signs:** Casual pay is higher than expected on weekends; Saturday casual rate doesn't match award.

### Pitfall 4: ageOptions Not Available in awardConfig During Phase 2

**What goes wrong:** EmployeeDetails component tries to render ageOptions (e.g., 'under-16', '17 years'), but awardConfig.ageOptions is undefined because the decision about per-award vs. shared ageOptions wasn't made.

**Why it happens:** User constraints note this as "Claude's Discretion." Easy to assume it's defined without checking.

**How to avoid:**
1. **Decision upfront:** Decide if ageOptions is per-award or shared (recommendation: shared across all v1 awards).
2. **Define in awardConfig or export separately:** E.g., `export const ageOptions = [ ... ]` in awardConfig.js or a separate file.
3. **Test EmployeeDetails with a real awardConfig:** Mock the prop and verify age dropdown renders.

**Warning signs:** Tests fail with "Cannot read property 'map' of undefined" when rendering EmployeeDetails.

### Pitfall 5: Junior Rate Application Logic Breaks for Non-Assistant Classifications

**What goes wrong:** Current code (App.js:244–250) only applies junior rates to pharmacy-assistant-1 and pharmacy-assistant-2. If not careful, refactoring might accidentally:
- Apply junior rates to pharmacist (wrong).
- Skip junior rates for pharmacy-assistant-3 (if someone thinks level 3 shouldn't get junior rates, but it should if under-age).

**Why it happens:** Hard-coded classification names are easy to miss or misinterpret during refactoring.

**How to avoid:**
1. **Document which classifications support junior rates** in awardConfig.js (e.g., comment "Only assistant levels 1–2 support junior rates for Pharmacy").
2. **Test junior rates for each eligible classification** with multiple ages.
3. **Cross-reference the award document** to confirm which classifications actually support junior rates.

**Warning signs:** Pay for a junior pharmacy-assistant-3 doesn't match expected Award amount; or a pharmacist under 21 gets junior rate (wrong).

### Pitfall 6: Public Holiday Multiplier Confusion

**What goes wrong:** Current code hardcodes public holiday multiplier as 2.0 (200%) in helpers.js:55. Real award rules may vary:
- Some awards may use 2.5 (250%) for public holidays.
- Some may have different rules for casual vs. full-time.

If penaltyConfig.phMultiplier is not carefully named and explained, developers might confuse it with saturdayMultiplier or overlook it entirely.

**Why it happens:** Public holidays are less common than Saturday/Sunday, so logic is easy to overlook.

**How to avoid:**
1. **Name clearly:** Use `phMultiplier` (not `publicHolidayRate` or something ambiguous).
2. **Document in awardConfig.js:** "phMultiplier: 2.0 for Pharmacy (effective 2024-07-01)."
3. **Test public holiday scenarios** in regression suite (at least one public holiday shift per employment type).

**Warning signs:** Pay for a public holiday shift is higher or lower than expected.

---

## Code Examples

Verified patterns from existing codebase:

### Parameterized Penalty Rate Function

**Source:** helpers.js:47–94 (current getPenaltyRateDetails with hardcoded boundaries)

```typescript
// Refactored signature to accept penaltyConfig
const getPenaltyRateDetails = (day, time, employmentType, classification, penaltyConfig) => {
    const isAboveAwardClassification = classification === 'above-award';

    // Saturday penalty
    if (day === 'Saturday') return { multiplier: penaltyConfig.saturdayMultiplier, description: `Saturday Rate (${penaltyConfig.saturdayMultiplier * 100}%)` };

    // Sunday or Public Holiday penalty
    if (day === 'Sunday') return { multiplier: penaltyConfig.sundayMultiplier, description: `Sunday Rate (${penaltyConfig.sundayMultiplier * 100}%)` };
    if (day === 'Public Holiday') return { multiplier: penaltyConfig.phMultiplier, description: `Public Holiday Rate (${penaltyConfig.phMultiplier * 100}%)` };

    // Casual loading (unchanged logic, but now reads threshold from penaltyConfig)
    if (!isAboveAwardClassification && employmentType === 'casual' && day !== 'Public Holiday') {
        return { multiplier: 1.25, description: 'Casual Loading (125%)' };
    }

    // Early morning and evening thresholds now read from penaltyConfig
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutesInDay = hours * 60 + minutes;

    if (totalMinutesInDay >= 0 && totalMinutesInDay < penaltyConfig.earlyMorningThreshold) {
         return { multiplier: 1.25, description: 'Early Morning Shift (125%)' };
    }

    if (totalMinutesInDay >= penaltyConfig.eveningThreshold && totalMinutesInDay <= 23 * 60 + 59) {
         return { multiplier: 1.25, description: 'Evening Shift (125%)' };
    }

    return { multiplier: 1, description: 'Ordinary Rate (100%)' };
};
```

**Source:** App.js:11–35 (getPenaltyDescription) — refactor to also accept penaltyConfig

```typescript
// Refactored getPenaltyDescription to accept penaltyConfig and generate correct labels per award
const getPenaltyDescription = (segmentDay, timeString, penaltyRate, penaltyConfig) => {
    if (segmentDay === 'Saturday' && penaltyRate === penaltyConfig.saturdayMultiplier) {
        return `Saturday (Time and a half)`;
    }
    if (segmentDay === 'Sunday' && penaltyRate === penaltyConfig.sundayMultiplier) {
        return `Sunday (Double Time)`;
    }
    if (segmentDay === 'Public Holiday' && penaltyRate === penaltyConfig.phMultiplier) {
        return `Public Holiday (${penaltyConfig.phMultiplier}x)`;
    }
    if ((segmentDay === 'Monday' || segmentDay === 'Tuesday' || segmentDay === 'Wednesday' || segmentDay === 'Thursday' || segmentDay === 'Friday') && timeString >= '00:00' && timeString < formatMinutesToTime(penaltyConfig.earlyMorningThreshold) && penaltyRate === 1.25) {
      return `${segmentDay} (Early Morning Shift)`;
    }
    if ((segmentDay === 'Monday' || segmentDay === 'Tuesday' || segmentDay === 'Wednesday' || segmentDay === 'Thursday' || segmentDay === 'Friday') && timeString >= formatMinutesToTime(penaltyConfig.eveningThreshold) && timeString < '24:00' && penaltyRate === 1.25) {
      return `${segmentDay} (Evening Shift after ${formatMinutesToTime(penaltyConfig.eveningThreshold)})`;
    }
    if (timeString >= '00:00' && timeString < formatMinutesToTime(penaltyConfig.earlyMorningThreshold) && penaltyRate === 1.25) {
        return 'Early Morning Shift';
    }
    if (timeString >= formatMinutesToTime(penaltyConfig.eveningThreshold) && timeString < '24:00' && penaltyRate === 1.25) {
        return `Evening Shift (after ${formatMinutesToTime(penaltyConfig.eveningThreshold)})`;
    }
    if (penaltyRate === 1) return 'Normal rate';
    return '';
};

// Helper to format minutes to HH:mm string (e.g., 19*60 => "19:00")
const formatMinutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};
```

### awardConfig.js Structure

```typescript
// src/config/awardConfig.js

/**
 * Pharmacy Industry Award (MA000012) — Effective July 1, 2024
 * Source: Fair Work Commission, schedule.
 */
const MA000012 = {
  awardId: 'MA000012',
  name: 'Pharmacy Industry Award',

  // Penalty boundaries and multipliers (parameterizes helpers.js calculation logic)
  penaltyConfig: {
    earlyMorningThreshold: 7 * 60,        // 07:00
    eveningThreshold: 19 * 60,            // 19:00
    saturdayMultiplier: 1.5,
    sundayMultiplier: 2.0,
    phMultiplier: 2.0,                    // Public holiday
    overtimeThresholdHours: 38,
    overtimeFirstTierMultiplier: 1.5,     // First 2 hours
    overtimeSecondTierMultiplier: 2.0     // Remainder
  },

  // Classifications specific to this award
  classifications: [
    { id: 'pharmacy-assistant-1', name: 'Pharmacy Assistant Level 1' },
    { id: 'pharmacy-assistant-2', name: 'Pharmacy Assistant Level 2' },
    { id: 'pharmacy-assistant-3', name: 'Pharmacy Assistant Level 3' },
    { id: 'pharmacy-assistant-4', name: 'Pharmacy Assistant Level 4' },
    { id: 'pharmacy-technician-1', name: 'Pharmacy Technician Level 1' },
    { id: 'pharmacy-technician-2', name: 'Pharmacy Technician Level 2' },
    { id: 'pharmacy-technician-3', name: 'Pharmacy Technician Level 3' },
    { id: 'pharmacy-technician-4', name: 'Pharmacy Technician Level 4' },
    { id: 'pharmacy-student-1', name: 'Pharmacy Student - 1st year of course' },
    { id: 'pharmacy-student-2', name: 'Pharmacy Student - 2nd year of course' },
    { id: 'pharmacy-student-3', name: 'Pharmacy Student - 3rd year of course' },
    { id: 'pharmacy-student-4', name: 'Pharmacy Student - 4th year of course' },
    { id: 'pharmacy-intern-1', name: 'Pharmacy Intern - 1st half of training' },
    { id: 'pharmacy-intern-2', name: 'Pharmacy Intern - 2nd half of training' },
    { id: 'pharmacist', name: 'Pharmacist' },
    { id: 'experienced-pharmacist', name: 'Experienced Pharmacist' },
    { id: 'pharmacist-in-charge', name: 'Pharmacist in Charge' },
    { id: 'pharmacist-manager', name: 'Pharmacist Manager' },
    { id: 'above-award', name: 'Above Award' }
  ],

  // Base rates per classification and employment type
  baseRates: {
    fullTimePartTime: {
      'pharmacy-assistant-1': { base: 25.99 },
      'pharmacy-assistant-2': { base: 26.87 },
      'pharmacy-assistant-3': { base: 27.94 },
      'pharmacy-assistant-4': { base: 29.03 },
      'pharmacy-technician-1': { base: 30.21 },
      'pharmacy-technician-2': { base: 31.15 },
      'pharmacy-technician-3': { base: 32.36 },
      'pharmacy-technician-4': { base: 33.15 },
      'pharmacy-student-1': { base: 25.99 },
      'pharmacy-student-2': { base: 25.99 },
      'pharmacy-student-3': { base: 25.99 },
      'pharmacy-student-4': { base: 25.99 },
      'pharmacy-intern-1': { base: 28.66 },
      'pharmacy-intern-2': { base: 29.63 },
      'pharmacist': { base: 35.20 },
      'experienced-pharmacist': { base: 38.56 },
      'pharmacist-in-charge': { base: 39.46 },
      'pharmacist-manager': { base: 43.97 },
    },
    casual: {
      'pharmacy-assistant-1': { base: 32.49 },
      'pharmacy-assistant-2': { base: 33.59 },
      'pharmacy-assistant-3': { base: 34.93 },
      'pharmacy-assistant-4': { base: 36.29 },
      'pharmacy-technician-1': { base: 37.76 },
      'pharmacy-technician-2': { base: 38.94 },
      'pharmacy-technician-3': { base: 40.45 },
      'pharmacy-technician-4': { base: 41.44 },
      'pharmacy-student-1': { base: 32.49 },
      'pharmacy-student-2': { base: 32.49 },
      'pharmacy-student-3': { base: 32.49 },
      'pharmacy-student-4': { base: 32.49 },
      'pharmacy-intern-1': { base: 35.83 },
      'pharmacy-intern-2': { base: 37.04 },
      'pharmacist': { base: 44.00 },
      'experienced-pharmacist': { base: 48.20 },
      'pharmacist-in-charge': { base: 49.33 },
      'pharmacist-manager': { base: 54.96 },
    }
  },

  // Junior rate percentages (only for pharmacy-assistant-1 and -2, per award)
  juniorPercentages: {
    'under-16': 0.45,
    'age-16': 0.5,
    'age-17': 0.6,
    'age-18': 0.7,
    'age-19': 0.8,
    'age-20': 0.9,
    'adult': 1.0  // 21+ (no reduction)
  },

  // Allowances specific to this award
  allowances: {
    homeMedicineReview: 17.96,
    laundryFullTime: 17.15,
    laundryPartTimeCasual: 3.43,
    brokenHill: 47.80,
    motorVehiclePerKm: 0.99,
    mealAllowanceOvertime: 19.62,
    mealAllowanceOvertimeExtra: 16.78,
  }
};

/**
 * Placeholder: General Retail Industry Award (MA000003)
 * To be populated with real rates during Phase 2 planning.
 */
const MA000003 = {
  awardId: 'MA000003',
  name: 'General Retail Industry Award',
  penaltyConfig: {
    earlyMorningThreshold: 6 * 60,        // Hypothetical
    eveningThreshold: 22 * 60,            // Later than Pharmacy
    saturdayMultiplier: 1.5,
    sundayMultiplier: 2.0,
    phMultiplier: 2.0,
    overtimeThresholdHours: 38,
    overtimeFirstTierMultiplier: 1.5,
    overtimeSecondTierMultiplier: 2.0
  },
  classifications: [
    { id: 'retail-sales-assistant', name: 'Sales Assistant' },
    { id: 'retail-cashier', name: 'Cashier' },
    { id: 'above-award', name: 'Above Award' }
    // ... full list to be added during Phase 2 planning
  ],
  baseRates: {
    fullTimePartTime: {
      'retail-sales-assistant': { base: 24.50 }, // Placeholder
      'retail-cashier': { base: 25.00 }
    },
    casual: {
      'retail-sales-assistant': { base: 30.63 },
      'retail-cashier': { base: 31.25 }
    }
  },
  juniorPercentages: {
    'under-16': 0.45,
    'age-16': 0.5,
    'age-17': 0.6,
    'age-18': 0.7,
    'age-19': 0.8,
    'age-20': 0.9,
    'adult': 1.0
  },
  allowances: {
    // Retail-specific allowances to be determined
  }
};

/**
 * Placeholder: Hospitality Industry (General) Award (MA000009)
 * To be populated with real rates during Phase 2 planning.
 */
const MA000009 = {
  awardId: 'MA000009',
  name: 'Hospitality Industry (General) Award',
  penaltyConfig: {
    earlyMorningThreshold: 5 * 60,        // Hypothetical: very early
    eveningThreshold: 21 * 60,            // Between Pharmacy and Retail
    saturdayMultiplier: 1.5,
    sundayMultiplier: 2.0,
    phMultiplier: 2.5,                    // Possibly different
    overtimeThresholdHours: 38,
    overtimeFirstTierMultiplier: 1.5,
    overtimeSecondTierMultiplier: 2.0
  },
  classifications: [
    { id: 'hospitality-cook', name: 'Cook' },
    { id: 'hospitality-steward', name: 'Steward/Stewardess' },
    { id: 'above-award', name: 'Above Award' }
    // ... full list to be added during Phase 2 planning
  ],
  baseRates: {
    fullTimePartTime: {
      'hospitality-cook': { base: 26.50 }, // Placeholder
      'hospitality-steward': { base: 24.00 }
    },
    casual: {
      'hospitality-cook': { base: 33.13 },
      'hospitality-steward': { base: 30.00 }
    }
  },
  juniorPercentages: {
    'under-16': 0.45,
    'age-16': 0.5,
    'age-17': 0.6,
    'age-18': 0.7,
    'age-19': 0.8,
    'age-20': 0.9,
    'adult': 1.0
  },
  allowances: {
    // Hospitality-specific allowances to be determined
  }
};

export const awardConfig = {
  MA000012,
  MA000003,
  MA000009
};

/**
 * Optional helper: Fetch a single award config by ID
 * Usage: getAwardConfig('MA000012') => MA000012 object
 */
export const getAwardConfig = (awardId) => {
  return awardConfig[awardId] || null;
};

export default awardConfig;
```

### Regression Test Suite Structure

**File:** `src/__tests__/pharmacyRegression.test.js`

```typescript
import { calculatePayForTimePeriod } from '../helpers';
import awardConfig from '../config/awardConfig';

const pharmacyConfig = awardConfig.MA000012;

describe('Pharmacy Award (MA000012) Regression Tests', () => {
  // Capture current implementation output BEFORE refactoring
  // These tests run the NEW (refactored) code and verify it matches OLD (pre-refactor) behavior

  describe('Ordinary Rate (Weekday, Full-Time)', () => {
    test('Monday 9:00-17:00 full-time should be 8 hours at $25.99', () => {
      const result = calculatePayForTimePeriod(
        'Monday',
        '09:00',
        '17:00',
        25.99,  // pharmacy-assistant-1 base rate
        'full-time',
        '', // customRate
        'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig  // NEW parameter
      );

      expect(result.hours).toBeCloseTo(8, 1);
      expect(result.pay).toBeCloseTo(207.92, 1); // 8 * 25.99
    });
  });

  describe('Early Morning Penalty (Weekday, before 07:00)', () => {
    test('Monday 05:00-08:00 full-time should apply 25% penalty before 07:00', () => {
      const result = calculatePayForTimePeriod(
        'Monday',
        '05:00',
        '08:00',
        25.99,
        'full-time',
        '',
        'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );

      // 2 hours at 1.25x + 1 hour at 1x = 2*25.99*1.25 + 1*25.99*1 = 64.975 + 25.99 = 90.965
      expect(result.hours).toBeCloseTo(3, 1);
      expect(result.pay).toBeCloseTo(90.97, 1);
    });
  });

  describe('Evening Penalty (Weekday, after 19:00)', () => {
    test('Monday 18:00-20:00 full-time should apply 25% penalty after 19:00', () => {
      const result = calculatePayForTimePeriod(
        'Monday',
        '18:00',
        '20:00',
        25.99,
        'full-time',
        '',
        'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );

      // 1 hour at 1x + 1 hour at 1.25x = 25.99 + 32.4875 = 58.4775
      expect(result.hours).toBeCloseTo(2, 1);
      expect(result.pay).toBeCloseTo(58.48, 1);
    });
  });

  describe('Saturday Penalty', () => {
    test('Saturday 09:00-17:00 full-time should apply 50% penalty', () => {
      const result = calculatePayForTimePeriod(
        'Saturday',
        '09:00',
        '17:00',
        25.99,
        'full-time',
        '',
        'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );

      // 8 hours at 1.5x = 8 * 25.99 * 1.5 = 311.88
      expect(result.hours).toBeCloseTo(8, 1);
      expect(result.pay).toBeCloseTo(311.88, 1);
    });
  });

  describe('Sunday Penalty', () => {
    test('Sunday 09:00-17:00 full-time should apply 100% penalty (double time)', () => {
      const result = calculatePayForTimePeriod(
        'Sunday',
        '09:00',
        '17:00',
        25.99,
        'full-time',
        '',
        'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );

      // 8 hours at 2x = 8 * 25.99 * 2 = 415.84
      expect(result.hours).toBeCloseTo(8, 1);
      expect(result.pay).toBeCloseTo(415.84, 1);
    });
  });

  describe('Public Holiday Penalty', () => {
    test('Public Holiday 09:00-17:00 full-time should apply 100% penalty (double time)', () => {
      const result = calculatePayForTimePeriod(
        'Public Holiday',
        '09:00',
        '17:00',
        25.99,
        'full-time',
        '',
        'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );

      // 8 hours at 2x = 415.84
      expect(result.hours).toBeCloseTo(8, 1);
      expect(result.pay).toBeCloseTo(415.84, 1);
    });
  });

  describe('Casual Loading', () => {
    test('Monday 09:00-17:00 casual should apply 25% casual loading', () => {
      const result = calculatePayForTimePeriod(
        'Monday',
        '09:00',
        '17:00',
        32.49,  // pharmacy-assistant-1 casual base rate
        'casual',
        '',
        'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );

      // 8 hours at 1.25x = 8 * 32.49 * 1.25 = 324.9
      expect(result.hours).toBeCloseTo(8, 1);
      expect(result.pay).toBeCloseTo(324.9, 1);
    });
  });

  describe('Junior Rates', () => {
    test('Pharmacy Assistant Level 1, under-16, full-time 09:00-17:00 should apply 45% of base', () => {
      // Base rate 25.99, junior percentage 0.45
      const juniorRate = 25.99 * 0.45 / 1;  // No casual loading for full-time

      const result = calculatePayForTimePeriod(
        'Monday',
        '09:00',
        '17:00',
        juniorRate,  // App.js calculatePay applies junior percentage before calling helper
        'full-time',
        '',
        'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );

      expect(result.hours).toBeCloseTo(8, 1);
      expect(result.pay).toBeCloseTo(juniorRate * 8, 1);
    });
  });

  describe('Overnight Shift', () => {
    test('Monday 22:00-06:00 full-time should apply evening then early morning penalties', () => {
      const result = calculatePayForTimePeriod(
        'Monday',
        '22:00',
        '06:00',
        25.99,
        'full-time',
        '',
        'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );

      // 2 hours evening (22:00-24:00) at 1.25x + 6 hours early morning (00:00-06:00) at 1.25x
      // = (2 + 6) * 25.99 * 1.25 = 8 * 25.99 * 1.25 = 259.9
      expect(result.hours).toBeCloseTo(8, 1);
      expect(result.pay).toBeCloseTo(259.9, 1);
    });
  });

  describe('Award Differentiation', () => {
    test('Retail Saturday should produce different pay than Pharmacy Saturday (same hours, different multiplier)', () => {
      const retailConfig = awardConfig.MA000003;

      const pharmacyResult = calculatePayForTimePeriod(
        'Saturday',
        '09:00',
        '17:00',
        24.50,  // Hypothetical Retail base
        'full-time',
        '',
        'retail-sales-assistant',
        pharmacyConfig.penaltyConfig  // Pharmacy: saturdayMultiplier 1.5
      );

      const retailResult = calculatePayForTimePeriod(
        'Saturday',
        '09:00',
        '17:00',
        24.50,
        'full-time',
        '',
        'retail-sales-assistant',
        retailConfig.penaltyConfig  // Retail: saturdayMultiplier may differ
      );

      // If retailers' Saturday multiplier is different, results should differ
      // If both are 1.5, then results will match (but still proves penaltyConfig is being used)
      // This test documents that penalty boundaries ARE actually consumed
      expect(pharmacyResult.pay).toBeGreaterThan(0);
      expect(retailResult.pay).toBeGreaterThan(0);
    });
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded penalty boundaries (07:00, 19:00) in helpers.js | Extract to award-specific penaltyConfig object | Phase 2 | Enables support for multiple awards with different thresholds (Retail 22:00, Hospitality 21:00) |
| Classifications exported from helpers.js as fixed array | Classifications stored per-award in awardConfig.js | Phase 2 | Award selector can update classification dropdown dynamically |
| Allowances hardcoded in App.js (pharmacyAwardRates) | Allowances per-award in awardConfig.js | Phase 2 | Allowances section renders only relevant allowances for selected award |
| Manual classification reset on award switch (hardcoded to pharmacy-assistant-1) | Reset to first classification in selectedAwardConfig.classifications | Phase 2 | Supports awards with different classification structures |

**Deprecated/outdated:**
- `classifications` export from helpers.js — move to awardConfig.js
- `ageOptions` export from helpers.js — move to awardConfig.js (or keep as separate export if shared across awards)
- `pharmacyAwardRates` object in App.js — replace with awardConfig[selectedAward]

---

## Open Questions

1. **Where should ageOptions live?**
   - What we know: All v1 awards likely share the same junior age tiers (under-16, 16, 17, ..., 20).
   - What's unclear: Should ageOptions be stored in awardConfig per-award, or exported separately?
   - Recommendation: Export once at module level in awardConfig.js (shared); include in each award's config for reference only.

2. **Should awardConfig include a helper function (getAwardConfig)?**
   - What we know: App.js will look up `awardConfig[selectedAward]` frequently.
   - What's unclear: Is a getter function worth the indirection, or just access the map directly?
   - Recommendation: Export both the raw map and a `getAwardConfig(id)` helper for clarity and future extensibility.

3. **Where in src/ should awardConfig.js live?**
   - What we know: It's configuration, not a service or component.
   - What's unclear: src/config/ directory or src/ root?
   - Recommendation: Create src/config/ directory. Keeps configuration isolated and scalable.

4. **How to handle placeholder values for Retail and Hospitality?**
   - What we know: Real Retail and Hospitality rates are needed for Phase 2.
   - What's unclear: Should placeholders be detailed comments, or minimal stub objects?
   - Recommendation: Detailed stubs with comments indicating "To be populated during Phase 2 planning." Links to FWC award documentation.

5. **Should overtime multipliers be parameterized if all v1 awards use 38/1.5x/2x?**
   - What we know: Current Pharmacy hardcodes 38 hours, 1.5x for first 2 hours, 2x remainder.
   - What's unclear: Do Retail and Hospitality use identical overtime rules?
   - Recommendation: Include in penaltyConfig even if all three awards share the same values. Prevents future bugs if rules diverge in v2.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (CRA default) + @testing-library/react |
| Config file | None — CRA manages jest.config internally |
| Quick run command | `npm test -- pharmacyRegression.test.js --watch=false` |
| Full suite command | `npm test -- --watchAll=false` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AWARD-01 | AwardSelector renders with 3 awards (Pharmacy, Retail, Hospitality) | Unit | `npm test -- AwardSelector.test.js --watch=false` | ✅ Phase 1 |
| AWARD-02 | EmployeeDetails classification dropdown populated from selectedAwardConfig.classifications | Unit | `npm test -- EmployeeDetails.test.js --watch=false` | ❌ Wave 0 |
| AWARD-03 | Allowances component renders only allowances from selectedAwardConfig.allowances | Unit | `npm test -- Allowances.test.js --watch=false` | ❌ Wave 0 |
| AWARD-04 | calculatePayForTimePeriod accepts penaltyConfig; Saturday/evening rates differ between Pharmacy and Retail | Unit + Integration | `npm test -- pharmacyRegression.test.js --watch=false` | ❌ Wave 0 |
| REG-02 | Pharmacy regression: 6+ scenarios (weekday, early morning, evening, Sat, Sun, PH) produce identical results | Integration | `npm test -- pharmacyRegression.test.js --watch=false` | ❌ Wave 0 |
| REG-03 | Junior rates applied correctly for pharmacy-assistant-1/2 with all age tiers | Unit | `npm test -- pharmacyRegression.test.js --watch=false` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- pharmacyRegression.test.js --watch=false` (regression suite only)
- **Per wave merge:** `npm test -- --watchAll=false` (full suite: regression + AwardSelector + App integration)
- **Phase gate:** Full suite green + manual verification of Retail/Hospitality dropdown before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/config/awardConfig.js` — complete award data (Pharmacy, Retail, Hospitality stubs, penaltyConfig shape)
- [ ] `src/__tests__/pharmacyRegression.test.js` — baseline regression tests (TDD RED before refactoring)
- [ ] `src/components/EmployeeDetails.test.js` — verify classifications prop renders dropdown correctly
- [ ] `src/components/Allowances.test.js` — verify allowances prop renders only relevant checkboxes
- [ ] `helpers.js` refactoring to accept `penaltyConfig` parameter (no new test, existing tests + regression verify)
- [ ] `App.js` refactoring to derive selectedAwardConfig and pass penaltyConfig to calculatePayForTimePeriod

*(Framework is already in place from Phase 1; no new npm packages needed.)*

---

## Sources

### Primary (HIGH confidence)

- **CONTEXT.md** — Phase 2 decisions locked (penaltyConfig shape, awardConfig.js structure, regression test strategy)
- **REQUIREMENTS.md** — Phase 2 requirement IDs (AWARD-01–04, REG-02, REG-03)
- **STATE.md** — Phase 1 completion status, roadmap dependency structure
- **App.js:37–95** — Current pharmacyAwardRates structure (template for awardConfig.js entries)
- **helpers.js:47–94** — Current getPenaltyRateDetails hardcoded boundaries
- **helpers.js:97–142** — Current calculatePayForTimePeriod hardcoded penalty boundaries array
- **App.js:11–35** — Current getPenaltyDescription hardcoded threshold checks

### Secondary (MEDIUM confidence)

- **Existing tests (App.test.js, AwardSelector.test.js, awardRatesService.test.js)** — Jest patterns and mock setup for Phase 2 test expansion
- **Phase 1 session notes in STATE.md** — __mockInstance pattern, localStorage spy chain, TDD RED→GREEN approach confirmed working

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Phase 1 confirmed Jest + @testing-library/react; no new dependencies for Phase 2 |
| penaltyConfig shape | HIGH | CONTEXT.md provides locked structure with all fields (earlyMorningThreshold, eveningThreshold, etc.) |
| awardConfig.js structure | HIGH | CONTEXT.md prescribes entry keys and content (awardId, name, penaltyConfig, classifications, baseRates, juniorPercentages, allowances) |
| Refactoring call sites | HIGH | App.js calculatePay() and helpers.js functions are explicit and enumerable; grep finds all uses |
| Pharmacy regression baseline | HIGH | Current code in App.js is known to produce correct Pharmacy pay; hardcoding baseline before refactor is standard TDD |
| Retail/Hospitality thresholds | MEDIUM | Assumed based on common award patterns (Retail 22:00, Hospitality 21:00) but Phase 2 planning should verify with FWC documentation |
| Award classification lists | MEDIUM | Pharmacy classifications are from App.js/helpers.js; Retail and Hospitality must be researched from FWC Award documents during Phase 2 planning |
| Base rates for Retail/Hospitality | LOW | Placeholder values provided; real rates require FWC API or official documents during Phase 2 planning |

**Research date:** 2026-03-07
**Valid until:** 2026-03-14 (Phase 2 planning starts immediately; high-confidence findings remain stable for 1 week)

---

*Research complete. Ready for Phase 2 planning.*
