/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#eef1eb',
        ink: '#17251f',
        forest: '#174d3c',
        mint: '#dce9df',
      },
      boxShadow: {
        panel: '0 24px 70px rgba(24, 47, 37, 0.12)',
      },
    },
  },
  plugins: [],
}
