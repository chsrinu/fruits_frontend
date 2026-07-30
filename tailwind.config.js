/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#166534",
          "primary-pressed": "#14532d",
          "primary-foreground": "#ffffff",
          secondary: "#f59e0b",
          "secondary-pressed": "#d97706",
          "secondary-foreground": "#1f2937",
          background: "#ffffff",
          surface: "#f8fafc",
          border: "#cbd5e1",
          text: "#0f172a",
          muted: "#475569",
          accent: "#dcfce7",
          danger: "#dc2626",
        },
      },
    },
  },
  plugins: [],
}
