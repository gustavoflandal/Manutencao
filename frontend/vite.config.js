import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3002,
    host: true,
    strictPort: false, // Permite usar outra porta se 3002 estiver ocupada
    open: false, // Não abre automaticamente o navegador
    cors: true,
    // Configurações para evitar problemas de cache
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    // Configurações para evitar problemas de porta bloqueada
    watch: {
      usePolling: true
    },
    // Configurações de proxy para API
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Configurações para melhor estabilidade
  optimizeDeps: {
    exclude: ['vue-demi']
  }
})
