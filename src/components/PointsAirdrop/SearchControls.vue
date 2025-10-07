<template>
  <div class="search-controls">
    <div class="search-section">
      <div class="search-input-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users by name or email..."
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="searchQuery.length > 0" @click="clearSearch" class="clear-search-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="search-filters">
        <div class="filter-group">
          <label class="filter-label">Sort by:</label>
          <select v-model="sortBy" @change="handleSortChange" class="filter-select">
            <option value="name">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="points">Points (High to Low)</option>
            <option value="points-asc">Points (Low to High)</option>
            <option value="email">Email (A-Z)</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Filter by points:</label>
          <select v-model="pointsFilter" @change="handlePointsFilter" class="filter-select">
            <option value="all">All Users</option>
            <option value="0">0 points</option>
            <option value="1-100">1-100 points</option>
            <option value="101-500">101-500 points</option>
            <option value="501-1000">501-1000 points</option>
            <option value="1000+">1000+ points</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="bulk-actions">
      <button @click="selectAll" class="action-btn select-all-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        Select All
      </button>
      <button @click="clearSelection" class="action-btn clear-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        Clear Selection
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const searchQuery = ref('')
const sortBy = ref('name')
const pointsFilter = ref('all')
const debounceTimeout = ref(null)

const emit = defineEmits(['search', 'select-all', 'clear-selection', 'sort', 'filter'])

function handleSearch() {
  // Clear any existing timeout
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
  
  // Set a new timeout to debounce the search
  debounceTimeout.value = setTimeout(() => {
    emit('search', searchQuery.value)
  }, 300) // 300ms debounce
}

function clearSearch() {
  searchQuery.value = ''
  emit('search', '')
}

function handleSortChange() {
  emit('sort', sortBy.value)
}

function handlePointsFilter() {
  emit('filter', pointsFilter.value)
}

function selectAll() {
  emit('select-all')
}

function clearSelection() {
  emit('clear-selection')
}
</script>

<style scoped>
.search-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.search-filters {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 150px;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary, #666);
}

.filter-select {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.15);
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--space-sm);
  width: 18px;
  height: 18px;
  color: var(--color-text-secondary, #666);
  opacity: 0.7;
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-sm) var(--space-sm) calc(var(--space-sm) * 2 + 18px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.15);
}

.clear-search-btn {
  position: absolute;
  right: var(--space-sm);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.clear-search-btn:hover {
  opacity: 1;
}

.clear-search-btn svg {
  width: 16px;
  height: 16px;
}

.bulk-actions {
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.select-all-btn {
  background-color: rgba(66, 185, 131, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(66, 185, 131, 0.2);
}

.select-all-btn:hover {
  background-color: rgba(66, 185, 131, 0.2);
}

.clear-btn {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-text);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.clear-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
  .search-controls {
    flex-direction: column;
    gap: var(--space-sm);
  }
}
</style>
