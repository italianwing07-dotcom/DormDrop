import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          ink: "#17211f",
          green: "#1f7a5c",
          mint: "#dff5eb",
          gold: "#f3b43f",
          coral: "#ef6f5e",
          paper: "#fbfaf6"
        }
      },
      boxShadow: {
        soft: "0 16px 40px rgba(23, 33, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
