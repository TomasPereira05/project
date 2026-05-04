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

        muted: "#F1F5F9",
        "muted-foreground": "#64748B",
      },
      fontFamily: {
        heading: ["Bebas Neue", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 1s ease-out forwards',
        slideIn: 'slideIn 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};