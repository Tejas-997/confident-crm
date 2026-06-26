import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxies API + admin to the FastAPI server so `npm run dev` works against
// the running backend. In production the bundle is served by FastAPI itself,
// so relative /api paths resolve same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/django': 'http://localhost:8000',
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
})
