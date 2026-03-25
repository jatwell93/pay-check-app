# Research Summary: v1.1 API Integration & UX Redesign

**Domain:** Australian award calculator SPA with live FWC rate integration
**Researched:** 2026-03-09
**Overall Confidence:** MEDIUM (Netlify + React patterns well-established; FWC API integration untested in codebase)

---

## Executive Summary

v1.1 transforms Pay Check App from hardcoded-rate calculator into a live-rate tool by routing FWC API calls through a Netlify Functions proxy (eliminating CORS) and redesigning the UI with Tailwind CSS for professional polish.

**Core challenge:** The FWC MAAPI v1 API response structure is unknown. v1.0's `awardConfig.js` hardcodes rates; v1.1 must map live API responses into the same data shapes. A mismatch will require major refactoring.

**Solution:** Two independent, testable features:
1. **API + Fallback layer** (non-breaking, backwards-compatible): Fetch live rates via proxy, fallback to hardcoded if anything fails. Can ship without redesign.
2. **Tailwind redesign** (visual polish): Redesign components with professional navy/white theme and green/red status indicators.

**Phasing:** Build API layer first (validates FWC integration), then redesign (polish without blocking on API). Defer polling/WebSocket/all-121-awards to v2.

**Key risks:**
- FWC API response shape doesn't match hardcoded structure → need hydration mapping
- Cache stale for 90 days without user knowing → need transparency (show cache date + refresh button)
- Netlify function times out on slow network → need timeout handling + graceful fallback
- Mobile UI breaks with Tailwind → need mobile-first approach + real device testing

**Why this architecture?**
- Netlify Functions: serverless, no backend infrastructure, API key stays server-side
- Tailwind: utility-first reduces custom CSS, navy/white + green/red colors out-of-box
- Fallback to hardcoded: app never breaks, even if proxy down
- Graceful degradation: network issues → show clear message + retry button

---

## Key Findings

**Stack:** React 19 SPA + Netlify Functions proxy + Tailwind CSS v4 (no breaking changes)

**Architecture:** Fetch rates on app mount → cache 90 days → fallback to hardcoded → calculate pay (same logic as v1.0)

**Critical pitfall:** FWC API response shape unconfirmed → must test before coding

**Error handling table stakes:** Loading spinners, clear error messages, retry buttons, graceful fallback to known-good rates

**Professional UI expectations:** Navy/white theme, green/red status indicators, responsive forms, mobile-first layout

---

## Implications for Roadmap

### Recommended Phase Structure for v1.1

**Phase 1: API Integration & Fallback (Week 1-2)**
- Build Netlify Functions proxy to FWC MAAPI v1
- Test real FWC API response; document exact structure
- Build Zod schema for validation (strict, not permissive)
- Implement rate hydration: map API response → `awardConfig.js` shape
- Implement fallback: if API fails, use hardcoded rates from `awardConfig.js`
- Add loading spinner + error banner (basic UX, not styled yet)
- Unit tests: validate hydration logic, test error paths
- **Deliverable:** App works with live rates OR hardcoded fallback. No visual changes yet.

**Phase 2: Tailwind Redesign (Week 2-3)**
- Install Tailwind CSS, configure theme (navy/white/green/red)
- Redesign form components: award selector, time inputs, allowances (responsive)
- Redesign summary card: green/red status indicators for paid correctly vs underpaid
- Redesign segment breakdown table: preserve clarity, style with Tailwind
- Style loading spinner + error banner
- Mobile-first approach: test on real devices (iPhone, Android)
- Browser testing: Chrome, Safari, Firefox
- **Deliverable:** Full Tailwind redesign. Same functionality as Phase 1, just styled.

**Phase 3: Polish (Week 3)**
- Add cache refresh indicator: show "Rates from [date], [Refresh]"
- Wire `clearCache()` to UI button (already exported, just needs button)
- Add retry logic: retry 3x with exponential backoff before fallback
- Improve error messages: make user-friendly (not technical)
- Preserve all v1.0 features: test weekly/fortnightly pay, per-day breakdown, allowances, overtime

**Outcome:** Production-ready v1.1. Live rates from FWC, professional UI, graceful fallback.

---

## Critical Unknowns (Must Resolve Before Phase 1)

| Unknown | Impact | Resolution |
|---------|--------|-----------|
| **FWC API response structure** | HIGH | Must test real API with sandbox key before coding proxy. Document exact JSON shape. |
| **FWC API rate limits** | MEDIUM | Check if there are quota limits. If so, design caching strategy accordingly. |
| **FWC API update frequency** | MEDIUM | Confirm when rates change (quarterly? Annual Wage Review in July?). Adjust cache TTL accordingly. |
| **Netlify Function cold start latency** | LOW | Acceptable if <1 second. If >2 seconds, show loading message. Test with real deployment. |

---

## Table Stakes Features

✓ Live rates from official FWC source (blockers refactoring if API shape differs)
✓ Loading indicators during API calls
✓ Clear error messages + retry button
✓ Graceful fallback to hardcoded rates
✓ Professional Tailwind CSS redesign
✓ Green/red status indicators
✓ Responsive input forms

---

## Differentiators

✓ Award-agnostic hydration with live rates (supports any FWC award via API)
✓ Transparent cache status (show refresh date + manual refresh button)
✓ Detailed segment-level breakdown (already in v1.0; preserve in redesign)
✓ Professional error recovery (retry 3x with backoff)

---

## Anti-Features (Explicitly Don't Build)

- No switching rate sources mid-calculation without re-entering shifts
- No partial hydration (all awards use API or all use hardcoded, not mixed)
- No complex cache invalidation UI
- No real-time rate polling/WebSocket
- No storing actual paid amounts in localStorage
- No inline rate editing (read-only from API)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| **Netlify Functions proxy pattern** | HIGH | Well-documented, many examples, proven pattern for CORS bypass |
| **React data fetching** | HIGH | Suspense + useEffect patterns well-understood, v19 stable |
| **Tailwind CSS styling** | HIGH | Mature framework, extensive docs, utility-first approach proven |
| **Error handling UX** | MEDIUM | Standard patterns (spinners, error messages), but specific error messages need user testing |
| **FWC API integration** | MEDIUM-LOW | API structure unconfirmed, no documentation in public domain. Requires real testing. |
| **Rate hydration mapping** | MEDIUM | Depends entirely on FWC API response structure. Once structure known, mapping is straightforward. |
| **Cache strategy (90-day TTL)** | MEDIUM | Seems reasonable, but assumes FWC rates don't change unexpectedly. Need to monitor actual update patterns. |
| **Mobile responsiveness** | MEDIUM | Tailwind provides tools, but final implementation needs real device testing. |

---

## Gaps to Address

### Must-Do Before Phase 1
- [ ] Test FWC MAAPI v1 with real sandbox credentials
- [ ] Document actual API response structure (JSON examples)
- [ ] Confirm which awards available in API (currently assuming Pharmacy, Retail, Hospitality)
- [ ] Confirm API rate limits, if any

### Phase-Specific Research (Can defer to execution)
- [ ] Real device testing for mobile responsiveness (do during Phase 2)
- [ ] Performance profile: Netlify function latency, Tailwind CSS bundle size (do during Phase 3)
- [ ] Monitor FWC update patterns: when do rates actually change? (track in v1.1 and v2)

### Future Phases (v2 or beyond)
- [ ] Expand to all 121 modern awards (not just 3)
- [ ] Real-time rate polling or webhook integration (not needed for v1.1)
- [ ] User preferences: default award, payment frequency (stateless is better for v1.1)
- [ ] PDF payslip upload and parsing (deferred)

---

## Architecture Decision Rationale

| Decision | Why This Way | Tradeoff |
|----------|-------------|----------|
| Fetch rates on app mount | Simpler state management; all rates loaded upfront; no stalls during input | Slower initial load if FWC slow (mitigated with loading spinner + fallback) |
| Fallback to hardcoded rates | App never breaks; production resilience | Users may not realize rates are outdated; need transparency |
| Netlify Functions proxy | Secure (API key server-side), no backend infrastructure, simple | Adds one more service (Netlify) as dependency; cold start latency |
| Tailwind CSS redesign | Professional, utility-first, low bundle size impact | Large refactor of UI components; need mobile testing |
| 90-day cache TTL | Reduces API calls; FWC rates rarely change | May miss emergency updates; need to monitor and offer manual refresh |
| All-or-nothing rate hydration | Avoids partial failures; clear state | Less granular control; if one award fails, all fail |

---

## Success Criteria for v1.1

### Functional
- [ ] App fetches live rates from FWC via Netlify proxy
- [ ] Rates cached for 90 days; no redundant fetches
- [ ] If proxy down: app falls back to hardcoded rates + shows error banner
- [ ] If FWC slow: loading spinner shows; user doesn't think app is broken
- [ ] Calculate button disabled while rates loading
- [ ] Pay calculation identical to v1.0 (same `calculatePay()` logic)
- [ ] All v1.0 features preserved: weekly/fortnightly, per-day breakdown, allowances, overtime

### UI/UX
- [ ] Professional Tailwind design: navy/white theme
- [ ] Green checkmark for "Paid Correctly", red X for "Underpaid"
- [ ] Responsive forms: usable on mobile (tested on real devices)
- [ ] Loading spinner + error banner clearly visible
- [ ] Retry button works: clicking retry re-fetches rates
- [ ] Cache refresh indicator: "Rates from [date], [Refresh]"

### Testing
- [ ] All v1.0 tests still pass (no regressions)
- [ ] New tests: validate hydration logic, error paths, fallback
- [ ] Manual testing: mobile, slow network, API failures
- [ ] Code review: no API key in source, env vars correct, Tailwind classes clean

### Deployment
- [ ] Netlify.com deployment: SPA serves, Functions proxy works, env vars set correctly
- [ ] Production monitoring: check FWC rate freshness, error rates, performance

---

## Phase Ordering Rationale

**API Integration first (Phase 1):**
- Core blocker: without proxy, app can't reach FWC API at all
- Non-visual: can ship without redesign (MVP validation with beta testers)
- Isolated: easy to test independently
- Risk reduction: discover FWC API shape early; iterate if needed

**Tailwind redesign second (Phase 2):**
- Not a blocker: fallback rates work fine unstyled
- Visual polish: improves credibility and usability
- Easier to test: once API layer stable, can focus purely on styling
- Large surface area: good to have separate phase for thorough mobile testing

**Polish & defer (Phase 3 + v2):**
- Cache transparency: small work, nice-to-have for v1.1
- Retry logic: standard error handling, not blocking
- Real-time polling: not needed until rates change more frequently; skip v1.1
- All 121 awards: scope creep; validate with 3 awards first

---

## Open Questions for Implementation

1. **FWC API shape:** What does a real response look like? Are classifications arrays or objects? How are allowances structured?
2. **Rate comparison:** When user compares actual paid vs calculated, how is rounding handled? (Fair Work has specific rounding rules for payslips.)
3. **Cache age display:** Where should we show "Rates from [date]"? In a header, footer, or tooltip?
4. **Error message tone:** Should errors be technical ("API error: 500") or user-friendly ("Couldn't connect to FWC")?
5. **Mobile breakpoints:** Do forms work at 320px (iPhone SE) or only 375px+?
6. **Award-specific penalty times:** Do penalty boundaries change by award (e.g., Retail evening starts at 18:00, Pharmacy at 19:00)? If so, will API provide these?

---

## Sources

**Netlify Functions & Deployment:**
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Setup a CORS Proxy With Netlify | Jim Nielsen](https://blog.jim-nielsen.com/2020/a-cors-proxy-with-netlify/)

**React Data Fetching (2026):**
- [The Modern React Data Fetching Handbook | freeCodeCamp](https://www.freecodecamp.org/news/the-modern-react-data-fetching-handbook-suspense-use-and-errorboundary-explained/)
- [Data Fetching Patterns in SPAs | Martin Fowler](https://martinfowler.com/articles/data-fetch-spa.html)

**Graceful Degradation:**
- [Graceful Degradation in Web Development | LogRocket](https://blog.logrocket.com/guide-graceful-degradation-web-development/)
- [AWS Well-Architected Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/)

**Tailwind CSS & Responsive Design:**
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Responsive Design Best Practices | Smashing Magazine](https://www.smashingmagazine.com/2017/10/testing-mobile-first-approach/)

**Error Handling UX:**
- [UI Best Practices for Loading, Error, and Empty States | LogRocket](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/)
