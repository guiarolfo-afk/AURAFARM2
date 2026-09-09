import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

const isRoot = process.env.DEPLOY_ROOT === 'true' || process.env.NETLIFY === 'true'
const base = isRoot ? '/' : '/AURAFARM2/'

/* marcadores de versión para el indicador "Acerca de" en Ajustes */
let commitHash = 'dev'
try { commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() } catch { /* sin git */ }

export default defineConfig({
  base,
  define: {
    __APP_COMMIT__: JSON.stringify(commitHash),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  root: 'src',
  envDir: '..',
  build: {
    outDir: isRoot ? '../dist' : '../docs',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('/d3-') || id.includes('/victory') || id.includes('/react-smooth')) return 'charts'
            if (id.includes('leaflet')) return 'map'
            if (id.includes('framer-motion')) return 'motion'
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor'
            if (id.includes('zustand') || id.includes('lucide') || id.includes('qrcode')) return 'ui-libs'
            return 'vendor'
          }
        },
      },
    },
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
            src: 'icons/v2/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/v2/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/v2/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
