You are the reviewer for the retail-award change just implemented. Verify it before it ships.

1. Review `git status` and `git diff` against the plan at `.fabro/plans/retail-award.md`. Check every requirement, constraint, and acceptance criterion.
2. Scrutinise correctness specifically: do the award identifiers map to the right awards? Are award-specific mechanics (overtime tiers, penalty windows) config-driven rather than hardcoded? Do retail classifications and the retail allowance set appear — and do pharmacy-only allowances disappear — when retail is selected? Does `docs/award-assumptions.md` exist and honestly record what was assumed?
3. Run `ubs .` as a basic static check — it takes ~3 min, so redirect to a file (`ubs . > /tmp/ubs-review.txt 2>&1`) and inspect the summary. Baseline: **0 critical / 15 warnings / 265 info**. Any NEW critical or warning introduced by this change must be fixed.
4. Run `./.claude/skills/impeccable/scripts/impeccable detect src` — target is 0 anti-patterns.
5. Confirm tests cover the new retail behaviour and all previously passing tests still pass.
6. Fix any issues you find directly, staying within the plan's constraints, then re-check.

End with a one-paragraph verdict: what you checked, what you fixed, and whether the change satisfies the plan.
