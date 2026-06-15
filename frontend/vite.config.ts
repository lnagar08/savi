import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["p5174.i8n.in"],
    proxy: {
      '/api-fred': {
        target: 'https://api.stlouisfed.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-fred/, ''),
      },
    },
  },
  optimizeDeps: {
    include: ['ckeditor5', '@ckeditor/ckeditor5-react']
  },
})
