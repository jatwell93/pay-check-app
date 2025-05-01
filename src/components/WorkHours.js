import React from 'react';

const WorkHours = ({ weeklyData, handleTimeChange, handlePublicHolidayChange, calculatePay }) => {
  return <div className="mb-8 p-4 border rounded-md bg-gray-50">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Work Hours</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Day</th>
                <th className="p-2 text-left">Start Time</th>
                <th className="p-2 text-left">End Time</th>
                <th className="p-2 text-left">Public Holiday?</th>
              </tr>
            </thead>
            <tbody>
            {weeklyData.map((day, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{day.day}</td>
                  <td className="p-2">
                    <input
                      type="time"
                      className="border rounded p-1 w-full"
                      value={day.startTime}
                      onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="time"
                      className="border rounded p-1 w-full"
                      value={day.endTime}
                      onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input type="checkbox" checked={day.publicHoliday} onChange={() => handlePublicHolidayChange(index)} className="mr-2" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
            onClick={calculatePay}
          >
            Calculate Pay
          </button>
        </div>
      </div>;
};

export default WorkHours;
