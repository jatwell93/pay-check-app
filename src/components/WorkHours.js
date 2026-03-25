import React from 'react';

const WorkHours = ({ weeklyData, handleTimeChange, handlePublicHolidayChange, calculatePay, isLoading }) => {
  return <div className="mb-8 card">
        <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b border-edge-subtle pb-2 font-heading">Work Hours</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-surface-header">
                <th className="p-2 text-left text-sm font-semibold text-gray-700">Day</th>
                <th className="p-2 text-left text-sm font-semibold text-gray-700">Start Time</th>
                <th className="p-2 text-left text-sm font-semibold text-gray-700">End Time</th>
                <th className="p-2 text-left text-sm font-semibold text-gray-700">Public Holiday?</th>
              </tr>
            </thead>
            <tbody>
            {weeklyData.map((day, index) => (
                <tr key={index} className="border-b border-edge-subtle hover:bg-brand-subtle">
                  <td className="p-2 text-sm text-gray-700 whitespace-nowrap font-medium">{day.day}</td>
                  <td className="p-2">
                    <input
                      type="time"
                      aria-label={`${day.day} start time`}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand text-gray-700 text-sm"
                      value={day.startTime}
                      onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="time"
                      aria-label={`${day.day} end time`}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand text-gray-700 text-sm"
                      value={day.endTime}
                      onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <label className="flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer">
                      <input
                        type="checkbox"
                        id={`public-holiday-${index}`}
                        aria-label={`${day.day} public holiday`}
                        checked={day.publicHoliday}
                        onChange={() => handlePublicHolidayChange(index)}
                        className="w-4 h-4 accent-brand cursor-pointer"
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="px-6 py-2 bg-brand text-white font-medium rounded-md hover:bg-brand-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            onClick={calculatePay}
            disabled={isLoading}
          >
            Calculate Pay
          </button>
        </div>
      </div>;
};

export default WorkHours;
