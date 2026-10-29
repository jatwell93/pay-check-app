import React from 'react';

const DetailedBreakdown = ({ results }) => {
  if (!results) return null;

  return (
    <div className="mb-8 p-4 border rounded-md bg-surface-page">
      <h2 className="text-xl font-bold mb-4 text-brand-teal font-heading">Detailed Breakdown</h2>

      {/* Daily Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-brand-teal font-heading">Daily Pay</h3>
        {results.dailyBreakdown.map((day, index) => (
          <div key={index} className="mb-4 p-3 border rounded bg-white">
            <h4 className="font-medium text-lg">{day.day} (${day.pay.toFixed(2)})</h4>
            <p className="text-base text-ink-secondary mb-2">
              {day.startTime} - {day.endTime} ({day.hours.toFixed(2)} hours)
            </p>

            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="bg-surface-page">
                  <th className="p-1 text-left">Time</th>
                  <th className="p-1 text-left">Hours</th>
                  <th className="p-1 text-left">Rate Type</th>
                  <th className="p-1 text-right">Rate</th>
                  <th className="p-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {day.segments.map((segment, segIndex) => (
                  <tr key={segIndex} className="border-b border-edge-light">
                    <td className="p-1">{segment.startTime} - {segment.endTime}</td>
                    <td className="p-1 tabular-nums">{segment.hours.toFixed(2)}</td>
                    <td className="p-1">{segment.penaltyDescription}</td>
                    <td className="p-1 text-right tabular-nums">${segment.rate.toFixed(2)}</td>
                    <td className="p-1 text-right tabular-nums">${segment.pay.toFixed(2)}</td>
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
          <h3 className="text-lg font-semibold mb-3 text-brand-teal font-heading">Overtime</h3>
          <div>
            <p><span className="tabular-nums">{results.overtimeHours.toFixed(2)}</span> hours over standard 38 hours</p>
            <p>First 2 hours at time and a half, remaining at double time</p>
            <p className="font-medium mt-2">Total overtime: <span className="tabular-nums">${results.overtimePay.toFixed(2)}</span></p>
          </div>
        </div>
      )}

      {/* Allowances Breakdown */}
      {results.allowances > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-brand-teal font-heading">Allowances</h3>
          <div>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-page">
                  <th className="p-2 text-left">Allowance</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {results.allowanceBreakdown.map((allowance, index) => (
                  <tr key={index} className="border-b border-edge-light">
                    <td className="p-2">{allowance.name}</td>
                    <td className="p-2 text-right tabular-nums">${allowance.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="p-2">Total</td>
                  <td className="p-2 text-right tabular-nums">${results.allowances.toFixed(2)}</td>
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
