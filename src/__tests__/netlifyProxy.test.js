// Tests for awardRatesService.fetchAwardRates — proxy integration
// These tests verify the service calls /.netlify/functions/award-rates
// instead of api.fwc.gov.au directly.

import { fetchAwardRates } from '../services/awardRatesService';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i],
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('fetchAwardRates — proxy integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    global.fetch = jest.fn();
  });

  test('calls /.netlify/functions/award-rates with awardIds query param', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ MA000012: { awardId: 'MA000012' } }),
    });

    await fetchAwardRates(['MA000012']);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/.netlify/functions/award-rates'),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('MA000012'),
      expect.any(Object)
    );
  });

  test('returns ratesMap keyed by awardId on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ MA000012: { awardId: 'MA000012', name: 'Pharmacy Award' } }),
    });

    const result = await fetchAwardRates(['MA000012']);
    expect(result).toHaveProperty('MA000012');
  });

  test('throws when response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'FWC API error' }),
    });

    await expect(fetchAwardRates(['MA000012'])).rejects.toThrow();
  });

  test('throws when fetch itself throws (network error)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

    await expect(fetchAwardRates(['MA000012'])).rejects.toThrow('Network error fetching award rates');
  });

  test('caches successful response in localStorage', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ MA000012: { awardId: 'MA000012' } }),
    });

    await fetchAwardRates(['MA000012']);

    const cached = localStorageMock.getItem('award_rates_v1_MA000012');
    expect(cached).not.toBeNull();
    const parsed = JSON.parse(cached);
    expect(parsed.data).toBeDefined();
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.expiry).toBeDefined();
  });
});
