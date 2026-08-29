import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/AURAFARM2/',
  root: 'src',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AuraFARM',
        short_name: 'AuraFARM',
        description: 'Organiza y participa en competencias de farmeo de aura',
        theme_color: '#06060e',
        background_color: '#06060e',
        display: 'standalone',
        start_url: '/AURAFARM2/',
        scope: '/AURAFARM2/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
