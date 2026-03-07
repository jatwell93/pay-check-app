import axios from 'axios';
import axiosRetry from 'axios-retry';
import { z } from 'zod';

// Cache configuration
const CACHE_KEY_PREFIX = 'award_rates_v1';
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Creates the versioned localStorage key for a given award ID.
 * Pattern: award_rates_v1_{awardId} (e.g. award_rates_v1_MA000012)
 */
function createCacheKey(awardId) {
  return CACHE_KEY_PREFIX + '_' + awardId;
}

// Axios instance with FWC API base URL and timeout
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_FWC_API_BASE_URL || 'https://api.fwc.gov.au',
  timeout: 10000,
  headers:
    process.env.REACT_APP_FWC_API_KEY
      ? { 'x-api-key': process.env.REACT_APP_FWC_API_KEY }
      : {},
});

// Retry on network errors or 5xx only (not on 4xx — bad key, invalid award)
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return !error.response || error.response.status >= 500;
  },
});

// TODO Phase 2: tighten schema once real FWC API response shape is confirmed
const FWC_AWARD_SCHEMA = z.object({}).passthrough();

/**
 * Fetch award rates from the FWC API for each awardId in the array.
 * Validates responses with Zod before caching.
 * Returns a map of { awardId: validatedData }.
 *
 * @param {string[]} awardIds — e.g. ['MA000012', 'MA000003', 'MA000009']
 * @returns {Promise<Object>}
 */
export async function fetchAwardRates(awardIds) {
  let responses;
  try {
    responses = await Promise.all(
      awardIds.map((id) => apiClient.get('/awards/' + id))
    );
  } catch (error) {
    // Re-throw network/HTTP errors to the caller (not silently swallowed)
    throw error;
  }

  const ratesMap = {};
  for (let i = 0; i < awardIds.length; i++) {
    const awardId = awardIds[i];
    const responseData = responses[i].data;

    // Validate with Zod before storing
    const parseResult = FWC_AWARD_SCHEMA.safeParse(responseData);
    if (!parseResult.success) {
      throw new Error('Unexpected award rate data format from FWC API');
    }

    const validated = parseResult.data;
    ratesMap[awardId] = validated;

    // Cache the validated data with expiry timestamp
    const cacheEntry = {
      data: validated,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_TTL_MS,
    };
    localStorage.setItem(createCacheKey(awardId), JSON.stringify(cacheEntry));
  }

  return ratesMap;
}

/**
 * Returns the cached award rates for the given awardId, or null on cache miss / expiry.
 * Implements lazy expiry: checks expiry timestamp on retrieval.
 * Handles corrupted localStorage JSON gracefully.
 *
 * @param {string} awardId
 * @returns {Object|null}
 */
export function getCachedAwardRates(awardId) {
  const raw = localStorage.getItem(createCacheKey(awardId));
  if (!raw) return null;

  let cacheEntry;
  try {
    cacheEntry = JSON.parse(raw);
  } catch {
    // Corrupted JSON: remove and treat as cache miss
    localStorage.removeItem(createCacheKey(awardId));
    return null;
  }

  // Lazy expiry check
  if (cacheEntry.expiry && Date.now() > cacheEntry.expiry) {
    localStorage.removeItem(createCacheKey(awardId));
    return null;
  }

  return cacheEntry.data;
}

/**
 * Returns the Date when the award rates were last fetched and cached,
 * or null if there is no cache entry for the given awardId.
 *
 * @param {string} awardId
 * @returns {Date|null}
 */
export function getLastCacheUpdateTime(awardId) {
  const raw = localStorage.getItem(createCacheKey(awardId));
  if (!raw) return null;

  try {
    const cacheEntry = JSON.parse(raw);
    return new Date(cacheEntry.timestamp);
  } catch {
    return null;
  }
}

/**
 * Clears the cache for a specific awardId, or all award rate cache entries
 * if called with no argument.
 *
 * @param {string} [awardId] — If omitted, clears all versioned award_rates_v1_ keys
 */
export function clearCache(awardId) {
  if (awardId) {
    localStorage.removeItem(createCacheKey(awardId));
  } else {
    // Remove all keys starting with the versioned prefix.
    // Use localStorage.key(i) + length rather than Object.keys() so this
    // works correctly with jsdom's Storage spy-based mocks in tests.
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }
}
