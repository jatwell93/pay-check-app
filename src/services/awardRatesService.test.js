import {
  getCachedAwardRates,
  getLastCacheUpdateTime,
  clearCache,
  fetchAwardRates,
} from './awardRatesService';
import axios from 'axios';

// Mock axios to avoid real HTTP calls.
// The factory is hoisted by Jest before imports, so we cannot reference
// external variables. We store the instance on the mock itself as a property
// so tests can access it via the imported axios module.
jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
  const axiosMock = {
    create: jest.fn(() => mockInstance),
    isAxiosError: jest.fn(),
    // Expose the mock instance for test access
    __mockInstance: mockInstance,
  };
  return axiosMock;
});

jest.mock('axios-retry', () => jest.fn());

// In-memory localStorage mock
let store = {};
beforeEach(() => {
  store = {};
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(k => store[k] ?? null);
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => { store[k] = v; });
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(k => { delete store[k]; });
  jest.spyOn(Storage.prototype, 'key').mockImplementation(i => Object.keys(store)[i] ?? null);
  jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => { store = {}; });
  Object.defineProperty(Storage.prototype, 'length', {
    get: () => Object.keys(store).length,
    configurable: true,
  });
  // Reset the mock http get between tests
  axios.__mockInstance.get.mockReset();
});
afterEach(() => jest.restoreAllMocks());

const CACHE_KEY_PREFIX = 'award_rates_v1';
const makeKey = (awardId) => `${CACHE_KEY_PREFIX}_${awardId}`;

// --- getCachedAwardRates ---

test('getCachedAwardRates returns null when localStorage has no entry for awardId', () => {
  const result = getCachedAwardRates('MA000012');
  expect(result).toBeNull();
});

test('getCachedAwardRates returns null when cached entry is expired', () => {
  const pastExpiry = Date.now() - 1000; // already expired
  const cacheEntry = {
    data: { someField: 'value' },
    timestamp: Date.now() - 2000,
    expiry: pastExpiry,
  };
  store[makeKey('MA000012')] = JSON.stringify(cacheEntry);

  const result = getCachedAwardRates('MA000012');
  expect(result).toBeNull();
});

test('getCachedAwardRates returns stored data object when cache is valid', () => {
  const futureExpiry = Date.now() + 1000 * 60 * 60; // 1 hour from now
  const data = { someField: 'value', rates: { level1: 25.99 } };
  const cacheEntry = {
    data,
    timestamp: Date.now() - 1000,
    expiry: futureExpiry,
  };
  store[makeKey('MA000012')] = JSON.stringify(cacheEntry);

  const result = getCachedAwardRates('MA000012');
  expect(result).toEqual(data);
});

test('getCachedAwardRates returns null and removes item when JSON.parse throws (corrupted entry)', () => {
  store[makeKey('MA000012')] = 'this is not valid json {{{';

  const result = getCachedAwardRates('MA000012');
  expect(result).toBeNull();
  expect(store[makeKey('MA000012')]).toBeUndefined();
});

// --- getLastCacheUpdateTime ---

test('getLastCacheUpdateTime returns a Date matching the stored timestamp', () => {
  const timestamp = Date.now() - 5000;
  const futureExpiry = Date.now() + 1000 * 60 * 60;
  const cacheEntry = {
    data: { someField: 'value' },
    timestamp,
    expiry: futureExpiry,
  };
  store[makeKey('MA000012')] = JSON.stringify(cacheEntry);

  const result = getLastCacheUpdateTime('MA000012');
  expect(result).toBeInstanceOf(Date);
  expect(result.getTime()).toBe(timestamp);
});

test('getLastCacheUpdateTime returns null when no cache entry exists', () => {
  const result = getLastCacheUpdateTime('MA000012');
  expect(result).toBeNull();
});

// --- clearCache ---

test('clearCache(awardId) removes only the specific versioned key from localStorage', () => {
  store[makeKey('MA000012')] = JSON.stringify({ data: {}, timestamp: Date.now(), expiry: Date.now() + 1000 });
  store[makeKey('MA000003')] = JSON.stringify({ data: {}, timestamp: Date.now(), expiry: Date.now() + 1000 });

  clearCache('MA000012');

  expect(store[makeKey('MA000012')]).toBeUndefined();
  expect(store[makeKey('MA000003')]).toBeDefined();
});

test('clearCache() with no argument removes all keys matching the award_rates_v1_ prefix', () => {
  store[makeKey('MA000012')] = JSON.stringify({ data: {}, timestamp: Date.now(), expiry: Date.now() + 1000 });
  store[makeKey('MA000003')] = JSON.stringify({ data: {}, timestamp: Date.now(), expiry: Date.now() + 1000 });
  store['unrelated_key'] = 'should remain';

  clearCache();

  expect(store[makeKey('MA000012')]).toBeUndefined();
  expect(store[makeKey('MA000003')]).toBeUndefined();
  expect(store['unrelated_key']).toBe('should remain');
});

// --- fetchAwardRates ---

test('fetchAwardRates calls the FWC API for each awardId and stores validated results in cache', async () => {
  axios.__mockInstance.get.mockResolvedValue({ data: { awardId: 'MA000012', name: 'Pharmacy' } });

  const result = await fetchAwardRates(['MA000012']);

  expect(axios.__mockInstance.get).toHaveBeenCalledTimes(1);
  expect(result['MA000012']).toBeDefined();
  // Should be stored in cache
  expect(store[makeKey('MA000012')]).toBeDefined();
});

test('fetchAwardRates throws when Zod validation fails (malformed response shape)', async () => {
  // Return null which should fail Zod object validation
  axios.__mockInstance.get.mockResolvedValue({ data: null });

  await expect(fetchAwardRates(['MA000012'])).rejects.toThrow('Unexpected award rate data format from FWC API');
});

test('fetchAwardRates surfaces network errors to the caller (not silently swallowed)', async () => {
  const networkError = new Error('Network Error');
  axios.__mockInstance.get.mockRejectedValue(networkError);

  await expect(fetchAwardRates(['MA000012'])).rejects.toThrow('Network Error');
});
