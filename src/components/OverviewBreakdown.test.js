import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OverviewBreakdown from './OverviewBreakdown';

const mockResults = {
  baseRate: 25.00,
  totalHours: 12.00,
  totalPay: 300.00,
  overtimeHours: 0,
  overtimePay: 0,
  allowances: 0,
  total: 300.00,
  dailyBreakdown: [
    {
      day: 'Monday',
      startTime: '09:00',
      endTime: '17:00',
      hours: 8.00,
      pay: 200.00,
      segments: [
        {
          startTime: '09:00',
          endTime: '17:00',
          day: 'Monday',
          hours: 8.00,
          rate: 25.00,
          penaltyMultiplier: 1,
          penaltyDescription: 'Ordinary Rate (100%)',
          pay: 200.00,
        },
      ],
    },
    {
      day: 'Tuesday',
      startTime: '09:00',
      endTime: '13:00',
      hours: 4.00,
      pay: 100.00,
      segments: [
        {
          startTime: '09:00',
          endTime: '13:00',
          day: 'Tuesday',
          hours: 4.00,
          rate: 25.00,
          penaltyMultiplier: 1,
          penaltyDescription: 'Ordinary Rate (100%)',
          pay: 100.00,
        },
      ],
    },
  ],
  allowanceBreakdown: [],
};

const defaultProps = {
  results: mockResults,
  selectedDayIndex: null,
  onDayToggle: jest.fn(),
  actualPaidByDay: ['', ''],
  onActualPaidChange: jest.fn(),
  totalActualPaid: '',
  onTotalActualPaidChange: jest.fn(),
  cycleLength: 7,
};

describe('OverviewBreakdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders week table with correct column headers', () => {
    render(<OverviewBreakdown {...defaultProps} />);
    expect(screen.getByRole('columnheader', { name: /^Day$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Audit Hours/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Calculated Pay/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Your Payslip$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Variance/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Status/i })).toBeInTheDocument();
  });

  test('status hint before input: shows "Pending Input" when actualPaidByDay entry is empty', () => {
    render(<OverviewBreakdown {...defaultProps} actualPaidByDay={['', '']} />);
    const hints = screen.getAllByText(/Pending Input/i);
    expect(hints.length).toBeGreaterThanOrEqual(1);
  });

  test('status badge OK: shows "Verified OK" when actualPaidByDay matches calculated pay exactly', () => {
    render(<OverviewBreakdown {...defaultProps} actualPaidByDay={['200.00', '']} />);
    expect(screen.getByText(/Verified OK/i)).toBeInTheDocument();
  });

  test('status badge OK tolerance: shows "Verified OK" when discrepancy is $0.005 (within $0.01 tolerance)', () => {
    render(<OverviewBreakdown {...defaultProps} actualPaidByDay={['199.995', '']} />);
    expect(screen.getByText(/Verified OK/i)).toBeInTheDocument();
  });

  test('status badge underpaid: shows "Underpaid" when discrepancy is $1.00 (> $0.01)', () => {
    render(<OverviewBreakdown {...defaultProps} actualPaidByDay={['199.00', '']} />);
    expect(screen.getByText(/Underpaid/i)).toBeInTheDocument();
  });

  test('actual paid input change: calls onActualPaidChange with correct index and value', () => {
    const onActualPaidChange = jest.fn();
    render(<OverviewBreakdown {...defaultProps} onActualPaidChange={onActualPaidChange} />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '195.50' } });
    expect(onActualPaidChange).toHaveBeenCalledWith(0, '195.50');
  });

  test('period total input: calls onTotalActualPaidChange when changed', () => {
    const onTotalActualPaidChange = jest.fn();
    render(<OverviewBreakdown {...defaultProps} onTotalActualPaidChange={onTotalActualPaidChange} />);
    const inputs = screen.getAllByRole('spinbutton');
    const totalInput = inputs[inputs.length - 1];
    fireEvent.change(totalInput, { target: { value: '280.00' } });
    expect(onTotalActualPaidChange).toHaveBeenCalledWith('280.00');
  });

  test('period summary hidden when empty: not rendered when totalActualPaid is "" and no per-day amounts', () => {
    render(<OverviewBreakdown {...defaultProps} actualPaidByDay={['', '']} totalActualPaid="" />);
    expect(screen.queryByText(/Final Audit Result/i)).not.toBeInTheDocument();
  });

  test('accordion expand: clicking a day row calls onDayToggle with that row index', () => {
    const onDayToggle = jest.fn();
    render(<OverviewBreakdown {...defaultProps} onDayToggle={onDayToggle} />);
    const mondayCell = screen.getByText(/Monday/i);
    fireEvent.click(mondayCell.closest('tr'));
    expect(onDayToggle).toHaveBeenCalledWith(0);
  });

  test('accordion shows segment: when selectedDayIndex is 0, renders segment table with correct columns', () => {
    render(<OverviewBreakdown {...defaultProps} selectedDayIndex={0} />);
    expect(screen.getByText(/Shift Segment/i)).toBeInTheDocument();
    expect(screen.getByText(/Rate Applied/i)).toBeInTheDocument();
    expect(screen.getByText(/Segment Total/i)).toBeInTheDocument();
    expect(screen.getByText(/Ordinary Rate \(100%\)/i)).toBeInTheDocument();
  });

  test('weekly summary shown: appears when at least one actualPaidByDay entry is a valid number', () => {
    render(<OverviewBreakdown {...defaultProps} actualPaidByDay={['200.00', '']} totalActualPaid="200.00" />);
    expect(screen.getByText(/Final Audit Result/i)).toBeInTheDocument();
  });

  test('weekly summary OK badge: shows "Perfect Match" badge when totalActualPaid matches results.total', () => {
    render(<OverviewBreakdown
      {...defaultProps}
      actualPaidByDay={['200.00', '100.00']}
      totalActualPaid="300.00"
      results={{ ...mockResults, total: 300.00 }}
    />);
    expect(screen.getByText(/Final Audit Result/i)).toBeInTheDocument();
    const okBadges = screen.getAllByText(/Perfect Match/i);
    expect(okBadges.length).toBeGreaterThanOrEqual(1);
  });

  test('weekly summary Underpaid badge: shows "Underpaid" badge when results.total > totalActualPaid', () => {
    render(<OverviewBreakdown
      {...defaultProps}
      actualPaidByDay={['190.00', '']}
      totalActualPaid="190.00"
      results={{ ...mockResults, total: 300.00 }}
    />);
    expect(screen.getByText(/Final Audit Result/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Underpaid/i).length).toBeGreaterThanOrEqual(1);
  });
});
