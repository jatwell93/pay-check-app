/**
 * Regression: juniorPercentages keys must match sharedAgeOptions ids.
 * App.js resolves junior rates via juniorPercentages[age] — 'age-16'-style
 * keys silently returned undefined → ?? 1, so ages 16–20 were paid 100%.
 */
import awardConfig, { sharedAgeOptions } from '../config/awardConfig';

const juniorAges = sharedAgeOptions.map(o => o.id).filter(id => id !== 'adult');

describe.each(Object.keys(awardConfig))('junior rate lookup — %s', (awardId) => {
  const { juniorPercentages } = awardConfig[awardId];

  it.each(juniorAges)('age option "%s" resolves to a junior percentage', (ageId) => {
    expect(juniorPercentages[ageId]).toBeDefined();
    expect(juniorPercentages[ageId]).toBeGreaterThan(0);
    expect(juniorPercentages[ageId]).toBeLessThan(1);
  });
});
