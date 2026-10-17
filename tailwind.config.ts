import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        obsidian: {
          800: "#111827",
          850: "#0e1424",
          900: "#0a0e1a",
          950: "#05070e",
          card: "rgba(13, 19, 34, 0.72)",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.12)",
        },
        neon: {
          indigo: "#6366f1",
          violet: "#8b5cf6",
          cyan: "#38bdf8",
          glow: "#4f46e5",
        },
      },
      boxShadow: {
        "glow-sm": "0 0 15px -2px rgba(99, 102, 241, 0.3)",
        "glow-md": "0 0 30px -4px rgba(99, 102, 241, 0.45)",
        "glow-lg": "0 0 50px -5px rgba(99, 102, 241, 0.6)",
        "glow-cyan": "0 0 30px -4px rgba(56, 189, 248, 0.45)",
        "glow-violet": "0 0 35px -4px rgba(139, 92, 246, 0.5)",
        "glass-inner": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)",
        "3d-card": "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px -10px rgba(99, 102, 241, 0.2)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        "pulse-glow": "pulseGlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "soundwave-1": "soundwave 1.2s ease-in-out infinite",
        "soundwave-2": "soundwave 1.4s ease-in-out 0.2s infinite",
        "soundwave-3": "soundwave 1.1s ease-in-out 0.4s infinite",
        "soundwave-4": "soundwave 1.5s ease-in-out 0.1s infinite",
        "soundwave-5": "soundwave 1.3s ease-in-out 0.3s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        soundwave: {
          "0%, 100%": { height: "6px" },
          "50%": { height: "26px" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
