import { ref, reactive } from 'vue'

// Error recovery configuration
const ERROR_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 30000, // 30 seconds
  BACKOFF_MULTIPLIER: 2,
  JITTER_FACTOR: 0.1, // 10% jitter
  TIMEOUT: 30000, // 30 seconds
  CIRCUIT_BREAKER_THRESHOLD: 5, // failures before opening circuit
  CIRCUIT_BREAKER_TIMEOUT: 60000 // 1 minute
}

// Error types and their retry strategies
const ERROR_STRATEGIES = {
  NETWORK_ERROR: { retryable: true, maxRetries: 3 },
  TIMEOUT_ERROR: { retryable: true, maxRetries: 2 },
  SERVER_ERROR: { retryable: true, maxRetries: 2 },
  CLIENT_ERROR: { retryable: false, maxRetries: 0 },
  VALIDATION_ERROR: { retryable: false, maxRetries: 0 },
  AUTHENTICATION_ERROR: { retryable: false, maxRetries: 0 },
  RATE_LIMIT_ERROR: { retryable: true, maxRetries: 5, delay: 5000 }
}

// Circuit breaker states
const CIRCUIT_STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
}

// Global error tracking
const errorMetrics = reactive({
  totalErrors: 0,
  totalRetries: 0,
  successfulRetries: 0,
  failedRetries: 0,
  circuitBreakerTrips: 0,
  averageRetryTime: 0,
  errorsByType: new Map()
})

// Circuit breaker for each operation
const circuitBreakers = new Map()

export function useErrorRecovery() {
  const isRecovering = ref(false)
  const lastError = ref(null)
  const retryAttempts = ref(0)

  // Classify error type
  const classifyError = (error) => {
    if (!error) return 'UNKNOWN_ERROR'

    // Network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return 'NETWORK_ERROR'
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return 'TIMEOUT_ERROR'
    }

    // HTTP status codes
    if (error.response?.status) {
      const status = error.response.status
      if (status >= 500) return 'SERVER_ERROR'
      if (status === 429) return 'RATE_LIMIT_ERROR'
      if (status === 401 || status === 403) return 'AUTHENTICATION_ERROR'
      if (status >= 400) return 'CLIENT_ERROR'
    }

    // Validation errors
    if (error.name === 'ValidationError' || error.type === 'validation') {
      return 'VALIDATION_ERROR'
    }

    return 'UNKNOWN_ERROR'
  }

  // Calculate delay with exponential backoff and jitter
  const calculateDelay = (attempt, baseDelay = ERROR_CONFIG.INITIAL_DELAY) => {
    const exponentialDelay = baseDelay * Math.pow(ERROR_CONFIG.BACKOFF_MULTIPLIER, attempt - 1)
    const cappedDelay = Math.min(exponentialDelay, ERROR_CONFIG.MAX_DELAY)
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * ERROR_CONFIG.JITTER_FACTOR * Math.random()
    return cappedDelay + jitter
  }

  // Sleep utility
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // Update error metrics
  const updateErrorMetrics = (errorType, isRetry = false, success = false) => {
    errorMetrics.totalErrors++
    
    if (isRetry) {
      errorMetrics.totalRetries++
      if (success) {
        errorMetrics.successfulRetries++
      } else {
        errorMetrics.failedRetries++
      }
    }

    // Track errors by type
    const count = errorMetrics.errorsByType.get(errorType) || 0
    errorMetrics.errorsByType.set(errorType, count + 1)
  }

  // Circuit breaker implementation
  const getCircuitBreaker = (operationId) => {
    if (!circuitBreakers.has(operationId)) {
      circuitBreakers.set(operationId, {
        state: CIRCUIT_STATES.CLOSED,
        failureCount: 0,
        lastFailureTime: null,
        successCount: 0
      })
    }
    return circuitBreakers.get(operationId)
  }

  const updateCircuitBreaker = (operationId, success) => {
    const breaker = getCircuitBreaker(operationId)
    
    if (success) {
      breaker.successCount++
      if (breaker.state === CIRCUIT_STATES.HALF_OPEN) {
        // If we had a few successes, close the circuit
        if (breaker.successCount >= 2) {
          breaker.state = CIRCUIT_STATES.CLOSED
          breaker.failureCount = 0
        }
      } else if (breaker.state === CIRCUIT_STATES.CLOSED) {
        breaker.failureCount = 0
      }
    } else {
      breaker.failureCount++
      breaker.lastFailureTime = Date.now()
      breaker.successCount = 0

      if (breaker.state === CIRCUIT_STATES.CLOSED && 
          breaker.failureCount >= ERROR_CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
        breaker.state = CIRCUIT_STATES.OPEN
        errorMetrics.circuitBreakerTrips++
        console.warn(`Circuit breaker opened for operation: ${operationId}`)
      }
    }
  }

  const isCircuitOpen = (operationId) => {
    const breaker = getCircuitBreaker(operationId)
    
    if (breaker.state === CIRCUIT_STATES.OPEN) {
      // Check if we should try half-open
      const timeSinceLastFailure = Date.now() - breaker.lastFailureTime
      if (timeSinceLastFailure > ERROR_CONFIG.CIRCUIT_BREAKER_TIMEOUT) {
        breaker.state = CIRCUIT_STATES.HALF_OPEN
        return false
      }
      return true
    }
    
    return false
  }

  // Main retry function with circuit breaker
  const withRetry = async (operation, options = {}) => {
    const {
      operationId = 'default',
      maxRetries = ERROR_CONFIG.MAX_RETRIES,
      onRetry = null,
      onFinalFailure = null,
      timeout = ERROR_CONFIG.TIMEOUT,
      customStrategy = null
    } = options

    // Check circuit breaker
    if (isCircuitOpen(operationId)) {
      const error = new Error(`Circuit breaker is open for operation: ${operationId}`)
      error.code = 'CIRCUIT_BREAKER_OPEN'
      throw error
    }

    isRecovering.value = false
    retryAttempts.value = 0
    lastError.value = null

    const executeWithTimeout = (fn, timeoutMs) => {
      return Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
        )
      ])
    }

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const startTime = Date.now()
        const result = await executeWithTimeout(operation, timeout)
        
        // Success - update circuit breaker
        updateCircuitBreaker(operationId, true)
        
        if (attempt > 1) {
          const retryTime = Date.now() - startTime
          updateErrorMetrics('SUCCESS', true, true)
          console.log(`Operation succeeded after ${attempt - 1} retries in ${retryTime}ms`)
        }
        
        isRecovering.value = false
        return result
        
      } catch (error) {
        lastError.value = error
        retryAttempts.value = attempt - 1
        
        const errorType = classifyError(error)
        const strategy = customStrategy || ERROR_STRATEGIES[errorType] || ERROR_STRATEGIES.NETWORK_ERROR
        
        updateErrorMetrics(errorType, attempt > 1, false)
        updateCircuitBreaker(operationId, false)

        // If this is the last attempt or error is not retryable
        if (attempt > maxRetries || !strategy.retryable) {
          isRecovering.value = false
          
          if (onFinalFailure) {
            onFinalFailure(error, attempt - 1)
          }
          
          console.error(`Operation failed after ${attempt - 1} retries:`, error)
          throw error
        }

        // Calculate delay for next retry
        const baseDelay = strategy.delay || ERROR_CONFIG.INITIAL_DELAY
        const delay = calculateDelay(attempt, baseDelay)
        
        isRecovering.value = true
        
        if (onRetry) {
          onRetry(error, attempt, delay)
        }
        
        console.warn(`Retry attempt ${attempt} in ${delay}ms due to:`, error.message)
        
        await sleep(delay)
      }
    }
  }

  // Bulk operation with individual error handling
  const withBulkRetry = async (operations, options = {}) => {
    const {
      concurrency = 3,
      failFast = false,
      onItemSuccess = null,
      onItemFailure = null,
      onProgress = null
    } = options

    const results = []
    const errors = []
    let completed = 0

    const executeOperation = async (operation, index) => {
      try {
        const result = await withRetry(operation, {
          ...options,
          operationId: `bulk_${index}`
        })
        
        results[index] = { success: true, data: result }
        
        if (onItemSuccess) {
          onItemSuccess(result, index)
        }
        
      } catch (error) {
        results[index] = { success: false, error }
        errors.push({ index, error })
        
        if (onItemFailure) {
          onItemFailure(error, index)
        }
        
        if (failFast) {
          throw error
        }
      }
      
      completed++
      if (onProgress) {
        onProgress(completed, operations.length)
      }
    }

    // Execute operations with concurrency limit
    const chunks = []
    for (let i = 0; i < operations.length; i += concurrency) {
      chunks.push(operations.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((operation, index) => 
          executeOperation(operation, i * concurrency + index)
        )
      )
    }

    return {
      results,
      errors,
      successCount: results.filter(r => r.success).length,
      errorCount: errors.length
    }
  }

  // Memoized retry wrapper
  const memoizedRetry = (operation, cacheKey, options = {}) => {
    const cache = new Map()
    
    return async (...args) => {
      const key = cacheKey ? cacheKey(...args) : JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)
      }
      
      try {
        const result = await withRetry(() => operation(...args), options)
        cache.set(key, result)
        return result
      } catch (error) {
        // Don't cache errors
        throw error
      }
    }
  }

  // Recovery status and metrics
  const getRecoveryStatus = () => ({
    isRecovering: isRecovering.value,
    lastError: lastError.value,
    retryAttempts: retryAttempts.value,
    metrics: { ...errorMetrics },
    circuitBreakers: Object.fromEntries(circuitBreakers)
  })

  // Reset circuit breaker manually
  const resetCircuitBreaker = (operationId) => {
    if (circuitBreakers.has(operationId)) {
      const breaker = circuitBreakers.get(operationId)
      breaker.state = CIRCUIT_STATES.CLOSED
      breaker.failureCount = 0
      breaker.successCount = 0
      breaker.lastFailureTime = null
      console.log(`Circuit breaker reset for operation: ${operationId}`)
    }
  }

  // Clear all metrics
  const clearMetrics = () => {
    errorMetrics.totalErrors = 0
    errorMetrics.totalRetries = 0
    errorMetrics.successfulRetries = 0
    errorMetrics.failedRetries = 0
    errorMetrics.circuitBreakerTrips = 0
    errorMetrics.averageRetryTime = 0
    errorMetrics.errorsByType.clear()
    circuitBreakers.clear()
  }

  return {
    withRetry,
    withBulkRetry,
    memoizedRetry,
    getRecoveryStatus,
    resetCircuitBreaker,
    clearMetrics,
    isRecovering,
    lastError,
    retryAttempts,
    
    // Error classification
    classifyError,
    ERROR_STRATEGIES,
    CIRCUIT_STATES
  }
}

// Global error recovery instance
export const globalErrorRecovery = useErrorRecovery()
