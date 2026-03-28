/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Brand — primary action colour and accent
        brand: {
          teal:    '#0F766E',
          'teal-light': '#14B8A6',
          'teal-dark': '#0D5D5A',
          'teal-50': '#F0FDFA',
          'teal-100': '#CCFBF1',
          amber:   '#D97706',
          'amber-light': '#FDE68A',
          'amber-dark': '#92400E',
          'amber-50': '#FFFBEB',
          navy:    '#0F172A',
          'navy-mid': '#1E3A5F',
          sky:     '#0EA5E9',
        },
        // Semantic — status states
        success: {
          DEFAULT: '#10B981',
          bg:      '#ECFDF5',
        },
        warning: {
          DEFAULT: '#D97706',
          bg:      '#FFFBEB',
        },
        critical: {
          DEFAULT: '#EF4444',
          bg:      '#FEF2F2',
        },
        info: {
          DEFAULT: '#0EA5E9',
          bg:      '#F0F9FF',
        },
        // Neutral surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          page:    '#F8FAFC',
        },
        // Neutral edges
        edge: {
          light:   '#E2E8F0',
          mid:     '#CBD5E1',
        },
        // Ink — text colours
        ink: {
          primary: '#0F172A',
          secondary: '#475569',
          muted:   '#94A3B8',
        },
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15,23,42,0.06)',
        sm: '0 1px 3px rgba(15,23,42,0.10), 0 1px 2px rgba(15,23,42,0.06)',
        md: '0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.06)',
        lg: '0 10px 15px rgba(15,23,42,0.10), 0 4px 6px rgba(15,23,42,0.05)',
        xl: '0 20px 25px rgba(15,23,42,0.10), 0 8px 10px rgba(15,23,42,0.04)',
      },
    },
  },
  plugins: [],
}
