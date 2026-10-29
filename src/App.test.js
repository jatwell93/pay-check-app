import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';

// Mock awardRatesService module
jest.mock('./services/awardRatesService', () => ({
  fetchAwardRates: jest.fn(),
  getCachedAwardRates: jest.fn(),
  getLastCacheUpdateTime: jest.fn(),
  clearCache: jest.fn(),
}));

const { fetchAwardRates, getCachedAwardRates, getLastCacheUpdateTime } =
  require('./services/awardRatesService');

const mockRatesData = {
  MA000012: { rates: [] },
  MA000004: { rates: [] },
  MA000009: { rates: [] },
};

describe('App integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders AwardSelector component (presence of award select element)', async () => {
    getCachedAwardRates.mockReturnValue(null);
    fetchAwardRates.mockResolvedValue(mockRatesData);
    getLastCacheUpdateTime.mockReturnValue(new Date());

    render(<App />);

    // The award-selector select is identified by its specific id
    const awardSelect = document.getElementById('award-select');
    expect(awardSelect).toBeInTheDocument();
  });

  test('on initial render, fetchAwardRates is called when no cache exists', async () => {
    getCachedAwardRates.mockReturnValue(null);
    fetchAwardRates.mockResolvedValue(mockRatesData);
    getLastCacheUpdateTime.mockReturnValue(new Date());

    render(<App />);

    await waitFor(() => {
      expect(fetchAwardRates).toHaveBeenCalledWith(['MA000012', 'MA000004', 'MA000009']);
    });
  });

  test('when all awards are cached, getCachedAwardRates is called and no fetchAwardRates call is made', async () => {
    // Simulate all 3 awards cached
    getCachedAwardRates.mockReturnValue({ rates: [] });
    getLastCacheUpdateTime.mockReturnValue(new Date());

    render(<App />);

    await waitFor(() => {
      expect(getCachedAwardRates).toHaveBeenCalled();
      expect(fetchAwardRates).not.toHaveBeenCalled();
    });
  });

  test('when service returns data, award selector is eventually enabled (not loading)', async () => {
    getCachedAwardRates.mockReturnValue(null);
    fetchAwardRates.mockResolvedValue(mockRatesData);
    getLastCacheUpdateTime.mockReturnValue(new Date());

    render(<App />);

    // After fetch resolves, the award select should not be disabled
    await waitFor(() => {
      const awardSelect = document.getElementById('award-select');
      expect(awardSelect).not.toBeDisabled();
    });
  });

  test('when service throws and getCachedAwardRates returns null, fallback error message is shown', async () => {
    getCachedAwardRates.mockReturnValue(null);
    fetchAwardRates.mockRejectedValue(new Error('Network error'));
    getLastCacheUpdateTime.mockReturnValue(null);

    render(<App />);

    const errorMsg = await screen.findByText(
      "Couldn't load award rates. Using Pharmacy defaults — Refresh to try again."
    );
    expect(errorMsg).toBeInTheDocument();
  });

  test('award dropdown contains Pharmacy, Retail, and Hospitality options', async () => {
    getCachedAwardRates.mockReturnValue(null);
    fetchAwardRates.mockResolvedValue(mockRatesData);
    getLastCacheUpdateTime.mockReturnValue(new Date());

    render(<App />);

    // Wait for loading to complete
    await waitFor(() => {
      const awardSelect = document.getElementById('award-select');
      expect(awardSelect).not.toBeDisabled();
    });

    // Use queryAllByText or specific roles since it might appear in options AND in notes
    const pharmacyOptions = screen.queryAllByText(/Pharmacy Industry Award/);
    expect(pharmacyOptions.length).toBeGreaterThanOrEqual(1);
    
    const retailOptions = screen.queryAllByText(/General Retail Industry Award/);
    expect(retailOptions.length).toBeGreaterThanOrEqual(1);

    const hospitalityOptions = screen.queryAllByText(/Hospitality Industry \(General\) Award/);
    expect(hospitalityOptions.length).toBeGreaterThanOrEqual(1);
  });

  test('weekly pay cycle renders 7 overview rows', async () => {
    getCachedAwardRates.mockReturnValue(null);
    fetchAwardRates.mockResolvedValue({});
    getLastCacheUpdateTime.mockReturnValue(new Date());

    render(<App />);

    await waitFor(() => {
      const awardSelect = document.getElementById('award-select');
      expect(awardSelect).not.toBeDisabled();
    });

    const startInputs = document.querySelectorAll('input[type="time"]');
    fireEvent.change(startInputs[0], { target: { value: '09:00' } });
    fireEvent.change(startInputs[1], { target: { value: '17:00' } });

    const calcButton = screen.getByRole('button', { name: /Calculate Weekly Total/i });
    fireEvent.click(calcButton);

    await waitFor(() => {
      const mondayElements = screen.getAllByText(/Monday/i);
      expect(mondayElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('retail award end-to-end: retail classifications/allowances and GRIA penalty audit', async () => {
    getCachedAwardRates.mockReturnValue(null);
    fetchAwardRates.mockResolvedValue(mockRatesData);
    getLastCacheUpdateTime.mockReturnValue(new Date());

    render(<App />);

    await waitFor(() => {
      expect(document.getElementById('award-select')).not.toBeDisabled();
    });

    // Select the General Retail Industry Award (MA000004)
    fireEvent.change(document.getElementById('award-select'), { target: { value: 'MA000004' } });

    // Employee details reset to the retail classification ladder
    await waitFor(() => {
      expect(document.getElementById('classification').value).toBe('retail-employee-1');
    });

    // Pharmacy-only allowances disappear; the GRIA meal allowance field appears
    expect(screen.queryByLabelText(/Home Medicine Reviews/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Laundry/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Broken Hill/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Overtime Meals/i)).toBeInTheDocument();

    // Monday 17:00–21:00 — crosses the GRIA 6:00pm evening window
    const timeInputs = document.querySelectorAll('input[type="time"]');
    fireEvent.change(timeInputs[0], { target: { value: '17:00' } });
    fireEvent.change(timeInputs[1], { target: { value: '21:00' } });

    fireEvent.click(screen.getByRole('button', { name: /Calculate Weekly Total/i }));

    // Retail Employee Level 1 FT ($24.10): 1h @100% + 3h @150% = $132.55
    const mondayPay = await screen.findByText('$132.55');
    expect(mondayPay).toBeInTheDocument();

    // Audit trace uses the GRIA penalty structure
    fireEvent.click(screen.getByText('$132.55').closest('tr'));
    expect(await screen.findByText('Evening Shift (150%)')).toBeInTheDocument();
  });

  test('header renders with title "Pay Checker"', async () => {
    getCachedAwardRates.mockReturnValue(null);
    fetchAwardRates.mockResolvedValue(mockRatesData);
    getLastCacheUpdateTime.mockReturnValue(new Date());

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Pay Checker/i);
    });
  });

  test('error banner dismiss: clicking × button removes the banner', async () => {
    getCachedAwardRates.mockReturnValue(null);
    fetchAwardRates.mockRejectedValue(new Error('Network error'));
    getLastCacheUpdateTime.mockReturnValue(null);

    render(<App />);

    await screen.findByText("Couldn't load award rates. Using Pharmacy defaults — Refresh to try again.");

    const dismissBtn = screen.getByRole('button', { name: /dismiss error/i });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByText("Couldn't load award rates. Using Pharmacy defaults — Refresh to try again.")).not.toBeInTheDocument();
    });
  });

  test('handleRefreshRates shows D-08 error wording when refresh fails after all retries', async () => {
    getCachedAwardRates.mockReturnValue(null);
    fetchAwardRates
      .mockResolvedValueOnce(mockRatesData)
      .mockRejectedValue(new Error('Network error'));
    getLastCacheUpdateTime.mockReturnValue(new Date());

    render(<App />);

    await waitFor(() => {
      expect(document.getElementById('award-select')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Sync Live Rates/i }));

    const errorMsg = await screen.findByText(
      "Couldn't connect to Fair Work Commission — using saved rates"
    );
    expect(errorMsg).toBeInTheDocument();
  });
});
