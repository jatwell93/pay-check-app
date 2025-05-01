import React from 'react';

const DetailedBreakdown = ({ results }) => {
  if (!results) return null;

  return (
    <div className="mb-8 p-4 border rounded-md bg-gray-50">
      <h2 className="text-xl font-semibold mb-4 text-blue-700">Detailed Breakdown</h2>

      {/* Daily Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-blue-600">Daily Pay</h3>
        {results.dailyBreakdown.map((day, index) => (
          <div key={index} className="mb-4 p-3 border rounded bg-white">
            <h4 className="font-medium text-lg">{day.day} (${day.pay.toFixed(2)})</h4>
            <p className="text-sm text-gray-600 mb-2">
              {day.startTime} - {day.endTime} ({day.hours.toFixed(2)} hours)
            </p>

            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 text-left">Time</th>
                  <th className="p-1 text-left">Hours</th>
                  <th className="p-1 text-left">Rate Type</th>
                  <th className="p-1 text-right">Rate</th>
                  <th className="p-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {day.segments.map((segment, segIndex) => (
                  <tr key={segIndex} className="border-b">
                    <td className="p-1">{segment.startTime} - {segment.endTime}</td>
                    <td className="p-1">{segment.hours.toFixed(2)}</td>
                    <td className="p-1">{segment.penaltyDescription}</td>
                    <td className="p-1 text-right">${segment.rate.toFixed(2)}</td>
                    <td className="p-1 text-right">${segment.pay.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Overtime Breakdown */}
      {results.overtimeHours > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-blue-600">Overtime</h3>
          <div className="p-3 border rounded bg-white">
            <p>{results.overtimeHours.toFixed(2)} hours over standard 38 hours</p>
            <p>First 2 hours at time and a half, remaining at double time</p>
            <p className="font-medium mt-2">Total overtime: ${results.overtimePay.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Allowances Breakdown */}
      {results.allowances > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-blue-600">Allowances</h3>
          <div className="p-3 border rounded bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Allowance</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {results.allowanceBreakdown.map((allowance, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{allowance.name}</td>
                    <td className="p-2 text-right">${allowance.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="p-2">Total</td>
                  <td className="p-2 text-right">${results.allowances.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedBreakdown;
