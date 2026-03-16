/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        office: {
          navy: '#1a3a5c',
          'navy-light': '#234b73',
          'navy-dark': '#122940',
          mustard: '#c9a227',
          'mustard-light': '#d4b23e',
          'mustard-dark': '#a8871e',
          red: '#b8342e',
          'red-light': '#d04a44',
          paper: '#f5f0e8',
          'paper-dark': '#e8e0d0',
          cream: '#faf7f2',
          brown: '#6b5b4e',
          green: '#2d7a4f',
        },
      },
      fontFamily: {
        office: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26, 58, 92, 0.08), 0 4px 12px rgba(26, 58, 92, 0.04)',
        'card-hover': '0 4px 12px rgba(26, 58, 92, 0.12), 0 8px 24px rgba(26, 58, 92, 0.06)',
      },
    },
  },
  plugins: [],
}
