import React from 'react';

const WorkHours = ({ weeklyData, handleTimeChange, handlePublicHolidayChange, calculatePay, isLoading }) => {
  return (
    <div className="mb-8 card overflow-hidden">
      <div className="flex items-center gap-2 mb-6 border-b border-edge-light pb-4">
        <div className="h-2 w-2 rounded-full bg-brand-teal"></div>
        <h2 className="text-lg font-bold text-ink-primary">Work Hours</h2>
      </div>

      <div className="overflow-x-auto -mx-6">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-slate-50 border-y border-edge-light">
              <th className="px-6 py-3 text-left text-xs font-bold text-brand-teal-dark uppercase tracking-wider">Day</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-brand-teal-dark uppercase tracking-wider">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-brand-teal-dark uppercase tracking-wider">End Time</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-brand-teal-dark uppercase tracking-wider">Public Holiday</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge-light">
            {weeklyData.map((day, index) => (
              <tr key={index} className="hover:bg-brand-teal-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm font-semibold text-ink-primary whitespace-nowrap">
                  {day.day}
                </td>
                <td className="px-6 py-4">
                  <input
                    type="time"
                    aria-label={`${day.day} start time`}
                    className="w-full p-2 bg-white border border-edge-mid rounded-md shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-ink-primary text-sm transition-all"
                    value={day.startTime}
                    onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="time"
                    aria-label={`${day.day} end time`}
                    className="w-full p-2 bg-white border border-edge-mid rounded-md shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-ink-primary text-sm transition-all"
                    value={day.endTime}
                    onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <label className="inline-flex items-center justify-center cursor-pointer p-2 hover:bg-brand-teal-50 rounded-full transition-colors">
                    <input
                      type="checkbox"
                      id={`public-holiday-${index}`}
                      aria-label={`${day.day} public holiday`}
                      checked={day.publicHoliday}
                      onChange={() => handlePublicHolidayChange(index)}
                      className="w-5 h-5 rounded text-brand-teal focus:ring-brand-teal border-edge-mid accent-brand-teal cursor-pointer"
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-xs text-ink-muted italic">
          * Enter 24h time. Leave empty if no shift was worked.
        </p>
        <button
          className="px-10 py-3 bg-brand-teal text-white font-bold rounded-md hover:bg-brand-teal-dark shadow-md hover:shadow-lg disabled:bg-ink-muted disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
          onClick={calculatePay}
          disabled={isLoading}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Calculate Weekly Total
        </button>
      </div>
    </div>
  );
};

export default WorkHours;
