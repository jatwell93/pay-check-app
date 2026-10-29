# Award Assumptions — General Retail Industry Award (MA000004)

**Status: pending human verification against the official FWC GRIA pay guide.**

This environment had no web access, so every award-specific fact below comes from
(one or both of):

- **[Repo]** — the existing codebase and its FWC MAPD API contract
  (`netlify/functions/award-rates.js`, `src/config/awardConfig.js`), including the
  regression-locked Pharmacy (MA000012) dataset that establishes this app's
  rate/penalty model.
- **[Knowledge]** — the author's knowledge of the General Retail Industry Award
  2020 (GRIA) and FWC pay guide conventions, effective **1 July 2024**
  (2023–24 Annual Wage Review, 3.75% increase).

Confidence is **High / Medium / Low**. Anything Low **must** be checked against
the official GRIA pay guide before shipping real-world compliance advice.

---

## 1. Award identity

| Fact | Value used | Basis | Confidence |
|---|---|---|---|
| FWC award ID for General Retail Industry Award | **MA000004** | [Knowledge] GRIA 2020 is MA000004 — printed on every FWC GRIA document and pay guide. The pre-existing config entry was keyed **MA000003**, which does **not** identify GRIA (wrong mapping per plan requirement 2; fixed). | High |
| FWC MAPD `award_fixed_id` | `codeToFixedId('MA000004')` → **4** | [Repo] `award-rates.js` maps `MA0*(\d+)` → integer; consistent with the documented MA000012 → 12 example. | Medium-High |
| Award display name | `General Retail Industry Award` | [Repo]+[Knowledge] | High |

## 2. Classification structure

| Fact | Value used | Basis | Confidence |
|---|---|---|---|
| Classification ladder | Retail Employee **Level 1–6** (+ app-level "Above Award") | [Knowledge] GRIA Schedule B defines Retail Employee Levels 1–6 (Level 6 ≈ large-store senior supervisory). The stub's "Retail Supervisor" is **not** a GRIA classification and was removed. | **Medium — verify level count** |
| Junior rate classifications | Levels 1 and 2 | [Knowledge] Junior percentages apply to the lower retail classifications; supervisory levels are adult-rate. | Medium |

## 3. Base rates (per hour, effective 1 July 2024)

Rate model (matches the regression-locked pharmacy dataset): full-time/part-time
rate is the minimum ordinary rate; casual rate **includes** the 25% casual loading.

| Classification | FT/PT used | Casual used | Basis | Confidence |
|---|---|---|---|---|
| Retail Employee Level 1 | **$24.10** | **$30.13** | [Knowledge] GRIA R1 is pegged to the national minimum wage, which from 1 July 2024 is $915.90/week = $24.10/h; casual = ×1.25 = $30.125 ≈ $30.13. | Medium-High (R1), Medium (casual rounding) |
| Retail Employee Level 2 | $24.53 | $30.66 | [Knowledge] estimated | **Low — verify** |
| Retail Employee Level 3 | $24.97 | $31.21 | [Knowledge] estimated | **Low — verify** |
| Retail Employee Level 4 | $25.83 | $32.29 | [Knowledge] estimated | **Low — verify** |
| Retail Employee Level 5 | $26.70 | $33.38 | [Knowledge] estimated | **Low — verify** |
| Retail Employee Level 6 | $29.08 | $36.35 | [Knowledge] estimated | **Low — verify** |

All casual rates are exactly FT × 1.25 (rounded to cents) — this keeps the app's
junior-casual arithmetic (which divides by 1.25 then re-applies the loading)
correct by construction.

## 4. Penalty structure (ordinary hours)

| Fact | Value used | Basis | Confidence |
|---|---|---|---|
| Evening penalty window start | **18:00** (`eveningThreshold: 1080`) | [Knowledge] GRIA's signature rule: ordinary hours after **6:00pm Mon–Fri** are paid at overtime rates. (Pharmacy differs: 19:00.) | High |
| Evening penalty | **150%** (`eveningMultiplier: 1.5`) | [Knowledge] as above. (Stub had 22:00/125% — wrong.) | High |
| Early-morning window | before **07:00** (`earlyMorningThreshold: 420`) | [Knowledge] GRIA span of ordinary hours Mon–Fri begins 7:00am; earlier work is outside the span. | Medium-High |
| Early-morning penalty | **150%** (`earlyMorningMultiplier: 1.5`) | [Knowledge] mapped from outside-span = overtime rates. GRIA has no separate named "early morning" loading the way pharmacy does; this is a mapping decision. | **Medium — verify** |
| Saturday | **150%** | [Knowledge] GRIA Saturday ordinary penalty (FT/PT and casual-column basis). | High |
| Sunday (FT/PT) | **150%** (`sundayMultiplier: 1.5`) | [Knowledge] FWC 2017 four-yearly-review reduction of retail Sunday penalties fully phased in (FT/PT 200% → 150%). (Stub had 2.0 — wrong.) | High |
| Public holiday (FT/PT) | **250%** (`phMultiplier: 2.5`) | [Knowledge] GRIA public holiday rate. | High |

### Casual penalty interaction (loading-inclusive totals)

GRIA casual day penalties are published as totals **inclusive** of the 25%
loading. Because this app's casual base rates already embed the loading, the
config expresses casual multipliers as multiples of the loaded casual base that
land on those totals:

| Shift | Published total | Config multiplier | Basis | Confidence |
|---|---|---|---|---|
| Weekday ordinary | 125% | `casualLoadingMultiplier: 1.0` (base already loaded) | [Knowledge] GRIA casual loading = 25% | High |
| Evening Mon–Fri | 150% | `casualEveningMultiplier: 1.2` (1.25 × 1.2 = 1.5) | [Knowledge] | **Medium — verify inclusive vs additive** |
| Early morning | 150% | `casualEarlyMorningMultiplier: 1.2` | [Knowledge] mapped (see early-morning note) | **Medium-Low — verify** |
| Saturday | 175% | `casualSaturdayMultiplier: 1.4` (1.25 × 1.4 = 1.75) | [Knowledge] GRIA casual Saturday column | Medium-High |
| Sunday | 200% | `casualSundayMultiplier: 1.6` (1.25 × 1.6 = 2.0) | [Knowledge] GRIA casual Sunday column | Medium-High |
| Public holiday | 250% | `casualPublicHolidayMultiplier: 2.0` (1.25 × 2.0 = 2.5) | [Knowledge] GRIA casual PH column | **Medium — verify inclusive vs additive** |

## 5. Overtime

| Fact | Value used | Basis | Confidence |
|---|---|---|---|
| Weekly ordinary-hours threshold | **38** (`overtimeThresholdHours: 38`) | [Knowledge] GRIA maximum ordinary hours 38/week (same as pharmacy). | High |
| First tier | **150% for the first 3 hours** (`overtimeFirstTierHours: 3`) | [Knowledge] GRIA pays 150% for the first 3 overtime hours Mon–Sat, 200% after — distinct from pharmacy's 2-hour tier, which was previously **hardcoded** in `App.js` and is now config-driven (`?? 2` default preserves pharmacy). | Medium-High — verify tier boundary |
| Second tier | **200%** (`overtimeSecondTierMultiplier: 2.0`) | [Knowledge] | High |
| Casual overtime eligibility | **Yes** (`overtimeAppliesToCasuals: true`) | [Knowledge] GRIA casuals receive weekly overtime; the app previously denied overtime to all casuals (pharmacy-locked behavior, unchanged via default `false`). Casual OT is computed on the loaded casual base rate. | **Medium — verify base-rate treatment** |
| Not modelled | Daily overtime, span-of-hours overtime outside the pre/post 7am/6pm windows, 7-day averaging, minimum/maximum shift lengths, rostering notices | [Knowledge] GRIA has these; the app's engine only implements the weekly threshold. Same limitation already exists for pharmacy. | Documented gap |

## 6. Junior rates

| Fact | Value used | Basis | Confidence |
|---|---|---|---|
| Percentages of adult rate | under 16: 45%, 16: 50%, 17: 60%, 18: 70%, 19: 80%, 20: 90% | [Knowledge] standard GRIA junior table; identical percentages to pharmacy. | High |
| Key style | keys match age-option ids (`'16'`, `'17'`, …) | [Repo] `App.js` looks up `juniorPercentages[age]`. The pharmacy config uses `'age-16'`-style keys, which do **not** match the ids — a pre-existing pharmacy lookup bug (ages 16–20 currently resolve to 100%) that is **intentionally left untouched** because pharmacy behavior is locked by the plan. Retail uses matching keys so its junior rates resolve correctly. | High (codebase fact) |

## 7. Allowances

| Fact | Value used | Basis | Confidence |
|---|---|---|---|
| GRIA national allowance set | **Meal money on overtime** + **vehicle per-km** only | [Knowledge] the GRIA pay guide allowances table lists only these national allowances; the two pharmacy-specific dollar allowances (home medicine review, laundry) and Broken Hill do **not** apply under GRIA. The Allowances UI already renders strictly from the selected award's `allowances` object, so pharmacy-only fields disappear under retail; `App.calculatePay` now also guards every allowance branch on the config key so stale UI state can't apply a pharmacy allowance to a retail audit. | Medium-High (set membership) |
| Meal allowance (overtime) amount | **$16.65** | [Knowledge] 2024-indexed estimate (kept from stub value, which is plausible for the 2024 indexation). | **Low — verify** |
| Vehicle allowance per km | **$0.99** | [Repo] value used across all awards in this codebase; plausible against 2024 FWC figures. | **Low — verify** |

## 8. Engine changes and pharmacy-invariance

1. **Penalty resolution order** (`helpers.js getPenaltyRateDetails`): early-morning/evening
   window checks now run **before** the casual-loading fallback, so casuals attract
   window penalties where the award pays them. For pharmacy this is
   value-invariant (its early/evening multipliers equal its casual loading — all
   1.25), but the breakdown **label** for a pharmacy casual working inside a
   window changes from "Casual Loading (125%)" to "Evening/Early Morning Shift
   (125%)". Monetary output for pharmacy is unchanged; the regression suite
   confirms identical pay/hours.
2. **Casual day/window multipliers**: optional `casualSaturdayMultiplier`,
   `casualSundayMultiplier`, `casualPublicHolidayMultiplier`,
   `casualEveningMultiplier`, `casualEarlyMorningMultiplier` fall back to the
   standard multiplier when absent (pharmacy defines none → unchanged).
3. **Overtime tier hours + casual eligibility**: moved from `App.js` into
   `helpers.js calculateOvertimePay`, driven by `overtimeFirstTierHours` (default 2)
   and `overtimeAppliesToCasuals` (default false). Pharmacy passes no flags →
   identical arithmetic.
4. **Live FWC data path**: the proxy returns `{ award_fixed_id, payRates }`
   (raw MAPD rows), which contains no `baseRates` object, so `calculatePay`
   has always fallen back to `awardConfig.js`. The merge in `App.js` was
   hardened: hydrated `baseRates` (if a future transformer produces them) now
   overlay the config instead of replacing it, so penalty/classification data
   can never go missing. Gap remaining: no MAPD-row → classification-rate
   transformer exists yet (pre-existing v2 item, unchanged by this run).

## 9. Quick verification checklist for the human

1. GRIA = MA000004 (not MA000003) on the FWC award page.
2. Classification ladder is Retail Employee Levels 1–6 (count!).
3. FT/PT hourly rates for Levels 1–6 against the pay guide table (esp. 2–6).
4. Casual rates = FT × 1.25 (Level 1 ≈ $30.13).
5. Evening penalty: 150% from 6:00pm Mon–Fri.
6. Saturday 150%; Sunday FT/PT 150%; public holiday 250%.
7. Casual totals: Sat 175%, Sun 200%, PH 250%, evening 150% (inclusive of loading).
8. Overtime: 150% first 3 hours, then 200%; casuals overtime-eligible.
9. Meal allowance $16.65; vehicle $0.99/km.
10. Junior percentages 45/50/60/70/80/90.
