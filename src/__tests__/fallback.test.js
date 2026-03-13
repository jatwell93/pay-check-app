// Wave 0 stubs for PROXY-03: fallback chain behavior
// Implements in Plan 02 when initializeAwardRates is updated.
// Uses test.todo() so they compile and pass without implementation.

describe('initializeAwardRates — fallback chain', () => {
  test.todo('uses cached rates immediately when all 3 awards are in localStorage');
  test.todo('fetches from proxy when cache is fully missing (no localStorage entries)');
  test.todo('uses partial cache when fetch fails and some awards are cached');
  test.todo('falls back to empty awardRates {} when fetch fails and no cache exists');
  test.todo('sets awardError string when proxy fetch fails (no cache)');
  test.todo('sets awardError string when proxy fetch fails (partial cache)');
  test.todo('clears awardError after successful refresh');
  test.todo('handles corrupted localStorage JSON without throwing');
});
