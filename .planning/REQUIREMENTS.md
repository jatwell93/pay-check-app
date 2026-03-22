# Requirements: Pay Check App v1.1

**Defined:** 2026-03-13
**Core Value:** A worker can enter their shifts, see exactly how much they should have been paid and why, and know with confidence whether they have been underpaid.

## v1.1 Requirements

Requirements for this milestone. Each maps to a roadmap phase.

### Proxy & Live Rates

- [x] **PROXY-01**: A Netlify Functions proxy routes FWC API requests server-side, eliminating the CORS error that currently prevents the app from loading rates
- [x] **PROXY-02**: `calculatePay` reads live award rates hydrated from the FWC API (via proxy + cache), not hardcoded values from `awardConfig.js`
- [x] **PROXY-03**: If the proxy is unreachable or returns an error, the app falls back to hardcoded rates from `awardConfig.js` with a visible warning to the user

### UX & Styling

- [x] **UX-01**: All app components are restyled with Tailwind CSS using a clean professional look (navy/white palette)
- [ ] **UX-02**: Pay verification status indicators use green for "Paid Correctly" and red for "Underpaid" throughout the UI
- [x] **UX-03**: Loading states (spinner while fetching rates) and error messages (when API fails) are displayed clearly so the user always knows the app's status

### Polish

- [ ] **POLISH-01**: A cache status indicator shows when rates were last fetched and a manual refresh button lets the user trigger a fresh rate fetch

## Deferred to v2

Tracked but not in current roadmap.

### Extended Awards

- **EXT-01**: User can search and select from all 121 modern awards available in the FWC database
- **EXT-02**: App detects the annual wage review date and prompts users to refresh rates after July 1

### Sharing / Export

- **EXP-01**: User can copy or download a summary of the discrepancy for use in a payroll dispute

### Resilience

- **RES-01**: App notifies users when cached rates are stale (older than 12 months) and prompts a refresh

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payslip PDF/image upload | High complexity, OCR unreliable — manual entry is sufficient |
| User accounts / login | Stateless tool, no data persistence needed |
| Mobile app | Web-first; responsive web sufficient |
| Legal advice or dispute lodging | Informational tool only |
| All 121 awards | 3 key awards validate the approach; expand in v2 |
| Real-time rate polling / WebSockets | Not needed — rates change annually |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROXY-01 | Phase 1 | Complete |
| PROXY-02 | Phase 1 | Complete |
| PROXY-03 | Phase 1 | Complete |
| UX-03 | Phase 1 | Complete |
| UX-01 | Phase 2 | Complete |
| UX-02 | Phase 2 | Pending |
| POLISH-01 | Phase 3 | Pending |

**Coverage:**
- v1.1 requirements: 7 total
- Mapped to phases: 7 ✓
- Unmapped: 0

---

*Requirements defined: 2026-03-13*
