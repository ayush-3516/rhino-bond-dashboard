<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useEventPerformance } from '@/composables/useEventPerformance'

const { metrics, getCacheStats, clearCache } = useEventPerformance()

const cacheStats = computed(() => getCacheStats())

const performanceStatus = computed(() => {
  const renderTime = metrics.value.renderTime
  if (renderTime < 16) return { level: 'excellent', color: 'var(--color-success)' }
  if (renderTime < 50) return { level: 'good', color: 'var(--color-warning)' }
  return { level: 'poor', color: 'var(--color-danger)' }
})

// Monitor memory usage
const memoryUsage = computed(() => {
  if (performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1024 / 1024
    const total = performance.memory.totalJSHeapSize / 1024 / 1024
    return {
      used: Math.round(used * 100) / 100,
      total: Math.round(total * 100) / 100,
      percentage: Math.round((used / total) * 100)
    }
  }
  return null
})

let updateInterval = null

onMounted(() => {
  updateInterval = setInterval(() => {
    // Trigger reactivity updates
  }, 1000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<template>
  <div class="performance-monitor">
    <div class="performance-header">
      <h4>Performance Monitor</h4>
      <button class="btn-clear" @click="clearCache">Clear Cache</button>
    </div>
    
    <div class="metrics-grid">
      <!-- Render Performance -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Render Time</span>
          <div 
            class="status-indicator" 
            :style="{ backgroundColor: performanceStatus.color }"
          ></div>
        </div>
        <div class="metric-value">{{ Math.round(metrics.renderTime * 100) / 100 }}ms</div>
        <div class="metric-description">{{ performanceStatus.level }} performance</div>
      </div>
      
      <!-- Cache Performance -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Cache Hit Rate</span>
        </div>
        <div class="metric-value">{{ Math.round(cacheStats.hitRate) }}%</div>
        <div class="metric-description">
          {{ cacheStats.hits }} hits, {{ cacheStats.misses }} misses
        </div>
      </div>
      
      <!-- Filter Performance -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Filter Time</span>
        </div>
        <div class="metric-value">{{ Math.round(metrics.filterTime * 100) / 100 }}ms</div>
        <div class="metric-description">Event filtering performance</div>
      </div>
      
      <!-- Memory Usage (if available) -->
      <div v-if="memoryUsage" class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Memory Usage</span>
        </div>
        <div class="metric-value">{{ memoryUsage.used }}MB</div>
        <div class="metric-description">{{ memoryUsage.percentage }}% of {{ memoryUsage.total }}MB</div>
      </div>
      
      <!-- Cache Size -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Cache Size</span>
        </div>
        <div class="metric-value">{{ cacheStats.size }}</div>
        <div class="metric-description">Cached items</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.performance-monitor {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.performance-header h4 {
  margin: 0;
  color: var(--color-text);
  font-weight: 600;
}

.btn-clear {
  padding: var(--space-xs) var(--space-sm);
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  background: #ef4444;
  color: white;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}

.metric-card {
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: var(--border-radius);
  padding: var(--space-md);
  text-align: center;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.metric-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.metric-description {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .performance-header {
    flex-direction: column;
    gap: var(--space-sm);
    align-items: stretch;
  }
}
</style>
