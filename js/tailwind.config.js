/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#004F98",
        "primary-hover": "#003A70",
        secondary: "#00A3E0",
        "secondary-hover": "#008CBE",
        accent: "#FACC15",

        background: "#F8FAFC",
        surface: "#FFFFFF",
        border: "#E2E8F0",

        "text-primary": "#0F172A",
        "text-secondary": "#475569",
      },
      fontFamily: {
        heading: ["Bebas Neue", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
