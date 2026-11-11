const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
      colors: {
        bg: v('bg'), surface: v('surface'), surface2: v('surface-2'), line: v('line'),
        ink: v('ink'), muted: v('muted'),
        brand: { DEFAULT: v('brand'), soft: v('brand-soft'), fg: v('brand-fg') },
        accent: v('accent'), success: v('success'), warn: v('warn'), danger: v('danger'), info: v('info'),
      },
      boxShadow: {
        card: '0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.06)',
        pop: '0 12px 32px -8px rgb(16 24 40 / 0.18), 0 4px 12px -4px rgb(16 24 40 / 0.08)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { 'fade-in': 'fadeIn .25s ease-out', },
    },
  },
  plugins: [],
};
