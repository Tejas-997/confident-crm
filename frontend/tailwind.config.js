/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      colors: {
        ink: '#14171F',
        canvas: '#F6F7F9',
        navy: {
          700: '#1F2A44',
          800: '#172036',
          900: '#111829',
        },
      },
    },
  },
  plugins: [],
}
