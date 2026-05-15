import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mostaza: {
          50: 'var(--mostaza-50)',
          100: 'var(--mostaza-100)',
          400: 'var(--mostaza-400)',
          500: 'var(--mostaza-500)',
          600: 'var(--mostaza-600)',
        },
        coral: { 100: '#FFE0DB', 500: '#FF6B5B' },
        menta: { 100: '#D4F2E4', 500: '#6BD4A4' },
        uva: { 100: '#E5DEFF', 500: '#7C5CFF' },
        crema: { 50: '#FFFCF5', 100: '#FFF8E7' },
        ink: {
          100: '#EDE7DB',
          300: '#C4BCAE',
          500: '#766B5C',
          700: '#3D362C',
          900: '#1A1611',
        },
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(26,22,17,0.06)',
        md: '0 4px 12px rgba(26,22,17,0.08)',
        lg: '0 12px 32px rgba(26,22,17,0.12)',
        xl: '0 24px 64px rgba(26,22,17,0.16)',
        'glow-mostaza': '0 0 0 4px color-mix(in srgb, var(--mostaza-500) 20%, transparent)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s linear infinite',
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
