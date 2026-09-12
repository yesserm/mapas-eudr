import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // MapLibre 6 loads its ESM worker next to the package bundle. Keeping the
  // package out of Vite's dependency optimizer preserves that relative path.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
