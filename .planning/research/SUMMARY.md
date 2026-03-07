# Research Summary: Pay Check App Multi-Award Support

**Project:** Pay Check App — Fair Work Award Payslip Verifier
**Domain:** Worker-facing compliance tool for Australian modern awards; React SPA integrating FWC Modern Awards API
**Researched:** 2026-03-07
**Confidence:** MEDIUM-HIGH

## Executive Summary

The Pay Check App is transitioning from a single-award (Pharmacy) calculator to a multi-award verification tool by integrating the FWC MAAPI v1 to fetch live award rates. The existing minute-accurate penalty calculation engine is a strong foundation that should be preserved and parameterized to support different awards' penalty structures. The approach is technically sound: keep Create React App (no Vite migration needed), integrate axios with localStorage caching (versioned, 30-90 day expiry), and refactor core logic to be data-driven rather than hardcoded.

The critical challenge is **award structural variance**. Pharmacy, Retail, and Hospitality awards differ significantly in penalty boundaries (Saturday/Sunday/evening times), casual loading rules, public holiday multipliers, break entitlements, and allowance eligibility. The app must be designed from Phase 1 with these differences in mind, not retrofitted. The second major risk is **client-side API key exposure**; if FWC requires a secret key, a backend proxy is mandatory. If FWC supports public-tier keys for rate queries, the SPA can work as-is with aggressive caching to minimize API calls.

Recommended approach: Phase 1 focuses on API foundation (service layer, caching, schema validation) with Pharmacy as the default fallback. Phase 2 refactors calculation logic to be award-agnostic. Phase 3+ adds new awards incrementally, validating each award's specific rules before launch.

## Key Findings

### Recommended Stack

Keep Create React App as the build foundation (no migration to Vite needed). Integrate axios with axios-retry for HTTP calls to FWC MAAPI v1, paired with native browser localStorage for caching award rates (fits the expected 2-5 MB per award comfortably). No additional state management library needed; existing React hooks + localStorage are sufficient.

**Core technologies:**
- **React 19.1.0** — Existing framework; stable and sufficient for SPA needs
- **Create React App 5.0.1** — No build complexity (no SSR, monorepo, or edge rendering) justifies keeping CRA; Vite overkill for this use case
- **axios 1.6.2+** — HTTP client with interceptors for cache detection, request deduplication, and retry logic; superior to fetch for this use case
- **localStorage (native)** — Persist FWC API responses; 30-90 day cache expiry with version-tagged keys
- **Workbox (bundled with CRA)** — Service worker for offline support and background cache refresh (Phase 2+)

**API key strategy:** If FWC MAAPI v1 supports public-tier keys for read-only rate queries, embed public key in `public/fwc-config.js` (committed to repo, rate-limited per origin). If secret key required, implement Node.js backend proxy (Express on Vercel/Railway) in Phase 2; this prevents key exposure and enables server-side caching. Current recommendation: verify with FWC documentation before Phase 1 implementation.

### Expected Features

**Must have (table stakes):**
- Award and classification selection — worker must pick correct award to get correct rates
- Daily shift time entry (with overnight shift support) — already implemented and working
- Minute-accurate penalty rate calculation (early morning 00:00-07:00, evening 19:00-24:00, Saturday, Sunday, public holidays) — already implemented; must preserve and parameterize
- Break time deduction (varies 0-0.5 hours by shift length) — already implemented
- Weekly total and per-day breakdown — already implemented
- Overtime calculation for full-time/part-time (>38 hrs/week: first 2 hrs at 1.5x, rest at 2x) — already implemented
- Award rate currency (rates updated annually on July 1; must be current) — moving from hardcoded to API-driven

**Should have (competitive differentiators):**
- Minute-accurate boundary crossing (unlike FWC's hourly rounding) — already implemented; key advantage
- Visual segment breakdown with penalty descriptions — already implemented
- Pay comparison feature (worker enters actual paid amount; tool shows underpayment/overpayment) — not yet implemented but required for active scope
- Week overview mode with pass/fail per day — planned

**Defer to v2+:**
- PDF/payslip upload with OCR — complex, fragile; manual entry sufficient
- All 121 modern awards upfront — focus on 2-4 awards (Pharmacy, Retail, Hospitality) to validate approach
- Dispute lodging/legal action — tool is informational only; link to FWC instead
- User accounts/data persistence — stateless SPA with optional localStorage; no backend needed
- Multi-timezone support — assume local timezone; add settings if multi-state expansion needed

### Architecture Approach

Preserve the existing penalty calculation engine in `helpers.js` (calculatePayForTimePeriod) as-is, but parameterize it to accept award-specific penalty config instead of hardcoded Pharmacy values. Introduce a new API service layer (awardRatesService.js) to handle FWC MAAPI calls, caching, normalization, and fallback logic. Refactor App.js state to include selectedAward, awardRates, awardLoading, awardError. Refactor components (EmployeeDetails, Allowances) to derive values from awardRates instead of hardcoded pharmacy rates. New components: AwardSelector (dropdown), ModeToggle (overview/drill-down/comparison), OverviewBreakdown (week grid), DrillDownBreakdown (single-day drill-down), ComparisonView (actual vs calculated with discrepancy). All new components receive data via props from App.js; no internal state needed.

**Major components:**
1. **API Service (awardRatesService.js)** — Fetch award list, fetch individual award rates, normalize FWC responses, manage localStorage cache with versioning and expiry, handle fallback to hardcoded Pharmacy rates on API failure
2. **Award Selection & State (App.js + AwardSelector)** — Let user pick award, load rates on selection, reset classification and results when award changes, manage loading/error states
3. **Calculation Engine (helpers.js + App.js)** — Apply penalty config from API, determine base rate from awardRates state, calculate overtime using award-specific rules, apply allowances with eligibility checks
4. **Display Modes (OverviewBreakdown, DrillDownBreakdown, ComparisonView)** — Show week overview, single-day drill-down, or actual vs calculated comparison based on viewMode state

### Critical Pitfalls

1. **API Key Exposure** (Phase 1) — Client-side SPA cannot hide secret API keys. If FWC requires secret key, implement backend proxy immediately (Node.js + environment variables). Do NOT embed key in client-side code, environment variables at build time, or anywhere visible in bundle/network traffic. If public key, still rate-limit aggressively via caching to prevent abuse.

2. **Award Penalty Boundaries Assumed Universal** (Phase 2) — Pharmacy has 19:00 evening threshold; Retail may have 22:00; Hospitality may have 21:00. Saturday penalty is 150% in Pharmacy, 125% in Retail. Sunday is 200% in Pharmacy, 175% in Retail. Public holiday is 200% in Pharmacy, 250% in Hospitality. Hardcoding these values breaks when adding new awards. Extract to award-specific data structure in API response; refactor calculatePayForTimePeriod to accept penaltyConfig parameter.

3. **Casual Loading Logic Incomprehensible Across Awards** (Phase 2) — Casual loading (typically 125%) is applied differently per award. In Pharmacy it's baked into the casual rate. In Retail it may be a separate percentage or only on non-penalty hours. Current multiply/divide logic in App.js assumes Pharmacy rules. Map casual loading type per award (baked-in vs separate-loading) and test each award's casual scenarios independently before launch.

4. **Cache Strategy Fails Under Load** (Phase 1) — Naive localStorage caching without versioning, expiry, or request deduplication causes stale data, API rate limiting, and multi-tab conflicts. Use versioned cache keys (include award ID, cache version, year), set 30-90 day expiry, deduplicate simultaneous requests, and provide manual refresh button. Monitor cache hit/miss rates in production.

5. **FWC API Schema Mismatches** (Phase 1) — FWC API response structure may differ from documented examples (nested currency objects, optional fields, classification-specific rates). Build code on assumptions, then API returns unexpected structure. Use schema validation library (zod or yup) to validate responses before processing. Fetch actual API responses for each target award in development to verify schema.

---

## Implications for Roadmap

Based on research, the roadmap should follow this sequence. The build order prioritizes dependency relationships: API foundation must come before calculation refactoring, which must come before component updates, which must come before new features.

### Phase 1: API Foundation & Framework Setup
**Rationale:** Everything depends on fetching the right rates correctly. Cannot refactor calculations or add awards without this layer.

**Delivers:**
- FWC MAAPI v1 client service layer (awardRatesService.js) with axios + retry logic
- localStorage caching with versioned keys, expiry metadata, and request deduplication
- Schema validation for FWC API responses (zod or yup)
- AwardSelector component with static dropdown (2-4 awards)
- App.js state extended with selectedAward, awardRates, awardLoading, awardError
- Fallback to hardcoded Pharmacy rates if API fails
- Initial load: award list fetch, default award pre-load

**Must address pitfalls:**
- API key exposure — design either public-tier key strategy (with aggressive caching) or backend proxy path
- Cache strategy — implement versioned keys, expiry, deduplication from the start
- Schema validation — validate FWC response structure before processing

**Avoids:**
- All multi-award support logic; calculation engine unchanged
- New UI components (OverviewBreakdown, DrillDownBreakdown, ComparisonView)
- Real API endpoint integration (stub with mock responses for testing)

**Blockers:** None (can mock FWC API responses)

**Research needed:** FWC MAAPI v1 authentication approach (public tier vs secret key?); actual API response schema for target awards

---

### Phase 2: Decouple Calculations from Hardcoded Data
**Rationale:** Existing penalty logic must become award-agnostic before adding new awards. This phase refactors core logic without changing calculation results for Pharmacy (regression-proof).

**Delivers:**
- Parameterized calculatePayForTimePeriod() accepting penaltyConfig (backwards compatible)
- Award-specific penalty boundaries extracted to API response (Saturday rate, evening times, etc.)
- Refactored getPenaltyDescription() accepting penaltyConfig
- calculatePay() in App.js deriving base rates from awardRates instead of pharmacyAwardRates
- Casual loading logic refactored to accept award-specific rule (baked-in vs separate)
- Allowance calculation using awardRates.allowances instead of hardcoded pharmacyAwardRates

**Uses:**
- axios + localStorage caching from Phase 1
- Pharmacy as default/fallback throughout

**Implements:**
- Core calculation engine decoupling
- Data-driven penalty structure
- Award-agnostic base rate and allowance lookups

**Deliverable:** Calculation produces identical results for Pharmacy Award (regression test passes)

**Must address pitfalls:**
- Penalty boundary universality — encode all award-specific values in awardRates structure
- Casual loading variance — map per-award rules and test each scenario
- Overtime/ordinary hours — store per-award values (38 hrs is not universal)

**Blockers:** Requires Phase 1 complete (awardRates state available)

**Research needed:** Exact penalty structures for Retail and Hospitality awards from FWC; casual loading application rules per award

---

### Phase 3: Component Refactoring for Multi-Award Support
**Rationale:** EmployeeDetails and Allowances components must dynamically render based on selected award. This enables users to see correct classifications and allowances for each award.

**Delivers:**
- EmployeeDetails component refactored to accept classifications array from awardRates
- EmployeeDetails refactored to validate selected classification against current award
- Allowances component dynamically renders allowances from awardRates
- Allowance eligibility enforcement (show/hide ineligible allowances per classification)
- Age options passed as prop (award-specific junior rate age tiers)
- Dynamic calculation of allowance amounts using awardRates values

**Implements:**
- Component prop-based design (no hardcoded references to pharmacyAwardRates)
- Award selection → classification list refresh → allowance list refresh flow

**Delivers:** User selects award → classifications and allowances update automatically

**Blockers:** Requires Phase 2 complete (calculation engine refactored)

**Research needed:** Classification hierarchy and junior rate eligibility per award; allowance eligibility rules per award and classification

---

### Phase 4: Week Overview & Drill-Down Modes
**Rationale:** Provides users with more detailed views of their pay breakdown. Foundational for "Pass/Fail" week overview feature.

**Delivers:**
- ModeToggle component (Overview / Drill-Down / Comparison buttons)
- OverviewBreakdown component (week grid: days with hours, calculated pay, actual paid input, discrepancy, pass/fail)
- DrillDownBreakdown component (single-day selector + segment breakdown table)
- App.js state: viewMode, selectedDayForDrillDown
- Pass/Fail logic: day is "green" if discrepancy <= 0.01, "red" if underpaid

**Implements:**
- Multi-view UI framework
- Week-level and day-level pay analysis
- Basic comparison capability (side-by-side actual vs calculated)

**Delivers:** Users can view week overview or drill down to single-day segment breakdown

**Blockers:** Requires Phase 2 complete (calculations working)

**Research needed:** Pass/fail threshold definition (how much discrepancy triggers a red flag?); rounding rules for Fair Work compliance

---

### Phase 5: Pay Comparison & Discrepancy Detection
**Rationale:** Enables workers to compare calculated pay against what they actually received, identifying underpayment.

**Delivers:**
- ComparisonView component with actual amount input
- Discrepancy calculation: calculated - actual
- Color-coded indicator (red for underpay, green for overpay, neutral for match)
- Warning message: "You may have been underpaid $X.XX"
- localStorage optional persistence of last entered amount

**Implements:**
- Worker-facing comparison interface
- Underpayment detection

**Delivers:** Workers can detect if they've been underpaid based on award rates

**Blockers:** Requires Phase 4 complete (UI framework established)

---

### Phase 6: Real FWC API Integration & Multi-Award Testing
**Rationale:** Connect real FWC MAAPI v1 endpoints, test with Pharmacy, Retail, Hospitality; validate normalization and cache behavior.

**Delivers:**
- awardRatesService.js updated with real FWC MAAPI v1 endpoints
- Authentication handling (public key or backend proxy, depending on FWC requirements)
- Tested integration with 2-4 real awards (Pharmacy, Retail, Hospitality, +1 other)
- Validation that normalization handles all awards' schema variations
- Cache expiry and invalidation testing
- Rate limiting and load testing
- Full e2e test suite (select award → enter shift → calculate → compare pay)

**Uses:**
- All previous phases (API service, calculation refactoring, components, UI modes)

**Delivers:** Production-ready multi-award system with real FWC rates

**Must validate:**
- Each award's penalty boundaries applied correctly
- Casual loading logic correct per award
- Allowance eligibility enforced properly
- Junior rate percentages applied correctly
- Break deductions match award rules

**Blockers:** FWC API key acquisition/setup; FWC API availability/CORS configuration

**Research needed:** Confirm FWC API endpoint URLs, authentication, and response schema for each target award; test CORS support from web origin

---

### Phase Ordering Rationale

1. **Phase 1 → 2 dependency:** Calculation refactoring requires awardRates state from API service
2. **Phase 2 → 3 dependency:** Component refactoring requires award-agnostic calculation engine
3. **Phase 3 → 4 dependency:** Multi-view components require working calculations
4. **Phase 4 → 5 dependency:** Comparison view depends on OverviewBreakdown framework
5. **Phase 5 → 6 dependency:** Real API integration tests all previous phases end-to-end

This ordering enables:
- Early validation of API strategy and caching (Phase 1) before refactoring core logic
- Regression testing (Phase 2) before touching components
- Component updates (Phase 3) after calculation logic is stable
- New features (Phases 4-5) added incrementally on stable foundation
- Real-world testing (Phase 6) validates entire system

---

### Research Flags

**Phases requiring deeper research during planning:**
- **Phase 1 (API Integration):** FWC MAAPI v1 authentication approach and CORS support must be verified early. If secret key required and CORS unsupported, Phase 1 design changes to backend proxy architecture. **Research needed before starting Phase 1.**
- **Phase 1 (API Integration):** FWC API response schema must be confirmed for each target award. Fetch real responses in development. **Research artifact:** actual JSON responses from FWC for MA000012, MA000003, MA000010.
- **Phase 2 (Multi-Award Support):** Exact penalty boundary times, casual loading rules, and overtime definitions must be extracted from official FWC award documents and/or API schema. **Research artifact:** detailed penalty structure map for each award.
- **Phase 6 (Real API Integration):** Each award's penalty, casual, junior, overtime, and allowance logic must be validated against FWC example payroll calculations before launch. **Research artifact:** test vectors with expected pay for each award.

**Phases with standard patterns (skip research-phase):**
- **Phase 3 (Component Refactoring):** Standard React component patterns; no new domain research needed.
- **Phase 4 (UI Modes):** Standard React UI patterns; no new domain research needed.
- **Phase 5 (Comparison):** Standard UI pattern; no new research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | React 19 + CRA + axios + localStorage is industry-standard for SPA + external API; existing codebase confirms compatibility |
| **Features** | HIGH | Pharmacy award logic proven in existing code; other awards' feature differences inferred from FWC domain knowledge (training data cutoff Feb 2025); must validate with FWC MAAPI v1 |
| **Architecture** | HIGH | Component-based refactoring and service layer abstraction are proven patterns; existing penalty calculation logic is solid foundation |
| **Pitfalls** | MEDIUM | Critical pitfalls identified based on domain complexity and SPA constraints; FWC API authentication approach and exact schema differences are unverified and must be confirmed before Phase 1 |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

1. **FWC MAAPI v1 authentication approach** — Research determined that if FWC requires secret API key, a backend proxy is mandatory. However, FWC may offer public-tier keys for read-only rate queries. **Action:** Verify with FWC documentation or contact sales before Phase 1. This decision shapes entire Phase 1 architecture (SPA-only vs SPA+backend).

2. **Exact penalty boundary times and multipliers for Retail/Hospitality** — Research used training data (knowledge cutoff Feb 2025) to infer that Retail and Hospitality have different penalty structures than Pharmacy. **Action:** Fetch real API responses for MA000003 and MA000010 from FWC in Phase 1 development to confirm exact structures.

3. **Casual loading application rules per award** — Pharmacy casual loading is baked into the casual rate; Retail/Hospitality may apply it differently. **Action:** Confirm in FWC award documents and/or API schema before Phase 2 refactoring.

4. **FWC API response schema completeness** — API may include fields not documented in examples (nested currency objects, award-specific rate overrides, conditional allowances). **Action:** Fetch real responses for all target awards before finalizing normalizeAwardRates() function in Phase 1.

5. **CORS support from web origin** — FWC API CORS headers may not permit requests from browser origin. **Action:** Test CORS early in Phase 1 (curl with Origin header). If unsupported, escalate to backend proxy.

6. **Cache expiry duration optimization** — Research recommends 30-90 days based on Annual Wage Review cycle. Actual optimal expiry depends on FWC update frequency and user tolerance for stale data. **Action:** Monitor cache hit rates and user feedback in Phase 6 to tune expiry.

7. **Pass/Fail threshold for week overview** — Research suggests $0.01 tolerance, but Fair Work may have specific rounding rules. **Action:** Confirm with FWC documentation or payroll samples during Phase 4 implementation.

---

## Sources

### Primary (HIGH confidence)
- **Existing codebase (App.js, helpers.js)** — Penalty calculation logic, Pharmacy award structure, employment type handling verified working
- **CLAUDE.md (project context)** — Architecture overview, existing component structure, key files documented
- **FWC Modern Awards Database** (official) — Pharmacy Industry Award MA000012 structure used for feature definitions

### Secondary (MEDIUM confidence)
- **STACK.md research** — Technology recommendations based on industry patterns for React SPA + external API
- **FEATURES.md research** — Feature landscape and award structural differences inferred from domain knowledge (knowledge cutoff Feb 2025)
- **ARCHITECTURE.md research** — Component boundaries and data flow patterns aligned with existing codebase
- **PITFALLS.md research** — Critical pitfalls identified based on multi-award system complexity and SPA constraints

### Tertiary (LOW confidence, verification needed)
- **Retail Award (MA000003) structure** — Training data only; must verify against real FWC MAAPI v1 response
- **Hospitality Award (MA000010) structure** — Training data only; must verify against real FWC MAAPI v1 response
- **FWC MAAPI v1 authentication requirements** — Assumed based on typical SaaS API patterns; must verify with official FWC documentation

---

*Research completed: 2026-03-07*
*Ready for roadmap creation: yes*
*Next step: Roadmapper uses this summary to structure detailed phase requirements and acceptance criteria*
