import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151313",
        sun: "#fccc42",
        cta: "#ff5734",
        canvas: "#f7f7f5",
        grape: "#be64f5",
        "pastel-yellow": "#fcf0a0",
        "pastel-purple": "#ede0ff",
        "pastel-blue": "#dff0fc"
      },
      borderRadius: {
        pill: "999px",
        card: "24px"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(21,19,19,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
