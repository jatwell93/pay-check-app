import React from 'react';
import Form from 'react-bootstrap/Form';

const Allowances = ({ allowances, handleAllowanceChange, classification }) => {
  return <div className="md:col-span-1 p-4 border rounded-md bg-gray-50">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Allowances</h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Form.Check
                type="checkbox"
                id="homeMedicineReview"
                label="Home Medicine Reviews ($106.40/week)"
                checked={allowances.homeMedicineReview}
                onChange={() => handleAllowanceChange('homeMedicineReview', !allowances.homeMedicineReview)}
                disabled={!['pharmacist', 'experienced-pharmacist', 'pharmacist-in-charge', 'pharmacist-manager'].includes(classification)}
                className={!['pharmacist', 'experienced-pharmacist', 'pharmacist-in-charge', 'pharmacist-manager'].includes(classification) ? "text-gray-500" : ""}
              />
            </div>
            
            <div className="flex items-center">
              <Form.Check
                type="checkbox"
                id="laundry"
                label="Laundry Allowance"
                checked={allowances.laundry}
                onChange={() => handleAllowanceChange('laundry', !allowances.laundry)}
              />
            </div>
            
            <div className="flex items-center">
              <Form.Check
                type="checkbox"
                id="brokenHill"
                label="Broken Hill Allowance ($44.18/week)"
                checked={allowances.brokenHill}
                onChange={() => handleAllowanceChange('brokenHill', !allowances.brokenHill)}
              />
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
