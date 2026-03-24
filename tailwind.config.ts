import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-soft":
          "pulse-soft 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(37, 211, 102, 0.45)",
          },
          "50%": {
            boxShadow: "0 0 0 14px rgba(37, 211, 102, 0)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
