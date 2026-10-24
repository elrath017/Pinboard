/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#faf8ff',
        brutal: {
          purple: '#8b5cf6',
          'purple-hover': '#7c3aed',
          'purple-light': '#ede9fe',
          yellow: '#fde047',
          'yellow-light': '#fef9c3',
          pink: '#f472b6',
          green: '#86efac',
          orange: '#fb923c',
          blue: '#93c5fd',
        }
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #000000',
        'brutal': '4px 4px 0px #000000',
        'brutal-md': '5px 5px 0px #000000',
        'brutal-lg': '6px 6px 0px #000000',
        'brutal-xl': '8px 8px 0px #000000',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
