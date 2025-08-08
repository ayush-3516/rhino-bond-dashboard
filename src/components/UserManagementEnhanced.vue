<template>
  <div class="user-management-optimized">
    <!-- Performance Metrics (Development Only) -->
    <div v-if="isDevelopment" class="performance-panel">
      <h3>Performance Metrics</h3>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">Fetch Users:</span>
          <span class="metric-value">{{ performanceMetrics.performance.fetchUsers.averageTime.toFixed(2) }}ms avg</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Cache Hit Rate:</span>
          <span class="metric-value">{{ cacheStats.hitRate }}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Total Users:</span>
          <span class="metric-value">{{ totalUsers }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Rendered Users:</span>
          <span class="metric-value">{{ displayedUsers.length }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Error Recovery:</span>
          <span class="metric-value" :class="{ 'text-warning': recoveryStatus.isRecovering }">
            {{ recoveryStatus.isRecovering ? 'Recovering...' : 'OK' }}
          </span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Memory Usage:</span>
          <span class="metric-value">{{ cacheStats.memoryUsage }}KB</span>
        </div>
      </div>
      
      <!-- Benchmark Controls -->
      <div v-if="props.enableBenchmarking" class="benchmark-controls">
        <button @click="runBenchmarks" :disabled="isRunningBenchmarks" class="benchmark-btn">
          {{ isRunningBenchmarks ? 'Running...' : 'Run Performance Tests' }}
        </button>
        <div v-if="benchmarkResults" class="benchmark-results">
          <span>Last test: {{ benchmarkResults.summary?.averageTime.toFixed(2) }}ms avg</span>
        </div>
      </div>
    </div>

    <!-- Search and Filter Controls -->
    <div class="controls-section">
      <div class="search-container">
        <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          v-model="searchTerm" 
          type="text"
          placeholder="Search users by name, email, phone or ID..." 
          class="search-input"
          @input="debouncedSearch"
        />
        <button 
          v-if="searchTerm" 
          @click="clearSearch" 
          class="clear-search-btn"
          title="Clear search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="filter-controls">
        <select v-model="roleFilter" class="filter-select" @change="filterUsers">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>

        <select v-model="verificationFilter" class="filter-select" @change="filterUsers">
          <option value="">All Status</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>

        <select v-model="sortBy" class="filter-select" @change="sortUsers">
          <option value="created_at">Date Added</option>
          <option value="name">Name</option>
          <option value="points_balance">Points Balance</option>
        </select>

        <!-- Virtual Scrolling Toggle -->
        <button 
          @click="toggleVirtualScrolling" 
          class="toggle-btn"
          :class="{ active: useVirtualScrolling }"
          title="Toggle virtual scrolling for large lists"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
          Virtual
        </button>
      </div>
    </div>

    <!-- Users Statistics -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Users</span>
          <span class="stat-value">{{ totalUsers }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon agent-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Agents</span>
          <span class="stat-value">{{ agentCount }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon verified-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Verified</span>
          <span class="stat-value">{{ verifiedCount }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>Loading users...</span>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="empty-icon">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <h3>No users found</h3>
      <p>Try changing your search criteria or filters</p>
    </div>
    
    <!-- Virtual Scrolling List (for large datasets) -->
    <VirtualScrollList
      v-else-if="useVirtualScrolling && filteredUsers.length > virtualScrollThreshold"
      :items="filteredUsers"
      :item-height="120"
      :container-height="600"
      :has-more="hasMoreUsers"
      :is-loading="isLoadingMore"
      @load-more="loadMoreUsers"
      class="virtual-users-list"
    >
      <template #default="{ item: user }">
        <UserCard 
          :user="user"
          @update-user="handleUserUpdate"
          @delete-user="handleUserDelete"
          class="virtual-user-card"
        />
      </template>
    </VirtualScrollList>
    
    <!-- Standard Grid (for smaller datasets or when virtual scrolling is disabled) -->
    <div v-else class="users-grid">
      <UserCard 
        v-for="user in displayedUsers" 
        :key="user.id"
        :user="user"
        @update-user="handleUserUpdate"
        @delete-user="handleUserDelete"
      />
    </div>

    <!-- Pagination (only shown when not using virtual scrolling) -->
    <div v-if="!useVirtualScrolling && totalPages > 1" class="pagination">
      <button 
        @click="goToPage(0)" 
        class="pagination-button" 
        :disabled="currentPage === 0"
        title="First page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="11 17 6 12 11 7"></polyline>
          <polyline points="18 17 13 12 18 7"></polyline>
        </svg>
      </button>
      
      <button 
        @click="goToPage(currentPage - 1)" 
        class="pagination-button" 
        :disabled="currentPage === 0"
        title="Previous page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      <span class="pagination-info">
        Page {{ currentPage + 1 }} of {{ totalPages }} ({{ filteredUsers.length }} users)
      </span>
      
      <button 
        @click="goToPage(currentPage + 1)" 
        class="pagination-button" 
        :disabled="currentPage === totalPages - 1"
        title="Next page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      
      <button 
        @click="goToPage(totalPages - 1)" 
        class="pagination-button" 
        :disabled="currentPage === totalPages - 1"
        title="Last page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="13 17 18 12 13 7"></polyline>
          <polyline points="6 17 11 12 6 7"></polyline>
        </svg>
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :visible="showDeleteModal"
      title="Confirm Delete"
      message="Are you sure you want to delete this user? This action cannot be undone and all associated data will be permanently deleted."
      confirm-text="Delete User"
      cancel-text="Cancel"
      @confirm="deleteUser"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { debounce } from 'lodash-es'
import { supabase, withServiceRole } from '@/supabase'
import { useUserPerformance } from '@/composables/useUserPerformance'
import { useAdvancedCache } from '@/composables/useAdvancedCache'
import { useErrorRecovery } from '@/composables/useErrorRecovery'
import { useNotifications } from '@/composables/useNotifications'
import { createUserManagementBenchmarks } from '@/utils/performanceBenchmark'
import UserCard from './UserCard.vue'
import VirtualScrollList from './VirtualScrollList.vue'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps({
  pageSize: {
    type: Number,
    default: 20
  },
  useVirtualScrolling: {
    type: Boolean,
    default: false
  },
  enableBenchmarking: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update'])

// Advanced performance and error handling
const { measurePerformance, metrics: performanceMetrics } = useUserPerformance()
const { 
  get: getCached, 
  set: setCache, 
  invalidateByTag, 
  stats: cacheStats,
  memoize 
} = useAdvancedCache()
const { withRetry, withBulkRetry, getRecoveryStatus } = useErrorRecovery()
const { showToast } = useNotifications()

// State
const users = ref([])
const loading = ref(false)
const searchTerm = ref('')
const roleFilter = ref('')
const verificationFilter = ref('')
const sortBy = ref('created_at')
const currentPage = ref(0)
const showDeleteModal = ref(false)
const userToDelete = ref(null)
const isLoadingMore = ref(false)
const hasMoreUsers = ref(true)
const benchmarkResults = ref(null)
const isRunningBenchmarks = ref(false)
const useVirtualScrolling = ref(props.useVirtualScrolling)
const virtualScrollThreshold = ref(100) // Switch to virtual scrolling for >100 users
const serverSidePageSize = ref(50) // For server-side pagination

// Development mode detection
const isDevelopment = ref(
  import.meta.env.DEV || 
  localStorage.getItem('user-show-metrics') === 'true'
)

// Recovery status monitoring
const recoveryStatus = computed(() => getRecoveryStatus())

// Enhanced computed properties with performance optimization
const filteredUsers = computed(() => {
  return measurePerformance('filterUsers', () => {
    let result = [...users.value]
    
    // Apply search filter
    if (searchTerm.value.trim()) {
      const term = searchTerm.value.toLowerCase()
      result = result.filter(user => 
        user.name?.toLowerCase().includes(term) || 
        user.email?.toLowerCase().includes(term) || 
        user.phone?.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term)
      )
    }
    
    // Apply role filter
    if (roleFilter.value) {
      result = result.filter(user => user.role === roleFilter.value)
    }
    
    // Apply verification filter
    if (verificationFilter.value === 'verified') {
      result = result.filter(user => user.admin_confirmation)
    } else if (verificationFilter.value === 'unverified') {
      result = result.filter(user => !user.admin_confirmation)
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy.value === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      } else if (sortBy.value === 'points_balance') {
        return (b.points_balance || 0) - (a.points_balance || 0)
      }
      // Default sort by created_at (newest first)
      return new Date(b.created_at) - new Date(a.created_at)
    })
    
    return result
  })()
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / props.pageSize)
})

const displayedUsers = computed(() => {
  if (useVirtualScrolling.value && filteredUsers.value.length > virtualScrollThreshold.value) {
    return filteredUsers.value // Virtual scroll handles pagination
  }
  
  const start = currentPage.value * props.pageSize
  const end = start + props.pageSize
  return filteredUsers.value.slice(start, end)
})

const totalUsers = computed(() => users.value.length)
const agentCount = computed(() => users.value.filter(user => user.role === 'agent').length)
const verifiedCount = computed(() => users.value.filter(user => user.admin_confirmation).length)

// Memoized fetch function with advanced caching
const fetchUsersWithCache = memoize(
  async (useCache = true, page = 0, pageSize = serverSidePageSize.value) => {
    return await withRetry(async () => {
      const { data, error } = await withServiceRole(async (client) => {
        let query = client
          .from('users')
          .select('*, points_balance')
          .order('created_at', { ascending: false })
        
        // Add pagination for server-side if needed
        if (page > 0 || pageSize < 1000) {
          query = query.range(page * pageSize, (page + 1) * pageSize - 1)
        }
        
        return query
      })

      if (error) throw error
      return data || []
    }, {
      operationId: 'fetch_users',
      maxRetries: 3
    })
  },
  {
    keyGenerator: (useCache, page, pageSize) => `users_${page}_${pageSize}`,
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['users', 'user_list']
  }
)

// Enhanced methods with error recovery
const fetchUsers = measurePerformance('fetchUsers', async (useCache = true, page = 0) => {
  const cacheKey = `users_list_${page}`
  
  // Check cache first
  if (useCache) {
    const cachedUsers = getCached(cacheKey)
    if (cachedUsers) {
      if (page === 0) {
        users.value = cachedUsers
      } else {
        users.value = [...users.value, ...cachedUsers]
      }
      return
    }
  }
  
  loading.value = true
  try {
    const data = await fetchUsersWithCache(useCache, page)
    
    if (page === 0) {
      users.value = data
    } else {
      users.value = [...users.value, ...data]
    }
    
    // Update cache
    setCache(cacheKey, data, {
      ttl: 5 * 60 * 1000, // 5 minutes
      tags: ['users', 'user_list']
    })
    
    // Check if there are more users to load
    hasMoreUsers.value = data.length === serverSidePageSize.value
    
  } catch (error) {
    console.error('Error fetching users:', error)
    showToast('Failed to fetch users. Retrying...', 'error')
  } finally {
    loading.value = false
    isLoadingMore.value = false
    emit('update')
  }
})

// Optimized search with debouncing
const debouncedSearch = debounce(() => {
  currentPage.value = 0 // Reset to first page when searching
}, 300)

const filterUsers = measurePerformance('filterUsers', () => {
  currentPage.value = 0 // Reset to first page when filtering
})

const sortUsers = () => {
  currentPage.value = 0 // Reset to first page when sorting
}

const clearSearch = () => {
  searchTerm.value = ''
  currentPage.value = 0
}

const goToPage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
  }
}

// Virtual scrolling controls
const toggleVirtualScrolling = () => {
  useVirtualScrolling.value = !useVirtualScrolling.value
  localStorage.setItem('user-virtual-scrolling', useVirtualScrolling.value.toString())
}

const loadMoreUsers = async () => {
  if (isLoadingMore.value || !hasMoreUsers.value) return
  
  isLoadingMore.value = true
  const nextPage = Math.floor(users.value.length / serverSidePageSize.value)
  await fetchUsers(true, nextPage)
}

// Enhanced user update with optimistic updates and rollback
const handleUserUpdate = measurePerformance('updateUser', async (updatedUser) => {
  try {
    // Optimistic update
    const index = users.value.findIndex(u => u.id === updatedUser.id)
    const originalUser = index >= 0 ? { ...users.value[index] } : null
    
    if (index >= 0) {
      users.value[index] = { ...users.value[index], ...updatedUser }
    }
    
    // Invalidate related cache entries
    invalidateByTag('users')
    
    // Update cache
    setCache(`users_list_0`, users.value, {
      tags: ['users', 'user_list']
    })
    
    showToast('User updated successfully', 'success')
    
  } catch (error) {
    console.error('Error updating user:', error)
    
    // Rollback optimistic update
    if (originalUser && index >= 0) {
      users.value[index] = originalUser
    }
    
    showToast('Failed to update user', 'error')
    // Refresh users list on error
    await fetchUsers(false)
  }
})

const handleUserDelete = (user) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

// Enhanced delete with bulk operations and recovery
const deleteUser = measurePerformance('deleteUser', async () => {
  const user = userToDelete.value
  showDeleteModal.value = false
  
  if (!user) return
  
  try {
    loading.value = true
    
    // Optimistic update - remove from UI immediately
    const originalUsers = [...users.value]
    users.value = users.value.filter(u => u.id !== user.id)
    
    // Bulk delete operations with error recovery
    const deleteOperations = [
      () => withServiceRole(async (client) => {
        return client.from('points_transactions').delete().eq('user_id', user.id)
      }),
      () => withServiceRole(async (client) => {
        return client.from('contact_messages').update({ user_id: null }).eq('user_id', user.id)
      })
    ]
    
    // If user has agent code, deactivate it
    if (user.agent_code) {
      deleteOperations.push(() => withServiceRole(async (client) => {
        return client.from('agent_codes').update({ is_active: false }).eq('code', user.agent_code)
      }))
    }
    
    // Execute bulk operations
    const bulkResult = await withBulkRetry(deleteOperations, {
      concurrency: 2,
      failFast: false
    })
    
    // Finally, delete user
    const { error: userError } = await withRetry(() => 
      withServiceRole(async (client) => {
        return client.from('users').delete().eq('id', user.id)
      }), 
      { operationId: 'delete_user' }
    )

    if (userError) {
      // Rollback optimistic update on error
      users.value = originalUsers
      throw userError
    }

    showToast('User deleted successfully', 'success')
    
    // Invalidate cache
    invalidateByTag('users')
    
    // Adjust pagination if needed
    if (displayedUsers.value.length === 0 && currentPage.value > 0) {
      currentPage.value = Math.max(0, currentPage.value - 1)
    }
    
  } catch (error) {
    console.error('Error deleting user:', error)
    showToast('Failed to delete user', 'error')
    // Refresh users list on error
    await fetchUsers(false)
  } finally {
    loading.value = false
    userToDelete.value = null
  }
})

// Performance benchmarking
const runBenchmarks = async () => {
  if (!props.enableBenchmarking) return
  
  isRunningBenchmarks.value = true
  
  try {
    const benchmarkSuite = createUserManagementBenchmarks()
    const results = await benchmarkSuite.run({
      sampleSize: 5,
      warmupIterations: 2
    })
    
    benchmarkResults.value = results
    showToast(`Benchmarks completed. Average: ${results.summary?.averageTime.toFixed(2)}ms`, 'success')
    
  } catch (error) {
    console.error('Benchmark failed:', error)
    showToast('Benchmark failed', 'error')
  } finally {
    isRunningBenchmarks.value = false
  }
}

// Initialize
onMounted(async () => {
  // Restore virtual scrolling preference
  const savedVirtualScrolling = localStorage.getItem('user-virtual-scrolling')
  if (savedVirtualScrolling !== null) {
    useVirtualScrolling.value = savedVirtualScrolling === 'true'
  }
  
  await fetchUsers()
})

// Watch for changes that require cache invalidation
watch([roleFilter, verificationFilter, sortBy], () => {
  // Don't invalidate cache for client-side filtering/sorting
  // Just trigger reactivity
  nextTick(() => {
    // Force computed property recalculation
    filteredUsers.value
  })
})
</script>

<style scoped>
.user-management-optimized {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

/* Performance Panel */
.performance-panel {
  background: rgba(66, 185, 131, 0.1);
  border: 1px solid rgba(66, 185, 131, 0.2);
  border-radius: var(--border-radius);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.performance-panel h3 {
  margin: 0 0 var(--space-sm) 0;
  color: var(--color-primary);
  font-size: 0.9rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.metric-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.metric-label {
  color: var(--color-text-secondary);
}

.metric-value {
  font-weight: 600;
  color: var(--color-primary);
}

.metric-value.text-warning {
  color: #f59e0b;
}

.benchmark-controls {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(66, 185, 131, 0.2);
}

.benchmark-btn {
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.benchmark-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.benchmark-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.benchmark-results {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

/* Controls Section */
.controls-section {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 44px;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  font-size: 0.95rem;
  background-color: #f9fafb;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: white;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background-color: #f3f4f6;
  color: #6b7280;
}

.filter-controls {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  background-color: white;
  font-size: 0.9rem;
  min-width: 120px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  background-color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  border-color: var(--color-primary);
}

.toggle-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Virtual Scroll Specific */
.virtual-users-list {
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  background: white;
}

.virtual-user-card {
  border-bottom: 1px solid #f3f4f6;
  margin: 0;
  border-radius: 0;
}

.virtual-user-card:last-child {
  border-bottom: none;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.stat-card {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  padding: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(66, 185, 131, 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.agent-icon {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.stat-icon.verified-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Loading Container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  gap: var(--space-md);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #ddd;
  margin-bottom: var(--space-md);
}

.empty-state h3 {
  margin: 0;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* Users Grid */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg) 0;
}

.pagination-button {
  padding: var(--space-sm);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius);
  background: white;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
}

.pagination-button:hover:not(:disabled) {
  background: #f8faff;
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  padding: 0 var(--space-md);
  white-space: nowrap;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .controls-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    min-width: unset;
  }
  
  .filter-controls {
    justify-content: stretch;
  }
  
  .filter-select,
  .toggle-btn {
    flex: 1;
    min-width: unset;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
  }
  
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .virtual-users-list {
    height: 500px; /* Smaller on mobile */
  }
  
  .pagination-info {
    font-size: 0.8rem;
    padding: 0 var(--space-sm);
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
