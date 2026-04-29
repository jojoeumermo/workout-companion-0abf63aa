import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        body: ["Rubik", "Inter", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "surface-elevated": "hsl(var(--surface-elevated))",
        "macro-protein": "hsl(var(--macro-protein))",
        "macro-carbs": "hsl(var(--macro-carbs))",
        "macro-fat": "hsl(var(--macro-fat))",
        "macro-calories": "hsl(var(--macro-calories))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
      boxShadow: {
        'glow': 'var(--glow-primary)',
        'glow-strong': 'var(--glow-primary-strong)',
        'card': '0 2px 16px -4px hsl(0 0% 0% / 0.3)',
        'card-hover': '0 8px 32px -8px hsl(0 0% 0% / 0.4)',
        'elevated': '0 12px 40px -12px hsl(0 0% 0% / 0.5)',
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-fast": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-bottom": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "flame-pulse": {
          "0%, 100%": { transform: "scale(1)", filter: "drop-shadow(0 0 2px hsl(25 95% 55% / 0.5))" },
          "50%": { transform: "scale(1.08)", filter: "drop-shadow(0 0 8px hsl(25 95% 55% / 0.8))" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "fade-in-fast": "fade-in-fast 0.2s ease-out",
        "slide-up": "slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 0.25s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2.4s ease-in-out infinite",
        "flame-pulse": "flame-pulse 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
