import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'apps/admin/index.html'),
        account: resolve(__dirname, 'apps/account/index.html'),
        adcompare: resolve(__dirname, 'apps/adcompare/index.html'),
        autolog: resolve(__dirname, 'apps/autolog/index.html'),
        freeqrcode: resolve(__dirname, 'apps/freeqrcode/index.html')
      }
    }
  }
})
