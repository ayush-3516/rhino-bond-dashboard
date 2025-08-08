import { ref, reactive, computed } from 'vue'

// Performance tracking for user management operations
const performanceMetrics = reactive({
  fetchUsers: {
    count: 0,
    totalTime: 0,
    averageTime: 0,
    lastExecutionTime: 0
  },
  filterUsers: {
    count: 0,
    totalTime: 0,
    averageTime: 0,
    lastExecutionTime: 0
  },
  searchUsers: {
    count: 0,
    totalTime: 0,
    averageTime: 0,
    lastExecutionTime: 0
  },
  updateUser: {
    count: 0,
    totalTime: 0,
    averageTime: 0,
    lastExecutionTime: 0
  },
  deleteUser: {
    count: 0,
    totalTime: 0,
    averageTime: 0,
    lastExecutionTime: 0
  }
})

// Cache for user data
const userCache = new Map()
const cacheStats = ref({
  size: 0,
  hits: 0,
  misses: 0,
  hitRate: 0
})

export function useUserPerformance() {
  const updateCacheStats = () => {
    const totalRequests = cacheStats.value.hits + cacheStats.value.misses
    cacheStats.value.size = userCache.size
    cacheStats.value.hitRate = totalRequests > 0 ? (cacheStats.value.hits / totalRequests * 100).toFixed(2) : 0
  }

  const measurePerformance = (operationName, fn) => {
    return async (...args) => {
      const startTime = performance.now()
      
      try {
        const result = await fn(...args)
        const endTime = performance.now()
        const executionTime = endTime - startTime
        
        // Update metrics
        const metric = performanceMetrics[operationName]
        if (metric) {
          metric.count++
          metric.totalTime += executionTime
          metric.averageTime = metric.totalTime / metric.count
          metric.lastExecutionTime = executionTime
        }
        
        // Log slow operations (> 1000ms)
        if (executionTime > 1000) {
          console.warn(`Slow ${operationName} operation: ${executionTime.toFixed(2)}ms`)
        }
        
        return result
      } catch (error) {
        const endTime = performance.now()
        const executionTime = endTime - startTime
        console.error(`Error in ${operationName} after ${executionTime.toFixed(2)}ms:`, error)
        throw error
      }
    }
  }

  const getCacheItem = (key) => {
    if (userCache.has(key)) {
      cacheStats.value.hits++
      updateCacheStats()
      return userCache.get(key)
    }
    cacheStats.value.misses++
    updateCacheStats()
    return null
  }

  const setCacheItem = (key, value, ttl = 300000) => { // 5 minutes default TTL
    userCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl
    })
    updateCacheStats()
  }

  const isCacheValid = (cacheItem) => {
    if (!cacheItem) return false
    return Date.now() - cacheItem.timestamp < cacheItem.ttl
  }

  const getCachedData = (key) => {
    const cacheItem = getCacheItem(key)
    if (cacheItem && isCacheValid(cacheItem)) {
      return cacheItem.data
    }
    if (cacheItem) {
      userCache.delete(key) // Remove expired item
      updateCacheStats()
    }
    return null
  }

  const clearCache = () => {
    userCache.clear()
    cacheStats.value = {
      size: 0,
      hits: 0,
      misses: 0,
      hitRate: 0
    }
  }

  const getMetrics = () => {
    return {
      performance: { ...performanceMetrics },
      cache: { ...cacheStats.value }
    }
  }

  // Computed properties for easy access
  const metrics = computed(() => getMetrics())
  const getCacheStats = computed(() => cacheStats.value)

  return {
    measurePerformance,
    getCachedData,
    setCacheItem,
    clearCache,
    metrics,
    getCacheStats,
    getMetrics
  }
}
