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
  test('Calculate Pay button is enabled when isLoading is false', () => {
    render(<WorkHours {...defaultProps} isLoading={false} />);
    const button = screen.getByRole('button', { name: /calculate pay/i });
    expect(button).not.toBeDisabled();
  });

  test('Calculate Pay button is disabled when isLoading is true', () => {
    render(<WorkHours {...defaultProps} isLoading={true} />);
    const button = screen.getByRole('button', { name: /calculate pay/i });
    expect(button).toBeDisabled();
  });
});
