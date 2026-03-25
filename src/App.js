import React, { useState, useEffect } from 'react';
import EmployeeDetails from './components/EmployeeDetails';
import Allowances from './components/Allowances';
import OverviewBreakdown from './components/OverviewBreakdown';
import WorkHours from './components/WorkHours';
import AwardSelector from './components/AwardSelector';
import ImportantNotes from './components/ImportantNotes';
import { calculatePayForTimePeriod, weekDays } from './helpers';
import { fetchAwardRates, getCachedAwardRates, getLastCacheUpdateTime, clearCache } from './services/awardRatesService';
import { getAwardConfig } from './config/awardConfig';



const AWARD_IDS = ['MA000012', 'MA000003', 'MA000009'];

const awardMetadata = {
  'MA000012': { name: 'Pharmacy Industry Award' },
  'MA000003': { name: 'General Retail Industry Award' },
  'MA000009': { name: 'Hospitality Industry (General) Award' },
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
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [actualPaidByDay, setActualPaidByDay] = useState([]);
  const [totalActualPaid, setTotalActualPaid] = useState('');

  // Award selector state
  const [selectedAward, setSelectedAward] = useState('MA000012');
  const [awardRates, setAwardRates] = useState(null);
  const [awardLoading, setAwardLoading] = useState(true);
  const [awardError, setAwardError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [awardSuccessMessage, setAwardSuccessMessage] = useState(null);

  // Initialize award rates: load from cache or fetch from API
  useEffect(() => {
    const initializeAwardRates = async () => {
      // Check cache for all 3 awards
      const cachedRates = {};
      let allCached = true;
      AWARD_IDS.forEach(id => {
        const cached = getCachedAwardRates(id);
        if (cached) { cachedRates[id] = cached; }
        else { allCached = false; }
      });

      if (allCached) {
        setAwardRates(cachedRates);
        setLastUpdated(getLastCacheUpdateTime(AWARD_IDS[0]));
        setAwardLoading(false);
        return;
      }

      // Fetch from API
      try {
        const fetched = await fetchAwardRates(AWARD_IDS);
        setAwardRates(fetched);
        setLastUpdated(getLastCacheUpdateTime(AWARD_IDS[0]));
        setAwardError(null);
      } catch (err) {
        // Partial cache fallback (some awards cached, not all)
        if (Object.keys(cachedRates).length > 0) {
          setAwardRates(cachedRates);
          setLastUpdated(getLastCacheUpdateTime(AWARD_IDS[0]));
          setAwardError("Couldn't load award rates. Using cached rates — Refresh to try again.");
        } else {
          // No cache at all: awardConfig.js is the source of truth for calculations
          setAwardRates({});
          setAwardError("Couldn't load award rates. Using Pharmacy defaults — Refresh to try again.");
        }
      } finally {
        setAwardLoading(false);
      }
    };
    initializeAwardRates();
  }, []);

  // Refresh rates handler
  const handleRefreshRates = async () => {
    setAwardLoading(true);
    setAwardError(null);
    try {
      clearCache();  // D-03: clear all award caches before fetching to force fresh API call
      const fetched = await fetchAwardRates(AWARD_IDS);
      setAwardRates(fetched);
      setLastUpdated(getLastCacheUpdateTime(AWARD_IDS[0]));
      setAwardError(null);
      setAwardSuccessMessage('Rates updated');
      setTimeout(() => setAwardSuccessMessage(null), 3000);
    } catch (err) {
      setAwardError("Couldn't connect to Fair Work Commission — using saved rates");  // D-08
    } finally {
      setAwardLoading(false);
    }
  };

  // Award switch handler: resets classification and results, preserves shift hours
  const handleSelectAward = (awardId) => {
    setSelectedAward(awardId);
    const newConfig = getAwardConfig(awardId);
    setClassification(newConfig.classifications[0].id);
    setResults(null); // Clear calculated results
    // weeklyData (shift hours) is preserved intentionally
  };

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
      newWeeklyData[index].day = 'Public Holiday'
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
        // Use live rates from state if available; fall back to hardcoded awardConfig.js.
        // Guard for baseRates shape — raw FWC payRates array won't have it until
        // the transformation layer is built in a future phase.
        const selectedAwardConfig = (awardRates && awardRates[selectedAward]?.baseRates)
          ? awardRates[selectedAward]
          : getAwardConfig(selectedAward);
        let baseRate;
        if (classification === 'above-award') {
          if(customRate){
          baseRate = parseFloat(customRate);
          } else{
            baseRate = 0
          }
        } else {
          baseRate = employmentType === "casual"
            ? selectedAwardConfig.baseRates.casual[classification]?.base ?? 0
            : selectedAwardConfig.baseRates.fullTimePartTime[classification]?.base ?? 0;
        }
    // Apply junior rates if applicable (uses award-specific junior classification IDs)
    if (selectedAwardConfig.juniorClassificationIds.includes(classification) && age !== 'adult') {
        const juniorPercentage = selectedAwardConfig.juniorPercentages[age] ?? 1;
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
                employmentType,
                customRate,
                classification,
                selectedAwardConfig.penaltyConfig
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
    })
    
    // Calculate overtime (for full-time and part-time employees)
        if (employmentType !== "casual" && totalHours > selectedAwardConfig.penaltyConfig.overtimeThresholdHours) {
            overtimeHours = totalHours - selectedAwardConfig.penaltyConfig.overtimeThresholdHours;
            // Apply first 2 hours at time and a half, remainder at double time
            // This is simplified - actual overtime depends on when it was worked
            const first2Hours = Math.min(overtimeHours, 2);
            const remainingHours = overtimeHours - first2Hours;

            // Use non-casual base rate for overtime
            const nonCasualBaseRate = selectedAwardConfig.baseRates.fullTimePartTime[classification]?.base ?? baseRate;

      overtimePay = (first2Hours * nonCasualBaseRate * selectedAwardConfig.penaltyConfig.overtimeFirstTierMultiplier) +
        (remainingHours * nonCasualBaseRate * selectedAwardConfig.penaltyConfig.overtimeSecondTierMultiplier);

      // Subtract overtime hours from total pay (they'll be added back with overtime rates)
      totalPay = totalPay - (overtimeHours * baseRate);
    }
    
    // Calculate allowances
    let totalAllowances = 0;
    let allowanceBreakdown = [];
    
    if (allowances.homeMedicineReview) {
            const hmrAmount = selectedAwardConfig.allowances.homeMedicineReview ?? 0;
            totalAllowances += hmrAmount;
            allowanceBreakdown.push({
                name: 'Home Medicine Reviews',
                amount: hmrAmount
            });
        }

        if (allowances.laundry) {
            const laundryAmount = employmentType === "full-time"
                ? (selectedAwardConfig.allowances.laundryFullTime ?? 0)
                : (selectedAwardConfig.allowances.laundryPartTimeCasual ?? 0) * dailyBreakdown.length;
            totalAllowances += laundryAmount;
            allowanceBreakdown.push({
                name: 'Laundry Allowance',
                amount: laundryAmount
            });
        }

        if (allowances.brokenHill) {
            const brokenHillAmount = selectedAwardConfig.allowances.brokenHill ?? 0;
            totalAllowances += brokenHillAmount;
            allowanceBreakdown.push({
                name: 'Broken Hill Allowance',
                amount: brokenHillAmount
            });
        }

        if (allowances.motorVehicleKm > 0) {
            const vehicleAmount = allowances.motorVehicleKm * (selectedAwardConfig.allowances.motorVehiclePerKm ?? 0);
            totalAllowances += vehicleAmount;
            allowanceBreakdown.push({
                name: 'Motor Vehicle Allowance',
                amount: vehicleAmount
            });
        }

        if (allowances.mealAllowance > 0) {
            const mealAmount = allowances.mealAllowance * (selectedAwardConfig.allowances.mealAllowanceOvertime ?? 0);
            totalAllowances += mealAmount;
            allowanceBreakdown.push({
                name: 'Meal Allowance (Overtime)',
                amount: mealAmount
            });
        }

        if (allowances.mealAllowanceExtra > 0) {
            const mealExtraAmount = allowances.mealAllowanceExtra * (selectedAwardConfig.allowances.mealAllowanceOvertimeExtra ?? 0);
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
    setSelectedDayIndex(null);
    setActualPaidByDay(dailyBreakdown.map(() => ''));
    setTotalActualPaid('');
  };
  const currentAwardConfig = getAwardConfig(selectedAward);
  return (
    <div className="min-h-screen bg-surface-page">
      {/* Navy header — D-01, D-02, D-03 */}
      <header className="bg-canvas-dark text-white py-8 shadow-md border-b-2 border-brand relative z-50 animate-slide-down">
        <div className="max-w-4xl mx-auto px-4">
          <span className="text-xs font-medium text-brand-light tracking-widest uppercase">PharmIQ</span>
          <h1 className="text-3xl font-bold text-white font-heading tracking-tight">Pay Checker</h1>
          <p className="text-slate-400 text-base mt-0.5">Check if you're being paid correctly</p>
        </div>
      </header>

      {/* Error banner — D-09, D-10: below header, above AwardSelector, dismissible */}
      {awardError && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-critical-bg border-l-4 border-critical p-4 rounded animate-slide-down">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-critical-dark mb-1">Unable to Load Award Rates</h3>
                <p className="text-critical text-sm">{awardError}</p>
              </div>
              <button
                onClick={() => setAwardError(null)}
                className="ml-4 text-critical-dark hover:text-critical hover:bg-critical-bg rounded p-1 font-bold text-lg leading-none transition-colors"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen-reader live region for loading state */}
      <div role="status" aria-live="polite" className="sr-only">
        {awardLoading ? 'Loading award rates, please wait.' : ''}
      </div>

      {/* Loading overlay — D-08: covers content area, header remains visible */}
      {awardLoading && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-2xl">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-brand rounded-full animate-spin mx-auto"></div>
            <p className="text-center mt-4 text-gray-600 font-medium">Loading award rates...</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-16">
        {/* D-04: AwardSelector below header */}
        {/* error={null} — error display handled by the App-level banner above (D-09/D-10) */}
        <AwardSelector
          selectedAward={selectedAward}
          onSelectAward={handleSelectAward}
          awardMetadata={awardMetadata}
          isLoading={awardLoading}
          error={null}
          lastUpdated={lastUpdated}
          onRefresh={handleRefreshRates}
          successMessage={awardSuccessMessage}
        />

        {/* D-05: 3-col grid collapses to 1-col on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <EmployeeDetails
            classification={classification}
            setClassification={setClassification}
            employmentType={employmentType}
            setEmploymentType={setEmploymentType}
            age={age}
            setAge={setAge}
            customRate={customRate}
            setCustomRate={setCustomRate}
            classifications={currentAwardConfig.classifications}
            ageOptions={currentAwardConfig.ageOptions}
            juniorClassificationIds={currentAwardConfig.juniorClassificationIds}
          />
          <Allowances
            allowances={allowances}
            handleAllowanceChange={handleAllowanceChange}
            classification={classification}
            allowanceConfig={currentAwardConfig.allowances}
          />
        </div>

        <WorkHours
          weeklyData={weeklyData}
          handleTimeChange={handleTimeChange}
          handlePublicHolidayChange={handlePublicHolidayChange}
          calculatePay={calculatePay}
          isLoading={awardLoading}
        />

        <OverviewBreakdown
          results={results}
          selectedDayIndex={selectedDayIndex}
          onDayToggle={(index) => setSelectedDayIndex(selectedDayIndex === index ? null : index)}
          actualPaidByDay={actualPaidByDay}
          onActualPaidChange={(index, value) => {
            const updated = [...actualPaidByDay];
            updated[index] = value;
            setActualPaidByDay(updated);
          }}
          totalActualPaid={totalActualPaid}
          onTotalActualPaidChange={(value) => setTotalActualPaid(value)}
          cycleLength={results ? results.dailyBreakdown.length : 7}
        />

        {/* Important Notes — D-07: position in section order */}
        <ImportantNotes
          awardName={currentAwardConfig?.name || 'selected award'}
          overtimeThresholdHours={currentAwardConfig?.penaltyConfig?.overtimeThresholdHours || 38}
        />

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm pt-10 pb-4 border-t border-edge-subtle mt-4">
          <p>This calculator is provided for informational purposes only and should not be considered legal advice.</p>
          <p className="mt-1">
            Always consult the{' '}
            <a
              href="https://www.fairwork.gov.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:text-brand-dark underline"
            >
              Fair Work Ombudsman
            </a>
            {' '}or a legal professional for specific employment advice.
          </p>
        </footer>
      </main>
    </div>
  );

};

// Make sure to export the App component as default
export default App;