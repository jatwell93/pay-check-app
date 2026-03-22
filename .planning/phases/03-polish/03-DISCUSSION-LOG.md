# Phase 3: Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 03-polish
**Areas discussed:** Cache status display, Refresh button behavior, Retry UX feedback, Error message wording

---

## Cache status display

| Option | Description | Selected |
|--------|-------------|----------|
| Relative time | "Rates last updated 3 days ago" — easy to read, already implemented | ✓ |
| Exact date | "Rates last updated: 19 Mar 2026" — more precise for annual rate-change awareness | |
| Both | "Rates last updated: 19 Mar 2026 (3 days ago)" — most informative, more verbose | |

**User's choice:** Relative time (Recommended)
**Notes:** Keep the existing `formatDistanceToNow` format — no change needed.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show nothing | Hide line when null — current behavior | ✓ |
| Show a prompt | "Rates not yet loaded — click Refresh Rates" | |
| Show "just now" after init | Timestamp always visible after successful init | |

**User's choice:** Show nothing (Recommended)
**Notes:** Null state should remain hidden — current behavior is correct.

---

## Refresh button behavior

| Option | Description | Selected |
|--------|-------------|----------|
| clearCache() then re-fetch | Force fresh API call — what the roadmap specifies | ✓ |
| Just re-fetch | Return cached data if TTL still valid — not a real refresh | |

**User's choice:** Yes — clearCache() then re-fetch (Recommended)
**Notes:** Button must force-clear before fetching to deliver a genuine refresh.

---

| Option | Description | Selected |
|--------|-------------|----------|
| All awards | clearCache() with no arg — clears MA000012, MA000003, MA000009 at once | ✓ |
| Selected award only | clearCache(selectedAward) — partial clear | |

**User's choice:** All awards (Recommended)
**Notes:** Rate changes apply across all awards simultaneously; no partial clearing.

---

## Retry UX feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Generic spinner only | "Refreshing..." throughout all retries — transparent | ✓ |
| Retry progress in button | "Retrying (1/3)..." text updates — visible but may worry users | |

**User's choice:** Generic spinner only (Recommended)
**Notes:** Retries are invisible; user just sees the button is loading.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Both initial load and manual refresh | Retry in fetchAwardRates itself — transparent resilience | ✓ |
| Manual refresh only | Initial load fails fast | |

**User's choice:** Both initial load and manual refresh (Recommended)
**Notes:** Retry lives in the service layer and applies to all calls.

---

## Error message wording

| Option | Description | Selected |
|--------|-------------|----------|
| Roadmap phrasing | "Couldn't connect to Fair Work Commission — using saved rates" | ✓ |
| Technical phrasing | "Failed to fetch award rates from proxy" | |
| Claude's discretion | Leave wording to Claude | |

**User's choice:** Roadmap phrasing (Recommended)
**Notes:** Exact string locked in: "Couldn't connect to Fair Work Commission — using saved rates"

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show error banner + keep timestamp | Banner shown, "Rates last updated" stays visible | ✓ |
| Show error banner + clear timestamp | Banner shown, timestamp disappears | |
| Claude's discretion | Leave post-failure state to Claude | |

**User's choice:** Show error banner + keep showing cached timestamp (Recommended)
**Notes:** Reassures user that existing rates are still intact even when refresh fails.

---

## Claude's Discretion

- Exact retry backoff timing (e.g. 1s/2s/4s)
- Whether to retry on 5xx HTTP errors vs. network errors only
- Internal retry implementation approach

## Deferred Ideas

None — discussion stayed within phase scope
