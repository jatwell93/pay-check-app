// netlify/functions/award-rates.js
// Server-side proxy: forwards FWC API requests without CORS restrictions.
// API key lives in Netlify environment vars only — never exposed to browser.

exports.handler = async function(event) {
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

  // AbortController gives us a 10-second timeout on slow FWC responses
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `https://api.fwc.gov.au/awardrates/find?awardIds=${encodeURIComponent(awardIds)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`FWC API error ${response.status}:`, errorText);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `FWC API returned ${response.status}: ${response.statusText}`,
        }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';
    console.error('Award rates proxy error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: isTimeout
          ? 'Request timed out after 10 seconds — FWC API may be slow'
          : error.message || 'Failed to fetch award rates',
      }),
    };
  }
};
