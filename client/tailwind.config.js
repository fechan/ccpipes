/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "mcgui-bg": "#c6c6c6",
        "mcgui-border-light": "#dbdbdb",
        "mcgui-border-dark": "#5b5b5b",
        "mcgui-slot-bg": "#8b8b8b",
        "mcgui-slot-border-light": "#ffffff",
        "mcgui-slot-border-dark": "#373737",
        "mcgui-group-border": "#969696",
        "mcgui-group-border-light": "#dbdbdb",
        "mcgui-group-border-dark": "#b3b3b3",
      }
    },
  },
  plugins: [],
}

