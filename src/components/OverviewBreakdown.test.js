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
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Calculated')).toBeInTheDocument();
    expect(screen.getByText('Actual Paid')).toBeInTheDocument();
    expect(screen.getByText('Discrepancy')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('status hint before input: shows "Enter actual paid" when actualPaidByDay entry is empty', () => {
    render(<OverviewBreakdown {...defaultProps} actualPaidByDay={['', '']} />);
    const hints = screen.getAllByText('Enter actual paid');
    expect(hints.length).toBeGreaterThanOrEqual(1);
  });

  test('status badge OK: shows "OK" when actualPaidByDay matches calculated pay exactly', () => {
    render(<OverviewBreakdown {...defaultProps} actualPaidByDay={['200.00', '']} />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  test('status badge OK tolerance: shows "OK" when discrepancy is $0.005 (within $0.01 tolerance)', () => {
    render(<OverviewBreakdown {...defaultProps} actualPaidByDay={['199.995', '']} />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  test('status badge underpaid: shows "Underpaid" when discrepancy is $1.00 (> $0.01)', () => {
    render(<OverviewBreakdown {...defaultProps} actualPaidByDay={['199.00', '']} />);
    expect(screen.getByText('Underpaid')).toBeInTheDocument();
  });

  test('actual paid input change: calls onActualPaidChange with correct index and value', () => {
    const onActualPaidChange = jest.fn();
    render(<OverviewBreakdown {...defaultProps} onActualPaidChange={onActualPaidChange} />);
    const inputs = screen.getAllByRole('spinbutton');
    // First spinbutton is the per-day input for index 0
    fireEvent.change(inputs[0], { target: { value: '195.50' } });
    expect(onActualPaidChange).toHaveBeenCalledWith(0, '195.50');
  });

  test('period total input: calls onTotalActualPaidChange when changed', () => {
    const onTotalActualPaidChange = jest.fn();
    render(<OverviewBreakdown {...defaultProps} onTotalActualPaidChange={onTotalActualPaidChange} />);
    // Find the total actual paid input by label context
    const inputs = screen.getAllByRole('spinbutton');
    const totalInput = inputs[inputs.length - 1];
    fireEvent.change(totalInput, { target: { value: '280.00' } });
    expect(onTotalActualPaidChange).toHaveBeenCalledWith('280.00');
  });

  test('period summary hidden when empty: not rendered when totalActualPaid is ""', () => {
    render(<OverviewBreakdown {...defaultProps} totalActualPaid="" />);
    expect(screen.queryByText(/Calculated:.*Paid:.*Difference:/)).not.toBeInTheDocument();
  });

  test('period summary format: renders correct format when totalActualPaid is populated', () => {
    render(<OverviewBreakdown {...defaultProps} totalActualPaid="326.67" results={{ ...mockResults, total: 350.00 }} />);
    expect(screen.getByText(/Calculated: \$350\.00 \| Paid: \$326\.67 \| Difference: \$-23\.33/)).toBeInTheDocument();
  });

  test('accordion expand: clicking a day row calls onDayToggle with that row index', () => {
    const onDayToggle = jest.fn();
    render(<OverviewBreakdown {...defaultProps} onDayToggle={onDayToggle} />);
    const mondayCell = screen.getByText('Monday');
    fireEvent.click(mondayCell.closest('tr'));
    expect(onDayToggle).toHaveBeenCalledWith(0);
  });

  test('accordion shows segment: when selectedDayIndex is 0, renders segment table with correct columns', () => {
    render(<OverviewBreakdown {...defaultProps} selectedDayIndex={0} />);
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Rate Type')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Ordinary Rate (100%)')).toBeInTheDocument();
  });

  test('accordion hidden for other rows: when selectedDayIndex is 0, segment for row 1 is not visible', () => {
    render(<OverviewBreakdown {...defaultProps} selectedDayIndex={0} />);
    // Tuesday's segment penaltyDescription should not be rendered in an accordion
    // The segment table only shows for the expanded (index 0) row
    // Tuesday has penaltyDescription 'Ordinary Rate (100%)' same as Monday
    // But only 1 segment table should exist (for Monday)
    const segmentTables = screen.getAllByRole('table');
    // Main table + 1 accordion segment table (not 2)
    expect(segmentTables.length).toBe(2);
  });
});
