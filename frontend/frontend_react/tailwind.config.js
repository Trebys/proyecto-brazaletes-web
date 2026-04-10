// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        fondoLogin: '#00565F',
        fondoPrincipal: '#39826F',
        fondoInput: '#398269',

        // Colores específicos para brazaletes
        braceletEstandar: '#bbf7d0',
        braceletEspecial: '#fed7aa',
        braceletPremium: '#bfdbfe',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        playwrite: ['Playwrite AU SA', 'serif'],
      },
    },
  },
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  plugins: [],
};
