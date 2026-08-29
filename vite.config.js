import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/AURAFARM2/',
  root: 'src',
  build: {
    outDir: '../docs',
  },
  plugins: [react()],
})
