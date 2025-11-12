/**
 * Service Worker for offline functionality
 * Provides caching and offline support for the CRM application
 */

const CACHE_NAME = "crm-v1"
const RUNTIME_CACHE = "crm-runtime"

// Assets to cache on install
const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/clients",
  "/contacts",
  "/tasks",
  "/calendar",
]

// Install event - cache assets
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event: FetchEvent) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Skip API requests (they should use IndexedDB sync)
  if (event.request.url.includes("/api/")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
})

// Background sync for offline operations
self.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "sync-data") {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  // This will be called when the app comes back online
  // The actual sync logic is handled by the cache manager
  console.log("Background sync triggered")
}

