<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePointsStore } from '@/stores/points'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseLayout from '@/components/layout/BaseLayout.vue'

const pointsStore = usePointsStore()
const filters = ref({ ...pointsStore.transactionFilters })
const isLoading = ref(false)
const error = ref(null)
const pageSize = ref(10)
const currentPage = ref(0)
const searchText = ref('')

// Reset filters to default values
const resetFilters = () => {
  filters.value = {
    type: null,
    startDate: null,
    endDate: null,
    userId: null,
    agentId: null,
    productId: null,
    qrCodeId: null
  }
}

// Apply filters with loading state
const applyFilters = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Check if any filters are active
    const hasFilters = Object.values(filters.value).some(
      val => val !== null && val !== ''
    )

    if (hasFilters) {
      await pointsStore.fetchFilteredTransactions(filters.value)
    } else {
      await pointsStore.fetchTransactions()
    }
    await pointsStore.calculateSummaryStats()
    currentPage.value = 0 // Reset to first page when applying filters
  } catch (e) {
    error.value = e.message || 'Failed to fetch transactions'
  } finally {
    isLoading.value = false
  }
}

// Filter transactions based on search text
const filteredTransactions = computed(() => {
  if (!searchText.value.trim()) {
    return pointsStore.transactions
  }
  
  const query = searchText.value.toLowerCase()
  return pointsStore.transactions.filter(tx => 
    tx.id.toLowerCase().includes(query) ||
    (tx.users?.name && tx.users.name.toLowerCase().includes(query)) ||
    (tx.products?.name && tx.products.name.toLowerCase().includes(query)) ||
    (tx.type && tx.type.toLowerCase().includes(query))
  )
})

// Paginated transactions
const paginatedTransactions = computed(() => {
  const start = currentPage.value * pageSize.value
  const end = start + pageSize.value
  return filteredTransactions.value.slice(start, end)
})

// Calculate total pages
const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / pageSize.value)
})

// Page navigation
const goToPage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
  }
}

// Format date for display
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Status indicator class based on transaction type
const getStatusClass = (type) => {
  switch(type) {
    case 'earn': return 'status-earn'
    case 'redeem': return 'status-redeem'
    case 'airdrop': return 'status-airdrop'
    default: return 'status-default'
  }
}

// Load data on mount
onMounted(async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Load all transactions initially
    await pointsStore.fetchTransactions()
    await pointsStore.calculateSummaryStats()
  } catch (e) {
    error.value = e.message || 'Failed to load transactions'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="transactions-view">
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="page-title">Transactions</h1>
        <p class="page-description">View and manage all points transactions in your system</p>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="stats-grid">
      <div class="stats-card earn">
        <div class="stats-icon earn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 12h8"></path>
            <path d="M12 8v8"></path>
          </svg>
        </div>
        <div class="stats-info">
          <span class="stats-label">Total Earned</span>
          <span class="stats-value">{{ pointsStore.summaryStats.totalEarned.toLocaleString() }}</span>
        </div>
      </div>

      <div class="stats-card redeem">
        <div class="stats-icon redeem-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
          </svg>
        </div>
        <div class="stats-info">
          <span class="stats-label">Total Redeemed</span>
          <span class="stats-value">{{ pointsStore.summaryStats.totalRedeemed.toLocaleString() }}</span>
        </div>
      </div>

      <div class="stats-card airdrop">
        <div class="stats-icon airdrop-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div class="stats-info">
          <span class="stats-label">Total Airdropped</span>
          <span class="stats-value">{{ pointsStore.summaryStats.totalAirdropped.toLocaleString() }}</span>
        </div>
      </div>

      <div class="stats-card time">
        <div class="stats-icon time-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stats-info time-stats">
          <div class="time-stat">
            <span class="time-label">Today</span>
            <span class="time-value">{{ pointsStore.summaryStats.dailyPoints.toLocaleString() }}</span>
          </div>
          <div class="time-stat">
            <span class="time-label">Week</span>
            <span class="time-value">{{ pointsStore.summaryStats.weeklyPoints.toLocaleString() }}</span>
          </div>
          <div class="time-stat">
            <span class="time-label">Month</span>
            <span class="time-value">{{ pointsStore.summaryStats.monthlyPoints.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters Panel -->
    <div class="filters-panel">
      <h2 class="section-title">Filters</h2>
      <div class="filters-container">
        <div class="filter-group">
          <label class="filter-label">Transaction Type</label>
          <select v-model="filters.type" class="filter-input">
            <option :value="null">All Types</option>
            <option value="earn">Earn</option>
            <option value="redeem">Redeem</option>
            <option value="airdrop">Airdrop</option>
          </select>
        </div>

        <div class="filter-group date-filter">
          <label class="filter-label">Date Range</label>
          <div class="date-range">
            <input type="date" v-model="filters.startDate" class="filter-input date-input" />
            <span class="date-separator">to</span>
            <input type="date" v-model="filters.endDate" class="filter-input date-input" />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">User ID</label>
          <input type="text" v-model="filters.userId" class="filter-input" placeholder="Enter user ID" />
        </div>

        <div class="filter-actions">
          <button @click="applyFilters" class="btn btn-primary" :disabled="isLoading">
            <svg v-if="isLoading" class="loading-spinner" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
            </svg>
            <span v-else>Apply Filters</span>
          </button>
          <button @click="resetFilters" class="btn btn-secondary">Reset</button>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          v-model="searchText"
          placeholder="Search transactions..."
          class="search-input"
        />
      </div>
      <div class="transactions-count">
        Showing {{ paginatedTransactions.length }} of {{ filteredTransactions.length }} transactions
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-container">

      <span>{{ error }}</span>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isLoading && !error" class="loading-container">
      <div class="loading-spinner-large"></div>
      <span>Loading transactions...</span>
    </div>

    <!-- Transactions Table -->
    <div v-else-if="paginatedTransactions.length > 0" class="transactions-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Points</th>
            <th>User</th>
            <th>Product</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in paginatedTransactions" :key="tx.id" class="transaction-row">
            <td class="tx-id">{{ tx.id.slice(0, 8) }}...</td>
            <td>
              <span class="status-badge" :class="getStatusClass(tx.type)">
                {{ tx.type }}
              </span>
            </td>
            <td :class="['tx-points', { 'negative-points': tx.type === 'redeem' }]">
              {{ tx.type === 'redeem' ? '-' : '+' }}{{ tx.points.toLocaleString() }}
            </td>
            <td>{{ tx.users?.name || 'N/A' }}</td>
            <td>{{ tx.products?.name || 'N/A' }}</td>
            <td>{{ formatDate(tx.timestamp) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button 
          @click="goToPage(0)" 
          class="pagination-button" 
          :disabled="currentPage === 0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pagination-icon">
            <polyline points="11 17 6 12 11 7"></polyline>
            <polyline points="18 17 13 12 18 7"></polyline>
          </svg>
        </button>
        <button 
          @click="goToPage(currentPage - 1)" 
          class="pagination-button" 
          :disabled="currentPage === 0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pagination-icon">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        <span class="pagination-info">
          Page {{ currentPage + 1 }} of {{ totalPages }}
        </span>
        
        <button 
          @click="goToPage(currentPage + 1)" 
          class="pagination-button" 
          :disabled="currentPage === totalPages - 1 || totalPages === 0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pagination-icon">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <button 
          @click="goToPage(totalPages - 1)" 
          class="pagination-button" 
          :disabled="currentPage === totalPages - 1 || totalPages === 0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pagination-icon">
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="empty-icon">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 12h8"></path>
      </svg>
      <h3>No transactions found</h3>
      <p>Try changing your filter settings or clearing the search</p>
      <button @click="resetFilters" class="btn btn-secondary">Reset Filters</button>
    </div>
  </div>
</template>

<style scoped>
@import '../assets/transactions-styles.css';

.transactions-view {
  padding: var(--space-md);
  max-width: 1200px;
  margin: 0 auto;
}

/* Dashboard Header */
.dashboard-header {
  margin-bottom: var(--space-lg);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
  background: linear-gradient(to right, var(--color-text), color-mix(in srgb, var(--color-text) 80%, white));
  -webkit-background-clip: text;
  background-clip: text;
}

.page-description {
  color: var(--color-text-secondary);
  font-size: 1rem;
  line-height: 1.5;
}

/* Section Headers */
.section-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: var(--space-md);
  color: var(--color-text);
}

/* Grid Layouts */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

/* Basic Layout Components */
.filters-panel {
  background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: flex-end;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .filters-container {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .transactions-view {
    padding: var(--space-sm);
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    gap: var(--space-sm);
  }
}
</style>
