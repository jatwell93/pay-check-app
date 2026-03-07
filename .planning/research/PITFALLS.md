# Domain Pitfalls: FWC MAAPI Integration into React SPA

**Domain:** Client-side React SPA integrating FWC Modern Awards Pay Database API
**Researched:** 2026-03-07
**Focus:** Award rate dynamics, API key exposure, penalty boundary differences, multi-award data complexity

## Critical Pitfalls

These cause rewrites, silent pay miscalculations, or full data loss.

### Pitfall 1: API Key Exposure in Client-Side Code

**What goes wrong:**
The FWC MAAPI subscription key is placed directly in client-side JavaScript (environment variables, localStorage initialization, hardcoded strings). Attackers extract the key from network requests, browser DevTools, or bundled code. They then:
- Exhaust API rate limits on your behalf (denial of service)
- Impersonate your application to FWC (reputational risk)
- Access API endpoints not intended for malicious use

**Why it happens:**
SPAs have no backend server to hide secrets. Developers assume "it's just read-only data" so they embed the key anyway. Environment variables compiled into the bundle at build time are still visible.

**Consequences:**
- API access cut off due to rate limiting abuse
- Service degradation for legitimate users
- Potential account suspension or blacklisting
- No way to rotate the key without redeploying the entire app

**Prevention:**
1. **Do NOT expose the key in client-side code.** This is non-negotiable.
2. Create a lightweight backend proxy (simple Node.js server, AWS Lambda, Vercel serverless function, or similar). This proxy:
   - Sits between the React app and FWC MAAPI
   - Receives requests from the app (e.g., GET `/api/rates/pharmacy`)
   - Adds the subscription key to the FWC request server-side
   - Returns the response to the app
   - Can enforce rate limiting, caching, and request validation
3. Even a minimal proxy (5-10 lines of code) eliminates the exposure.
4. If a backend is impossible, use localStorage caching aggressively to minimize API calls. Cache for 365 days and only fetch on explicit user action or app initialization.

**Detection (warning signs):**
- Key appears in network tab (DevTools → Network → Headers)
- Key visible in `window.__ENV__` or similar global variable
- Key in compiled bundle (check `npm run build` output)
- Error messages leak the API key in console logs

**Phase responsibility:** **Phase 1 (API Integration)** — Must be designed in, not retrofitted.

---

### Pitfall 2: Award Penalty Boundary Structures Differ Wildly Between Awards

**What goes wrong:**
You assume all awards have the same penalty boundary structure (07:00 ordinary, 19:00 penalty, Saturday 150%, Sunday 200%). You hardcode this into `getPenaltyRateDetails()` in helpers.js, then fetch Retail and Hospitality award rates from FWC. But:

- **Retail awards** may have different boundaries (e.g., 22:00 instead of 19:00 for evening shift penalty)
- **Hospitality awards** may treat Saturday/Sunday differently (e.g., Sunday is not automatically 200%)
- **Some awards** have shift-specific rules (e.g., penalty applies only to shifts starting after 18:00, not 19:00)
- **Public holiday rules** vary (some awards: 250% for first 4 hours + 200% after; others: flat 200%)
- **Casual loading** interacts differently with penalties in different awards (stacks in some, replaces in others)

Your minute-by-minute penalty calculation (helpers.js lines 144–227) assumes a fixed boundary model. It applies the wrong rates to shifts under the Retail award.

**Example scenario:**
```
Pharmacy award: 19:00–midnight = 125% penalty
Retail award: 22:00–midnight = 125% penalty

Shift: 20:00–23:00
- Under Pharmacy: 60 mins @ 125%, 60 mins @ ordinary = incorrect
- Under Retail: 120 mins @ ordinary = correct

Your app calculates Pharmacy rates for a Retail worker → overpays by ~5–10%.
```

**Why it happens:**
- Boundary info is embedded in `getPenaltyRateDetails()` with no way to swap penalty structures
- FWC data includes penalty definitions per award, but developers skip reading the penalty schema and assume universality
- Testing with only Pharmacy award hides the bug

**Consequences:**
- Silent pay miscalculation (overpay or underpay depending on award)
- Workers rely on incorrect estimates for pay disputes
- Liability exposure if app is used in wage claim and shows wrong amounts
- Difficult to detect: calculations "look correct" but use wrong penalty boundaries
- Bug scales: every additional award multiplies the risk

**Prevention:**
1. **Extract penalty boundaries to data-driven structure** before adding multiple awards:
   ```javascript
   const awardPenaltyBoundaries = {
     'MA000012': { // Pharmacy
       eveningStartMinutes: 19 * 60,
       eveningEndMinutes: 24 * 60,
       saturdayMultiplier: 1.5,
       sundayMultiplier: 2,
       publicHolidayMultiplier: 2.5,
       casaualLoadingMultiplier: 1.25,
     },
     'MA000003': { // Retail
       eveningStartMinutes: 22 * 60,
       eveningEndMinutes: 24 * 60,
       saturdayMultiplier: 1.5,
       sundayMultiplier: 2.0, // Different from pharmacy!
       publicHolidayMultiplier: 2.5,
       casualLoadingMultiplier: 1.25,
       // Note: hypothetical; check actual FWC data
     },
   };
   ```
2. **Refactor `getPenaltyRateDetails()` to accept award-specific boundaries** as parameter (not just hardcoded).
3. **Load penalty structures from FWC API response**, not assumed or hardcoded.
4. **Create test matrix** with sample shifts for each award to verify boundary application:
   - Shift at 18:30, 19:00, 19:30 (boundaries)
   - Saturday vs Sunday rates
   - Public holidays with complex multiplier stacking
5. **Document the penalty structure assumptions** in comments for each award, referencing the FWC award clause.

**Detection (warning signs):**
- Penalty description changes when switching awards, but hours/rates don't change
- Pay for same shift differs unexpectedly between awards
- Tests only use Pharmacy award
- `getPenaltyRateDetails()` has hardcoded time boundaries with no award parameter
- Developers haven't reviewed FWC penalty schemas for each target award

**Phase responsibility:** **Phase 2 (Multi-Award Support)** — Refactor penalty logic before adding Retail/Hospitality.

---

### Pitfall 3: Casual Loading Stacking Logic Becomes Incomprehensible Across Awards

**What goes wrong:**
Casual loading (typically 125%) is applied differently depending on award, classification, and penalty:

- **Pharmacy casual assistant**: 125% loading on base rate, including penalty boundaries? Or only on ordinary hours?
- **Retail casual**: May apply a different percentage or not at all for some classifications
- **Hospitality casual**: May stack with penalty rates differently (e.g., 20% loading instead of 25%)
- **Public holiday + casual**: Does casual loading apply? Or is it already included?

Your current code (App.js lines 157–163) applies casual loading as a modifier to junior rates with confusing multiply/divide logic:
```javascript
baseRate = baseRate * juniorPercentage / (employmentType === "casual" ? 1.25 : 1);
if (employmentType === 'casual') {
  baseRate = baseRate * 1.25; // Reapply casual loading
}
```

This works for Pharmacy but makes incorrect assumptions for other awards.

**Example scenario:**
```
Pharmacy Assistant 1, casual, adult, Pharmacy award:
- Award rate: $32.49/hr (already includes 25% casual loading)
- Your code: ✓ Correct

Retail employee, casual, unknown how to apply 20% or 25% loading:
- FWC data says "20% loading applies only to non-penalty hours"
- Your code: Applies 25% to all hours = overpayment
```

**Why it happens:**
- Award documents use different terminology ("loading," "premium," "supplement") inconsistently
- Casual vs full-time distinction in award rates is sometimes baked into the base rate, sometimes applied as a separate multiplier
- Developers copy Pharmacy logic and assume it's universal
- Casual loading interacts with other penalties in complex ways (does 200% public holiday include casual loading? Or is it casual loading PLUS 200%?)

**Consequences:**
- Incorrect casual pay calculations for non-Pharmacy awards
- Different wrong answers depending on combination of classification + award + penalty
- Difficult to validate: unit tests pass but real-world calculations are wrong
- Risk of workers being underpaid in casual roles (legal liability)

**Prevention:**
1. **Map each award's casual loading rule explicitly** from FWC data:
   ```javascript
   const awardCasualRules = {
     'MA000012': {
       type: 'baked-in', // Rate is already casual-inclusive
       percentage: 0.25,
       appliesTo: ['all-hours'],
     },
     'MA000003': {
       type: 'separate-loading',
       percentage: 0.20,
       appliesTo: ['non-penalty-hours-only'], // Example
     },
   };
   ```
2. **Never hard-code casual loading logic.** Always fetch from FWC and apply data-driven.
3. **Document the assumption** in comments when casual loading is included in a rate vs applied separately.
4. **Test each award's casual classification** independently:
   - Casual, standard shift
   - Casual, penalty shift (evening, Saturday, etc.)
   - Casual, public holiday
   - Compare output to FWC example calculations
5. **Separate casual loading calculation** from base rate logic. Create a function `applyCasualLoading(baseRate, award, classifification, isPenaltyHour)` that encapsulates the award-specific rule.

**Detection (warning signs):**
- Casual loading hardcoded to 1.25 with no award parameter
- Multiply/divide logic that "happens to work" for Pharmacy but is not comprehensible
- No tests for casual loading under different awards
- Casual pay is significantly different from expected when testing with real FWC data

**Phase responsibility:** **Phase 2 (Multi-Award Support)** — Refactor casual logic before adding awards where casual rules differ.

---

### Pitfall 4: Caching Strategy Fails, API Calls Cascade, Rate Limiting Breaks the App

**What goes wrong:**
You implement naive localStorage caching without version handling:

```javascript
const cachedRates = localStorage.getItem('pharmacyRates');
if (cachedRates) return JSON.parse(cachedRates);

// Fetch from FWC...
localStorage.setItem('pharmacyRates', JSON.stringify(rates));
```

Then:
- **Award rates change** (Annual Wage Review in July). Old cached rates are stale. You don't notice for weeks.
- **Cache is never cleared**. Users see outdated rates indefinitely.
- **Multiple browser tabs** all make the same FWC request simultaneously on app load. Rate limiting hits immediately.
- **Cache key collision**. Generic `'pharmacyRates'` key doesn't include version or date. You push an update, old cache pollutes the new version.
- **Selective clearing fails**. You clear Pharmacy rates but cache Retail separately. User switches between awards, hitting API every time.
- **No fallback**. API goes down. App has no cached rates and shows blank/error.

**Why it happens:**
- Developers assume rates update rarely (they do) but don't build versioning
- Cache-busting strategy isn't thought through
- Testing is done with single browser tab; multi-tab scenario isn't tested
- No monitoring of API call frequency; rate limiting is a surprise in production

**Consequences:**
- Users see stale wage rates (underpayment risk)
- API requests spike unexpectedly, hitting limits
- App becomes unusable when API is temporarily down
- Cache poisoning: old data persists across versions
- Difficult to debug: cache is silently stale, calculations look correct

**Prevention:**
1. **Use versioned cache keys** with expiry metadata:
   ```javascript
   const cacheKey = `fwc_rates_${awardCode}_v${CACHE_VERSION}_${year}`;
   const cached = localStorage.getItem(cacheKey);

   if (cached) {
     const { data, expiresAt } = JSON.parse(cached);
     if (new Date() < new Date(expiresAt)) {
       return data; // Use cache
     } else {
       localStorage.removeItem(cacheKey); // Expired, clear it
     }
   }
   ```
2. **Set cache expiry to 30–90 days** (rates are annual, but if they change unexpectedly, you don't want stale data for a year).
3. **Implement RequestDeduplication** for simultaneous requests:
   ```javascript
   // If two tabs request the same award simultaneously, only fetch once
   const pendingRequests = new Map();
   function getCachedOrFetch(awardCode) {
     if (pendingRequests.has(awardCode)) {
       return pendingRequests.get(awardCode); // Return pending promise
     }
     const promise = fetchFromFWC(awardCode).then(data => {
       localStorage.setItem(cacheKey, JSON.stringify(data));
       pendingRequests.delete(awardCode);
       return data;
     });
     pendingRequests.set(awardCode, promise);
     return promise;
   }
   ```
4. **Monitor cache hit/miss rate**. Log when fetching vs using cache.
5. **Provide a manual "refresh rates" button** in the UI for users who suspect stale data.
6. **Implement graceful fallback**:
   - If API is down and cache is stale, use cached data with a disclaimer ("Rates may be outdated").
   - Don't show error or blank screen.
7. **Subscribe to FWC webhooks** (if available) to know when rates change, and proactively clear cache.

**Detection (warning signs):**
- `localStorage.getItem('pharmacyRates')` called without version or expiry check
- No cache busting strategy documented
- Testing with single browser tab only
- Users report rates being different than expected weeks after an update
- API rate limiting errors in production

**Phase responsibility:** **Phase 1 (API Integration)** — Design cache strategy from the start.

---

### Pitfall 5: Award Data Schema Surprises (Missing Fields, Unexpected Nesting)

**What goes wrong:**
FWC API returns award data in a structure you didn't anticipate:

```javascript
// You expect:
{
  awardCode: "MA000012",
  baseName: "Pharmacy",
  classifications: [
    { id: "pharm-asst-1", name: "Pharmacy Assistant Level 1", baseRate: 25.99 }
  ],
  allowances: [
    { id: "home-med-review", amount: 17.96 }
  ]
}

// FWC actually returns:
{
  id: "...",
  title: "Pharmacy Industry Award 2024",
  effectiveDate: "2024-07-01",
  classifications: [
    {
      classificationId: "...",
      title: "Pharmacy Assistant Level 1 - Full Time",
      minRate: { amount: 25.99, currency: "AUD" },
      casRates: [
        { description: "Senior Casual", rate: 35.50 },
        // CAS-specific rates per classification, not anticipated
      ]
    }
  ],
  allowances: {
    "home-medicine-review": {
      amount: { amount: 17.96, currency: "AUD" },
      appliesTo: ["pharmacist", "intern-2"], // Not all classifications!
      frequency: "weekly", // Added field you didn't handle
    },
  },
  penaltyRates: {
    // Entire structure you didn't expect
    "evening-shift": { startTime: "19:00", multiplier: 1.25 },
    "saturday": { multiplier: 1.5, note: "Applies to start time only" }
  }
}
```

Your code tries to access `classifications[0].baseRate` but it's actually `classifications[0].minRate.amount`. App crashes or shows undefined.

**Why it happens:**
- FWC API schema is not documented in detail (or documentation lags reality)
- Developers build code based on examples, which often simplify the actual schema
- No schema validation library in place to catch missing/extra fields
- Testing with only Pharmacy award hides schema differences in other awards

**Consequences:**
- App crashes when fetching certain awards (try/catch masks the issue)
- Silent failures: calculations use `undefined` rates, resulting in 0 or NaN
- Data corruption: nested structures misinterpreted
- Support burden: users report "app broke for Retail, works for Pharmacy"
- Difficult to debug: network response looks valid, but code can't find the fields

**Prevention:**
1. **Fetch actual API response** for each target award and inspect the full schema (don't assume examples are complete).
2. **Use a schema validation library** (e.g., `zod`, `yup`, `ajv`):
   ```javascript
   import { z } from 'zod';

   const AwardRateSchema = z.object({
     awardCode: z.string(),
     classifications: z.array(z.object({
       id: z.string(),
       name: z.string(),
       baseRate: z.number(),
     })),
     allowances: z.record(z.number()), // Flexible object shape
   });

   const response = await fetch(awardApiUrl);
   const data = await response.json();

   const validated = AwardRateSchema.parse(data); // Throws if schema mismatches
   ```
3. **Handle optional/conditional fields explicitly**:
   ```javascript
   const allowances = award.allowances?.map(a => ({
     id: a.id,
     amount: a.amount?.amount || a.amount, // Handle nested currency object
     appliesTo: a.appliesTo || [], // Default to empty if missing
   })) || [];
   ```
4. **Document the expected schema** in comments with examples.
5. **Add comprehensive logging** when parsing API responses:
   ```javascript
   console.log('Fetched award schema:', JSON.stringify(awardData, null, 2));
   ```
6. **Test with real API data** for each target award in development, not mock data.

**Detection (warning signs):**
- Code accesses nested fields without checks (e.g., `data.classifications[0].baseRate` vs `data.classifications[0]?.minRate?.amount`)
- No validation library imported
- Errors like "Cannot read property 'baseRate' of undefined"
- App works with Pharmacy but crashes with Retail
- Calculating pay returns NaN or incorrect amounts when a classification is selected

**Phase responsibility:** **Phase 1 (API Integration)** — Define schema validation upfront.

---

## Moderate Pitfalls

### Pitfall 6: Public Holiday Logic Varies by Award, Incorrectly Stacked

**What goes wrong:**
Your code treats all public holidays as 200% pay (or 250% on Pharmacy). But:

- Some awards distinguish **National Public Holiday** (200%) vs **State Public Holiday** (150%)
- Some awards have **"substitute" public holiday rules** (if you work a public holiday and get a substitute day off later, the substitute is paid at ordinary rate, not the day worked)
- **Time-based stacking**: First 4 hours at 200%, after 4 hours at 250% (some awards)
- **Casual loading interaction**: Does casual loading apply on top of public holiday? Or is it included?

You hardcode day === 'Public Holiday' → 2.5x multiplier in `getPenaltyRateDetails()`. When you add awards with different rules, the calculation is silent-wrong.

**Prevention:**
1. Store public holiday multipliers per award (base, additional, conditional).
2. Create a function to determine public holiday type (national vs state) based on date and location (if award is location-specific).
3. Test each award's public holiday scenario independently.
4. Document in comments which clauses of the award support each rule.

**Detection:**
- Public holiday pay differs unexpectedly from award document for a given award
- Same public holiday date has different rates for different classifications

**Phase responsibility:** **Phase 2 (Multi-Award Support)** — Validate before adding awards with different public holiday rules.

---

### Pitfall 7: Junior Rate Percentage Application Becomes Award-Specific and Undefined

**What goes wrong:**
Your code applies junior rates only to Pharmacy Assistant Levels 1 and 2:
```javascript
if ((classification === 'pharmacy-assistant-1' || classification === 'pharmacy-assistant-2') && age !== 'adult')
```

But FWC data may say:
- Pharmacy: Levels 1–2 get junior rates (matches your assumption)
- Retail: Levels 1–3 get junior rates, with different percentages per level
- Hospitality: All classifications except manager get junior rates

Your hardcoded list breaks. You manually update it for each award, but forget one, and Retail shows wrong rates.

**Prevention:**
1. Store junior rate eligibility per award and classification: `awardJuniorRules['MA000003']['retail-assistant-1'] = true`
2. Fetch junior rate percentages from FWC; don't assume they're the same across awards.
3. Build a function `isJuniorRateEligible(award, classification, age)` that looks up the rule.

**Detection:**
- Junior rates hardcoded to Pharmacy Assistant 1–2 with no flexibility
- When a new award is added, junior rates are wrong for some classifications

---

### Pitfall 8: Allowance Eligibility Rules Not Enforced

**What goes wrong:**
Your current UI allows users to select allowances freely (Home Medicine Reviews, Broken Hill, Motor Vehicle, etc.) without validating whether the classification entitles them:

```javascript
// Current code: No eligibility check
if (allowances.homeMedicineReview) {
  totalAllowances += pharmacyAwardRates.allowances.homeMedicineReview;
}

// Should be:
if (allowances.homeMedicineReview && isEligibleForAllowance('homeMedicineReview', classification)) {
  totalAllowances += rates.allowances.homeMedicineReview;
}
```

For Pharmacy, maybe only Pharmacists can claim Home Medicine Reviews. But your UI lets any classification select it. Worker enters incorrect allowance, pay estimate is inflated, and they're shocked when actual payslip is lower.

When you add Retail and Hospitality, allowance eligibility rules differ further (e.g., Broken Hill allowance may not apply to Retail).

**Prevention:**
1. Fetch allowance eligibility rules from FWC per award and classification.
2. Disable or hide ineligible allowances in the UI.
3. Show a tooltip explaining why an allowance is disabled.
4. Validate in the calculation function, not just UI (server-side validation in future backend).

**Detection:**
- Allowance selections are not filtered by classification
- Allowance descriptions don't mention eligibility restrictions
- Calculated pay is higher than expected because ineligible allowance was applied

---

### Pitfall 9: Overtime Rules Hardcoded to Pharmacy Full-Time/Part-Time Logic

**What goes wrong:**
Your overtime calculation (App.js lines 199–214) assumes:
- Casual employees don't get overtime
- Full-time/part-time get overtime after 38 hours
- First 2 hours at 1.5x, remainder at 2x

But FWC awards differ:
- Some awards define overtime as hours beyond weekly ordinary hours, which vary by award (not always 38)
- Some awards have penalties that already include "overtime-like" premium (e.g., evening shift is 125%, which might be considered the "overtime rate" for that award)
- Casual employees may get overtime under some awards

When you add Retail award (which may have 38 hrs for full-time but 20 hrs for part-time), your code uses 38 for both.

**Prevention:**
1. Store ordinary hours per award and employment type: `ordinaryHours['MA000003']['part-time'] = 20`
2. Fetch overtime multipliers from FWC (not hardcoded 1.5 and 2.0).
3. Create function `calculateOvertimePay(totalHours, award, employmentType, baseRate)` that looks up award-specific rules.
4. Test overtime calculation for each award independently.

**Detection:**
- Overtime hours and pay are the same for all awards (suggest hardcoding)
- Calculated pay is off when adding awards with different ordinary hour definitions

---

### Pitfall 10: Penalty Rate Stacking Is Ambiguous (Penalty + Casual + Overtime)

**What goes wrong:**
When a casual employee works Saturday evening (19:00–midnight):
- Does Saturday 150% apply first, then casual 125%? (150% * 125% = 187.5% total)
- Does casual 125% apply first, then Saturday 150%? (same result, but logic unclear)
- Or do they interact differently in the award text? (e.g., "casual loading is not payable on Saturdays")

Your minute-by-minute calculation applies penalties in a fixed order without documenting which award's rules you're following. When you add awards with different stacking rules, the logic breaks.

**Prevention:**
1. Document the stacking order explicitly per award (which penalty is applied first/last).
2. Refactor `getPenaltyRateDetails()` to accept stacking rules from the award definition.
3. Create test cases for every combination of conditions (casual + penalty, weekend + casual, overtime + penalty, etc.).
4. Reference the exact award clause in comments explaining the stacking order.

**Detection:**
- No comments explaining penalty stacking order
- Penalty multipliers seem inconsistent when tested against real-world examples
- Tests are missing for multi-condition scenarios (casual + Saturday, etc.)

---

## Minor Pitfalls

### Pitfall 11: Break Time Rules Differ by Award

**What goes wrong:**
Your break calculation (helpers.js lines 3–13) returns 0.5 hours for all shifts > 4 hours. But:
- Pharmacy may say "30-minute unpaid break for shifts > 7.6 hours"
- Retail may say "10-minute paid break + 30-minute unpaid for shifts > 4 hours"
- Hospitality may have different break entitlements per shift length

Your fixed logic applies Pharmacy break rules to all awards.

**Prevention:**
1. Store break rules per award: `breakRules['MA000003'] = [{ minHours: 4, unpaidMinutes: 30 }, ...]`
2. Refactor `calculateBreakTime()` to accept award parameter.
3. Test break deductions for each award.

**Detection:**
- Break calculation hardcoded to Pharmacy rules
- Calculated hours differ when tested against award documents for other awards

---

### Pitfall 12: Award Effective Date Not Tracked, Stale Rates Applied

**What goes wrong:**
FWC rates change on specific dates (Annual Wage Review, usually July 1). You cache rates with no date tracking:
```javascript
localStorage.setItem('pharmacyRates', JSON.stringify(rates));
```

Months later, July 1 arrives. New rates are effective. Your app still uses old cached rates. Users calculate pay with outdated rates. By October, dozens of users have made decisions based on stale rates.

**Prevention:**
1. Include `effectiveDate` in cached data: `{ data: rates, effectiveDate: "2024-07-01", ... }`
2. Display effective date in UI: "Rates current as of July 1, 2024"
3. Check if today's date is >= next scheduled review date (usually July 1). If so, force a refresh.
4. Log when rates are stale, so you know to update.

**Detection:**
- Cache has no date metadata
- UI doesn't display which date rates are effective as of
- Users report pay discrepancies after July 1

---

### Pitfall 13: Error Messages Expose API Response Details or Keys

**What goes wrong:**
If FWC API fails, your error handler logs the entire response:
```javascript
.catch(err => {
  console.error('API Error:', err); // Might log the full response with sensitive info
  alert('Failed to fetch rates'); // Generic message to user
});
```

The response might contain request headers, auth info, or API error messages that leak implementation details.

**Prevention:**
1. Log only the HTTP status code and a generic error message internally.
2. Show user-friendly error message without technical details.
3. Sanitize console logs in production (remove sensitive fields).

---

### Pitfall 14: No Validation That Selected Award Matches Worker's Actual Employment

**What goes wrong:**
Your app lets users select any award. A worker selects Pharmacy award but actually works in Retail. They calculate pay under wrong award. Pay estimate is incorrect. They compare against their payslip and assume they're underpaid, when actually they just chose the wrong award.

**Prevention:**
1. Add a validation step: "Confirm this is your correct modern award" with a link to FWC to look it up.
2. Show award title and key features to help user confirm.
3. Warn if user's entered rates don't match the selected award's rates.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation Strategy | Priority |
|-------------|---------------|-------------------|----------|
| **Phase 1: API Integration** | API key exposure in client-side code | Design backend proxy or aggressive caching strategy upfront | CRITICAL |
| **Phase 1: API Integration** | Cache strategy incomplete (no versioning, expiry, deduplication) | Implement versioned cache keys, expiry metadata, request deduplication before launch | CRITICAL |
| **Phase 1: API Integration** | Award data schema not validated | Use zod/yup to validate FWC response schema before processing | HIGH |
| **Phase 1: API Integration** | Penalty description logic duplicated from Pharmacy | Consolidate `getPenaltyDescription()` and `getPenaltyRateDetails()` into single source of truth | MEDIUM |
| **Phase 2: Multi-Award Support** | Penalty boundary structure assumed to be universal | Refactor penalty logic to accept award-specific boundaries as data (not hardcoded) | CRITICAL |
| **Phase 2: Multi-Award Support** | Casual loading logic breaks for different awards | Map casual loading rules per award; test each award's casual scenarios independently | CRITICAL |
| **Phase 2: Multi-Award Support** | Junior rate eligibility hardcoded to PA 1–2 | Build flexible junior rate eligibility lookup per award and classification | HIGH |
| **Phase 2: Multi-Award Support** | Overtime rules assume 38-hour week for all awards | Store ordinary hours per award; fetch overtime multipliers from FWC | HIGH |
| **Phase 2: Multi-Award Support** | Public holiday rules not differentiated by award | Document public holiday multiplier logic per award; test each award independently | MEDIUM |
| **Phase 2: Multi-Award Support** | Allowance eligibility not enforced; users select ineligible allowances | Filter allowance UI by classification; validate in calculation function | MEDIUM |
| **Phase 3: UI/UX** | Break time calculation is award-specific, not account for variations | Refactor break logic to accept award parameter; test break rules per award | MEDIUM |
| **Phase 3: UI/UX** | Effective date of rates not displayed; users unaware of stale rates | Include and display `effectiveDate` in cached data; force refresh if date > next review date | MEDIUM |
| **Ongoing: Testing** | All business logic untested; bugs in new awards undetected until production | Implement unit tests for each award's penalty, casual, junior, overtime, allowance logic | HIGH |
| **Ongoing: Testing** | No integration tests; full workflow (select award → enter shift → calculate → compare) untested | Add e2e tests for each target award with real-world shift scenarios | HIGH |

---

## Sources & References

- **FWC Modern Awards Database**: https://www.fairwork.gov.au/awards-and-agreements/modern-awards
- **FWC Developer API**: https://developer.fwc.gov.au/ (assumed; verify current API documentation)
- **Pharmacy Industry Award (MA000012)**: Check FWC website for current version and effective date
- **Retail Award**: Verify penalty boundaries, casual loading, and allowance eligibility rules per FWC
- **Hospitality Award**: Verify break entitlements, overtime rules, and public holiday multipliers per FWC
- **Context from codebase**:
  - Current penalty logic in `helpers.js` (lines 47–94, 144–227)
  - Casual loading logic in `App.js` (lines 157–163)
  - Overtime calculation in `App.js` (lines 199–214)
  - Break calculation in `helpers.js` (lines 3–13)

---

*Research completed: 2026-03-07*
*Assessment confidence: MEDIUM (FWC API not directly verified; pitfalls inferred from domain knowledge of award structures and SPA architecture constraints)*
