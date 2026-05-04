import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // we register manually with iframe/preview guard
      // SW only active in production builds — never in Lovable preview / dev.
      devOptions: { enabled: false },
      includeAssets: ["icon-192.png", "icon-512.png", "apple-touch-icon.png"],
      manifest: false, // we ship our own /manifest.webmanifest
      workbox: {
        // Critical: never cache OAuth or function callback paths.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/functions\//, /^\/auth\//],
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,webp}"],
        runtimeCaching: [
          // HTML — always try network first, fall back to cache when offline.
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "bitez-html",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          // Google fonts CSS
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-css" },
          },
          // Google fonts files — long-lived, immutable.
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-files",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Images — stale while revalidate.
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "bitez-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase REST/auth — network first, never cache writes.
          {
            urlPattern: ({ url, request }) =>
              url.hostname.endsWith(".supabase.co") && request.method === "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "bitez-api",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
