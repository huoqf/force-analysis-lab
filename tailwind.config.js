/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        win11: {
          blue: '#0078d4',
          bg: '#0a0a0a',
          glass: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
        },
        physics: {
          gravity: '#ff4d4d',
          normal: '#4d94ff',
          friction: '#4dff88',
          external: '#ff9f4d',
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
