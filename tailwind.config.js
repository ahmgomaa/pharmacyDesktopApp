/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9f4',
          100: '#d5f0e3',
          500: '#14a37f',
          600: '#0d8a6a',
          700: '#0a6e55'
        }
      }
    }
  },
  plugins: []
}
