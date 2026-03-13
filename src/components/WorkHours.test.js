// Wave 0 stubs for UX-03: Calculate button disabled during loading
// The WorkHours component currently has no isLoading prop.
// Plan 02 adds the prop; these tests verify the behavior.
// Uses test.todo() so they compile and pass without implementation.

import React from 'react';
import { render, screen } from '@testing-library/react';
import WorkHours from './WorkHours';

const defaultProps = {
  weeklyData: [],
  handleTimeChange: jest.fn(),
  handlePublicHolidayChange: jest.fn(),
  calculatePay: jest.fn(),
  isLoading: false,
};

describe('WorkHours — Calculate button disabled state', () => {
  test.todo('Calculate Pay button is enabled when isLoading is false');
  test.todo('Calculate Pay button is disabled when isLoading is true');
  test.todo('Calculate Pay button shows "Calculating..." text when isLoading is true (optional — or stays "Calculate Pay")');
});
