import React from 'react';
import { render, screen } from '@testing-library/react';
import EmployeeDetails from './EmployeeDetails';

const pharmacyClassifications = [
  { id: 'pharmacy-assistant-1', name: 'Pharmacy Assistant Level 1' },
  { id: 'pharmacist', name: 'Pharmacist' },
  { id: 'above-award', name: 'Above Award' },
];
const retailClassifications = [
  { id: 'retail-employee-1', name: 'Retail Employee Level 1' },
  { id: 'retail-supervisor', name: 'Retail Supervisor' },
  { id: 'above-award', name: 'Above Award' },
];
const ageOptions = [
  { id: 'adult', name: 'Adult (21 years and over)' },
  { id: 'under-16', name: 'Under 16 years' },
];
const defaultProps = {
  classification: 'pharmacy-assistant-1',
  setClassification: jest.fn(),
  employmentType: 'full-time',
  setEmploymentType: jest.fn(),
  age: 'adult',
  setAge: jest.fn(),
  customRate: '',
  setCustomRate: jest.fn(),
  classifications: pharmacyClassifications,
  ageOptions,
  juniorClassificationIds: ['pharmacy-assistant-1'],
};

describe('EmployeeDetails', () => {
  it('renders classification options from the classifications prop', () => {
    render(<EmployeeDetails {...defaultProps} />);
    expect(screen.getByText('Pharmacy Assistant Level 1')).toBeInTheDocument();
    expect(screen.getByText('Pharmacist')).toBeInTheDocument();
  });

  it('renders Retail classifications when passed retail data', () => {
    render(<EmployeeDetails {...defaultProps} classifications={retailClassifications} classification="retail-employee-1" />);
    expect(screen.getByText('Retail Employee Level 1')).toBeInTheDocument();
    expect(screen.getByText('Retail Supervisor')).toBeInTheDocument();
    expect(screen.queryByText('Pharmacist')).not.toBeInTheDocument();
  });

  it('disables age dropdown when classification is not in juniorClassificationIds', () => {
    render(<EmployeeDetails {...defaultProps} classification="pharmacist" />);
    expect(screen.getByLabelText(/Age/i)).toBeDisabled();
  });

  it('enables age dropdown when classification is in juniorClassificationIds', () => {
    render(<EmployeeDetails {...defaultProps} classification="pharmacy-assistant-1" />);
    expect(screen.getByLabelText(/Age/i)).not.toBeDisabled();
  });
});
