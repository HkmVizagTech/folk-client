/** @type {import('tailwindcss').Config} */

// FOLK Vizag design tokens.
// Anchored on the logo's navy (#032B7C) with a saffron accent, near-black
// header/footer and a marigold band, in the spirit of folknet.in. The old
// names (saffron, gold, cream, celestial) are kept but re-pointed at the new
// palette, so every existing screen picks up the new look without edits.
const navy = {
  50: '#EEF2FA',
  100: '#D6E0F3',
  200: '#AEC0E6',
  300: '#7E98D3',
  400: '#4B6BB9',
  500: '#23479C',
  600: '#0F3689',
  700: '#032B7C', // logo navy
  800: '#052263',
  900: '#07194A',
  DEFAULT: '#032B7C',
};

const saffron = {
  light: '#F59A5C',
  DEFAULT: '#E4702A',
  dark: '#C25A1B',
  50: '#FDF3EC',
  100: '#FBE3D2',
  600: '#C25A1B',
};

const marigold = {
  light: '#FBDA6B',
  DEFAULT: '#F2B705',
  dark: '#C99400',
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
          DEFAULT: '#101217',
          soft: '#1B1E26',
          muted: '#5B6170',
        },
        navy,
        saffron,
        marigold,
        paper: {
          DEFAULT: '#F7F4EE',
          dark: '#ECE6DA',
        },
        line: '#E3DDD1',
        // Legacy names, re-pointed:
        gold: marigold,
        cream: {
          DEFAULT: '#F7F4EE',
          dark: '#ECE6DA',
        },
        celestial: {
          light: navy[100],
          DEFAULT: navy[500],
          dark: navy[700],
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        // Legacy families all resolve to the new display face.
        inter: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        poppins: ['Montserrat', 'system-ui', 'sans-serif'],
        cinzel: ['Montserrat', 'system-ui', 'sans-serif'],
        playfair: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        // Neutral, low shadows instead of orange glows.
        'soft': '0 1px 2px rgba(16,18,23,0.06), 0 1px 1px rgba(16,18,23,0.04)',
        'premium': '0 1px 3px rgba(16,18,23,0.08), 0 1px 2px rgba(16,18,23,0.05)',
        'premium-xl': '0 8px 24px -8px rgba(16,18,23,0.18)',
        'card': '0 1px 2px rgba(16,18,23,0.06)',
      },
      letterSpacing: {
        label: '0.08em',
      },
    },
  },
  plugins: [],
}
