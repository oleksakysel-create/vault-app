/** @type {import('tailwindcss').Config} */
// Colours come from CSS variables (see src/index.css) so the same classes work
// in dark and light themes. `white` is the foreground colour, `ink` the background.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        white: v('fg'),
        ink: v('bg'),
        card: v('card'),
        card2: v('sheet'),
        line: 'rgb(var(--fg) / 0.08)',
        neon: v('gain'),
        loss: v('loss'),
        mute: v('mute'),
        accent: v('accent'),
        violet: '#7C3AED',
        onbright: '#0D0F12', // dark text on bright/colored buttons, same in both themes
        pure: '#FFFFFF',     // real white (text on violet buttons)
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 20px rgb(var(--gain) / 0.35)',
        violet: '0 0 28px rgba(124,58,237,0.40)',
      },
    },
  },
  plugins: [],
}
