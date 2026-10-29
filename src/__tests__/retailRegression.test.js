/**
 * retailRegression.test.js
 *
 * Regression baseline for General Retail Industry Award (MA000004) calculations.
 *
 * Purpose:
 *  - Locks the GRIA penalty structure: 150% evening work after 6:00pm,
 *    150% early-morning work before 7:00am, 150% Saturday, 150% Sunday,
 *    250% public holiday, and the loading-inclusive casual penalty totals
 *    (Saturday 175%, Sunday 200%, PH 250%, evening 150% of the loaded casual rate).
 *  - Locks the GRIA overtime tier structure: 150% for the FIRST 3 hours over
 *    the 38-hour weekly threshold, 200% thereafter (vs 2 hours under MA000012),
 *    with casuals overtime-eligible under GRIA.
 *  - Locks the award identity/identifier mapping: GRIA is MA000004.
 *
 * Expected values were derived by simulating helpers.js minute-by-minute logic
 * against the MA000004 config in awardConfig.js (rates effective July 1, 2024 —
 * provenance and confidence for every value live in docs/award-assumptions.md).
 */

import { calculatePayForTimePeriod, calculateOvertimePay } from '../helpers';
import { getAwardConfig } from '../config/awardConfig';

const retailConfig = getAwardConfig('MA000004');
const pharmacyConfig = getAwardConfig('MA000012');

// Base rates from MA000004 (General Retail Industry Award, effective July 1, 2024)
const RETAIL_FT_RATE = 24.10;    // retail-employee-1 full-time
const RETAIL_CASUAL_RATE = 30.13; // retail-employee-1 casual (includes 25% loading)

describe('Retail Regression Suite (MA000004)', () => {

  describe('Award identity and structure', () => {
    it('MA000004 is the General Retail Industry Award', () => {
      expect(retailConfig.awardId).toBe('MA000004');
      expect(retailConfig.name).toBe('General Retail Industry Award');
    });

    it('exposes the GRIA classification ladder (Retail Employee Levels 1–6)', () => {
      const ids = retailConfig.classifications.map((c) => c.id);
      expect(ids).toEqual([
        'retail-employee-1', 'retail-employee-2', 'retail-employee-3',
        'retail-employee-4', 'retail-employee-5', 'retail-employee-6',
        'above-award',
      ]);
    });

    it('offers only GRIA allowances — pharmacy-only allowances are absent', () => {
      expect(retailConfig.allowances).toHaveProperty('mealAllowanceOvertime');
      expect(retailConfig.allowances).toHaveProperty('motorVehiclePerKm');
      expect(retailConfig.allowances).not.toHaveProperty('homeMedicineReview');
      expect(retailConfig.allowances).not.toHaveProperty('laundryFullTime');
      expect(retailConfig.allowances).not.toHaveProperty('laundryPartTimeCasual');
      expect(retailConfig.allowances).not.toHaveProperty('brokenHill');
      expect(retailConfig.allowances).not.toHaveProperty('mealAllowanceOvertimeExtra');
    });

    it('drives penalties from config: GRIA evening 18:00 @150%, Sat/Sun 150%, PH 250%, OT first tier 3h', () => {
      const p = retailConfig.penaltyConfig;
      expect(p.eveningThreshold).toBe(1080);       // 18:00
      expect(p.eveningMultiplier).toBe(1.5);
      expect(p.earlyMorningThreshold).toBe(420);   // 07:00
      expect(p.earlyMorningMultiplier).toBe(1.5);
      expect(p.saturdayMultiplier).toBe(1.5);
      expect(p.sundayMultiplier).toBe(1.5);
      expect(p.phMultiplier).toBe(2.5);
      expect(p.overtimeThresholdHours).toBe(38);
      expect(p.overtimeFirstTierHours).toBe(3);
      expect(p.overtimeAppliesToCasuals).toBe(true);
    });
  });

  describe('Weekday ordinary rate', () => {
    it('full-time 09:00–17:00 produces correct pay', () => {
      // 8 hours gross, 0.5hr unpaid break = 7.5 billed hours at 1.0x ordinary rate
      // 7.5 * $24.10 = $180.75
      const result = calculatePayForTimePeriod(
        'Monday', '09:00', '17:00', RETAIL_FT_RATE, 'full-time', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(180.75, 2);
      expect(result.hours).toBeCloseTo(7.5, 2);
    });

    it('casual 09:00–17:00 pays the loaded casual rate at 1.0x loading multiplier', () => {
      // GRIA casual base ($30.13) already includes the 25% loading; the engine's
      // casualLoadingMultiplier is 1.0 for GRIA. 7.5 * $30.13 = $225.98
      const result = calculatePayForTimePeriod(
        'Monday', '09:00', '17:00', RETAIL_CASUAL_RATE, 'casual', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(225.975, 1);
      expect(result.hours).toBeCloseTo(7.5, 2);
    });
  });

  describe('Evening penalty — 150% after 18:00 (GRIA signature rule)', () => {
    it('full-time 17:00–21:00 applies 1.0x before 18:00, 1.5x after', () => {
      // 4-hour shift: no unpaid break
      // 17:00–18:00 = 60 min at 1.0x:  $24.10 * 1.0  * 1 = $24.10
      // 18:00–21:00 = 180 min at 1.5x: $24.10 * 1.5  * 3 = $108.45
      // total = $132.55
      const result = calculatePayForTimePeriod(
        'Monday', '17:00', '21:00', RETAIL_FT_RATE, 'full-time', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(132.55, 2);
      expect(result.hours).toBeCloseTo(4.0, 2);
      const eveningSegment = result.breakdown.find((s) => s.penaltyDescription.includes('Evening Shift'));
      expect(eveningSegment).toBeDefined();
      expect(eveningSegment.penaltyMultiplier).toBe(1.5);
    });

    it('casual 17:00–21:00 attracts the evening penalty (150% total = 1.2x loaded casual rate)', () => {
      // The casual branch must NOT swallow the window penalty under GRIA:
      // 17:00–18:00 = 1h at casual ordinary (1.0x): $30.13
      // 18:00–21:00 = 3h at casualEveningMultiplier 1.2x: $30.13 * 1.2 * 3 = $108.47
      // total ≈ $138.60 — strictly more than a flat casual shift ($120.52)
      const result = calculatePayForTimePeriod(
        'Monday', '17:00', '21:00', RETAIL_CASUAL_RATE, 'casual', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(138.6, 2);
      expect(result.pay).toBeGreaterThan(RETAIL_CASUAL_RATE * 4);
      const eveningSegment = result.breakdown.find((s) => s.penaltyDescription.includes('Evening Shift'));
      expect(eveningSegment).toBeDefined();
      expect(eveningSegment.penaltyMultiplier).toBeCloseTo(1.2, 2);
    });
  });

  describe('Early morning penalty — 150% before 07:00', () => {
    it('full-time 05:00–09:00 applies 1.5x before 07:00, 1.0x after', () => {
      // 05:00–07:00 = 2h at 1.5x: $24.10 * 1.5 * 2 = $72.30
      // 07:00–09:00 = 2h at 1.0x:  $24.10 * 1.0 * 2 = $48.20
      // total = $120.50
      const result = calculatePayForTimePeriod(
        'Wednesday', '05:00', '09:00', RETAIL_FT_RATE, 'full-time', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(120.5, 2);
      expect(result.hours).toBeCloseTo(4.0, 2);
    });
  });

  describe('Weekend and public holiday penalties (full-time)', () => {
    it('Saturday 09:00–13:00 at 1.5x', () => {
      // $24.10 * 1.5 * 4 = $144.60
      const result = calculatePayForTimePeriod(
        'Saturday', '09:00', '13:00', RETAIL_FT_RATE, 'full-time', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(144.6, 2);
    });

    it('Sunday 09:00–13:00 at 1.5x (reduced GRIA Sunday rate)', () => {
      // $24.10 * 1.5 * 4 = $144.60
      const result = calculatePayForTimePeriod(
        'Sunday', '09:00', '13:00', RETAIL_FT_RATE, 'full-time', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(144.6, 2);
    });

    it('Public Holiday 09:00–13:00 at 2.5x', () => {
      // $24.10 * 2.5 * 4 = $241.00
      const result = calculatePayForTimePeriod(
        'Public Holiday', '09:00', '13:00', RETAIL_FT_RATE, 'full-time', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(241.0, 2);
    });
  });

  describe('Casual weekend/public-holiday totals (loading-inclusive)', () => {
    it('casual Saturday reaches the 175% total (1.4x loaded casual rate)', () => {
      // $30.13 * 1.4 * 4 = $168.73
      const result = calculatePayForTimePeriod(
        'Saturday', '09:00', '13:00', RETAIL_CASUAL_RATE, 'casual', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(168.73, 2);
      expect(result.breakdown[0].penaltyMultiplier).toBeCloseTo(1.4, 2);
    });

    it('casual Sunday reaches the 200% total (1.6x loaded casual rate)', () => {
      // $30.13 * 1.6 * 4 = $192.83
      const result = calculatePayForTimePeriod(
        'Sunday', '09:00', '13:00', RETAIL_CASUAL_RATE, 'casual', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(192.83, 2);
      expect(result.breakdown[0].penaltyMultiplier).toBeCloseTo(1.6, 2);
    });

    it('casual Public Holiday reaches the 250% total (2.0x loaded casual rate)', () => {
      // $30.13 * 2.0 * 4 = $241.04
      const result = calculatePayForTimePeriod(
        'Public Holiday', '09:00', '13:00', RETAIL_CASUAL_RATE, 'casual', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(241.04, 2);
      expect(result.breakdown[0].penaltyMultiplier).toBeCloseTo(2.0, 2);
    });
  });

  describe('Junior rates', () => {
    it('retail-employee-1 age-18 full-time: caller applies 0.7 junior percentage before passing baseRate', () => {
      // Junior FT base = $24.10 * 0.70 = $16.87
      // Weekday 09:00–17:00: 7.5 billed hours * $16.87 = $126.53
      const juniorFtRate = RETAIL_FT_RATE * 0.7; // 16.87
      const result = calculatePayForTimePeriod(
        'Monday', '09:00', '17:00', juniorFtRate, 'full-time', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(result.pay).toBeCloseTo(126.525, 1);
      expect(result.hours).toBeCloseTo(7.5, 2);
    });

    it('juniorPercentage keys resolve against the age-option ids (16–20)', () => {
      // 'under-16', '16', '17', '18', '19', '20' — App.js looks up juniorPercentages[age]
      expect(retailConfig.juniorPercentages['under-16']).toBe(0.45);
      expect(retailConfig.juniorPercentages['16']).toBe(0.5);
      expect(retailConfig.juniorPercentages['17']).toBe(0.6);
      expect(retailConfig.juniorPercentages['18']).toBe(0.7);
      expect(retailConfig.juniorPercentages['19']).toBe(0.8);
      expect(retailConfig.juniorPercentages['20']).toBe(0.9);
    });
  });

  describe('Overtime — GRIA tier structure (config-driven)', () => {
    it('full-time 41 hours: first 3 OT hours at 1.5x', () => {
      // 41 - 38 = 3 OT hours, all in the first tier: 3 * $24.10 * 1.5 = $108.45
      const { overtimeHours, overtimePay } = calculateOvertimePay(
        41, RETAIL_FT_RATE, RETAIL_FT_RATE, 'full-time', retailConfig.penaltyConfig
      );
      expect(overtimeHours).toBeCloseTo(3, 2);
      expect(overtimePay).toBeCloseTo(108.45, 2);
    });

    it('full-time 42.5 hours: 3 hours at 1.5x then 1.5 hours at 2.0x', () => {
      // 3 * $24.10 * 1.5 + 1.5 * $24.10 * 2.0 = 108.45 + 72.30 = $180.75
      const { overtimeHours, overtimePay } = calculateOvertimePay(
        42.5, RETAIL_FT_RATE, RETAIL_FT_RATE, 'full-time', retailConfig.penaltyConfig
      );
      expect(overtimeHours).toBeCloseTo(4.5, 2);
      expect(overtimePay).toBeCloseTo(180.75, 2);
    });

    it('casual overtime is payable under GRIA (overtimeAppliesToCasuals)', () => {
      // 3 OT hours at 1.5x of the loaded casual base: 3 * $30.13 * 1.5 = $135.59
      const { overtimeHours, overtimePay } = calculateOvertimePay(
        41, RETAIL_CASUAL_RATE, RETAIL_FT_RATE, 'casual', retailConfig.penaltyConfig
      );
      expect(overtimeHours).toBeCloseTo(3, 2);
      expect(overtimePay).toBeCloseTo(135.59, 1);
    });

    it('no overtime at or below the 38-hour threshold', () => {
      const { overtimeHours, overtimePay } = calculateOvertimePay(
        38, RETAIL_FT_RATE, RETAIL_FT_RATE, 'full-time', retailConfig.penaltyConfig
      );
      expect(overtimeHours).toBe(0);
      expect(overtimePay).toBe(0);
    });

    it('pharmacy overtime tiers stay locked at 2 hours (differentiation)', () => {
      // MA000012: 150% for the first 2 hours over 38, then 200%.
      // 40h: 2 * $25.99 * 1.5 = $77.97 — NOT the GRIA 3-hour tier ($116.96)
      const { overtimeHours, overtimePay } = calculateOvertimePay(
        40, 25.99, 25.99, 'full-time', pharmacyConfig.penaltyConfig
      );
      expect(overtimeHours).toBeCloseTo(2, 2);
      expect(overtimePay).toBeCloseTo(77.97, 2);
    });

    it('pharmacy casual overtime stays locked OFF (no overtimeAppliesToCasuals flag)', () => {
      const { overtimeHours, overtimePay } = calculateOvertimePay(
        40, 32.49, 25.99, 'casual', pharmacyConfig.penaltyConfig
      );
      expect(overtimeHours).toBe(0);
      expect(overtimePay).toBe(0);
    });
  });

  describe('Award differentiation (config drives the engine)', () => {
    it('Sunday Retail (150%) produces LESS pay than Sunday Pharmacy (200%) for same base rate and shift', () => {
      // Same base rate ($24.10) and shift (Sun 09:00–13:00), only config differs:
      //   pharmacyPay = 24.10 * 2.0 * 4 = $192.80
      //   retailPay   = 24.10 * 1.5 * 4 = $144.60
      const pharmacyPay = calculatePayForTimePeriod(
        'Sunday', '09:00', '13:00', RETAIL_FT_RATE, 'full-time', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      const retailPay = calculatePayForTimePeriod(
        'Sunday', '09:00', '13:00', RETAIL_FT_RATE, 'full-time', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      expect(retailPay.pay).toBeLessThan(pharmacyPay.pay);
      expect(retailPay.pay).toBeCloseTo(144.6, 2);
      expect(pharmacyPay.pay).toBeCloseTo(192.8, 2);
    });

    it('evening penalties diverge: Retail 150% from 18:00 vs Pharmacy 125% from 19:00', () => {
      // Monday 18:00–19:00 is inside Retail's evening window (1.5x) but inside
      // Pharmacy's ordinary span (1.0x): 24.10 * 1.5 = $36.15 vs $24.10
      const retailPay = calculatePayForTimePeriod(
        'Monday', '18:00', '19:00', RETAIL_FT_RATE, 'full-time', '', 'retail-employee-1',
        retailConfig.penaltyConfig
      );
      const pharmacyPay = calculatePayForTimePeriod(
        'Monday', '18:00', '19:00', RETAIL_FT_RATE, 'full-time', '', 'pharmacy-assistant-1',
        pharmacyConfig.penaltyConfig
      );
      expect(retailPay.pay).toBeCloseTo(36.15, 2);
      expect(pharmacyPay.pay).toBeCloseTo(24.1, 2);
      expect(retailPay.pay).toBeGreaterThan(pharmacyPay.pay);
    });
  });
});
