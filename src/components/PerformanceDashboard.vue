<template>
  <div class="performance-dashboard">
    <div class="dashboard-header">
      <h3>Performance Dashboard</h3>
      <div class="dashboard-controls">
        <button @click="toggleAutoRefresh" :class="{ active: autoRefresh }" class="control-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M3 21v-5h5"></path>
          </svg>
          Auto Refresh
        </button>
        
        <button @click="refreshMetrics" :disabled="loading" class="control-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M3 21v-5h5"></path>
          </svg>
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
        
        <button @click="clearAllMetrics" class="control-btn danger">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Clear
        </button>
        
        <button @click="exportMetrics" class="control-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="metrics-summary">
      <div class="summary-card" :class="getPerformanceClass(overallPerformance.averageResponseTime)">
        <div class="card-header">
          <h4>Overall Performance</h4>
          <div class="performance-indicator" :class="getPerformanceClass(overallPerformance.averageResponseTime)">
            {{ getPerformanceLabel(overallPerformance.averageResponseTime) }}
          </div>
        </div>
        <div class="card-content">
          <div class="metric-row">
            <span class="metric-label">Avg Response Time:</span>
            <span class="metric-value">{{ overallPerformance.averageResponseTime.toFixed(2) }}ms</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Total Operations:</span>
            <span class="metric-value">{{ overallPerformance.totalOperations }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Success Rate:</span>
            <span class="metric-value">{{ overallPerformance.successRate.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-header">
          <h4>Cache Performance</h4>
          <div class="cache-indicator" :class="getCachePerformanceClass(cacheMetrics.hitRate)">
            {{ cacheMetrics.hitRate }}% Hit Rate
          </div>
        </div>
        <div class="card-content">
          <div class="metric-row">
            <span class="metric-label">Cache Size:</span>
            <span class="metric-value">{{ cacheMetrics.size }} entries</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Memory Usage:</span>
            <span class="metric-value">{{ cacheMetrics.memoryUsage }}KB</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Utilization:</span>
            <span class="metric-value">{{ cacheMetrics.utilizationPercent }}%</span>
          </div>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-header">
          <h4>Error Recovery</h4>
          <div class="recovery-indicator" :class="{ active: recoveryStatus.isRecovering }">
            {{ recoveryStatus.isRecovering ? 'Recovering' : 'Stable' }}
          </div>
        </div>
        <div class="card-content">
          <div class="metric-row">
            <span class="metric-label">Total Errors:</span>
            <span class="metric-value">{{ recoveryStatus.metrics.totalErrors }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Successful Retries:</span>
            <span class="metric-value">{{ recoveryStatus.metrics.successfulRetries }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Circuit Breaker Trips:</span>
            <span class="metric-value">{{ recoveryStatus.metrics.circuitBreakerTrips }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Metrics -->
    <div class="detailed-metrics">
      <!-- Operation Performance -->
      <div class="metrics-section">
        <h4>Operation Performance</h4>
        <div class="operations-table">
          <div class="table-header">
            <div class="col-operation">Operation</div>
            <div class="col-count">Count</div>
            <div class="col-average">Average (ms)</div>
            <div class="col-last">Last (ms)</div>
            <div class="col-status">Status</div>
          </div>
          <div 
            v-for="(operation, name) in performanceMetrics.performance" 
            :key="name"
            class="table-row"
          >
            <div class="col-operation">{{ formatOperationName(name) }}</div>
            <div class="col-count">{{ operation.count }}</div>
            <div class="col-average" :class="getPerformanceClass(operation.averageTime)">
              {{ operation.averageTime.toFixed(2) }}
            </div>
            <div class="col-last" :class="getPerformanceClass(operation.lastExecutionTime)">
              {{ operation.lastExecutionTime.toFixed(2) }}
            </div>
            <div class="col-status">
              <div class="status-indicator" :class="getPerformanceClass(operation.averageTime)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Breakdown -->
      <div class="metrics-section" v-if="errorBreakdown.length > 0">
        <h4>Error Breakdown</h4>
        <div class="error-chart">
          <div 
            v-for="error in errorBreakdown" 
            :key="error.type"
            class="error-bar"
          >
            <div class="error-label">{{ error.type }}</div>
            <div class="error-progress">
              <div 
                class="error-fill" 
                :style="{ width: `${(error.count / maxErrorCount) * 100}%` }"
              ></div>
            </div>
            <div class="error-count">{{ error.count }}</div>
          </div>
        </div>
      </div>

      <!-- Memory Usage Trend -->
      <div class="metrics-section" v-if="memoryTrend.length > 0">
        <h4>Memory Usage Trend</h4>
        <div class="memory-chart">
          <svg viewBox="0 0 400 200" class="trend-chart">
            <defs>
              <linearGradient id="memoryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#42b983;stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:#42b983;stop-opacity:0.1" />
              </linearGradient>
            </defs>
            <path 
              :d="memoryTrendPath" 
              stroke="#42b983" 
              stroke-width="2" 
              fill="url(#memoryGradient)"
            />
            <circle 
              v-for="(point, index) in memoryTrendPoints" 
              :key="index"
              :cx="point.x" 
              :cy="point.y" 
              r="3" 
              fill="#42b983"
            />
          </svg>
          <div class="chart-labels">
            <span class="label-start">{{ formatTime(memoryTrend[0]?.timestamp) }}</span>
            <span class="label-end">{{ formatTime(memoryTrend[memoryTrend.length - 1]?.timestamp) }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Activity Log -->
      <div class="metrics-section">
        <h4>Recent Activity</h4>
        <div class="activity-log">
          <div 
            v-for="activity in recentActivity" 
            :key="activity.id"
            class="activity-item"
            :class="activity.type"
          >
            <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
            <div class="activity-type">{{ activity.type }}</div>
            <div class="activity-message">{{ activity.message }}</div>
            <div class="activity-duration" v-if="activity.duration">
              {{ activity.duration.toFixed(2) }}ms
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useUserPerformance } from '@/composables/useUserPerformance'
import { useAdvancedCache } from '@/composables/useAdvancedCache'
import { useErrorRecovery } from '@/composables/useErrorRecovery'

const props = defineProps({
  refreshInterval: {
    type: Number,
    default: 5000 // 5 seconds
  },
  maxActivityItems: {
    type: Number,
    default: 50
  },
  maxMemoryPoints: {
    type: Number,
    default: 20
  }
})

// Composables
const { metrics: performanceMetrics, clearMetrics: clearPerformanceMetrics } = useUserPerformance()
const { stats: cacheMetrics, clearMetrics: clearCacheMetrics } = useAdvancedCache()
const { getRecoveryStatus, clearMetrics: clearRecoveryMetrics } = useErrorRecovery()

// State
const loading = ref(false)
const autoRefresh = ref(true)
const recentActivity = ref([])
const memoryTrend = ref([])
let refreshTimer = null
let activityId = 0

// Recovery status
const recoveryStatus = computed(() => getRecoveryStatus())

// Overall performance calculation
const overallPerformance = computed(() => {
  const operations = performanceMetrics.value.performance || {}
  const operationValues = Object.values(operations)
  
  if (operationValues.length === 0) {
    return {
      averageResponseTime: 0,
      totalOperations: 0,
      successRate: 100
    }
  }

  const totalTime = operationValues.reduce((sum, op) => sum + op.totalTime, 0)
  const totalCount = operationValues.reduce((sum, op) => sum + op.count, 0)
  const averageResponseTime = totalCount > 0 ? totalTime / totalCount : 0

  // Calculate success rate (assuming operations that complete are successful)
  const successRate = totalCount > 0 ? 100 : 0 // Simplified calculation

  return {
    averageResponseTime,
    totalOperations: totalCount,
    successRate
  }
})

// Error breakdown
const errorBreakdown = computed(() => {
  const errorMap = recoveryStatus.value.metrics.errorsByType || new Map()
  return Array.from(errorMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
})

const maxErrorCount = computed(() => {
  return Math.max(...errorBreakdown.value.map(e => e.count), 1)
})

// Memory trend calculations
const memoryTrendPath = computed(() => {
  if (memoryTrend.value.length < 2) return ''
  
  const points = memoryTrendPoints.value
  if (points.length < 2) return ''
  
  const path = points.reduce((acc, point, index) => {
    const command = index === 0 ? 'M' : 'L'
    return `${acc} ${command} ${point.x} ${point.y}`
  }, '')
  
  // Close the path for filled area
  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]
  return `${path} L ${lastPoint.x} 200 L ${firstPoint.x} 200 Z`
})

const memoryTrendPoints = computed(() => {
  if (memoryTrend.value.length === 0) return []
  
  const maxMemory = Math.max(...memoryTrend.value.map(t => t.memory), 1)
  const width = 400
  const height = 200
  const margin = 20
  
  return memoryTrend.value.map((trend, index) => ({
    x: margin + (index / (memoryTrend.value.length - 1)) * (width - 2 * margin),
    y: height - margin - ((trend.memory / maxMemory) * (height - 2 * margin))
  }))
})

// Methods
const getPerformanceClass = (responseTime) => {
  if (responseTime <= 100) return 'excellent'
  if (responseTime <= 500) return 'good'
  if (responseTime <= 1000) return 'acceptable'
  if (responseTime <= 2000) return 'poor'
  return 'critical'
}

const getPerformanceLabel = (responseTime) => {
  if (responseTime <= 100) return 'Excellent'
  if (responseTime <= 500) return 'Good'
  if (responseTime <= 1000) return 'Acceptable'
  if (responseTime <= 2000) return 'Poor'
  return 'Critical'
}

const getCachePerformanceClass = (hitRate) => {
  if (hitRate >= 80) return 'excellent'
  if (hitRate >= 60) return 'good'
  if (hitRate >= 40) return 'acceptable'
  return 'poor'
}

const formatOperationName = (name) => {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString()
}

const addActivity = (type, message, duration = null) => {
  recentActivity.value.unshift({
    id: ++activityId,
    timestamp: Date.now(),
    type,
    message,
    duration
  })
  
  // Keep only recent items
  if (recentActivity.value.length > props.maxActivityItems) {
    recentActivity.value = recentActivity.value.slice(0, props.maxActivityItems)
  }
}

const addMemoryPoint = () => {
  const memory = cacheMetrics.value.memoryUsage || 0
  memoryTrend.value.push({
    timestamp: Date.now(),
    memory
  })
  
  // Keep only recent points
  if (memoryTrend.value.length > props.maxMemoryPoints) {
    memoryTrend.value = memoryTrend.value.slice(-props.maxMemoryPoints)
  }
}

const refreshMetrics = async () => {
  loading.value = true
  
  try {
    // Add activity for refresh
    addActivity('refresh', 'Metrics refreshed manually')
    
    // Update memory trend
    addMemoryPoint()
    
    // Simulate some delay for loading state
    await new Promise(resolve => setTimeout(resolve, 100))
    
  } catch (error) {
    console.error('Failed to refresh metrics:', error)
    addActivity('error', 'Failed to refresh metrics')
  } finally {
    loading.value = false
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  
  if (autoRefresh.value) {
    startAutoRefresh()
    addActivity('system', 'Auto-refresh enabled')
  } else {
    stopAutoRefresh()
    addActivity('system', 'Auto-refresh disabled')
  }
}

const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer)
  
  refreshTimer = setInterval(() => {
    refreshMetrics()
  }, props.refreshInterval)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const clearAllMetrics = () => {
  clearPerformanceMetrics()
  clearCacheMetrics()
  clearRecoveryMetrics()
  recentActivity.value = []
  memoryTrend.value = []
  addActivity('system', 'All metrics cleared')
}

const exportMetrics = () => {
  const data = {
    timestamp: new Date().toISOString(),
    performance: performanceMetrics.value,
    cache: cacheMetrics.value,
    recovery: recoveryStatus.value,
    activity: recentActivity.value,
    memoryTrend: memoryTrend.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-metrics-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  addActivity('export', 'Metrics exported to file')
}

// Watchers
watch(() => performanceMetrics.value, (newMetrics, oldMetrics) => {
  if (!oldMetrics) return
  
  // Detect new operations
  Object.entries(newMetrics.performance || {}).forEach(([name, operation]) => {
    const oldOperation = oldMetrics.performance?.[name]
    if (!oldOperation || operation.count > oldOperation.count) {
      addActivity('operation', `${formatOperationName(name)} executed`, operation.lastExecutionTime)
    }
  })
}, { deep: true })

watch(() => recoveryStatus.value.isRecovering, (isRecovering, wasRecovering) => {
  if (isRecovering && !wasRecovering) {
    addActivity('error', 'Error recovery started')
  } else if (!isRecovering && wasRecovering) {
    addActivity('recovery', 'Error recovery completed')
  }
})

// Lifecycle
onMounted(() => {
  addActivity('system', 'Performance dashboard initialized')
  addMemoryPoint()
  
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.performance-dashboard {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.dashboard-header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.1rem;
}

.dashboard-controls {
  display: flex;
  gap: var(--space-xs);
}

.control-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius-sm);
  background: white;
  color: var(--color-text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.control-btn.danger:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* Summary Cards */
.metrics-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
  padding: var(--space-md);
  border-bottom: 1px solid #e5e7eb;
}

.summary-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  padding: var(--space-md);
}

.summary-card.excellent {
  border-left: 4px solid #22c55e;
}

.summary-card.good {
  border-left: 4px solid #84cc16;
}

.summary-card.acceptable {
  border-left: 4px solid #f59e0b;
}

.summary-card.poor {
  border-left: 4px solid #f97316;
}

.summary-card.critical {
  border-left: 4px solid #ef4444;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.card-header h4 {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
}

.performance-indicator,
.cache-indicator,
.recovery-indicator {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.performance-indicator.excellent,
.cache-indicator.excellent {
  background: #dcfce7;
  color: #166534;
}

.performance-indicator.good,
.cache-indicator.good {
  background: #ecfdf5;
  color: #15803d;
}

.performance-indicator.acceptable,
.cache-indicator.acceptable {
  background: #fef3c7;
  color: #92400e;
}

.performance-indicator.poor,
.cache-indicator.poor {
  background: #fed7aa;
  color: #c2410c;
}

.performance-indicator.critical {
  background: #fecaca;
  color: #dc2626;
}

.recovery-indicator {
  background: #e5e7eb;
  color: #6b7280;
}

.recovery-indicator.active {
  background: #fef3c7;
  color: #92400e;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.metric-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.metric-label {
  color: var(--color-text-secondary);
}

.metric-value {
  font-weight: 600;
  color: var(--color-text);
}

/* Detailed Metrics */
.detailed-metrics {
  padding: var(--space-md);
}

.metrics-section {
  margin-bottom: var(--space-lg);
}

.metrics-section h4 {
  margin: 0 0 var(--space-md) 0;
  color: var(--color-text);
  font-size: 1rem;
}

/* Operations Table */
.operations-table {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 80px;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  align-items: center;
}

.table-header {
  background: #f3f4f6;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.table-row {
  border-top: 1px solid #e5e7eb;
  font-size: 0.9rem;
}

.table-row:hover {
  background: white;
}

.col-average.excellent,
.col-last.excellent {
  color: #22c55e;
}

.col-average.good,
.col-last.good {
  color: #84cc16;
}

.col-average.acceptable,
.col-last.acceptable {
  color: #f59e0b;
}

.col-average.poor,
.col-last.poor {
  color: #f97316;
}

.col-average.critical,
.col-last.critical {
  color: #ef4444;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 0 auto;
}

.status-indicator.excellent {
  background: #22c55e;
}

.status-indicator.good {
  background: #84cc16;
}

.status-indicator.acceptable {
  background: #f59e0b;
}

.status-indicator.poor {
  background: #f97316;
}

.status-indicator.critical {
  background: #ef4444;
}

/* Error Chart */
.error-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.error-bar {
  display: grid;
  grid-template-columns: 150px 1fr 60px;
  gap: var(--space-sm);
  align-items: center;
  font-size: 0.8rem;
}

.error-label {
  color: var(--color-text);
  font-weight: 500;
}

.error-progress {
  background: #e5e7eb;
  border-radius: var(--border-radius-sm);
  height: 20px;
  overflow: hidden;
}

.error-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #dc2626);
  transition: width 0.3s ease;
}

.error-count {
  text-align: right;
  font-weight: 600;
  color: var(--color-text);
}

/* Memory Chart */
.memory-chart {
  position: relative;
}

.trend-chart {
  width: 100%;
  height: 200px;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  background: white;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-xs);
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

/* Activity Log */
.activity-log {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  background: #f9fafb;
}

.activity-item {
  display: grid;
  grid-template-columns: 80px 100px 1fr 80px;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.8rem;
  align-items: center;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item.operation {
  background: rgba(66, 185, 131, 0.05);
}

.activity-item.error {
  background: rgba(239, 68, 68, 0.05);
}

.activity-item.recovery {
  background: rgba(34, 197, 94, 0.05);
}

.activity-item.system {
  background: rgba(59, 130, 246, 0.05);
}

.activity-time {
  color: var(--color-text-secondary);
  font-family: monospace;
}

.activity-type {
  font-weight: 600;
  text-transform: capitalize;
}

.activity-message {
  color: var(--color-text);
}

.activity-duration {
  text-align: right;
  font-family: monospace;
  color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: var(--space-sm);
    align-items: stretch;
  }
  
  .dashboard-controls {
    justify-content: stretch;
  }
  
  .control-btn {
    flex: 1;
    justify-content: center;
  }
  
  .metrics-summary {
    grid-template-columns: 1fr;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: var(--space-xs);
  }
  
  .activity-item {
    grid-template-columns: 1fr;
    gap: var(--space-xs);
  }
}
</style>
