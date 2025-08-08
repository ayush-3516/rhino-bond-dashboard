<template>
  <div v-if="showMetrics" class="performance-metrics">
    <div class="metrics-header">
      <h3>Performance Metrics</h3>
      <button @click="toggleMetrics" class="toggle-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Cache Hit Rate</div>
        <div class="metric-value" :class="getCacheRateClass(metrics.cacheHitRate)">
          {{ metrics.cacheHitRate.toFixed(1) }}%
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Last Fetch Time</div>
        <div class="metric-value">{{ metrics.fetchTime.toFixed(0) }}ms</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Cache Size</div>
        <div class="metric-value">{{ cacheStats.size }}/{{ cacheStats.maxSize }}</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Total Requests</div>
        <div class="metric-value">{{ metrics.totalRequests }}</div>
      </div>
    </div>
    
    <div class="metrics-actions">
      <button @click="clearCache" class="clear-cache-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18l-2 13H5L3 6z"></path>
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Clear Cache
      </button>
      
      <button @click="exportMetrics" class="export-metrics-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export
      </button>
    </div>
  </div>
  
  <!-- Floating toggle button when metrics are hidden -->
  <button 
    v-else 
    @click="toggleMetrics" 
    class="metrics-toggle-fab"
    title="Show Performance Metrics"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  metrics: {
    type: Object,
    required: true
  },
  cacheStats: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['clear-cache'])

const showMetrics = ref(false)

const toggleMetrics = () => {
  showMetrics.value = !showMetrics.value
}

const getCacheRateClass = (rate) => {
  if (rate >= 80) return 'excellent'
  if (rate >= 60) return 'good'
  if (rate >= 40) return 'fair'
  return 'poor'
}

const clearCache = () => {
  emit('clear-cache')
}

const exportMetrics = () => {
  const data = {
    timestamp: new Date().toISOString(),
    metrics: props.metrics,
    cacheStats: props.cacheStats,
    userAgent: navigator.userAgent,
    url: window.location.href
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-metrics-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.performance-metrics {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 1rem;
  min-width: 280px;
  z-index: 1000;
  border: 1px solid #e2e8f0;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.metrics-header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metric-card {
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.metric-value.excellent {
  color: #059669;
}

.metric-value.good {
  color: #0d9488;
}

.metric-value.fair {
  color: #d97706;
}

.metric-value.poor {
  color: #dc2626;
}

.metrics-actions {
  display: flex;
  gap: 0.5rem;
}

.clear-cache-btn,
.export-metrics-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.8rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-cache-btn:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.export-metrics-btn:hover {
  background: #f0f9ff;
  border-color: #bae6fd;
  color: #0369a1;
}

.metrics-toggle-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metrics-toggle-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .performance-metrics {
    position: fixed;
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .metrics-toggle-fab {
    bottom: 80px;
    right: 16px;
  }
}
</style>
