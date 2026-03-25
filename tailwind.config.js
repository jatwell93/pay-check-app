/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand — primary action colour and accent
        brand: {
          DEFAULT: '#0f766e',  // teal-700
          dark:    '#115e59',  // teal-800 — hover / pressed
          light:   '#2dd4bf',  // teal-400 — on dark backgrounds
          subtle:  '#f0fdfa',  // teal-50  — row highlights
          muted:   '#ccfbf1',  // teal-100 — badge backgrounds
        },
        // Surfaces — backgrounds for page, cards, table headers
        surface: {
          DEFAULT: '#ffffff',
          page:    '#f8fafc',  // slate-50
          header:  '#f1f5f9',  // slate-100
        },
        // Edges — borders for cards, inputs, dividers
        edge: {
          DEFAULT: '#e5e7eb',  // gray-200
          input:   '#d1d5db',  // gray-300
          subtle:  '#e2e8f0',  // slate-200
        },
        // Ink — text colours
        ink: {
          DEFAULT: '#374151',  // gray-700
          strong:  '#1e293b',  // slate-800
          subtle:  '#94a3b8',  // slate-400
          muted:   '#9ca3af',  // gray-400
        },
        // Canvas — dark hero/header backgrounds
        canvas: {
          dark:    '#0f172a',  // slate-900
        },
        // Amber — brand accent for alerts, warnings, discrepancies
        amber: {
          DEFAULT: '#D97706',
          light:   '#FDE68A',
          dark:    '#92400E',
          subtle:  '#FFFBEB',
        },
        // Semantic — status states
        success: {
          DEFAULT: '#10B981',
          bg:      '#ECFDF5',
          dark:    '#065F46',
        },
        critical: {
          DEFAULT: '#EF4444',
          bg:      '#FEF2F2',
          dark:    '#991B1B',
        },
      },
    },
  },
  plugins: [],
}
