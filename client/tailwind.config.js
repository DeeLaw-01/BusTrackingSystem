/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Action Color
        primary: {
          DEFAULT: '#F23B3B',
          hover: '#D32F2F',
        },
        // Background System
        'app-bg': '#F2F2F2',
        'app-card': '#FFFFFF',
        'app-splash': '#7B5442',
        // Text Color Hierarchy
        'content-primary': '#222222',
        'content-secondary': '#777777',
        // Border and UI elements
        'ui-border': '#E0E0E0',
        'ui-focus': '#333333',
        // Legacy colors (keeping some for compatibility during transition)
        chocolate: {
          700: '#7B5442',
        },
        coral: {
          500: '#F23B3B',
          600: '#D32F2F',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
