/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stellartrade: {
          arboreal: '#059669',
          silica: '#ea580c',
          hydro: '#06b6d4',
          agri: '#eab308',
          mineral: '#71717a',
          deadWorld: '#451a03',
          deepSpace: '#0284c7',
          hull: '#0f172a',
          hullDark: '#020617',
          neonCyan: '#22d3ee',
          neonAmber: '#f59e0b',
        },
        player: {
          red: '#e63946',
          blue: '#1d3557',
          white: '#f8f9fa',
          orange: '#f77f00',
          green: '#2a9d8f',
          brown: '#6f4e37',
        },
      },
      boxShadow: {
        stellartrade: '0 8px 24px -4px rgba(6, 182, 212, 0.25), 0 2px 6px -1px rgba(0, 0, 0, 0.5)',
        glow: '0 0 15px rgba(34, 211, 238, 0.35)',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
