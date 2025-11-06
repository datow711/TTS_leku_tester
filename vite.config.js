import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/TTS_leku_tester/', // <-- 請替換成您的 repo 名稱
  plugins: [react()],
  server: {
    proxy: {
      '/hts-api': {
        target: 'http://140.116.245.147:30011',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hts-api/, ''),
      },
    },
  },
})
