// Wave 0 stubs for PROXY-02: FWC API response hydration mapping
// Implements after FWC API real response shape is confirmed in Plan 02.
// Uses test.todo() so they compile and pass without implementation.

describe('hydrateAwardRates — FWC response → awardConfig shape', () => {
  test.todo('maps valid FWC response for MA000012 to penaltyConfig + baseRates + allowances');
  test.todo('maps valid FWC response for MA000003 to penaltyConfig + baseRates + allowances');
  test.todo('maps valid FWC response for MA000009 to penaltyConfig + baseRates + allowances');
  test.todo('throws when FWC response is missing required classification data');
  test.todo('throws when FWC response has unexpected shape (Zod rejects)');
  test.todo('returns fallback to awardConfig.js shape when response is empty');
});
