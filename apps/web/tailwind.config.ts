import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        haven: {
          bg: '#09090B',
          surface: '#111113',
          card: '#18181B',
          border: '#27272A',
          text: '#FAFAFA',
          'text-secondary': '#A1A1AA',
          accent: '#6366F1',
          destructive: '#EF4444',
          success: '#22C55E',
        },
      },
      borderRadius: {
        haven: '12px',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
