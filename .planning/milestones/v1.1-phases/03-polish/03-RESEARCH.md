# Phase 3: Polish - Research

**Researched:** 2026-03-22
**Domain:** React cache UX + error messaging + retry logic
**Confidence:** HIGH

## Summary

Phase 3 wires the already-exported cache transparency and refresh functions from `awardRatesService.js` into the App UI, adds exponential backoff retry logic inside `fetchAwardRates`, and standardizes error message wording. No new component architecture, no API shape changes — all functions exist, just need integration. `AwardSelector` already accepts all required props; `App.js` needs two modifications: (1) import + call `clearCache()` before `fetchAwardRates` in `handleRefreshRates`, (2) update error string wording to match D-08 spec. `fetchAwardRates` needs internal retry wrapper since the Roadmap mentions "axios-retry" but the service uses native `fetch` — will implement manual retry with exponential backoff.

**Primary recommendation:** Add 3-retry loop with exponential backoff inside `fetchAwardRates` before the fetch call; update `handleRefreshRates` to call `clearCache()` then `fetchAwardRates`; update error strings to match CONTEXT.md decisions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Show relative time — "Rates last updated 3 days ago" — using the existing `date-fns formatDistanceToNow` call. Do NOT change to exact date format.

**D-02:** Hide the "Rates last updated" line entirely when `lastUpdated` is null — no placeholder text, no "never fetched" state. Current behavior is correct; preserve it.

**D-03:** Clicking "Refresh Rates" MUST call `clearCache()` with no argument (clears all 3 award caches) BEFORE calling `fetchAwardRates`. This forces a fresh API call regardless of TTL.

**D-04:** Scope is all awards simultaneously — `clearCache()` with no awardId argument, NOT `clearCache(selectedAward)`. Rate changes apply across all awards at once.

**D-05:** Retry logic lives inside `fetchAwardRates` in `awardRatesService.js` — transparent to the caller. Retries on any network/proxy error, 3 attempts, exponential backoff (e.g. 1s → 2s → 4s).

**D-06:** Retry applies to ALL calls to `fetchAwardRates` — both initial app load and manual refresh. No special-casing.

**D-07:** User sees generic "Refreshing..." in the button during ALL retry attempts — no "Retrying (2/3)..." progress text. Retries are invisible to the user.

**D-08:** When proxy fails (after all retries) and app falls back to hardcoded rates: show the red dismissible error banner with the exact string: "Couldn't connect to Fair Work Commission — using saved rates"

**D-09:** When manual Refresh fails after all retries: show error banner with the same wording. The "Rates last updated" timestamp STAYS visible below the button — user sees their existing rates are still intact.

**D-10:** The existing refresh success message "Rates updated" (green, auto-dismisses after 3s) is correct — keep it.

### Claude's Discretion

- Exact exponential backoff timing (1s/2s/4s or similar — choose appropriate values)
- Whether to retry on HTTP 5xx errors vs. network errors only (choose appropriate retry condition)
- Internal retry implementation (manual setTimeout loop vs. utility function)

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POLISH-01 | A cache status indicator shows when rates were last fetched and a manual refresh button lets the user trigger a fresh rate fetch | AwardSelector component already renders lastUpdated via formatDistanceToNow (D-01 compliance); handleRefreshRates needs clearCache() call before fetchAwardRates (D-03); error string wording must match "Couldn't connect to Fair Work Commission — using saved rates" (D-08) |

</phase_requirements>

## Standard Stack

### Core Libraries (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.1.0 | UI framework | CRA standard, existing codebase |
| date-fns | 4.1.0 | Time formatting | formatDistanceToNow already in use for relative time display (D-01) |
| Zod | 4.3.6 | Runtime validation | Already validates FWC API responses in fetchAwardRates |
| Jest | (CRA default) | Test framework | CRA standard; existing test infrastructure covers all modules |

### No New Dependencies Required

All functions (`fetchAwardRates`, `getCachedAwardRates`, `getLastCacheUpdateTime`, `clearCache`) are already exported from `awardRatesService.js`. Retry logic will use native `fetch` API + `setTimeout` (no new libraries needed despite Roadmap mentioning axios-retry — the service uses native fetch).

## Architecture Patterns

### Recommended Project Structure (No Changes Required)

```
src/
├── App.js                        # handleRefreshRates handler, error state, AwardSelector props
├── components/
│   └── AwardSelector.js         # Already accepts lastUpdated, onRefresh, isLoading, successMessage
├── services/
│   └── awardRatesService.js     # fetchAwardRates (add retry), getCachedAwardRates, getLastCacheUpdateTime, clearCache
└── config/
    └── awardConfig.js           # Fallback rates
```

### Pattern: Transparent Retry Inside Service

**What:** Retry logic wraps the actual fetch call inside `fetchAwardRates`. Caller (App.js `handleRefreshRates`) sees no change — function signature unchanged, same behavior for success, just retries on failure before throwing to caller.

**When to use:** Any async operation that may temporarily fail (network flakes, proxy transient errors). Hiding retry complexity from callers keeps them simple.

**Example (pseudocode of implementation approach):**
```javascript
// Source: awardRatesService.js implementation
export async function fetchAwardRates(awardIds) {
  // Retry wrapper: try up to 3 times with exponential backoff
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // ... existing fetch logic ...
      const response = await fetch(proxyUrl, { signal: controller.signal });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `Proxy returned ${response.status}`);
      }
      // ... validation and caching ...
      return ratesMap;
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  throw lastError;
}
```

**Caller (App.js) remains unchanged:**
```javascript
const handleRefreshRates = async () => {
  setAwardLoading(true);
  setAwardError(null);
  try {
    clearCache();  // NEW: clear all caches before fetching
    const fetched = await fetchAwardRates(AWARD_IDS);  // Retries transparently inside
    setAwardRates(fetched);
    setLastUpdated(getLastCacheUpdateTime(AWARD_IDS[0]));
    setAwardError(null);
    setAwardSuccessMessage('Rates updated');
    setTimeout(() => setAwardSuccessMessage(null), 3000);
  } catch (err) {
    setAwardError("Couldn't connect to Fair Work Commission — using saved rates");  // NEW: exact wording D-08
  } finally {
    setAwardLoading(false);
  }
};
```

### Pattern: User-Friendly Error Messages

**What:** Error strings extracted to readable, non-technical language. User sees "Couldn't connect to Fair Work Commission" not "CORS error" or "TypeError: fetch failed".

**When to use:** Any user-facing error message. Developers read error logs; users need plain language.

**Established pattern in codebase:**
- Initial load failure with cache fallback: "Couldn't load award rates. Using cached rates — Refresh to try again."
- Initial load failure with no cache: "Couldn't load award rates. Using Pharmacy defaults — Refresh to try again."
- Refresh failure: (D-08 specifies) "Couldn't connect to Fair Work Commission — using saved rates"

All errors render in the same red dismissible banner (lines 349–367 of App.js), no duplicates in AwardSelector (error prop accepted but not rendered per D-09).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting (relative time) | "3 days ago" string formatting logic | `date-fns formatDistanceToNow()` | Already imported in AwardSelector; handles edge cases (plurals, locales, future dates) |
| Exponential backoff loop | Custom setTimeout loop with mutable state | Simple for-loop with Math.pow(2, attempt) | Cleaner, no state complexity, retries invisible to caller |
| Cache clearing | Manual localStorage.key() iteration and removal | `clearCache()` exported function | Already handles versioning prefix, tested, safe for jsdom mocks |
| Error handling on fetch failure | Check response.ok and throw status code | Let the service handle all errors; catch in App.js and set error message | Separation of concerns: service validates, App decides UX |

**Key insight:** All cache operations (`getLastCacheUpdateTime`, `clearCache`) are already implemented and tested. Don't rewrite them; just wire the imports and calls.

## Common Pitfalls

### Pitfall 1: Forgetting to Call `clearCache()` Before `fetchAwardRates`

**What goes wrong:** User clicks "Refresh Rates", but `fetchAwardRates` checks cache first and returns cached data without calling the proxy. The refresh button appears to do nothing (from user perspective).

**Why it happens:** Cache TTL is 90 days (CACHE_TTL_MS in awardRatesService.js). If rates are cached, the cache is considered valid. The intent of "Refresh" is to force a fresh API call regardless of TTL — hence `clearCache()` must come first.

**How to avoid:** In `handleRefreshRates`, call `clearCache()` BEFORE any other logic. This forces `fetchAwardRates` to skip the cache and hit the proxy.

**Warning signs:**
- Clicking "Refresh Rates" button shows "Refreshing..." spinner but "Rates last updated" timestamp doesn't change
- Network tab shows no new request to `/.netlify/functions/award-rates`
- Proxy rate changes don't appear until cache TTL expires (90 days)

### Pitfall 2: Updating Error String Wording Incompletely

**What goes wrong:** Some error paths still show the old wording "Couldn't refresh award rates. Check your internet connection" instead of D-08 spec "Couldn't connect to Fair Work Commission — using saved rates". User sees inconsistent messaging.

**Why it happens:** There are multiple catch blocks in App.js: one in `initializeAwardRates` (initial load), one in `handleRefreshRates` (manual refresh). Both need the SAME wording per D-08 (refresh failure), but they call different functions.

**How to avoid:**
- Replace error strings in BOTH `initializeAwardRates` and `handleRefreshRates` catch blocks with the exact string from D-08
- Initial load fallback (no cache) can keep "Using Pharmacy defaults" wording; refresh failure uses "using saved rates" (D-08 vs. partial cache fallback logic)
- Extract error strings to constants at the top of App.js for single source of truth

**Warning signs:**
- Error banner shows different text on initial load vs. manual refresh
- Tests fail on error message findByText assertions

### Pitfall 3: Moving Error Banner or Removing Dismissible × Button

**What goes wrong:** Deviating from D-09/D-10 established pattern. Error banner moved out of view or × button removed, forcing user to reload page to clear error state.

**Why it happens:** Refactoring banner position or styling without checking the locked decision. Pattern from Phase 2 is correct; shouldn't change.

**How to avoid:** Error banner rendering code (lines 349–367 of App.js) is already correct. Don't move it or change the structure. Just update the error string inside the `<p>` tag.

**Warning signs:**
- Error message persists and can't be dismissed
- User must reload page to see AwardSelector again after an error

### Pitfall 4: Showing Retry Progress to User (Violates D-07)

**What goes wrong:** Button text changes to "Retrying (2/3)..." or "Retrying..." during retry attempts. User sees partial progress info, contradicting D-07 spec.

**Why it happens:** Developer implements retry loop and exposes attempt count in state, then renders it in the button. Seems helpful but violates D-07 (retries are invisible).

**How to avoid:** Keep retries entirely inside `fetchAwardRates`. Button state only cares about loading (true/false). Once loading is false, show final state (success or error). No intermediate "retrying" state exposed to React.

**Warning signs:**
- Button text changes to anything other than "Refreshing..." or "Refresh Rates"
- Tests check for retry attempt count displayed to user

### Pitfall 5: Retry Logic Placed in App.js Instead of awardRatesService.js

**What goes wrong:** Retry loop added to `handleRefreshRates` instead of inside `fetchAwardRates`. Initial load path (via `initializeAwardRates`) doesn't retry. Inconsistent behavior between initial load and manual refresh (D-06 violation).

**Why it happens:** Easier to implement retry at the call site (App.js) where you can see the loading state. Forgot to apply retry to all callers.

**How to avoid:** Retry MUST be inside `fetchAwardRates` per D-05. This ensures all calls (both initial load and refresh) retry transparently. Callers don't duplicate retry logic.

**Warning signs:**
- Initial app load fails on first network error; manual refresh retries and succeeds
- Two different error paths for the same underlying failure

## Code Examples

### Cache Status Display (Already Implemented — No Changes Needed)

```javascript
// Source: src/components/AwardSelector.js, lines 50–54
{lastUpdated && (
  <p className="text-xs text-gray-500 mt-2">
    Rates last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
  </p>
)}
```

This renders "Rates last updated 3 days ago" exactly as D-01 requires. `lastUpdated` is passed from App.js state (set via `getLastCacheUpdateTime(AWARD_IDS[0])`). When null, the line is hidden (D-02). No changes needed here.

### Error Banner (Already Implemented — String Update Only)

```javascript
// Source: src/App.js, lines 349–367
{awardError && (
  <div className="max-w-4xl mx-auto px-4 pt-4">
    <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-red-700 mb-1">Unable to Load Award Rates</h3>
          <p className="text-red-600 text-sm">{awardError}</p>  {/* ← Update this string per D-08/D-09 */}
        </div>
        <button
          onClick={() => setAwardError(null)}
          className="ml-4 text-red-700 hover:text-red-900 hover:bg-red-100 rounded p-1 font-bold text-lg leading-none"
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  </div>
)}
```

The heading, color scheme, and × button are correct (D-09). Only the error message inside the `<p>` tag changes:
- **On initial load failure with no cache:** Keep "Couldn't load award rates. Using Pharmacy defaults — Refresh to try again."
- **On initial load failure with partial cache:** Keep "Couldn't load award rates. Using cached rates — Refresh to try again."
- **On manual refresh failure (after retry):** Change to "Couldn't connect to Fair Work Commission — using saved rates" (D-08)

### Refresh Button Handler (Updated)

```javascript
// Source: src/App.js, lines 125–140 (MODIFIED)
const handleRefreshRates = async () => {
  setAwardLoading(true);
  setAwardError(null);
  try {
    clearCache();  // ← NEW: import from awardRatesService, call with no argument per D-03
    const fetched = await fetchAwardRates(AWARD_IDS);  // ← fetches with retries (transparent)
    setAwardRates(fetched);
    setLastUpdated(getLastCacheUpdateTime(AWARD_IDS[0]));
    setAwardError(null);
    setAwardSuccessMessage('Rates updated');  // ← Keep this; D-10 says it's correct
    setTimeout(() => setAwardSuccessMessage(null), 3000);
  } catch (err) {
    setAwardError("Couldn't connect to Fair Work Commission — using saved rates");  // ← NEW: D-08 wording
  } finally {
    setAwardLoading(false);
  }
};
```

### Import Statements (Add to App.js)

```javascript
// Source: src/App.js, line 9 (MODIFIED)
import { fetchAwardRates, getCachedAwardRates, getLastCacheUpdateTime, clearCache } from './services/awardRatesService';
// ← clearCache already exported; add to destructure if not already imported
```

### Retry Loop Inside fetchAwardRates (Implementation Choice)

The Roadmap mentions "axios-retry" but awardRatesService.js uses native `fetch`. Two approaches:

**Option A: Manual retry loop (recommended for simplicity)**
```javascript
// Add at the top of fetchAwardRates, before the fetch call
let lastError;
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    // ... existing fetch logic (lines 32–83) ...
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      response = await fetch(proxyUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Proxy returned ${response.status}`);
    }

    // ... rest of validation and caching (lines 49–83) ...
    return ratesMap;  // Success, return early
  } catch (error) {
    lastError = error;
    if (attempt < 2) {
      const backoffMs = Math.pow(2, attempt) * 1000;  // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
}
throw lastError;
```

**Option B: Extract retry utility function (alternative)**
```javascript
// Create src/services/retry.js
export async function retryWithBackoff(fn, maxAttempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  throw lastError;
}

// Use in fetchAwardRates:
const ratesMap = await retryWithBackoff(async () => {
  // ... existing fetch logic ...
});
```

**Claude's choice:** Option A (inline loop) — keeps all retry logic in one place, no new file, consistent with Zod validation pattern already in the service. Exponential backoff timing: 1s → 2s → 4s.

## State of the Art

| Aspect | Current | Notes |
|--------|---------|-------|
| Cache TTL | 90 days (localStorage) | Correct; longer than typical since rates change annually (July 1) |
| Retry mechanism | None (first attempt only) | Phase 3 adds 3-attempt exponential backoff |
| Error messages | Generic ("Check your internet connection") | Phase 3 standardizes to "Couldn't connect to Fair Work Commission" per D-08 |
| Cache transparency | Partial (lastUpdated shown, no refresh button) | Phase 3 wires the already-exported clearCache() to button |

**Deprecated/outdated:** None — no deprecations in this phase. All functions already exist and are tested.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (via Create React App) |
| Config file | `package.json` scripts: `npm test` (watch), `npm test -- --watchAll=false` (CI) |
| Quick run command | `npm test -- src/services/awardRatesService.test.js --watchAll=false` |
| Full suite command | `npm test -- --watchAll=false` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLISH-01 | clearCache() called before fetchAwardRates on manual refresh | Unit + Integration | `npm test -- src/services/awardRatesService.test.js --watchAll=false` + `npm test -- src/App.test.js --watchAll=false` | ✅ Both test files exist; new tests TBD in Wave 0 |
| POLISH-01 | Retry logic: fetchAwardRates retries 3× with exponential backoff on network error | Unit | `npm test -- src/services/awardRatesService.test.js --watchAll=false` | ✅ awardRatesService.test.js exists; add retry-specific tests in Wave 0 |
| POLISH-01 | Error message on refresh failure matches D-08 wording | Integration | `npm test -- src/App.test.js --watchAll=false` | ✅ App.test.js exists; add new test case in Wave 0 |
| POLISH-01 | Button disabled during refresh, shows "Refreshing..." spinner | Integration | `npm test -- src/App.test.js --watchAll=false` | ✅ App.test.js exists; verify existing test covers button state |
| POLISH-01 | Cache status line hidden when lastUpdated is null | Unit | `npm test -- src/components/AwardSelector.test.js --watchAll=false` | ✅ AwardSelector.test.js exists; verify D-02 compliance test in Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- src/services/awardRatesService.test.js --watchAll=false` (verify retry loop doesn't break cache logic)
- **Per wave merge:** `npm test -- --watchAll=false` (full suite; all 89 tests must pass)
- **Phase gate:** Full suite green + `npm run build` succeeds before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/services/awardRatesService.test.js` — add test cases:
  - [ ] `fetchAwardRates retries on network error with exponential backoff (1s, 2s, 4s)`
  - [ ] `fetchAwardRates throws original error after 3rd retry fails`
  - [ ] `clearCache() call before fetchAwardRates prevents cache hit`
- [ ] `src/App.test.js` — add test case:
  - [ ] `handleRefreshRates error message matches "Couldn't connect to Fair Work Commission — using saved rates"` (D-08)
- [ ] `src/components/AwardSelector.test.js` — verify existing test:
  - [ ] `lastUpdated line is hidden when lastUpdated is null` (D-02)

*(If these gaps exist: implement in Wave 0 before coding implementation. If all tests already exist: no gaps.)*

## Sources

### Primary (HIGH confidence)

- **Existing codebase:**
  - `src/services/awardRatesService.js` (lines 1–159) — all functions implemented and exported; cache logic verified
  - `src/App.js` (lines 1–400+) — error banner pattern, handleRefreshRates handler, error state management
  - `src/components/AwardSelector.js` (lines 1–63) — component accepts all required props, formatDistanceToNow usage correct
  - `src/services/awardRatesService.test.js` (lines 1–152) — test patterns for cache, fetch, clearCache; localStorage mocking strategy
  - `src/App.test.js` (lines 1–100+) — integration test patterns; error message verification
- **date-fns v4.1.0:** `formatDistanceToNow()` already in use; correct for D-01 (relative time display)
- **CONTEXT.md (03-CONTEXT.md):** All decisions D-01 through D-10 locked and verified; no alternatives needed

### Secondary (MEDIUM confidence)

- **Create React App Jest setup:** Standard; no custom config needed; test infrastructure covers Phase 3 requirements

### Tertiary (LOW confidence)

- None — all research backed by code inspection and locked decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries already installed and verified in package.json; date-fns usage in codebase
- Architecture: HIGH — Service architecture confirmed in awardRatesService.js; App.js patterns established in Phase 2; no new patterns needed
- Pitfalls: HIGH — Locked decisions in CONTEXT.md identify all critical error paths; common mistakes documented from code patterns observed
- Retry implementation: MEDIUM → HIGH (after code inspection) — Roadmap mentions "axios-retry" but codebase uses native `fetch`; manual retry loop approach is straightforward

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days; React/date-fns stable)

---

## Research Notes

### Key Findings

1. **clearCache() already exported and tested** — lines 142–158 of awardRatesService.js. No implementation needed; just import and call in App.js. Test coverage exists (lines 95–115 of awardRatesService.test.js).

2. **getLastCacheUpdateTime() already used correctly** — AwardSelector.js line 52 calls formatDistanceToNow on the returned Date. D-01 relative time format already in use. No changes needed.

3. **Error banner UI pattern established in Phase 2** — App.js lines 349–367. Dismissible, red, positioned below header. Just update the error string per D-08.

4. **Retry logic is NOT via axios-retry** — awardRatesService.js uses native `fetch` (line 36), not axios. Roadmap assumed axios but codebase chose fetch. Will implement manual retry loop with Math.pow(2, attempt) exponential backoff.

5. **All test infrastructure in place** — Jest via CRA. awardRatesService.test.js and App.test.js exist. localStorage mocking pattern established. Adding retry tests is straightforward.

### Deviations from Roadmap

The Roadmap notes: "Retry is already handled by `axios-retry` in `awardRatesService.js`". This is incorrect — the service uses native `fetch` with a 15-second abort timeout (line 34). No axios or axios-retry present. This phase will implement retry manually inside the fetch loop.

### What Might Have Been Missed

1. **Multiple error paths in App.js** — There's an error handling in `initializeAwardRates` (initial load, lines 106–116) and in `handleRefreshRates` (manual refresh, lines 135–136). Both need error message wording updated to D-08 "Couldn't connect to Fair Work Commission — using saved rates" for consistency. Easy to update one and forget the other.

2. **Cache status display for other award IDs** — Currently, `lastUpdated` is always set from AWARD_IDS[0] (Pharmacy, line 104). If a user switches awards, the displayed timestamp doesn't change to reflect that award's last update time. Not in scope for Phase 3 (D-01 spec is silent), but worth noting for Phase 4 (EXT-01 multi-award support).

3. **Retry vs. network error distinction** — D-05 says "Retries on any network/proxy error". The current fetch error handling (lines 40–46) catches network errors and HTTP non-200 responses. Both should retry. Worth verifying retry applies to both cases (not just network errors).

---

*Research complete: 2026-03-22*
*Phased requirement: POLISH-01 (cache status + manual refresh)*
