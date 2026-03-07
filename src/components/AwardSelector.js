import React from 'react';
import { formatDistanceToNow } from 'date-fns';

/**
 * AwardSelector — pure presentational component.
 * No internal state, no API calls.
 * All behavior is controlled via props.
 */
function AwardSelector({
  selectedAward,
  onSelectAward,
  awardMetadata,
  isLoading,
  error,
  lastUpdated,
  onRefresh,
  successMessage,
}) {
  return (
    <div className="award-selector">
      <div className="award-selector__row">
        <label htmlFor="award-select" className="award-selector__label">
          Award:
        </label>
        <select
          id="award-select"
          value={selectedAward}
          onChange={(e) => onSelectAward(e.target.value)}
          disabled={isLoading}
          className="award-selector__select"
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
          className="award-selector__refresh-btn"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Rates'}
        </button>
      </div>

      {lastUpdated && (
        <div className="award-selector__timestamp">
          Rates last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </div>
      )}

      {error && (
        <div className="award-selector__error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="award-selector__success">
          {successMessage}
        </div>
      )}
    </div>
  );
}

export default AwardSelector;
