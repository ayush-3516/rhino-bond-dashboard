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
              placeholder="Search users..." 
              class="search-input"
              @input="filterUsers"
            />
          </div>
          
          <button class="action-button" @click="showAddUserModal = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add User</span>
          </button>
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
      <!-- User Management Component -->
      <UserManagement 
        ref="userManagementComponent"
        :filtered-users="filteredUsers"
        :is-loading="loading"
        @update="handleUserUpdate"
      />
    </div>

    <!-- Add User Modal Placeholder -->
    <div v-if="showAddUserModal" class="modal-backdrop" @click="showAddUserModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Add New User</h2>
          <button class="close-button" @click="showAddUserModal = false">×</button>
        </div>
        <div class="modal-body">
          <!-- Add user form would go here -->
          <p class="text-center">User creation functionality to be implemented</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddUserModal = false">Cancel</button>
          <button class="btn btn-primary" @click="showAddUserModal = false">Create User</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import UserManagement from '@/components/UserManagement.vue'
import { supabase, withServiceRole } from '../supabase'

// State
const loading = ref(false)
const users = ref([])
const filteredUsers = ref([])
const searchTerm = ref('')
const showAddUserModal = ref(false)

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
    users.value = data
    filterUsers()
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

// Filter users based on search and filters
function filterUsers() {
  let result = [...users.value]
  
  // Apply search filter
  if (searchTerm.value.trim() !== '') {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(user => 
      user.name?.toLowerCase().includes(term) || 
      user.email?.toLowerCase().includes(term) || 
      user.phone?.toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term)
    )
  }
  
  // Apply role filter
  if (filters.value.role) {
    result = result.filter(user => user.role === filters.value.role)
  }
  
  // Apply verification filter
  if (filters.value.verification === 'verified') {
    result = result.filter(user => user.admin_confirmation)
  } else if (filters.value.verification === 'unverified') {
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
  
  filteredUsers.value = result
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

// Handle user update events from the UserManagement component
function handleUserUpdate() {
  fetchUsers()
}

// Initialize
onMounted(() => {
  fetchUsers()
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
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #999;
}

.search-input {
  width: 100%;
  padding: 10px 10px 10px 36px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all var(--transition-duration);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.1);
}

.action-button {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.action-button:hover {
  background-color: color-mix(in srgb, var(--color-primary) 90%, black);
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

/* Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  border-radius: var(--border-radius);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  padding: var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.modal-body {
  padding: var(--space-md);
}

.modal-footer {
  padding: var(--space-md);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  border-top: 1px solid #eee;
}

.text-center {
  text-align: center;
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
  }
  
  .search-box {
    width: 100%;
    min-width: unset;
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
