import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#fff6e4",
        ink: "#171516",
        sun: "#ffc51b",
        sunset: "#f47a15",
        brandred: "#e50d25",
        pine: "#0b5a32",
        muted: "#4a3424",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-review":
          "pulse-review 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "pulse-review": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(244, 122, 21, 0.55)",
          },
          "70%": {
            boxShadow: "0 0 0 14px rgba(244, 122, 21, 0)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
