/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // BGS brand
        primary: "#FD6A02",
        "primary-2": "#D26101",
        "primary-soft": "rgba(253,106,2,0.10)",
        "primary-soft-dark": "rgba(253,106,2,0.17)",
        danger: "#E5484D",
        success: "#16A34A",
        muted: "#6B7280",
        card: "#FFFFFF",
        "card-dark": "#181B22",
        border: "#E5E7EB",
        "border-dark": "#374151",
        bg: "#EEF0F3",
        "bg-dark": "#0E1014",
      },
      fontFamily: {
        sans: ["Onest", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
