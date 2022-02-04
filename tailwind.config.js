module.exports = {
  purge: {
    content: ['./public/**/*.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    whitelistPatterns: [
      /-(leave|enter|appear)(|-(to|from|active))$/, // transitions
      /data-v-.*/, // scoped css
    ],
  }, 
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
