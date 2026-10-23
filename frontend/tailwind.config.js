/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        papier: "#EFF0EA",
        blatt: "#FAFAF6",
        tinte: "#191E17",
        weich: "#5C6357",
        linie: "#D5D7CC",
        stempel: "#3B3A8C",
        stempelhell: "#E7E7F4",
        gut: "#2E6B4C",
        guthell: "#E0EDE5",
        offen: "#9A6510",
        offenhell: "#F6EBD6",
      },
      fontFamily: {
        display: ["Archivo", "system-ui", "sans-serif"],
        sans: ["Public Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: { karte: "14px" },
    },
  },
  plugins: [],
};
