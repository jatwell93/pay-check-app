# Testing Patterns

**Analysis Date:** 2026-03-07

## Test Framework

**Runner:**
- Jest (integrated via react-scripts)
- Config: Built into Create React App, customizable via `package.json` eslintConfig section

**Assertion Library:**
- Jest (built-in assertion API)
- `@testing-library/jest-dom` for DOM assertions (provides matchers like `toBeInTheDocument()`)

**Run Commands:**
```bash
npm test                 # Run all tests in watch mode
npm run build            # Build for production
npm start                # Start development server
```

## Test File Organization

**Location:**
- Tests co-located with source files: `App.test.js` in same directory as `App.js`

**Naming:**
- `.test.js` suffix convention: `App.test.js`
- Alternative pattern (not used here): `.spec.js` suffix

**Structure:**
```
src/
├── App.js
├── App.test.js         # Test file alongside component
├── components/
│   ├── EmployeeDetails.js
│   ├── PaySummary.js
│   └── ... (no corresponding .test.js files currently)
├── helpers.js          # (no helper test file currently)
└── setupTests.js       # Test configuration/setup
```

## Test Structure

**Suite Organization:**
```javascript
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

**Patterns:**
- Single `test()` block per test file (not using `describe()` blocks)
- Test uses descriptive string: `'renders learn react link'`
- Arrange-act-assert pattern implicit (render → query → assert)
- Test setup minimal (no complex fixtures or factories)

## Mocking

**Framework:** Jest built-in mocking

**Patterns:**
- No explicit mocking observed in current test
- React Testing Library handles component isolation

**What to Mock:**
- External dependencies (date-fns functions in calculations)
- API calls (not currently used in app)
- Window/browser APIs if needed

**What NOT to Mock:**
- React components under test
- Business logic functions that should be tested as-is

## Fixtures and Factories

**Test Data:**
- Currently no test fixtures defined
- Hardcoded test data within test blocks

**Location:**
- No dedicated fixtures directory
- Test data would logically go in a `__fixtures__` or `__mocks__` directory if created

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
npm test -- --coverage
```

Coverage tools available through Create React App but no minimum coverage thresholds configured.

## Test Types

**Unit Tests:**
- Minimal coverage currently (only `App.test.js` exists)
- Scope: Component rendering and basic DOM queries
- Approach: React Testing Library with user-centric queries

**Integration Tests:**
- Not currently implemented
- Would test multiple components working together (e.g., passing props, state changes)
- Recommended for: testing form submission, multi-component workflows

**E2E Tests:**
- Framework: Not used
- Would require Cypress, Playwright, or similar
- Recommended for: user flows like entering hours → calculating pay → viewing breakdown

## Testing Dependencies

From `package.json`:
- `@testing-library/react` ^16.3.0 - Main testing library for React components
- `@testing-library/jest-dom` ^6.6.3 - Custom Jest matchers for DOM assertions
- `@testing-library/user-event` ^13.5.0 - User interaction simulation (installed but not used in current tests)
- `@testing-library/dom` ^10.4.0 - DOM testing utilities (installed but not explicitly used)

## Setup and Configuration

**setupTests.js:**
```javascript
import '@testing-library/jest-dom';
```

- Imports jest-dom matchers to extend Jest assertions
- Automatically loaded before all tests (Create React App convention)
- Current setup minimal; no additional test utilities or mock factories

## Common Patterns to Implement

**Async Testing:**
```javascript
// Pattern not yet used, but recommended for:
test('async operation', async () => {
  render(<ComponentWithAsync />);
  const result = await screen.findByText('Loaded'); // Use findBy for async
  expect(result).toBeInTheDocument();
});
```

**Error Testing:**
```javascript
// Pattern not yet used, but recommended for error scenarios:
test('displays error message on invalid input', () => {
  render(<App />);
  // Trigger error condition
  expect(screen.getByText(/error message/i)).toBeInTheDocument();
});
```

## Current Testing Gaps

**Untested Components:**
- `EmployeeDetails.js` - No tests
- `Allowances.js` - No tests
- `PaySummary.js` - No tests
- `WorkHours.js` - No tests
- `DetailedBreakdown.js` - No tests

**Untested Utilities:**
- `helpers.js` - Complex calculation logic (`calculatePayForTimePeriod`, `getPenaltyRateDetails`) has no unit tests
- All business logic around pay calculations, penalty rates, and allowances untested

**Critical Testing Priorities:**
1. Unit tests for `helpers.js` calculation functions (highest business impact)
2. Component tests for user input handling (`EmployeeDetails`, `WorkHours`, `Allowances`)
3. Integration tests for pay calculation flow (classification → hours → results)

---

*Testing analysis: 2026-03-07*
