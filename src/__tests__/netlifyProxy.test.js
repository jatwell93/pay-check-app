// Wave 0 stubs for PROXY-01: Netlify Function proxy behavior
// These will be implemented during Plan 02 after FWC API shape is confirmed.
// All tests use test.todo() so they compile and pass without implementation.

describe('netlify/functions/award-rates — proxy behavior', () => {
  test.todo('returns 400 when awardIds query parameter is missing');
  test.todo('returns 500 when FWC_API_KEY env var is not set');
  test.todo('forwards GET to api.fwc.gov.au with Authorization header');
  test.todo('returns FWC response JSON with status 200 on success');
  test.todo('returns 500 when FWC API returns a non-ok status (e.g. 401)');
  test.todo('returns 500 with timeout message when FWC does not respond in 10s');
  test.todo('returns 500 on network error (fetch throws)');
});
