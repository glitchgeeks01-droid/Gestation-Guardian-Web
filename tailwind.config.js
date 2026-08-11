/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{html,js}",
    "!./node_modules/**/*"
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#00497d",
        "secondary": "#535f70",
        "tertiary": "#084e57",
        "error": "#ba1a1a",
        "surface": "#f8fafc"
      },
      fontFamily: {
        headline: ["Manrope"],
        body: ["Inter"]
      }
    }
  },
  plugins: [],
}
