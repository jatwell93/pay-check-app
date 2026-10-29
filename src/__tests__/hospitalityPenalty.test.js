/**
 * hospitalityPenalty.test.js
 *
 * Regression: an MA000009 casual on a weekday evening must never be paid
 * below the casual-loading floor. When the window checks were moved ahead
 * of the casual-loading fallback, a casual at 21:00+ fell into the evening
 * branch and resolved eveningMultiplier (1.15) — lower than casualLoading
 * (1.25). Awards with explicit casual* overrides (MA000004) are unaffected.
 */

import { calculatePayForTimePeriod } from '../helpers';
import { getAwardConfig } from '../config/awardConfig';

const hospConfig = getAwardConfig('MA000009');
const HOSP_CASUAL_RATE = hospConfig.baseRates.casual['hospitality-employee-1'].base;

describe('Hospitality casual window fallback (MA000009)', () => {
  it('weekday evening casual gets casual loading (1.25), not the 1.15 evening multiplier', () => {
    // Monday 21:30–23:30 — inside the 21:00 evening window, under a 4h shift so no break.
    const r = calculatePayForTimePeriod(
      'Monday', '21:30', '23:30',
      HOSP_CASUAL_RATE, 'casual', '', 'hospitality-employee-1',
      hospConfig.penaltyConfig
    );
    expect(r.breakdown[0].penaltyMultiplier).toBe(1.25);
    expect(r.pay).toBeCloseTo(HOSP_CASUAL_RATE * 1.25 * 2, 2);
  });

  it('weekday daytime casual still gets casual loading (unchanged)', () => {
    const r = calculatePayForTimePeriod(
      'Monday', '09:00', '11:00',
      HOSP_CASUAL_RATE, 'casual', '', 'hospitality-employee-1',
      hospConfig.penaltyConfig
    );
    expect(r.breakdown[0].penaltyMultiplier).toBe(1.25);
  });
});
