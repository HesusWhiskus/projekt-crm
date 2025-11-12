/**
 * Cache Manager for IndexedDB synchronization
 * Provides offline-first data caching and synchronization with server
 */

interface CacheEntry<T> {
  key: string
  data: T
  timestamp: number
  version: number
}

class CacheManager {
  private dbName = "crm_cache"
  private dbVersion = 1
  private db: IDBDatabase | null = null

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores for different entity types
        if (!db.objectStoreNames.contains("clients")) {
          const clientsStore = db.createObjectStore("clients", { keyPath: "id" })
          clientsStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("contacts")) {
          const contactsStore = db.createObjectStore("contacts", { keyPath: "id" })
          contactsStore.createIndex("clientId", "clientId", { unique: false })
          contactsStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("tasks")) {
          const tasksStore = db.createObjectStore("tasks", { keyPath: "id" })
          tasksStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("sync_queue")) {
          const syncQueueStore = db.createObjectStore("sync_queue", { keyPath: "id", autoIncrement: true })
          syncQueueStore.createIndex("timestamp", "timestamp", { unique: false })
          syncQueueStore.createIndex("entityType", "entityType", { unique: false })
        }

        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "key" })
        }
      }
    })
  }

  /**
   * Get cached data
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result as CacheEntry<T> | undefined
        resolve(result?.data || null)
      }
    })
  }

  /**
   * Set cached data
   */
  async set<T>(storeName: string, key: string, data: T, version: number = 1): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        version,
      }
      const request = store.put(entry)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Delete cached data
   */
  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get all entries from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results = request.result as CacheEntry<T>[]
        resolve(results.map((r) => r.data))
      }
    })
  }

  /**
   * Add item to sync queue (for offline operations)
   */
  async addToSyncQueue(entityType: string, action: "create" | "update" | "delete", data: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sync_queue"], "readwrite")
      const store = transaction.objectStore("sync_queue")
      const entry = {
        entityType,
        action,
        data,
        timestamp: Date.now(),
      }
      const request = store.add(entry)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get sync queue items
   */
  async getSyncQueue(): Promise<Array<{ id: number; entityType: string; action: string; data: any; timestamp: number }>> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sync_queue"], "readonly")
      const store = transaction.objectStore("sync_queue")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(id: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sync_queue"], "readwrite")
      const store = transaction.objectStore("sync_queue")
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sync_queue"], "readwrite")
      const store = transaction.objectStore("sync_queue")
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get metadata
   */
  async getMetadata(key: string): Promise<any> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["metadata"], "readonly")
      const store = transaction.objectStore("metadata")
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result?.value || null)
      }
    })
  }

  /**
   * Set metadata
   */
  async setMetadata(key: string, value: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["metadata"], "readwrite")
      const store = transaction.objectStore("metadata")
      const request = store.put({ key, value })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return typeof navigator !== "undefined" && navigator.onLine
  }
}

// Singleton instance
export const cacheManager = new CacheManager()

