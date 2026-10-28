#!/bin/bash
set -e

BRANCH="fabro/retail-award"
git checkout -b "$BRANCH"
git add -A
git -c user.name="fabro[bot]" -c user.email="noreply@fabro.sh" commit -m "$(cat <<'EOF'
feat: retail award support (fabro run 3)

Executes .fabro/plans/retail-award.md — extends Pay Checker beyond the
Pharmacy Industry Award to the General Retail Industry Award:
config-driven award mechanics, retail classifications and allowances,
API hydration gap closed, retail test coverage, award assumptions
documented for human verification.
EOF
)"
git push -u origin "$BRANCH"
gh pr create --draft --base main \
  --title "Retail award support (fabro run 3)" \
  --body "Third fabro run — a deliberately loosely-specified feature: extend the app from the Pharmacy Industry Award to the General Retail Industry Award. Gates in-run: full test suite incl. new retail coverage, clean build, ubs baseline, impeccable detect src. Award facts used are documented in docs/award-assumptions.md for human verification against the official GRIA pay guide."
