/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0b1f4b',
          'navy-dark': '#071433',
          'navy-light': '#16326d',
          blue: '#1d4ed8',
          'blue-light': '#3b82f6',
          accent: '#0f172a',
        },
        status: {
          available: '#10b981',
          pending: '#eab308',
          reserved: '#ef4444',
          ongoing: '#2563eb',
          maintenance: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

