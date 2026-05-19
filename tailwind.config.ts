import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      ipad: '768px',
      'ipad-landscape': '1024px',
      desktop: '1280px',
    },
    extend: {
      colors: {
        mostaza: {
          50: 'rgb(var(--brand-primary-muted-rgb) / <alpha-value>)',
          100: 'rgb(var(--brand-primary-soft-rgb) / <alpha-value>)',
          300: 'rgb(var(--brand-primary-border-rgb) / <alpha-value>)',
          400: 'rgb(var(--brand-primary-hover-rgb) / <alpha-value>)',
          500: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          600: 'rgb(var(--brand-primary-pressed-rgb) / <alpha-value>)',
          700: 'rgb(var(--brand-accent-text-rgb) / <alpha-value>)',
          800: 'rgb(var(--brand-accent-text-rgb) / <alpha-value>)',
        },
        coral: { 50: '#FFF3F1', 100: '#FFE0DB', 500: '#FF6B5B', 600: '#E75648' },
        menta: { 50: '#F0FBF6', 100: '#D4F2E4', 500: '#5BC499', 600: '#3EA87D' },
        uva: { 100: '#E5DEFF', 500: '#7C5CFF' },
        crema: {
          50: 'rgb(var(--brand-surface-rgb) / <alpha-value>)',
          100: 'rgb(var(--brand-surface-strong-rgb) / <alpha-value>)',
        },
        ink: {
          100: '#EDE7DB',
          300: '#C4BCAE',
          500: '#766B5C',
          700: '#3D362C',
          900: '#1A1611',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter, Inter)', 'Inter', 'system-ui', 'sans-serif'],
        heading: [
          'var(--font-dm-sans, "DM Sans")',
          'DM Sans',
          'var(--font-inter, Inter)',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(26,22,17,0.06)',
        md: '0 4px 16px rgba(26,22,17,0.08)',
        lg: '0 12px 36px rgba(26,22,17,0.12)',
        xl: '0 24px 64px rgba(26,22,17,0.16)',
        'glow-mostaza': '0 0 0 4px rgba(244, 180, 0, 0.22)',
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
