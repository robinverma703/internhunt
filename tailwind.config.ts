import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F8FA",
        graphite: "#14161A",
        muted: "#6B7280",
        surface: "#FFFFFF",
        line: "#E7E9EE",
        signal: {
          DEFAULT: "#2A4CFF",
          dim: "#EEF1FF",
          deep: "#1B2FA3",
        },
        mint: {
          DEFAULT: "#0FB37D",
          dim: "#E7F9F1",
        },
      },
      fontFamily: {
        display: ["var(--font-geist)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,22,26,0.04), 0 8px 24px -12px rgba(20,22,26,0.10)",
        "card-hover": "0 2px 4px rgba(20,22,26,0.06), 0 16px 40px -16px rgba(42,76,255,0.25)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
        "pulse-dot": {
  "0%, 100%": { opacity: "1", transform: "scale(1)" },
  "50%": { opacity: "0.4", transform: "scale(0.85)" },
},
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        "pulse-dot": "pulse-dot 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
