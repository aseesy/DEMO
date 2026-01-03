/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  // Tailwind v4 uses @theme in CSS, but we keep this for backward compatibility
  // The actual theme is defined in src/index.css using @theme directive
  theme: {
    extend: {
      // These are now defined in CSS via @theme, but kept here for IDE autocomplete
      colors: {
        teal: {
          lightest: '#e6f7f5',
          light: '#c5e8e4',
          medium: '#00908b',
          dark: '#00908b',
          darkest: '#1f4447',
        },
      },
    },
  },
  plugins: [],
};
