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

// Schema is intentionally permissive (passthrough) — tighten once real FWC API response shape is confirmed in v2.
const FWC_AWARD_SCHEMA = z.object({}).passthrough();

/**
 * Fetch award rates from the Netlify proxy for each awardId in the array.
 * Calls /.netlify/functions/award-rates (same-origin — avoids CORS).
 * Validates responses with Zod before caching.
 * Returns a map of { awardId: validatedData }.
 *
 * @param {string[]} awardIds — e.g. ['MA000012', 'MA000003', 'MA000009']
 * @returns {Promise<Object>}
 */
export async function fetchAwardRates(awardIds) {
  const idsString = awardIds.join(',');
  const proxyUrl = `/.netlify/functions/award-rates?awardIds=${encodeURIComponent(idsString)}`;

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let response;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          response = await fetch(proxyUrl, { signal: controller.signal });
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        throw new Error(`Network error fetching award rates: ${error.message}`);
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `Proxy returned ${response.status}`);
      }

      const data = await response.json();

      // data is expected to be keyed by awardId: { MA000012: {...}, MA000003: {...}, ... }
      // This shape comes from FWC API via the proxy — exact structure TBD once API tested.
      // hydrateAwardRates() will transform raw FWC data to awardConfig shape.
      const ratesMap = {};
      for (const awardId of awardIds) {
        const rawAwardData = data[awardId];

        if (!rawAwardData) {
          // FWC didn't return this award — skip (caller handles partial results)
          console.warn(`No data returned for award ${awardId}`);
          continue;
        }

        // Validate with Zod before caching (permissive passthrough until FWC shape confirmed)
        const parseResult = FWC_AWARD_SCHEMA.safeParse(rawAwardData);
        if (!parseResult.success) {
          console.error(`Validation failed for ${awardId}:`, parseResult.error);
          throw new Error(`Unexpected response shape for award ${awardId}`);
        }

        const validated = parseResult.data;
        ratesMap[awardId] = validated;

        // Cache with TTL
        const cacheEntry = {
          data: validated,
          timestamp: Date.now(),
          expiry: Date.now() + CACHE_TTL_MS,
        };
        localStorage.setItem(createCacheKey(awardId), JSON.stringify(cacheEntry));
      }

      return ratesMap;  // Success — return early, skip remaining retry attempts
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        // Exponential backoff: 1s → 2s → 4s (per D-05, Claude's discretion)
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  throw lastError;
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
 * Reserved for a planned manual cache-clear UI feature — no callers exist yet.
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
