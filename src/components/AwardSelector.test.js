import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AwardSelector from './AwardSelector';

const mockAwardMetadata = {
  'MA000012': { name: 'Pharmacy Industry Award' },
  'MA000003': { name: 'General Retail Industry Award' },
  'MA000009': { name: 'Hospitality Industry (General) Award' },
};

const defaultProps = {
  selectedAward: 'MA000012',
  onSelectAward: jest.fn(),
  awardMetadata: mockAwardMetadata,
  isLoading: false,
  error: null,
  lastUpdated: null,
  onRefresh: jest.fn(),
  successMessage: null,
};

describe('AwardSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders a select element with options for each key in awardMetadata', () => {
    render(<AwardSelector {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText(/Pharmacy Industry Award/)).toBeInTheDocument();
    expect(screen.getByText(/General Retail Industry Award/)).toBeInTheDocument();
    expect(screen.getByText(/Hospitality Industry \(General\) Award/)).toBeInTheDocument();
  });

  test('select element is disabled when isLoading is true', () => {
    render(<AwardSelector {...defaultProps} isLoading={true} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  test('calls onSelectAward with the selected awardId when user changes the dropdown', () => {
    const onSelectAward = jest.fn();
    render(<AwardSelector {...defaultProps} onSelectAward={onSelectAward} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'MA000003' } });
    expect(onSelectAward).toHaveBeenCalledWith('MA000003');
  });

  test('renders "Sync Live Rates" button', () => {
    render(<AwardSelector {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Sync Live Rates/i })).toBeInTheDocument();
  });

  test('"Sync Live Rates" button is disabled when isLoading is true', () => {
    render(<AwardSelector {...defaultProps} isLoading={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('button shows "Hydrating..." text when isLoading is true', () => {
    render(<AwardSelector {...defaultProps} isLoading={true} />);
    expect(screen.getByText(/Hydrating.../i)).toBeInTheDocument();
  });

  test('calls onRefresh when button is clicked and isLoading is false', () => {
    const onRefresh = jest.fn();
    render(<AwardSelector {...defaultProps} onRefresh={onRefresh} />);
    const button = screen.getByRole('button', { name: /Sync Live Rates/i });
    fireEvent.click(button);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test('does NOT render an error element even when error prop is a non-null string', () => {
    render(<AwardSelector {...defaultProps} error="Error" />);
    expect(screen.queryByText("Error")).not.toBeInTheDocument();
  });

  test('renders Verified timestamp text when lastUpdated is a valid Date', () => {
    const lastUpdated = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    render(<AwardSelector {...defaultProps} lastUpdated={lastUpdated} />);
    expect(screen.getByText(/Verified/i)).toBeInTheDocument();
  });

  test('does NOT render timestamp when lastUpdated is null', () => {
    render(<AwardSelector {...defaultProps} lastUpdated={null} />);
    expect(screen.queryByText(/Verified/i)).not.toBeInTheDocument();
  });

  test('renders successMessage when it is a non-null string', () => {
    render(<AwardSelector {...defaultProps} successMessage="Rates updated" />);
    expect(screen.getByText('Rates updated')).toBeInTheDocument();
  });

  test('successMessage renders with success text class when provided', () => {
    const { container } = render(<AwardSelector {...defaultProps} successMessage="Rates refreshed successfully" />);
    const successEl = container.querySelector('.text-success');
    expect(successEl).toBeInTheDocument();
    expect(successEl).toHaveTextContent('Rates refreshed successfully');
  });

  test('refresh button is disabled and shows "Hydrating..." text when isLoading is true', () => {
    render(<AwardSelector {...defaultProps} isLoading={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/Hydrating.../i);
  });
});
