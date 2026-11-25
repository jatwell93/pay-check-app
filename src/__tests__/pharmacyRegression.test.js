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

import { calculatePayForTimePeriod, calculateWeeklyPay } from '../helpers';
import { getAwardConfig } from '../config/awardConfig';

const pharmacyConfig = getAwardConfig('MA000012');
const retailConfig = getAwardConfig('MA000004');

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

describe('Pharmacy weekly overtime classification', () => {
  const weeklyPay = shifts => calculateWeeklyPay(
    shifts.map(([day, startTime, endTime]) => ({ day, startTime, endTime, publicHoliday: false })),
    29.03,
    'full-time',
    '',
    'pharmacy-assistant-4',
    pharmacyConfig.penaltyConfig
  );

  it('keeps exactly 38 paid hours ordinary', () => {
    const result = weeklyPay([
      ['Monday', '09:00', '19:00'],
      ['Tuesday', '09:00', '19:00'],
      ['Wednesday', '09:00', '19:00'],
      ['Thursday', '09:00', '19:00'],
    ]);

    expect(result.totalHours).toBe(38);
    expect(result.ordinaryHours).toBe(38);
    expect(result.overtimeHours).toBe(0);
    expect(result.overtimePay).toBe(0);
  });

  it('applies Saturday and Sunday ordinary penalties below 38 hours', () => {
    const result = weeklyPay([
      ['Saturday', '09:00', '13:00'],
      ['Sunday', '09:00', '13:00'],
    ]);

    expect(result.overtimeHours).toBe(0);
    expect(result.dailyBreakdown[0].pay).toBe(174.18);
    expect(result.dailyBreakdown[0].segments[0]).toMatchObject({
      penaltyDescription: 'Saturday Rate (150%)',
      penaltyMultiplier: 1.5,
      isOvertime: false,
    });
    expect(result.dailyBreakdown[1].pay).toBe(232.24);
    expect(result.dailyBreakdown[1].segments[0]).toMatchObject({
      penaltyDescription: 'Sunday Rate (200%)',
      penaltyMultiplier: 2,
      isOvertime: false,
    });
  });

  it('uses the Sunday penalty floor when the first overtime minute falls on Sunday', () => {
    const result = weeklyPay([
      ['Monday', '09:00', '18:00'],
      ['Tuesday', '09:00', '18:00'],
      ['Wednesday', '09:00', '18:00'],
      ['Thursday', '09:00', '18:00'],
      ['Sunday', '09:00', '14:00'],
    ]);
    const sunday = result.dailyBreakdown[4];

    expect(result.ordinaryHours).toBe(38);
    expect(result.overtimeHours).toBe(1);
    expect(sunday.pay).toBe(290.3);
    expect(sunday.segments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        startTime: '13:00',
        endTime: '14:00',
        penaltyDescription: 'Sunday Overtime — First Tier (200%)',
        penaltyMultiplier: 2,
        isOvertime: true,
      }),
    ]));
  });

  it('attributes post-midnight overtime to Sunday', () => {
    const result = weeklyPay([
      ['Monday', '09:00', '19:00'],
      ['Tuesday', '09:00', '19:00'],
      ['Wednesday', '09:00', '19:00'],
      ['Friday', '09:00', '18:00'],
      ['Saturday', '23:00', '02:00'],
    ]);
    const overnight = result.dailyBreakdown[4];

    expect(result.ordinaryHours).toBe(38);
    expect(result.overtimeHours).toBe(2);
    expect(overnight.segments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        startTime: '23:00',
        endTime: '00:00',
        day: 'Saturday',
        isOvertime: false,
      }),
      expect.objectContaining({
        startTime: '00:00',
        endTime: '02:00',
        day: 'Sunday',
        penaltyDescription: 'Sunday Overtime — First Tier (200%)',
        isOvertime: true,
      }),
    ]));
  });

  it('never lets estimated unpaid break minutes consume overtime capacity', () => {
    const result = weeklyPay([
      ['Monday', '09:00', '19:00'],
      ['Tuesday', '09:00', '19:00'],
      ['Wednesday', '09:00', '19:00'],
      ['Thursday', '09:00', '14:00'],
      ['Friday', '09:00', '15:00'],
    ]);
    const friday = result.dailyBreakdown[4];

    expect(result.totalHours).toBe(39);
    expect(result.ordinaryHours).toBe(38);
    expect(result.overtimeHours).toBe(1);
    expect(friday.segments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        startTime: '13:00 (estimated)',
        endTime: '13:30 (estimated)',
        penaltyDescription: 'Unpaid Break (estimated placement)',
        isUnpaidBreak: true,
        isOvertime: false,
      }),
      expect.objectContaining({
        startTime: '14:00',
        endTime: '15:00',
        penaltyDescription: 'Overtime — First Tier (150%)',
        isOvertime: true,
      }),
    ]));
  });

  it('keeps the overnight audit in shift order when an estimated break follows midnight', () => {
    const result = weeklyPay([['Saturday', '22:00', '06:00']]);

    expect(result.dailyBreakdown[0].segments.map(({ day, startTime, endTime }) =>
      [day, startTime, endTime]
    )).toEqual([
      ['Saturday', '22:00', '00:00'],
      ['Sunday', '00:00', '02:00'],
      ['Sunday', '02:00 (estimated)', '02:30 (estimated)'],
      ['Sunday', '02:30', '06:00'],
    ]);
  });

  it('rounds an exact half-cent Sunday segment up before summing the day', () => {
    const result = weeklyPay([['Sunday', '05:00', '19:15']]);

    expect(result.dailyBreakdown[0].segments[2].pay).toBe(566.09);
    expect(result.dailyBreakdown[0].pay).toBe(798.33);
    expect(result.total).toBe(798.33);
  });

  it('reconciles the Level 4 54.25-hour fixture across ordinary and overtime segments', () => {
    const result = weeklyPay([
      ['Monday', '09:00', '19:00'],
      ['Tuesday', '09:00', '18:00'],
      ['Wednesday', '09:00', '17:00'],
      ['Thursday', '09:00', '17:00'],
      ['Friday', '09:00', '17:30'],
      ['Saturday', '09:00', '17:00'],
      ['Sunday', '09:00', '15:15'],
    ]);

    expect(result.ordinaryHours).toBe(38);
    expect(result.overtimeHours).toBe(16.25);
    expect(result.dailyBreakdown[4].pay).toBe(290.3);
    expect(result.dailyBreakdown[5].pay).toBe(435.45);
    expect(result.dailyBreakdown[6].pay).toBe(333.85);
    expect(result.total).toBe(2017.61);
  });
});

describe('Award differentiation tests (penaltyConfig drives the engine)', () => {
  it('Sunday Retail (150%) produces LESS pay than Sunday Pharmacy (200%) for same base rate and shift', () => {
    // Both calls use the SAME base rate ($25.99) and SAME shift (Sun 09:00–13:00).
    // Only the penaltyConfig differs: Pharmacy sundayMultiplier=2.0, Retail sundayMultiplier=1.5.
    //   pharmacyPay = 25.99 * 2.0 * 4 = $207.92
    //   retailPay   = 25.99 * 1.5 * 4 = $155.94
    //   retailPay < pharmacyPay
    const pharmacyPay = calculatePayForTimePeriod(
      'Sunday', '09:00', '13:00', PHARMACY_FT_RATE, 'full-time', '', 'pharmacy-assistant-1',
      pharmacyConfig.penaltyConfig
    );
    const retailPay = calculatePayForTimePeriod(
      'Sunday', '09:00', '13:00', PHARMACY_FT_RATE, 'full-time', '', 'retail-employee-1',
      retailConfig.penaltyConfig
    );
    expect(retailPay.pay).toBeLessThan(pharmacyPay.pay);
    expect(pharmacyPay.pay).toBeCloseTo(207.92, 2);
    expect(retailPay.pay).toBeCloseTo(155.94, 2);
  });
});
