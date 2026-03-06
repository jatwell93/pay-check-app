# Coding Conventions

**Analysis Date:** 2026-03-07

## Naming Patterns

**Files:**
- React components use PascalCase: `EmployeeDetails.js`, `PaySummary.js`, `DetailedBreakdown.js`
- Utility files use camelCase: `helpers.js`, `reportWebVitals.js`, `setupTests.js`
- CSS files follow component name: `App.css`, `index.css`

**Functions:**
- Arrow functions used for event handlers: `const handleCustomRateChange = (event) => setCustomRate(event.target.value)`
- Regular function declarations for calculations: `const calculateBreakTime = (totalHours) => { ... }`
- Conditional functions use descriptive names: `getPenaltyDescription()`, `getPenaltyRateDetails()`
- Handler functions prefixed with `handle`: `handleTimeChange()`, `handlePublicHolidayChange()`, `handleAllowanceChange()`

**Variables:**
- State variables in camelCase: `classification`, `employmentType`, `customRate`, `weeklyData`, `allowances`, `results`
- Boolean flags prefixed with `is` or `show`: `publicHoliday`, `isOvernight`, `showDetails`, `isAboveAwardClassification`
- Array/object variables use plural or descriptive names: `weeklyData`, `dailyBreakdown`, `allowanceBreakdown`, `classifications`, `ageOptions`, `weekDays`
- Temporary/loop variables use short names: `day`, `index`, `type`, `segIndex`

**Types/Objects:**
- Configuration objects use camelCase keys: `pharmacyAwardRates`, `fullTimePartTime`, `juniorPercentages`, `allowances`
- Data structures use clear descriptive names: `dailyBreakdown`, `allowanceBreakdown`, `penaltyDetails`
- Constants exported from helpers use camelCase: `classifications`, `ageOptions`, `weekDays`

## Code Style

**Formatting:**
- No explicit linting/formatting tool configured (Prettier/ESLint not in package.json)
- Indentation: 2 spaces (observed in all files)
- Line endings: Natural JavaScript/React conventions observed
- Object shorthand not consistently used (e.g., `{ day: day }` instead of `{ day }`)

**Linting:**
- Default Create React App ESLint config extends `react-app` and `react-app/jest`
- ESLint settings in `package.json` (lines 22-26)

## Import Organization

**Order:**
1. React and React-related imports at top: `import React, { useState } from 'react'`
2. Third-party library imports: `import { format, parse, differenceInMinutes, isAfter, addMinutes } from 'date-fns'`
3. Local component imports: `import EmployeeDetails from './components/EmployeeDetails'`
4. Local utility/helper imports: `import { calculatePayForTimePeriod, weekDays } from './helpers'`

**Path Aliases:**
- Relative paths used throughout: `./components/`, `./helpers`
- No path aliases configured in codebase

## Error Handling

**Patterns:**
- Validation checks done inline: `if (!startTime || !endTime || currentBaseRate === undefined || currentBaseRate === null || isNaN(currentBaseRate))`
- Console warnings logged for invalid data: `console.warn("Invalid base rate or times provided:", { ... })`
- Fallback returns for error cases: `return { hours: 0, pay: 0, breakdown: [] }` (in `helpers.js`)
- Guard clauses used for conditional rendering: `if (!results) return null;` (in `DetailedBreakdown.js`)
- Ternary operators for simple branching: `employmentType === "casual" ? pharmacyAwardRates.casual[classification]?.base : pharmacyAwardRates.fullTimePartTime[classification]?.base || 0`

## Logging

**Framework:** Console (native browser console)

**Patterns:**
- Warning logs for validation issues: `console.warn("Invalid base rate or times provided:", { startTime, endTime, baseRate, customRate, classification, currentBaseRate })`
- Logs include context object with multiple properties for debugging
- No production logging framework configured

## Comments

**When to Comment:**
- High-level explanations of complex logic blocks
- Comments appear at function boundaries explaining purpose
- Business logic annotated: `// Apply first 2 hours at time and a half, remainder at double time` (in `App.js` line 201)
- Data structure explanations: `// Penalty rate boundaries in minutes from midnight (00:00)` (in `helpers.js` line 136)

**JSDoc/TSDoc:**
- Not used consistently in codebase
- No function documentation headers observed

## Function Design

**Size:**
- Component functions typically 40-90 lines
- Helper functions range from 10-260 lines (e.g., `calculatePayForTimePeriod` is complex calculation logic spanning 170 lines)
- Event handlers are single-line arrow functions

**Parameters:**
- Components receive props as destructured parameter: `const EmployeeDetails = ({ classification, setClassification, ... }) => { ... }`
- Utility functions receive individual parameters: `calculatePayForTimePeriod(day, startTime, endTime, baseRate, employmentType, customRate, classification)`
- Props passed down through component tree without prop drilling abstraction

**Return Values:**
- Components return JSX directly
- Utility functions return objects with clear structure: `{ hours: 0, pay: 0, breakdown: [] }`
- Handler functions use void returns (state mutations via setters)

## Module Design

**Exports:**
- Default exports used for components: `export default App;`, `export default EmployeeDetails;`
- Named exports used for utilities and constants: `export const calculatePayForTimePeriod = ...`, `export const classifications = [...]`
- Mixed export pattern: `helpers.js` exports both named constants and functions

**Barrel Files:**
- Not used in this codebase
- Imports reference specific files directly

## State Management

**Pattern:** React Hooks (useState)

- State hoisted to `App.js` component (main state container)
- Setter functions passed down to child components as props
- Individual state variables for each piece of state (no reducer pattern)
- State updates through array spread: `const newWeeklyData = [...weeklyData]; newWeeklyData[index][field] = value;`

---

*Convention analysis: 2026-03-07*
