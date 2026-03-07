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

  test('renders error string when error prop is a non-null string', () => {
    render(<AwardSelector {...defaultProps} error="Couldn't load award rates. Using Pharmacy defaults — Refresh to try again." />);
    expect(screen.getByText("Couldn't load award rates. Using Pharmacy defaults — Refresh to try again.")).toBeInTheDocument();
    const errorDiv = document.querySelector('.award-selector__error');
    expect(errorDiv).toBeInTheDocument();
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
    const successDiv = document.querySelector('.award-selector__success');
    expect(successDiv).toBeInTheDocument();
  });

  test('does NOT render success element when successMessage is null', () => {
    render(<AwardSelector {...defaultProps} successMessage={null} />);
    const successDiv = document.querySelector('.award-selector__success');
    expect(successDiv).not.toBeInTheDocument();
  });
});
