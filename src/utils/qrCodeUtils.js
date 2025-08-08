/**
 * QR Code utility functions for optimization and reusability
 */

// Cache management
export class QRCodeCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 minutes TTL
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  set(key, data) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear() {
    this.cache.clear()
  }

  has(key) {
    return this.get(key) !== null
  }
}

// PDF export utilities
export const PDFExportUtils = {
  // Calculate optimal layout for QR codes on PDF
  calculateLayout(pageWidth, pageHeight, margin, qrSize, codesPerRow) {
    const availableWidth = pageWidth - (margin * 2)
    const availableHeight = pageHeight - (margin * 2)
    
    const spacing = Math.max(4, (availableWidth - (qrSize * codesPerRow)) / Math.max(1, codesPerRow - 1))
    const rowHeight = qrSize + 15 // QR code + identifier text space
    const codesPerPage = Math.floor(availableHeight / rowHeight) * codesPerRow
    
    return {
      spacing,
      rowHeight,
      codesPerPage,
      availableWidth,
      availableHeight
    }
  },

  // Create optimized canvas for QR code generation
  createOptimizedCanvas(size) {
    const canvas = document.createElement('canvas')
    const pixelRatio = window.devicePixelRatio || 1
    const canvasSize = size * Math.min(pixelRatio, 2) // Cap at 2x for memory efficiency
    
    canvas.width = canvasSize
    canvas.height = canvasSize
    
    const ctx = canvas.getContext('2d', {
      alpha: false, // Better performance
      desynchronized: true, // Allows for better performance
      willReadFrequently: false // We only read once for PDF generation
    })
    
    return { canvas, ctx, canvasSize }
  },

  // Clean up canvas resources
  cleanupCanvas(canvas) {
    canvas.width = 0
    canvas.height = 0
  }
}

// Batch processing utilities
export const BatchUtils = {
  // Process array in chunks with progress callback
  async processInChunks(array, chunkSize, processor, onProgress) {
    const chunks = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
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

      // Small delay to prevent blocking UI
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    return results
  }
}

// Error handling utilities
export const ErrorHandler = {
  // Exponential backoff retry logic
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        console.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms...`)
      }
    }
  },

  // Create user-friendly error messages
  createUserMessage(error, operation) {
    const errorMessages = {
      'Network Error': 'Please check your internet connection and try again.',
      'Permission denied': 'You do not have permission to perform this action.',
      'Not found': 'The requested data could not be found.',
      'Validation error': 'Please check your input and try again.',
      'Timeout': 'The operation took too long. Please try again.',
    }

    const errorType = this.getErrorType(error)
    const userMessage = errorMessages[errorType] || 'An unexpected error occurred.'
    
    return `Failed to ${operation}. ${userMessage}`
  },

  getErrorType(error) {
    if (error.message.includes('network')) return 'Network Error'
    if (error.message.includes('permission')) return 'Permission denied'
    if (error.message.includes('not found')) return 'Not found'
    if (error.message.includes('validation')) return 'Validation error'
    if (error.message.includes('timeout')) return 'Timeout'
    return 'Unknown Error'
  }
}

// Performance monitoring utilities
export const PerformanceMonitor = {
  timers: new Map(),

  start(label) {
    this.timers.set(label, performance.now())
  },

  end(label) {
    const startTime = this.timers.get(label)
    if (startTime) {
      const duration = performance.now() - startTime
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
      this.timers.delete(label)
      return duration
    }
    return 0
  },

  measure(label, fn) {
    return async (...args) => {
      this.start(label)
      try {
        const result = await fn(...args)
        return result
      } finally {
        this.end(label)
      }
    }
  }
}

// Data validation utilities
export const ValidationUtils = {
  isValidBatchId(batchId) {
    return batchId && typeof batchId === 'string' && batchId.trim().length > 0
  },

  isValidQRCodeArray(codes) {
    return Array.isArray(codes) && codes.length > 0 && codes.every(code => code && code.id)
  },

  isValidExportSettings(settings) {
    return settings &&
           typeof settings.size === 'number' && settings.size > 0 &&
           typeof settings.perRow === 'number' && settings.perRow > 0 &&
           typeof settings.margin === 'number' && settings.margin >= 0
  }
}
