import React from 'react';

const Allowances = ({ allowances, handleAllowanceChange, classification, allowanceConfig, classifications }) => {
  const pharmacistIds = ['pharmacist', 'experienced-pharmacist', 'pharmacist-in-charge', 'pharmacist-manager'];
  return (
    <div className="md:col-span-1 card">
      <h2 className="text-xl font-bold mb-4 text-slate-800 border-b border-edge-subtle pb-2 font-heading">Allowances</h2>
      <div className="space-y-4">
        {allowanceConfig?.homeMedicineReview != null && (
          <div className="flex items-center gap-2 min-h-[44px]">
            <input type="checkbox" id="homeMedicineReview" className="w-4 h-4 accent-brand cursor-pointer"
              checked={allowances.homeMedicineReview}
              onChange={() => handleAllowanceChange('homeMedicineReview', !allowances.homeMedicineReview)}
              disabled={!pharmacistIds.includes(classification)}
            />
            <label htmlFor="homeMedicineReview" className={pharmacistIds.includes(classification) ? "text-base text-gray-700 cursor-pointer" : "text-base text-gray-400 cursor-not-allowed"}>
              Home Medicine Reviews (${allowanceConfig.homeMedicineReview}/week)
            </label>
          </div>
        )}
        {(allowanceConfig?.laundryFullTime != null || allowanceConfig?.laundryPartTimeCasual != null) && (
          <div className="flex items-center gap-2 min-h-[44px]">
            <input type="checkbox" id="laundry" className="w-4 h-4 accent-brand cursor-pointer"
              checked={allowances.laundry}
              onChange={() => handleAllowanceChange('laundry', !allowances.laundry)}
            />
            <label htmlFor="laundry" className="text-base text-gray-700 cursor-pointer">Laundry Allowance</label>
          </div>
        )}
        {allowanceConfig?.brokenHill != null && (
          <div className="flex items-center gap-2 min-h-[44px]">
            <input type="checkbox" id="brokenHill" className="w-4 h-4 accent-brand cursor-pointer"
              checked={allowances.brokenHill}
              onChange={() => handleAllowanceChange('brokenHill', !allowances.brokenHill)}
            />
            <label htmlFor="brokenHill" className="text-base text-gray-700 cursor-pointer">Broken Hill Allowance (${allowanceConfig.brokenHill}/week)</label>
          </div>
        )}
        {allowanceConfig?.mealAllowanceOvertime != null && (
          <div className="mt-4">
            <label htmlFor="mealAllowance" className="block text-base font-medium text-gray-700 mb-1">
              Meal Allowance — how many overtime meals this week?
            </label>
            <input type="number" id="mealAllowance" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand placeholder-gray-400 text-gray-700"
              value={allowances.mealAllowance} min="0"
              onChange={(e) => handleAllowanceChange('mealAllowance', e.target.value)}
            />
          </div>
        )}
        {allowanceConfig?.mealAllowanceOvertimeExtra != null && (
          <div className="mt-4">
            <label htmlFor="mealAllowanceExtra" className="block text-base font-medium text-gray-700 mb-1">
              Extra Meal Allowance — overtime shifts over 4 hours (how many?)
            </label>
            <input type="number" id="mealAllowanceExtra" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand placeholder-gray-400 text-gray-700"
              value={allowances.mealAllowanceExtra} min="0"
              onChange={(e) => handleAllowanceChange('mealAllowanceExtra', e.target.value)}
            />
          </div>
        )}
        {allowanceConfig?.motorVehiclePerKm != null && (
          <div className="mt-4">
            <label htmlFor="motorVehicleKm" className="block text-base font-medium text-gray-700 mb-1">
              Motor Vehicle Usage (km)
            </label>
            <input type="number" id="motorVehicleKm" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand placeholder-gray-400 text-gray-700"
              value={allowances.motorVehicleKm} min="0"
              onChange={(e) => handleAllowanceChange('motorVehicleKm', e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Allowances;
