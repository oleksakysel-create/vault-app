import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const page = (p) => fileURLToPath(new URL(p, import.meta.url))

// Two apps in one project: Vault (/) and Pocket (/pocket/)
export default defineConfig({
  plugins: [react()],
  base: './', // relative asset paths so the build loads from file:// inside Electron
  server: { port: 5173, strictPort: true },
  build: {
    rollupOptions: {
      input: { vault: page('./index.html'), pocket: page('./pocket/index.html') },
    },
  },
})
