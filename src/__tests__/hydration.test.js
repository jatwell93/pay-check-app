// Tests that the calculatePay shape is satisfied by awardConfig.js as fallback
// (since FWC API shape is unknown, real hydration tests added when API confirmed)
import { getAwardConfig } from '../config/awardConfig';

describe('hydrateAwardRates — awardConfig shape contract', () => {
  const AWARD_IDS = ['MA000012', 'MA000003', 'MA000009'];

  test.each(AWARD_IDS)('getAwardConfig("%s") has all required penaltyConfig fields', (awardId) => {
    const config = getAwardConfig(awardId);
    const { penaltyConfig } = config;
    expect(penaltyConfig).toHaveProperty('earlyMorningThreshold');
    expect(penaltyConfig).toHaveProperty('eveningThreshold');
    expect(penaltyConfig).toHaveProperty('earlyMorningMultiplier');
    expect(penaltyConfig).toHaveProperty('eveningMultiplier');
    expect(penaltyConfig).toHaveProperty('casualLoadingMultiplier');
    expect(penaltyConfig).toHaveProperty('saturdayMultiplier');
    expect(penaltyConfig).toHaveProperty('sundayMultiplier');
    expect(penaltyConfig).toHaveProperty('phMultiplier');
    expect(penaltyConfig).toHaveProperty('overtimeThresholdHours');
    expect(penaltyConfig).toHaveProperty('overtimeFirstTierMultiplier');
    expect(penaltyConfig).toHaveProperty('overtimeSecondTierMultiplier');
  });

  test.each(AWARD_IDS)('getAwardConfig("%s") has baseRates with fullTimePartTime and casual keys', (awardId) => {
    const config = getAwardConfig(awardId);
    expect(config.baseRates).toHaveProperty('fullTimePartTime');
    expect(config.baseRates).toHaveProperty('casual');
    expect(Object.keys(config.baseRates.fullTimePartTime).length).toBeGreaterThan(0);
  });

  test.each(AWARD_IDS)('getAwardConfig("%s") has non-empty classifications array', (awardId) => {
    const config = getAwardConfig(awardId);
    expect(Array.isArray(config.classifications)).toBe(true);
    expect(config.classifications.length).toBeGreaterThan(0);
    expect(config.classifications[0]).toHaveProperty('id');
    expect(config.classifications[0]).toHaveProperty('name');
  });
});
