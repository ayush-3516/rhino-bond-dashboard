import { ref, reactive, computed } from 'vue'

// Benchmark configuration
const BENCHMARK_CONFIG = {
  WARMUP_ITERATIONS: 5,
  SAMPLE_SIZE: 10,
  MAX_EXECUTION_TIME: 30000, // 30 seconds
  MEMORY_SAMPLING_INTERVAL: 100, // ms
  PERFORMANCE_THRESHOLDS: {
    EXCELLENT: 100, // ms
    GOOD: 500,
    ACCEPTABLE: 1000,
    POOR: 2000
  }
}

// Performance metrics storage
const benchmarkResults = reactive({
  suites: new Map(),
  lastRun: null,
  totalTests: 0,
  summary: {
    fastest: null,
    slowest: null,
    averageTime: 0,
    totalTime: 0
  }
})

export function usePerformanceBenchmark() {
  const isRunning = ref(false)
  const currentSuite = ref(null)
  const currentTest = ref(null)

  // Memory monitoring utilities
  const getMemoryUsage = () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Statistical calculations
  const calculateStats = (times) => {
    if (times.length === 0) return null

    const sorted = [...times].sort((a, b) => a - b)
    const sum = times.reduce((a, b) => a + b, 0)
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      standardDeviation: Math.sqrt(
        times.reduce((sq, n) => sq + Math.pow(n - (sum / times.length), 2), 0) / times.length
      )
    }
  }

  // Performance classification
  const classifyPerformance = (averageTime) => {
    const thresholds = BENCHMARK_CONFIG.PERFORMANCE_THRESHOLDS
    if (averageTime <= thresholds.EXCELLENT) return 'excellent'
    if (averageTime <= thresholds.GOOD) return 'good'
    if (averageTime <= thresholds.ACCEPTABLE) return 'acceptable'
    if (averageTime <= thresholds.POOR) return 'poor'
    return 'critical'
  }

  // Memory profiling during test execution
  const profileMemory = async (testFunction, duration) => {
    const samples = []
    const startMemory = getMemoryUsage()
    let maxMemory = startMemory
    
    const samplingInterval = setInterval(() => {
      const current = getMemoryUsage()
      if (current) {
        samples.push({
          timestamp: Date.now(),
          ...current
        })
        
        if (current.used > maxMemory?.used) {
          maxMemory = current
        }
      }
    }, BENCHMARK_CONFIG.MEMORY_SAMPLING_INTERVAL)

    try {
      const result = await testFunction()
      return {
        result,
        memoryProfile: {
          startMemory,
          endMemory: getMemoryUsage(),
          maxMemory,
          samples,
          totalAllocated: maxMemory?.used - startMemory?.used || 0
        }
      }
    } finally {
      clearInterval(samplingInterval)
    }
  }

  // Core benchmark function
  const benchmark = async (name, testFunction, options = {}) => {
    const {
      warmupIterations = BENCHMARK_CONFIG.WARMUP_ITERATIONS,
      sampleSize = BENCHMARK_CONFIG.SAMPLE_SIZE,
      timeout = BENCHMARK_CONFIG.MAX_EXECUTION_TIME,
      profileMemory: shouldProfileMemory = true,
      async = true
    } = options

    console.log(`🚀 Starting benchmark: ${name}`)
    
    const times = []
    const errors = []
    let memoryProfile = null

    // Warmup phase
    console.log(`🔥 Warming up (${warmupIterations} iterations)...`)
    for (let i = 0; i < warmupIterations; i++) {
      try {
        if (async) {
          await testFunction()
        } else {
          testFunction()
        }
      } catch (error) {
        console.warn(`Warmup iteration ${i + 1} failed:`, error)
      }
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc()
    }

    // Main benchmark phase
    console.log(`📊 Running benchmark (${sampleSize} samples)...`)
    
    for (let i = 0; i < sampleSize; i++) {
      try {
        const startTime = performance.now()
        
        if (shouldProfileMemory && i === 0) {
          // Profile memory only on first iteration to avoid overhead
          const profileResult = await profileMemory(testFunction, timeout)
          memoryProfile = profileResult.memoryProfile
          const endTime = performance.now()
          times.push(endTime - startTime)
        } else {
          if (async) {
            await Promise.race([
              testFunction(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Benchmark timeout')), timeout)
              )
            ])
          } else {
            testFunction()
          }
          
          const endTime = performance.now()
          times.push(endTime - startTime)
        }
        
      } catch (error) {
        errors.push({
          iteration: i + 1,
          error: error.message
        })
        console.error(`Benchmark iteration ${i + 1} failed:`, error)
      }
    }

    // Calculate statistics
    const stats = calculateStats(times)
    const performance = classifyPerformance(stats?.mean || 0)

    const result = {
      name,
      timestamp: Date.now(),
      stats,
      times,
      errors,
      memoryProfile,
      performance,
      sampleSize: times.length,
      successRate: ((times.length / sampleSize) * 100).toFixed(2),
      options
    }

    console.log(`✅ Benchmark completed: ${name}`)
    console.log(`📈 Average: ${stats?.mean.toFixed(2)}ms (${performance})`)
    console.log(`🎯 Success rate: ${result.successRate}%`)

    return result
  }

  // Benchmark suite for running multiple tests
  const createSuite = (suiteName) => {
    const tests = []
    
    return {
      add(testName, testFunction, options = {}) {
        tests.push({ name: testName, fn: testFunction, options })
        return this
      },
      
      async run(suiteOptions = {}) {
        isRunning.value = true
        currentSuite.value = suiteName
        
        console.log(`🏁 Starting benchmark suite: ${suiteName}`)
        
        const suiteResults = {
          name: suiteName,
          timestamp: Date.now(),
          tests: [],
          summary: null
        }

        for (const test of tests) {
          currentTest.value = test.name
          
          try {
            const result = await benchmark(test.name, test.fn, {
              ...suiteOptions,
              ...test.options
            })
            suiteResults.tests.push(result)
          } catch (error) {
            console.error(`Test ${test.name} failed:`, error)
            suiteResults.tests.push({
              name: test.name,
              error: error.message,
              timestamp: Date.now()
            })
          }
        }

        // Calculate suite summary
        const validTests = suiteResults.tests.filter(t => !t.error)
        if (validTests.length > 0) {
          const allTimes = validTests.flatMap(t => t.times || [])
          suiteResults.summary = {
            totalTests: tests.length,
            successfulTests: validTests.length,
            totalTime: allTimes.reduce((sum, time) => sum + time, 0),
            averageTime: allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length,
            fastest: validTests.reduce((fastest, test) => 
              !fastest || (test.stats?.mean < fastest.stats?.mean) ? test : fastest
            ),
            slowest: validTests.reduce((slowest, test) => 
              !slowest || (test.stats?.mean > slowest.stats?.mean) ? test : slowest
            )
          }
        }

        // Store results
        benchmarkResults.suites.set(suiteName, suiteResults)
        benchmarkResults.lastRun = Date.now()
        benchmarkResults.totalTests += tests.length

        // Update global summary
        updateGlobalSummary()

        currentSuite.value = null
        currentTest.value = null
        isRunning.value = false

        console.log(`🏆 Suite completed: ${suiteName}`)
        
        return suiteResults
      }
    }
  }

  const updateGlobalSummary = () => {
    const allTests = []
    benchmarkResults.suites.forEach(suite => {
      allTests.push(...(suite.tests.filter(t => !t.error)))
    })

    if (allTests.length > 0) {
      const allTimes = allTests.flatMap(t => t.times || [])
      benchmarkResults.summary = {
        fastest: allTests.reduce((fastest, test) => 
          !fastest || (test.stats?.mean < fastest.stats?.mean) ? test : fastest
        ),
        slowest: allTests.reduce((slowest, test) => 
          !slowest || (test.stats?.mean > slowest.stats?.mean) ? test : slowest
        ),
        averageTime: allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length,
        totalTime: allTimes.reduce((sum, time) => sum + time, 0)
      }
    }
  }

  // Comparison utilities
  const compare = (baseline, candidate) => {
    if (!baseline.stats || !candidate.stats) return null

    const improvement = baseline.stats.mean - candidate.stats.mean
    const percentageImprovement = (improvement / baseline.stats.mean) * 100

    return {
      baseline: baseline.name,
      candidate: candidate.name,
      improvement,
      percentageImprovement,
      isImprovement: improvement > 0,
      significantChange: Math.abs(percentageImprovement) > 5 // 5% threshold
    }
  }

  // Report generation
  const generateReport = (suiteNameOrResults) => {
    let suiteResults
    
    if (typeof suiteNameOrResults === 'string') {
      suiteResults = benchmarkResults.suites.get(suiteNameOrResults)
    } else {
      suiteResults = suiteNameOrResults
    }

    if (!suiteResults) return null

    const report = {
      suite: suiteResults.name,
      timestamp: new Date(suiteResults.timestamp).toISOString(),
      summary: suiteResults.summary,
      tests: suiteResults.tests.map(test => ({
        name: test.name,
        performance: test.performance,
        mean: test.stats?.mean,
        median: test.stats?.median,
        min: test.stats?.min,
        max: test.stats?.max,
        standardDeviation: test.stats?.standardDeviation,
        successRate: test.successRate,
        memoryUsed: test.memoryProfile?.totalAllocated ? 
          formatBytes(test.memoryProfile.totalAllocated) : null
      }))
    }

    return report
  }

  // Export results
  const exportResults = (format = 'json') => {
    const data = {
      timestamp: new Date().toISOString(),
      results: Object.fromEntries(benchmarkResults.suites),
      summary: benchmarkResults.summary
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    }

    if (format === 'csv') {
      const allTests = []
      benchmarkResults.suites.forEach((suite, suiteName) => {
        suite.tests.forEach(test => {
          if (!test.error) {
            allTests.push({
              suite: suiteName,
              test: test.name,
              mean: test.stats?.mean,
              median: test.stats?.median,
              min: test.stats?.min,
              max: test.stats?.max,
              performance: test.performance,
              successRate: test.successRate
            })
          }
        })
      })

      const headers = Object.keys(allTests[0] || {})
      const csvContent = [
        headers.join(','),
        ...allTests.map(row => headers.map(header => row[header]).join(','))
      ].join('\n')

      return csvContent
    }

    return data
  }

  // Clear all results
  const clearResults = () => {
    benchmarkResults.suites.clear()
    benchmarkResults.lastRun = null
    benchmarkResults.totalTests = 0
    benchmarkResults.summary = {
      fastest: null,
      slowest: null,
      averageTime: 0,
      totalTime: 0
    }
  }

  // Computed properties
  const status = computed(() => ({
    isRunning: isRunning.value,
    currentSuite: currentSuite.value,
    currentTest: currentTest.value,
    totalSuites: benchmarkResults.suites.size,
    totalTests: benchmarkResults.totalTests,
    lastRun: benchmarkResults.lastRun
  }))

  const results = computed(() => benchmarkResults)

  return {
    benchmark,
    createSuite,
    compare,
    generateReport,
    exportResults,
    clearResults,
    status,
    results,
    isRunning,
    
    // Utilities
    getMemoryUsage,
    formatBytes,
    calculateStats,
    classifyPerformance
  }
}

// Pre-defined benchmark suites for common operations
export const createUserManagementBenchmarks = () => {
  const { createSuite } = usePerformanceBenchmark()
  
  return createSuite('User Management Performance')
    .add('User List Rendering', async () => {
      // Simulate rendering 1000 users
      const users = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`
      }))
      
      // Simulate DOM operations
      const container = document.createElement('div')
      users.forEach(user => {
        const element = document.createElement('div')
        element.textContent = `${user.name} - ${user.email}`
        container.appendChild(element)
      })
      
      return container.children.length
    })
    .add('Search Filtering', () => {
      const users = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: i % 3 === 0 ? 'admin' : 'user'
      }))
      
      const searchTerm = 'user1'
      return users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      )
    })
    .add('Data Transformation', () => {
      const users = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        firstName: `First${i}`,
        lastName: `Last${i}`,
        email: `user${i}@example.com`,
        createdAt: new Date(Date.now() - Math.random() * 31536000000) // Random date within last year
      }))
      
      return users.map(user => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        displayName: user.fullName.length > 20 ? 
          user.fullName.substring(0, 17) + '...' : user.fullName,
        timeAgo: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      }))
    })
}
