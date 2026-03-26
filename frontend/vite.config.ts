import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Pastoral Livestock Health',
        short_name: 'LivestockHealth',
        description: 'Livestock disease checker, vet finder and medicine prices for pastoral farmers',
        theme_color: '#2d6a4f',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // matches both localhost dev and any https production API
            urlPattern: ({ url }) =>
              url.hostname === 'localhost' ||
              url.pathname.startsWith('/diseases') ||
              url.pathname.startsWith('/vets') ||
              url.pathname.startsWith('/suppliers') ||
              url.pathname.startsWith('/medicines') ||
              url.pathname.startsWith('/animals') ||
              url.pathname.startsWith('/events') ||
              url.pathname.startsWith('/triage') ||
              url.pathname.startsWith('/farmers') ||
              url.pathname.startsWith('/posts'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
