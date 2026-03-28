import React from 'react';

const ImportantNotes = ({ awardName = 'selected award', overtimeThresholdHours = 38 }) => {
  return (
    <div className="mb-8 bg-brand-amber-50 border border-brand-amber/20 border-l-4 border-l-brand-amber rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="h-5 w-5 text-brand-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-bold text-brand-amber-dark">Industrial Compliance Notes</h2>
      </div>
      <ul className="space-y-3 text-sm text-brand-amber-dark/80">
        <li className="flex gap-2">
          <span className="text-brand-amber font-bold">•</span>
          <span>Calculations based on <strong>{awardName}</strong> (Effective July 1, 2024).</span>
        </li>
        <li className="flex gap-2">
          <span className="text-brand-amber font-bold">•</span>
          <span><strong>Overnight Shifts:</strong> Enter normally (e.g. 22:00 to 06:00) — system handles cross-day penalty calculations.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-brand-amber font-bold">•</span>
          <span><strong>Overtime:</strong> Automated threshold detection at <strong>{overtimeThresholdHours} hours</strong> for FT/PT employees.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-brand-amber font-bold">•</span>
          <span><strong>Junior Rates:</strong> Dynamically applied based on age-weighted classification logic.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-brand-amber font-bold">•</span>
          <span><strong>Disclaimer:</strong> This is a professional assurance tool for estimation. Always consult FWC for binding legal interpretations.</span>
        </li>
      </ul>
    </div>
  );
};

export default ImportantNotes;
