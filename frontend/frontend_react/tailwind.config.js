/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        fondoLogin: '#00565F', // Nombre que elijas para el color
        fondoPrincipal: '#39826F',
        fondoInput: '#398269',
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
