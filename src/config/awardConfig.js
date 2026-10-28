/**
 * awardConfig.js — Single source of truth for all award configurations.
 *
 * Keyed by FWC award ID (MA000012, MA000004, MA000009).
 * Each entry contains: penaltyConfig, classifications, ageOptions,
 * juniorClassificationIds, baseRates, juniorPercentages, allowances.
 *
 * MA000012 base rates are byte-for-byte identical to pharmacyAwardRates in App.js.
 * MA000004 (General Retail Industry Award) holds the full GRIA dataset effective
 * 1 July 2024 — see docs/award-assumptions.md for the provenance of every value.
 * MA000009 contains realistic stub values (will be replaced by API data in v2).
 *
 * Do NOT import from helpers.js or App.js — this file is self-contained.
 */

export const sharedAgeOptions = [
  { id: 'adult', name: 'Adult (21 years and over)' },
  { id: 'under-16', name: 'Under 16 years' },
  { id: '16', name: '16 years' },
  { id: '17', name: '17 years' },
  { id: '18', name: '18 years' },
  { id: '19', name: '19 years' },
  { id: '20', name: '20 years' },
];

const awardConfig = {
  MA000012: {
    awardId: 'MA000012',
    name: 'Pharmacy Industry Award',
    penaltyConfig: {
      earlyMorningThreshold: 420,          // 07:00 in minutes from midnight
      eveningThreshold: 1140,              // 19:00 in minutes from midnight
      earlyMorningMultiplier: 1.25,
      eveningMultiplier: 1.25,
      casualLoadingMultiplier: 1.25,
      saturdayMultiplier: 1.5,
      sundayMultiplier: 2.0,
      phMultiplier: 2.0,
      overtimeThresholdHours: 38,
      overtimeFirstTierMultiplier: 1.5,
      overtimeSecondTierMultiplier: 2.0,
    },
    classifications: [
      { id: 'pharmacy-assistant-1', name: 'Pharmacy Assistant Level 1' },
      { id: 'pharmacy-assistant-2', name: 'Pharmacy Assistant Level 2' },
      { id: 'pharmacy-assistant-3', name: 'Pharmacy Assistant Level 3' },
      { id: 'pharmacy-assistant-4', name: 'Pharmacy Assistant Level 4' },
      { id: 'pharmacy-technician-1', name: 'Pharmacy Technician Level 1' },
      { id: 'pharmacy-technician-2', name: 'Pharmacy Technician Level 2' },
      { id: 'pharmacy-technician-3', name: 'Pharmacy Technician Level 3' },
      { id: 'pharmacy-technician-4', name: 'Pharmacy Technician Level 4' },
      { id: 'pharmacy-student-1', name: 'Pharmacy Student - 1st year of course' },
      { id: 'pharmacy-student-2', name: 'Pharmacy Student - 2nd year of course' },
      { id: 'pharmacy-student-3', name: 'Pharmacy Student - 3rd year of course' },
      { id: 'pharmacy-student-4', name: 'Pharmacy Student - 4th year of course' },
      { id: 'pharmacy-intern-1', name: 'Pharmacy Intern - 1st half of training' },
      { id: 'pharmacy-intern-2', name: 'Pharmacy Intern - 2nd half of training' },
      { id: 'pharmacist', name: 'Pharmacist' },
      { id: 'experienced-pharmacist', name: 'Experienced Pharmacist' },
      { id: 'pharmacist-in-charge', name: 'Pharmacist in Charge' },
      { id: 'pharmacist-manager', name: 'Pharmacist Manager' },
      { id: 'above-award', name: 'Above Award' },
    ],
    ageOptions: sharedAgeOptions,
    juniorClassificationIds: ['pharmacy-assistant-1', 'pharmacy-assistant-2'],
    baseRates: {
      fullTimePartTime: {
        'pharmacy-assistant-1': { base: 25.99 },
        'pharmacy-assistant-2': { base: 26.87 },
        'pharmacy-assistant-3': { base: 27.94 },
        'pharmacy-assistant-4': { base: 29.03 },
        'pharmacy-technician-1': { base: 30.21 },
        'pharmacy-technician-2': { base: 31.15 },
        'pharmacy-technician-3': { base: 32.36 },
        'pharmacy-technician-4': { base: 33.15 },
        'pharmacy-student-1': { base: 25.99 },
        'pharmacy-student-2': { base: 25.99 },
        'pharmacy-student-3': { base: 25.99 },
        'pharmacy-student-4': { base: 25.99 },
        'pharmacy-intern-1': { base: 28.66 },
        'pharmacy-intern-2': { base: 29.63 },
        'pharmacist': { base: 35.20 },
        'experienced-pharmacist': { base: 38.56 },
        'pharmacist-in-charge': { base: 39.46 },
        'pharmacist-manager': { base: 43.97 },
      },
      casual: {
        'pharmacy-assistant-1': { base: 32.49 },
        'pharmacy-assistant-2': { base: 33.59 },
        'pharmacy-assistant-3': { base: 34.93 },
        'pharmacy-assistant-4': { base: 36.29 },
        'pharmacy-technician-1': { base: 37.76 },
        'pharmacy-technician-2': { base: 38.94 },
        'pharmacy-technician-3': { base: 40.45 },
        'pharmacy-technician-4': { base: 41.44 },
        'pharmacy-student-1': { base: 32.49 },
        'pharmacy-student-2': { base: 32.49 },
        'pharmacy-student-3': { base: 32.49 },
        'pharmacy-student-4': { base: 32.49 },
        'pharmacy-intern-1': { base: 35.83 },
        'pharmacy-intern-2': { base: 37.04 },
        'pharmacist': { base: 44.00 },
        'experienced-pharmacist': { base: 48.20 },
        'pharmacist-in-charge': { base: 49.33 },
        'pharmacist-manager': { base: 54.96 },
      },
    },
    juniorPercentages: {
      'under-16': 0.45,
      'age-16': 0.5,
      'age-17': 0.6,
      'age-18': 0.7,
      'age-19': 0.8,
      'age-20': 0.9,
    },
    allowances: {
      homeMedicineReview: 17.96,
      laundryFullTime: 17.15,
      laundryPartTimeCasual: 3.43,
      brokenHill: 47.80,
      motorVehiclePerKm: 0.99,
      mealAllowanceOvertime: 19.62,
      mealAllowanceOvertimeExtra: 16.78,
    },
  },

  MA000004: {
    awardId: 'MA000004',
    name: 'General Retail Industry Award',
    penaltyConfig: {
      // GRIA penalty structure effective 1 July 2024 (see docs/award-assumptions.md).
      // Ordinary span Monday–Friday is 7:00am–6:00pm; work outside the span is
      // paid at overtime rates (150%) — before 7:00am and after 6:00pm.
      earlyMorningThreshold: 420,          // 07:00 in minutes from midnight
      eveningThreshold: 1080,              // 18:00 in minutes from midnight
      earlyMorningMultiplier: 1.5,
      eveningMultiplier: 1.5,
      casualLoadingMultiplier: 1.0,        // casual baseRates below already include the 25% GRIA casual loading
      saturdayMultiplier: 1.5,
      sundayMultiplier: 1.5,
      phMultiplier: 2.5,
      // Casual day/evening penalties are multiples of the (loaded) casual base
      // rate, sized to land on the GRIA loading-inclusive totals: Saturday 175%,
      // Sunday 200%, public holiday 250%, evening/early-morning 150%.
      casualSaturdayMultiplier: 1.4,
      casualSundayMultiplier: 1.6,
      casualPublicHolidayMultiplier: 2.0,
      casualEveningMultiplier: 1.2,
      casualEarlyMorningMultiplier: 1.2,
      // Overtime: 150% for the first 3 hours, 200% thereafter (Mon–Sat).
      overtimeThresholdHours: 38,
      overtimeFirstTierHours: 3,
      overtimeFirstTierMultiplier: 1.5,
      overtimeSecondTierMultiplier: 2.0,
      overtimeAppliesToCasuals: true,
    },
    classifications: [
      { id: 'retail-employee-1', name: 'Retail Employee Level 1' },
      { id: 'retail-employee-2', name: 'Retail Employee Level 2' },
      { id: 'retail-employee-3', name: 'Retail Employee Level 3' },
      { id: 'retail-employee-4', name: 'Retail Employee Level 4' },
      { id: 'retail-employee-5', name: 'Retail Employee Level 5' },
      { id: 'retail-employee-6', name: 'Retail Employee Level 6' },
      { id: 'above-award', name: 'Above Award' },
    ],
    ageOptions: sharedAgeOptions,
    juniorClassificationIds: ['retail-employee-1', 'retail-employee-2'],
    baseRates: {
      fullTimePartTime: {
        'retail-employee-1': { base: 24.10 },
        'retail-employee-2': { base: 24.53 },
        'retail-employee-3': { base: 24.97 },
        'retail-employee-4': { base: 25.83 },
        'retail-employee-5': { base: 26.70 },
        'retail-employee-6': { base: 29.08 },
      },
      casual: {
        'retail-employee-1': { base: 30.13 },
        'retail-employee-2': { base: 30.66 },
        'retail-employee-3': { base: 31.21 },
        'retail-employee-4': { base: 32.29 },
        'retail-employee-5': { base: 33.38 },
        'retail-employee-6': { base: 36.35 },
      },
    },
    // Keys match the age-option ids ('16', '17', ...) so the App junior-rate
    // lookup resolves directly.
    juniorPercentages: {
      'under-16': 0.45,
      '16': 0.5,
      '17': 0.6,
      '18': 0.7,
      '19': 0.8,
      '20': 0.9,
    },
    allowances: {
      mealAllowanceOvertime: 16.65,
      motorVehiclePerKm: 0.99,
    },
  },

  MA000009: {
    awardId: 'MA000009',
    name: 'Hospitality Industry (General) Award',
    penaltyConfig: {
      earlyMorningThreshold: 420,          // 07:00 in minutes from midnight
      eveningThreshold: 1260,              // 21:00 in minutes from midnight
      earlyMorningMultiplier: 1.25,
      eveningMultiplier: 1.15,
      casualLoadingMultiplier: 1.25,
      saturdayMultiplier: 1.25,
      sundayMultiplier: 2.25,
      phMultiplier: 2.25,
      overtimeThresholdHours: 38,
      overtimeFirstTierMultiplier: 1.5,
      overtimeSecondTierMultiplier: 2.0,
    },
    classifications: [
      { id: 'hospitality-employee-1', name: 'Hospitality Employee Level 1' },
      { id: 'hospitality-employee-2', name: 'Hospitality Employee Level 2' },
      { id: 'hospitality-employee-3', name: 'Hospitality Employee Level 3' },
      { id: 'hospitality-employee-4', name: 'Hospitality Employee Level 4' },
      { id: 'hospitality-employee-5', name: 'Hospitality Employee Level 5' },
      { id: 'above-award', name: 'Above Award' },
    ],
    ageOptions: sharedAgeOptions,
    juniorClassificationIds: ['hospitality-employee-1', 'hospitality-employee-2'],
    baseRates: {
      fullTimePartTime: {
        'hospitality-employee-1': { base: 23.13 },
        'hospitality-employee-2': { base: 24.01 },
        'hospitality-employee-3': { base: 25.38 },
        'hospitality-employee-4': { base: 26.71 },
        'hospitality-employee-5': { base: 28.04 },
      },
      casual: {
        'hospitality-employee-1': { base: 28.91 },
        'hospitality-employee-2': { base: 30.01 },
        'hospitality-employee-3': { base: 31.73 },
        'hospitality-employee-4': { base: 33.39 },
        'hospitality-employee-5': { base: 35.05 },
      },
    },
    juniorPercentages: {
      'under-16': 0.45,
      'age-16': 0.5,
      'age-17': 0.6,
      'age-18': 0.7,
      'age-19': 0.8,
      'age-20': 0.9,
    },
    allowances: {
      mealAllowanceOvertime: 14.99,
      motorVehiclePerKm: 0.99,
    },
  },
};

/**
 * Get award config by FWC award ID.
 * @param {string} awardId - The FWC award ID (e.g., 'MA000012')
 * @returns {object} The award configuration object
 * @throws {Error} If the award ID is not found
 */
export const getAwardConfig = (awardId) => {
  const config = awardConfig[awardId];
  if (!config) {
    throw new Error(`Award config not found for awardId: ${awardId}. Available: ${Object.keys(awardConfig).join(', ')}`);
  }
  return config;
};

export default awardConfig;
