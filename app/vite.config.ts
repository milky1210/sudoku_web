import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // bind to all interfaces in container
    host: true,
    port: Number(process.env.VITE_PORT) || 5173,
    // HMR config: allow client to connect back to host IP when running in Docker
    hmr: {
      host: process.env.VITE_HMR_HOST || process.env.HOST || 'localhost',
      port: Number(process.env.VITE_HMR_PORT) || Number(process.env.VITE_PORT) || 5173,
      protocol: process.env.VITE_HMR_PROTOCOL || 'ws'
    }
  }
})
