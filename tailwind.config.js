/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        saffron: {
          light: '#FFB84D',
          DEFAULT: '#FF9933',
          dark: '#E67E22',
        },
        gold: {
          light: '#FFF176',
          DEFAULT: '#FFD700',
          dark: '#DAA520',
        },
        cream: {
          DEFAULT: '#FFF8E7',
          dark: '#F5E6CC',
        },
        celestial: {
          light: '#ADE8F4',
          DEFAULT: '#87CEEB',
          dark: '#48CAE4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        playfair: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(255, 153, 51, 0.1)',
        'premium': '0 10px 30px -5px rgba(255, 153, 51, 0.15)',
        'premium-xl': '0 20px 50px -12px rgba(255, 153, 51, 0.2)',
      },
      backgroundImage: {
        'spiritual-gradient': 'linear-gradient(to bottom right, rgba(255, 248, 231, 0.9), rgba(255, 153, 51, 0.05))',
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
      },
    },
  },
  plugins: [],
}
