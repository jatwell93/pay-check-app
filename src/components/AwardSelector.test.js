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
    expect(screen.getByText('Pharmacy Industry Award')).toBeInTheDocument();
    expect(screen.getByText('General Retail Industry Award')).toBeInTheDocument();
    expect(screen.getByText('Hospitality Industry (General) Award')).toBeInTheDocument();
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

  test('renders "Refresh Rates" button', () => {
    render(<AwardSelector {...defaultProps} />);
    expect(screen.getByRole('button', { name: /refresh rates/i })).toBeInTheDocument();
  });

  test('"Refresh Rates" button is disabled when isLoading is true', () => {
    render(<AwardSelector {...defaultProps} isLoading={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('button shows "Refreshing..." text when isLoading is true', () => {
    render(<AwardSelector {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  test('calls onRefresh when button is clicked and isLoading is false', () => {
    const onRefresh = jest.fn();
    render(<AwardSelector {...defaultProps} onRefresh={onRefresh} />);
    const button = screen.getByRole('button', { name: /refresh rates/i });
    fireEvent.click(button);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  // D-09: error is passed as prop for API compatibility but AwardSelector does NOT render its own error element.
  // Error display is handled by the App.js error banner.
  test('does NOT render an error element even when error prop is a non-null string', () => {
    render(<AwardSelector {...defaultProps} error="Couldn't load award rates. Using Pharmacy defaults — Refresh to try again." />);
    // The error text should NOT appear in AwardSelector (it is shown in the App.js banner instead)
    expect(screen.queryByText("Couldn't load award rates. Using Pharmacy defaults — Refresh to try again.")).not.toBeInTheDocument();
    const errorDiv = document.querySelector('.award-selector__error');
    expect(errorDiv).not.toBeInTheDocument();
  });

  test('does NOT render error element when error is null', () => {
    render(<AwardSelector {...defaultProps} error={null} />);
    const errorDiv = document.querySelector('.award-selector__error');
    expect(errorDiv).not.toBeInTheDocument();
  });

  test('renders lastUpdated timestamp text when lastUpdated is a valid Date', () => {
    const lastUpdated = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    render(<AwardSelector {...defaultProps} lastUpdated={lastUpdated} />);
    expect(screen.getByText(/rates last updated/i)).toBeInTheDocument();
  });

  test('does NOT render timestamp when lastUpdated is null', () => {
    render(<AwardSelector {...defaultProps} lastUpdated={null} />);
    expect(screen.queryByText(/rates last updated/i)).not.toBeInTheDocument();
  });

  test('renders successMessage when it is a non-null string', () => {
    render(<AwardSelector {...defaultProps} successMessage="Rates updated" />);
    expect(screen.getByText('Rates updated')).toBeInTheDocument();
  });

  test('does NOT render success element when successMessage is null', () => {
    render(<AwardSelector {...defaultProps} successMessage={null} />);
    expect(screen.queryByText(/rates updated/i)).not.toBeInTheDocument();
  });

  // NEW: successMessage renders with green text styling
  test('successMessage renders with green text class when provided', () => {
    const { container } = render(<AwardSelector {...defaultProps} successMessage="Rates refreshed successfully" />);
    const successEl = container.querySelector('.text-green-600');
    expect(successEl).toBeInTheDocument();
    expect(successEl).toHaveTextContent('Rates refreshed successfully');
  });

  // NEW: refresh button is disabled and shows "Refreshing..." when isLoading is true (combined)
  test('refresh button is disabled and shows "Refreshing..." text when isLoading is true', () => {
    render(<AwardSelector {...defaultProps} isLoading={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Refreshing...');
  });
});
