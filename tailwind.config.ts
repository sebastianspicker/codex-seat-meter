import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        copper: {
          DEFAULT: "var(--copper)",
          light: "var(--copper-light)",
          dark: "var(--copper-dark)",
          muted: "var(--copper-muted)",
          faint: "var(--copper-faint)",
        },
        warm: {
          red: "var(--warm-red)",
          amber: "var(--warm-amber)",
        },
        slate: {
          750: "var(--border-subtle)",
        },
      },
      fontFamily: {
        serif: ["var(--font-plex-serif)", "Georgia", "serif"],
        mono: ["var(--font-plex-mono)", "Menlo", "monospace"],
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
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
