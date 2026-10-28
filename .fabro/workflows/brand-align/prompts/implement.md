Read the plan file at `.fabro/plans/detector-hardening.md` and execute every task in it, in order.

Before editing any UI file, read these in full:

- `.claude/skills/impeccable/reference/craft-floor.md` — quality floor and absolute bans
- `.claude/skills/impeccable/reference/audit.md` — audit method
- `DESIGN.md` and `.impeccable.md` — this app's design docs

Rules:

- Respect the plan's Constraints and Acceptance sections exactly
- Keep the diff minimal and token-driven — alignment, not redesign
- Styling-only in `src/App.js` (className attributes; no logic, state, or handler edits)
- Do not touch pay-calculation logic or test files
- When the plan's tasks are done, stop — do not freelance additional improvements
