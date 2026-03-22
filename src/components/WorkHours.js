import React from 'react';

const WorkHours = ({ weeklyData, handleTimeChange, handlePublicHolidayChange, calculatePay, isLoading }) => {
  return <div className="mb-8 bg-white border border-gray-200 rounded-md shadow-sm p-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">Work Hours</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left text-sm font-semibold text-gray-700">Day</th>
                <th className="p-2 text-left text-sm font-semibold text-gray-700">Start Time</th>
                <th className="p-2 text-left text-sm font-semibold text-gray-700">End Time</th>
                <th className="p-2 text-left text-sm font-semibold text-gray-700">Public Holiday?</th>
              </tr>
            </thead>
            <tbody>
            {weeklyData.map((day, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-2 text-sm text-gray-700 whitespace-nowrap font-medium">{day.day}</td>
                  <td className="p-2">
                    <input
                      type="time"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 text-sm"
                      value={day.startTime}
                      onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="time"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 text-sm"
                      value={day.endTime}
                      onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input type="checkbox" checked={day.publicHoliday} onChange={() => handlePublicHolidayChange(index)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="px-6 py-2 bg-emerald-500 text-white font-medium rounded-md hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={calculatePay}
            disabled={isLoading}
          >
            Calculate Pay
          </button>
        </div>
      </div>;
};

export default WorkHours;
