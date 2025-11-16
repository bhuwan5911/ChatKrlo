/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      // Yahaan hum aapki image add kar rahe hain
      backgroundImage: {
        'custom-bg': "url('/bg.png')", 
      }
    },
  },
  plugins: [],
}