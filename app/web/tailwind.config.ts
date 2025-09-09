import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // FlowQuest Design System Colors
        bg: "#0B0F14",
        surface: "rgba(255, 255, 255, 0.06)",
        card: "rgba(255, 255, 255, 0.08)",
        primary: {
          DEFAULT: "#7EA6FF",
          2: "#21D4FD",
        },
        accent: "#9BFFCE",
        success: "#3FE081",
        warning: "#FFC857",
        error: "#FF6B6B",
        // Shadcn/ui theme colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'h1': ['44px', { lineHeight: '52px', fontWeight: '700' }],
        'h2': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'h3': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '18px', fontWeight: '400' }],
      },
      spacing: {
        '80m': '80px', // margin
        '16g': '16px', // gap
        '12g': '12px', // gap mobile
      },
      backdropBlur: {
        'glass': '16px',
        'glass-light': '12px',
      },
      boxShadow: {
        'glass': '0 12px 36px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(126, 166, 255, 0.3)',
        'glow-accent': '0 0 20px rgba(155, 255, 206, 0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(126, 166, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(126, 166, 255, 0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
