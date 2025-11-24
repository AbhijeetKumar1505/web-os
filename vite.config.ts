import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: 'WebOS Hand Tracking',
        short_name: 'WebOS',
        description: 'Web-based operating system with real-time hand-tracking control',
        theme_color: '#1f2937',
        background_color: '#111827',
        display: 'fullscreen',
        orientation: 'landscape-primary',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'tensorflow': ['@tensorflow/tfjs'],
          'mediapipe': ['@mediapipe/hands', '@mediapipe/camera_utils', '@mediapipe/drawing_utils']
        }
      }
    }
  }
})
