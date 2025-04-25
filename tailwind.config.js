/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3563E9',
          dark: '#0D28A6',
        },
        accent: '#54D62C',
        dark: '#1A202C',
        gray: {
          text: '#637381',
          light: '#F6F8FD',
        },
        success: '#54D62C',
        warning: '#FFC107',
        error: '#FF4842',
        info: '#1890FF',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        }
      },
      animation: {
        shake: 'shake 0.8s cubic-bezier(.36,.07,.19,.97) both',
      },
    },
  },
  plugins: [],
} 