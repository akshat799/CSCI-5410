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
        'dalscooter-blue': '#2B83F6',
        'dalscooter-gray': '#6B7280',
        'dalscooter-light-gray': '#F3F4F6',
        'dalscooter-dark': '#1F2937',
        'dalscooter-success': '#10B981',
        'dalscooter-warning': '#F59E0B',
        'dalscooter-error': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'dalscooter': '0 10px 25px rgba(0, 0, 0, 0.08)',
        'dalscooter-lg': '0 20px 40px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'dalscooter': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}