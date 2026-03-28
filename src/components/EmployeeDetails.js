import React from 'react';

const EmployeeDetails = ({
  classification, setClassification,
  employmentType, setEmploymentType,
  age, setAge,
  customRate, setCustomRate,
  classifications,
  ageOptions,
  juniorClassificationIds
}) => {
  const handleCustomRateChange = (event) => setCustomRate(event.target.value);

  return (
    <div className="card h-full">
      <div className="flex items-center gap-2 mb-6 border-b border-edge-light pb-4">
        <div className="h-2 w-2 rounded-full bg-brand-teal animate-pulse"></div>
        <h2 className="text-lg font-bold text-ink-primary">Employee Details</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label
            className="block text-xs font-bold text-brand-teal-dark uppercase tracking-wider mb-2"
            htmlFor="classification"
          >
            Role Classification
          </label>
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
            id="classification"
            className="w-full p-2.5 border border-edge-mid rounded-md shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-ink-primary bg-white transition-all appearance-none cursor-pointer"
          >
            {classifications.map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </div>

        {classification === 'above-award' && (
          <div className="animate-fade-slide-up bg-brand-teal-50 p-4 rounded-lg border border-brand-teal-100">
            <label
              className="block text-xs font-bold text-brand-teal-dark uppercase tracking-wider mb-2"
              htmlFor="customRate"
            >
              Above-Award Hourly Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted font-bold">$</span>
              <input
                type="number"
                id="customRate"
                className="w-full pl-8 pr-3 py-2.5 border border-edge-mid rounded-md shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal placeholder-ink-muted/50 text-ink-primary"
                value={customRate}
                onChange={handleCustomRateChange}
                min={0}
                placeholder="e.g. 25.50"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-brand-teal-dark uppercase tracking-wider mb-3">
            Contract Basis
          </label>
          <div className="flex flex-wrap gap-2">
            {['full-time', 'part-time', 'casual'].map(type => {
              const isActive = employmentType === type;
              return (
                <button
                  key={type}
                  onClick={() => setEmploymentType(type)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold border-2 transition-all ${
                    isActive 
                      ? 'bg-brand-teal text-white border-brand-teal shadow-sm' 
                      : 'bg-white text-ink-secondary border-edge-light hover:border-brand-teal-100'
                  }`}
                >
                  {type.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-')}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-brand-teal-dark uppercase tracking-wider" htmlFor="age">
              Age-Based Rate
            </label>
            {!juniorClassificationIds.includes(classification) && (
              <span className="text-[10px] bg-slate-100 text-ink-muted px-2 py-0.5 rounded uppercase font-bold tracking-tight">Not Applicable</span>
            )}
          </div>
          <select
            id="age"
            className="w-full p-2.5 border border-edge-mid rounded-md shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-ink-primary bg-white disabled:bg-slate-50 disabled:text-ink-muted disabled:cursor-not-allowed transition-all"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            disabled={!juniorClassificationIds.includes(classification)}
          >
            {ageOptions.map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          {juniorClassificationIds.includes(classification) && (
            <p className="text-[10px] text-ink-muted mt-2 italic flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Junior rates apply to this classification
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetails;
