#!/bin/bash
set -e

BRANCH="fabro/detector-hardening"
git checkout -b "$BRANCH"
git add -A
git -c user.name="fabro[bot]" -c user.email="noreply@fabro.sh" commit -m "$(cat <<'EOF'
fix: clear impeccable detector residuals (fabro run 2)

Executes .fabro/plans/detector-hardening.md:
- sub-11px functional text -> >= text-xs
- text-ink-muted -> text-ink-secondary on functional text (WCAG AA)
- App.js header tagline/subtitle on-dark tokens, error banner side-stripe removed
- remove animate-pulse dot, flatten nested cards in DetailedBreakdown
- amber-dark/80 -> amber-dark (AA on amber-50)
EOF
)"
git push -u origin "$BRANCH"
gh pr create --draft --base fabro/brand-align \
  --title "Fix impeccable detector residuals (fabro run 2)" \
  --body "Second fabro run: clears the 21 residual anti-patterns found by post-run impeccable audit. Stacks on #1; retargets to main after it merges. Gates in-run: 87/87 tests, clean build, ubs baseline, impeccable detect src, residual pattern greps."
