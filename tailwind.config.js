/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ferrari: '#DC0000',
        'ferrari-dark': '#A00000',
        'bg-base': '#0A0A0A',
        'bg-surface': '#141414',
        'bg-elevated': '#1C1C1C',
        border: '#2A2A2A',
        'text-primary': '#FAFAF8',
        'text-secondary': '#9A9A9A',
        'text-muted': '#4A4A4A',
        live: '#22C55E',
        demo: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

