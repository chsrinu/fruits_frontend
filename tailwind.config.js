/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#030014",
        secondary: "#151312",
        light:{
          100:"#F5F5F5",
          200:"#E5E5E5",
          300:"#D4D4D4",
        },
        dark:{
          100:"#151312",
          200:"#030014",
        }
      },
    },
  },
  plugins: [],
}