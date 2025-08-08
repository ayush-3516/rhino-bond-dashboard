<template>
  <div class="user-management-optimized">
    <!-- Performance Metrics (Development Only) -->
    <div v-if="isDevelopment" class="performance-panel">
      <h3>Performance Metrics</h3>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">Fetch Users:</span>
          <span class="metric-value">{{ metrics.performance.fetchUsers.averageTime.toFixed(2) }}ms avg</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Cache Hit Rate:</span>
          <span class="metric-value">{{ metrics.cache.hitRate }}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Total Users:</span>
          <span class="metric-value">{{ totalUsers }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Rendered Users:</span>
          <span class="metric-value">{{ paginatedUsers.length }}</span>
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
    
    <!-- Users Grid -->
    <div v-else class="users-grid">
      <UserCard 
        v-for="user in paginatedUsers" 
        :key="user.id"
        :user="user"
        @update-user="handleUserUpdate"
        @delete-user="handleUserDelete"
      />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
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
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { debounce } from 'lodash-es'
import { supabase, withServiceRole } from '@/supabase'
import { useUserPerformance } from '@/composables/useUserPerformance'
import { useNotifications } from '@/composables/useNotifications'
import ConfirmModal from '@/components/ConfirmModal.vue'

// Lazy load UserCard component
const UserCard = defineAsyncComponent(() => import('@/components/UserCard.vue'))

const props = defineProps({
  pageSize: {
    type: Number,
    default: 20
  }
})

const emit = defineEmits(['update'])

// Performance monitoring
const { 
  measurePerformance, 
  getCachedData, 
  setCacheItem, 
  metrics 
} = useUserPerformance()

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

// Development mode check
const isDevelopment = import.meta.env.DEV || 
  localStorage.getItem('user-show-metrics') === 'true'

// Computed properties
const filteredUsers = computed(() => {
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
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / props.pageSize)
})

const paginatedUsers = computed(() => {
  const start = currentPage.value * props.pageSize
  const end = start + props.pageSize
  return filteredUsers.value.slice(start, end)
})

const totalUsers = computed(() => users.value.length)
const agentCount = computed(() => users.value.filter(user => user.role === 'agent').length)
const verifiedCount = computed(() => users.value.filter(user => user.admin_confirmation).length)

// Methods
const fetchUsers = measurePerformance('fetchUsers', async (useCache = true) => {
  const cacheKey = 'users_list'
  
  // Check cache first
  if (useCache) {
    const cachedUsers = getCachedData(cacheKey)
    if (cachedUsers) {
      users.value = cachedUsers
      return
    }
  }
  
  loading.value = true
  try {
    const { data, error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .select('*, points_balance')
        .order('created_at', { ascending: false })
    })

    if (error) throw error
    
    users.value = data || []
    setCacheItem(cacheKey, data || [])
    
  } catch (error) {
    console.error('Error fetching users:', error)
    showToast('Failed to fetch users', 'error')
  } finally {
    loading.value = false
    emit('update')
  }
})

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

const handleUserUpdate = measurePerformance('updateUser', async (updatedUser) => {
  try {
    // Optimistic update
    const index = users.value.findIndex(u => u.id === updatedUser.id)
    if (index >= 0) {
      users.value[index] = { ...users.value[index], ...updatedUser }
    }
    
    // Clear cache to force refresh on next fetch
    setCacheItem('users_list', users.value)
    
  } catch (error) {
    console.error('Error updating user:', error)
    // Refresh users list on error
    await fetchUsers(false)
  }
})

const handleUserDelete = (user) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const deleteUser = measurePerformance('deleteUser', async () => {
  const user = userToDelete.value
  showDeleteModal.value = false
  
  if (!user) return
  
  try {
    loading.value = true
    
    // Optimistic update - remove from UI immediately
    const originalUsers = [...users.value]
    users.value = users.value.filter(u => u.id !== user.id)
    
    // Delete related data first
    const { error: pointsError } = await withServiceRole(async (client) => {
      return client
        .from('points_transactions')
        .delete()
        .eq('user_id', user.id)
    })

    if (pointsError) throw pointsError
    
    // Deactivate agent code if exists
    if (user.agent_code) {
      const { error: codeError } = await withServiceRole(async (client) => {
        return client
          .from('agent_codes')
          .update({ is_active: false })
          .eq('code', user.agent_code)
      })
      
      if (codeError) {
        console.error('Error deactivating agent code:', codeError)
      }
    }
    
    // Update contact messages
    const { error: contactError } = await withServiceRole(async (client) => {
      return client
        .from('contact_messages')
        .update({ user_id: null })
        .eq('user_id', user.id)
    })
    
    if (contactError) {
      console.error('Error updating contact messages:', contactError)
    }

    // Finally, delete user
    const { error: userError } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .delete()
        .eq('id', user.id)
    })

    if (userError) {
      // Rollback optimistic update on error
      users.value = originalUsers
      throw userError
    }

    showToast('User deleted successfully', 'success')
    
    // Update cache
    setCacheItem('users_list', users.value)
    
    // Adjust pagination if needed
    if (paginatedUsers.value.length === 0 && currentPage.value > 0) {
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

// Initialize
onMounted(async () => {
  await fetchUsers()
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
  
  .filter-select {
    flex: 1;
    min-width: unset;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
  }
  
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination-info {
    font-size: 0.8rem;
    padding: 0 var(--space-sm);
  }
}
</style>
