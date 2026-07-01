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
          ink: "#1F2937",
          muted: "#6B7280",
          green: "#1E40AF",
          hover: "#1D4ED8",
          dark: "#172554",
          mint: "#F8FAFC",
          successBg: "#DCFCE7",
          gold: "#F59E0B",
          coral: "#E85D75",
          success: "#16A34A",
          paper: "#F8F6F2",
          card: "#FFFFFF",
          surface: "#F3F4F6",
          border: "#E5E7EB"
        }
      },
      boxShadow: {
        soft: "0 12px 32px rgba(31, 41, 55, 0.08)",
        premium: "0 20px 60px rgba(31, 41, 55, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
