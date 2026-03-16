/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dunder': {
          blue: '#1a365d',
          gray: '#4a5568',
          gold: '#d69e2e',
          green: '#38a169',
          red: '#e53e3e',
        }
      },
      fontFamily: {
        'office': ['Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
