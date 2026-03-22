// netlify/functions/award-rates.js
// Server-side proxy: forwards FWC MAPD API requests without CORS restrictions.
// API key lives in Netlify environment vars only — never exposed to browser.
//
// API base: https://api.fwc.gov.au/api/v1
// Auth: Ocp-Apim-Subscription-Key header
// award_fixed_id = parseInt(awardCode.replace('MA0*', '')) — e.g. MA000012 → 12

const FWC_BASE = 'https://api.fwc.gov.au/api/v1';
const PAGE_LIMIT = 100; // API max is 100

/**
 * Fetch all pages of a paginated FWC endpoint.
 * Returns the combined results array.
 */
async function fetchAllPages(path, apiKey, signal) {
  const headers = {
    'Ocp-Apim-Subscription-Key': apiKey,
    'Accept': 'application/json',
  };
  let page = 1;
  let allResults = [];

  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${FWC_BASE}${path}${sep}limit=${PAGE_LIMIT}&page=${page}`;
    const response = await fetch(url, { headers, signal });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw Object.assign(new Error(`FWC API ${response.status}: ${response.statusText}`), {
        statusCode: response.status,
        body: errorText,
      });
    }

    const data = await response.json();
    allResults = allResults.concat(data.results || []);

    if (!data._meta?.has_more_results) break;
    page++;
  }

  return allResults;
}

/**
 * Extract award_fixed_id from an award code like "MA000012" → 12.
 * The MAPD API uses integer fixed_ids that match the numeric suffix.
 */
function codeToFixedId(awardCode) {
  const match = awardCode.match(/MA0*(\d+)/i);
  if (!match) throw new Error(`Invalid award code: ${awardCode}`);
  return parseInt(match[1], 10);
}

exports.handler = async function (event) {
  const { awardIds } = event.queryStringParameters || {};

  if (!awardIds) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required query parameter: awardIds' }),
    };
  }

  const apiKey = process.env.FWC_API_KEY;
  if (!apiKey) {
    console.error('FWC_API_KEY environment variable is not set');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'API key not configured on server' }),
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for paginated fetches

  try {
    const codes = awardIds.split(',').map((s) => s.trim()).filter(Boolean);

    // Fetch pay-rates for all awards in parallel
    const results = await Promise.all(
      codes.map(async (code) => {
        const fixedId = codeToFixedId(code);
        const payRates = await fetchAllPages(
          `/awards/${fixedId}/pay-rates`,
          apiKey,
          controller.signal
        );
        return { code, fixedId, payRates };
      })
    );

    clearTimeout(timeoutId);

    // Shape response as { MA000012: { award_fixed_id, payRates }, ... }
    const responseData = {};
    for (const { code, fixedId, payRates } of results) {
      responseData[code] = { award_fixed_id: fixedId, payRates };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';
    console.error('Award rates proxy error:', error.message);
    return {
      statusCode: error.statusCode || 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: isTimeout
          ? 'Request timed out — FWC API may be slow'
          : error.message || 'Failed to fetch award rates',
      }),
    };
  }
};
