import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'ProPoint POS',
        short_name: 'ProPoint',
        description: 'Point of sale that keeps selling when the internet does not.',
        theme_color: '#2563eb',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'any',
        start_url: '/pos',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell so a cold start with no network still boots
        // straight into a working till.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // SPA fallback: any navigation while offline resolves to the shell.
        navigateFallback: '/index.html',
        // API traffic must never be served from the precache -- a stale sales
        // figure or product price is worse than an honest failure that the
        // app's own IndexedDB fallback then handles.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Product images are large, immutable, and safe to serve stale.
            urlPattern: ({ url }) => url.pathname.startsWith('/images/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-images',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Never cache API responses. Offline reads come from IndexedDB,
            // which the app controls and can reason about; a Workbox cache
            // would silently shadow it with data of unknown age.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        // Lets the offline path be exercised with `npm run dev`.
        enabled: true,
        type: 'module',
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  },
})
