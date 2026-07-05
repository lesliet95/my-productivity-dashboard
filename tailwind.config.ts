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
        background: "var(--background)",
        foreground: "var(--foreground)",
        alabaster: "#eeece9",
        pewter: {
          DEFAULT: "#99b3b7",
          light: "#c4d4d6",
          dark: "#7a9699",
        },
        bronze: {
          DEFAULT: "#9d7960",
          light: "#b8967e",
          dark: "#7d5f49",
        },
        mahogany: {
          DEFAULT: "#6e3d23",
          light: "#8b5035",
          dark: "#542e1a",
        },
        slate: {
          DEFAULT: "#304e4d",
          light: "#3d6362",
          dark: "#243a39",
        },
        obsidian: {
          DEFAULT: "#1b2824",
          light: "#263832",
          dark: "#111a17",
        },
      },
    },
  },
  plugins: [],
};

export default config;
