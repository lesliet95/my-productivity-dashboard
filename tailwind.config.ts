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
        alabaster: "#c8b5a2",
        pewter: {
          DEFAULT: "#d9aa90",
          light: "#e8c8b4",
          dark: "#c08a6c",
        },
        bronze: {
          DEFAULT: "#a65e46",
          light: "#c07a60",
          dark: "#844939",
        },
        mahogany: {
          DEFAULT: "#07203f",
          light: "#0d3260",
          dark: "#041628",
        },
        slate: {
          DEFAULT: "#3d6080",
          light: "#527aa0",
          dark: "#2a4460",
        },
        obsidian: {
          DEFAULT: "#07203f",
          light: "#0d3260",
          dark: "#02000d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
