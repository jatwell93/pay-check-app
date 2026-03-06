# Codebase Concerns

**Analysis Date:** 2026-03-07

## Tech Debt

**Monolithic App Component:**
- Issue: Core business logic and rendering logic are tightly coupled in single large component
- Files: `src/App.js`
- Impact: Difficult to test, difficult to reuse logic, makes the file unmaintainable as it grows (322 lines currently)
- Fix approach: Extract calculation logic into pure utility functions; separate state management from rendering; consider custom hooks for complex state

**Award Rates Hardcoded in App Component:**
- Issue: Pharmacy award rates are embedded directly in `src/App.js` rather than external data source or constants file
- Files: `src/App.js` (lines 35-93)
- Impact: Cannot easily update rates when award changes; mixing configuration data with component logic
- Fix approach: Extract `pharmacyAwardRates` object to separate `src/constants/rates.js` file; consider making it configurable from external data source

**Inconsistent Break Time Calculation Logic:**
- Issue: Break time logic in `src/helpers.js` returns 0 for shifts under 4 hours and between 4-5 hours, which differs from award requirements
- Files: `src/helpers.js` (lines 3-13)
- Impact: Users may receive incorrect pay calculations for shifts under 7.6 hours; all results using this logic could be inaccurate
- Fix approach: Review actual award requirements for break deductions; implement proper logic with documented conditions from the award

**Penalty Description Logic Duplicated:**
- Issue: `getPenaltyDescription` function in `src/App.js` duplicates logic from `getPenaltyRateDetails` in `src/helpers.js` with different implementations
- Files: `src/App.js` (lines 9-33), `src/helpers.js` (lines 47-94)
- Impact: Risk of inconsistency between displayed description and actual calculated rate; maintenance burden
- Fix approach: Consolidate into single source of truth; export both description and multiplier from one function

## Known Bugs

**Overnight Shift Time Comparison Logic Flaw:**
- Symptoms: Evening shift penalty logic compares time string against fixed 24-hour boundary incorrectly
- Files: `src/App.js` (line 22)
- Trigger: When checking if time is between 19:00 and 00:00 in evening shift detection
- Details: Condition uses `timeString >= '19:00' && timeString < '00:00'` which is string comparison; '20:00' < '00:00' is false in string comparison, so most evening times won't match
- Workaround: Use numeric time comparison instead of string comparison

**Invalid Test File:**
- Symptoms: App.test.js test will fail on every run
- Files: `src/App.test.js` (lines 4-8)
- Trigger: Test expects "learn react" text but App component displays "Pharmacy Award Pay Calculator"
- Details: Default CRA test template not updated for this application
- Workaround: None - test will consistently fail

**Casual Loading Applied Twice for Junior Employees:**
- Symptoms: Pay calculation may be double-applying casual loading for junior pharmacy assistants
- Files: `src/App.js` (lines 157-163)
- Trigger: When classification is 'pharmacy-assistant-1' or '-2' and employmentType is 'casual' and age is not 'adult'
- Details: Logic divides by 1.25 then multiplies by 1.25 (lines 159-161), which cancels out but creates confusion
- Workaround: None - logic happens to be mathematically correct but very confusing

**Overtime Calculation Bug for "Above Award" Employees:**
- Symptoms: Overtime pay will crash or show 0 for above-award employees
- Files: `src/App.js` (line 207)
- Trigger: When classification is 'above-award' and totalHours > 38
- Details: Line 207 tries to access `pharmacyAwardRates.fullTimePartTime[classification].base` but 'above-award' doesn't exist in that object
- Workaround: Above-award employees won't have correct overtime calculations; only works for pre-defined classifications

## Security Considerations

**No Input Validation on Numeric Fields:**
- Risk: Users can enter negative or extremely large values for hourly rates, km distances, meal allowances
- Files: `src/components/EmployeeDetails.js` (line 39), `src/components/Allowances.js` (lines 52-87)
- Current mitigation: HTML5 `min={0}` attribute provides only UI-level validation; no server-side validation exists (this is client-only app)
- Recommendations: Add JavaScript validation to reject negative/unreasonable values; implement maximum bounds on input fields

**No Rate Validation Against Awards:**
- Risk: Users can input above-award custom rates that exceed reasonable values, potentially for fraud/error documentation
- Files: `src/App.js` (line 149), `src/components/EmployeeDetails.js` (line 39)
- Current mitigation: None
- Recommendations: Add warning UI when custom rate exceeds reasonable threshold; add disclosure that rates must be approved

**No Data Persistence or Authentication:**
- Risk: Calculations are temporary and not associated with user; privacy concerns if code run on shared browser
- Files: All state stored in React component state
- Current mitigation: None
- Recommendations: Clear disclaimer in UI about information not being stored; consider localStorage warning if adding persistence

## Performance Bottlenecks

**Minute-by-Minute Pay Calculation:**
- Problem: System calculates pay for every single minute of work (line 184-201 in helpers.js), creating unnecessary loop iterations
- Files: `src/helpers.js` (lines 144-227)
- Cause: While loop iterates through every minute, which is over-granular for most purposes (could calculate segments directly)
- Improvement path: Calculate segments based on penalty boundaries once rather than iterating minute-by-minute; maintain accuracy with segment-based math

**No Memoization of Expensive Calculations:**
- Problem: `calculatePay` function recalculates everything from scratch on every button click with no caching
- Files: `src/App.js` (lines 145-284)
- Cause: No use of `useMemo` or `useCallback` hooks; entire complex calculation happens synchronously
- Improvement path: Add `useMemo` to cache results based on inputs; break calculation into smaller memoized functions

**Weekly Data Array Mutation Pattern:**
- Problem: Weekly data is recreated on every state change, causing unnecessary re-renders of all day rows
- Files: `src/App.js` (lines 116-120, 123-134)
- Cause: Not using immutable update patterns efficiently; spread operators create new arrays regardless of what changed
- Improvement path: Use unique keys for days; consider date-based identification instead of array indices

## Fragile Areas

**Award Rates Hardcoding:**
- Files: `src/App.js` (lines 35-93)
- Why fragile: Rates change annually (noted as "effective July 1, 2024"); updating requires code change and rebuild; easy to miss updating both fullTimePartTime and casual rates consistently
- Safe modification: Extract to external JSON/constants file first; add version number; create data migration test
- Test coverage: No unit tests for rate calculations exist

**Time Comparison Logic:**
- Files: `src/helpers.js` (lines 68-89), `src/App.js` (lines 19-30)
- Why fragile: String-based time comparison ('19:00' < '00:00' evaluates incorrectly); overnight shift boundary handling is complex and error-prone
- Safe modification: Add comprehensive test cases for boundary times (06:59, 07:00, 07:01, 18:59, 19:00, 23:59, 00:00); use numeric minute-based comparison instead of strings
- Test coverage: No tests for shift boundary conditions

**Break Time Calculation:**
- Files: `src/helpers.js` (lines 3-13)
- Why fragile: Logic returns same value (0.5 hours) for multiple conditions; unclear if this matches actual award requirements
- Safe modification: Add documentation with award clause references; create test matrix showing input/output for all shift lengths; validate against actual award document
- Test coverage: No tests for break scenarios

**Junior Rate Application:**
- Files: `src/App.js` (lines 157-163)
- Why fragile: Only applies to levels 1 and 2 of pharmacy assistants; logic with multiply/divide by 1.25 is confusing; no comments explaining the intent
- Safe modification: Add detailed comments explaining why division/multiplication is necessary; create test cases for all junior age categories paired with all classifications
- Test coverage: No tests for junior rate calculations

## Scaling Limits

**No Batch Calculation Support:**
- Current capacity: Single user calculating one week at a time
- Limit: Cannot calculate multiple weeks or payroll for multiple employees
- Scaling path: Would need to refactor to batch calculation API; add database for storing results; implement authentication for multi-user support

**No Concurrent Calculation Optimization:**
- Current capacity: Single calculation per button click
- Limit: For large payroll (100+ employees), would need to wait for sequential calculations
- Scaling path: Move calculation to Web Workers; implement queue system; add progress indicators

## Dependencies at Risk

**React Scripts 5.0.1 (CRA):**
- Risk: Create React App is in maintenance mode; using ejected configs is high-maintenance
- Impact: Security updates may lag; dependency conflicts with new React versions
- Migration plan: Consider migrating to Vite or Next.js for better tooling and faster development

**Hardcoded Award Dates:**
- Risk: Award rates are "effective July 1, 2024" with no mechanism for automatic updates
- Impact: Calculations become incorrect after July 1, 2025 without code update
- Migration plan: Add version field to award data; implement mechanism for loading rates from external source

## Missing Critical Features

**No Allowance Visibility Rules:**
- Problem: UI doesn't properly restrict all allowances based on classification; only "Home Medicine Reviews" is disabled for non-pharmacists
- Blocks: Users can select allowances they're not entitled to (e.g., Broken Hill for all employees when it may have eligibility restrictions)
- Impact: Could lead to inflated pay estimates

**No Entitlement Validation:**
- Problem: No mechanism to validate if entered classifications and allowances match actual employment agreements
- Blocks: Calculator cannot verify user's actual award rate or entitlements
- Impact: Users may rely on estimates that don't match their actual award

**No Export/Print Functionality:**
- Problem: Users cannot save or print calculated pay breakdowns for record-keeping
- Blocks: Cannot use as evidence in pay disputes; calculations are lost on page refresh
- Impact: Limited usefulness for real-world employment dispute resolution

**No Comparison Mode:**
- Problem: Cannot compare pay under different classifications, hours, or allowances
- Blocks: Users cannot explore "what-if" scenarios (e.g., what if promoted to next level)
- Impact: Limited utility for career planning or negotiation

## Test Coverage Gaps

**All Business Logic Untested:**
- What's not tested: calculatePayForTimePeriod function (266 lines), all calculations for different shift types, penalty rates, break deductions, overtime calculations, allowance calculations, junior rate applications
- Files: `src/helpers.js` (entire file), `src/App.js` calculation logic (lines 145-284)
- Risk: Changes to complex calculation logic have zero safety net; regressions go undetected until manual testing
- Priority: **High** - Core calculation is what users trust; errors here are most impactful

**Component Rendering Untested:**
- What's not tested: All 6 component files and their prop handling, form input changes, button clicks, conditional rendering
- Files: `src/components/*.js` (all files)
- Risk: UI bugs, broken forms, display issues go undetected
- Priority: **Medium** - UI issues are annoying but don't affect calculation accuracy

**Integration Tests Missing:**
- What's not tested: How components interact; how state flows from input through calculation to display; round-trip user workflows
- Files: `src/App.js` (entire flow)
- Risk: Cannot verify full user scenario works (select classification → enter hours → click calculate → see results)
- Priority: **High** - This is what users actually do

**Edge Case Tests Missing:**
- What's not tested: Overnight shifts, shifts spanning penalty boundaries, junior employees, above-award employees, combinations of allowances, very short/long shifts
- Files: `src/helpers.js` (penalty boundary logic), `src/App.js` (overtime logic)
- Risk: Bugs in edge cases only discovered in production use
- Priority: **High** - Award calculations have many edge cases that should be explicitly tested

---

*Concerns audit: 2026-03-07*
