import React from 'react';

const ImportantNotes = ({ awardName = 'selected award', overtimeThresholdHours = 38 }) => {
  return (
    <div className="mb-8 card">
      <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b border-edge-subtle pb-2 font-heading">Important Notes</h2>
      <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
        <li>This calculator is based on the {awardName} effective July 1, 2024.</li>
        <li>For overnight shifts, enter times normally (e.g., 10:00 PM to 6:00 AM).</li>
        <li>Overtime is calculated based on weekly hours exceeding {overtimeThresholdHours} hours for full-time and part-time employees.</li>
        <li>Junior rates apply to eligible junior classifications under the selected award.</li>
        <li>This calculator provides an estimate only. Always refer to the full award for specific circumstances.</li>
        <li>Some complex award provisions (such as rostering requirements and meal breaks) may not be fully reflected.</li>
      </ul>
    </div>
  );
};

export default ImportantNotes;
