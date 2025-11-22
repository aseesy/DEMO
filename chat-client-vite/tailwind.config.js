import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tokensPath = path.join(__dirname, '..', '.design-tokens-mcp', 'tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Teal palette from design tokens
        teal: {
          lightest: tokens.colors.teal.lightest.value,
          light: tokens.colors.teal.light.value,
          medium: tokens.colors.teal.medium.value,
          dark: tokens.colors.teal.dark.value,
          darkest: tokens.colors.teal.darkest.value,
        },
        // Gray scale from design tokens
        gray: {
          50: tokens.colors.ui.gray['50'].value,
          100: tokens.colors.ui.gray['100'].value,
          200: tokens.colors.ui.gray['200'].value,
          300: tokens.colors.ui.gray['300'].value,
          400: tokens.colors.ui.gray['400'].value,
          500: tokens.colors.ui.gray['500'].value,
          600: tokens.colors.ui.gray['600'].value,
          700: tokens.colors.ui.gray['700'].value,
          800: tokens.colors.ui.gray['800'].value,
          900: tokens.colors.ui.gray['900'].value,
        },
        // Primary and secondary colors
        primary: {
          white: tokens.colors.primary.white.value,
        },
        secondary: {
          darkGrey: tokens.colors.secondary.darkGrey.value,
        },
        // UI colors
        ui: {
          background: tokens.colors.ui.background.value,
          surface: tokens.colors.ui.surface.value,
          border: tokens.colors.ui.border.value,
          text: {
            primary: tokens.colors.ui.text.primary.value,
            secondary: tokens.colors.ui.text.secondary.value,
            tertiary: tokens.colors.ui.text.tertiary.value,
          },
        },
        // Semantic colors
        semantic: {
          success: tokens.colors.semantic.success.value,
          warning: tokens.colors.semantic.warning.value,
          error: tokens.colors.semantic.error.value,
          info: tokens.colors.semantic.info.value,
        },
        // Add common colors for compatibility
        red: {
          50: '#fef2f2',
          200: '#fecaca',
          600: '#dc2626',
          700: '#b91c1c',
        },
        green: {
          600: '#16a34a',
        },
        yellow: {
          600: '#ca8a04',
        },
      },
      spacing: {
        xs: tokens.spacing.xs.value,
        sm: tokens.spacing.sm.value,
        md: tokens.spacing.md.value,
        lg: tokens.spacing.lg.value,
        xl: tokens.spacing.xl.value,
        '2xl': tokens.spacing['2xl'].value,
        '3xl': tokens.spacing['3xl'].value,
      },
      borderRadius: {
        sm: tokens.borderRadius.sm.value,
        md: tokens.borderRadius.md.value,
        lg: tokens.borderRadius.lg.value,
        xl: tokens.borderRadius.xl.value,
        '2xl': tokens.borderRadius['2xl'].value,
        full: tokens.borderRadius.full.value,
      },
      boxShadow: {
        sm: tokens.shadows.sm.value,
        md: tokens.shadows.md.value,
        lg: tokens.shadows.lg.value,
        xl: tokens.shadows.xl.value,
        '2xl': tokens.shadows['2xl'].value,
      },
      fontFamily: {
        primary: tokens.typography.fontFamily.primary.value.split(',').map(f => f.trim().replace(/'/g, '')),
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: tokens.typography.fontSize.xs.value,
        sm: tokens.typography.fontSize.sm.value,
        base: tokens.typography.fontSize.base.value,
        lg: tokens.typography.fontSize.lg.value,
        xl: tokens.typography.fontSize.xl.value,
        '2xl': tokens.typography.fontSize['2xl'].value,
        '3xl': tokens.typography.fontSize['3xl'].value,
        '4xl': tokens.typography.fontSize['4xl'].value,
      },
      fontWeight: {
        normal: tokens.typography.fontWeight.normal.value,
        medium: tokens.typography.fontWeight.medium.value,
        semibold: tokens.typography.fontWeight.semibold.value,
        bold: tokens.typography.fontWeight.bold.value,
      },
      zIndex: {
        nav: tokens.navigation.zIndex.value,
        modal: tokens.modal.zIndex.value,
      },
    },
  },
  plugins: [],
};
