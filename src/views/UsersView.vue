<template>
  <div class="users-view">
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-title">
          <h1 class="page-title">User Management</h1>
          <p class="page-description">Manage user accounts, roles, and permissions</p>
        </div>
        
        <div class="header-actions">
          <div class="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              v-model="searchTerm" 
              placeholder="Search users by name, email, phone or ID..." 
              class="search-input"
              @input="filterUsers"
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

          <!-- Performance Controls -->
          <div class="performance-controls">
            <button 
              @click="toggleOptimizedView" 
              :class="{ active: useOptimizedComponent }"
              class="toggle-btn"
              title="Toggle optimized component"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              {{ useOptimizedComponent ? 'Enhanced' : 'Standard' }}
            </button>

            <button 
              @click="togglePerformanceDashboard" 
              :class="{ active: showPerformanceDashboard }"
              class="toggle-btn"
              title="Toggle performance dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M9 9h6v6H9z"></path>
              </svg>
              Metrics
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stats-card">
          <div class="stats-icon users-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="stats-info">
            <span class="stats-label">Total Users</span>
            <span class="stats-value">{{ totalUsers }}</span>
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-icon agents-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
              <path d="M12 11v4"></path>
              <path d="M9 17h6"></path>
            </svg>
          </div>
          <div class="stats-info">
            <span class="stats-label">Agents</span>
            <span class="stats-value">{{ agentUsers }}</span>
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-icon verified-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="stats-info">
            <span class="stats-label">Verified Users</span>
            <span class="stats-value">{{ verifiedUsers }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-panel">
      <div class="filters-container">
        <div class="filter-group">
          <label class="filter-label">Role</label>
          <select v-model="filters.role" class="filter-input" @change="filterUsers">
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Verification</label>
          <select v-model="filters.verification" class="filter-input" @change="filterUsers">
            <option value="">All</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Sort By</label>
          <select v-model="sortBy" class="filter-input" @change="filterUsers">
            <option value="created_at">Date Added</option>
            <option value="name">Name</option>
            <option value="points_balance">Points Balance</option>
          </select>
        </div>

        <div class="filter-actions">
          <button @click="resetFilters" class="btn btn-secondary">Reset</button>
        </div>
      </div>
    </div>

    <div class="users-container">
      <!-- Performance Dashboard -->
      <PerformanceDashboard 
        v-if="showPerformanceDashboard"
        :refresh-interval="5000"
        class="performance-dashboard-section"
      />

      <!-- Toggle between optimized and standard user management -->
      <div class="optimization-toggle">
        <button 
          class="btn btn-secondary btn-sm" 
          @click="toggleOptimizedView"
          title="Toggle Optimized View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 3l4 4-4 4"></path>
            <path d="M21 7H9"></path>
            <path d="M8 17l-4-4 4-4"></path>
            <path d="M3 13h12"></path>
          </svg>
          {{ useOptimizedComponent ? 'Standard View' : 'Optimized View' }}
        </button>
        <span 
          v-if="useOptimizedComponent" 
          class="optimization-badge"
          title="Using optimized user management component"
        >
          ⚡ {{ componentToUse === 'UserManagementEnhanced' ? 'Enhanced' : 'Optimized' }}
        </span>
      </div>

      <!-- Enhanced User Management Component (for large datasets) -->
      <UserManagementEnhanced 
        v-if="componentToUse === 'UserManagementEnhanced'"
        key="enhanced"
        :page-size="20"
        :use-virtual-scrolling="totalUsers > 1000"
        :enable-benchmarking="true"
        @update="handleUserUpdate"
      />

      <!-- Optimized User Management Component -->
      <UserManagementOptimized 
        v-else-if="componentToUse === 'UserManagementOptimized'"
        key="optimized"
        :page-size="20"
        @update="handleUserUpdate"
      />
      
      <!-- Standard User Management Component -->
      <UserManagement 
        v-else
        key="standard"
        ref="userManagementComponent"
        :filtered-users="filteredUsers"
        :is-loading="loading"
        @update="handleUserUpdate"
      />
      
      <!-- Debug info -->
      <div v-if="true" style="margin-top: 20px; padding: 10px; background: #f0f0f0; font-family: monospace; font-size: 12px;">
        <strong>Debug Info:</strong><br>
        Component to use: {{ componentToUse }}<br>
        Use optimized: {{ useOptimizedComponent }}<br>
        Total users: {{ totalUsers }}<br>
        Filtered users: {{ filteredUsers.length }}<br>
        Loading: {{ loading }}<br>
        Users array: {{ users.length }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { supabase, withServiceRole } from '@/supabase'
import UserManagement from '@/components/UserManagement.vue'
import UserManagementOptimized from '@/components/UserManagementOptimized.vue'

// Lazy load less critical components
const UserManagementEnhanced = defineAsyncComponent(() => 
  import('@/components/UserManagementEnhanced.vue')
)
const PerformanceDashboard = defineAsyncComponent(() => 
  import('@/components/PerformanceDashboard.vue')
)

// State
const loading = ref(false)
const users = ref([])
const filteredUsers = ref([])
const searchTerm = ref('')
const useOptimizedComponent = ref(false) // Default to standard view
const showPerformanceDashboard = ref(false)

// Filters
const filters = ref({
  role: '',
  verification: ''
})
const sortBy = ref('created_at')

// Stats
const totalUsers = computed(() => users.value.length)
const agentUsers = computed(() => users.value.filter(user => user.role === 'agent').length)
const verifiedUsers = computed(() => users.value.filter(user => user.admin_confirmation).length)

// User management component reference
const userManagementComponent = ref(null)

// Component selection based on performance needs
const componentToUse = computed(() => {
  if (totalUsers.value > 1000 || localStorage.getItem('force-enhanced-mode') === 'true') {
    return 'UserManagementEnhanced'
  }
  return useOptimizedComponent.value ? 'UserManagementOptimized' : 'UserManagement'
})

// Fetch users
async function fetchUsers() {
  loading.value = true
  try {
    const { data, error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .select('*, points_balance')
        .order('created_at', { ascending: false })
    })

    if (error) throw error
    users.value = data || [] // Ensure it's always an array
    console.log('Fetched users:', users.value.length, 'users')
    filterUsers()
  } catch (error) {
    console.error('Error fetching users:', error)
    users.value = [] // Reset to empty array on error
    filteredUsers.value = []
  } finally {
    loading.value = false
  }
}

// Filter users based on search and filters
function filterUsers() {
  let result = [...users.value]
  console.log('Filtering users:', users.value.length, 'total users')
  
  // Apply search filter
  if (searchTerm.value.trim() !== '') {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(user => 
      user.name?.toLowerCase().includes(term) || 
      user.email?.toLowerCase().includes(term) || 
      user.phone?.toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term)
    )
    console.log('After search filter:', result.length, 'users')
  }
  
  // Apply role filter
  if (filters.value.role) {
    result = result.filter(user => user.role === filters.value.role)
    console.log('After role filter:', result.length, 'users')
  }
  
  // Apply verification filter
  if (filters.value.verification === 'verified') {
    result = result.filter(user => user.admin_confirmation)
    console.log('After verification filter (verified):', result.length, 'users')
  } else if (filters.value.verification === 'unverified') {
    result = result.filter(user => !user.admin_confirmation)
    console.log('After verification filter (unverified):', result.length, 'users')
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
  
  filteredUsers.value = result
  console.log('Final filtered users:', filteredUsers.value.length, 'users')
}

// Reset all filters
function resetFilters() {
  searchTerm.value = ''
  filters.value = {
    role: '',
    verification: ''
  }
  sortBy.value = 'created_at'
  filterUsers()
}

// Clear search
function clearSearch() {
  searchTerm.value = ''
  filterUsers()
}

// Handle user update events from the UserManagement component
function handleUserUpdate() {
  if (componentToUse.value === 'UserManagement') {
    fetchUsers()
  }
  // Optimized and Enhanced components handle their own updates
}

// Toggle between optimized and standard view
function toggleOptimizedView() {
  useOptimizedComponent.value = !useOptimizedComponent.value
  console.log('Toggled optimized view to:', useOptimizedComponent.value)
  console.log('Component to use:', componentToUse.value)
  console.log('Available users:', users.value.length)
  console.log('Filtered users:', filteredUsers.value.length)
  
  // Save preference
  localStorage.setItem('user-management-optimized', useOptimizedComponent.value.toString())
  
  // If switching to standard view, ensure users data is available
  if (!useOptimizedComponent.value) {
    if (users.value.length === 0) {
      console.log('No users data, fetching...')
      fetchUsers()
    } else {
      // Ensure filtered users are up to date
      console.log('Users data exists, re-filtering...')
      filterUsers()
    }
  }
}

// Toggle performance dashboard
function togglePerformanceDashboard() {
  showPerformanceDashboard.value = !showPerformanceDashboard.value
  
  // Save preference
  localStorage.setItem('show-performance-dashboard', showPerformanceDashboard.value.toString())
}

// Initialize
onMounted(async () => {
  console.log('=== UsersView mounted ===')
  
  // Load user preferences
  const savedOptimizedPreference = localStorage.getItem('user-management-optimized')
  if (savedOptimizedPreference !== null) {
    useOptimizedComponent.value = savedOptimizedPreference === 'true'
  }
  
  const savedDashboardPreference = localStorage.getItem('show-performance-dashboard')
  if (savedDashboardPreference !== null) {
    showPerformanceDashboard.value = savedDashboardPreference === 'true'
  }
  
  console.log('Component settings:', {
    useOptimizedComponent: useOptimizedComponent.value,
    componentToUse: componentToUse.value,
    showPerformanceDashboard: showPerformanceDashboard.value
  })
  
  // Always fetch users initially to ensure data is available
  console.log('Starting fetchUsers...')
  await fetchUsers()
  console.log('fetchUsers completed. Users:', users.value.length, 'Filtered:', filteredUsers.value.length)
})
</script>

<style scoped>
.users-view {
  padding: var(--space-md);
  max-width: 1200px;
  margin: 0 auto;
}

/* Dashboard Header */
.dashboard-header {
  margin-bottom: var(--space-xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.header-title {
  margin-bottom: var(--space-sm);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.page-description {
  color: var(--color-text-secondary, #666);
  font-size: 1rem;
}

/* Header Actions */
.header-actions {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.search-box {
  position: relative;
  min-width: 300px;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
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

.search-input::placeholder {
  color: #9ca3af;
  font-size: 0.9rem;
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
  z-index: 2;
}

.clear-search-btn:hover {
  background-color: #f3f4f6;
  color: #6b7280;
}

/* Performance Controls */
.performance-controls {
  display: flex;
  gap: var(--space-sm);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  background: white;
  color: var(--color-text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toggle-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.toggle-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.stats-card {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  padding: var(--space-md);
  display: flex;
  align-items: center;
  transition: transform var(--transition-duration), box-shadow var(--transition-duration);
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stats-icon {
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--space-md);
}

.stats-icon svg {
  width: 24px;
  height: 24px;
}

.users-icon {
  background: rgba(74, 138, 244, 0.1);
  color: #4a8af4;
}

.agents-icon {
  background: rgba(66, 185, 131, 0.1);
  color: #42b983;
}

.verified-icon {
  background: rgba(255, 177, 66, 0.1);
  color: #ffb142;
}

.stats-info {
  display: flex;
  flex-direction: column;
}

.stats-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #666);
  margin-bottom: var(--space-xs);
}

.stats-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Filters Panel */
.filters-panel {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  padding: var(--space-md);
  margin-bottom: var(--space-xl);
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.filter-label {
  font-size: 0.875rem;
  margin-bottom: var(--space-xs);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: border-color var(--transition-duration);
}

.filter-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.filter-actions {
  display: flex;
  gap: var(--space-sm);
  margin-left: auto;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-duration);
  border: none;
  min-width: 100px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.btn-primary:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-primary) 90%, black);
}

.btn-secondary {
  background-color: #f5f5f5;
  color: var(--color-text);
}

.btn-secondary:hover:not(:disabled) {
  background-color: #eaeaea;
}

/* Users Container */
.users-container {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  padding: var(--space-md);
  overflow: hidden;
}

/* Performance Dashboard Section */
.performance-dashboard-section {
  margin-bottom: var(--space-lg);
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: var(--space-lg);
}

/* Optimization Toggle */
.optimization-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.optimization-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px 8px;
  background: rgba(0, 220, 130, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(0, 220, 130, 0.2);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: help;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
    gap: var(--space-sm);
  }
  
  .search-box {
    width: 100%;
    min-width: unset;
    max-width: unset;
  }
  
  .performance-controls {
    width: 100%;
    justify-content: stretch;
  }
  
  .toggle-btn {
    flex: 1;
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
