/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0a0e27",
        secondary: "#1a1f3a",
        accent: "#00d4ff",
        gold: "#ffd700",
        "green-premium": "#00ff88",
        "red-premium": "#ff3366",
      },
      backgroundImage: {
        "gradient-premium": "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(26, 31, 58, 0.8) 0%, rgba(10, 14, 39, 0.8) 100%)",
        "gradient-accent": "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
      },
      boxShadow: {
        premium: "0 8px 32px rgba(0, 212, 255, 0.1)",
        "premium-lg": "0 20px 64px rgba(0, 212, 255, 0.15)",
        glow: "0 0 20px rgba(0, 212, 255, 0.3)",
        "glow-lg": "0 0 40px rgba(0, 212, 255, 0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slide-in 0.5s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 212, 255, 0.5)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
