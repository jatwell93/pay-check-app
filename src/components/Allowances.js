import React from 'react';

const Allowances = ({ allowances, handleAllowanceChange, classification }) => {
  return <div className="md:col-span-1 p-4 border rounded-md bg-gray-50">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Allowances</h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                  type="checkbox"
                  id="homeMedicineReview"
                  className="mr-2"
                  checked={allowances.homeMedicineReview}
                  onChange={() => handleAllowanceChange('homeMedicineReview', !allowances.homeMedicineReview)}
                  disabled={!['pharmacist', 'experienced-pharmacist', 'pharmacist-in-charge', 'pharmacist-manager'].includes(classification)}
                />
                <label htmlFor="homeMedicineReview" className={['pharmacist', 'experienced-pharmacist', 'pharmacist-in-charge', 'pharmacist-manager'].includes(classification) ? "" : "text-gray-500"}>
                Home Medicine Reviews ($106.40/week)
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                  type="checkbox"
                  id="laundry"
                  className="mr-2"
                  checked={allowances.laundry}
                  onChange={() => handleAllowanceChange('laundry', !allowances.laundry)}
                />
                <label htmlFor="laundry">
                Laundry Allowance
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                  type="checkbox"
                  id="brokenHill"
                  className="mr-2"
                  checked={allowances.brokenHill}
                  onChange={() => handleAllowanceChange('brokenHill', !allowances.brokenHill)}
                />
                <label htmlFor="brokenHill">
                Broken Hill Allowance ($44.18/week)
              </label>
            </div>
            
            <div className="mt-4">
              <label htmlFor="mealAllowance" className="block text-gray-700 mb-1">
                Meal Allowance (number of overtime occurrences)
              </label>
              <input
                type="number"
                id="mealAllowance"
                className="w-full p-2 border rounded"
                value={allowances.mealAllowance}
                min="0"
                onChange={(e) => handleAllowanceChange('mealAllowance', e.target.value)}
              />
            </div>
            
            <div className="mt-4">
              <label htmlFor="mealAllowanceExtra" className="block text-gray-700 mb-1">
                Additional Meal Allowance (overtime &gt; 4 hours)
              </label>
              <input
                type="number"
                id="mealAllowanceExtra"
                className="w-full p-2 border rounded"
                value={allowances.mealAllowanceExtra}
                min="0"
                onChange={(e) => handleAllowanceChange('mealAllowanceExtra', e.target.value)}
              />
            </div>
            
            <div className="mt-4">
              <label htmlFor="motorVehicleKm" className="block text-gray-700 mb-1">
                Motor Vehicle Usage (km)
              </label>
              <input
                type="number"
                id="motorVehicleKm"
                className="w-full p-2 border rounded"
                value={allowances.motorVehicleKm}
                min="0"
                onChange={(e) => handleAllowanceChange('motorVehicleKm', e.target.value)}
              />
            </div>
          </div>
        </div>;
};


export default Allowances;
