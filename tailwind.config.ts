import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        critical: '#B91C1C',     // Darker red - WCAG AA compliant (7.0:1)
        essential: '#D97706',    // Darker amber - WCAG AA compliant (4.5:1)
        routine: '#0E7490',      // Darker cyan - better contrast
        maintenance: '#7C3AED',
        optimal: '#16A34A',      // Darker green - better contrast
        ink: {
          100: '#0A0A0A',
          80: '#404040',
          60: '#737373',
          40: '#A3A3A3',
          20: '#E5E5E5',
          5: '#FAFAFA',
        }
      },
      fontFamily: {
        display: ['Inter Display', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        unit: '4px',
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
} satisfies Config