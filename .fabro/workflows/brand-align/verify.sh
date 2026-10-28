#!/bin/bash
set -o pipefail

echo "=== TESTS ==="
CI=true npm test -- --watchAll=false 2>&1 | tail -30 || exit 1

echo "=== BUILD ==="
CI=true npm run build 2>&1 | tail -20 || exit 1

echo "=== UBS ==="
ubs -q . 2>&1 | tail -45 || exit 1

echo "=== IMPECCABLE DETECT ==="
./.claude/skills/impeccable/scripts/impeccable detect src 2>&1 || exit 1

echo "=== RESIDUAL PATTERNS ==="
if grep -rEn 'text-\[(8|9|10|11)px\]|text-slate-[0-9]+|text-gray-[0-9]+|border-l-4 |animate-pulse' src/ --include='*.js' | grep -v '\.test\.js'; then
  echo "Residual banned patterns found"
  exit 1
fi

echo "All gates passed"
