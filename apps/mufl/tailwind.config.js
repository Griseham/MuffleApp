/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Add custom colors used in PlayingScreen2.js
      colors: {
        // Define common colors used in the component
        'dark-1': '#0a0a0a',
        'dark-2': '#0f0f0f',
        'dark-3': '#141414',
        'dark-4': '#1a1a1a',
        'dark-5': '#1e1e1e',
        'dark-6': '#2a2a2a',
        'primary': '#4ade80',
        'primary-hover': '#22c55e',
        'negative': '#f43f5e',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
  corePlugins: {
    preflight: true, // Enable Tailwind's base styles
  },
  // Allow arbitrary values within Tailwind classes
  mode: 'jit',
}