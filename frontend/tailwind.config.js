/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F7FF',
        surface: '#FFFFFF',
        'surface-alt': '#F9FAFE',
        'surface-border': '#E2E8F0',
        primary: '#9A9CEA', // Periwinkle 1
        secondary: '#A2B9EE', // Periwinkle 2
        tertiary: '#A2DCEE', // Periwinkle 3
        quaternary: '#ADEEE2', // Periwinkle 4
        'content-strong': '#334155',
        'content-muted': '#64748b',
      }
    },
  },
  plugins: [],
}
