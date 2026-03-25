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
  if (!results) {
    return (
      <div className="mt-8 mb-8 card">
        <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b border-edge-subtle pb-2 font-heading">Pay Overview</h2>
        <div className="py-8 flex flex-col items-center text-center gap-3">
          <p className="text-sm text-gray-600">
            Enter your hours above, then click{' '}
            <span className="font-semibold text-ink-strong">Calculate Pay</span>{' '}
            to see your breakdown.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-1 text-xs text-ink-subtle">
            <span>Day-by-day earnings</span>
            <span aria-hidden="true">·</span>
            <span>Penalty rates applied</span>
            <span aria-hidden="true">·</span>
            <span>Compare vs actual pay</span>
          </div>
        </div>
      </div>
    );
  }

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
        <span className="px-2 py-1 bg-brand-muted text-brand-dark rounded text-xs font-medium">
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
      <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded text-xs font-medium">
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
    <div className="mt-8 mb-8 card">
      <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b border-edge-subtle pb-2 font-heading">Pay Overview</h2>

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-surface-header">
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Day</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Hours</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Calculated</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Actual Paid</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Discrepancy</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.dailyBreakdown.map((day, index) => (
              <React.Fragment key={index}>
                <tr
                  className={`cursor-pointer hover:bg-brand-subtle ${selectedDayIndex === index ? 'bg-brand-subtle' : ''}`}
                  onClick={() => onDayToggle(index)}
                  tabIndex={0}
                  aria-expanded={selectedDayIndex === index}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onDayToggle(index);
                    }
                  }}
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
                      className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand text-sm text-gray-700"
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
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-surface-page">
                            <th className="p-1 text-left text-xs font-semibold text-gray-600">Time</th>
                            <th className="p-1 text-left text-xs font-semibold text-gray-600">Hours</th>
                            <th className="p-1 text-left text-xs font-semibold text-gray-600">Rate Type</th>
                            <th className="p-1 text-right text-xs font-semibold text-gray-600">Rate</th>
                            <th className="p-1 text-right text-xs font-semibold text-gray-600">Amount</th>
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
      </div>

      <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {periodLabel}
        </label>
        <input
          type="number"
          step="0.01"
          value={totalActualPaid}
          onChange={(e) => onTotalActualPaidChange(e.target.value)}
          className="w-40 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand text-sm text-gray-700"
          placeholder="0.00"
        />
      </div>

      {/* Weekly Summary Row — D-12, D-13: hidden until at least one actual paid amount entered */}
      {actualPaidByDay.some(x => x !== '' && x !== null && !isNaN(parseFloat(x))) && (
        <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Weekly Summary</h3>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-600">
              Calculated: <span className="font-semibold text-gray-800">${results.total.toFixed(2)}</span>
            </span>
            {totalActualPaid && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">
                  Paid: <span className="font-semibold text-gray-800">${parseFloat(totalActualPaid).toFixed(2)}</span>
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">
                  Difference: <span className={`font-semibold ${(parseFloat(totalActualPaid) - results.total) < -0.01 ? 'text-red-700' : (parseFloat(totalActualPaid) - results.total) > 0.01 ? 'text-amber-700' : 'text-brand'}`}>
                    ${(parseFloat(totalActualPaid) - results.total).toFixed(2)}
                  </span>
                </span>
                <span className="text-gray-400">|</span>
                {Math.abs(parseFloat(totalActualPaid) - results.total) <= 0.01 ? (
                  <span className="px-2 py-1 bg-brand-muted text-brand-dark rounded text-xs font-medium">OK</span>
                ) : parseFloat(totalActualPaid) < results.total ? (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Underpaid</span>
                ) : (
                  <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded text-xs font-medium">Overpaid</span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewBreakdown;
