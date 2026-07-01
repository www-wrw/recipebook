export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Vintage cookbook palette: warm cream paper, tomato red, cornflower
        // gingham blue, mustard and sage accents, soft brown ink.
        cream: '#FBF4E6',
        parchment: '#FFFDF6',
        ink: '#3E3329',
        tomato: { DEFAULT: '#C24A33', dark: '#A23A26' },
        cornflower: { DEFAULT: '#55748E', dark: '#425C72' },
        mustard: { DEFAULT: '#D7A23C', dark: '#BE8A2A' },
        sage: { DEFAULT: '#7E8B57', dark: '#69744A' },
        edge: '#E7D9BE'
      },
      fontFamily: {
        display: ['"Libre Caslon Text"', 'Georgia', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        hand: ['Caveat', 'cursive']
      },
      boxShadow: {
        card: '0 1px 2px rgba(62,51,41,0.06), 0 4px 12px rgba(62,51,41,0.06)'
      }
    }
  },
  plugins: []
};
