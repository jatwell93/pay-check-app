import React from 'react';

const OverviewBreakdown = ({
  results,
  selectedDayIndex,
  onDayToggle,
  actualPaidByDay,
  onActualPaidChange,
  totalActualPaid,
  onTotalActualPaidChange,
  cycleLength,
}) => {
  if (!results) return null;

  const getStatusCell = (calculatedPay, actualPaidStr) => {
    if (!actualPaidStr && actualPaidStr !== 0) {
      return <span className="text-xs text-gray-500">Enter actual paid</span>;
    }
    const actual = parseFloat(actualPaidStr);
    if (isNaN(actual)) {
      return <span className="text-xs text-gray-500">Enter actual paid</span>;
    }
    const diff = calculatedPay - actual;
    if (Math.abs(diff) <= 0.01) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
          OK
        </span>
      );
    }
    if (diff > 0.01) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
          Underpaid
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
        Overpaid
      </span>
    );
  };

  const getDiscrepancyCell = (calculatedPay, actualPaidStr) => {
    if (!actualPaidStr && actualPaidStr !== 0) return null;
    const actual = parseFloat(actualPaidStr);
    if (isNaN(actual)) return null;
    const diff = calculatedPay - actual;
    return <span>${diff.toFixed(2)}</span>;
  };

  const periodLabel = cycleLength === 7 ? 'Weekly Actual Paid' : 'Fortnightly Actual Paid';

  return (
    <div className="mb-8 p-4 border rounded-md bg-gray-50">
      <h2 className="text-xl font-semibold mb-4 text-blue-700">Pay Overview</h2>

      <table className="w-full mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Day</th>
            <th className="p-2 text-left">Hours</th>
            <th className="p-2 text-left">Calculated</th>
            <th className="p-2 text-left">Actual Paid</th>
            <th className="p-2 text-left">Discrepancy</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {results.dailyBreakdown.map((day, index) => (
            <React.Fragment key={index}>
              <tr
                className={`cursor-pointer hover:bg-gray-100 ${selectedDayIndex === index ? 'bg-blue-50' : ''}`}
                onClick={() => onDayToggle(index)}
              >
                <td className="p-2">{day.day}</td>
                <td className="p-2">{day.hours.toFixed(2)}</td>
                <td className="p-2">${day.pay.toFixed(2)}</td>
                <td className="p-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    step="0.01"
                    value={actualPaidByDay[index] || ''}
                    onChange={(e) => onActualPaidChange(index, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-24 p-1 border rounded text-sm"
                  />
                </td>
                <td className="p-2">
                  {getDiscrepancyCell(day.pay, actualPaidByDay[index])}
                </td>
                <td className="p-2">
                  {getStatusCell(day.pay, actualPaidByDay[index])}
                </td>
              </tr>

              {selectedDayIndex === index && (
                <tr>
                  <td colSpan={6} className="p-2 bg-white border-t">
                    <table className="w-full text-sm">
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
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="mb-4 p-3 border rounded bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {periodLabel}
        </label>
        <input
          type="number"
          step="0.01"
          value={totalActualPaid}
          onChange={(e) => onTotalActualPaidChange(e.target.value)}
          className="w-40 p-1 border rounded text-sm"
          placeholder="0.00"
        />
      </div>

      {totalActualPaid && (
        <div className="p-3 border-t bg-white text-sm text-gray-700">
          {`Calculated: $${results.total.toFixed(2)} | Paid: $${parseFloat(totalActualPaid).toFixed(2)} | Difference: $${(parseFloat(totalActualPaid) - results.total).toFixed(2)}`}
        </div>
      )}
    </div>
  );
};

export default OverviewBreakdown;
