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
    <div className="mb-8 bg-brand-teal-50 border border-brand-teal-100 rounded-lg px-6 py-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <label htmlFor="award-select" className="block text-xs font-bold text-brand-teal-dark uppercase tracking-wider mb-1.5">
            Active Industrial Award
          </label>
          <div className="relative group">
            <select
              id="award-select"
              value={selectedAward}
              onChange={(e) => onSelectAward(e.target.value)}
              disabled={isLoading}
              className="w-full pl-3 pr-10 py-2.5 bg-white border border-edge-mid rounded-md shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-ink-primary font-medium disabled:bg-slate-50 disabled:cursor-not-allowed transition-all appearance-none cursor-pointer"
            >
              {Object.entries(awardMetadata).map(([awardId, meta]) => (
                <option key={awardId} value={awardId}>
                  {meta.name} ({awardId})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-ink-muted group-hover:text-brand-teal transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col justify-end">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-teal text-white text-sm font-semibold rounded-md hover:bg-brand-teal-dark shadow-sm hover:shadow-md disabled:bg-ink-muted disabled:cursor-not-allowed transition-all active:scale-95 group"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Hydrating...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4 opacity-70 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Live Rates
              </>
            )}
          </button>
          
          {lastUpdated && (
            <p className="text-[10px] text-ink-muted mt-2 text-right uppercase tracking-wider font-medium">
              Verified {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 mt-4 text-xs text-success font-semibold animate-fade-in bg-success-bg px-3 py-1.5 rounded-full w-fit">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}
    </div>
  );
}

export default AwardSelector;
