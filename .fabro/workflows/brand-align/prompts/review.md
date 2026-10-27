You are the reviewer for the brand-alignment change just implemented. Verify it before it ships.

1. Review `git status` and `git diff` against the plan at `.fabro/plans/brand-alignment.md`. Check every acceptance criterion and every constraint.
2. Run `ubs .` as a basic static check. Baseline before this change: **0 critical, 15 warnings, 257 info**. Any NEW critical or warning introduced by this change must be fixed.
3. Confirm `DESIGN.md` no longer references `frontend/`, ExpiryMate, scanners/PDTs, sidebars, or Outfit/Inter.
4. Confirm the Google Fonts link in `public/index.html` loads Bricolage Grotesque + DM Sans, and that no remaining source references Space Grotesk or Inter.
5. Fix any issues you find directly, staying within the plan's constraints, then re-check.

End with a one-paragraph verdict: what you checked, what you fixed, and whether the change satisfies the plan.
