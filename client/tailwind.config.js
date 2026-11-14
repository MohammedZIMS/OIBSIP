// Palette from the reference image and docs/DESIGN.md. Use these tokens only; no one-off hex values.
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        crust: '#E9C590',
        oven: '#D76E25',
        toast: '#9D5826',
        brick: '#9C2913',
        cheese: '#E0983E',
        tomato: '#B80311',
        onion: '#5A1A35',
        pan: { DEFAULT: '#1D2833', raised: '#26333F' },
        basil: { DEFAULT: '#485D17', soft: '#A9C46A' },
        rust: '#C34413',
        parchment: '#FBF3E4',
        line: '#E4D0AA',
        ink: { muted: '#6B5A48', dark: '#B9A98C' },
        'tomato-soft': '#F08A7A',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { sm: '6px', md: '12px', lg: '20px' },
      boxShadow: {
        card: '0 1px 2px rgba(29,40,51,.08), 0 6px 16px rgba(29,40,51,.06)',
        pop: '0 12px 32px rgba(90,26,53,.22)',
      },
    },
  },
};
