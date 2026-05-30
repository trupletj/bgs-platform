/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        danger: "#EF4444",
        success: "#22C55E",
        muted: "#6B7280",
        card: "#FFFFFF",
        "card-dark": "#1E1E1E",
        border: "#E5E7EB",
        "border-dark": "#374151",
      },
    },
  },
  plugins: [],
};
