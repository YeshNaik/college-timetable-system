/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#253B65', hover: '#1C2E50', soft: '#E8EDF5' },
        secondary: { DEFAULT: '#426A9B', soft: '#EAF0F7' },
        app: '#F6F7F9',
        ink: { DEFAULT: '#202938', muted: '#6B7280' },
        line: '#E5E7EB',
        success: { DEFAULT: '#16845B', soft: '#E6F4EE' },
        warning: { DEFAULT: '#B7791F', soft: '#FBF3E2' },
        danger: { DEFAULT: '#D9534F', soft: '#FBEAE9' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '4px', md: '6px', lg: '8px' },
      boxShadow: { panel: '0 1px 2px rgba(16,24,40,0.04)' },
    },
  },
  plugins: [],
};
