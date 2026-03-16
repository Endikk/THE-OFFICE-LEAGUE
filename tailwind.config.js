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
          green: '#3a7d44',
          'green-light': '#4a9d54',
          paper: '#f5f0e8',
          'paper-dark': '#e8d9b0',
          cream: '#faf7f2',
          brown: '#2c2416',
          'brown-light': '#6b5b4e',
          manila: '#e8d9b0',
          'sticky': '#fff9a8',
          'sticky-dark': '#f5ef98',
          'coffee-1': 'rgba(139, 90, 43, 0.04)',
          'coffee-2': 'rgba(139, 90, 43, 0.06)',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"Courier Prime"', 'Courier New', 'monospace'],
        sans: ['"DM Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        office: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
        'coffee-stain': "radial-gradient(ellipse at 85% 15%, rgba(139, 90, 43, 0.03) 0%, transparent 50%), radial-gradient(ellipse at 10% 80%, rgba(139, 90, 43, 0.025) 0%, transparent 40%)",
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26, 58, 92, 0.08), 0 4px 12px rgba(26, 58, 92, 0.04)',
        'card-hover': '0 4px 12px rgba(26, 58, 92, 0.12), 0 8px 24px rgba(26, 58, 92, 0.06)',
        'sticky': '2px 3px 8px rgba(0, 0, 0, 0.1), 1px 1px 3px rgba(0, 0, 0, 0.06)',
        'nav': '0 2px 12px rgba(26, 58, 92, 0.15)',
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-live': 'pulseLive 2s ease-in-out infinite',
        'wiggle': 'wiggle 0.3s ease-in-out',
        'quote-scroll': 'quoteScroll 20s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseLive: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-2deg)' },
          '75%': { transform: 'rotate(2deg)' },
        },
        quoteScroll: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      borderRadius: {
        'card': '0.75rem',
      },
    },
  },
  plugins: [],
}
