import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F6F8",
        ink: { DEFAULT: "#16202E", soft: "#4A5565", faint: "#7B8696" },
        line: "#DDE2E8",
        brand: { DEFAULT: "#0E7C7B", dark: "#0A5E5D", tint: "#E2F3F2" },
        amber: { DEFAULT: "#B7791F", tint: "#FBF1DC" },
        danger: { DEFAULT: "#C0392B", tint: "#FBE9E7" },
        ok: { DEFAULT: "#2E7D4F", tint: "#E4F4EA" },
      },
      boxShadow: { panel: "0 1px 2px rgba(22,32,46,.06), 0 0 0 1px rgba(22,32,46,.04)" },
      keyframes: {
        rise: { from: { transform: "translateY(8px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
      },
      animation: { rise: "rise .18s ease-out" },
    },
  },
  plugins: [],
};
export default config;
