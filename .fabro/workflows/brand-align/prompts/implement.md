Read the plan file at `.fabro/plans/retail-award.md` and execute every requirement in it.

Before editing any UI file, read these in full:

- `.claude/skills/impeccable/reference/craft-floor.md` — quality floor and absolute bans
- `.claude/skills/impeccable/reference/audit.md` — audit method
- `DESIGN.md` and `.impeccable.md` — this app's design docs (if present)

Rules:

- Respect the plan's Constraints and Acceptance sections exactly
- This change touches calculation logic and tests — that is in scope this time; pharmacy behaviour must stay identical and its tests green
- This is a loosely-specified task by design: you are expected to discover gaps, verify identifiers, and record assumptions in `docs/award-assumptions.md` — do not skip that file
- When the plan's requirements are met, stop — do not freelance additional features (no hospitality work)
