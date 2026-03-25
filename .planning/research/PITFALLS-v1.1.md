# Domain Pitfalls: v1.1 Integration Features

**Project:** Pay Check App (Pharmacy Awards Pay Calculator)
**Researched:** 2026-03-09
**Focus:** Common mistakes when adding Netlify Functions proxy, live API hydration, Tailwind CSS migration, and loading/error states to an existing working React SPA.

**Context:** The existing app (v1.0) correctly calculates pay with hardcoded award rates and has no loading/error UX. v1.1 adds live FWC API integration via proxy and visual redesign. This research identifies pitfalls specific to *adding* these features to a system that currently works.

---

## Critical Pitfalls

These mistakes cause rewrites, silent pay calculation errors, or production failures.

### Pitfall 1: Calculation Engine Desynchronization During API Hydration

**What goes wrong:**
When replacing hardcoded `pharmacyAwardRates` in App.js with live FWC API data, the app enters a dangerous state where some calculations use stale hardcoded rates and others use fresh API rates. This causes the same input to produce different pay calculations depending on code path execution order or network timing.

Example: User clicks "Calculate" with Award MA000012 before API finishes hydrating. Component uses old hardcoded rate for Pharmacy Assistant 1 ($21.50). API returns $21.75. User refreshes page — same input now shows $21.75. User sees a discrepancy and distrusts the tool.

**Why it happens:**
- `calculatePayForTimePeriod()` in helpers.js reads `baseRate` passed from parent, but the parent (App.js) may hold stale `awardRates` state if API hydration is async.
- No validation that API rates have loaded before first calculation.
- Tests may pass with hardcoded values but fail silently when API data differs.
- Race condition: useEffect initializes award rates async, but user can click Calculate before useEffect resolves.

**Consequences:**
- Underpayment calculations are unreliable — workers may not trust results even if technically correct.
- Debugging is nightmare — same input produces different output depending on network timing.
- Data-driven tests won't catch this (unit tests pass, integration tests fail only under latency).
- Possible regression: v1.0 was consistent (if incorrect, at least consistent). v1.1 is inconsistent.

**Prevention:**
1. **Block Calculate button until API rates load.** In App.js, disable the "Calculate" button while `awardLoading === true`. Show spinner with text "Loading award rates...". This is not UX burden — it's UX clarity.
   ```javascript
   <button disabled={awardLoading}>Calculate Pay</button>
   ```

2. **Validate rate source at calculation time.** Before calling `calculatePayForTimePeriod()`, assert that the rate came from the current `awardRates` state, not fallback. Return explicit error if rates are missing.
   ```javascript
   if (!awardRates?.[selectedAward]) {
     setResults({ error: 'Award rates not loaded. Refresh and try again.' });
     return;
   }
   ```

3. **Test with both hardcoded and API rates.** Create a test suite that runs the same shifts with both hardcoded rates AND mock API responses that differ by $0.10. Assert output is identical to hardcoded. Then swap to API data and re-run — output should change by exactly $0.10 per hour.

4. **Add rate version tracking.** Store a `rateVersion` or `rateSource` field in results object so user sees "Calculated using rates from: FWC API (updated 2 hours ago)" or "(hardcoded fallback)". This surfaces discrepancies.

5. **Implement graceful degradation.** If API fails after initialization, fall back to cached rates, not hardcoded rates. The cached rates are at least known-good data from a recent API call.

**Detection:**
- Test produces different results on second run vs first run.
- User reports "same shift, different pay" across page refreshes.
- Calculation output changes after small network delay.
- Test suite passes locally (no network latency) but fails in CI or on slow networks.

**When this phase addresses it:**
Phase 1 (Proxy & API Integration). Must be validated before Tailwind redesign phase, because UI changes will obscure the root cause.

---

### Pitfall 2: Netlify Function Cold Start / Timeout Silently Breaks the Proxy

**What goes wrong:**
The Netlify Functions proxy is configured and tested locally with `netlify dev`. In production, it works fine for the first request, but on subsequent page loads after 15+ minutes, the function enters a "cold start" state. The function takes 2-4 seconds to spin up. If the FWC API itself takes 5+ seconds, the combined latency exceeds Netlify's 10-30 second timeout, and the function returns a 502 Bad Gateway. The UI has no error handler for 502, so the page appears frozen.

**Why it happens:**
- Netlify Functions are serverless and spin down after ~15 minutes of inactivity.
- Each cold start adds 0.5-2 seconds latency.
- FWC MAAPI v1 endpoint (if slow or rate-limited) may take 5-10 seconds.
- Combined latency (cold start + FWC API + parsing) can easily exceed 10 seconds.
- HTTP timeout is silent — browser sees 502 and stops waiting, but React has no error boundary or timeout handler.
- Local testing with `netlify dev` bypasses cold start completely, so the problem doesn't appear until production.

**Consequences:**
- Production proxy appears to work (first request), then mysteriously fails (subsequent requests hours later).
- User clicks "Calculate", sees spinner for 15 seconds, then page breaks with no error message.
- Debugging is hard: logs show timeout, but you're not sure if it's Netlify or FWC API.
- Fallback to hardcoded rates is broken because there's no error handler to trigger it.
- User may blame the app or the FWC.

**Prevention:**
1. **Set explicit client-side timeout.** In awardRatesService.js, add a 5-second timeout to the fetch call to the proxy:
   ```javascript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);
   try {
     const res = await fetch('/.netlify/functions/fwc-proxy', {
       signal: controller.signal,
     });
   } catch (e) {
     if (e.name === 'AbortError') {
       console.error('FWC proxy timeout (5s) — falling back to hardcoded rates');
     }
   } finally {
     clearTimeout(timeoutId);
   }
   ```

2. **Test in production before shipping.** Deploy to Netlify and wait 20+ minutes. Then open the app in a browser. Measure time to first calculation. Simulate a cold start by stopping and restarting the function (or use Netlify logs to observe cold starts). Do NOT rely on `netlify dev` for latency testing.

3. **Implement proper error handling in the proxy itself.** The Netlify Function should:
   - Set a shorter timeout for the FWC API call (e.g., 3 seconds instead of 10).
   - Return early with a helpful error body if FWC times out, rather than letting the whole function timeout.
   - Log errors to Netlify logs so you can debug production issues.

4. **Add an error boundary in App.js.** Wrap AwardSelector in an ErrorBoundary that catches fetch errors and displays a message:
   ```javascript
   {awardError && (
     <div className="alert alert-danger">
       Could not load award rates. Using cached data.
       <button onClick={() => location.reload()}>Retry</button>
     </div>
   )}
   ```

5. **Warm up the function periodically.** Set a cron job (e.g., every 10 minutes) that pings `/.netlify/functions/fwc-proxy` to keep the function warm. This is a workaround, not a solution, but it prevents cold starts for users.

**Detection:**
- Logs show "Task timed out after 10 seconds" in Netlify Functions dashboard.
- Page works on first load, but fails after a long idle period.
- `curl /.netlify/functions/fwc-proxy` takes >5 seconds in production but <1 second in `netlify dev`.
- User reports "app broke after I stepped away for lunch".

**When this phase addresses it:**
Phase 1 (Proxy & API Integration). Absolutely critical to test in production before moving to Phase 2.

---

### Pitfall 3: CORS Header Misconfiguration in Netlify Proxy

**What goes wrong:**
The Netlify Functions proxy is deployed and working (it returns data), but the HTTP response is missing the `Access-Control-Allow-Origin` header. The browser fetch succeeds on the server but the browser's CORS security policy blocks the response. JavaScript sees an error: `Cross-Origin Request Blocked`. The app falls back to hardcoded rates silently, and the user never knows the API is broken.

Why: The proxy function calls `fetch()` to the FWC API server-side (correct). It gets a 200 response. But it doesn't set CORS headers on the response it sends back to the browser.

**Why it happens:**
- Confusion about what "solving CORS" means. The proxy *removes* CORS by moving the API call to the server. But the proxy itself still needs to expose CORS headers in its *response* to the browser.
- Copy-pasting proxy code that only handles the FWC API request, not the response headers.
- Netlify Functions don't automatically add CORS headers — you must add them manually.
- Works locally (no CORS) but fails in production (CORS enforcement).

**Consequences:**
- App silently falls back to v1.0 hardcoded rates.
- No error message shown (because the code doesn't expect CORS errors).
- User has no idea the API integration is broken.
- You'd discover this only by:
  - Checking browser console (most users won't report it).
  - Checking Netlify function logs (which show 200, not an error).
  - Testing the proxy with `curl` (curl doesn't enforce CORS, so it works).

**Prevention:**
1. **Explicitly set CORS headers in the Netlify Function response:**
   ```javascript
   exports.handler = async (event) => {
     const data = await fetch('https://fwc.gov.au/...');
     return {
       statusCode: 200,
       headers: {
         'Content-Type': 'application/json',
         'Access-Control-Allow-Origin': '*', // or your domain
       },
       body: JSON.stringify(data),
     };
   };
   ```

2. **Restrict CORS origin to your domain (not `*`):**
   ```javascript
   'Access-Control-Allow-Origin': process.env.CLIENT_ORIGIN || 'https://pay-check-app.netlify.app',
   ```

3. **Test with the actual browser fetch call.** Don't just test with curl or Postman (both bypass CORS). In the browser console, run:
   ```javascript
   fetch('/.netlify/functions/fwc-proxy')
     .then(r => r.json())
     .then(d => console.log('Success:', d))
     .catch(e => console.error('CORS Error:', e));
   ```
   If this fails with CORS error but `curl` succeeds, the headers are wrong.

4. **Log CORS errors in awardRatesService.js.** Update the error handler to specifically log CORS errors:
   ```javascript
   .catch(err => {
     if (err.message.includes('CORS') || err.message.includes('blocked')) {
       console.error('CORS proxy error — check Netlify function headers');
     }
     // Fall back to hardcoded rates
   });
   ```

**Detection:**
- Browser console shows "Cross-Origin Request Blocked" error.
- `curl /.netlify/functions/fwc-proxy` returns data, but browser fetch fails.
- Netlify function logs show 200 status, but browser gets error.
- App silently uses hardcoded rates with no error message.

**When this phase addresses it:**
Phase 1 (Proxy & API Integration). Must be validated before going live.

---

### Pitfall 4: Tailwind CSS Breaks Existing Component Styling Without Warning

**What goes wrong:**
During Tailwind CSS installation and setup in CRA, you add `@tailwind` directives to index.css. Tailwind's CSS reset (Preflight) removes all default browser styles. Existing components that relied on default styles (e.g., `<input>` has no border, `<button>` has no padding) suddenly look broken. The page renders but every input is invisible, buttons are tiny, tables are misaligned.

Example: WorkHours component has `<input type="time">` tags. In v1.0, these had default browser styling. After Tailwind setup, they're invisible — Tailwind reset removed the default input styles.

**Why it happens:**
- Tailwind's Preflight CSS resets all default browser styles to provide a clean slate.
- You don't realize this until you run the app and see the damage.
- CRA doesn't provide hooks to customize Tailwind's Preflight, so you must manually override.
- Your existing classes (if any) may conflict with Tailwind's generated classes (e.g., if you have `.flex` in old CSS, it conflicts with Tailwind's `.flex`).

**Consequences:**
- App looks visibly broken after Tailwind setup.
- You must add Tailwind utility classes to every existing component to restore styling.
- This is not a small change — it's a component-by-component rewrite.
- Testing may pass (tests don't check visual styling), but users see broken UI.
- Possible regression: v1.0 worked, v1.1 is visually broken, even if functionality is correct.

**Prevention:**
1. **Install Tailwind via CRA-specific guide.** Use the official Tailwind + CRA integration (not manual PostCSS setup). This is critical because CRA doesn't support custom PostCSS config:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

2. **Add Tailwind directives LAST.** In index.css, add Tailwind directives at the very end, after any existing CSS. This lets your existing styles take precedence:
   ```css
   /* Existing styles first */
   ...

   /* Tailwind last */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. **Test the app immediately after Tailwind setup.** Before writing any Tailwind classes, start the dev server and open the app. Check every component for visual breaks. Create a checklist:
   - [ ] EmployeeDetails inputs visible
   - [ ] Allowances checkboxes visible
   - [ ] WorkHours time inputs visible
   - [ ] PaySummary table readable
   - [ ] Buttons clickable
   - [ ] Text readable (not too small, not too large)

4. **Use a CSS prefix to avoid class name conflicts.** In tailwind.config.js, add a prefix for all Tailwind classes:
   ```javascript
   module.exports = {
     prefix: 'tw-',
     ...
   };
   ```
   Then use `className="tw-flex tw-gap-4"` instead of `className="flex gap-4"`. This prevents conflicts with your existing CSS.

5. **Gradual migration strategy.** Don't convert all components to Tailwind at once. Instead:
   - Phase 1: Add Tailwind directives, add CSS overrides for broken existing components to restore default styling.
   - Phase 2: Convert high-impact components (AwardSelector, PaySummary) to Tailwind.
   - Phase 3: Convert remaining components (one per commit).

6. **Keep a "Tailwind reset" CSS file.** If you don't use the prefix, you'll need to manually undo Preflight for certain elements:
   ```css
   input, textarea, select {
     all: revert; /* Restore default styles */
   }
   ```

**Detection:**
- App looks visibly broken after Tailwind installation (inputs invisible, buttons wrong size).
- Test suite passes but visual regression is obvious.
- Users report "app is broken" on first page load after Tailwind update.

**When this phase addresses it:**
Phase 2 (Tailwind CSS Redesign). This is the phase where the pitfall manifests, so it must be caught during development, not in production.

---

### Pitfall 5: Loading States Not Coordinated Across Multiple Async Operations

**What goes wrong:**
App has two independent async operations: (1) Award rates loading from FWC API, (2) User calculation running. You add loading spinners for each. But they're not coordinated:
- User clicks "Calculate" while award rates are still loading.
- Two spinners appear (one for rates, one for calculation).
- Rates finish loading, calculation completes, but the UI shows mismatched states.
- Or: Rates fail to load, but calculation loading spinner is still visible, user doesn't know why.

Example: `awardLoading` state is true while API call is in flight. User clicks Calculate. `calculationLoading` becomes true. API finishes, `awardLoading` becomes false, but `calculationLoading` is still true. UI shows partial state: "Rates loaded, but calculation still running". If calculation finishes milliseconds later, UI flashes. User sees "calculating..." then suddenly "done" without seeing the actual results briefly.

**Why it happens:**
- Each async operation manages its own `loading` and `error` state independently.
- No centralized "app is ready" state that blocks user actions.
- React renders on state change, so mismatched states cause intermediate re-renders that flicker.
- Testing doesn't catch this because test state changes are instantaneous (no real network latency).

**Consequences:**
- UI flickers and feels janky.
- Users don't know if app is still working or if something broke.
- Spinner appears/disappears at unexpected times.
- Error states may be hidden by overlapping loading states.

**Prevention:**
1. **Define a composite "app ready" state.** In App.js, add a computed flag:
   ```javascript
   const isAppReady = !awardLoading && awardRates && !awardError;

   <button disabled={!isAppReady}>Calculate</button>
   ```

2. **Sequence async operations.** If calculation depends on award rates, don't allow calculation to start until rates are loaded:
   ```javascript
   const handleCalculate = async () => {
     if (!awardRates?.[selectedAward]) {
       setResults({ error: 'Award rates not loaded. Try again.' });
       return;
     }
     // Now safe to calculate
     const result = calculatePayForTimePeriod(...);
     setResults(result);
   };
   ```

3. **Show a single "initializing" state.** Instead of multiple spinners, show one spinner while the app is initializing:
   ```javascript
   {awardLoading && <Spinner message="Loading award rates..." />}
   {awardError && <ErrorBanner error={awardError} />}
   {isAppReady && <YourAppContent />}
   ```

4. **Test with simulated network latency.** In the browser DevTools Network tab, set throttling to "Slow 3G" and test:
   - Click Calculate before rates load — should be blocked.
   - Click Calculate after rates load — should work.
   - Switch awards while rates are loading — should queue the load.

5. **Log state transitions.** Add a useEffect that logs every state change (in dev mode only):
   ```javascript
   useEffect(() => {
     console.log(`[STATE] awardLoading: ${awardLoading}, awardError: ${awardError}`);
   }, [awardLoading, awardError]);
   ```

**Detection:**
- UI flickers (spinner appears/disappears rapidly).
- User clicks button, nothing happens, then suddenly results appear.
- Error states are hidden behind loading states.
- Network tab shows API call succeeded, but spinner is still visible.

**When this phase addresses it:**
Phase 2 (Loading/Error UX). Becomes apparent once loading states are added, so it must be validated during development.

---

## Moderate Pitfalls

### Pitfall 6: API Data Type Changes Break `calculatePayForTimePeriod` Silently

**What goes wrong:**
FWC API returns award rates as a JSON object. Your code assumes `baseRate` is a number. In v1.0, hardcoded rates are guaranteed to be numbers. In v1.1, the API response is parsed and passed to `calculatePayForTimePeriod`. But if the API returns a string ("$21.50" instead of 21.50), or if parsing fails, `baseRate` becomes NaN. The function returns `{ hours: 0, pay: 0, breakdown: [] }`, and the UI shows $0.00 pay.

Why: The FWC API schema is not strongly typed. You don't have TypeScript or Zod validation to enforce shape. The API response is trusted without validation. If FWC changes their response format, your app silently breaks.

**Why it happens:**
- API responses are not validated with Zod or TypeScript before use.
- Tests may not cover edge cases like string numbers or missing fields.
- The `calculatePayForTimePeriod` function assumes `baseRate` is a valid number, no defensive checks.

**Consequences:**
- Calculations return $0.00 with no error.
- User thinks they got underpaid and could file a complaint based on wrong data.
- Silent failure is worse than loud failure.

**Prevention:**
1. **Validate FWC API response with Zod before using.** In awardRatesService.js:
   ```javascript
   import { z } from 'zod';

   const RateSchema = z.object({
     classification: z.string(),
     baseRate: z.coerce.number(), // Coerce to number, error if not possible
   });

   const response = await fetch(...);
   const data = await response.json();
   const validated = RateSchema.parse(data); // Throws if invalid
   ```

2. **Add defensive checks in `calculatePayForTimePeriod`.** At the top of the function:
   ```javascript
   if (!isFinite(baseRate) || baseRate <= 0) {
     console.error('Invalid base rate:', baseRate);
     return { hours: 0, pay: 0, breakdown: [], error: 'Invalid rate data' };
   }
   ```

3. **Test with mock API responses that differ from hardcoded.** Create a test that:
   - Mocks FWC API to return `{ baseRate: "21.50" }` (string).
   - Asserts that validation catches the error or coerces it to 21.50.
   - Tests with missing fields, NaN, negative numbers.

4. **Add an explicit "rate source" flag to results.** In PaySummary, display:
   ```javascript
   {results.rateSource === 'api' && <span>(rates from FWC)</span>}
   {results.rateSource === 'fallback' && <span>(using cached data)</span>}
   ```
   This surfaces which data source was used.

**Detection:**
- App shows $0.00 pay unexpectedly.
- Tests pass but integration with real API fails.
- Zod validation error in console (if implemented).

**When this phase addresses it:**
Phase 1 (Proxy & API Integration). Must validate data shape before calculations.

---

### Pitfall 7: Browser Cache Serves Stale Rates After API Updates

**What goes wrong:**
FWC updates award rates (e.g., annual 3% increase). The new rates are live in the FWC API. But your app fetches from `/.netlify/functions/fwc-proxy`, which is cached by the browser. Browser sends an `If-Modified-Since` header and gets back a 304 Not Modified, so it serves the cached response (old rates). User doesn't see the update for days (until browser cache expires or is manually cleared).

Why: The Netlify Function proxy doesn't set proper `Cache-Control` headers. The browser defaults to caching GET responses for a long time. The app's localStorage cache (90-day TTL) is separate from the browser's HTTP cache.

**Why it happens:**
- HTTP caching is not explicitly configured on the proxy response.
- localStorage caching and browser HTTP caching are not coordinated.
- You expect localStorage to be the cache layer, but the browser cache comes first.

**Consequences:**
- Users see outdated rates for days.
- When they do get the update, calculations differ from previous days (confusing).
- You can't easily force a cache refresh (browser won't bypass HTTP cache without user action).

**Prevention:**
1. **Set explicit `Cache-Control` headers on the proxy response:**
   ```javascript
   headers: {
     'Cache-Control': 'max-age=3600, must-revalidate', // 1 hour
     'Content-Type': 'application/json',
   },
   ```

2. **Add a "last updated" timestamp to the API response.** In the proxy function, include:
   ```javascript
   return {
     statusCode: 200,
     headers: {...},
     body: JSON.stringify({
       rates: [...],
       lastUpdated: new Date().toISOString(),
     }),
   };
   ```
   Then in awardRatesService, check if `lastUpdated` is too old (e.g., >7 days):
   ```javascript
   if (new Date() - new Date(data.lastUpdated) > 7 * 24 * 60 * 60 * 1000) {
     // Rates are very old, don't use them
   }
   ```

3. **Coordinate localStorage and HTTP cache.** Only cache in localStorage if HTTP headers allow it. If the proxy says "don't cache", respect that:
   ```javascript
   const cacheControl = response.headers.get('Cache-Control');
   if (!cacheControl?.includes('no-cache') && !cacheControl?.includes('no-store')) {
     localStorage.setItem('awardRates', JSON.stringify(data));
   }
   ```

4. **Add a manual "clear cache" UI button.** Let users manually refresh rates if they suspect staleness:
   ```javascript
   <button onClick={() => {
     localStorage.removeItem('awardRates');
     location.reload();
   }}>
     Refresh Award Rates
   </button>
   ```

5. **Monitor rate versions.** If you have access to FWC API changelog, check if there's a version field. Alert users if they're using old version:
   ```javascript
   const rateVersion = data.rateVersion || '1.0';
   const latestVersion = '1.1'; // Hardcoded from docs
   if (rateVersion < latestVersion) {
     console.warn(`Stale rates (v${rateVersion}), latest is v${latestVersion}`);
   }
   ```

**Detection:**
- User reports "rates don't match FWC website".
- localStorage shows fresh data, but browser Network tab shows 304 Not Modified.
- Rate update is live on FWC but not reflected in app for hours.

**When this phase addresses it:**
Phase 1 (Proxy & API Integration). Configure cache headers before going to production.

---

### Pitfall 8: Race Condition When User Changes Award While Rates Are Loading

**What goes wrong:**
User opens app. Award MA000012 (Pharmacy) is loading. User impatient, switches to Award MA000003 (Retail) in the AwardSelector dropdown. Two requests are now in flight. Retail rates finish first. App sets state to Retail rates. Then Pharmacy rates finish. App sets state to Pharmacy rates. Now the dropdown shows Retail, but rates are for Pharmacy. User clicks Calculate with the wrong rates.

Why: There's no mechanism to cancel the in-flight Pharmacy request when the user switches to Retail. Both requests complete and both update state, but in an unpredictable order.

**Why it happens:**
- `useEffect` doesn't have cleanup logic to cancel previous fetches.
- Multiple awards are loaded in parallel, and user can switch between them.
- No request deduplication — same award can be loaded twice if user clicks back and forth.

**Consequences:**
- User clicks Calculate with the wrong award's rates.
- Calculations are silently wrong (same wrong classification, wrong rates).
- User trusts the result and may file a complaint based on wrong data.

**Prevention:**
1. **Cancel previous requests using AbortController.** In awardRatesService.js:
   ```javascript
   let abortController = null;

   export const fetchAwardRates = async (awardId) => {
     abortController = new AbortController();
     try {
       const res = await fetch(`/.netlify/functions/fwc-proxy?awardId=${awardId}`, {
         signal: abortController.signal,
       });
       return await res.json();
     } catch (err) {
       if (err.name === 'AbortError') {
         console.log('Fetch cancelled');
       }
       throw err;
     }
   };

   export const cancelPendingFetch = () => {
     if (abortController) abortController.abort();
   };
   ```

2. **Call cancel in useEffect cleanup.** In App.js:
   ```javascript
   useEffect(() => {
     if (selectedAward !== prevAwardRef.current) {
       cancelPendingFetch();
       prevAwardRef.current = selectedAward;
       initializeAwardRates(); // This will start a new fetch
     }
   }, [selectedAward]);
   ```

3. **Deduplicate requests.** If the same award is already loading, don't fetch again:
   ```javascript
   const [loadingAwards, setLoadingAwards] = useState(new Set());

   const fetchIfNotLoading = async (awardId) => {
     if (loadingAwards.has(awardId)) return; // Already fetching
     setLoadingAwards(prev => new Set([...prev, awardId]));
     // Fetch...
   };
   ```

4. **Test with simulated network latency.** Simulate Slow 3G in DevTools and test:
   - Load app, switch awards rapidly before first load completes.
   - Assert that displayed award matches selected award.
   - Assert that Calculate uses the correct rates.

**Detection:**
- Dropdown shows MA000003, but calculation uses MA000012 rates.
- Network tab shows two concurrent requests to proxy for different awards.
- User reports "rates don't match what I selected".

**When this phase addresses it:**
Phase 1 (Proxy & API Integration). Race conditions are hard to debug, so validate early.

---

## Minor Pitfalls

### Pitfall 9: Tailwind Utility Classes Overflow Component Props

**What goes wrong:**
You start using Tailwind classes for styling. Components that previously had a simple `className="input"` now have `className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"`. This className string is long and hard to read. If you want to override a style based on props (e.g., `error` prop changes border color), you need complex conditional logic:
```javascript
className={`w-full px-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
```

**Why it happens:**
- Tailwind is utility-first, not component-first. You assemble styles by combining utilities.
- No abstraction layer (CSS-in-JS, CSS modules, or component library) to encapsulate Tailwind classes.
- Each component reinvents the same set of utilities.

**Consequences:**
- Code is repetitive and hard to maintain.
- Conditional styling is verbose and error-prone.
- Testing component styling is hard without a clear API.
- Refactoring to change default styles requires changes across many files.

**Prevention:**
1. **Create reusable "styled" component abstractions.** Instead of inline Tailwind in every component, create a `useInputClasses()` hook:
   ```javascript
   const useInputClasses = (error = false) => {
     return `w-full px-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`;
   };

   // Then in component:
   <input className={useInputClasses(error)} />
   ```

2. **Use Tailwind's `@apply` directive for reusable styles.** In a shared CSS file:
   ```css
   .input-base {
     @apply w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none;
   }
   .input-error {
     @apply border-red-500;
   }
   ```

3. **Use a utility library like `clsx` for conditional classes.** Makes readability better:
   ```javascript
   import clsx from 'clsx';

   <input className={clsx(
     'w-full px-4 py-2 border rounded-md',
     error ? 'border-red-500' : 'border-gray-300',
   )} />
   ```

4. **Create a component library or UI kit.** Wrap common UI elements (Input, Button, Card) in components that handle Tailwind internally:
   ```javascript
   <Input error={error} placeholder="Enter amount" />
   ```

**Detection:**
- Tailwind class strings are >100 characters long.
- Same class string appears in multiple components.
- Conditional styling requires nested ternaries.
- Refactoring a style requires changes to many files.

**When this phase addresses it:**
Phase 2 (Tailwind CSS Redesign). Can be deferred to post-v1.1 refactoring if time is tight, but recommended to address during redesign to avoid technical debt.

---

### Pitfall 10: Error Messages Don't Surface API Validation Failures

**What goes wrong:**
User enters shift times and clicks Calculate. Calculation fails silently (returns $0.00) because award rates are missing. There's no error message, just a confusing $0.00 result. User assumes the tool is broken or they entered something wrong.

Why: Error states are returned from `calculatePayForTimePeriod` (e.g., `{ error: 'Invalid rate data' }`), but the UI doesn't display them. Results component shows the `pay` field but ignores the `error` field.

**Why it happens:**
- You add error handling to business logic but don't update the UI layer to surface errors.
- Tests pass because test code doesn't check if error messages are displayed.
- v1.0 had no errors, so UI wasn't designed to show them.

**Consequences:**
- Users see $0.00 and don't know why.
- Users blame themselves or the tool.
- No clear path to recovery (user doesn't know to refresh or retry).

**Prevention:**
1. **Update `calculatePayForTimePeriod` to return errors.** Add error field:
   ```javascript
   return {
     hours: 0,
     pay: 0,
     breakdown: [],
     error: 'Award rates not loaded', // Add this
   };
   ```

2. **Display errors in PaySummary.** Check for error before rendering pay:
   ```javascript
   {results.error ? (
     <div className="alert alert-danger">
       <strong>Error:</strong> {results.error}
       <button onClick={() => location.reload()}>Retry</button>
     </div>
   ) : (
     <div className="pay-summary">...</div>
   )}
   ```

3. **Test error UX.** Create a test that:
   - Mocks calculatePayForTimePeriod to return error.
   - Asserts error message is displayed.
   - Asserts pay is NOT displayed (not confusing).

4. **Provide clear recovery steps.** Error message should suggest action:
   - "Award rates not loaded. Try refreshing the page."
   - "Invalid shift times. Check hours and minutes are valid."

**Detection:**
- App shows $0.00 with no explanation.
- User clicks Calculate, nothing visible changes, confusing UX.
- Error is logged to console but not shown in UI.

**When this phase addresses it:**
Phase 2 (Loading/Error UX). Should be added when error handling is introduced.

---

### Pitfall 11: Hardcoded Fallback Rates Hide API Integration Bugs

**What goes wrong:**
Proxy fails silently (timeout, 502, CORS error). App catches the error and falls back to hardcoded rates. User doesn't know the API failed. They calculate pay and see hardcoded rates as results. Everything appears to work, so you assume the API integration is fine. But in production, new users or new devices will see outdated rates. The bug goes undetected until much later.

Why: Fallback is "too graceful" — it hides failures instead of surfacing them.

**Why it happens:**
- Fallback is good UX for end users, but bad for ops — it hides bugs.
- No monitoring or alerting to know when fallback is triggered.
- Tests don't cover the fallback path (or assume it's correct).

**Consequences:**
- API bugs go undetected for days.
- Users unknowingly rely on stale data.
- Late discovery of bugs means more users affected.

**Prevention:**
1. **Log fallback events with distinct severity.** In awardRatesService:
   ```javascript
   console.warn('[API_FALLBACK] Could not load rates, using hardcoded fallback');
   // Also send to error tracking service (Sentry, LogRocket):
   errorTracker.captureMessage('FWC API fallback triggered', 'warning');
   ```

2. **Add a banner in the UI that shows fallback status.** Don't hide it:
   ```javascript
   {awardRates?.source === 'fallback' && (
     <div className="alert alert-warning">
       <strong>Note:</strong> Using cached award rates (last updated {lastUpdated}).
       Latest rates may be available.
       <button onClick={refreshRates}>Refresh</button>
     </div>
   )}
   ```

3. **Set up monitoring.** In Netlify Functions, log errors with context:
   ```javascript
   if (error) {
     console.error('[FWC_API_ERROR]', {
       error: error.message,
       statusCode: response?.status,
       timestamp: new Date().toISOString(),
     });
   }
   ```

4. **Alert the ops team if fallback is triggered too often.** Set a threshold (e.g., >5 fallbacks in 1 hour) and send a Slack/email alert.

**Detection:**
- Fallback is triggered but no warning is shown to user.
- Logs show API errors but UI appears to work.
- Monitoring dashboard shows spikes in fallback usage (indicating API outage).

**When this phase addresses it:**
Phase 2 (Loading/Error UX) or Phase 3 (Monitoring). Should be addressed before shipping to production.

---

## Phase-Specific Warnings

| Phase | Topic | Pitfall | Mitigation | Phase Requirements |
|-------|-------|---------|-----------|-------------------|
| Phase 1 | Proxy Setup | Cold start timeout | Test in production, set 5s client timeout, implement error handler | Must validate locally AND on prod Netlify before Phase 2 |
| Phase 1 | Proxy Setup | CORS headers | Explicitly set headers in function response, test with browser fetch | Test with actual browser fetch, not curl |
| Phase 1 | API Integration | Calculation desynchronization | Block Calculate until rates loaded, validate rate source, test with both hardcoded and API | Add comprehensive rate hydration tests, compare hardcoded vs API output |
| Phase 1 | API Integration | Data type mismatch | Validate API response with Zod, add defensive checks in calculate function | Create edge case tests (string numbers, missing fields, NaN) |
| Phase 1 | API Integration | Browser cache staleness | Set Cache-Control headers, add timestamp to responses, coordinate caching layers | Monitor cache behavior, test with DevTools Network tab |
| Phase 1 | API Integration | Race conditions | Use AbortController for cancellation, deduplicate requests | Test award switching under slow network (DevTools throttling) |
| Phase 2 | Tailwind Setup | Breaking existing styles | Test immediately after Tailwind installation, use CSS prefix, gradual migration | Checklist of all components, verify visual no regressions before commit |
| Phase 2 | Loading States | State coordination | Define composite app-ready state, block user actions, test with Network throttling | Test all async state combinations (loading, loaded, error, timeout) |
| Phase 2 | Error Handling | Silent failures | Surface all errors in UI, provide recovery steps, add monitoring | Verify every error path shows meaningful message to user |
| Phase 2 | Error Handling | Fallback hiding bugs | Log fallback events, show banner, set up alerts | Monitor fallback frequency, alert on spikes |
| Phase 3 | Sustainability | Utility class bloat | Create component abstractions, use clsx for conditionals | Establish Tailwind style guide, enforce in code review |

---

## Integration Pitfalls: Multi-Phase Dependencies

### Pitfall: Tailwind Redesign Must Wait for API Stability

**What goes wrong:**
You parallelize Phases 1 and 2: start building the Netlify proxy while redesigning with Tailwind. API integration has a race condition bug (Pitfall 8). You don't discover it until Phase 2 is halfway done, and by then you've redesigned components with Tailwind classes. Now you have to rewrite components again to fix the race condition.

**Prevention:**
- **Complete and validate Phase 1 fully before starting Phase 2.** API integration must be stable (no silent failures, no race conditions) before UI redesign.
- **Don't refactor styling until data layer is solid.** Makes it easier to isolate bugs and understand cause/effect.

---

### Pitfall: Error Handling Must Be Designed Before Tailwind

**What goes wrong:**
You redesign with Tailwind, creating a beautiful layout. Then you add error states, and realize you need alert banners, error text styling, etc. You retrofit error styling to existing components, and it breaks the design. Or you skip error styling and users see technical errors with no context.

**Prevention:**
- **Design error/loading states during UI mockup, not after redesign.** Include error banner layouts, disabled button states, loading spinner in the Tailwind redesign.
- **Implement error handling during Phase 2, not Phase 3.** Make error messages and recovery steps a first-class concern.

---

## Sources & Confidence Levels

All findings verified against multiple sources:

### Critical Pitfalls (HIGH confidence)
- Netlify Functions CORS proxy configuration: [Support Guide — Netlify CORS](https://answers.netlify.com/t/support-guide-handling-cors-on-netlify/107739), [Aaron Saray](https://aaronsaray.com/2022/use-netlify-functions-to-proxy-api-for-cors/)
- Netlify Function timeout limits: [Netlify Support](https://answers.netlify.com/t/support-guide-why-is-my-function-taking-long-or-timing-out/71689), [Damian Wróblewski](https://damianwroblewski.com/en/blog/how-to-bypass-the-netlify-serverless-function-timeout/)
- React hydration and API data mismatches: [Josh Comeau — Perils of Hydration](https://www.joshwcomeau.com/react/the-perils-of-rehydration/)
- React race conditions: [Max Rozen](https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect), [React Router](https://reactrouter.com/explanation/race-conditions)
- CSS Framework migration conflicts: [Moving to Tailwind CSS without breaking changes](https://www.hyperui.dev/blog/move-to-tailwindcss-without-breaking-changes/), [Tailwind CSS Installation Guide](https://tailwindcss.com/docs/guides/create-react-app)

### Moderate Pitfalls (MEDIUM confidence)
- Browser caching race conditions: [FreeCodeCamp — Stale Data and Caching](https://www.freecodecamp.org/news/why-your-ui-wont-update-debugging-stale-data-and-caching-in-react-apps/), [LinkedIn — Race Conditions](https://www.linkedin.com/pulse/handling-api-request-race-conditions-react-sebastien-lorber/)
- React state management pitfalls: [Evil Martians — Async State Manager Pitfalls](https://evilmartians.com/chronicles/how-to-avoid-tricky-async-state-manager-pitfalls-react)
- Loading state design: [LogRocket — UI Best Practices](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/)
- Component state testing: [LogRocket — Testing State Changes](https://blog.logrocket.com/testing-state-changes-in-react-functional-components/)

### Minor Pitfalls (LOW-MEDIUM confidence)
- Tailwind utility class management: [DEV Community — Tailwind Merge](https://dev.to/sheraz4194/mastering-tailwind-css-overcome-styling-conflicts-with-tailwind-merge-and-clsx-1dol)
- Error handling in React: [LogRocket — Error Handling](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/)

---

**Last Updated:** 2026-03-09
**Next Review:** After Phase 1 completion (recommend validating all Pitfalls 1-3 before proceeding to Phase 2)
