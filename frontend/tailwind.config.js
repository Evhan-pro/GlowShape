/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FBFDFF',
        foreground: '#000000',
        primary: '#D8BAC3',
        'primary-foreground': '#FFFFFF',
        secondary: '#F5F0F2',
        'secondary-foreground': '#000000',
        muted: '#F9F6F7',
        'muted-foreground': '#6B6B6B',
        accent: '#D8BAC3',
        'accent-foreground': '#FFFFFF',
        border: '#E8DFE3',
        input: '#E8DFE3',
        ring: '#D8BAC3',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(216, 186, 195, 0.15)',
        hover: '0 10px 40px -10px rgba(216, 186, 195, 0.25)',
      },
    },
  },
  plugins: [],
}