/**
 * Event Page Performance Benchmark
 * Run this in browser console to measure performance improvements
 */

class EventPerformanceBenchmark {
  constructor() {
    this.results = {
      renderTests: [],
      searchTests: [],
      memoryTests: [],
      cacheTests: []
    }
  }

  // Simulate event data for testing
  generateMockEvents(count = 100) {
    const events = []
    const now = new Date()
    
    for (let i = 0; i < count; i++) {
      events.push({
        id: i + 1,
        title: `Conservation Event ${i + 1}`,
        description: `This is a detailed description for event ${i + 1} about wildlife conservation and environmental protection.`,
        start_date: new Date(now.getTime() + (i * 24 * 60 * 60 * 1000)).toISOString(),
        end_date: new Date(now.getTime() + ((i + 2) * 24 * 60 * 60 * 1000)).toISOString(),
        image_url: `https://picsum.photos/300/200?random=${i}`,
        created_at: new Date(now.getTime() - (i * 60 * 60 * 1000)).toISOString(),
        updated_at: new Date(now.getTime() - (i * 30 * 60 * 1000)).toISOString()
      })
    }
    
    return events
  }

  // Test render performance
  async testRenderPerformance(eventCount = 50) {
    console.log(`🔄 Testing render performance with ${eventCount} events...`)
    
    const events = this.generateMockEvents(eventCount)
    const results = []
    
    // Test multiple render cycles
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now()
      
      // Simulate DOM manipulation
      const container = document.createElement('div')
      events.forEach(event => {
        const eventElement = document.createElement('div')
        eventElement.innerHTML = `
          <div class="event-card">
            <h3>${event.title}</h3>
            <p>${event.description}</p>
            <span>${event.start_date}</span>
          </div>
        `
        container.appendChild(eventElement)
      })
      
      const endTime = performance.now()
      results.push(endTime - startTime)
    }
    
    const avgTime = results.reduce((a, b) => a + b, 0) / results.length
    this.results.renderTests.push({
      eventCount,
      avgRenderTime: avgTime,
      minTime: Math.min(...results),
      maxTime: Math.max(...results),
      timestamp: new Date().toISOString()
    })
    
    console.log(`✅ Render test complete: ${avgTime.toFixed(2)}ms average`)
    return avgTime
  }

  // Test search performance
  async testSearchPerformance() {
    console.log('🔍 Testing search performance...')
    
    const events = this.generateMockEvents(200)
    const searchTerms = ['conservation', 'wildlife', 'event', 'environment', 'protection']
    const results = []
    
    searchTerms.forEach(term => {
      const startTime = performance.now()
      
      const filtered = events.filter(event => 
        event.title.toLowerCase().includes(term.toLowerCase()) ||
        event.description.toLowerCase().includes(term.toLowerCase())
      )
      
      const endTime = performance.now()
      results.push({
        term,
        resultCount: filtered.length,
        searchTime: endTime - startTime
      })
    })
    
    const avgSearchTime = results.reduce((acc, r) => acc + r.searchTime, 0) / results.length
    
    this.results.searchTests.push({
      totalEvents: events.length,
      avgSearchTime,
      results,
      timestamp: new Date().toISOString()
    })
    
    console.log(`✅ Search test complete: ${avgSearchTime.toFixed(2)}ms average`)
    return avgSearchTime
  }

  // Test cache performance
  testCachePerformance() {
    console.log('💾 Testing cache performance...')
    
    const cache = new Map()
    const testData = this.generateMockEvents(100)
    let hits = 0
    let misses = 0
    
    // Simulate cache operations
    const operations = []
    for (let i = 0; i < 1000; i++) {
      const randomEvent = testData[Math.floor(Math.random() * testData.length)]
      const cacheKey = `event_${randomEvent.id}_formatted`
      
      const startTime = performance.now()
      
      if (cache.has(cacheKey)) {
        hits++
        cache.get(cacheKey)
      } else {
        misses++
        // Simulate expensive operation
        const formatted = {
          ...randomEvent,
          formattedDate: new Date(randomEvent.start_date).toLocaleDateString(),
          timeRemaining: 'calculated_value'
        }
        cache.set(cacheKey, formatted)
      }
      
      const endTime = performance.now()
      operations.push(endTime - startTime)
    }
    
    const hitRate = (hits / (hits + misses)) * 100
    const avgOperationTime = operations.reduce((a, b) => a + b, 0) / operations.length
    
    this.results.cacheTests.push({
      totalOperations: operations.length,
      hits,
      misses,
      hitRate,
      avgOperationTime,
      timestamp: new Date().toISOString()
    })
    
    console.log(`✅ Cache test complete: ${hitRate.toFixed(1)}% hit rate`)
    return { hitRate, avgOperationTime }
  }

  // Test memory usage
  testMemoryUsage() {
    if (!performance.memory) {
      console.log('⚠️ Memory API not available in this browser')
      return null
    }
    
    console.log('🧠 Testing memory usage...')
    
    const initialMemory = performance.memory.usedJSHeapSize
    
    // Create large dataset to simulate memory pressure
    const largeDataset = []
    for (let i = 0; i < 1000; i++) {
      largeDataset.push(this.generateMockEvents(100))
    }
    
    const peakMemory = performance.memory.usedJSHeapSize
    
    // Cleanup
    largeDataset.length = 0
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc()
    }
    
    setTimeout(() => {
      const finalMemory = performance.memory.usedJSHeapSize
      
      this.results.memoryTests.push({
        initialMemory: initialMemory / 1024 / 1024, // MB
        peakMemory: peakMemory / 1024 / 1024,       // MB
        finalMemory: finalMemory / 1024 / 1024,     // MB
        memoryIncrease: (peakMemory - initialMemory) / 1024 / 1024,
        memoryRecovered: (peakMemory - finalMemory) / 1024 / 1024,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ Memory test complete: ${((peakMemory - initialMemory) / 1024 / 1024).toFixed(2)}MB peak increase`)
    }, 1000)
  }

  // Run comprehensive benchmark
  async runFullBenchmark() {
    console.log('🚀 Starting comprehensive Events page performance benchmark...')
    console.log('=' * 60)
    
    // Test different event counts
    for (const count of [10, 25, 50, 100]) {
      await this.testRenderPerformance(count)
    }
    
    await this.testSearchPerformance()
    this.testCachePerformance()
    this.testMemoryUsage()
    
    // Generate report
    setTimeout(() => {
      this.generateReport()
    }, 2000)
  }

  // Generate performance report
  generateReport() {
    console.log('\n📊 PERFORMANCE BENCHMARK RESULTS')
    console.log('=' * 50)
    
    // Render performance summary
    if (this.results.renderTests.length > 0) {
      console.log('\n🎨 RENDER PERFORMANCE:')
      this.results.renderTests.forEach(test => {
        const timePerEvent = test.avgRenderTime / test.eventCount
        const status = test.avgRenderTime < 16 ? '🟢 Excellent' : 
                      test.avgRenderTime < 50 ? '🟡 Good' : '🔴 Needs Improvement'
        
        console.log(`  ${test.eventCount} events: ${test.avgRenderTime.toFixed(2)}ms (${timePerEvent.toFixed(2)}ms/event) ${status}`)
      })
    }
    
    // Search performance summary
    if (this.results.searchTests.length > 0) {
      console.log('\n🔍 SEARCH PERFORMANCE:')
      this.results.searchTests.forEach(test => {
        const status = test.avgSearchTime < 10 ? '🟢 Excellent' : 
                      test.avgSearchTime < 50 ? '🟡 Good' : '🔴 Needs Improvement'
        
        console.log(`  ${test.totalEvents} events: ${test.avgSearchTime.toFixed(2)}ms average ${status}`)
      })
    }
    
    // Cache performance summary
    if (this.results.cacheTests.length > 0) {
      console.log('\n💾 CACHE PERFORMANCE:')
      this.results.cacheTests.forEach(test => {
        const status = test.hitRate > 70 ? '🟢 Excellent' : 
                      test.hitRate > 50 ? '🟡 Good' : '🔴 Needs Improvement'
        
        console.log(`  Hit rate: ${test.hitRate.toFixed(1)}% ${status}`)
        console.log(`  Avg operation: ${test.avgOperationTime.toFixed(3)}ms`)
      })
    }
    
    // Memory usage summary
    if (this.results.memoryTests.length > 0) {
      console.log('\n🧠 MEMORY USAGE:')
      this.results.memoryTests.forEach(test => {
        console.log(`  Peak increase: ${test.memoryIncrease.toFixed(2)}MB`)
        console.log(`  Memory recovered: ${test.memoryRecovered.toFixed(2)}MB`)
      })
    }
    
    console.log('\n✅ Benchmark complete! Copy results for performance analysis.')
    
    // Return results for programmatic access
    return this.results
  }

  // Export results as JSON
  exportResults() {
    const exportData = {
      benchmarkInfo: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        performance: {
          memory: performance.memory ? {
            supported: true,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          } : { supported: false }
        }
      },
      results: this.results
    }
    
    console.log('📋 Benchmark Results (JSON):')
    console.log(JSON.stringify(exportData, null, 2))
    
    return exportData
  }
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('🎯 Event Performance Benchmark Tool Ready!')
  console.log('Usage:')
  console.log('  const benchmark = new EventPerformanceBenchmark()')
  console.log('  benchmark.runFullBenchmark()')
  console.log('  benchmark.exportResults()')
  
  // Make available globally
  window.EventPerformanceBenchmark = EventPerformanceBenchmark
}
