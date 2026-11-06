/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0D0F12',
        card: '#15181D',
        card2: '#1C2027',
        line: 'rgba(255,255,255,0.07)',
        neon: '#00F59B',
        violet: '#7C3AED',
        loss: '#FF4D6D',
        mute: '#8A919E',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 24px rgba(164,155,255,0.45)',
        violet: '0 0 28px rgba(123,108,246,0.45)',
      },
    },
  },
  plugins: [],
}
