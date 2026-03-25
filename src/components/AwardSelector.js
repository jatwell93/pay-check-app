import React from 'react';
import { formatDistanceToNow } from 'date-fns';

/**
 * AwardSelector — pure presentational component.
 * No internal state, no API calls.
 * All behavior is controlled via props.
 *
 * Note: the `error` prop is accepted for API compatibility but is NOT rendered here.
 * Error display is handled by the App.js error banner (D-09).
 */
function AwardSelector({
  selectedAward,
  onSelectAward,
  awardMetadata,
  isLoading,
  error, // eslint-disable-line no-unused-vars
  lastUpdated,
  onRefresh,
  successMessage,
}) {
  return (
    <div className="mb-6 bg-surface-header border border-edge rounded-md px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="award-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Award:
        </label>
        <select
          id="award-select"
          value={selectedAward}
          onChange={(e) => onSelectAward(e.target.value)}
          disabled={isLoading}
          className="flex-1 min-w-0 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand text-gray-700 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {Object.entries(awardMetadata).map(([awardId, meta]) => (
            <option key={awardId} value={awardId}>
              {meta.name}
            </option>
          ))}
        </select>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand-dark disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Rates'}
        </button>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-500 mt-2">
          Rates last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </p>
      )}

      {successMessage && (
        <p className="text-xs text-brand font-medium mt-2">{successMessage}</p>
      )}
    </div>
  );
}

export default AwardSelector;
