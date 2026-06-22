/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the same build works from a GitHub Pages subpath
  // AND inside the Capacitor iOS webview (which serves from the bundle root).
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // A real origin (not about:blank) so jsdom enables a working localStorage.
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
