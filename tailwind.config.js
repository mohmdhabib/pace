/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        pace: {
          black: "#080807",
          ink: "#10100f",
          coal: "#191816",
          glass: "rgba(255,255,255,0.075)",
          pearl: "#f5f1ea",
          bone: "#cfc6ba",
          smoke: "#8f877e",
          silver: "#d7d5cf",
          moss: "#7d8577",
          wine: "#8f6b67"
        }
      },
      boxShadow: {
        glow: "0 24px 90px rgba(214, 198, 176, 0.16)",
        soft: "0 18px 60px rgba(0, 0, 0, 0.35)"
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 20% 15%, rgba(255,255,255,.08), transparent 18%), radial-gradient(circle at 80% 12%, rgba(179,166,144,.12), transparent 22%), radial-gradient(circle at 48% 88%, rgba(143,107,103,.12), transparent 26%)"
      }
    }
  },
  plugins: []
};
