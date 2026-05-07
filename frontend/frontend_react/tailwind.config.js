// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        fondoLogin: '#004C55',
        fondoPrincipal: '#398269',
        fondoInput: '#E7F3EF',

        // Colores específicos para brazaletes
        braceletEstandar: '#DDF8E8',
        braceletEspecial: '#FFE2BD',
        braceletPremium: '#DCEBFF',
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
