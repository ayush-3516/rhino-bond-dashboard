<script setup>
import { computed, ref, nextTick, shallowRef, watch, onMounted, onUnmounted } from 'vue'
import { useEventStore } from '@/stores/event'
import ConfirmModal from '@/components/ConfirmModal.vue'

// Props
const props = defineProps({
  showSearch: {
    type: Boolean,
    default: true
  },
  itemsPerPage: {
    type: Number,
    default: 20
  }
})

const eventStore = useEventStore()
const selectedEvents = ref(new Set())
const filterActive = ref('upcoming') // 'upcoming', 'past', 'all'

// Performance optimization: Use shallowRef for large arrays
const events = computed(() => eventStore.events)
const loading = computed(() => eventStore.loading)
const error = computed(() => eventStore.error)

// Search and sorting
const searchQuery = ref('')
const sortBy = ref('date')
const currentPage = ref(1)

// Debounced search
const debouncedSearchQuery = ref('')
let searchTimeout = null

function handleSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = searchQuery.value
    currentPage.value = 1 // Reset to first page on search
  }, 300)
}

// Image loading states for better UX
const imageLoadingStates = shallowRef({})

// Memoized computed properties for better performance
const upcomingEvents = computed(() => 
  events.value.filter(event => new Date(event.end_date) > new Date())
)

const pastEvents = computed(() =>
  events.value
    .filter(event => new Date(event.end_date) <= new Date())
    .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
)

const filteredEvents = computed(() => {
  let result = []
  switch (filterActive.value) {
    case 'upcoming':
      result = upcomingEvents.value
      break
    case 'past':
      result = pastEvents.value
      break
    case 'all':
    default:
      result = [...upcomingEvents.value, ...pastEvents.value]
  }
  
  // Apply search filter
  if (debouncedSearchQuery.value.trim()) {
    const query = debouncedSearchQuery.value.toLowerCase()
    result = result.filter(event => 
      event.title.toLowerCase().includes(query) ||
      (event.description && event.description.toLowerCase().includes(query))
    )
  }
  
  return result
})

const filteredAndSortedEvents = computed(() => {
  const events = [...filteredEvents.value]
  
  switch (sortBy.value) {
    case 'title':
      return events.sort((a, b) => a.title.localeCompare(b.title))
    case 'created_at':
      return events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    case 'date':
    default:
      return events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
  }
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredAndSortedEvents.value.length / props.itemsPerPage))

const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filteredAndSortedEvents.value.slice(start, end)
})

// Pre-calculated date strings for better performance
const eventDateCache = shallowRef(new Map())

function getFormattedDate(dateString, eventId) {
  const cacheKey = `${eventId}-${dateString}`
  if (eventDateCache.value.has(cacheKey)) {
    return eventDateCache.value.get(cacheKey)
  }
  
  const formatted = new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
  
  eventDateCache.value.set(cacheKey, formatted)
  return formatted
}

// Pre-calculated time remaining for better performance
const timeRemainingCache = shallowRef(new Map())

function getTimeRemaining(dateString, eventId) {
  const cacheKey = `${eventId}-${dateString}-${Math.floor(Date.now() / 60000)}` // Cache for 1 minute
  if (timeRemainingCache.value.has(cacheKey)) {
    return timeRemainingCache.value.get(cacheKey)
  }
  
  const targetDate = new Date(dateString)
  const now = new Date()
  
  if (targetDate < now) {
    const result = 'Ended'
    timeRemainingCache.value.set(cacheKey, result)
    return result
  }
  
  const diffMs = targetDate - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  let result = ''
  if (diffDays > 0) {
    result = `${diffDays} day${diffDays > 1 ? 's' : ''}`
  } else {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours > 0) {
      result = `${diffHours} hour${diffHours > 1 ? 's' : ''}`
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      result = `${diffMins} min${diffMins > 1 ? 's' : ''}`
    }
  }
  
  timeRemainingCache.value.set(cacheKey, result)
  return result
}

function isPastEvent(event) {
  return new Date(event.end_date) <= new Date()
}

// Image optimization
function handleImageError(event, eventId) {
  imageLoadingStates.value = {
    ...imageLoadingStates.value,
    [eventId]: 'error'
  }
}

function handleImageLoad(event, eventId) {
  imageLoadingStates.value = {
    ...imageLoadingStates.value,
    [eventId]: 'loaded'
  }
}

function handleImageStart(eventId) {
  imageLoadingStates.value = {
    ...imageLoadingStates.value,
    [eventId]: 'loading'
  }
}

// Selection management
function toggleEventSelection(eventId) {
  if (selectedEvents.value.has(eventId)) {
    selectedEvents.value.delete(eventId)
  } else {
    selectedEvents.value.add(eventId)
  }
}

function selectAllVisible() {
  const visibleEvents = paginatedEvents.value
  if (selectedEvents.value.size === visibleEvents.length) {
    selectedEvents.value.clear()
  } else {
    visibleEvents.forEach(event => {
      selectedEvents.value.add(event.id)
    })
  }
}

// Modal management
const showDeleteModal = ref(false)

async function deleteSelectedEvents() {
  const eventIds = Array.from(selectedEvents.value)
  if (eventIds.length === 0) return
  showDeleteModal.value = true
}

async function confirmDelete() {
  const eventIds = Array.from(selectedEvents.value)
  try {
    await eventStore.deleteEvents(eventIds)
    selectedEvents.value.clear()
  } catch (err) {
    console.error('Failed to delete events:', err)
  } finally {
    showDeleteModal.value = false
  }
}

// Pagination handlers
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Cache cleanup
let cacheCleanupInterval = null

onMounted(() => {
  // Clean up caches every 5 minutes
  cacheCleanupInterval = setInterval(() => {
    timeRemainingCache.value.clear()
    eventDateCache.value.clear()
  }, 300000)
})

onUnmounted(() => {
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval)
  }
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})

// Watch for filter changes to reset pagination
watch([filterActive, debouncedSearchQuery, sortBy], () => {
  currentPage.value = 1
})
</script>

<template>
  <div class="event-list">
    <!-- Loading State with Skeleton -->
    <div v-if="loading" class="loading-state">
      <div class="loading-skeleton" v-for="i in 6" :key="i">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <span>{{ error }}</span>
    </div>
    
    <!-- Main Content -->
    <div v-else>
      <!-- Search and Filters -->
      <div v-if="showSearch" class="search-controls">
        <div class="search-input-wrapper">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search events..." 
            class="search-input"
            @input="handleSearchInput"
          />
        </div>
        <select v-model="sortBy" class="sort-select">
          <option value="date">Sort by Date</option>
          <option value="title">Sort by Title</option>
          <option value="created_at">Sort by Created</option>
        </select>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button 
          :class="['filter-tab', { active: filterActive === 'upcoming' }]" 
          @click="filterActive = 'upcoming'"
        >
          Upcoming
          <span v-if="upcomingEvents.length > 0" class="badge">{{ upcomingEvents.length }}</span>
        </button>
        <button 
          :class="['filter-tab', { active: filterActive === 'past' }]" 
          @click="filterActive = 'past'"
        >
          Past
          <span v-if="pastEvents.length > 0" class="badge">{{ pastEvents.length }}</span>
        </button>
        <button 
          :class="['filter-tab', { active: filterActive === 'all' }]" 
          @click="filterActive = 'all'"
        >
          All
          <span v-if="events.length > 0" class="badge">{{ events.length }}</span>
        </button>
      </div>

      <!-- Selection Controls -->
      <div v-if="paginatedEvents.length > 0" class="selection-controls">
        <button 
          class="btn btn-secondary select-all-btn" 
          @click="selectAllVisible"
        >
          {{ selectedEvents.size === paginatedEvents.length ? 'Deselect All' : 'Select All' }}
        </button>
        <button 
          v-if="selectedEvents.size > 0" 
          class="btn btn-danger delete-btn" 
          @click="deleteSelectedEvents"
        >
          Delete ({{ selectedEvents.size }})
        </button>
      </div>

      <!-- No Events State -->
      <div v-if="filteredAndSortedEvents.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <h3>{{ searchQuery ? 'No events match your search' : `No ${filterActive} events found` }}</h3>
        <p class="subtitle">{{ searchQuery ? 'Try adjusting your search terms' : 'Create a new event to get started' }}</p>
      </div>
      
      <!-- Events Grid -->
      <div v-else class="events-grid">
        <div 
          v-for="event in paginatedEvents" 
          :key="`${event.id}-${event.updated_at || event.created_at}`" 
          class="event-card"
          :class="{ 
            'past-event': isPastEvent(event),
            'selected': selectedEvents.has(event.id)
          }"
        >
          <div class="event-select">
            <input 
              type="checkbox" 
              :checked="selectedEvents.has(event.id)"
              @change="toggleEventSelection(event.id)"
              :id="`event-${event.id}`"
            />
          </div>

          <!-- Optimized Image with Progressive Loading -->
          <div class="event-image-container">
            <div v-if="event.image_url" class="event-image">
              <img 
                :src="event.image_url" 
                :alt="event.title"
                class="event-image-img"
                @error="handleImageError($event, event.id)"
                @load="handleImageLoad($event, event.id)"
                @loadstart="handleImageStart(event.id)"
                loading="lazy"
                decoding="async"
              />
              <div 
                v-if="imageLoadingStates[event.id] === 'loading'" 
                class="image-loading"
              >
                <div class="loading-spinner"></div>
              </div>
            </div>
            <div v-else class="event-image-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
            </div>
          </div>

          <div class="event-content">
            <div class="event-header">
              <h3 class="event-title">{{ event.title }}</h3>
              <div class="event-status" :class="{ 'past': isPastEvent(event) }">
                {{ isPastEvent(event) ? 'Past' : 'Upcoming' }}
              </div>
            </div>
            
            <div class="event-dates">
              <div class="date-item">
                <span class="date-label">Starts:</span>
                <span class="date-value">{{ getFormattedDate(event.start_date, event.id) }}</span>
              </div>
              <div class="date-item">
                <span class="date-label">Ends:</span>
                <span class="date-value">{{ getFormattedDate(event.end_date, event.id) }}</span>
              </div>
            </div>
            
            <div v-if="!isPastEvent(event)" class="time-remaining">
              <svg class="time-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{{ getTimeRemaining(event.end_date, event.id) }} remaining</span>
            </div>
            
            <div v-if="event.description" class="event-description">
              <p>{{ event.description.length > 120 ? event.description.substring(0, 120) + '...' : event.description }}</p>
            </div>

            <div class="event-actions">
              <button class="btn btn-icon btn-edit" @click="$emit('edit-event', event)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button class="btn btn-icon btn-danger" @click="toggleEventSelection(event.id); deleteSelectedEvents()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Previous
        </button>
        
        <div class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }} ({{ filteredAndSortedEvents.length }} events)
        </div>
        
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Confirmation Modal -->
  <ConfirmModal
    :visible="showDeleteModal"
    @confirm="confirmDelete"
    @cancel="showDeleteModal = false"
  >
    <template #header>
      <h3>Confirm Deletion</h3>
    </template>
    <template #body>
      <p>Are you sure you want to delete {{ selectedEvents.size }} selected event(s)?</p>
      <p class="warning">This action cannot be undone.</p>
    </template>
  </ConfirmModal>
</template>

<style scoped>
.event-list {
  width: 100%;
  position: relative;
}

/* Loading State */
.loading-state {
  display: grid;
  gap: var(--space-md);
}

.loading-skeleton {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: white;
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.skeleton-image {
  width: 120px;
  height: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: var(--border-radius);
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton-title {
  width: 60%;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-text {
  width: 80%;
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Search Controls */
.search-controls {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  align-items: center;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-sm) var(--space-sm) 40px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--border-radius);
  font-size: var(--font-size-md);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.1);
}

.sort-select {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--border-radius);
  background: white;
  cursor: pointer;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
  background: rgba(15, 23, 42, 0.03);
  padding: 4px;
  border-radius: var(--border-radius);
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-weight: 500;
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  cursor: pointer;
  flex: 1;
  justify-content: center;
}

.filter-tab:hover {
  background: rgba(15, 23, 42, 0.04);
  color: var(--color-text);
}

.filter-tab.active {
  background: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.badge {
  background: rgba(15, 23, 42, 0.08);
  color: var(--color-text-secondary);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.filter-tab.active .badge {
  background: rgba(0, 220, 130, 0.12);
  color: var(--color-primary);
}

/* Selection Controls */
.selection-controls {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--border-radius);
  background: white;
  color: var(--color-text);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #f8faff;
  border-color: rgba(15, 23, 42, 0.15);
  transform: translateY(-1px);
}

.btn-danger {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.btn-danger:hover {
  background: #ef4444;
  color: white;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-2xl);
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  border-radius: var(--border-radius-lg);
  border: 1px dashed rgba(15, 23, 42, 0.1);
}

.empty-state-icon {
  color: var(--color-primary);
  opacity: 0.7;
  margin-bottom: var(--space-md);
}

.empty-state h3 {
  color: var(--color-text);
  margin: 0 0 var(--space-xs);
  font-weight: 600;
}

.empty-state .subtitle {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-lg);
}

/* Events Grid */
.events-grid {
  display: grid;
  gap: var(--space-md);
}

.event-card {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: var(--border-radius-lg);
  transition: all 0.3s ease;
  align-items: start;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(15, 23, 42, 0.12);
}

.event-card.selected {
  border-color: var(--color-primary);
  background: rgba(0, 220, 130, 0.02);
}

.event-image-container {
  width: 120px;
  height: 80px;
}

.event-image {
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
}

.event-image-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.event-card:hover .event-image-img {
  transform: scale(1.05);
}

.image-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.event-image-placeholder {
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius);
  background: linear-gradient(135deg, #f8faff, #e2e8f0);
  border: 2px dashed rgba(15, 23, 42, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.event-content {
  flex: 1;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-sm);
}

.event-title {
  color: var(--color-text);
  font-weight: 600;
  font-size: var(--font-size-lg);
  margin: 0;
}

.event-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(0, 220, 130, 0.12);
  color: var(--color-primary);
}

.event-status.past {
  background: rgba(100, 116, 139, 0.12);
  color: var(--color-text-secondary);
}

.event-dates {
  display: flex;
  gap: var(--space-lg);
  margin: var(--space-md) 0;
  font-size: 0.9rem;
}

.date-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-label {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}

.date-value {
  color: var(--color-text);
  font-weight: 500;
}

.time-remaining {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px 12px;
  background: rgba(0, 220, 130, 0.1);
  border-radius: 20px;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 500;
  margin: var(--space-sm) 0;
}

.event-description {
  margin: var(--space-md) 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.event-actions {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-md);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--border-radius);
  background: white;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: #f8faff;
  border-color: rgba(15, 23, 42, 0.15);
  transform: translateY(-1px);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-xl);
  padding: var(--space-lg);
  background: rgba(15, 23, 42, 0.02);
  border-radius: var(--border-radius-lg);
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--border-radius);
  background: white;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .search-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input-wrapper {
    max-width: none;
  }

  .event-card {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .event-image-container {
    width: 100%;
    height: 120px;
    grid-row: 2;
  }

  .event-dates {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .pagination {
    flex-direction: column;
    gap: var(--space-md);
  }

  .pagination-info {
    order: -1;
  }
}
</style>
