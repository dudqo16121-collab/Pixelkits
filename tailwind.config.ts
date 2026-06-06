import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        lime:  { DEFAULT: '#c8f135', dark: '#a8cc1e' },
        teal:  { DEFAULT: '#5dcaa5', dark: '#3daa85' },
        ink:   { DEFAULT: '#0a0a0a' },
        sand:  { DEFAULT: '#f0ede8' },
        panel: { DEFAULT: '#111111' },
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        dm:   ['var(--font-dm)',   'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config
