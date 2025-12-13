import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

// Tailwind v4 config - theme is defined in globals.css via @theme
const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  plugins: [forms, typography, animate],
};

export default config;
