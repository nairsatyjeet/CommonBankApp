/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6EBF5',
          100: '#C0CEE6',
          200: '#96AED6',
          300: '#6C8EC5',
          400: '#4D75B8',
          500: '#2E5CAB',
          600: '#2A54A4',
          700: '#244A9A',
          800: '#1E4191',
          900: '#0A2463', // primary
        },
        secondary: {
          50: '#FFF8E6',
          100: '#FFEEBF',
          200: '#FFE299',
          300: '#FFD673',
          400: '#FFCD57',
          500: '#FFC53B',
          600: '#FFBF35',
          700: '#FFB82D',
          800: '#FFB026',
          900: '#FFD700', // accent gold
        },
        success: {
          500: '#36B37E',
        },
        warning: {
          500: '#FFAB00',
        },
        error: {
          500: '#FF5630',
        },
        background: {
          light: '#F5F7FA',
          dark: '#121A2B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};