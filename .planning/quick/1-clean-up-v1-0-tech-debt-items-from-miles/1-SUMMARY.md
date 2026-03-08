---
quick-task: 1
description: Clean up v1.0 tech debt items from milestone audit
status: complete
date: 2026-03-09
files-modified:
  - src/services/awardRatesService.js
tests: 61/61 passing
---

# Quick Task 1 — Tech Debt Cleanup Summary

## What Was Done

Two comment-only edits to `src/services/awardRatesService.js`:

1. **Removed stale TODO (line 36):** Replaced `// TODO Phase 2: tighten schema once real FWC API response shape is confirmed` with `// Schema is intentionally permissive (passthrough) — tighten once real FWC API response shape is confirmed in v2.`

2. **Documented clearCache reserved status (line 136):** Added `* Reserved for a planned manual cache-clear UI feature — no callers exist yet.` to the existing JSDoc block.

## Items Acknowledged (No Code Change Possible)

| Item | Reason |
|------|--------|
| `awardRates` state vs `calculatePay` reading awardConfig.js | Intentional design — retained for v2 API hydration (documented in 02-03-SUMMARY) |
| `act()` warnings in App.test.js | Pre-existing from async useEffect; requires React upgrade to fix; tests all pass |
| 4 pending human verification tests | Manual checks only — cannot be automated |

## Verification

- `grep "TODO Phase 2" src/services/awardRatesService.js` → no matches
- `grep "no callers" src/services/awardRatesService.js` → line 136 matches
- `npm test -- --watchAll=false` → **61/61 tests passing**
