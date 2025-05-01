import React from 'react';

const PaySummary = ({ results, showDetails, setShowDetails }) => {
    return (
        <div className="md:col-span-1 p-4 border rounded-md bg-gray-50">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Pay Summary</h2>

            {results ? (
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="font-medium">Base Hourly Rate:</span>
                        <span>${results.baseRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Total Hours:</span>
                        <span>{results.totalHours.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Ordinary Pay:</span>
                        <span>${results.totalPay.toFixed(2)}</span>
                    </div>
                    {results.overtimeHours > 0 && (
                        <div className="flex justify-between">
                            <span className="font-medium">Overtime ({results.overtimeHours.toFixed(2)} hours):</span>
                            <span>${results.overtimePay.toFixed(2)}</span>
                        </div>
                    )}
                    {results.allowances > 0 && (
                        <div className="flex justify-between">
                            <span className="font-medium">Allowances:</span>
                            <span>${results.allowances.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between pt-3 border-t font-bold">
                        <span>Total Weekly Pay:</span>
                        <span>${results.total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        {showDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                </div>
            ) : (
                <div className="text-gray-500 italic">
                    Enter your work hours and click "Calculate Pay" to see your estimated weekly pay
                </div>
            )}
        </div>
    );
};

export default PaySummary;
