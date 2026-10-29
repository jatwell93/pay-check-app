You are the reviewer for the detector-hardening change just implemented. Verify it before it ships.

1. Review `git status` and `git diff` against the plan at `.fabro/plans/detector-hardening.md`. Check every acceptance criterion and every constraint — especially that `src/App.js` changes are styling-only.
2. Run `ubs .` as a basic static check — it takes ~3 min, so redirect to a file (`ubs . > /tmp/ubs-review.txt 2>&1`) and inspect the summary. Baseline: **0 critical / 15 warnings / 265 info**. Any NEW critical or warning introduced by this change must be fixed.
3. Run `./.claude/skills/impeccable/scripts/impeccable detect src` — target is 0 anti-patterns.
4. Grep for residuals per the plan's Acceptance section (sub-11px text, `text-slate-*`/`text-gray-*`, `border-l-4`, `animate-pulse`, `text-ink-muted` on functional text).
5. Fix any issues you find directly, staying within the plan's constraints, then re-check.

End with a one-paragraph verdict: what you checked, what you fixed, and whether the change satisfies the plan.
