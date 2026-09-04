import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const isRoot = process.env.DEPLOY_ROOT === 'true' || process.env.NETLIFY === 'true'
const base = isRoot ? '/' : '/AURAFARM2/'

export default defineConfig({
  base,
  root: 'src',
  build: {
    outDir: isRoot ? '../dist' : '../docs',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AuraFARM Competitions',
        short_name: 'AuraFARM',
        description: 'Organiza y participa en competencias de farmeo de aura',
        theme_color: '#8B5CF6',
        background_color: '#1F2937',
        display: 'standalone',
        start_url: base,
        scope: base,
        orientation: 'portrait',
        categories: ['entertainment', 'social'],
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
