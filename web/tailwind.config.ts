import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'krishi-dark': '#1A4A1A',
        'krishi-mid': '#2D7A2D',
        'krishi-green': '#4ADE80',
        'krishi-light': '#D4F7A0',
        'krishi-muted': '#5A9A5A',
        'krishi-surface': '#F4F8F4',
        'krishi-card': '#FFFFFF',
        'krishi-border': '#D8ECD8',
        'krishi-yellow': '#F5C842',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        md: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
export default config;
