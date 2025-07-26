<template>
  <div class="airdrop-dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <h1 class="page-title">Points Airdrop</h1>
      <p class="page-description">Distribute points to users in your system</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </div>
        <div class="stats-info">
          <span class="stats-label">Total Points Airdropped</span>
          <span class="stats-value">{{ stats.totalAirdropped.toLocaleString() }}</span>
        </div>
      </div>

      <div class="stats-card">
        <div class="stats-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="stats-info">
          <span class="stats-label">Total Users</span>
          <span class="stats-value">{{ users.length.toLocaleString() }}</span>
        </div>
      </div>
      
      <div class="stats-card">
        <div class="stats-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <div class="stats-info">
          <span class="stats-label">Selected Users</span>
          <span class="stats-value">{{ selectedUsers.length }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="content-area">
      <!-- Search Panel -->
      <div class="search-panel">
        <div class="panel-header">
          <h2 class="panel-title">User Selection</h2>
        </div>
        <div class="panel-content">
          <SearchControls
            @search="handleSearch"
            @select-all="selectAll"
            @clear-selection="clearSelection"
          />
          
          <UserList
            :users="filteredUsers"
            :selected-users="selectedUsers"
            @toggle-user="toggleUser"
          />

          <div class="selection-summary" v-if="selectedUsers.length > 0">
            <p><strong>{{ selectedUsers.length }}</strong> users selected</p>
          </div>
        </div>
      </div>

      <!-- Airdrop Panel -->
      <div class="airdrop-panel">
        <div class="panel-header">
          <h2 class="panel-title">Airdrop Configuration</h2>
        </div>
        <div class="panel-content">
          <PointsControl v-model="points" />

          <div class="total-summary">
            <div class="summary-row">
              <span>Selected Users:</span>
              <span>{{ selectedUsers.length }}</span>
            </div>
            <div class="summary-row">
              <span>Points per User:</span>
              <span>{{ points || 0 }}</span>
            </div>
            <div class="summary-row total">
              <span>Total Points:</span>
              <span>{{ (points || 0) * selectedUsers.length }}</span>
            </div>
          </div>

          <AirdropButton
            @click="handleAirdrop"
            :isLoading="isLoading"
            :selectedUsersCount="selectedUsers.length"
            :points="points"
          />
        </div>
      </div>
    </div>
  </div>
  
  <ConfirmModal
    :visible="showModal"
    :title="modalTitle"
    :message="modalMessage"
    :type="modalType"
    @close="handleModalClose"
    @confirm="handleModalConfirm"
    @cancel="handleModalCancel"
  />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePointsStore } from '@/stores/points'
import ConfirmModal from '@/components/ConfirmModal.vue'
import UserList from './PointsAirdrop/UserList.vue'
import SearchControls from './PointsAirdrop/SearchControls.vue'
import PointsControl from './PointsAirdrop/PointsControl.vue'
import AirdropButton from './PointsAirdrop/AirdropButton.vue'

const showModal = ref(false)
const isConfirmationModal = ref(false)
const modalTitle = ref('')
const modalMessage = ref('')
const modalType = ref('success')
const users = ref([])
const filteredUsers = ref([])
const searchQuery = ref('')
const selectedUsers = ref([])
const points = ref(0)
const isLoading = ref(false)
const stats = ref({
  totalAirdropped: 0,
  totalUsers: 0,
  monthlySummary: {
    airdropped: 0,
    users: 0
  }
})

const pointsStore = usePointsStore()

onMounted(async () => {
  isLoading.value = true
  try {
    // Fetch users and stats in parallel
    const [usersData, summaryStats] = await Promise.all([
      pointsStore.fetchUsers(),
      pointsStore.calculateSummaryStats()
    ])
    
    users.value = usersData
    filteredUsers.value = users.value
    
    // Update stats
    stats.value = {
      totalAirdropped: pointsStore.summaryStats.totalAirdropped || 0,
      totalUsers: users.value.length,
      monthlySummary: {
        airdropped: 0,  // We'll implement this if needed
        users: 0
      }
    }
  } catch (error) {
    console.error('Error initializing data:', error)
    // Show error notification
    modalTitle.value = 'Error'
    modalMessage.value = 'Failed to load data. Please try refreshing the page.'
    modalType.value = 'error'
    showModal.value = true
  } finally {
    isLoading.value = false
  }
})

// Search functionality
async function handleSearch(query) {
  searchQuery.value = query
  
  if (!query.trim()) {
    // If search is empty, show all users
    filteredUsers.value = users.value
    return
  }
  
  // Filter users locally based on search query
  try {
    if (query.length >= 2) {
      // If query is at least 2 chars, perform a server search
      filteredUsers.value = await pointsStore.searchUsers(query)
    } else {
      // Simple client-side filtering for short queries
      const lowercaseQuery = query.toLowerCase()
      filteredUsers.value = users.value.filter(user => 
        user.name?.toLowerCase().includes(lowercaseQuery) || 
        user.email?.toLowerCase().includes(lowercaseQuery)
      )
    }
  } catch (error) {
    console.error('Search error:', error)
    // Fall back to local filtering if server search fails
    const lowercaseQuery = query.toLowerCase()
    filteredUsers.value = users.value.filter(user => 
      user.name?.toLowerCase().includes(lowercaseQuery) || 
      user.email?.toLowerCase().includes(lowercaseQuery)
    )
  }
}

// User selection management
function toggleUser(userId) {
  const index = selectedUsers.value.indexOf(userId)
  if (index === -1) {
    selectedUsers.value.push(userId)
  } else {
    selectedUsers.value.splice(index, 1)
  }
}

function selectAll() {
  // Select all filtered users instead of all users
  selectedUsers.value = filteredUsers.value.map(user => user.id)
}

function clearSelection() {
  selectedUsers.value = []
}

// Modal handlers
function handleModalClose() {
  showModal.value = false
  selectedUsers.value = []
  points.value = 0
}

function handleModalCancel() {
  showModal.value = false
}

// Airdrop initiation
function handleAirdrop() {
  if (!selectedUsers.value.length || !points.value || isLoading.value) return
  
  modalTitle.value = 'Confirm Airdrop'
  modalMessage.value = `Are you sure you want to airdrop ${points.value} points to ${selectedUsers.value.length} users?`
  modalType.value = 'confirm'
  isConfirmationModal.value = true
  showModal.value = true
}

async function executeAirdrop() {
  if (isLoading.value) return
  
  isLoading.value = true
  try {
    await pointsStore.airdropPoints({
      userIds: selectedUsers.value,
      points: Number(points.value)
    })
    
    // Close modal after successful airdrop
    showModal.value = false
    
    // Only show success modal if not coming from confirmation
    if (!isConfirmationModal.value) {
      modalTitle.value = 'Success'
      modalMessage.value = 'Points airdropped successfully!'
      modalType.value = 'success'
      showModal.value = true
    }
    
    // Clear selections after successful airdrop
    selectedUsers.value = []
    points.value = 0
  } catch (error) {
    console.error('Airdrop failed:', error)
    modalTitle.value = 'Error'
    modalMessage.value = `Airdrop failed: ${error.message}`
    modalType.value = 'error'
    showModal.value = true
  } finally {
    isLoading.value = false
    isConfirmationModal.value = false
  }
}

function handleModalConfirm() {
  executeAirdrop()
}
</script>

<style scoped>
.airdrop-dashboard {
  padding: var(--space-md);
  max-width: 1200px;
  margin: 0 auto;
}

/* Dashboard Header Styles */
.dashboard-header {
  margin-bottom: var(--space-lg);
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

/* Stats Grid Styles */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.stats-card {
  background: linear-gradient(135deg, white, #f8fafc);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-lg);
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(66, 185, 131, 0.1);
  position: relative;
  overflow: hidden;
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.stats-card:hover::before {
  opacity: 1;
}

.stats-icon {
  background: linear-gradient(135deg, rgba(66, 185, 131, 0.1), rgba(114, 240, 173, 0.1));
  border-radius: 50%;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--space-md);
  color: var(--color-primary);
  transition: all 0.3s ease;
  border: 2px solid rgba(66, 185, 131, 0.2);
}

.stats-card:hover .stats-icon {
  transform: scale(1.1);
  background: linear-gradient(135deg, rgba(66, 185, 131, 0.15), rgba(114, 240, 173, 0.15));
}

.stats-icon svg {
  width: 24px;
  height: 24px;
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

/* Content Area Styles */
.content-area {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--space-lg);
}

.panel-header {
  margin-bottom: var(--space-md);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: var(--space-sm);
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text);
}

.search-panel, .airdrop-panel {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-xl);
  height: fit-content;
  border: 1px solid rgba(66, 185, 131, 0.1);
  transition: all 0.3s ease;
}

.search-panel:hover, .airdrop-panel:hover {
  box-shadow: var(--shadow-lg);
  border-color: rgba(66, 185, 131, 0.2);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.points-input-wrapper {
  margin-bottom: var(--space-md);
}

/* These styles are now in the PointsControl component */

.total-summary {
  background: rgba(66, 185, 131, 0.05);
  border-radius: var(--border-radius);
  padding: var(--space-md);
  margin: var(--space-md) 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-xs) 0;
  font-size: 0.95rem;
}

.summary-row.total {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin-top: var(--space-xs);
  padding-top: var(--space-sm);
  font-weight: 600;
  font-size: 1.1rem;
}

.selection-summary {
  background: rgba(66, 185, 131, 0.05);
  border-radius: var(--border-radius);
  padding: var(--space-sm);
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text);
  margin-top: var(--space-sm);
}

/* These styles are now in the AirdropButton component */

@media (max-width: 1024px) {
  .content-area {
    grid-template-columns: 1fr;
  }
  
  .search-panel, .airdrop-panel {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
