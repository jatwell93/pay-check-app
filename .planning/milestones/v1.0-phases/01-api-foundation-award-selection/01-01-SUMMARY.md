---
phase: 01-api-foundation-award-selection
plan: 01
subsystem: api-service
tags: [api, caching, localStorage, axios, zod, tdd]
dependency_graph:
  requires: []
  provides:
    - awardRatesService (fetchAwardRates, getCachedAwardRates, getLastCacheUpdateTime, clearCache)
    - versioned localStorage cache (award_rates_v1_{awardId})
    - .env.example developer setup doc
  affects:
    - Phase 1 Plan 02 (AwardSelector component will consume awardRatesService)
    - Phase 2 (award-agnostic engine will depend on awardRatesService for rate data)
tech_stack:
  added:
    - axios: ^1.13.6 — HTTP client for FWC API requests
    - axios-retry: ^4.5.0 — exponential backoff retry (max 3, 5xx/network only)
    - zod: ^4.3.6 — Zod schema validation for FWC API responses
  patterns:
    - TDD (RED-GREEN): test scaffold first, implementation second
    - Service module pattern: API + cache logic isolated from React components
    - Lazy expiry: TTL checked on retrieval (not proactively deleted)
    - Versioned localStorage keys: award_rates_v1_{awardId} prevents cache collision on app upgrades
key_files:
  created:
    - src/services/awardRatesService.js — FWC API client, caching logic, Zod validation (4 exports)
    - src/services/awardRatesService.test.js — 11 unit tests covering all cache and fetch behaviors
    - .env.example — documents REACT_APP_FWC_API_KEY for developer onboarding
  modified: []
decisions:
  - "Used __mockInstance on jest.mock factory return value to give tests stable access to the axios instance created at module load time — this avoids jest.mock hoisting issues with const variables"
  - "clearCache() uses localStorage.key(i)/length loop instead of Object.keys(localStorage) to work correctly with jsdom spy-based mocks"
  - "Zod schema is z.object({}).passthrough() — permissive until Phase 2 confirms real FWC API response shape"
  - "REACT_APP_FWC_API_KEY header omitted entirely (not sent as empty string) when env var is absent"
metrics:
  duration: "12 minutes (715 seconds)"
  completed_date: "2026-03-07"
  tasks_completed: 2
  files_created: 3
  files_modified: 0
  tests_added: 11
  tests_passing: 11
---

# Phase 1 Plan 01: awardRatesService Foundation Summary

**One-liner:** FWC API client with 90-day versioned localStorage cache, Zod passthrough validation, and axiosRetry exponential backoff — tested with 11 unit tests using jest.mock factory __mockInstance pattern.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install dependencies and write test scaffold (RED) | 090f8e5 | src/services/awardRatesService.test.js, package.json |
| 2 | Implement awardRatesService.js (GREEN) | 8ad3f98 | src/services/awardRatesService.js, src/services/awardRatesService.test.js, .env.example |

## What Was Built

`src/services/awardRatesService.js` — the data access layer for FWC award rate API integration. Exports:

- **`fetchAwardRates(awardIds)`** — async, fetches all awardIds in parallel with Promise.all, validates each with Zod, caches each in localStorage with 90-day TTL, returns `{ awardId: data }` map
- **`getCachedAwardRates(awardId)`** — sync, lazy expiry check on read, graceful corrupted JSON handling (remove and return null)
- **`getLastCacheUpdateTime(awardId)`** — sync, returns Date of last cache write or null
- **`clearCache(awardId?)`** — sync, clears specific key or all `award_rates_v1_*` keys

Cache entry shape: `{ data: validatedResponse, timestamp: Date.now(), expiry: Date.now() + TTL_MS }`

Cache key pattern: `award_rates_v1_{awardId}` (e.g. `award_rates_v1_MA000012`)

## Test Coverage (11 tests, all passing)

- getCachedAwardRates: cache miss, expired entry (lazy deletion), valid entry, corrupted JSON
- getLastCacheUpdateTime: returns Date on hit, null on miss
- clearCache: single key removal, all prefixed keys removal (preserves unrelated keys)
- fetchAwardRates: API called + result cached, Zod validation failure throws, network error re-thrown

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed clearCache() using Object.keys(localStorage) which bypasses jsdom spy mock**
- **Found during:** Task 2 GREEN phase — clearCache() test failed because `Object.keys(localStorage)` accesses the real jsdom localStorage (always empty), not the spy-intercepted `store` object
- **Issue:** `Object.keys(localStorage)` doesn't go through the `length` + `key(i)` spy chain; it accesses native object properties, bypassing the mock
- **Fix:** Replaced `Object.keys(localStorage).forEach(...)` with a `for (let i = 0; i < localStorage.length; i++)` loop using `localStorage.key(i)` — this routes through the mock correctly
- **Files modified:** src/services/awardRatesService.js
- **Commit:** 8ad3f98

**2. [Rule 1 - Bug] Fixed Jest mock hoisting preventing access to module-level const variables in jest.mock factory**
- **Found during:** Task 2 GREEN phase — test mock approach using module-level `const mockAxiosGet = jest.fn()` referenced inside `jest.mock()` factory threw ReferenceError because jest.mock is hoisted above const declarations by babel-jest
- **Issue:** Jest's babel transform hoists `jest.mock()` calls above ES module imports AND above `const` declarations; `const` variables (unlike `var`) are not accessible before initialization
- **Fix:** Moved the stable mock instance definition INSIDE the jest.mock factory and exposed it as `__mockInstance` on the return object; tests access it via `import axios from 'axios'` then `axios.__mockInstance.get`
- **Files modified:** src/services/awardRatesService.test.js
- **Commit:** 8ad3f98

### Pre-existing Issues (Out of Scope)

**App.test.js CRA boilerplate test failure:** `src/App.test.js` tests for "learn react" text (CRA default) which was removed when the app was developed. This was failing before Plan 01 execution and is unrelated to this plan's changes. Logged to deferred-items.

## Decisions Made

1. **__mockInstance pattern for jest.mock factories:** When a test file needs access to a mock object created inside a `jest.mock()` factory, expose it as a named property on the mock return object and access it via the imported module. This avoids hoisting issues with `const`/`let` variables.

2. **clearCache uses localStorage.key()/length loop:** `Object.keys(localStorage)` bypasses Storage prototype spies. Using `localStorage.key(i)` + `localStorage.length` respects the mock chain and works in both real browsers and jsdom test environments.

3. **Zod passthrough schema (permissive):** `z.object({}).passthrough()` validates that the response is a non-null object without requiring specific fields. This is explicitly a Phase 2 item — once the real FWC API response schema is confirmed, the schema should be tightened.

## Self-Check: PASSED

All required files found:
- FOUND: src/services/awardRatesService.js
- FOUND: src/services/awardRatesService.test.js
- FOUND: .env.example
- FOUND: .planning/phases/01-api-foundation-award-selection/01-01-SUMMARY.md

All commits verified:
- FOUND: 090f8e5 (test scaffold - RED phase)
- FOUND: 8ad3f98 (implementation - GREEN phase)
