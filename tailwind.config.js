/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#fdf3ee',
          100: '#fae4d4',
          500: '#C4521A',
          600: '#a8431a',
          700: '#8B2500',
        },
        gold: {
          400: '#D4A017',
          500: '#C8960B',
        },
        forest: {
          700: '#1A4731',
          800: '#142D1F',
          900: '#0D1E15',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.4s ease forwards',
        'slideIn': 'slideIn 0.3s ease forwards',
      }
    },
  },
  plugins: [],
}
