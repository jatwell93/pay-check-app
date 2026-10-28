# Plan — General Retail Industry Award support

## Goal

Make the **General Retail Industry Award** a fully working award in Pay Checker:
when a user selects it in the award selector, the employee-details fields,
base rates, penalty application, overtime, allowances, and the resulting pay
audit must all be correct for that award — to the same standard the Pharmacy
Industry Award path already meets.

## Current state (verified inventory)

- `src/config/awardConfig.js` is the single source of truth for award data,
  keyed by FWC award ID. The MA000012 (pharmacy) entry is accurate and locked
  by regression tests. A second entry labelled "General Retail Industry Award"
  exists but is explicitly marked as **stub data** — do not trust its values,
  its classification ladder, or its allowance set without checking.
- `src/App.js` holds `selectedAward` state and `calculatePay` reads the
  selected award's config. Some award-specific mechanics may be baked into
  code rather than config — audit `calculatePay` and `src/helpers.js` for
  anything that only happens to be correct for pharmacy.
- `netlify/functions/award-rates.js` proxies the FWC MAPD API
  (`/awards/{fixed_id}/pay-rates`) and `src/services/awardRatesService.js`
  fetches + caches the raw response. Trace the data path end to end: does
  live API data actually reach the calculator in the shape it expects? If
  there is a gap, close it.
- `src/components/Allowances.js` and the allowance block inside `calculatePay`
  are written around the pharmacy allowance set. The retail award has a
  different set — some pharmacy allowances don't exist under retail, and
  retail has allowances the pharmacy award doesn't.
- `src/components/ImportantNotes.js` already takes `awardName` as a prop —
  check whether its content is accurate for retail.

## Environment limits

You have **no web access**. Award facts must come from the codebase, the FWC
API contract, and your own knowledge of the award. For every award-specific
fact you rely on — identifiers, classification structure, rate values, penalty
windows and multipliers, overtime tiers, junior rates, allowance names and
amounts — record it in a new file `docs/award-assumptions.md`: the value used,
what it was based on, and your confidence. A human will verify it against the
official GRIA pay guide after the run.

## Requirements

1. The retail award works end-to-end through the real code path (selector →
   details → hours → calculate → breakdown).
2. Do not assume the existing award-code constants identify the awards they
   claim to — verify each identifier maps to the correct award and fix any
   wrong mapping.
3. Where award mechanics differ between awards (e.g. overtime tier structure,
   penalty windows, how casual loading interacts with penalties), make them
   config-driven rather than hardcoded — without changing pharmacy results.
4. The Allowances UI and calculation must present and apply the *selected*
   award's allowance set — retail-only allowances must be offered, and
   pharmacy-only allowances must not appear or apply under retail.
5. Add tests covering retail-specific behaviour, matching the style of
   `src/__tests__/pharmacyRegression.test.js`.
6. All 87+ existing tests stay green — pharmacy behaviour is locked.
7. Create `docs/award-assumptions.md` per the Environment limits section.

## Constraints

- Retail award only. Do not expand or modify the hospitality stub.
- No new dependencies.
- UI changes stay inside the existing design system (Tailwind tokens and
  component patterns already in the codebase).
- Do not change the pharmacy award's data or observable behaviour.

## Acceptance

- `CI=true npm test -- --watchAll=false` green including new retail coverage
- `npm run build` clean
- `ubs -q .` shows no new criticals/warnings vs baseline (0 critical / 15 warn)
- `impeccable detect src` reports 0 anti-patterns
- Selecting the retail award shows retail classifications and retail allowance
  fields, and produces a pay audit using retail penalty structure
- `docs/award-assumptions.md` exists and lists every award fact relied on
