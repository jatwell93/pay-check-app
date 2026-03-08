import React from 'react';
import { render, screen } from '@testing-library/react';
import Allowances from './Allowances';

const pharmacyAllowanceConfig = {
  homeMedicineReview: 17.96, laundryFullTime: 17.15,
  laundryPartTimeCasual: 3.43, brokenHill: 47.80,
  motorVehiclePerKm: 0.99, mealAllowanceOvertime: 19.62,
  mealAllowanceOvertimeExtra: 16.78,
};
const retailAllowanceConfig = {
  mealAllowanceOvertime: 16.65, motorVehiclePerKm: 0.99,
};
const defaultAllowances = {
  homeMedicineReview: false, laundry: false, brokenHill: false,
  mealAllowance: 0, mealAllowanceExtra: 0, motorVehicleKm: 0,
};
const noop = jest.fn();

describe('Allowances', () => {
  it('renders all Pharmacy allowance sections when given Pharmacy config', () => {
    render(<Allowances allowances={defaultAllowances} handleAllowanceChange={noop}
      classification="pharmacist" allowanceConfig={pharmacyAllowanceConfig} />);
    expect(screen.getByLabelText(/Home Medicine Reviews/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Laundry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Broken Hill/i)).toBeInTheDocument();
  });

  it('does NOT render Home Medicine Reviews for Retail config', () => {
    render(<Allowances allowances={defaultAllowances} handleAllowanceChange={noop}
      classification="retail-employee-1" allowanceConfig={retailAllowanceConfig} />);
    expect(screen.queryByLabelText(/Home Medicine Reviews/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Laundry/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Broken Hill/i)).not.toBeInTheDocument();
  });

  it('renders meal allowance for Retail config', () => {
    render(<Allowances allowances={defaultAllowances} handleAllowanceChange={noop}
      classification="retail-employee-1" allowanceConfig={retailAllowanceConfig} />);
    expect(screen.getByLabelText(/Meal Allowance/i)).toBeInTheDocument();
  });
});
