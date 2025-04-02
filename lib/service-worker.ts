// Service worker for PWA functionality
// This file will be registered in the app to enable offline functionality

// Cache name
const CACHE_NAME = "studylab-cache-v1"

// Resources to cache
const RESOURCES_TO_CACHE = [
  "/",
  "/note",
  "/mappe",
  "/flashcard",
  "/attivita",
  "/impostazioni",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-icon.png",
]

// Install event - cache resources
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(RESOURCES_TO_CACHE)
      })
      .then(() => {
        // Skip waiting to activate the service worker immediately
        return (self as any).skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
            return Promise.resolve()
          }),
        )
      })
      .then(() => {
        // Take control of all clients immediately
        return (self as any).clients.claim()
      }),
  )
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event: FetchEvent) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return

  // Skip browser-sync and analytics requests
  const url = new URL(event.request.url)
  if (
    url.pathname.startsWith("/browser-sync/") ||
    url.hostname.includes("google-analytics.com") ||
    url.hostname.includes("analytics")
  ) {
    return
  }

  // Network-first strategy for API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to store in cache
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
        }),
    )
    return
  }

  // Cache-first strategy for static assets and pages
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      // If not in cache, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response to store in cache
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
        .catch((error) => {
          // For navigation requests, serve the app shell
          if (event.request.mode === "navigate") {
            return caches.match("/")
          }

          // Otherwise, propagate the error
          throw error
        })
    }),
  )
})

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    ;(self as any).skipWaiting()
  }
})

// TypeScript interfaces
interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<any>): void
}

interface FetchEvent extends Event {
  request: Request
  respondWith(response: Promise<Response> | Response): void
}

