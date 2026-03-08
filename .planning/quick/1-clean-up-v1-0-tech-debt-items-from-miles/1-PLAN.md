---
phase: quick-1-tech-debt-cleanup
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/services/awardRatesService.js
autonomous: true
requirements: []
must_haves:
  truths:
    - "No stale TODO comment referencing a completed phase exists in awardRatesService.js"
    - "clearCache() JSDoc communicates its reserved-for-future-use status"
    - "All 61 tests continue to pass after the comment-only changes"
  artifacts:
    - path: "src/services/awardRatesService.js"
      provides: "Cleaned-up service file with accurate inline documentation"
  key_links: []
---

<objective>
Remove the stale `TODO Phase 2: tighten schema` comment from awardRatesService.js and add a JSDoc note to the `clearCache()` export explaining it is reserved for a planned manual cache-clear feature (no callers yet). No logic changes — comments only.

Purpose: The v1.0 milestone audit identified 2 actionable tech debt items in awardRatesService.js. Items 3, 4, and 5 from the audit are either intentional design decisions or require manual human verification — no code change possible. This plan closes the 2 code-level items.

Output: Updated src/services/awardRatesService.js with accurate comments; all tests still GREEN.
</objective>

<execution_context>
@C:/Users/josha/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/josha/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/Users/josha/pay-check-app/.planning/v1.0-MILESTONE-AUDIT.md

Key facts from the audit:
- Line 36 of awardRatesService.js: `// TODO Phase 2: tighten schema once real FWC API response shape is confirmed` — Phase 2 is complete; the schema remains `z.object({}).passthrough()` intentionally, reserved for v2 API hydration. The TODO is stale.
- `clearCache()` is exported at line 139 with a valid JSDoc block. It has no callers in the codebase. The export is intentionally kept for a planned future manual cache-clear UI feature.
- Items 3 (awardRates state), 4 (act() warnings), 5 (human verification tests) are acknowledged in the audit but require NO code changes.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove stale TODO and document clearCache reserved status</name>
  <files>src/services/awardRatesService.js</files>
  <action>
    Two targeted comment edits — no logic changes:

    1. Line 36: Replace the stale TODO comment with a short inline note explaining the current design decision:
       Replace:
         `// TODO Phase 2: tighten schema once real FWC API response shape is confirmed`
       With:
         `// Schema is intentionally permissive (passthrough) — tighten once real FWC API response shape is confirmed in v2.`

    2. Above `export function clearCache(awardId)` (around line 133), the existing JSDoc block reads:
       ```
       /**
        * Clears the cache for a specific awardId, or all award rate cache entries
        * if called with no argument.
        *
        * @param {string} [awardId] — If omitted, clears all versioned award_rates_v1_ keys
        */
       ```
       Add one new line after the opening description, before the blank JSDoc line:
       ```
        * Reserved for a planned manual cache-clear UI feature — no callers exist yet.
       ```
       The full updated block should be:
       ```
       /**
        * Clears the cache for a specific awardId, or all award rate cache entries
        * if called with no argument.
        * Reserved for a planned manual cache-clear UI feature — no callers exist yet.
        *
        * @param {string} [awardId] — If omitted, clears all versioned award_rates_v1_ keys
        */
       ```

    Do NOT modify any executable code, imports, exports, or test files.
  </action>
  <verify>
    <automated>cd C:/Users/josha/pay-check-app && npm test -- --watchAll=false 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Line 36 contains no TODO referencing Phase 2
    - clearCache JSDoc mentions "no callers exist yet" and "planned manual cache-clear UI feature"
    - All 61 tests pass (npm test -- --watchAll=false exits 0)
  </done>
</task>

</tasks>

<verification>
After the single task completes:
- grep for "TODO Phase 2" in awardRatesService.js returns no matches
- grep for "no callers" in awardRatesService.js returns the new JSDoc line
- npm test -- --watchAll=false: 61 tests, 0 failures
</verification>

<success_criteria>
- awardRatesService.js contains no stale TODO referencing a completed phase
- clearCache() JSDoc accurately describes its reserved-for-future-use status
- Test suite remains GREEN (61/61 passing)
- No logic or behavior changes — comment-only edits
</success_criteria>

<output>
After completion, create `.planning/quick/1-clean-up-v1-0-tech-debt-items-from-miles/1-SUMMARY.md` following the standard summary template.
</output>
