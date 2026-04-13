/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: "#080c1a",
        secondary: "#0d1224",
        accent: "#00e5ff",
        "accent-light": "#40c4ff",
        "green-premium": "#00e676",
        "red-premium": "#ff1744",
        "gold": "#ffd740",
        "purple-premium": "#e040fb",
        "blue-premium": "#2979ff",
      },
      backgroundImage: {
        "gradient-premium": "linear-gradient(135deg, #080c1a 0%, #0d1224 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(13,18,36,0.9) 0%, rgba(8,12,26,0.9) 100%)",
        "gradient-accent": "linear-gradient(135deg, #00e5ff 0%, #0091ea 100%)",
        "gradient-green": "linear-gradient(135deg, #00e676 0%, #69f0ae 100%)",
        "gradient-red": "linear-gradient(135deg, #ff1744 0%, #ff5252 100%)",
        "gradient-purple": "linear-gradient(135deg, #e040fb 0%, #ea80fc 100%)",
        "radial-glow": "radial-gradient(ellipse at center, rgba(0,229,255,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        premium: "0 8px 32px rgba(0, 229, 255, 0.08)",
        "premium-lg": "0 20px 64px rgba(0, 229, 255, 0.12)",
        glow: "0 0 20px rgba(0, 229, 255, 0.25)",
        "glow-lg": "0 0 40px rgba(0, 229, 255, 0.35)",
        "glow-green": "0 0 20px rgba(0, 230, 118, 0.3)",
        "glow-red": "0 0 20px rgba(255, 23, 68, 0.3)",
        card: "0 4px 24px rgba(0,0,0,0.5)",
      },
      backdropBlur: {
        xs: "2px",
        card: "20px",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "slide-in": "fadeInUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        "scale-in": "scaleIn 0.3s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        spin: "spin 0.7s linear infinite",
        ticker: "ticker 40s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":       { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 229, 255, 0.2)" },
          "50%":       { boxShadow: "0 0 40px rgba(0, 229, 255, 0.45)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-800px 0" },
          "100%": { backgroundPosition: "800px 0" },
        },
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      borderRadius: {
        card: "20px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "28px",
      },
    },
  },
  plugins: [],
};
