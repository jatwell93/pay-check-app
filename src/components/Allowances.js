import React from 'react';

const Allowances = ({ allowances, handleAllowanceChange, classification, allowanceConfig }) => {
  const pharmacistIds = ['pharmacist', 'experienced-pharmacist', 'pharmacist-in-charge', 'pharmacist-manager'];
  
  const CheckboxItem = ({ id, label, checked, onChange, disabled, description }) => (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
      checked ? 'bg-brand-teal-50 border-brand-teal-100' : 'bg-white border-edge-light hover:border-brand-teal-50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    onClick={() => !disabled && onChange()}
    >
      <div className="flex items-center h-5">
        <input 
          type="checkbox" 
          id={id} 
          className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-edge-mid accent-brand-teal cursor-pointer"
          checked={checked}
          onChange={() => {}} // Handled by div click
          disabled={disabled}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor={id} className={`text-sm font-semibold ${disabled ? 'text-ink-muted' : 'text-ink-primary'} cursor-pointer`}>
          {label}
        </label>
        {description && <p className="text-[10px] text-ink-muted mt-0.5">{description}</p>}
      </div>
    </div>
  );

  return (
    <div className="card h-full">
      <div className="flex items-center gap-2 mb-6 border-b border-edge-light pb-4">
        <div className="h-2 w-2 rounded-full bg-brand-teal"></div>
        <h2 className="text-lg font-bold text-ink-primary">Allowances</h2>
      </div>

      <div className="space-y-3">
        {allowanceConfig?.homeMedicineReview != null && (
          <CheckboxItem 
            id="homeMedicineReview"
            label="Home Medicine Reviews"
            description={`$${allowanceConfig.homeMedicineReview}/week per pharmacy`}
            checked={allowances.homeMedicineReview}
            onChange={() => handleAllowanceChange('homeMedicineReview', !allowances.homeMedicineReview)}
            disabled={!pharmacistIds.includes(classification)}
          />
        )}
        {(allowanceConfig?.laundryFullTime != null || allowanceConfig?.laundryPartTimeCasual != null) && (
          <CheckboxItem 
            id="laundry"
            label="Laundry Allowance"
            description="Uniform maintenance"
            checked={allowances.laundry}
            onChange={() => handleAllowanceChange('laundry', !allowances.laundry)}
          />
        )}
        {allowanceConfig?.brokenHill != null && (
          <CheckboxItem 
            id="brokenHill"
            label="Broken Hill"
            description={`$${allowanceConfig.brokenHill}/week location loading`}
            checked={allowances.brokenHill}
            onChange={() => handleAllowanceChange('brokenHill', !allowances.brokenHill)}
          />
        )}

        <div className="pt-2 space-y-4">
          {allowanceConfig?.mealAllowanceOvertime != null && (
            <div>
              <label htmlFor="mealAllowance" className="block text-xs font-bold text-brand-teal-dark uppercase tracking-wider mb-2">
                Overtime Meals
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  id="mealAllowance" 
                  className="w-full p-2.5 border border-edge-mid rounded-md shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-ink-primary bg-white transition-all"
                  value={allowances.mealAllowance} min="0"
                  onChange={(e) => handleAllowanceChange('mealAllowance', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-muted uppercase">Qty</span>
              </div>
            </div>
          )}
          {allowanceConfig?.mealAllowanceOvertimeExtra != null && (
            <div>
              <label htmlFor="mealAllowanceExtra" className="block text-xs font-bold text-brand-teal-dark uppercase tracking-wider mb-2">
                Meals (>4h Overtime)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  id="mealAllowanceExtra" 
                  className="w-full p-2.5 border border-edge-mid rounded-md shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-ink-primary bg-white transition-all"
                  value={allowances.mealAllowanceExtra} min="0"
                  onChange={(e) => handleAllowanceChange('mealAllowanceExtra', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-muted uppercase">Qty</span>
              </div>
            </div>
          )}
          {allowanceConfig?.motorVehiclePerKm != null && (
            <div>
              <label htmlFor="motorVehicleKm" className="block text-xs font-bold text-brand-teal-dark uppercase tracking-wider mb-2">
                Vehicle Usage
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  id="motorVehicleKm" 
                  className="w-full p-2.5 border border-edge-mid rounded-md shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-ink-primary bg-white transition-all"
                  value={allowances.motorVehicleKm} min="0"
                  onChange={(e) => handleAllowanceChange('motorVehicleKm', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-muted uppercase">KM</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Allowances;
