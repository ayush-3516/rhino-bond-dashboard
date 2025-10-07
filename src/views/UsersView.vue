<template>
  <div class="users-view">
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-title">
          <h1 class="page-title">User Management</h1>
          <p class="page-description">Manage user accounts, roles, and permissions</p>
        </div>
        
      </div>

    </div>

    <!-- Search Section - Always Visible -->
    <div class="user-search-panel" id="user-search-panel">
      <h3 class="search-title">🔍 Search Users</h3>
      <div class="search-container">
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
            @input="handleSearchInput"
            @focus="showSearchSuggestions = true"
            @blur="hideSearchSuggestions"
            @keydown.enter="selectFirstSuggestion"
            @keydown.arrow-down="navigateSuggestions(1)"
            @keydown.arrow-up="navigateSuggestions(-1)"
            @keydown.escape="clearSearch"
            ref="searchInput"
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
          
          <!-- Search Suggestions Dropdown -->
          <div v-if="showSearchSuggestions && searchSuggestions.length > 0" class="search-suggestions">
            <div 
              v-for="(suggestion, index) in searchSuggestions" 
              :key="suggestion.id"
              class="suggestion-item"
              :class="{ active: selectedSuggestionIndex === index }"
              @click="selectSuggestion(suggestion)"
              @mouseenter="selectedSuggestionIndex = index"
            >
              <div class="suggestion-content">
                <div class="suggestion-name" v-html="highlightSearchTerm(suggestion.name)"></div>
                <div class="suggestion-details">
                  <span class="suggestion-email" v-html="highlightSearchTerm(suggestion.email)"></span>
                  <span class="suggestion-role">{{ suggestion.role }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <div class="users-container">
      <!-- Optimized User Management Component -->
      <UserManagementOptimized 
        key="optimized"
        :page-size="20"
        :search-term="searchTerm"
        @update="handleUserUpdate"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import UserManagementOptimized from '@/components/UserManagementOptimized.vue'


// State
const searchTerm = ref('')

// Enhanced search functionality
const showSearchSuggestions = ref(false)
const searchSuggestions = ref([])
const selectedSuggestionIndex = ref(-1)
const searchInput = ref(null)
const searchHistory = ref(JSON.parse(localStorage.getItem('user-search-history') || '[]'))


// Reset all filters
function resetFilters() {
  searchTerm.value = ''
  // The UserManagementOptimized component will handle its own filter reset
}

// Enhanced search functionality
function handleSearchInput() {
  console.log('🔍 Search input changed:', searchTerm.value)
  generateSearchSuggestions()
  showSearchSuggestions.value = true
}

function generateSearchSuggestions() {
  if (!searchTerm.value.trim() || searchTerm.value.length < 2) {
    searchSuggestions.value = []
    return
  }
  
  // For now, we'll disable suggestions since we don't have access to users array
  // The UserManagementOptimized component will handle its own search
  searchSuggestions.value = []
  selectedSuggestionIndex.value = -1
}

function highlightSearchTerm(text) {
  if (!text || !searchTerm.value.trim()) return text
  
  const term = searchTerm.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${term})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

function selectSuggestion(suggestion) {
  searchTerm.value = suggestion.name || suggestion.email || suggestion.id
  showSearchSuggestions.value = false
  addToSearchHistory(searchTerm.value)
  filterUsers()
}

function selectFirstSuggestion() {
  if (searchSuggestions.value.length > 0 && selectedSuggestionIndex.value >= 0) {
    selectSuggestion(searchSuggestions.value[selectedSuggestionIndex.value])
  } else if (searchSuggestions.value.length > 0) {
    selectSuggestion(searchSuggestions.value[0])
  }
}

function navigateSuggestions(direction) {
  if (searchSuggestions.value.length === 0) return
  
  selectedSuggestionIndex.value += direction
  
  if (selectedSuggestionIndex.value < 0) {
    selectedSuggestionIndex.value = searchSuggestions.value.length - 1
  } else if (selectedSuggestionIndex.value >= searchSuggestions.value.length) {
    selectedSuggestionIndex.value = 0
  }
}

function hideSearchSuggestions() {
  // Delay hiding to allow clicks on suggestions
  setTimeout(() => {
    showSearchSuggestions.value = false
  }, 200)
}

function addToSearchHistory(term) {
  if (!term.trim()) return
  
  // Remove if already exists
  searchHistory.value = searchHistory.value.filter(item => item !== term)
  
  // Add to beginning
  searchHistory.value.unshift(term)
  
  // Keep only last 10 searches
  searchHistory.value = searchHistory.value.slice(0, 10)
  
  // Save to localStorage
  localStorage.setItem('user-search-history', JSON.stringify(searchHistory.value))
}

// Clear search
function clearSearch() {
  searchTerm.value = ''
  searchSuggestions.value = []
  showSearchSuggestions.value = false
  selectedSuggestionIndex.value = -1
}

// Handle user update events from the UserManagement component
function handleUserUpdate() {
  // Optimized component handles its own updates
  console.log('User update event received')
}


// Initialize
onMounted(async () => {
  console.log('=== UsersView mounted ===')
  
  // UserManagementOptimized component will handle its own data fetching
  console.log('UsersView initialized - UserManagementOptimized will handle data fetching')
})
</script>

<style scoped>
/* Search Panel - Professional Styling */
#user-search-panel {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 16px !important;
  padding: 28px !important;
  margin: 20px 0 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06) !important;
  min-height: auto !important;
  transition: all 0.2s ease !important;
}

#user-search-panel:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  border-color: #cbd5e1 !important;
}

#user-search-panel * {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

#user-search-panel input {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100% !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
  padding: 16px 48px 16px 48px !important;
  font-size: 16px !important;
  transition: all 0.2s ease !important;
  box-shadow: none !important;
}

#user-search-panel input:focus {
  outline: none !important;
  border-color: #00dc82 !important;
  background: white !important;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.1) !important;
}

#user-search-panel button {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  background: none !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

#user-search-panel button:hover {
  background: #f1f5f9 !important;
  border-radius: 50% !important;
}

#user-search-panel svg {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.users-view .user-search-panel {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.users-view .user-search-panel * {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* Force visibility of search elements */
.users-view input[type="text"] {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100% !important;
}

.users-view button {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.users-view svg {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
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
  flex-wrap: wrap;
}

.search-box {
  position: relative !important;
  min-width: 300px !important;
  max-width: 100% !important;
  flex: 1 !important;
  z-index: 10 !important;
  display: flex !important;
  align-items: center !important;
}

.search-icon {
  position: absolute !important;
  left: 16px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 20px !important;
  height: 20px !important;
  color: #64748b !important;
  z-index: 2 !important;
  transition: color 0.2s ease !important;
}

.search-input {
  width: 100% !important;
  padding: 16px 48px 16px 48px !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  background-color: #f8fafc !important;
  transition: all 0.2s ease !important;
  box-shadow: none !important;
  outline: none !important;
  position: relative !important;
  z-index: 2 !important;
  color: #1e293b !important;
}

.search-input:focus {
  outline: none !important;
  border-color: #00dc82 !important;
  background-color: white !important;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.1) !important;
}

.search-input::placeholder {
  color: #94a3b8 !important;
  font-size: 16px !important;
}

.clear-search-btn {
  position: absolute !important;
  right: 16px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  background: none !important;
  border: none !important;
  width: 24px !important;
  height: 24px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  color: #64748b !important;
  transition: all 0.2s ease !important;
  z-index: 2 !important;
}

.clear-search-btn:hover {
  background-color: #f1f5f9 !important;
  color: #475569 !important;
  transform: translateY(-50%) scale(1.1) !important;
}

/* Search Suggestions */
.search-suggestions {
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  right: 0 !important;
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  z-index: 1000 !important;
  max-height: 300px !important;
  overflow-y: auto !important;
  margin-top: 8px !important;
}

.suggestion-item {
  padding: 16px !important;
  cursor: pointer !important;
  border-bottom: 1px solid #f1f5f9 !important;
  transition: all 0.2s ease !important;
  display: block !important;
  visibility: visible !important;
}

.suggestion-item:last-child {
  border-bottom: none !important;
}

.suggestion-item:hover,
.suggestion-item.active {
  background-color: #f8fafc !important;
  transform: translateX(4px) !important;
}

.suggestion-content {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
}

.suggestion-name {
  font-weight: 600 !important;
  color: #1e293b !important;
  font-size: 16px !important;
}

.suggestion-details {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  font-size: 14px !important;
  color: #64748b !important;
}

.suggestion-email {
  flex: 1 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  margin-right: 12px !important;
}

.suggestion-role {
  margin-left: 10px !important;
  background: #f1f5f9 !important;
  padding: 4px 8px !important;
  border-radius: 6px !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  font-weight: 600 !important;
  color: #475569 !important;
  letter-spacing: 0.5px !important;
}

/* Search Highlight */
.search-highlight {
  background-color: #fef3c7 !important;
  color: #92400e !important;
  padding: 2px 4px !important;
  border-radius: 4px !important;
  font-weight: 600 !important;
}




/* Search Section - Override global CSS rules */
.user-search-panel {
  background: #f8f9fa !important;
  border: 2px solid #007bff !important;
  border-radius: 8px !important;
  padding: 20px !important;
  margin: 20px 0 !important;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
  position: relative !important;
  z-index: 1 !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  min-height: 100px !important;
}

/* Override global CSS rules that might hide search elements */
.user-search-panel * {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.user-search-panel input {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100% !important;
}

.user-search-panel button {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.user-search-panel svg {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.search-title {
  color: #334155 !important;
  margin-bottom: 24px !important;
  font-size: 20px !important;
  font-weight: 600 !important;
  margin-top: 0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}

.search-container {
  max-width: 600px !important;
  margin: 0 auto !important;
  position: relative !important;
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
