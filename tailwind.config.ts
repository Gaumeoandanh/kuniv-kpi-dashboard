import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
                  50: "#eaf0fb",
                    100: "#cdddf5",
                    200: "#9bbaeb",
                    300: "#6897db",
                    400: "#3b6fc4",
                    500: "#204ea3",
                    600: "#0a3696",
                    700: "#082a75",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
