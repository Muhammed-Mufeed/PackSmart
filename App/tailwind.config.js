/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.js"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "outline": "#747878",
        "surface-container-highest": "#e0e3e5",
        "secondary-fixed-dim": "#ffb77d",
        "on-secondary-fixed-variant": "#6e3900",
        "on-error": "#ffffff",
        "tertiary-fixed": "#d5e3fc",
        "on-error-container": "#93000a",
        "error": "#ba1a1a",
        "on-surface": "#191c1e",
        "tertiary": "#000000",
        "on-tertiary-container": "#77859a",
        "surface-container-lowest": "#ffffff",
        "on-secondary-container": "#663500",
        "on-tertiary-fixed": "#0d1c2e",
        "outline-variant": "#c4c7c7",
        "tertiary-container": "#0d1c2e",
        "inverse-primary": "#c8c6c5",
        "error-container": "#ffdad6",
        "secondary-container": "#fe932c",
        "primary-container": "#1c1b1b",
        "surface-bright": "#f7f9fb",
        "background": "#f7f9fb",
        "on-secondary": "#ffffff",
        "inverse-surface": "#2d3133",
        "surface-dim": "#d8dadc",
        "on-primary-fixed-variant": "#474646",
        "surface-tint": "#5f5e5e",
        "surface-container": "#eceef0",
        "inverse-on-surface": "#eff1f3",
        "on-secondary-fixed": "#2f1500",
        "on-surface-variant": "#444748",
        "secondary": "#904d00",
        "primary-fixed": "#e5e2e1",
        "on-background": "#191c1e",
        "primary-fixed-dim": "#c8c6c5",
        "on-tertiary": "#ffffff",
        "on-primary-container": "#858383",
        "on-primary": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-variant": "#e0e3e5",
        "secondary-fixed": "#ffdcc3",
        "surface-container-high": "#e6e8ea",
        "tertiary-fixed-dim": "#b9c7df",
        "surface": "#f7f9fb",
        "on-primary-fixed": "#1c1b1b",
        "on-tertiary-fixed-variant": "#3a485b",
        "primary": "#000000",
        "accent-sienna": "#a45d43",
        "accent-olive": "#6b705c",
        brand: {
          black: '#111111',
          charcoal: '#1A1A1A',
          muted: '#71717A',
          border: '#E4E4E7',
          accent: '#27272A'
        }
      },
      letterSpacing: {
        widest: '0.22em',
        ultrawide: '0.3em'
      },
      fontFamily: {
        display: ["Montserrat", "sans-serif"],
        body: ["Inter", "Plus Jakarta Sans", "sans-serif"],
        sans: ["Inter", "Plus Jakarta Sans", "Montserrat", "sans-serif"],
        editorial: ["'Cormorant Garamond'", "serif"],
        serif: ["'Cormorant Garamond'", "serif"]
      }
    }
  },
  plugins: []
};
