# Feature Landscape: Fair Work Award Payslip Verifier

**Domain:** Worker-facing compliance verification tool for Australian modern awards
**Researched:** 2026-03-07

## Table Stakes

Features that make the tool useful. Without these, workers cannot verify their pay correctly.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Award and Classification Selection** | Worker must specify which award applies and their job classification to get correct rates | Low | Foundational to accuracy |
| **Shift Time Entry (Daily)** | Worker must enter exact shift start/end times—this is the core input | Low | Already implemented; supports overnight shifts |
| **Penalty Rate Calculation** | Awards specify different pay rates for different times (early morning, evening, weekends, public holidays) — calculation must be minute-accurate | High | Already implemented in helpers.js with boundary windows (00:00, 07:00, 19:00, 24:00) |
| **Break Time Deduction** | Shifts > 5 hours include unpaid breaks; must be deducted from paid hours | Medium | Already implemented (varies 0–0.5 hours based on shift length) |
| **Weekly Total & Per-Day Breakdown** | Worker needs to see total pay and understand which days contributed what | Low | Already implemented with daily breakdown table |
| **Overtime Calculation** | Full-time/part-time employees get overtime >38 hrs/week (first 2 hrs at 1.5×, rest at 2×) | Medium | Already implemented; casual employees don't get overtime |
| **Pay Comparison (Actual vs Calculated)** | Worker enters their actual paid amount; tool shows discrepancy so they know if underpaid | Low | **NOT YET IMPLEMENTED** — required for active scope |
| **Award Rate Currency** | Rates must be up-to-date (Annual Wage Review occurs annually, usually July 1) | Medium | Currently hardcoded for Pharmacy (July 1, 2024) — will use FWC API for dynamic rates |
| **Multiple Award Support (2-4 awards)** | Tool only works if worker can select Pharmacy, Retail, or Hospitality | Medium | Currently Pharmacy only — API integration will enable this |

## Differentiators

Features that set this tool apart from Fair Work Ombudsman's Pay Calculator and other free tools.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Minute-Accurate Penalty Boundaries** | Fair Work Ombudsman's calculator rounds to hours; this tool calculates minute-by-minute across boundary windows. Catches underpayment that hourly rounding misses. | High | Already implemented; uses penalty boundary logic (00:00, 07:00, 19:00, 24:00) to split shifts into segments |
| **Visual Segment Breakdown** | Worker sees exactly which hours were paid at which rates (ordinary vs penalty vs overtime) with times and amounts | Low | Already implemented with detailed breakdown table showing start/end times, hours, rate type, and dollar amounts |
| **Segment-Level Rate Descriptions** | Clear labels like "Early Morning Shift (125%)" and "Saturday (150%)" help workers understand *why* their pay is what it is | Low | Already implemented with `penaltyDescription` field in breakdown |
| **Week Overview Mode (Planned)** | Shows pass/fail indicator per day (green = paid correctly, red = underpaid) for quick visual check | Medium | Part of active scope; not yet implemented |
| **Day-Level Drill-Down (Planned)** | Click a day to see its full segment breakdown (all penalty windows within that day) | Low | Part of active scope; not yet implemented; UI enhancement only |
| **Employment Type Distinction** | Casual vs full-time/part-time have different base rates, casual loading, and overtime rules. Tool handles all three. | Low | Already implemented; applies casual loading (1.25×) only to casual employees on ordinary shifts |
| **Junior Rate Scaling** | For Pharmacy Assistants Level 1-2, scales base rate by age (45% under 16, 50% at 16, 60% at 17, etc.) | Low | Already implemented; age selector controls junior percentage |
| **Allowances Calculation** | Different awards have different allowances (laundry, meal, motor vehicle, special roles). Tool breaks these out. | Medium | Already implemented for Pharmacy (7 allowance types); will scale with API for Retail/Hospitality |

## Anti-Features

Features to explicitly NOT build in v1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Payslip PDF/Image Upload** | Optical character recognition and PDF parsing are complex, fragile, and error-prone. Hard to validate if extraction is correct. | Manual entry is sufficient. Workers can copy shift times from their roster and compare final amounts manually. |
| **All 121 Modern Awards** | Attempting to support all awards upfront introduces massive complexity (120 different penalty structures, allowances, classifications). Better to validate approach with 2-4 key awards first. | Focus on Pharmacy, Retail, Hospitality (covers ~40% of Australian retail/services workforce). Plan for extensibility via API. |
| **Payslip Dispute Lodging / Legal Action** | Tool is informational only. Providing dispute mechanics could expose tool to liability and requires legal expertise. | Provide clear links to Fair Work Ombudsman and encourage workers to lodge their own disputes with evidence. |
| **User Accounts / Data Persistence** | Tool is stateless and web-first. No backend infrastructure. No need to store user data. | localStorage for optional session caching (cached API responses, user's last entered shifts). No cloud backend. |
| **Mobile Native App** | Web app via React SPA is faster to build and reaches workers immediately (web-first). Mobile web is responsive and sufficient. | Ensure responsive design. Consider PWA (service worker) for offline access if needed in future. |
| **Rostering, Penalty Conditions, Complex Award Clauses** | Many awards have conditional penalties (e.g., "no penalty if roster provided 7 days in advance"). Modeling these requires award-specific logic per employee. | Keep tool simple: apply standard penalties (weekend/night) that apply universally. Note in UI: "Some award conditions may not be reflected—always consult the award." |
| **Time Zone Handling** | Award penalties are based on clock time, not timezone. Adding timezone logic introduces complexity for edge cases (interstate workers, DST). | Assume all times are in local timezone of the worker's location. Store timezone in settings if multi-state support needed later. |

## Award Structural Differences

### Penalty Time Windows & Rates

All three target awards share similar penalty boundary structures but with subtle differences:

#### Pharmacy Industry Award (MA000012)

**Weekday Ordinary Hours:** Monday–Friday, 07:00–19:00 = 100% (base rate)

**Penalty Windows:**
- 00:00–07:00 (Early Morning): +25% (1.25× multiplier)
- 19:00–24:00 (Evening): +25% (1.25× multiplier)
- Saturday: +50% (1.5× multiplier)
- Sunday: +100% (2.0× multiplier, or "double time")
- Public Holiday: +100% (2.0× multiplier, or "double time" — can be 2.5× if on weekend)

**Casual Loading:** Applies 1.25× loading to casual employees' base rates (except above-award casuals).

**Overtime (Full-Time/Part-Time Only):**
- Triggered when weekly hours exceed 38
- First 2 hours: 1.5× multiplier
- Remaining hours: 2.0× multiplier
- Calculation is weekly, not daily

**Break Deductions:**
- <4 hrs: No break
- 4–5 hrs: 10-minute paid break (no deduction)
- 5–7.6 hrs: 10-minute paid + 30-minute unpaid (0.5 hr deduction)
- >7.6 hrs: 2× 10-minute paid + 30-minute unpaid (0.5 hr deduction)

**Classifications:** 15 distinct levels (Assistants 1-4, Technicians 1-4, Students 1-4, Interns 1-2, Pharmacists with seniority tiers)

**Allowances:** 7 types (Home Medicine Review, Laundry, Broken Hill, Motor Vehicle, Meal Allowance, Meal Allowance Extra)

---

#### Retail Industry Award (MA000003)

**Weekday Ordinary Hours:** Monday–Friday, ~08:00–18:00 = 100% (base rate)
*Note: Exact times may vary slightly; depends on shop trading hours agreement.*

**Penalty Windows:**
- Before 08:00 or after 18:00 (weekday): +25% (1.25× multiplier)
  - Exact hours depend on shop agreement; default is above
- Saturday: +25% (1.25× multiplier) — **different from Pharmacy**
- Sunday: +75% (1.75× multiplier) — **different from Pharmacy** (pharmacy is 2.0×)
- Public Holiday: +100% (2.0× multiplier)

**Casual Loading:** 1.25× loading applies to casual employees.

**Overtime (Full-Time/Part-Time Only):**
- Triggered when weekly hours exceed 38
- First 2 hours: 1.5× multiplier
- Remaining hours: 2.0× multiplier
- Similar structure to Pharmacy

**Break Deductions:**
- <4 hrs: No break
- 4–6 hrs: 1 break (varies by agreement; often 10 min paid)
- >6 hrs: 2 breaks (varies by agreement; often 10 min paid + 30 min unpaid)
- Break duration is award-dependent and may require shop agreement

**Classifications:** ~20 levels (Sales Assistants 1-3, Team Leaders, Supervisors, Store Managers, Specialty roles like bakery, deli, produce)

**Allowances:** Different from Pharmacy (e.g., Deli/Butcher Allowance, Motor Vehicle, Uniform/Clothing, Junior rates if <21 years)

---

#### Hospitality Industry Award (MA000010)

**Weekday Ordinary Hours:** Monday–Friday, ~07:00–21:00 = 100% (varies by role: wait staff, kitchen, housekeeping)
*Note: "Ordinary" definition is more flexible in hospitality; depends on rostering and role.*

**Penalty Windows:**
- Before 07:00 or after 21:00 (weekday): +25% (1.25× multiplier)
  - May vary if employee works non-standard hours (e.g., late-night venues)
- Saturday: +25% (1.25× multiplier)
- Sunday: +75% (1.75× multiplier)
- Public Holiday: +150% (2.5× multiplier) — **different from Pharmacy (2.0×)**

**Casual Loading:** 1.25× loading applies to casual employees.

**Overtime (Full-Time/Part-Time Only):**
- Triggered when weekly hours exceed 38
- First 2 hours: 1.5× multiplier
- Remaining hours: 2.0× multiplier
- Same as Pharmacy and Retail

**Break Deductions:**
- <4 hrs: No break
- 4–6 hrs: 1 break (10 min paid or unpaid, depending on award clause)
- >6 hrs: 2 breaks (varies; typically 10 min + 30 min or similar)
- Hospitality breaks are often structured around role (wait staff vs kitchen)

**Classifications:** ~15 levels (Cooks, Wait Staff, Bar Staff, Housekeeping, Head roles like Chef, Head Waiter, Managers, etc.)

**Allowances:** Different from Pharmacy and Retail (e.g., Laundry, Motor Vehicle, Special Skills, Supervisor duties, Uniform/Clothing)

---

### Key Structural Differences Summary

| Dimension | Pharmacy | Retail | Hospitality |
|-----------|----------|--------|-------------|
| **Saturday Penalty** | +50% (1.5×) | +25% (1.25×) | +25% (1.25×) |
| **Sunday Penalty** | +100% (2.0×) | +75% (1.75×) | +75% (1.75×) |
| **Public Holiday Penalty** | +100% (2.0×) | +100% (2.0×) | +150% (2.5×) |
| **Weekday Evening Threshold** | 19:00 | ~18:00 (variable) | ~21:00 (variable) |
| **Weekday Evening Penalty** | +25% (1.25×) | +25% (1.25×) | +25% (1.25×) |
| **Break Rules** | Simple (0–0.5 hr deduction) | Complex (varies by shop agreement) | Complex (role-dependent, varies by agreement) |
| **Junior Rates** | Assistants 1-2 only, age 16-20 | Sales Assistants 1-3, age <21 | Some roles have juniors, age-dependent |
| **Casual Loading** | 1.25× (standard) | 1.25× (standard) | 1.25× (standard) |
| **Overtime Threshold** | 38 hrs/week (FT/PT only) | 38 hrs/week (FT/PT only) | 38 hrs/week (FT/PT only) |
| **Overtime Rates** | 1st 2 hrs 1.5×, rest 2.0× | 1st 2 hrs 1.5×, rest 2.0× | 1st 2 hrs 1.5×, rest 2.0× |

---

## Feature Dependencies

```
Award & Classification Selection
├── Shift Time Entry (independent)
├── Penalty Rate Calculation (depends on award selection)
│   ├── Break Deduction (depends on shift length)
│   └── Overtime Calculation (depends on employment type & weekly total)
├── Award Rate Currency (depends on award selection)
├── Allowances Calculation (depends on award & classification & shift details)
└── Pay Comparison (independent of others)

Week Overview Mode
└── Daily Breakdown (existing; required input)

Day-Level Drill-Down
└── Segment Breakdown (existing; required input)
```

---

## MVP Recommendation

### Phase 1: Core (Existing, Live)
✓ Pharmacy award only, hardcoded rates
✓ Penalty calculation (minute-accurate)
✓ Daily and segment breakdown
✓ Overtime handling
✓ Allowances for Pharmacy

### Phase 2: Add Multi-Award Support (Active Scope)
- [ ] FWC MAAPI v1 integration (fetch Pharmacy, Retail, Hospitality rates)
- [ ] LocalStorage caching for API responses
- [ ] Award selector (dropdown: Pharmacy, Retail, Hospitality)
- [ ] Dynamic classification list (updates when award changes)
- [ ] Pay comparison feature (worker enters actual paid amount, tool shows discrepancy)

### Phase 3: UI Enhancements
- [ ] Week overview mode (pass/fail per day)
- [ ] Day-level drill-down (click day to expand segment breakdown)

### Phase 4: Extended Support (Post-MVP)
- [ ] Additional awards (move to 5-10 awards as demand grows)
- [ ] User preferences (default award, payment frequency)
- [ ] Share/export breakdown (PDF or JSON for dispute evidence)

---

## Complexity Notes by Feature

| Feature | Why Complex | Mitigation |
|---------|------------|-----------|
| **Award Structural Mapping** | Each award has different penalty windows, break rules, allowances, classifications, junior scales. Hard to generalize. | Use FWC API to source of truth; map API response structure consistently. Don't try to hand-code award logic. |
| **Minute-Accurate Boundary Crossing** | Shifts that cross penalty boundaries (e.g., 18:45–19:30) must split into segments. High precision needed. | Already solved in helpers.js. Reuse existing boundary logic. Ensure it handles all 3 awards' boundary times. |
| **Overnight Shift Handling** | Shift spanning midnight (e.g., 22:00–06:00) must apply correct day penalties (Saturday→Sunday). Complex date math. | Already solved in helpers.js. Test edge cases: Saturday midnight shift, Public Holiday→weekday, etc. |
| **Casual Loading Interaction** | Casual loading (1.25×) interacts with other penalties. Does it stack or replace? Pharmacy rule: casual loading applies to ordinary rate, not above-award rates. | Document per-award rule clearly. Test with FWC API data to confirm. |
| **Break Time Calculation** | Different awards have different break rules and thresholds. Some breaks are paid, some unpaid. | Extract break rule into per-award configuration. Store in API response or separate config file. |
| **Allowances Variability** | Each award has completely different allowances (Laundry in Pharmacy, Deli in Retail, etc.) with different trigger conditions. | Don't hardcode. Use FWC API to get allowance list. UI should dynamically render checkboxes/inputs based on award. |

---

## Sources & Confidence

| Topic | Source | Confidence |
|-------|--------|-----------|
| Pharmacy Award (MA000012) structure | Existing codebase + PROJECT.md | HIGH (hardcoded, tested) |
| Retail Award (MA000003) penalties | Training data (knowledge cutoff Feb 2025) | MEDIUM (not verified with current FWC MAAPI v1) |
| Hospitality Award (MA000010) penalties | Training data (knowledge cutoff Feb 2025) | MEDIUM (not verified with current FWC MAAPI v1) |
| FWC MAAPI v1 capabilities | PROJECT.md context | HIGH (official API mentioned) |
| Break deduction rules (all awards) | Training data + existing Pharmacy implementation | MEDIUM (Pharmacy verified in code, Retail/Hospitality need API verification) |
| Minute-accurate penalty logic feasibility | Existing helpers.js implementation | HIGH (proven working) |
| Casual loading rules | Training data + existing code | MEDIUM (Pharmacy verified, generalization to other awards needs testing) |

---

## Gaps & Research Flags for Phase-Specific Work

### For API Integration Phase
- [ ] **Confirm Retail Award penalty thresholds with FWC MAAPI v1**: Is Saturday really 1.25× or is it 1.5×? Confirm evening threshold exact time.
- [ ] **Confirm Hospitality Award public holiday multiplier**: Is it 2.0× or 2.5×? Depends on interaction with weekend penalties.
- [ ] **Clarify break rules in API response**: Does FWC API expose break structure per award? If not, will need manual configuration.
- [ ] **Allowances availability in API**: Which allowances does API expose per award? Are there conditional allowances (e.g., "only if rostered 7+ days in advance")?
- [ ] **Casual loading interaction**: Does FWC API indicate when casual loading stacks vs replaces other penalties?

### For Week Overview & Drill-Down Phase
- [ ] **Define "pass" vs "fail" logic**: Should a $0.01 underpayment show as red (fail) or only if >$1 underpayment?
- [ ] **Rounding rules**: Fair Work uses specific rounding rules for payslips. Confirm they match our calculation.

### For Extended Multi-Award Phase
- [ ] **Award selection UX**: Should tool pre-select award based on geolocation, or always require manual selection?
- [ ] **Classification search**: With 100+ classifications across awards, simple dropdown may not scale. Implement search/filter?
