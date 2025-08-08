/**
 * Performance optimization composable for QR Code page
 * Provides reusable performance optimization utilities
 */

import { ref, computed, nextTick } from 'vue'
import { QRCodeCache, ErrorHandler, PerformanceMonitor } from '../utils/qrCodeUtils.js'

export function useQRCodePerformance() {
  // Initialize cache and monitoring
  const cache = new QRCodeCache()
  const monitor = PerformanceMonitor
  
  // Loading states
  const loading = ref(false)
  const error = ref(null)
  
  // Performance metrics
  const metrics = ref({
    fetchTime: 0,
    exportTime: 0,
    cacheHitRate: 0,
    totalRequests: 0,
    cacheHits: 0
  })
  
  // Error handling with user-friendly messages
  const handleError = (err, operation) => {
    console.error(`Error in ${operation}:`, err)
    error.value = ErrorHandler.createUserMessage(err, operation)
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      error.value = null
    }, 5000)
  }
  
  // Optimized data fetching with caching
  const fetchWithCache = async (key, fetchFn, useCache = true) => {
    metrics.value.totalRequests++
    
    // Check cache first
    if (useCache && cache.has(key)) {
      metrics.value.cacheHits++
      return cache.get(key)
    }
    
    try {
      loading.value = true
      error.value = null
      
      const startTime = performance.now()
      const result = await ErrorHandler.retryWithBackoff(fetchFn)
      const endTime = performance.now()
      
      // Update metrics
      metrics.value.fetchTime = endTime - startTime
      metrics.value.cacheHitRate = (metrics.value.cacheHits / metrics.value.totalRequests) * 100
      
      // Cache the result
      cache.set(key, result)
      
      return result
    } catch (err) {
      handleError(err, 'fetch data')
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Optimistic updates for better UX
  const optimisticUpdate = (updateFn, revertFn) => {
    return async (operation) => {
      // Apply optimistic update
      updateFn()
      
      try {
        await operation()
        // Clear cache to ensure fresh data on next fetch
        cache.clear()
      } catch (err) {
        // Revert optimistic update on error
        revertFn()
        throw err
      }
    }
  }
  
  // Debounced search for better performance
  const useDebounce = (fn, delay = 300) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  }
  
  // Memory management for large datasets
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
    
    return {
      currentPage,
      paginatedItems,
      totalPages,
      goToPage,
      nextPage: () => goToPage(currentPage.value + 1),
      prevPage: () => goToPage(currentPage.value - 1)
    }
  }
  
  // Batch processing with progress tracking
  const processBatch = async (items, processor, onProgress, chunkSize = 10) => {
    const chunks = []
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize))
    }
    
    const results = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const chunkResults = await processor(chunk, i)
      results.push(...chunkResults)
      
      if (onProgress) {
        onProgress({
          completed: i + 1,
          total: chunks.length,
          percentage: Math.round(((i + 1) / chunks.length) * 100)
        })
      }
      
      // Allow UI updates between chunks
      await nextTick()
      
      // Small delay to prevent blocking
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    
    return results
  }
  
  // Performance monitoring
  const measurePerformance = (label, fn) => {
    return monitor.measure(label, fn)
  }
  
  // Cache management
  const clearCache = () => cache.clear()
  const getCacheStats = () => ({
    size: cache.cache.size,
    maxSize: cache.maxSize,
    hitRate: metrics.value.cacheHitRate
  })
  
  return {
    // State
    loading,
    error,
    metrics,
    
    // Methods
    handleError,
    fetchWithCache,
    optimisticUpdate,
    useDebounce,
    createVirtualList,
    processBatch,
    measurePerformance,
    
    // Cache management
    clearCache,
    getCacheStats
  }
}
