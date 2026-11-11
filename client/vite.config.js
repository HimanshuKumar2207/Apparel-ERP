import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development the API is proxied so the browser sees ONE origin (required for the SameSite=Strict refresh cookie).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000', changeOrigin: false } } },
  build: { sourcemap: false, chunkSizeWarningLimit: 900 },
});
