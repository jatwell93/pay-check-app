import { format, parse, differenceInMinutes, isAfter, addMinutes } from 'date-fns';

const calculateBreakTime = (totalHours) => {
    if (totalHours < 4) {
        return 0; // No breaks
    } else if (totalHours <= 5) {
        return 0; // 10-minute paid break (no deduction)
    } else if (totalHours < 7.6) {
        return 0.5; // 10-minute paid break + 30-minute unpaid (0.5 hours)
    } else {
        return 0.5; // Two 10-minute paid breaks + 30-minute unpaid (0.5 hours)
    }
};

export const classifications = [
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
  { id: 'pharmacist-manager', name: 'Pharmacist Manager' },
  { id: 'above-award', name: 'Above Award' }
];

export const ageOptions = [
  { id: 'adult', name: 'Adult (21 years and over)' },
  { id: 'under-16', name: 'Under 16 years' },
  { id: '16', name: '16 years' },
  { id: '17', name: '17 years' },
  { id: '18', name: '18 years' },
  { id: '19', name: '19 years' },
  { id: '20', name: '20 years' }
];

export const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Function to get penalty rate multiplier AND description
// It returns an object { multiplier: number, description: string }
const getPenaltyRateDetails = (day, time, employmentType, classification) => {
  const isAboveAwardClassification = classification === 'above-award';
  const isCasual = employmentType === 'casual';
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutesInDay = hours * 60 + minutes;
  const casualLoading = 1.25;
  let multiplier = 1;
  let description = 'Ordinary Rate (100%)';

  if (day === 'Public Holiday') {
    multiplier = isCasual ? 2.5 : 2.25; // Casual 250%, Full-time/Part-time 225%
    description = isCasual ? 'Public Holiday Rate (250% - Casual)' : 'Public Holiday Rate (225%)';
    return { multiplier, description };
  }

  if (day === 'Sunday') {
    if (totalMinutesInDay >= 7 * 60 && totalMinutesInDay < 21 * 60) { // 7:00 to 21:00 (9 PM)
      multiplier = 1.5; // 150%
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const fromDate = new Date('2019-07-01');
      const toDate = new Date('2020-06-30');

      const isPastDate = (currentDate >= fromDate && currentDate <= toDate);
      if(isPastDate) {
        multiplier = 1.65
      }
      multiplier = isCasual ? multiplier * casualLoading : multiplier; //Casual loading
      description = isCasual ? `Sunday Rate (190/175% - Casual)` : `Sunday Rate (165/150%)`;
    }

    if (totalMinutesInDay < 7 * 60 || totalMinutesInDay >= 21 * 60) { // Before 7:00 or after 21:00 (9 PM)
      multiplier = isCasual ? 2.25 : 2; // Casual 225%, Full-time/Part-time 200%
      description = isCasual ? 'Sunday Rate (225% - Casual)' : 'Sunday Rate (200%)';
    }

    return { multiplier, description };
  }

  if (day === 'Saturday') {
    if (totalMinutesInDay >= 7 * 60 && totalMinutesInDay < 8 * 60) { // 7:00 to 8:00
      multiplier = isCasual ? 2.25 : 2; // Casual 225%, Full-time/Part-time 200%
      description = isCasual ? 'Saturday Rate (225% - Casual)' : 'Saturday Rate (200%)';
    } else if (totalMinutesInDay >= 8 * 60 && totalMinutesInDay < 18 * 60) { // 8:00 to 18:00 (6 PM)
      multiplier = isCasual ? 1.5 : 1.25; // Casual 150%, Full-time/Part-time 125%
      description = isCasual ? 'Saturday Rate (150% - Casual)' : 'Saturday Rate (125%)';
    } else if (totalMinutesInDay >= 18 * 60 && totalMinutesInDay < 21 * 60) { // 18:00 (6 PM) to 21:00 (9 PM)
      multiplier = isCasual ? 1.75 : 1.5; // Casual 175%, Full-time/Part-time 150%
      description = isCasual ? 'Saturday Rate (175% - Casual)' : 'Saturday Rate (150%)';
    } else if (totalMinutesInDay >= 21 * 60) { // After 21:00 (9 PM)
      multiplier = isCasual ? 2.0 : 1.75; // Casual 200%, Full-time/Part-time 175%
      description = isCasual ? 'Saturday Rate (200% - Casual)' : 'Saturday Rate (175%)';
    }
    return { multiplier, description };
  }

  // Monday to Friday
  if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)) {
    if (totalMinutesInDay >= 7 * 60 && totalMinutesInDay < 8 * 60) { // 7:00 to 8:00
      multiplier = isCasual ? 1.75 : 1.5; // Casual 175%, Full-time/Part-time 150%
      description = isCasual ? 'Weekday Rate (175% - Casual)' : 'Weekday Rate (150%)';
    } else if (totalMinutesInDay >= 19 * 60 && totalMinutesInDay < 21 * 60) { // 19:00 (7 PM) to 21:00 (9 PM)
      multiplier = isCasual ? 1.5 : 1.25; // Casual 150%, Full-time/Part-time 125%
      description = isCasual ? 'Weekday Rate (150% - Casual)' : 'Weekday Rate (125%)';
    } else if (totalMinutesInDay >= 21 * 60) { // After 21:00 (9 PM) to midnight
      multiplier = isCasual ? 1.75 : 1.5; // Casual 175%, Full-time/Part-time 150%
      description = isCasual ? 'Weekday Rate (175% - Casual)' : 'Weekday Rate (150%)';
    }
    return { multiplier, description };
  }
  

  // Early morning (00:00 to 07:00) and evening (19:00 to 23:59) shift penalty
  const earlyMorningStartMinutes = 0 * 60; // 00:00
  const earlyMorningEndMinutes = 7 * 60;   // 07:00
   if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)) {
    if (totalMinutesInDay >= 0 && totalMinutesInDay < 7 * 60) { // before 7am
        return { multiplier: isCasual ? 1.75 : 1.5, description: isCasual ? 'Weekday Rate (175% - Casual)' : 'Weekday Rate (150%)'};
      }
  const eveningStartMinutes = 19 * 60;     // 19:00
  const eveningEndMinutes = 23 * 60 + 59;  // 23:59

  if (
      (totalMinutesInDay >= earlyMorningStartMinutes && totalMinutesInDay < earlyMorningEndMinutes)
  ) {
       // Apply the 1.25 early morning shift loading
       return { multiplier: 1.25, description: 'Early Morning Shift (125%)' };
    }
     }
  if (
       (totalMinutesInDay >= eveningStartMinutes && totalMinutesInDay <= eveningEndMinutes)
  ) {
       // Apply the 1.25 evening shift loading
       return { multiplier: 1.25, description: 'Evening Shift (125%)' };
  }
    if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)) {
         if (totalMinutesInDay >= 21 * 60 && totalMinutesInDay <= eveningEndMinutes) { // After 9pm
              return { multiplier: isCasual ? 1.75 : 1.5, description: isCasual ? 'Weekday Rate (175% - Casual)' : 'Weekday Rate (150%)'};
         }
    }

 

    // If none of the above penalties apply, return the normal rate multiplier and description
    return { multiplier: 1, description: 'Ordinary Rate (100%)' };
};

// Added classification to the parameters
export const calculatePayForTimePeriod = (day, startTime, endTime, baseRate, employmentType, customRate, classification) => {
    // Determine the base rate to use: customRate if 'above-award' is selected and customRate is a valid number, otherwise baseRate
    const currentBaseRate = classification === 'above-award' && customRate !== '' && customRate !== null && customRate !== undefined && !isNaN(parseFloat(customRate))
                            ? parseFloat(customRate)
                            : baseRate;

    // Check if base rate is valid before proceeding
    if (!startTime || !endTime || currentBaseRate === undefined || currentBaseRate === null || isNaN(currentBaseRate)) {
        // If base rate is not a valid number, return 0 pay and hours
        console.warn("Invalid base rate or times provided:", { startTime, endTime, baseRate, customRate, classification, currentBaseRate });
        return { hours: 0, pay: 0, breakdown: [] };
    }

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

    // Calculate total minutes and hours for the shift duration
    const totalMinutesDuration = differenceInMinutes(end, start);
    const totalHoursDuration = totalMinutesDuration / 60;

    // Calculate unpaid break time based on total shift duration
    const unpaidBreakHours = calculateBreakTime(totalHoursDuration);

    const totalHoursWithBreaks = totalHoursDuration - unpaidBreakHours;

    let currentTime = new Date(start);
    let breakdown = [];
    let totalPay = 0;

    // Penalty rate boundaries in minutes from midnight (00:00)
    // These are times when a penalty rate *might* change.
    const penaltyBoundaries = [
        0, // Start of the day
        7 * 60, // 07:00
        8 * 60, // 08:00
        19 * 60, // 19:00
        21 * 60, // 21:00
         24 * 60 // End of the day (start of the next day)
    ];

    while (currentTime < end) {
        const segmentStartTime = new Date(currentTime);
        const currentDay = isOvernight && currentTime.getDate() !== start.getDate() ?
            (day === 'Public Holiday' ? day : (day === 'Sunday' ? 'Monday' : weekDays[weekDays.indexOf(day) + 1])) : day;

        // Find the next penalty boundary after the current time
        let nextBoundaryTime = end; // Default to the end of the shift

        for (const boundaryMinutes of penaltyBoundaries) {
             // Calculate the boundary time for the current day
             let boundaryTimeForCurrentDay = new Date(segmentStartTime);
             boundaryTimeForCurrentDay.setHours(Math.floor(boundaryMinutes / 60), boundaryMinutes % 60, 0, 0);

             // If the boundary is on the next day (e.g., 00:00 boundary for an overnight shift)
             if (boundaryMinutes >= 24 * 60) {
                 boundaryTimeForCurrentDay.setDate(boundaryTimeForCurrentDay.getDate() + 1);
             }

            if (isAfter(boundaryTimeForCurrentDay, segmentStartTime)) {
                // This boundary is in the future relative to segmentStartTime
                nextBoundaryTime = new Date(boundaryTimeForCurrentDay);
                break; // Found the next relevant boundary
            }
        }

         // The segment end is the minimum of the next penalty boundary and the overall shift end
         let segmentEnd = new Date(Math.min(nextBoundaryTime.getTime(), end.getTime()));

         // Ensure segmentEnd is at least one minute after segmentStartTime if they are the same
         // This prevents infinite loops if segmentStartTime lands exactly on a boundary
         if (segmentEnd.getTime() === segmentStartTime.getTime()) {
             segmentEnd = addMinutes(segmentEnd, 1);
             if (segmentEnd > end) segmentEnd = new Date(end); // Don't exceed the overall end time
         }


        let segmentTotalPay = 0;
        let segmentCurrentTime = new Date(segmentStartTime);

        // Calculate pay minute-by-minute within this segment for accuracy
        while (segmentCurrentTime < segmentEnd) {
            const minuteEndTime = addMinutes(segmentCurrentTime, 1);
            const minuteDay = isOvernight && segmentCurrentTime.getDate() !== start.getDate() ?
              (day === 'Public Holiday' ? day : (day === 'Sunday' ? 'Monday' : weekDays[weekDays.indexOf(day) + 1])) : day;
            const minuteTimeString = format(segmentCurrentTime, 'HH:mm');

            // Get applicable penalty rate multiplier and description for this minute
            const penaltyDetails = getPenaltyRateDetails(minuteDay, minuteTimeString, employmentType, classification);
            const penaltyRate = penaltyDetails.multiplier;
            // const penaltyDescription = penaltyDetails.description; // Capture the description


            // Calculate pay for this minute (1/60th of an hour)
            const minutePay = currentBaseRate * penaltyRate * (1 / 60);
            segmentTotalPay += minutePay;

            segmentCurrentTime = minuteEndTime;
        }

        const segmentMinutes = differenceInMinutes(segmentEnd, segmentStartTime);
        const segmentHours = segmentMinutes / 60;

        // Only add a breakdown entry if the segment has a duration
        if (segmentHours > 0) {
             // Determine the penalty rate details for the start of this segment for the description
           const segmentStartPenaltyDetails = getPenaltyRateDetails(currentDay, format(segmentStartTime, 'HH:mm'), employmentType, classification);

            breakdown.push({
                 startTime: format(segmentStartTime, 'HH:mm'),
                endTime: format(segmentEnd, 'HH:mm'),
                day: currentDay,
                hours: parseFloat(segmentHours.toFixed(2)), // Round hours for display
                rate: currentBaseRate,
                penaltyMultiplier: segmentStartPenaltyDetails.multiplier, // Show the multiplier for the segment start
                penaltyDescription: segmentStartPenaltyDetails.description, // Use the captured description
                pay: parseFloat(segmentTotalPay.toFixed(2)) // Round segment pay for display
            });

            totalPay += segmentTotalPay;
        }

        // Move to the start of the next segment
        currentTime = new Date(segmentEnd);
    }

    // Calculate the pay amount to subtract for the unpaid break
    // We need to figure out which penalty rate applies to the time the break *would* have been taken.
    // A simple approach is to subtract the pay for the break duration at the ordinary rate,
    // or you could implement more complex logic to find a specific break time window and its rate.
    // For now, let's subtract at the ordinary rate (multiplier 1).
    const payPerUnpaidBreakHour = currentBaseRate * 1; // Ordinary rate for the break

    // Subtract the pay for the unpaid break duration
    totalPay -= (payPerUnpaidBreakHour * unpaidBreakHours);

    // Round total pay to two decimal places
    totalPay = parseFloat(totalPay.toFixed(2));

    // Optional: Add a breakdown entry for the unpaid break
    if (unpaidBreakHours > 0) {
        // You might need to determine a reasonable time window to display for the break.
        // For simplicity, let's just add a generic entry.
        breakdown.push({
            startTime: 'N/A', // Or a calculated time window
            endTime: 'N/A', // Or a calculated time window
            day: day, // Or the day the break occurred
            hours: parseFloat(unpaidBreakHours.toFixed(2)),
            rate: currentBaseRate, // Show the base rate
            penaltyMultiplier: 0, // No pay for unpaid break
            penaltyDescription: 'Unpaid Break',
            pay: -parseFloat((payPerUnpaidBreakHour * unpaidBreakHours).toFixed(2)) // Show as a negative deduction
        });
        // Sort breakdown entries by start time if you add a specific break time window
        // breakdown.sort((a, b) => parse(a.startTime, 'HH:mm', baseDate) - parse(b.startTime, 'HH:mm', baseDate));
    }


    return {
        hours: totalHoursWithBreaks,
        pay: totalPay,
        breakdown
    };
};
