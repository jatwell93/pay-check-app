import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
  MA000003: { rates: [] },
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
      expect(fetchAwardRates).toHaveBeenCalledWith(['MA000012', 'MA000003', 'MA000009']);
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

    expect(screen.getByText('Pharmacy Industry Award')).toBeInTheDocument();
    expect(screen.getByText('General Retail Industry Award')).toBeInTheDocument();
    expect(screen.getByText('Hospitality Industry (General) Award')).toBeInTheDocument();
  });
});
