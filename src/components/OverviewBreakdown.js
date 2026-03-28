import React from 'react';
import Logo from './Logo';

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
      <div className="mt-12 mb-8 card border-dashed border-2 border-edge-light bg-slate-50/50">
        <div className="flex items-center gap-2 mb-6 border-b border-edge-light pb-4">
          <div className="h-2 w-2 rounded-full bg-ink-muted"></div>
          <h2 className="text-lg font-bold text-ink-primary">Pay Overview</h2>
        </div>
        <div className="py-12 flex flex-col items-center text-center gap-4">
          <div className="p-4 bg-white rounded-full shadow-sm border border-edge-light">
            <svg className="h-8 w-8 text-brand-teal opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-secondary max-w-xs mx-auto">
              Enter your shift hours above and click <span className="text-brand-teal font-bold">Calculate Weekly Total</span> to generate your professional pay audit.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] text-ink-muted font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-brand-teal"></span> Penalty Rates</span>
            <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-brand-teal"></span> Overtime Audit</span>
            <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-brand-teal"></span> Allowance Check</span>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (calculatedPay, actualPaidStr) => {
    if (!actualPaidStr && actualPaidStr !== 0) {
      return <span className="text-[10px] text-ink-muted font-bold uppercase tracking-tight italic">Pending Input</span>;
    }
    const actual = parseFloat(actualPaidStr);
    if (isNaN(actual)) {
      return <span className="text-[10px] text-ink-muted font-bold uppercase tracking-tight italic">Pending Input</span>;
    }
    const diff = calculatedPay - actual;
    if (Math.abs(diff) <= 0.01) {
      return (
        <span className="px-2 py-0.5 bg-success-bg text-success border border-success/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
          Verified OK
        </span>
      );
    }
    if (diff > 0.01) {
      return (
        <span className="px-2 py-0.5 bg-critical-bg text-critical border border-critical/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
          Underpaid
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-brand-amber-50 text-brand-amber border border-brand-amber/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
        Discrepancy
      </span>
    );
  };

  const getDiscrepancyText = (calculatedPay, actualPaidStr) => {
    if (!actualPaidStr && actualPaidStr !== 0) return null;
    const actual = parseFloat(actualPaidStr);
    if (isNaN(actual)) return null;
    const diff = calculatedPay - actual;
    const isNegative = diff < -0.01;
    return (
      <span className={`text-sm font-bold ${isNegative ? 'text-brand-amber' : diff > 0.01 ? 'text-critical' : 'text-success'}`}>
        {isNegative ? '+' : diff > 0.01 ? '-' : ''}${Math.abs(diff).toFixed(2)}
      </span>
    );
  };

  const periodLabel = cycleLength === 7 ? 'Weekly Payslip Total' : 'Fortnightly Payslip Total';

  return (
    <div className="mt-12 mb-8 card overflow-hidden">
      <div className="flex items-center gap-2 mb-6 border-b border-edge-light pb-4">
        <div className="h-2 w-2 rounded-full bg-brand-teal"></div>
        <h2 className="text-lg font-bold text-ink-primary">Pay Audit Breakdown</h2>
      </div>

      <div className="animate-fade-slide-up">
        <div className="overflow-x-auto -mx-6 mb-8">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-y border-edge-light">
                <th className="px-6 py-3 text-left text-xs font-bold text-brand-teal-dark uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-brand-teal-dark uppercase tracking-wider">Audit Hours</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-brand-teal-dark uppercase tracking-wider">Calculated Pay</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-brand-teal-dark uppercase tracking-wider">Your Payslip</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-brand-teal-dark uppercase tracking-wider">Variance</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-brand-teal-dark uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-light">
              {results.dailyBreakdown.map((day, index) => (
                <React.Fragment key={index}>
                  <tr
                    className={`cursor-pointer transition-colors duration-150 group ${selectedDayIndex === index ? 'bg-brand-teal-50' : 'hover:bg-slate-50'}`}
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
                    <td className="px-6 py-4 text-sm font-semibold text-ink-primary">
                      <div className="flex items-center gap-2">
                        <svg className={`h-3 w-3 text-brand-teal transition-transform ${selectedDayIndex === index ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        {day.day}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-secondary">{day.hours.toFixed(2)}h</td>
                    <td className="px-6 py-4 text-sm font-bold text-ink-primary">${day.pay.toFixed(2)}</td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative w-28 group/input">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-muted group-focus-within/input:text-brand-teal transition-colors">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={actualPaidByDay[index] || ''}
                          onChange={(e) => onActualPaidChange(index, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="0.00"
                          className="w-full pl-5 pr-2 py-1.5 border border-edge-mid rounded bg-white focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-sm font-medium text-ink-primary transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getDiscrepancyText(day.pay, actualPaidByDay[index])}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(day.pay, actualPaidByDay[index])}
                    </td>
                  </tr>

                  {selectedDayIndex === index && (
                    <tr>
                      <td colSpan={6} className="px-6 py-0 bg-white border-none">
                        <div className="animate-fade-in border-x border-b border-brand-teal-100 rounded-b-lg mb-4 shadow-inner bg-slate-50/30">
                          <div className="p-4 overflow-x-auto">
                            <h4 className="text-[10px] font-bold text-brand-teal-dark uppercase tracking-widest mb-3 flex items-center gap-2">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Audit Trace — Penalty Logic
                            </h4>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-ink-muted border-b border-edge-light">
                                  <th className="text-left font-bold pb-2">Shift Segment</th>
                                  <th className="text-left font-bold pb-2">Audit Hours</th>
                                  <th className="text-left font-bold pb-2">Rate Applied</th>
                                  <th className="text-right font-bold pb-2">Base Multiplier</th>
                                  <th className="text-right font-bold pb-2">Segment Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {day.segments.map((segment, segIndex) => (
                                  <tr key={segIndex} className="group/seg">
                                    <td className="py-2 text-ink-secondary">{segment.startTime} - {segment.endTime}</td>
                                    <td className="py-2 text-ink-primary font-medium">{segment.hours.toFixed(2)}h</td>
                                    <td className="py-2">
                                      <span className="text-ink-secondary">{segment.penaltyDescription}</span>
                                    </td>
                                    <td className="py-2 text-right text-ink-muted italic">${segment.rate.toFixed(2)}/h</td>
                                    <td className="py-2 text-right text-brand-teal font-bold">${segment.pay.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6 border-t border-edge-light">
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-brand-teal-dark uppercase tracking-wider mb-2">
              {periodLabel}
            </label>
            <div className="relative group/input">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted group-focus-within/input:text-brand-teal">$</span>
              <input
                type="number"
                step="0.01"
                value={totalActualPaid}
                onChange={(e) => onTotalActualPaidChange(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-edge-mid rounded-md shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-lg font-bold text-ink-primary transition-all"
                placeholder="0.00"
              />
            </div>
            <p className="text-[10px] text-ink-muted mt-2">Enter the final net amount from your payslip for the full period.</p>
          </div>

          {/* Weekly Summary Card */}
          {actualPaidByDay.some(x => x !== '' && x !== null && !isNaN(parseFloat(x))) && (
            <div className="flex-1 bg-brand-navy rounded-lg p-5 text-white shadow-lg animate-fade-slide-up relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Logo color="white" size={64} variant="icon" />
              </div>
              <h3 className="text-xs font-bold text-brand-teal-light uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Final Audit Result
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight mb-1">Audit Total</p>
                  <p className="text-xl font-bold font-heading text-white">${results.total.toFixed(2)}</p>
                </div>
                {totalActualPaid && (
                  <>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight mb-1">Your Payslip</p>
                      <p className="text-xl font-bold font-heading text-white">${parseFloat(totalActualPaid).toFixed(2)}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight mb-1">Discrepancy</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-xl font-extrabold font-heading ${(parseFloat(totalActualPaid) - results.total) < -0.01 ? 'text-critical' : (parseFloat(totalActualPaid) - results.total) > 0.01 ? 'text-brand-amber' : 'text-brand-teal-light'}`}>
                          ${(parseFloat(totalActualPaid) - results.total).toFixed(2)}
                        </p>
                        {Math.abs(parseFloat(totalActualPaid) - results.total) <= 0.01 ? (
                          <span className="px-2 py-0.5 bg-brand-teal text-white rounded text-[8px] font-bold uppercase tracking-widest">Perfect Match</span>
                        ) : parseFloat(totalActualPaid) < results.total ? (
                          <span className="px-2 py-0.5 bg-critical text-white rounded text-[8px] font-bold uppercase tracking-widest">Underpaid</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-brand-amber text-white rounded text-[8px] font-bold uppercase tracking-widest">Overpaid</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewBreakdown;
