/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dalscooter-green': '#32746D',
        'dalscooter-orange': '#EF8354',
      }
    },
  },
  plugins: [],
}