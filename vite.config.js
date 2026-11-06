import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // relative asset paths so the build loads from file:// inside Electron
  server: { port: 5173, strictPort: true },
})
