/* Minimal Service Worker to enable PWA installation.
   Keep this file small and stable; caching strategies can be added later. */

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// Network passthrough (no caching) — just to satisfy installability.
self.addEventListener("fetch", () => {})


