import { ref, reactive, computed } from 'vue'

// Advanced cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 1000, // Maximum number of cache entries
  CLEANUP_INTERVAL: 60 * 1000, // 1 minute cleanup interval
  CACHE_STRATEGIES: {
    LRU: 'lru', // Least Recently Used
    LFU: 'lfu', // Least Frequently Used
    TTL: 'ttl'  // Time To Live
  }
}

// Cache storage with metadata
const cacheStore = new Map()
const cacheMetadata = reactive({
  size: 0,
  hits: 0,
  misses: 0,
  evictions: 0,
  lastCleanup: Date.now(),
  hitRate: 0,
  memoryUsage: 0
})

// Access tracking for LRU/LFU strategies
const accessLog = new Map()
let cleanupTimer = null

export function useAdvancedCache() {
  const updateMetadata = () => {
    const totalRequests = cacheMetadata.hits + cacheMetadata.misses
    cacheMetadata.size = cacheStore.size
    cacheMetadata.hitRate = totalRequests > 0 ? 
      ((cacheMetadata.hits / totalRequests) * 100).toFixed(2) : 0
    
    // Estimate memory usage (rough calculation)
    let memoryEstimate = 0
    cacheStore.forEach((value, key) => {
      memoryEstimate += JSON.stringify(key).length + JSON.stringify(value).length
    })
    cacheMetadata.memoryUsage = Math.round(memoryEstimate / 1024) // KB
  }

  const trackAccess = (key) => {
    const now = Date.now()
    if (accessLog.has(key)) {
      const access = accessLog.get(key)
      access.count++
      access.lastAccessed = now
    } else {
      accessLog.set(key, {
        count: 1,
        firstAccessed: now,
        lastAccessed: now
      })
    }
  }

  const isExpired = (cacheItem) => {
    if (!cacheItem || !cacheItem.ttl) return false
    return Date.now() - cacheItem.timestamp > cacheItem.ttl
  }

  const evictByStrategy = (strategy = CACHE_CONFIG.CACHE_STRATEGIES.LRU) => {
    if (cacheStore.size === 0) return

    let keyToEvict = null

    switch (strategy) {
      case CACHE_CONFIG.CACHE_STRATEGIES.LRU:
        // Find least recently used
        let oldestAccess = Date.now()
        accessLog.forEach((access, key) => {
          if (access.lastAccessed < oldestAccess) {
            oldestAccess = access.lastAccessed
            keyToEvict = key
          }
        })
        break

      case CACHE_CONFIG.CACHE_STRATEGIES.LFU:
        // Find least frequently used
        let lowestCount = Infinity
        accessLog.forEach((access, key) => {
          if (access.count < lowestCount) {
            lowestCount = access.count
            keyToEvict = key
          }
        })
        break

      case CACHE_CONFIG.CACHE_STRATEGIES.TTL:
        // Find oldest by timestamp
        let oldestTimestamp = Date.now()
        cacheStore.forEach((item, key) => {
          if (item.timestamp < oldestTimestamp) {
            oldestTimestamp = item.timestamp
            keyToEvict = key
          }
        })
        break
    }

    if (keyToEvict) {
      cacheStore.delete(keyToEvict)
      accessLog.delete(keyToEvict)
      cacheMetadata.evictions++
    }
  }

  const cleanup = () => {
    const now = Date.now()
    const expiredKeys = []

    // Find expired entries
    cacheStore.forEach((item, key) => {
      if (isExpired(item)) {
        expiredKeys.push(key)
      }
    })

    // Remove expired entries
    expiredKeys.forEach(key => {
      cacheStore.delete(key)
      accessLog.delete(key)
    })

    // If still over capacity, evict using LRU strategy
    while (cacheStore.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      evictByStrategy(CACHE_CONFIG.CACHE_STRATEGIES.LRU)
    }

    cacheMetadata.lastCleanup = now
    updateMetadata()

    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`)
    }
  }

  const get = (key) => {
    const cacheItem = cacheStore.get(key)
    
    if (!cacheItem) {
      cacheMetadata.misses++
      updateMetadata()
      return null
    }

    if (isExpired(cacheItem)) {
      cacheStore.delete(key)
      accessLog.delete(key)
      cacheMetadata.misses++
      updateMetadata()
      return null
    }

    trackAccess(key)
    cacheMetadata.hits++
    updateMetadata()
    return cacheItem.data
  }

  const set = (key, data, options = {}) => {
    const {
      ttl = CACHE_CONFIG.DEFAULT_TTL,
      tags = [],
      priority = 1,
      strategy = CACHE_CONFIG.CACHE_STRATEGIES.LRU
    } = options

    // Check cache capacity and cleanup if needed
    if (cacheStore.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      evictByStrategy(strategy)
    }

    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
      priority,
      strategy
    }

    cacheStore.set(key, cacheItem)
    trackAccess(key)
    updateMetadata()
  }

  const invalidate = (key) => {
    const deleted = cacheStore.delete(key)
    if (deleted) {
      accessLog.delete(key)
      updateMetadata()
    }
    return deleted
  }

  const invalidateByTag = (tag) => {
    const keysToDelete = []
    
    cacheStore.forEach((item, key) => {
      if (item.tags && item.tags.includes(tag)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => {
      cacheStore.delete(key)
      accessLog.delete(key)
    })

    updateMetadata()
    return keysToDelete.length
  }

  const invalidateByPattern = (pattern) => {
    const regex = new RegExp(pattern)
    const keysToDelete = []

    cacheStore.forEach((item, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => {
      cacheStore.delete(key)
      accessLog.delete(key)
    })

    updateMetadata()
    return keysToDelete.length
  }

  const clear = () => {
    const size = cacheStore.size
    cacheStore.clear()
    accessLog.clear()
    cacheMetadata.evictions += size
    updateMetadata()
    return size
  }

  const getStats = () => {
    return {
      ...cacheMetadata,
      capacity: CACHE_CONFIG.MAX_CACHE_SIZE,
      utilizationPercent: ((cacheMetadata.size / CACHE_CONFIG.MAX_CACHE_SIZE) * 100).toFixed(2)
    }
  }

  const getAllKeys = () => {
    return Array.from(cacheStore.keys())
  }

  const getByTag = (tag) => {
    const results = []
    cacheStore.forEach((item, key) => {
      if (item.tags && item.tags.includes(tag) && !isExpired(item)) {
        results.push({ key, data: item.data })
      }
    })
    return results
  }

  const warmup = async (entries) => {
    for (const entry of entries) {
      const { key, data, options } = entry
      set(key, data, options)
    }
  }

  const preload = async (keys, fetchFunction) => {
    const promises = keys.map(async (key) => {
      if (!cacheStore.has(key)) {
        try {
          const data = await fetchFunction(key)
          set(key, data)
          return { key, success: true }
        } catch (error) {
          console.error(`Preload failed for key ${key}:`, error)
          return { key, success: false, error }
        }
      }
      return { key, success: true, cached: true }
    })

    return Promise.all(promises)
  }

  // Auto-cleanup setup
  const startAutoCleanup = () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer)
    }
    
    cleanupTimer = setInterval(() => {
      cleanup()
    }, CACHE_CONFIG.CLEANUP_INTERVAL)
  }

  const stopAutoCleanup = () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  }

  // Smart cache wrapper for async functions
  const memoize = (fn, options = {}) => {
    const {
      keyGenerator = (...args) => JSON.stringify(args),
      ttl = CACHE_CONFIG.DEFAULT_TTL,
      tags = [],
      strategy = CACHE_CONFIG.CACHE_STRATEGIES.LRU
    } = options

    return async (...args) => {
      const key = keyGenerator(...args)
      
      // Try to get from cache first
      const cached = get(key)
      if (cached !== null) {
        return cached
      }

      // Execute function and cache result
      try {
        const result = await fn(...args)
        set(key, result, { ttl, tags, strategy })
        return result
      } catch (error) {
        // Don't cache errors, just throw
        throw error
      }
    }
  }

  // Computed properties for reactive access
  const stats = computed(() => getStats())

  // Start auto-cleanup by default
  startAutoCleanup()

  return {
    get,
    set,
    invalidate,
    invalidateByTag,
    invalidateByPattern,
    clear,
    cleanup,
    stats,
    getStats,
    getAllKeys,
    getByTag,
    warmup,
    preload,
    memoize,
    startAutoCleanup,
    stopAutoCleanup,
    
    // Cache strategies
    CACHE_STRATEGIES: CACHE_CONFIG.CACHE_STRATEGIES
  }
}

// Global cache instance for shared usage
export const globalCache = useAdvancedCache()
