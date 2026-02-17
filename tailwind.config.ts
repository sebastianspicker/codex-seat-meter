import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#09090b",
          1: "#111114",
          2: "#18181c",
          3: "#1f1f24",
        },
        copper: {
          DEFAULT: "#c8956c",
          light: "#daa77a",
          dark: "#a67952",
          muted: "#c8956c40",
          faint: "#c8956c15",
        },
        slate: {
          750: "#27272e",
        },
        warm: {
          red: "#b45555",
          "red-deep": "#8b4040",
          amber: "#b8944a",
        },
      },
      fontFamily: {
        serif: ['"IBM Plex Serif"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', "Menlo", "monospace"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out both",
        "bar-fill": "barFill 0.8s ease-out both",
        "pulse-slow": "pulseSlow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        barFill: {
          "0%": { width: "0%" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
