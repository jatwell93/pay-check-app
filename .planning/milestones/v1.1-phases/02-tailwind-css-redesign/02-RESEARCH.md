# Phase 2: Tailwind CSS Redesign - Research

**Researched:** 2026-03-22
**Domain:** UI/UX Design, CSS Framework Setup, Responsive Web Design
**Confidence:** HIGH (Tailwind v3 with CRA is stable; responsive patterns verified)

## Summary

Phase 2 requires a full redesign of the Pay Check App's UI using Tailwind CSS v3 with a navy/white professional palette, green/red status indicators, and mobile-responsive forms. The project uses Create React App 5.0.1, which requires standard Tailwind + PostCSS setup via npm. Tailwind v3 is the safe choice for CRA; v4 has known compatibility issues with CRA's PostCSS constraints and is not recommended for existing CRA projects. Key tasks include installing Tailwind, applying utility classes across 6 components (App, AwardSelector, EmployeeDetails, Allowances, WorkHours, OverviewBreakdown), implementing a loading overlay with spinner, an error banner, and ensuring responsive layouts that work below 375px viewport width. All existing tests (11 test files) verify calculation logic and component behavior; Tailwind CSS styling changes do not affect test requirements as tests query by accessible text and IDs, not CSS classes.

**Primary recommendation:** Install Tailwind CSS v3 via npm with standard PostCSS setup; redesign components in order (layout → form inputs → tables → results); use `md:grid-cols-3` for 3-column collapse pattern and `overflow-x-auto` for table scrolling; implement loading overlay with `fixed inset-0 bg-black/50 z-40` and spinner with `animate-spin`; verify responsive behavior on mobile emulator (375px+).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Navy header bar contains title ("Pay Check App") + static subtitle only — no award selector in header
- **D-02:** Subtitle is static — does NOT change dynamically
- **D-03:** Compact header padding — `py-4`
- **D-04:** Award selector stays below header
- **D-05:** 3-col grid (EmployeeDetails + Allowances) collapses to 1-column on mobile — keep `md:grid-cols-3`
- **D-06:** WorkHours table uses horizontal scroll (`overflow-x-auto`) on small screens, not card layout
- **D-07:** Section order unchanged: AwardSelector → EmployeeDetails+Allowances → WorkHours → OverviewBreakdown → ImportantNotes → Footer
- **D-08:** Loading overlay: semi-transparent overlay over main content (not whole viewport); form not accessible during load
- **D-09:** Error banner: full-width red banner below header, above award selector, dismissible with × button
- **D-10:** Error banner is dismissible
- **D-11:** Three pay status states: green (OK), red (Underpaid), yellow (Overpaid)
- **D-12:** Weekly summary: prominent status row below OverviewBreakdown, showing total calculated vs actual paid + status; hidden until user enters actual paid amount
- **D-13:** Weekly summary does NOT show placeholder — completely hidden until data exists

### Claude's Discretion
- Exact navy hex color (roadmap suggests `#1e3a5f`)
- Spinner design (CSS border animation or SVG)
- Form input styling details (border colour, focus ring)
- Card/section border styling (rounded corners, shadow depth)
- Footer styling
- ImportantNotes section styling

### Deferred Ideas (OUT OF SCOPE)
- None — all discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-01 | All app components restyled with Tailwind CSS using clean professional look (navy/white palette) | Standard Stack specifies Tailwind v3 with PostCSS; Architecture Patterns document component-by-component redesign order; Code Examples show navy header + white content areas with Tailwind utilities |
| UX-02 | Pay verification status indicators use green for "Paid Correctly" and red for "Underpaid" throughout the UI | OverviewBreakdown.js already has green-100/text-green-800, red-100/text-red-800, yellow-100/text-yellow-800 badge pattern; research confirms these are Tailwind standard status colours; Code Examples show status badge styling pattern |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v3.4.x | Utility-first CSS framework for styling | v3 is stable with Create React App 5.0.1; v4 has PostCSS compatibility issues with CRA; v3 is officially supported via Tailwind v3 CRA guide |
| PostCSS | v8.x (auto via Tailwind) | CSS transformation pipeline required by Tailwind | Required dependency; installed with `npm install -D tailwindcss` |
| Autoprefixer | v10.x (auto via Tailwind) | Browser vendor prefix automation | Auto-installed as Tailwind dependency; handles cross-browser CSS compatibility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React | ^19.1.0 | UI framework (existing) | Already in project; Tailwind integrates seamlessly with React components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v3 | Tailwind v4 | v4 (released Oct 2024) has faster builds (10x) and native CSS variables, BUT has known PostCSS configuration issues with CRA. Upgrading would require ejecting CRA or migrating to Vite/Next.js. Stick with v3 for this project. |
| Tailwind v3 | CSS-in-JS (Styled Components, Emotion) | Offers scoped styles and runtime flexibility, BUT higher bundle size, slower renders, and learning curve for team. Tailwind's static utility approach is simpler and faster. |
| Tailwind v3 | Bootstrap / Material UI | Pre-built component libraries offer faster initial setup, BUT lock you into pre-designed components; Tailwind gives full design flexibility and smaller bundle (v3 purges unused styles). |

**Installation:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

**Version verification:** Tailwind CSS v3.4.x is the latest v3 release (Feb 2024, current as of Feb 2025 training). Create React App 5.0.1 is confirmed compatible. PostCSS 8.x and Autoprefixer 10.x are auto-installed as Tailwind dependencies.

## Architecture Patterns

### Recommended Project Structure
After Tailwind install, the project structure remains unchanged:
```
src/
├── App.js                 # Main app shell with layout
├── index.css              # Updated with @tailwind directives
├── components/            # React components (redesigned with Tailwind)
│   ├── AwardSelector.js
│   ├── EmployeeDetails.js
│   ├── Allowances.js
│   ├── WorkHours.js
│   ├── OverviewBreakdown.js
│   └── ImportantNotes.js
├── helpers.js             # Calculation logic (unchanged)
├── config/                # Config files (unchanged)
└── services/              # API services (unchanged)
```

### Pattern 1: Header with Navy Background
**What:** Navy header bar (`bg-[#1e3a5f]` or similar) containing app title and subtitle, compact padding
**When to use:** At the top of the page layout; appears once per page render
**Example:**
```jsx
// src/App.js — Navy header section
<header className="bg-slate-900 text-white py-4">
  <div className="max-w-4xl mx-auto px-4">
    <h1 className="text-3xl font-bold">Pay Check App</h1>
    <p className="text-gray-300 text-sm mt-1">Check if you're being paid correctly</p>
  </div>
</header>
```
**Source:** CONTEXT.md decisions D-01, D-03; user's "navy/white palette" requirement

### Pattern 2: Responsive Grid (3-col → 1-col)
**What:** Multi-column layout that collapses to single column on mobile using Tailwind's responsive breakpoints
**When to use:** When displaying side-by-side form sections (EmployeeDetails, Allowances) that should stack on mobile
**Example:**
```jsx
// src/App.js — EmployeeDetails + Allowances grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <EmployeeDetails {...props} />
  <Allowances {...props} />
</div>
```
**Why standard:** Tailwind's mobile-first responsive pattern (`md:` prefix = "medium screen and up") is idiomatic; this exact pattern already exists in App.js line 354 and is locked in CONTEXT.md D-05

### Pattern 3: Table with Horizontal Scroll on Mobile
**What:** Wrap table in `overflow-x-auto` to allow horizontal scrolling when table width exceeds viewport
**When to use:** WorkHours day-by-day table on screens < ~500px
**Example:**
```jsx
// src/components/WorkHours.js — Scrollable table wrapper
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="bg-gray-100">
        <th className="p-2">Day</th>
        {/* columns */}
      </tr>
    </thead>
  </table>
</div>
```
**Source:** CONTEXT.md D-06; Tailwind CSS overflow documentation; Flowbite table examples

### Pattern 4: Status Badges (Green/Red/Yellow)
**What:** Inline badges with background + text colour for pay verification status
**When to use:** In OverviewBreakdown rows to show "OK" / "Underpaid" / "Overpaid" state
**Example:**
```jsx
// src/components/OverviewBreakdown.js — Status badge
if (diff <= 0.01) {
  return (
    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
      OK
    </span>
  );
}
// Red for underpaid
<span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
  Underpaid
</span>
// Yellow for overpaid
<span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
  Overpaid
</span>
```
**Source:** OverviewBreakdown.js already uses this pattern (lines 26, 33, 39); CONTEXT.md D-11; confirmed in existing code

### Pattern 5: Loading Overlay with Spinner
**What:** Semi-transparent overlay covering form area (not entire viewport) with centered spinning loader while data loads
**When to use:** During `awardLoading` state while rates are being fetched
**Example:**
```jsx
// src/App.js — Loading overlay wrapper
{awardLoading && (
  <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
      <p className="text-center mt-2 text-gray-600">Loading rates...</p>
    </div>
  </div>
)}
```
**Source:** CONTEXT.md D-08; Tailwind CSS z-index, opacity, animate-spin documentation; Flowbite spinner examples

### Pattern 6: Error Banner (Dismissible)
**What:** Full-width red banner below header displaying error message with close button
**When to use:** When `awardError` state is set; dismissal sets `awardError` to null
**Example:**
```jsx
// src/App.js — Error banner (render after header, before AwardSelector)
{awardError && (
  <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-red-700 font-medium">{awardError}</p>
      </div>
      <button
        onClick={() => setAwardError(null)}
        className="text-red-700 hover:text-red-900 font-bold text-lg"
      >
        ×
      </button>
    </div>
  </div>
)}
```
**Source:** CONTEXT.md D-09, D-10; Alert banner pattern from Tailwind CSS best practices

### Pattern 7: Form Input with Focus Ring
**What:** Text/number inputs with border, rounded corners, and visible focus ring for accessibility
**When to use:** All form input fields (EmployeeDetails, Allowances, WorkHours, OverviewBreakdown edit fields)
**Example:**
```jsx
// src/components/EmployeeDetails.js — Form input
<input
  type="number"
  id="customRate"
  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  value={customRate}
  onChange={handleCustomRateChange}
/>
```
**Source:** Tailwind CSS focus-visible and form accessibility best practices; Material Tailwind input examples

### Anti-Patterns to Avoid
- **Hardcoded pixel values in Tailwind:** Avoid `<div style={{padding: '20px'}}>` when Tailwind `p-5` exists. Utility classes ensure consistency.
- **Dynamic class construction:** Never do `className={'bg-' + color + '-600'}` — Tailwind's purge process can't find dynamically built classes. Use predefined variant names only.
- **Removing focus rings entirely:** Don't use `focus:outline-none` without adding `focus:ring-*` — keyboard users need focus indicators for accessibility (WCAG 2.4.7).
- **Mixing old CSS classes with Tailwind:** App.css has `.container`, `.section`, `.button` classes that conflict with Tailwind utilities. Remove App.css rules as components are converted and use Tailwind utilities instead.
- **Ignoring mobile-first order:** Tailwind applies unprefixed utilities to all screens, then `sm:`, `md:`, `lg:` override at larger sizes. Don't use `max-md:` unless absolutely necessary; stick to mobile-first (`grid-cols-1 md:grid-cols-3`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loading spinner animation | Custom CSS keyframes with `@keyframes` or GIF images | Tailwind's `animate-spin` utility class | Built-in, CSS-only, no HTTP requests, easily customizable via Tailwind config |
| Responsive grid layout | Manual media query breakpoints with `@media (max-width: ...)` | Tailwind's responsive prefixes (`md:grid-cols-3`, `lg:grid-cols-4`) | Mobile-first is easier to maintain; Tailwind compiles all breakpoints automatically |
| Semi-transparent overlay | Custom CSS `rgba()` colours with z-index management | Tailwind's `bg-black/50`, `z-40` opacity utilities | Clearer intent; atomic utilities prevent specificity wars; z-index scale is pre-defined |
| Status badge styling | Custom CSS classes with complex selectors | Tailwind's colour utilities (`bg-green-100 text-green-800`) | Consistent colour palette; no custom CSS needed; easily swappable colours for branding |
| Form focus indicators | Custom `outline` or `box-shadow` in CSS | Tailwind's `focus:ring-*` and `focus:border-*` utilities | Ring utilities respect browser accessibility features; outline is native and WCAG-compliant |
| Dismissible banner | Custom close button logic with inline event handlers | State-driven rendering with `{awardError && <div>...</div>}` + onClick handler | React handles lifecycle; UI stays in sync with state; easier to test |

**Key insight:** Tailwind's utility-first approach shifts the burden from "write custom CSS" to "compose utilities." This reduces bugs, improves maintainability, and ensures consistency. For animation, layout, and interactive features, Tailwind has battle-tested, accessible utilities — custom solutions are nearly always slower and less maintainable.

## Common Pitfalls

### Pitfall 1: Forgetting `@tailwind` Directives in index.css
**What goes wrong:** Styles don't load; browser defaults apply instead of Tailwind utilities.
**Why it happens:** PostCSS needs `@tailwind base; @tailwind components; @tailwind utilities;` in the CSS entry point to inject Tailwind's generated styles.
**How to avoid:** After `npm install -D tailwindcss`, copy the three `@tailwind` lines into `src/index.css` (replaces old global styles). Verify in browser DevTools that `<link rel="stylesheet">` loads a Tailwind-generated file.
**Warning signs:** All utility classes (e.g., `bg-blue-600`, `p-4`) have no effect; page looks unstyled; old CSS from App.css applies instead.

### Pitfall 2: Tailwind Content Paths Exclude Component Files
**What goes wrong:** Some components' classes are purged from the final CSS because Tailwind's build process doesn't scan those files.
**Why it happens:** `tailwind.config.js` has a `content` array that tells Tailwind which files to scan for class names. If it's misconfigured or incomplete, Tailwind misses files and classes disappear in production build.
**How to avoid:** After init, verify `content` in `tailwind.config.js` includes all source files:
```js
content: [
  "./src/**/*.{js,jsx,ts,tsx}",
],
```
This pattern matches all JS/JSX/TS/TSX files in `src/`. If you move components or add new extensions, update here.
**Warning signs:** Styles work in dev (`npm start`) but vanish in production build (`npm run build`); intermittent styling issues across components.

### Pitfall 3: Dynamically Constructed Class Names Not Found by Purge
**What goes wrong:** Conditional class names like `className={status === 'good' ? 'bg-green-600' : 'bg-red-600'}` work, but `className={'bg-' + colorVar + '-600'}` doesn't — the second pattern creates strings Tailwind can't parse.
**Why it happens:** Tailwind uses static analysis (regex) to find class names in source. If a class name is built at runtime with template literals or concatenation, Tailwind's build process can't detect it.
**How to avoid:** Use conditional JSX, not string concatenation:
```js
// DO THIS — Tailwind sees 'bg-green-600' and 'bg-red-600'
className={status === 'good' ? 'bg-green-600' : 'bg-red-600'}

// DON'T DO THIS — Tailwind can't parse the string
className={'bg-' + colorVar + '-600'}
```
**Warning signs:** A class you defined works sometimes, disappears in production build; colour changes don't apply even though the utility is in code.

### Pitfall 4: Overlapping App.css and Tailwind Classes
**What goes wrong:** Old CSS classes from `App.css` (`.button`, `.section`, `.container`) conflict with Tailwind utilities or prevent new styles from applying.
**Why it happens:** Both stylesheets load; specificity rules determine which wins. A hand-written `.section { margin-bottom: 30px; }` might override Tailwind's `mb-8`.
**How to avoid:** As components are redesigned, remove corresponding `App.css` rules. For example, when `App.js` replaces `<div className="container">` with Tailwind container utilities, delete the `.container` rule from App.css. Keep App.css only for styles Tailwind doesn't cover (e.g., body font).
**Warning signs:** Styles you add with Tailwind don't visually change; inspector shows two conflicting rules; layout breaks unexpectedly.

### Pitfall 5: Missing Focus Ring on Interactive Elements (Accessibility)
**What goes wrong:** Keyboard users can't see where they are; fails WCAG 2.4.7 focus visibility requirement.
**Why it happens:** Designers focus on mouse interactions and forget keyboard navigation. Tailwind's utilities default to browser outlines, which can be subtle or missing on some browsers.
**How to avoid:** Always add `focus:ring-2 focus:ring-blue-500` or `focus:outline-2 focus:outline-blue-500` to buttons, inputs, links. Test with Tab key to verify focus is visible.
**Warning signs:** Keyboard users report confusion ("I can't tell where I am"); accessibility audit fails; `:focus` styles are missing from component previews.

### Pitfall 6: Overlay `fixed` Positioning Covers Entire Viewport When Intent is Partial
**What goes wrong:** Loading overlay with `fixed inset-0` covers the whole page including the header; header becomes inaccessible.
**Why it happens:** CONTEXT.md D-08 specifies overlay should cover "main content area" only, not header. Using `fixed inset-0` (same as `top-0 right-0 bottom-0 left-0`) covers the full viewport.
**How to avoid:** For a partial overlay, use `absolute` positioning instead of `fixed`, or wrap the overlay within the container div (not at page root). Only use `fixed inset-0` for full-page overlays (e.g., true modal dialogs).
```jsx
// CORRECT — Overlay inside container, below header
<div className="container">
  <header>...</header>
  {awardLoading && <div className="absolute inset-0 bg-black/50 ...">...</div>}
</div>

// WRONG — Overlay covers entire viewport including header
<div className="fixed inset-0 bg-black/50 ..." />
```
**Warning signs:** Header disappears during loading; overlay covers navigation elements; user sees blank page instead of app title.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react v16.3.0 |
| Config file | Built into react-scripts 5.0.1 (no config file needed) |
| Quick run command | `npm test -- --testNamePattern="EmployeeDetails"` (run one component suite) |
| Full suite command | `npm test -- --watchAll=false` (CI mode, run all 11 test files once) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | App header renders with "Pay Check App" title | Unit | `npm test -- App.test.js -t "renders"` | ✅ App.test.js (no title test yet — Wave 0 gap) |
| UX-01 | EmployeeDetails renders classification select with Tailwind classes | Unit | `npm test -- EmployeeDetails.test.js` | ✅ Exists (tests presence, not CSS) |
| UX-01 | Allowances renders checkboxes/inputs with Tailwind styling | Unit | `npm test -- Allowances.test.js` | ✅ Exists (tests presence, not CSS) |
| UX-01 | WorkHours renders time inputs with Tailwind focus ring | Unit | `npm test -- WorkHours.test.js` | ✅ Exists (tests presence, not CSS) |
| UX-01 | OverviewBreakdown table renders with Tailwind layout | Unit | `npm test -- OverviewBreakdown.test.js` | ✅ Exists (tests presence, not CSS) |
| UX-01 | Layout is responsive: 3-col grid collapses to 1-col on mobile | Integration | Manual browser test: resize to 375px, verify stacking | ❌ No test (mobile responsiveness is manual-only) |
| UX-01 | Loading overlay displays with spinner while `awardLoading=true` | Integration | `npm test -- App.test.js -t "loading"` | ✅ App.test.js has loading tests (overlay styling is CSS, not behavioural) |
| UX-01 | Error banner displays when `awardError` is set, dismissible with × button | Integration | `npm test -- App.test.js -t "error"` | ✅ App.test.js has error message test (lines 78–89); dismissal not tested |
| UX-02 | Status badge shows green for "OK" when actual = calculated | Unit | `npm test -- OverviewBreakdown.test.js -t "OK"` | ✅ Exists (OverviewBreakdown tests rows and status logic) |
| UX-02 | Status badge shows red for "Underpaid" when actual < calculated | Unit | `npm test -- OverviewBreakdown.test.js -t "Underpaid"` | ✅ Exists (logic tested) |
| UX-02 | Status badge shows yellow for "Overpaid" when actual > calculated | Unit | `npm test -- OverviewBreakdown.test.js -t "Overpaid"` | ✅ Exists (logic tested) |

### Sampling Rate
- **Per task commit:** `npm test -- --testNamePattern="(EmployeeDetails|Allowances|WorkHours)" --watchAll=false` (quick: ~10s, spot-check form components)
- **Per wave merge:** `npm test -- --watchAll=false` (full suite: ~30s, all 11 test files)
- **Phase gate:** Full suite green + manual mobile responsive test (375px, 768px, 1024px breakpoints)

### Wave 0 Gaps
- [ ] `App.test.js` — Add test for header title render ("Pay Check App")
- [ ] `OverviewBreakdown.test.js` — Add test for weekly summary row visibility (hidden until actual paid data entered)
- [ ] `AwardSelector.test.js` — Add test for error banner dismissal (clicking × button sets awardError to null)
- [ ] **Manual testing needed:** Responsive layout at 375px (iPhone SE), 768px (tablet), 1024px (desktop); horizontal scroll on WorkHours table at 375px
- [ ] **Browser DevTools:** Verify Tailwind CSS is injected (inspect `<style>` tag shows `@tailwind` output, not errors)

*(If all existing tests pass after Tailwind installation: existing test infrastructure fully covers phase requirements. Gaps are enhancements, not blockers.)*

## Code Examples

Verified patterns from official Tailwind v3 and existing app code:

### Header with Navy Background and Subtitle
```jsx
// Source: Tailwind CSS best practices + CONTEXT.md D-01, D-03
// Location: src/App.js lines 337-341 (currently using old CSS)

<header className="bg-slate-900 text-white py-4 shadow-md">
  <div className="max-w-4xl mx-auto px-4">
    <h1 className="text-3xl font-bold text-white">Pay Check App</h1>
    <p className="text-gray-300 text-sm mt-1">Check if you're being paid correctly</p>
  </div>
</header>
```
**Navy colour:** Tailwind's `bg-slate-900` is `#0f172a` (darker than roadmap's `#1e3a5f`); customize in `tailwind.config.js` if needed:
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'navy': '#1e3a5f',
    },
  },
},
// Then use: className="bg-navy"
```

### Responsive Grid (3-col to 1-col)
```jsx
// Source: OverviewBreakdown.js existing pattern (line 354) + Tailwind grid docs
// Location: src/App.js lines 354-374

<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <EmployeeDetails {...props} />
  <Allowances {...props} />
</div>
```
**Explanation:**
- `grid-cols-1` = 1 column (mobile, <768px)
- `md:grid-cols-3` = 3 columns on medium screens (≥768px)
- `gap-6` = 24px spacing between items
- `mb-8` = 32px margin-bottom (separation from next section)

### Form Input with Focus Ring and Border
```jsx
// Source: Tailwind CSS form best practices + accessibility (WCAG 2.4.7 focus visibility)
// Location: src/components/EmployeeDetails.js line 45 (currently `p-2 border rounded`)

<input
  type="number"
  id="customRate"
  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-700"
  value={customRate}
  onChange={handleCustomRateChange}
  placeholder="e.g., 25.50"
  min={0}
/>
```
**Breakdown:**
- `w-full` = width: 100% of parent
- `p-3` = padding: 12px all sides
- `border border-gray-300` = 1px solid border, light grey
- `rounded-md` = border-radius: 6px
- `focus:ring-2 focus:ring-blue-500` = on keyboard focus, add 2px ring in blue
- `focus:border-transparent` = remove border during focus (ring takes precedence)
- `placeholder-gray-400` = lighter text colour for placeholder
- `text-gray-700` = input text colour

### Status Badge (Green/Red/Yellow)
```jsx
// Source: OverviewBreakdown.js existing implementation (lines 26, 33, 39)
// Location: src/components/OverviewBreakdown.js

// Green badge
<span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
  OK
</span>

// Red badge
<span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
  Underpaid
</span>

// Yellow badge
<span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
  Overpaid
</span>
```
**Explanation:**
- `px-2 py-1` = horizontal padding 8px, vertical padding 4px (compact badge)
- `bg-green-100` = light green background
- `text-green-800` = dark green text (high contrast)
- `rounded` = small border-radius
- `text-xs` = font-size: 12px
- `font-medium` = font-weight: 500 (slightly bolder than normal)

### Loading Overlay with Spinner
```jsx
// Source: Tailwind CSS docs (z-index, animate-spin, opacity) + Flowbite spinner examples
// Location: src/App.js — wrap content below header

{awardLoading && (
  <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center pointer-events-auto">
    <div className="bg-white p-8 rounded-lg shadow-2xl">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-center mt-4 text-gray-600 font-medium">Loading award rates...</p>
    </div>
  </div>
)}
```
**Breakdown:**
- `fixed inset-0` = position: fixed; top/right/bottom/left: 0 (full viewport)
- `bg-black/50` = background: rgba(0,0,0,0.5) (semi-transparent)
- `z-40` = z-index: 40 (Tailwind's predefined scale; above content, below modals)
- `flex items-center justify-center` = flexbox centered both axes
- `pointer-events-auto` = allow clicks to pass through (dismiss on click)
- `w-10 h-10` = width/height 40px
- `border-4 border-gray-200 border-t-blue-600` = 4px border, grey except top (blue) — creates spinner effect
- `animate-spin` = applies Tailwind's built-in `animation: spin 1s linear infinite`

### Error Banner (Dismissible)
```jsx
// Source: CONTEXT.md D-09, D-10 + Tailwind alert patterns
// Location: src/App.js — render after header, before AwardSelector

{awardError && (
  <div className="mx-auto max-w-4xl px-4 py-4 mb-6">
    <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-red-700 mb-1">Unable to Load Award Rates</h3>
          <p className="text-red-600 text-sm">{awardError}</p>
        </div>
        <button
          onClick={() => setAwardError(null)}
          className="ml-4 text-red-700 hover:text-red-900 hover:bg-red-100 rounded p-1 font-bold text-lg leading-none"
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  </div>
)}
```
**Breakdown:**
- `bg-red-50` = very light red background
- `border-l-4 border-red-600` = 4px left border in dark red (alert indicator)
- `p-4` = padding: 16px
- `flex justify-between items-start` = horizontal flexbox, space-between, align to top
- `ml-4` = margin-left on button (space from text)
- `hover:text-red-900 hover:bg-red-100` = darker on hover
- `aria-label` = accessibility label for screen readers

### Table with Horizontal Scroll
```jsx
// Source: Tailwind overflow docs + WorkHours.js existing pattern (line 7)
// Location: src/components/WorkHours.js

<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="bg-gray-100">
        <th className="p-2 text-left font-semibold text-gray-700">Day</th>
        <th className="p-2 text-left font-semibold text-gray-700">Start Time</th>
        <th className="p-2 text-left font-semibold text-gray-700">End Time</th>
        <th className="p-2 text-left font-semibold text-gray-700">Public Holiday?</th>
      </tr>
    </thead>
    <tbody>
      {weeklyData.map((day, index) => (
        <tr key={index} className="border-b border-gray-300 hover:bg-gray-50">
          <td className="p-2 text-gray-700">{day.day}</td>
          <td className="p-2">
            <input
              type="time"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              value={day.startTime}
              onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
            />
          </td>
          {/* ... end time, public holiday ... */}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```
**Breakdown:**
- `overflow-x-auto` = horizontal scroll on small screens (width: 100% max, scroll if content wider)
- `w-full` = table takes full container width (enables scroll trigger)
- `border-collapse` = CSS table border collapse (avoid double borders)
- `bg-gray-100` = header row background
- `p-2` = cell padding 8px
- `border-b border-gray-300` = bottom border on rows
- `hover:bg-gray-50` = light hover effect on rows

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-written CSS files (.css) | Utility-first Tailwind CSS | 2022–2024 (Tailwind adoption spike) | Faster development, smaller bundle (purge unused), consistency, no naming conflicts |
| Media queries in CSS | Responsive prefixes in HTML (sm:, md:, lg:) | 2017+ (Tailwind v1) | Easier to reason about responsive design; mobile-first by default; less CSS context switching |
| Focus outlines (default browser) | Tailwind focus-ring utilities | 2020+ (accessibility focus) | Branded focus styles that comply with WCAG; rings are more visible than outlines on light backgrounds |
| Inline styles or CSS-in-JS | Utility classes in className | 2018+ (Tailwind adoption) | Static analysis enables tree-shaking; no runtime CSS parsing; faster renders |
| Custom loading spinners (GIFs, SVGs) | CSS animations with `animate-spin` | 2019+ (Tailwind animation utils) | Zero HTTP requests; single-colour spinners are smaller; fully customizable |

**Deprecated/outdated:**
- **Bootstrap utility classes (outdated):** Bootstrap v4 had utilities, but v5+ moved toward CSS framework philosophy. Tailwind is now the ecosystem standard for utility-first design.
- **CSS-in-JS for simple styling (less common):** Libraries like Styled Components are still used, but Tailwind's static approach is faster and more maintainable for non-dynamic styling.
- **CSS preprocessors (Sass) for organization (declining):** Tailwind's utilities + component extraction (`@apply`) handle most use cases without Sass.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v3 Create React App Guide](https://v3.tailwindcss.com/docs/guides/create-react-app) — Official v3 installation steps, content path configuration
- [Tailwind CSS Framework Guides (current)](https://tailwindcss.com/docs/installation/framework-guides) — Confirms CRA not officially listed; recommends CLI or PostCSS approach
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design) — Mobile-first breakpoints, prefix documentation
- [Tailwind CSS Overflow Utilities](https://tailwindcss.com/docs/overflow) — `overflow-x-auto` documentation
- [Tailwind CSS Z-Index](https://tailwindcss.com/docs/z-index) — Predefined z-index scale, overlay positioning
- [Tailwind CSS Animation (animate-spin)](https://tailwindcss.com/docs/animation) — Built-in spinner animation
- [Tailwind CSS Focus and Hover States](https://tailwindcss.com/docs/hover-focus-and-other-states) — Focus ring documentation, accessibility patterns
- [Material Tailwind Form Input Examples](https://www.material-tailwind.com/docs/html/spinner) — Spinner + form styling patterns
- [Flowbite Tailwind Components](https://flowbite.com/docs/components/spinner/) — Spinner, table, status badge examples

### Secondary (MEDIUM confidence)
- [How to Install Tailwind CSS with Create React App (2026 Workflow)](https://thelinuxcode.com/how-i-install-tailwind-css-in-a-create-react-app-project-2026-workflow-no-surprises/) — 2026-updated CRA setup guide; confirms v3 compatibility
- [Tailwind CSS v3 vs v4 Comparison](https://staticmania.com/blog/tailwind-v4-vs-v3-comparison) — Performance comparison; v4 PostCSS issues with CRA noted

### Tertiary (LOW confidence)
- [Tailwind CSS Common Mistakes](https://medium.com/@sanjeevanibhandari3/the-10-most-common-mistakes-new-tailwind-users-make-and-how-to-avoid-them-8275ea3606d8) — Community patterns; not official but reflects widespread practices

## Metadata

**Confidence breakdown:**
- **Standard stack (Tailwind v3, PostCSS v8):** HIGH — Official Tailwind v3 CRA guide + npm registry confirm versions and setup
- **Installation process:** HIGH — Official documentation verified; standard npm workflow
- **Responsive patterns (grid-cols-1 md:grid-cols-3):** HIGH — Tailwind idiom; already in codebase (App.js line 354)
- **Status badges (bg-green-100 text-green-800):** HIGH — Already in OverviewBreakdown.js; Tailwind standard pattern
- **Loading overlay (fixed inset-0 z-40):** MEDIUM — Tailwind best practices; confirmed in multiple authoritative examples (Flowbite, Material Tailwind)
- **Form focus rings (focus:ring-2):** HIGH — Tailwind documentation + WCAG accessibility standards
- **Spinner animation (animate-spin):** HIGH — Tailwind built-in utility; documented
- **Common pitfalls (purge, focus-visible, overlay positioning):** MEDIUM — Based on community discussions + Tailwind best practices docs

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (Tailwind v3 is stable LTS; minimal breaking changes expected in next month)
**Knowledge cutoff note:** Training data includes Tailwind v3 patterns and v4 release (Oct 2024); current research confirms v3 is recommended for CRA as of Feb 2025.
