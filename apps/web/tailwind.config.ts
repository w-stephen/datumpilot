import forms from "@tailwindcss/forms";
import animate from "tailwindcss-animate";

// Tailwind v4 config - theme is defined in globals.css via @theme
const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [forms, animate],
};

export default config;
