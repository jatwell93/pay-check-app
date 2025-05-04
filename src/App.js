import React, { useState } from 'react';
import { Button, ButtonGroup, ToggleButton } from 'react-bootstrap';
import EmployeeDetails from './components/EmployeeDetails';
import Allowances from './components/Allowances';
import PaySummary from './components/PaySummary'; 
import WorkHours from './components/WorkHours'; 
import DetailedBreakdown from './components/DetailedBreakdown';
import { calculatePayForTimePeriod, weekDays } from './helpers';

const getPenaltyDescription = (segmentDay, timeString, penaltyRate) => {
    if (segmentDay === 'Saturday' && penaltyRate === 1.5) {
        return 'Saturday (Time and a half)';
    }
    if (segmentDay === 'Sunday' && penaltyRate === 2) {
        return 'Sunday (Double Time)';
    }
    if (segmentDay === 'Public Holiday' && penaltyRate === 2.5) {
        return 'Public Holiday (Double Time and a half)';
    }
    if ((segmentDay === 'Monday' || segmentDay === 'Tuesday' || segmentDay === 'Wednesday' || segmentDay === 'Thursday' || segmentDay === 'Friday' ) && timeString >= '00:00' && timeString <= '07:00' && penaltyRate === 1.25) {
      return `${segmentDay} (Early Morning Shift)`
    }
    if ((segmentDay === 'Monday' || segmentDay === 'Tuesday' || segmentDay === 'Wednesday' || segmentDay === 'Thursday' || segmentDay === 'Friday' )&& timeString >= '19:00' && timeString < '00:00' && penaltyRate === 1.25) {
      return `${segmentDay} (Evening Shift)`
    }
    if (timeString >= '00:00' && timeString <= '07:00' && penaltyRate === 1.25) {
        return 'Early Morning Shift';
    }
    if (timeString >= '19:00' && timeString < '00:00' && penaltyRate === 1.25) {
        return 'Evening Shift';
    }
    if (penaltyRate === 1) return 'Normal rate';
    return '';
};

const pharmacyAwardRates = {
  fullTimePartTime: {
    'pharmacy-assistant-1': { base: 25.99 },
    'pharmacy-assistant-2': { base: 26.87 },
    'pharmacy-assistant-3': { base: 27.94 },
    'pharmacy-assistant-4': { base: 29.03 },
    'pharmacy-technician-1': { base: 30.21 },
    'pharmacy-technician-2': { base: 31.15 },
    'pharmacy-technician-3': { base: 32.36 },
    'pharmacy-technician-4': { base: 33.15 },
    'pharmacy-student-1': { base: 25.99 },
    'pharmacy-student-2': { base: 25.99 },
    'pharmacy-student-3': { base: 25.99 },
    'pharmacy-student-4': { base: 25.99 },
    'pharmacy-intern-1': { base: 28.66 },
    'pharmacy-intern-2': { base: 29.63 },
    'pharmacist': { base: 35.20 },
    'experienced-pharmacist': { base: 38.56 },
    'pharmacist-in-charge': { base: 39.46 },
    'pharmacist-manager': { base: 43.97 },
  },
  casual: {
    'pharmacy-assistant-1': { base: 32.49 },
    'pharmacy-assistant-2': { base: 33.59 },
    'pharmacy-assistant-3': { base: 34.93 },
    'pharmacy-assistant-4': { base: 36.29 },
    'pharmacy-technician-1': { base: 37.76 },
    'pharmacy-technician-2': { base: 38.94 },
    'pharmacy-technician-3': { base: 40.45 },
    'pharmacy-technician-4': { base: 41.44 },
    'pharmacy-student-1': { base: 32.49 },
    'pharmacy-student-2': { base: 32.49 },
    'pharmacy-student-3': { base: 32.49 },
    'pharmacy-student-4': { base: 32.49 },
    'pharmacy-intern-1': { base: 35.83 },
    'pharmacy-intern-2': { base: 37.04 },
    'pharmacist': { base: 44.00 },
    'experienced-pharmacist': { base: 48.20 },
    'pharmacist-in-charge': { base: 49.33 },
    'pharmacist-manager': { base: 54.96 },
  },
  juniorPercentages: {
    'under-16': 0.45,
    'age-16': 0.5,
    'age-17': 0.6,
    'age-18': 0.7,
    'age-19': 0.8,
    'age-20': 0.9,
  },
  allowances: {
    homeMedicineReview: 17.96,
    laundryFullTime: 17.15,
    laundryPartTimeCasual: 3.43,
    brokenHill: 47.80,
    motorVehiclePerKm: 0.99,
    mealAllowanceOvertime: 19.62,
    mealAllowanceOvertimeExtra: 16.78,
  },
};

const App = () => {
  const [classification, setClassification] = useState('pharmacy-assistant-1');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [customRate, setCustomRate] = useState('');
  const [age, setAge] = useState('adult');    const [weeklyData, setWeeklyData] = useState(
    weekDays.map(day => ({
        day:day,
        startTime: '',
        endTime: '',
        publicHoliday: false
    }))
  );
    const [allowances, setAllowances] = useState({homeMedicineReview: false,
    laundry: false, brokenHill: false, mealAllowance: 0, mealAllowanceExtra: 0,
    motorVehicleKm: 0
  });
  
  const [results, setResults] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Handle time input changes
  const handleTimeChange = (index, field, value) => {
    const newWeeklyData = [...weeklyData];
    newWeeklyData[index][field] = value;
    setWeeklyData(newWeeklyData);
  };

  // Handle public holiday toggle
  const handlePublicHolidayChange = (index) => {
    const newWeeklyData = [...weeklyData];
    newWeeklyData[index].publicHoliday = !newWeeklyData[index].publicHoliday;
    if (newWeeklyData[index].publicHoliday) {
      newWeeklyData[index].day = 'Public Holiday';
    } else {
      newWeeklyData[index].day = weekDays[index]; // Access weekDays as an array
    }
    
    setWeeklyData(newWeeklyData);

  };

  // Handle allowance changes
  const handleAllowanceChange = (field, value) => {
    setAllowances({
      ...allowances,
      [field]: field === 'motorVehicleKm' || field.startsWith('meal') ? parseFloat(value) || 0 : value
    });
  };

  // Calculate weekly pay
      const calculatePay = () => {
        let baseRate;
        if (classification === 'above-award') {
          if(customRate){
          baseRate = parseFloat(customRate);
          } else{
            baseRate = 0
          }
        } else {
          baseRate = employmentType === "casual" ? pharmacyAwardRates.casual[classification]?.base : pharmacyAwardRates.fullTimePartTime[classification]?.base || 0;
        }
    // Apply junior rates if applicable (only for pharmacy assistants levels 1 and 2)
    if ((classification === 'pharmacy-assistant-1' || classification === 'pharmacy-assistant-2') && age !== 'adult') {
        const juniorPercentage = pharmacyAwardRates.juniorPercentages[age];
        baseRate = baseRate * juniorPercentage / (employmentType === "casual" ? 1.25 : 1); // Adjust for casual loading
      if (employmentType === 'casual') {
        baseRate = baseRate * 1.25; // Reapply casual loading to adjusted base
      }
    }
    
    let totalHours = 0;
    let totalPay = 0;
    let dailyBreakdown = [];
    let overtimeHours = 0;
    let overtimePay = 0; 
    
    // Calculate pay for each day
    weeklyData.forEach(dayData => {
        if (dayData.startTime && dayData.endTime) {
            const dayResult = calculatePayForTimePeriod(
                dayData.day,
                dayData.startTime,
                dayData.endTime,
                baseRate,
                employmentType
            ,
            customRate,
                getPenaltyDescription);
        
        totalHours += dayResult.hours;
        totalPay += dayResult.pay;
        
        dailyBreakdown.push({
          day: dayData.day,
          startTime: dayData.startTime,
          endTime: dayData.endTime,
          hours: dayResult.hours,
          pay: dayResult.pay,
          segments: dayResult.breakdown
        });
      }
    })
    
    // Calculate overtime (for full-time and part-time employees)
        if (employmentType !== "casual" && totalHours > 38) {
            overtimeHours = totalHours - 38;
            // Apply first 2 hours at time and a half, remainder at double time
            // This is simplified - actual overtime depends on when it was worked
            const first2Hours = Math.min(overtimeHours, 2);
            const remainingHours = overtimeHours - first2Hours;
      
            // Use non-casual base rate for overtime
            const nonCasualBaseRate = pharmacyAwardRates.fullTimePartTime[classification].base;
      
      overtimePay = (first2Hours * nonCasualBaseRate * 1.5) + 
        (remainingHours * nonCasualBaseRate * 2);
      
      // Subtract overtime hours from total pay (they'll be added back with overtime rates)
      totalPay = totalPay - (overtimeHours * baseRate);
    }
    
    // Calculate allowances
    let totalAllowances = 0;
    let allowanceBreakdown = [];
    
    if (allowances.homeMedicineReview) {
            totalAllowances += pharmacyAwardRates.allowances.homeMedicineReview;
            allowanceBreakdown.push({
                name: 'Home Medicine Reviews',
                amount: pharmacyAwardRates.allowances.homeMedicineReview
            });
        }
    
        if (allowances.laundry) {
            const laundryAmount = employmentType === "full-time" ? pharmacyAwardRates.allowances.laundryFullTime : pharmacyAwardRates.allowances.laundryPartTimeCasual * dailyBreakdown.length;
            totalAllowances += laundryAmount;
            allowanceBreakdown.push({
                name: 'Laundry Allowance',
                amount: laundryAmount
            });
        }
    
        if (allowances.brokenHill) {
            totalAllowances += pharmacyAwardRates.allowances.brokenHill;
            allowanceBreakdown.push({
                name: 'Broken Hill Allowance',
                amount: pharmacyAwardRates.allowances.brokenHill
            });
        }
    
        if (allowances.motorVehicleKm > 0) {
            const vehicleAmount = allowances.motorVehicleKm * pharmacyAwardRates.allowances.motorVehiclePerKm;
            totalAllowances += vehicleAmount;
            allowanceBreakdown.push({
                name: 'Motor Vehicle Allowance',
                amount: vehicleAmount
            });
        }
    
        if (allowances.mealAllowance > 0) {
            const mealAmount = allowances.mealAllowance * pharmacyAwardRates.allowances.mealAllowanceOvertime;
            totalAllowances += mealAmount;
            allowanceBreakdown.push({
                name: 'Meal Allowance (Overtime)',
                amount: mealAmount
            });
        }
    
        if (allowances.mealAllowanceExtra > 0) {
            const mealExtraAmount = allowances.mealAllowanceExtra * pharmacyAwardRates.allowances.mealAllowanceOvertimeExtra;
            totalAllowances += mealExtraAmount;
            allowanceBreakdown.push({
                name: 'Extra Meal Allowance (Overtime > 4 hours)',
                amount: mealExtraAmount
            });
        }
    
    // Set results
    setResults({
      baseRate,
      totalHours,
      totalPay,
      overtimeHours,
      overtimePay,
      allowances: totalAllowances,
      total: totalPay + overtimePay + totalAllowances,
      dailyBreakdown,
      allowanceBreakdown
    });
  };

  const radios = [
    { name: 'Public Holiday', value: true },
    { name: 'Regular Day', value: false },
  ];

  const [radioValue, setRadioValue] = useState(false); // Initialize with false for 'Regular Day'


  const handleRadioChange = (index, value) => {
    handlePublicHolidayChange(index); // Toggle public holiday status
    setRadioValue(value); // Update the selected radio button value
  };


  return (<div className="container">
        <header className="text-center">
          <h1 className="text-center">Employee Payroll</h1>
          <p>Check if you're being paid correctly under the Pharmacy Industry Award (MA000012)</p>
        </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 section">
        <EmployeeDetails classification={classification} setClassification={setClassification} employmentType={employmentType} setEmploymentType={setEmploymentType} age={age} setAge={setAge} customRate={customRate} setCustomRate={setCustomRate}/>
        <Allowances allowances={allowances} handleAllowanceChange={handleAllowanceChange} classification={classification}/>
          <PaySummary results={results} setShowDetails={setShowDetails} showDetails={showDetails}/>
      </div> 
      
      
        {/* Work Hours and Public Holiday Selectors */}
        <div className="mb-8 p-4 section">
          <h2 className="section-header">Work Hours</h2>
          {weeklyData.map((dayData, index) => (
            <div key={index} className="mb-4 p-4 border rounded">
              <h3>{weekDays[index]}</h3>
              <div className="mb-2">
                <label htmlFor={`startTime-${index}`} className="mr-2">Start Time:</label>
                <input type="time" id={`startTime-${index}`} value={dayData.startTime} onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)} />
              </div>
              <div className="mb-2">
                <label htmlFor={`endTime-${index}`} className="mr-2">End Time:</label>
                <input type="time" id={`endTime-${index}`} value={dayData.endTime} onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)} />
              </div>
              {/* Public Holiday Selector */}
              <div className="mb-2">
                  <ButtonGroup>
                    {radios.map((radio, idx) => (
                      <ToggleButton key={idx} id={`radio-${index}-${idx}`} type="radio" variant={idx % 2 ? 'outline-success' : 'outline-danger'} name={`radio-${index}`} value={radio.value} checked={dayData.publicHoliday === radio.value} onChange={() => handleRadioChange(index,radio.value)}> {radio.name} </ToggleButton>
                    ))}
                  </ButtonGroup>
              </div>
            </div>
          ))}
        </div>
        


      <div className="d-grid gap-2">
          <Button variant="primary" size="lg" onClick={calculatePay}>Calculate</Button>
      </div>      <DetailedBreakdown results={results} showDetails={showDetails}/>
      
      {/* Important Notes */}
      <div className="mb-8 p-4  section"> 
        <h2 className='section-header'>Important Notes</h2>
        <ul >
          <li>This calculator is based on the Pharmacy Industry Award (MA000012) effective July 1, 2024.</li>
          <li>For overnight shifts, enter times normally (e.g., 10:00 PM to 6:00 AM).</li>
          <li>Overtime is calculated based on weekly hours exceeding 38 hours for full-time and part-time employees.</li>
          <li>Junior rates only apply to Pharmacy Assistants Level 1 and 2.</li>
          <li>This calculator provides an estimate only. Always refer to the full award for specific circumstances.</li>
          <li>Some complex award provisions (such as rostering requirements and meal breaks) may not be fully reflected.</li>
        </ul>
      </div>
      
      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm">
        <p>This calculator is provided for informational purposes only and should not be considered legal advice.</p>
        <p>Always consult the <a href="https://www.fairwork.gov.au/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Fair Work Ombudsman</a> or a legal professional for specific employment advice.</p>
      </footer>
    </div>
  );
  
};

// Make sure to export the App component as default
export default App;