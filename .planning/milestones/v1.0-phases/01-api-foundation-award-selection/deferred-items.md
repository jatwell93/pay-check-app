# Deferred Items — Phase 1: API Foundation & Award Selection

## Pre-existing Issues (Out of Scope)

### App.test.js CRA Boilerplate Test Failure

**Discovered during:** Plan 01 execution (full suite run)
**File:** src/App.test.js
**Issue:** The default CRA test `renders learn react link` tests for text "learn react" that was removed when the app was developed for its actual purpose. This test was already failing before Plan 01 execution.
**Action required:** Update src/App.test.js to test actual App.js behavior (e.g., renders classification select, renders calculate button, renders pay summary after calculation)
**Scope:** Out of scope for Plan 01 (awardRatesService). Candidate for Phase 1 Plan 02 or a dedicated test cleanup plan.
**Confirmed pre-existing:** Yes — confirmed by stashing Plan 01 changes and running the full suite; App.test.js failed identically.
