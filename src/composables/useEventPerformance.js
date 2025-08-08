/**
 * Performance optimization composable for Events page
 * Provides reusable performance optimization utilities
 */

import { ref, computed, shallowRef, nextTick } from 'vue'

// Simple LRU Cache implementation
class EventCache {
  constructor(maxSize = 50, ttl = 5 * 60 * 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  set(key, value) {
    const now = Date.now()
    
    // Remove expired entries
    this.cleanup()
    
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, { value, timestamp: now })
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    
    const now = Date.now()
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    // Move to end (LRU)
    this.cache.delete(key)
    this.cache.set(key, item)
    return item.value
  }

  has(key) {
    return this.get(key) !== null
  }

  clear() {
    this.cache.clear()
  }

  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }

  size() {
    this.cleanup()
    return this.cache.size
  }
}

export function useEventPerformance() {
  const cache = new EventCache()
  const metrics = ref({
    cacheHits: 0,
    cacheMisses: 0,
    renderTime: 0,
    filterTime: 0
  })

  // Debounced search function
  const useDebounce = (fn, delay = 300) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  }

  // Performance monitoring wrapper
  const measurePerformance = (operation, fn) => {
    return async (...args) => {
      const startTime = performance.now()
      try {
        const result = await fn(...args)
        const endTime = performance.now()
        
        if (metrics.value[operation + 'Time'] !== undefined) {
          metrics.value[operation + 'Time'] = endTime - startTime
        }
        
        return result
      } catch (error) {
        console.error(`Performance monitoring error in ${operation}:`, error)
        throw error
      }
    }
  }

  // Optimized event filtering with caching
  const createOptimizedFilter = (events) => {
    return computed(() => {
      const cacheKey = `filter_${events.value?.length || 0}_${Date.now().toString().slice(-6)}`
      
      if (cache.has(cacheKey)) {
        metrics.value.cacheHits++
        return cache.get(cacheKey)
      }

      const now = new Date()
      const upcoming = []
      const past = []
      
      // Single pass through events for both filters
      for (const event of events.value || []) {
        if (new Date(event.end_date) > now) {
          upcoming.push(event)
        } else {
          past.push({
            ...event,
            isPast: true
          })
        }
      }
      
      // Sort past events by end date (most recent first)
      past.sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
      
      const result = { upcoming, past, all: [...upcoming, ...past] }
      cache.set(cacheKey, result)
      metrics.value.cacheMisses++
      
      return result
    })
  }

  // Optimized time calculations with caching
  const createTimeCalculations = (events) => {
    return computed(() => {
      const timeMap = new Map()
      const now = new Date()
      
      for (const event of events.value || []) {
        const cacheKey = `time_${event.id}_${Math.floor(Date.now() / 60000)}` // Cache for 1 minute
        
        if (cache.has(cacheKey)) {
          timeMap.set(event.id, cache.get(cacheKey))
          continue
        }
        
        const endDate = new Date(event.end_date)
        const isPast = endDate <= now
        
        let timeRemaining = 'Ended'
        if (!isPast) {
          const diffMs = endDate - now
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffMins = Math.floor(diffMs / (1000 * 60))
          
          if (diffDays > 0) {
            timeRemaining = `${diffDays} day${diffDays > 1 ? 's' : ''}`
          } else if (diffHours > 0) {
            timeRemaining = `${diffHours} hour${diffHours > 1 ? 's' : ''}`
          } else {
            timeRemaining = `${diffMins} min${diffMins > 1 ? 's' : ''}`
          }
        }
        
        const result = { timeRemaining, isPast }
        timeMap.set(event.id, result)
        cache.set(cacheKey, result)
      }
      
      return timeMap
    })
  }

  // Virtual scrolling for large lists
  const createVirtualList = (items, pageSize = 10) => {
    const currentPage = ref(1)
    
    const paginatedItems = computed(() => {
      const start = (currentPage.value - 1) * pageSize
      return items.value.slice(start, start + pageSize)
    })
    
    const totalPages = computed(() => {
      return Math.max(1, Math.ceil(items.value.length / pageSize))
    })
    
    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
      }
    }
    
    const nextPage = () => goToPage(currentPage.value + 1)
    const prevPage = () => goToPage(currentPage.value - 1)
    
    return {
      currentPage,
      paginatedItems,
      totalPages,
      goToPage,
      nextPage,
      prevPage
    }
  }

  // Image loading optimization
  const createImageLoader = () => {
    const loadedImages = new Set()
    const failedImages = new Set()
    
    const preloadImage = (url) => {
      return new Promise((resolve, reject) => {
        if (loadedImages.has(url)) {
          resolve(url)
          return
        }
        
        if (failedImages.has(url)) {
          reject(new Error('Image previously failed to load'))
          return
        }
        
        const img = new Image()
        img.onload = () => {
          loadedImages.add(url)
          resolve(url)
        }
        img.onerror = () => {
          failedImages.add(url)
          reject(new Error('Failed to load image'))
        }
        img.src = url
      })
    }
    
    const isImageLoaded = (url) => loadedImages.has(url)
    const hasImageFailed = (url) => failedImages.has(url)
    
    return { preloadImage, isImageLoaded, hasImageFailed }
  }

  // Search functionality with debouncing
  const createSearch = (items, searchFields) => {
    const searchQuery = ref('')
    const debouncedSearch = ref('')
    
    const debouncedSearchFn = useDebounce((query) => {
      debouncedSearch.value = query
    }, 300)
    
    // Watch for search query changes
    const updateSearch = (query) => {
      searchQuery.value = query
      debouncedSearchFn(query)
    }
    
    const filteredItems = computed(() => {
      if (!debouncedSearch.value.trim()) {
        return items.value
      }
      
      const query = debouncedSearch.value.toLowerCase()
      return items.value.filter(item => {
        return searchFields.some(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], item)
          return value && value.toString().toLowerCase().includes(query)
        })
      })
    })
    
    return {
      searchQuery,
      updateSearch,
      filteredItems
    }
  }

  const getCacheStats = () => ({
    size: cache.size(),
    hits: metrics.value.cacheHits,
    misses: metrics.value.cacheMisses,
    hitRate: metrics.value.cacheHits / (metrics.value.cacheHits + metrics.value.cacheMisses) * 100 || 0
  })

  const clearCache = () => {
    cache.clear()
    metrics.value.cacheHits = 0
    metrics.value.cacheMisses = 0
  }

  return {
    metrics,
    useDebounce,
    measurePerformance,
    createOptimizedFilter,
    createTimeCalculations,
    createVirtualList,
    createImageLoader,
    createSearch,
    getCacheStats,
    clearCache
  }
}
