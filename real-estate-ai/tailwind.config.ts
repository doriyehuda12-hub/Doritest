import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // מחסנית גופנים עם תמיכה בעברית (ללא תלות ברשת)
        sans: ['Rubik', 'Heebo', 'Assistant', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0e5a8a',
          dark: '#0a3f61',
          light: '#e6f0f7',
        },
      },
    },
  },
  plugins: [],
};

export default config;
