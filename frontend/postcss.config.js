/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#e6edff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca'
        }
      }
    },
  },
  plugins: [],
}