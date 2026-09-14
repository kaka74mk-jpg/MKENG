import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "MK English Pro",
        short_name: "MK English",
        description: "استاد انگلیسی شخصی شما — تمرین Drill صوتی و مکالمه با AI",
        theme_color: "#1B1E2B",
        background_color: "#1B1E2B",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Cache the app shell aggressively; audio files are cached
        // separately and deliberately by the player (see src/lib/audioCache.ts)
        // since they are large and should not blow the default SW cache.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/storage/v1/object/sign"),
            handler: "NetworkOnly", // signed URLs expire — never cache the URL itself
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
