# Phase 1: API Foundation & Award Selection - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate the FWC Modern Awards Pay Database API (fwc-maapi-v1) as the data source for award rates,
implement localStorage caching, and build the AwardSelector component. Phase 1 delivers the data
layer and award selection UI — no changes to the calculation engine or classification logic (Phase 2).

Awards in scope: Pharmacy Industry Award (MA000012), General Retail Industry Award (MA000003),
Hospitality Industry (General) Award (MA000009).

</domain>

<decisions>
## Implementation Decisions

### API Key & Authentication
- User has/will obtain an FWC API key from developer.fwc.gov.au
- Key stored as `REACT_APP_FWC_API_KEY` in `.env` — embedded in the CRA build (accepted risk for a
  public rate-data API with no sensitive user data)
- Real FWC API calls from day one — no mock data layer for Phase 1

### Award Data Scope
- Fetch rates for 3 awards on load: MA000012 (Pharmacy), MA000003 (Retail), MA000009 (Hospitality)
- These 3 awards populate the AwardSelector dropdown

### Award Selector Placement & Behavior
- Award selector lives at the top of the form, above EmployeeDetails — first input the user encounters
- Switching award immediately resets classification selection and clears any calculated results
- Shift hours entered are preserved on award switch (they remain valid inputs)
- No confirmation warning on switch — immediate action, low disruption since hours are kept
- Phase 1 scope boundary: classification dropdown continues to show Pharmacy classifications regardless
  of selected award; award-specific classifications are a Phase 2 concern

### Caching Strategy
- Cache TTL: 90 days (rates change at most annually; 90 days is conservative)
- Cache stored in localStorage with versioned keys and expiry metadata
- "Last updated" timestamp displayed near the award selector
- Manual "Refresh Rates" button sits near the award selector alongside the timestamp

### Refresh UX
- Refresh button shows spinner and disables during the re-fetch
- On success: brief inline "Rates updated" message that fades after 3 seconds
- Timestamp updates to reflect the new fetch time

### Fallback Behavior
- If API unreachable AND cached rates exist: use cache, show small inline warning near selector —
  "Using cached rates (API unavailable)"
- If API unreachable AND no cache exists (first visit, no connection): fall back to hardcoded Pharmacy
  rates with a warning message so the app remains usable

### Loading & Error States
- First-visit load (no cache): award selector shows spinner and is disabled; rest of form remains
  usable (user can review shift inputs while rates load)
- API error (any failure — network, bad key, 500): inline plain-language message near selector,
  no HTTP codes or technical details
  e.g. "Couldn't load award rates. Using Pharmacy defaults — Refresh to try again."
- Refresh button shows spinner + disabled state during re-fetch

### Claude's Discretion
- Exact localStorage key naming convention and schema structure
- axios vs fetch choice for HTTP client
- Schema validation library (zod vs yup) for FWC API response validation
- Request deduplication implementation (prevent parallel calls on multi-tab)
- Exact spinner/loading indicator component style (consistent with existing app)
- Error boundary approach for unexpected API response shapes

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `pharmacyAwardRates` object in `App.js`: hardcoded rates that serve as the fallback when API is
  unreachable and no cache exists — keep in place, reference in fallback logic
- `helpers.js` penalty boundaries (07:00/19:00 thresholds): Pharmacy-specific, unchanged in Phase 1
- Existing `useState` pattern in `App.js`: all state centralised here; add `selectedAward`,
  `awardRates`, `awardLoading`, `awardError` to the same pattern

### Established Patterns
- All state in `App.js`, passed as props to presentational components — AwardSelector follows this
- Components in `src/components/` are purely presentational — `awardRatesService.js` should live in
  `src/` (or `src/services/`) as a non-component module
- No existing HTTP client, no axios installed — new dependency needed

### Integration Points
- `App.js`: new state fields + `useEffect` to call `awardRatesService.js` on mount
- Top of JSX render in `App.js`: insert `<AwardSelector>` above `<EmployeeDetails>`
- `awardRatesService.js`: new file, isolated service — not a React component

</code_context>

<specifics>
## Specific Ideas

- "Rates last updated 45 days ago — Refresh" style timestamp + button pairing near the selector
- "Couldn't load award rates. Using Pharmacy defaults — Refresh to try again." as the error copy
- Inline "Rates updated" success confirmation that fades after ~3 seconds

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 1 scope. Award-specific classifications and penalty
  boundary extraction are explicitly Phase 2 scope.

</deferred>

---

*Phase: 01-api-foundation-award-selection*
*Context gathered: 2026-03-07*
