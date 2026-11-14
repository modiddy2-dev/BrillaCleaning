import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-cinzel)", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#fbf7ee",
          100: "#f5edd6",
          400: "#e5c07b",
          500: "#d4af37",
          600: "#b89628",
          700: "#94751c",
          900: "#4e3b08",
        },
        dark: {
          base: "#0c0f17",
          surface: "#141a29",
          elevated: "#1e2638",
          border: "#2a3449",
        },
      },
    },
  },
  plugins: [],
};

export default config;
