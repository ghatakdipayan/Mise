/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        'brand-primary': '#4CAF50',
        'brand-secondary': '#FFC107',
        'brand-dark': '#388E3C',
        'brand-light': '#C8E6C9',
        'brand-text': '#212121',
        'brand-bg': '#F1F8E9',
      },
    },
  },
  plugins: [],
};
