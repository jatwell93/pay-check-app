/**
 * pharmacyRegression.test.js
 *
 * Regression baseline for Pharmacy Industry Award (MA000012) calculations.
 *
 * Purpose:
 *  - Pharmacy tests (GREEN now): establish exact expected values before any refactoring
 *    touches helpers.js. These must continue passing after Plan 02 parameterizes helpers.
 *  - Differentiation test (RED until Plan 02): proves that passing a different award's
 *    penaltyConfig actually changes the calculation. Currently helpers.js ignores the
 *    penaltyConfig argument, so the Saturday multiplier is always hardcoded to 1.5x —
 *    making two calls with identical base rates produce identical pay regardless of config.
 *
 * Expected values were derived by simulating helpers.js minute-by-minute logic in isolation.
 *
 * DO NOT modify production code (helpers.js, App.js) in this task.
 */

import { calculatePayForTimePeriod } from '../helpers';
import { getAwardConfig } from '../config/awardConfig';

const pharmacyConfig = getAwardConfig('MA000012');
const retailConfig = getAwardConfig('MA000003');

// Base rates from MA000012 (Pharmacy Industry Award, effective July 1, 2024)
const PHARMACY_FT_RATE = 25.99;  // pharmacy-assistant-1 full-time
const PHARMACY_CASUAL_RATE = 32.49; // pharmacy-assistant-1 casual

describe('Pharmacy Regression Suite (MA000012)', () => {

  describe('Weekday ordinary rate', () => {
    it('full-time 09:00–17:00 produces correct pay', () => {
      // 8 hours gross, 0.5hr unpaid break = 7.5 billed hours at 1.0x ordinary rate
      // minute-by-minute: 480 min * $25.99 * 1.0 / 60 - 0.5hr * $25.99 = $194.92
      const result = calculatePayForTimePeriod(
        'Monday', '09:00', '17:00', PHARMACY_FT_RATE, 'full-time', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(194.92, 2);
      expect(result.hours).toBeCloseTo(7.5, 2);
    });

    it('casual 09:00–17:00 produces correct pay', () => {
      // Casual loading (1.25x) applied per helpers.js getPenaltyRateDetails for weekday casual
      // 480 min * $32.49 * 1.25 / 60 - 0.5hr * $32.49 * 1.0 = $308.65
      // Note: casualRate already includes 1.25x; the code applies the multiplier on top
      const result = calculatePayForTimePeriod(
        'Monday', '09:00', '17:00', PHARMACY_CASUAL_RATE, 'casual', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(308.65, 2);
      expect(result.hours).toBeCloseTo(7.5, 2);
    });
  });

  describe('Early morning penalty', () => {
    it('full-time 05:00–09:00 applies 1.25x before 07:00, 1.0x after', () => {
      // 4-hour shift: no unpaid break (total hours <= 5)
      // 05:00–07:00 = 120 min at 1.25x: $25.99 * 1.25 * 2 = $64.975
      // 07:00–09:00 = 120 min at 1.0x:  $25.99 * 1.0  * 2 = $51.98
      // total = $116.95 (minute-by-minute floating point → $116.95)
      const result = calculatePayForTimePeriod(
        'Wednesday', '05:00', '09:00', PHARMACY_FT_RATE, 'full-time', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(116.95, 2);
      expect(result.hours).toBeCloseTo(4.0, 2);
    });
  });

  describe('Evening penalty', () => {
    it('full-time 17:00–21:00 applies 1.0x before 19:00, 1.25x after', () => {
      // 4-hour shift: no unpaid break
      // 17:00–19:00 = 120 min at 1.0x:  $25.99 * 1.0  * 2 = $51.98
      // 19:00–21:00 = 120 min at 1.25x: $25.99 * 1.25 * 2 = $64.975
      // total ≈ $116.95 (minute-by-minute floating point accumulation)
      const result = calculatePayForTimePeriod(
        'Thursday', '17:00', '21:00', PHARMACY_FT_RATE, 'full-time', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(116.95, 2);
      expect(result.hours).toBeCloseTo(4.0, 2);
    });
  });

  describe('Weekend penalties', () => {
    it('Saturday full-time 09:00–13:00 at 1.5x', () => {
      // 4-hour shift, no break. All minutes at 1.5x Saturday rate.
      // $25.99 * 1.5 * 4 = $155.94
      const result = calculatePayForTimePeriod(
        'Saturday', '09:00', '13:00', PHARMACY_FT_RATE, 'full-time', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(155.94, 2);
      expect(result.hours).toBeCloseTo(4.0, 2);
    });

    it('Sunday full-time 09:00–13:00 at 2.0x', () => {
      // 4-hour shift, no break. All minutes at 2.0x Sunday rate.
      // $25.99 * 2.0 * 4 = $207.92
      const result = calculatePayForTimePeriod(
        'Sunday', '09:00', '13:00', PHARMACY_FT_RATE, 'full-time', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(207.92, 2);
      expect(result.hours).toBeCloseTo(4.0, 2);
    });

    it('Public Holiday full-time 09:00–13:00 at 2.0x', () => {
      // 4-hour shift, no break. All minutes at 2.0x PH rate.
      // $25.99 * 2.0 * 4 = $207.92
      const result = calculatePayForTimePeriod(
        'Public Holiday', '09:00', '13:00', PHARMACY_FT_RATE, 'full-time', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(207.92, 2);
      expect(result.hours).toBeCloseTo(4.0, 2);
    });
  });

  describe('Junior rates', () => {
    it('pharmacy-assistant-1 age-18 full-time: caller applies 0.7 junior percentage before passing baseRate', () => {
      // App.js applies junior percentage before calling calculatePayForTimePeriod.
      // Junior FT base = $25.99 * 0.70 = $18.193
      // Weekday 09:00-17:00: 480 min * $18.193 * 1.0 / 60 - 0.5hr break = $136.45
      const juniorFtRate = PHARMACY_FT_RATE * 0.7; // 18.193
      const result = calculatePayForTimePeriod(
        'Monday', '09:00', '17:00', juniorFtRate, 'full-time', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(136.45, 2);
      expect(result.hours).toBeCloseTo(7.5, 2);
    });

    it('pharmacy-assistant-1 age-18 casual: caller adjusts for junior percentage and casual loading', () => {
      // App.js: baseRate = casualRate * 0.7 / 1.25 * 1.25 = casualRate * 0.7 = 32.49 * 0.7 = 22.743
      // Casual weekday applies 1.25x again inside calculatePayForTimePeriod.
      // pay = 480 * 22.743 * 1.25 / 60 - 0.5 * 22.743 * 1.0 = $216.06
      const juniorCasualRate = PHARMACY_CASUAL_RATE * 0.7; // 22.743
      const result = calculatePayForTimePeriod(
        'Monday', '09:00', '17:00', juniorCasualRate, 'casual', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(216.06, 2);
      expect(result.hours).toBeCloseTo(7.5, 2);
    });
  });
});

describe('Award differentiation tests (must be RED until Plan 02)', () => {
  it('Saturday Retail (1.25x) should produce LESS pay than Saturday Pharmacy (1.5x) for same base rate and shift', () => {
    // Both calls use the SAME base rate ($25.99) and SAME shift (Sat 09:00–13:00).
    // Only the penaltyConfig differs: Pharmacy saturdayMultiplier=1.5, Retail saturdayMultiplier=1.25.
    //
    // After Plan 02 (parameterized helpers.js):
    //   pharmacyPay = 25.99 * 1.5 * 4 = $155.94
    //   retailPay   = 25.99 * 1.25 * 4 = $129.95
    //   retailPay < pharmacyPay ✓ GREEN
    //
    // With CURRENT helpers.js (hardcoded 1.5x, penaltyConfig argument ignored):
    //   pharmacyPay = 25.99 * 1.5 * 4 = $155.94
    //   retailPay   = 25.99 * 1.5 * 4 = $155.94 (same! penaltyConfig ignored)
    //   retailPay < pharmacyPay → FAILS because values are equal
    const pharmacyPay = calculatePayForTimePeriod(
      'Saturday', '09:00', '13:00', PHARMACY_FT_RATE, 'full-time', '', 'pharmacy-assistant-1',
      pharmacyConfig.penaltyConfig
    );
    const retailPay = calculatePayForTimePeriod(
      'Saturday', '09:00', '13:00', PHARMACY_FT_RATE, 'full-time', '', 'retail-employee-1',
      retailConfig.penaltyConfig
    );
    // This assertion is RED until Plan 02 makes helpers.js respect the penaltyConfig arg
    expect(retailPay.pay).toBeLessThan(pharmacyPay.pay);
  });
});
