# Phase 3: Polish - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add finishing-touches to the cache and error handling layer: wire the already-exported `clearCache()` function to the Refresh Rates button (force-clear all awards, then re-fetch), add retry logic (3× exponential backoff) inside `fetchAwardRates`, and lock down user-friendly error message wording. No changes to calculation logic, component layout, or visual design — Phase 2 delivered the UI shell; this phase wires the remaining behavior.

</domain>

<decisions>
## Implementation Decisions

### Cache status display
- **D-01:** Show relative time — "Rates last updated 3 days ago" — using the existing `date-fns formatDistanceToNow` call. Do NOT change to exact date format.
- **D-02:** Hide the "Rates last updated" line entirely when `lastUpdated` is null — no placeholder text, no "never fetched" state. Current behavior is correct; preserve it.

### Refresh button behavior
- **D-03:** Clicking "Refresh Rates" MUST call `clearCache()` with no argument (clears all 3 award caches) BEFORE calling `fetchAwardRates`. This forces a fresh API call regardless of TTL.
- **D-04:** Scope is all awards simultaneously — `clearCache()` with no awardId argument, NOT `clearCache(selectedAward)`. Rate changes apply across all awards at once.

### Retry logic
- **D-05:** Retry logic lives inside `fetchAwardRates` in `awardRatesService.js` — transparent to the caller. Retries on any network/proxy error, 3 attempts, exponential backoff (e.g. 1s → 2s → 4s).
- **D-06:** Retry applies to ALL calls to `fetchAwardRates` — both initial app load and manual refresh. No special-casing.
- **D-07:** User sees generic "Refreshing..." in the button during ALL retry attempts — no "Retrying (2/3)..." progress text. Retries are invisible to the user.

### Error message wording
- **D-08:** When proxy fails (after all retries) and app falls back to hardcoded rates: show the red dismissible error banner with the exact string: "Couldn't connect to Fair Work Commission — using saved rates"
- **D-09:** When manual Refresh fails after all retries: show error banner with the same wording. The "Rates last updated" timestamp STAYS visible below the button — user sees their existing rates are still intact.
- **D-10:** The existing refresh success message "Rates updated" (green, auto-dismisses after 3s) is correct — keep it.

### Claude's Discretion
- Exact exponential backoff timing (1s/2s/4s or similar — choose appropriate values)
- Whether to retry on HTTP 5xx errors vs. network errors only (choose appropriate retry condition)
- Internal retry implementation (manual setTimeout loop vs. utility function)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — POLISH-01 is the sole requirement for this phase (cache status indicator + manual refresh button)

### Roadmap & phase spec
- `.planning/ROADMAP.md` — Phase 3 section has the goal, success criteria, and implementation notes (including explicit mention of `getLastCacheUpdateTime()`, `clearCache()`, and axios-retry)

### Project instructions
- `CLAUDE.md` — project architecture, component structure, data flow rules

### Key files to modify
- `src/services/awardRatesService.js` — add retry logic inside `fetchAwardRates` (lines 27–92)
- `src/App.js` — update `handleRefreshRates` to call `clearCache()` before `fetchAwardRates` (lines 125–140); update error message wording in catch blocks

### Existing cache API (already exported — no new functions needed)
- `src/services/awardRatesService.js` exports: `fetchAwardRates`, `getCachedAwardRates`, `getLastCacheUpdateTime`, `clearCache` — all present, just need wiring

### Prior phase context (for established patterns)
- `.planning/phases/02-tailwind-css-redesign/02-CONTEXT.md` — D-09/D-10 (error banner in App.js, dismissible ×), D-08 (loading spinner), D-11 (green/red/yellow colors)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AwardSelector.js` — already accepts `lastUpdated`, `onRefresh`, `isLoading`, `successMessage` props and renders them correctly. No changes needed to this component.
- `awardRatesService.clearCache(awardId?)` — exported, no-arg form clears all award caches. Ready to call.
- `awardRatesService.getLastCacheUpdateTime(awardId)` — already used; returns `Date|null`.
- `date-fns formatDistanceToNow` — already imported in AwardSelector for relative time display.

### Established Patterns
- Error banner: red full-width dismissible banner rendered in App.js JSX (lines ~349–365) gated on `awardError` state. Same pattern for both init failure and refresh failure.
- Loading state: `awardLoading` bool gates button disabled state and triggers spinner overlay.
- Success message: `awardSuccessMessage` state with 3s auto-dismiss timeout (lines 133–134).
- `handleRefreshRates` is the only function that needs modification in App.js — it just needs `clearCache()` added before the `fetchAwardRates` call, and updated error string.

### Integration Points
- Retry goes INTO `fetchAwardRates` in `awardRatesService.js` — wrap the fetch call in a retry loop. The function signature stays the same; callers don't change.
- `handleRefreshRates` in App.js: add `import { clearCache } from './services/awardRatesService'` if not already imported (check — it may need adding), then call `clearCache()` as the first line of the try block before `fetchAwardRates`.

</code_context>

<specifics>
## Specific Ideas

- The `clearCache()` call in `handleRefreshRates` should happen BEFORE `setAwardLoading(true)` or as the first statement in the try block — the exact order doesn't matter much, but clearing before the loading state is set keeps it clean.
- Roadmap implementation note: "Retry is already handled by `axios-retry` in `awardRatesService.js` — verify config is correct (3 retries, exponential backoff)". However, scouting shows `axios-retry` is NOT present — `fetchAwardRates` uses the native `fetch` API, not axios. The researcher/planner should implement manual retry or add a retry utility rather than relying on axios-retry.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-polish*
*Context gathered: 2026-03-22*
