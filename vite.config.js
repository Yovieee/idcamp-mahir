import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'src', 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: '.',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,jpg,jpeg}'],
      },
      manifest: {
        name: "App Story",
        short_name: "StoryApp",
        start_url: "./",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2196f3",
        description: "Share your amazing stories with the world.",
        icons: [
          {
            src: "favicon.png",
            sizes: "64x64",
            type: "image/png"
          },
          {
            src: "images/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "images/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "images/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        screenshots: [
          {
            src: "images/screenshot.png",
            sizes: "1180x820",
            type: "image/png",
            form_factor: "wide",
            label: "Latest Stories Feed"
          }
        ],
        shortcuts: [
          {
            name: "Add Story",
            url: "#/add-story",
            icons: [
              {
                src: "images/logo.png",
                sizes: "192x192",
                type: "image/png"
              }
            ]
          },
          {
            name: "View Map",
            url: "#/map",
            icons: [
              {
                src: "images/logo.png",
                sizes: "192x192",
                type: "image/png"
              }
            ]
          }
        ]
      }
    })
  ],
});
