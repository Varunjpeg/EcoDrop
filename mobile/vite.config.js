import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable.png'],
      manifest: {
        name: 'EcoDrop-CA',
        short_name: 'EcoDrop',
        description: 'AI-powered campus recycling rewards app',
        theme_color: '#059669',
        background_color: '#F7F8FA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png',      sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png',      sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        categories: ['utilities', 'lifestyle'],
        shortcuts: [
          {
            name: 'Scan & Deposit',
            short_name: 'Scan',
            description: 'Scan a machine QR and deposit waste',
            url: '/scan',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'My Wallet',
            short_name: 'Wallet',
            description: 'View your E-Coins balance',
            url: '/wallet',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        // Cache all app assets for offline use
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      devOptions: {
        enabled: true, // Enable PWA in dev mode for testing
      },
    }),
  ],
  server: {
    host: true,  // Expose to all network interfaces — phone can access
    port: 5173,
  },
})
