export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#080c14',
        accentPrimary: '#00c896', // neon green
        accentDanger: '#ff3b5c', // red
        accentWarning: '#ffaa00', // amber
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        }
      }
    },
  },
  plugins: [],
}
