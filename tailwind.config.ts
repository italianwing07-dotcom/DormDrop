import type { Config } from "tailwindcss";

// DormLoot design tokens.
// Accent: one navy, used for every primary action and nothing decorative.
// Neutrals: warm, matched to the paper background (no cool/warm mixing).
// Radius: cards 16px, controls 10px, status pills full. Shadows are warm-tinted.
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
          brand: "#1E40AF",
          brandHover: "#1B3A9E",
          brandActive: "#172E7D",
          dark: "#152253",
          soft: "#EEF1FB",
          softBorder: "#D4DCF4",

          ink: "#1D1B17",
          muted: "#6B6459",
          subtle: "#938B7E",

          paper: "#F7F4EF",
          card: "#FFFFFF",
          surface: "#F2EEE7",
          border: "#E6E0D6",
          borderStrong: "#D5CDBF",

          success: "#15803D",
          successBg: "#E7F2E9",
          warning: "#A16207",
          warningBg: "#F8EFDC",
          danger: "#B4232B",
          dangerBg: "#FBEAEA"
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      borderRadius: {
        card: "16px",
        ctl: "10px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(32,28,22,0.04), 0 10px 24px -16px rgba(32,28,22,0.18)",
        pop: "0 2px 4px rgba(32,28,22,0.04), 0 18px 40px -20px rgba(32,28,22,0.28)",
        focus: "0 0 0 3px rgba(30,64,175,0.18)"
      },
      maxWidth: {
        prose: "65ch"
      }
    }
  },
  plugins: []
};

export default config;
