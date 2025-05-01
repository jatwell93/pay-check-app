import React, { useState } from 'react';
import { format, parse, differenceInMinutes, isAfter } from 'date-fns';

// Pharmacy Award pay rates as of July 2024
const pharmacyAwardRates = {
  fullTimePartTime: {
    // Full-time & part-time base rates
    'pharmacy-assistant-1': { base: 25.65 },
    'pharmacy-assistant-2': { base: 26.24 },
    'pharmacy-assistant-3': { base: 27.17 },
    'pharmacy-assistant-4': { base: 28.28 },
    'pharmacy-student-1': { base: 25.65 },
    'pharmacy-student-2': { base: 26.24 },
    'pharmacy-student-3': { base: 27.17 },
    'pharmacy-student-4': { base: 28.28 },
    'pharmacy-intern-1': { base: 28.66 },
    'pharmacy-intern-2': { base: 29.63 },
    'pharmacist': { base: 35.20 },
    'experienced-pharmacist': { base: 38.56 },
    'pharmacist-in-charge': { base: 39.46 },
    'pharmacist-manager': { base: 43.97 }
  },
  casual: {
    // Casual rates (25% loading already applied)
    'pharmacy-assistant-1': { base: 32.06 },
    'pharmacy-assistant-2': { base: 32.80 },
    'pharmacy-assistant-3': { base: 33.96 },
    'pharmacy-assistant-4': { base: 35.35 },
    'pharmacy-student-1': { base: 32.06 },
    'pharmacy-student-2': { base: 32.80 },
    'pharmacy-student-3': { base: 33.96 },
    'pharmacy-student-4': { base: 35.35 },
    'pharmacy-intern-1': { base: 35.83 },
    'pharmacy-intern-2': { base: 37.04 },
    'pharmacist': { base: 44.00 },
    'experienced-pharmacist': { base: 48.20 },
    'pharmacist-in-charge': { base: 49.33 },
    'pharmacist-manager': { base: 54.96 }
  },
  juniorPercentages: {
    'under-16': 0.45,
    '16': 0.5,
    '17': 0.6,
    '18': 0.7,
    '19': 0.8,
    '20': 0.9
  },
  // Penalty rates as multipliers of base rate
  penaltyRates: {
    fullTimePartTime: {
      weekdayMorning: 1.5, // 7-8am
      weekdayEvening: 1.25, // 7-9pm
      weekdayNight: 1.5, // 9pm-midnight
      saturdayMorning: 2.0, // 7-8am
      saturdayDay: 1.25, // 8am-6pm
      saturdayEvening: 1.5, // 6-9pm
      saturdayNight: 1.75, // 9pm-midnight
      sundayDay: 1.5, // 7am-9pm
      sundayNight: 2.0, // before 7am and after 9pm
      publicHoliday: 2.25
    },
    casual: {
      weekdayMorning: 1.75, // 7-8am
      weekdayEvening: 1.5, // 7-9pm
      weekdayNight: 1.75, // 9pm-midnight
      saturdayMorning: 2.25, // 7-8am
      saturdayDay: 1.5, // 8am-6pm
      saturdayEvening: 1.75, // 6-9pm
      saturdayNight: 2.0, // 9pm-midnight
      sundayDay: 1.75, // 7am-9pm
      sundayNight: 2.25, // before 7am and after 9pm
      publicHoliday: 2.5
    }
  },
  overtimeRates: {
    mondayToSaturdayFirst2Hours: 1.5,
    mondayToSaturdayAfter2Hours: 2.0,
    sunday: 2.0,
    publicHoliday: 2.5
  },
  allowances: {
    homeMedicineReview: 106.40, // per week
    laundryFullTime: 6.25, // per week
    laundryPartTimeCasual: 1.25, // per shift
    mealAllowanceOvertime: 23.14,
    mealAllowanceOvertimeExtra: 20.74,
    motorVehiclePerKm: 0.99,
    brokenHill: 44.18 // per week
  }
};

const classifications = [
  { id: 'pharmacy-assistant-1', name: 'Pharmacy Assistant Level 1' },
  { id: 'pharmacy-assistant-2', name: 'Pharmacy Assistant Level 2' },
  { id: 'pharmacy-assistant-3', name: 'Pharmacy Assistant Level 3' },
  { id: 'pharmacy-assistant-4', name: 'Pharmacy Assistant Level 4' },
  { id: 'pharmacy-student-1', name: 'Pharmacy Student - 1st year of course' },
  { id: 'pharmacy-student-2', name: 'Pharmacy Student - 2nd year of course' },
  { id: 'pharmacy-student-3', name: 'Pharmacy Student - 3rd year of course' },
  { id: 'pharmacy-student-4', name: 'Pharmacy Student - 4th year of course' },
  { id: 'pharmacy-intern-1', name: 'Pharmacy Intern - 1st half of training' },
  { id: 'pharmacy-intern-2', name: 'Pharmacy Intern - 2nd half of training' },
  { id: 'pharmacist', name: 'Pharmacist' },
  { id: 'experienced-pharmacist', name: 'Experienced Pharmacist' },
  { id: 'pharmacist-in-charge', name: 'Pharmacist in Charge' },
  { id: 'pharmacist-manager', name: 'Pharmacist Manager' }
];

const ageOptions = [
  { id: 'adult', name: 'Adult (21 years and over)' },
  { id: 'under-16', name: 'Under 16 years' },
  { id: '16', name: '16 years' },
  { id: '17', name: '17 years' },
  { id: '18', name: '18 years' },
  { id: '19', name: '19 years' },
  { id: '20', name: '20 years' }
];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Function to get penalty rate based on day and time
const getPenaltyRate = (day, time, employmentType) => {
  const hours = parseInt(time.split(':')[0], 10);
  const rates = pharmacyAwardRates.penaltyRates[employmentType === 'casual' ? 'casual' : 'fullTimePartTime'];
  
  if (day === 'Public Holiday') return rates.publicHoliday;
  
  if (day === 'Saturday') {
    if (hours < 8) return rates.saturdayMorning;
    if (hours < 18) return rates.saturdayDay;
    if (hours < 21) return rates.saturdayEvening;
    return rates.saturdayNight;
  }
  
  if (day === 'Sunday') {
    if (hours < 7 || hours >= 21) return rates.sundayNight;
    return rates.sundayDay;
  }
  
  // Weekday
  if (hours < 8 && hours >= 7) return rates.weekdayMorning;
  if (hours >= 19 && hours < 21) return rates.weekdayEvening;
  if (hours >= 21) return rates.weekdayNight;
  
  // Regular weekday hours
  return 1.0;
};

// Get description for penalty rate
const getPenaltyDescription = (day, time, rate) => {
  const hours = parseInt(time.split(':')[0], 10);
  
  if (day === 'Public Holiday') return 'Public holiday';
  
  if (day === 'Saturday') {
    if (hours < 8) return 'Saturday morning (7am-8am)';
    if (hours < 18) return 'Saturday (8am-6pm)';
    if (hours < 21) return 'Saturday evening (6pm-9pm)';
    return 'Saturday night (9pm-midnight)';
  }
  
  if (day === 'Sunday') {
    if (hours < 7 || hours >= 21) return 'Sunday (before 7am or after 9pm)';
    return 'Sunday (7am-9pm)';
  }
  
  // Weekday
  if (hours < 8 && hours >= 7) return 'Weekday morning (7am-8am)';
  if (hours >= 19 && hours < 21) return 'Weekday evening (7pm-9pm)';
  if (hours >= 21) return 'Weekday night (9pm-midnight)';
  
  return 'Ordinary hours';
};

const App = () => {
  const [classification, setClassification] = useState('pharmacy-assistant-1');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [age, setAge] = useState('adult');
  const [weeklyData, setWeeklyData] = useState(
    weekDays.map(day => ({
      day,
      startTime: '',
      endTime: '',
      publicHoliday: false
    }))
  );
  const [allowances, setAllowances] = useState({
    homeMedicineReview: false,
    laundry: false,
    brokenHill: false,
    mealAllowance: 0,
    mealAllowanceExtra: 0,
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
      newWeeklyData[index].day = weekDays[index];
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

  // Calculate pay for a time period
  const calculatePayForTimePeriod = (day, startTime, endTime, baseRate, employmentType) => {
    if (!startTime || !endTime) return { hours: 0, pay: 0, breakdown: [] };
    
    // Parse times
    const baseDate = new Date();
    let start = parse(startTime, 'HH:mm', baseDate);
    let end = parse(endTime, 'HH:mm', baseDate);
    
    // Handle overnight shifts
    let isOvernight = false;
    if (isAfter(start, end)) {
      end = new Date(end.setDate(end.getDate() + 1));
      isOvernight = true;
    }
    
    // Calculate total minutes and hours
    const totalMinutes = differenceInMinutes(end, start);
    const totalHours = totalMinutes / 60;
    
    // For detailed breakdown, we'll calculate pay for each hour segment
    let currentTime = new Date(start);
    let breakdown = [];
    let totalPay = 0;
    
    while (currentTime < end) {
      // Set end of current segment (1 hour or until shift end)
      let segmentEnd = new Date(currentTime);
      segmentEnd.setHours(currentTime.getHours() + 1);
      if (segmentEnd > end) segmentEnd = new Date(end);
      
      const segmentMinutes = differenceInMinutes(segmentEnd, currentTime);
      const segmentHours = segmentMinutes / 60;
      
      // Determine which day this segment falls on
      const segmentDay = isOvernight && currentTime.getDate() !== start.getDate() ? 
        (day === 'Public Holiday' ? day : (day === 'Sunday' ? 'Monday' : weekDays[weekDays.indexOf(day) + 1])) : day;
      
      // Get applicable penalty rate
      const timeString = format(currentTime, 'HH:mm');
      const penaltyRate = getPenaltyRate(segmentDay, timeString, employmentType);
      
      // Calculate pay for this segment
      const segmentPay = baseRate * penaltyRate * segmentHours;
      totalPay += segmentPay;
      
      breakdown.push({
        startTime: format(currentTime, 'HH:mm'),
        endTime: format(segmentEnd, 'HH:mm'),
        day: segmentDay,
        hours: segmentHours,
        rate: baseRate * penaltyRate,
        penaltyDescription: getPenaltyDescription(segmentDay, timeString, penaltyRate),
        pay: segmentPay
      });
      
      // Move to next segment
      currentTime = new Date(segmentEnd);
    }
    
    return { 
      hours: totalHours, 
      pay: totalPay,
      breakdown
    };
  };

  // Calculate weekly pay
  const calculatePay = () => {
    // Get base rate based on classification and employment type
    let baseRate = employmentType === 'casual' 
      ? pharmacyAwardRates.casual[classification].base 
      : pharmacyAwardRates.fullTimePartTime[classification].base;
    
    // Apply junior rates if applicable (only for pharmacy assistants levels 1 and 2)
    if ((classification === 'pharmacy-assistant-1' || classification === 'pharmacy-assistant-2') && age !== 'adult') {
      const juniorPercentage = pharmacyAwardRates.juniorPercentages[age];
      baseRate = baseRate * juniorPercentage / (employmentType === 'casual' ? 1.25 : 1); // Adjust for casual loading
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
        );
        
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
    });
    
    // Calculate overtime (for full-time and part-time employees)
    if (employmentType !== 'casual' && totalHours > 38) {
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
      const laundryAmount = employmentType === 'full-time' 
        ? pharmacyAwardRates.allowances.laundryFullTime
        : pharmacyAwardRates.allowances.laundryPartTimeCasual * dailyBreakdown.length;
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
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <header className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-blue-800">Pharmacy Award Pay Calculator</h1>
        <p className="text-gray-600">Check if you're being paid correctly under the Pharmacy Industry Award (MA000012)</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Employee Details */}
        <div className="md:col-span-1 p-4 border rounded-md bg-gray-50">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Employee Details</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="classification">
              Classification
            </label>
            <select
              id="classification"
              className="w-full p-2 border rounded"
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
            >
              {classifications.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Employment Type
            </label>
            <div className="flex space-x-4">
              {['full-time', 'part-time', 'casual'].map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="employmentType"
                    value={type}
                    checked={employmentType === type}
                    onChange={() => setEmploymentType(type)}
                    className="mr-2"
                  />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="age">
              Age
            </label>
            <select
              id="age"
              className="w-full p-2 border rounded"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              disabled={!['pharmacy-assistant-1', 'pharmacy-assistant-2'].includes(classification)}
            >
              {ageOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            {!['pharmacy-assistant-1', 'pharmacy-assistant-2'].includes(classification) && (
              <p className="text-xs text-gray-500 mt-1">Junior rates only apply to Pharmacy Assistants Level 1 and 2</p>
            )}
          </div>
        </div>
        
        {/* Allowances */}
        <div className="md:col-span-1 p-4 border rounded-md bg-gray-50">
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
          </div>
        </div>
        
        {/* Results Summary */}
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
      </div>
      {/* Work Hours */}
      <div className="mb-8 p-4 border rounded-md bg-gray-50">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Work Hours</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Day</th>
                <th className="p-2 text-left">Start Time</th>
                <th className="p-2 text-left">End Time</th>
                <th className="p-2 text-left">Public Holiday?</th>
              </tr>
            </thead>
            <tbody>
              {weeklyData.map((day, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{day.day}</td>
                  <td className="p-2">
                    <input
                      type="time"
                      className="border rounded p-1 w-full"
                      value={day.startTime}
                      onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="time"
                      className="border rounded p-1 w-full"
                      value={day.endTime}
                      onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={day.publicHoliday}
                      onChange={() => handlePublicHolidayChange(index)}
                      className="mr-2"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={calculatePay}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
          >
            Calculate Pay
          </button>
        </div>
      </div>
      
      {/* Detailed Breakdown */}
      {results && showDetails && (
        <div className="mb-8 p-4 border rounded-md bg-gray-50">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Detailed Breakdown</h2>
          
          {/* Daily Breakdown */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-blue-600">Daily Pay</h3>
            
            {results.dailyBreakdown.map((day, index) => (
              <div key={index} className="mb-4 p-3 border rounded bg-white">
                <h4 className="font-medium text-lg">{day.day} (${day.pay.toFixed(2)})</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {day.startTime} - {day.endTime} ({day.hours.toFixed(2)} hours)
                </p>
                
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-1 text-left">Time</th>
                      <th className="p-1 text-left">Hours</th>
                      <th className="p-1 text-left">Rate Type</th>
                      <th className="p-1 text-right">Rate</th>
                      <th className="p-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.segments.map((segment, segIndex) => (
                      <tr key={segIndex} className="border-b">
                        <td className="p-1">{segment.startTime} - {segment.endTime}</td>
                        <td className="p-1">{segment.hours.toFixed(2)}</td>
                        <td className="p-1">{segment.penaltyDescription}</td>
                        <td className="p-1 text-right">${segment.rate.toFixed(2)}</td>
                        <td className="p-1 text-right">${segment.pay.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          
          {/* Overtime Breakdown */}
          {results.overtimeHours > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-blue-600">Overtime</h3>
              <div className="p-3 border rounded bg-white">
                <p>{results.overtimeHours.toFixed(2)} hours over standard 38 hours</p>
                <p>First 2 hours at time and a half, remaining at double time</p>
                <p className="font-medium mt-2">Total overtime: ${results.overtimePay.toFixed(2)}</p>
              </div>
            </div>
          )}
          
          {/* Allowances Breakdown */}
          {results.allowances > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-blue-600">Allowances</h3>
              <div className="p-3 border rounded bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Allowance</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.allowanceBreakdown.map((allowance, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{allowance.name}</td>
                        <td className="p-2 text-right">${allowance.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="font-medium">
                      <td className="p-2">Total</td>
                      <td className="p-2 text-right">${results.allowances.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Important Notes */}
      <div className="mb-8 p-4 border rounded-md bg-yellow-50">
        <h2 className="text-xl font-semibold mb-2 text-yellow-800">Important Notes</h2>
        <ul className="list-disc pl-5 space-y-1">
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