import React from 'react';

const PaySummary = ({ results, showDetails, setShowDetails }) => {
    return (
        <div className="md:col-span-1 p-4 border rounded-md bg-surface-page">
            <h2 className="text-xl font-semibold mb-4 text-brand-teal font-heading">Pay Summary</h2>

            {results ? (
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="font-medium">Base Hourly Rate:</span>
                        <span className="tabular-nums">${results.baseRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Total Hours:</span>
                        <span className="tabular-nums">{results.totalHours.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Ordinary Pay:</span>
                        <span className="tabular-nums">${results.totalPay.toFixed(2)}</span>
                    </div>
                    {results.overtimeHours > 0 && (
                        <div className="flex justify-between">
                            <span className="font-medium">Overtime (<span className="tabular-nums">{results.overtimeHours.toFixed(2)}</span> hours):</span>
                            <span className="tabular-nums">${results.overtimePay.toFixed(2)}</span>
                        </div>
                    )}
                    {results.allowances > 0 && (
                        <div className="flex justify-between">
                            <span className="font-medium">Allowances:</span>
                            <span className="tabular-nums">${results.allowances.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between pt-3 border-t font-bold">
                        <span>Total Weekly Pay:</span>
                        <span className="tabular-nums">${results.total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="mt-4 w-full py-2 bg-brand-teal text-white rounded-md hover:bg-brand-teal-dark transition"
                    >
                        {showDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                </div>
            ) : (
                <div className="text-ink-secondary italic">
                    Enter your work hours and click "Calculate Pay" to see your estimated weekly pay
                </div>
            )}
        </div>
    );
};

export default PaySummary;
