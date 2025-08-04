import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./static/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [typography()],
};

export default config;