/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'figtree': ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'sans': ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'comfortaa': ['Comfortaa', 'ui-rounded', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9f3',
          100: '#dcefe2',
          200: '#bde0ca',
          300: '#90c9a8',
          400: '#5fad81',
          500: '#4ea674',  // Main green
          600: '#459071',  // Dark green
          700: '#2d664c',
          800: '#26523d',
          900: '#214334',
        },
        secondary: {
          50: '#f0f9f3',
          100: '#dcefe2',
          200: '#bde0ca',
          300: '#90c9a8',
          400: '#5fad81',
          500: '#4ea674',
          600: '#459071',
          700: '#2d664c',
          800: '#26523d',
          900: '#214334',
        },
      },
    },
  },
  plugins: [],
}