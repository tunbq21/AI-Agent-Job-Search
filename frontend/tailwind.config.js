/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F3ED',
        surface: '#FFFFFF',
        'surface-alt': '#F9FAFE',
        'surface-border': '#E2E8F0',
        primary: '#F4A6A4', // Soft pink
        secondary: '#A5CFC9', // Teal green
        tertiary: '#F4E3C5', // Beige/yellow
        quaternary: '#1E293B', // Dark Navy
        'content-strong': '#1E293B',
        'content-muted': '#64748b',
      }
    },
  },
  plugins: [],
}
