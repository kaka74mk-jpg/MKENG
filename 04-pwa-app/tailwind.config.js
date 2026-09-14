/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Classroom tape" palette — evokes an analog language-lab
        // recording, not a generic SaaS card kit.
        ink: {
          DEFAULT: "#1B1E2B", // near-black navy, main dark surface
          soft: "#262A3D",    // elevated dark surface (cards on dark)
        },
        parchment: {
          DEFAULT: "#F1EADD", // warm off-white, light surface
          dim: "#E4D9C4",
        },
        amber: {
          DEFAULT: "#E0A040", // playback / active-drill indicator
          dim: "#B87F2E",
        },
        teal: {
          DEFAULT: "#1F5C55", // replay / secondary actions
          dim: "#164541",
        },
        rust: {
          DEFAULT: "#C4573B", // errors, incorrect answers
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        fa: ["Vazirmatn", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};
