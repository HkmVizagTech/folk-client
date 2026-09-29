/** @type {import('tailwindcss').Config} */

// FOLK Vizag design tokens: warm, ISKCON-style.
// Cream and white surfaces, traditional saffron, deep maroon and temple gold.
// Token names are kept from the previous theme (navy, ink, marigold, ...), so
// every screen follows the palette. "navy" resolves to maroon, the accent for
// icons and chips; the logo keeps its own navy.
const navy = {
  50: '#FBF0EE',
  100: '#F4DAD5',
  200: '#E6B3AA',
  300: '#D3857A',
  400: '#B85A4E',
  500: '#9C3A30',
  600: '#8A2C25',
  700: '#7A1F2B', // deep maroon
  800: '#5F1822',
  900: '#43111A',
  DEFAULT: '#7A1F2B',
};

const saffron = {
  light: '#F6A660',
  DEFAULT: '#E8731C',
  dark: '#C45A0E',
  50: '#FEF3E8',
  100: '#FCE3CC',
  600: '#C45A0E',
};

const marigold = {
  light: '#F3D98E',
  DEFAULT: '#D9A63A', // temple gold
  dark: '#A87A1C',
};

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
        ink: {
          DEFAULT: '#2B1F17', // warm brown-black text
          soft: '#3D2E24',
          muted: '#6E5E52',
        },
        navy,
        saffron,
        marigold,
        paper: {
          DEFAULT: '#FBF6EC', // cream
          dark: '#F3EADB',
        },
        line: '#EADFCB',
        // Legacy names, re-pointed:
        gold: marigold,
        cream: {
          DEFAULT: '#FBF6EC',
          dark: '#F3EADB',
        },
        celestial: {
          light: navy[100],
          DEFAULT: navy[500],
          dark: navy[700],
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        display: ['Lora', 'Georgia', 'serif'],
        // Legacy families resolve to the new faces.
        inter: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        poppins: ['Lora', 'Georgia', 'serif'],
        cinzel: ['Lora', 'Georgia', 'serif'],
        playfair: ['Lora', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(43,31,23,0.06), 0 1px 1px rgba(43,31,23,0.04)',
        'premium': '0 1px 3px rgba(43,31,23,0.08), 0 1px 2px rgba(43,31,23,0.05)',
        'premium-xl': '0 10px 30px -12px rgba(43,31,23,0.22)',
        'card': '0 1px 2px rgba(43,31,23,0.05)',
      },
      letterSpacing: {
        label: '0.08em',
      },
    },
  },
  plugins: [],
}
