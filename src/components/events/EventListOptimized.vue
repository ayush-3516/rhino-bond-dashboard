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
  events.value.filter(event => isUpcomingEvent(event))
)

const ongoingEvents = computed(() => 
  events.value.filter(event => isOngoingEvent(event))
)

const pastEvents = computed(() =>
  events.value.filter(event => isPastEvent(event))
)

const filteredEvents = computed(() => {
  let result = []
  switch (filterActive.value) {
    case 'upcoming':
      result = upcomingEvents.value
      break
    case 'ongoing':
      result = ongoingEvents.value
      break
    case 'past':
      result = pastEvents.value
      break
    case 'all':
    default:
      result = [...upcomingEvents.value, ...ongoingEvents.value, ...pastEvents.value]
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

function parseDate(dateString) {
  // Handle different date formats and ensure proper parsing
  if (!dateString) return null
  
  const date = new Date(dateString)
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error('Invalid date string:', dateString)
    return null
  }
  
  return date
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

function isPastEvent(event) {
  const now = new Date()
  const endDate = parseDate(event.end_date)
  if (!endDate) return false
  
  // For precise time comparison, use full date/time
  return endDate <= now
}

function isUpcomingEvent(event) {
  const now = new Date()
  const startDate = parseDate(event.start_date)
  if (!startDate) return false
  
  // For precise time comparison, use full date/time
  return startDate > now
}

function isOngoingEvent(event) {
  const now = new Date()
  const startDate = parseDate(event.start_date)
  const endDate = parseDate(event.end_date)
  
  if (!startDate || !endDate) return false
  
  // Event is ongoing if current time is between start and end times
  return now >= startDate && now <= endDate
}

function getEventStatus(event) {
  // Check ongoing first, then past, then upcoming
  if (isOngoingEvent(event)) {
    return 'ongoing'
  } else if (isPastEvent(event)) {
    return 'past'
  } else if (isUpcomingEvent(event)) {
    return 'upcoming'
  } else {
    return 'unknown'
  }
}

function getEventStatusText(event) {
  const status = getEventStatus(event)
  
  switch (status) {
    case 'past':
      return 'Past'
    case 'ongoing':
      return 'Ongoing'
    case 'upcoming':
      return 'Upcoming'
    default:
      return 'Unknown'
  }
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

// Log current date/time on component mount for debugging
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

function getFilterDisplayName(filter) {
  switch (filter) {
    case 'upcoming':
      return 'upcoming'
    case 'ongoing':
      return 'ongoing'
    case 'past':
      return 'past'
    case 'all':
      return 'all'
    default:
      return 'all'
  }
}
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
          :class="['filter-tab', { active: filterActive === 'ongoing' }]" 
          @click="filterActive = 'ongoing'"
        >
          Ongoing
          <span v-if="ongoingEvents.length > 0" class="badge">{{ ongoingEvents.length }}</span>
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
        <h3>{{ searchQuery ? 'No events match your search' : `No ${getFilterDisplayName(filterActive)} events found` }}</h3>
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
              <div class="event-status" :class="getEventStatus(event)">
                {{ getEventStatusText(event) }}
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
            
            <div v-if="getEventStatus(event) === 'upcoming'" class="time-remaining">
              <svg class="time-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{{ getTimeRemaining(event.end_date, event.id) }} remaining</span>
            </div>
            
            <div v-if="getEventStatus(event) === 'ongoing'" class="time-remaining ongoing">
              <svg class="time-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Event in progress</span>
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
}

/* Loading State */
.loading-state {
  display: grid;
  gap: var(--space-lg);
}

.loading-skeleton {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  align-items: start;
}

.skeleton-image {
  width: 120px;
  height: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 12px;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton-title {
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: shimmer 1.5s infinite;
  width: 60%;
}

.skeleton-text {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
  width: 80%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-2xl);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.02));
  border: 2px dashed rgba(239, 68, 68, 0.2);
  border-radius: 16px;
  text-align: center;
}

.error-icon {
  color: var(--color-error);
  opacity: 0.8;
}

.error-state span {
  color: var(--color-error);
  font-weight: 500;
}

/* Search and Controls */
.search-controls {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
  align-items: center;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  max-width: 500px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: var(--space-md) var(--space-md) var(--space-md) 48px;
  border: 2px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  font-size: var(--font-size-base);
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 
    0 0 0 4px rgba(0, 220, 130, 0.1),
    0 4px 12px rgba(0, 220, 130, 0.1);
  transform: translateY(-1px);
}

.search-input:hover {
  border-color: rgba(15, 23, 42, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

.sort-select {
  padding: var(--space-md) var(--space-lg);
  border: 2px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-base);
  transition: all 0.3s ease;
  min-width: 160px;
}

.sort-select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(0, 220, 130, 0.1);
}

.sort-select:hover {
  border-color: rgba(15, 23, 42, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
  background: rgba(15, 23, 42, 0.03);
  padding: 6px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  flex: 1;
  justify-content: center;
  font-size: 0.875rem;
  position: relative;
  overflow: hidden;
}

.filter-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.filter-tab:hover {
  background: rgba(15, 23, 42, 0.04);
  color: var(--color-text);
  transform: translateY(-1px);
}

.filter-tab.active {
  background: white;
  color: var(--color-primary);
  box-shadow: 
    0 4px 6px rgba(15, 23, 42, 0.08),
    0 2px 4px rgba(15, 23, 42, 0.04);
  font-weight: 700;
  transform: translateY(-1px);
}

.filter-tab.active::before {
  opacity: 0.05;
}

.badge {
  background: rgba(15, 23, 42, 0.08);
  color: var(--color-text-secondary);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.filter-tab.active .badge {
  background: rgba(0, 220, 130, 0.15);
  color: var(--color-primary);
}

/* Selection Controls */
.selection-controls {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.03), rgba(0, 220, 130, 0.01));
  border: 1px solid rgba(0, 220, 130, 0.1);
  border-radius: 16px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border: 2px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  background: white;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
}

.btn:hover {
  background: #f8faff;
  border-color: rgba(15, 23, 42, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
}

.btn-danger {
  border-color: var(--color-error);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.05);
}

.btn-danger:hover {
  background: var(--color-error);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-3xl);
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  border-radius: 20px;
  border: 2px dashed rgba(15, 23, 42, 0.1);
  margin: var(--space-xl) 0;
}

.empty-state-icon {
  color: var(--color-primary);
  opacity: 0.6;
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  color: var(--color-text);
  margin: 0 0 var(--space-sm);
  font-weight: 700;
  font-size: 1.25rem;
}

.empty-state .subtitle {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-lg);
  font-size: 0.875rem;
}

/* Events Grid */
.events-grid {
  display: grid;
  gap: var(--space-lg);
}

.event-card {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: white;
  border: 2px solid rgba(15, 23, 42, 0.06);
  border-radius: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  align-items: start;
  position: relative;
  overflow: hidden;
}

.event-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, var(--color-primary), var(--color-primary-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 24px rgba(15, 23, 42, 0.1),
    0 6px 12px rgba(15, 23, 42, 0.06);
  border-color: rgba(15, 23, 42, 0.12);
}

.event-card:hover::before {
  opacity: 1;
}

.event-card.selected {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.02), rgba(0, 220, 130, 0.01));
  box-shadow: 
    0 8px 16px rgba(0, 220, 130, 0.1),
    0 4px 8px rgba(0, 220, 130, 0.05);
}

.event-select {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm);
}

.event-select input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.event-image-container {
  width: 140px;
  height: 100px;
}

.event-image {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 8px rgba(15, 23, 42, 0.1);
}

.event-image-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.event-card:hover .event-image-img {
  transform: scale(1.08);
}

.image-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 220, 130, 0.2);
  border-top: 3px solid var(--color-primary);
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
  border-radius: 16px;
  background: linear-gradient(135deg, #f8faff, #e2e8f0);
  border: 2px dashed rgba(15, 23, 42, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.event-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-sm);
}

.event-title {
  color: var(--color-text);
  font-weight: 700;
  font-size: 1.25rem;
  margin: 0;
  line-height: 1.3;
}

.event-status {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.event-status.upcoming {
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.15), rgba(0, 220, 130, 0.08));
  color: var(--color-primary);
}

.event-status.ongoing {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08));
  color: #3b82f6;
}

.event-status.past {
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.15), rgba(100, 116, 139, 0.08));
  color: var(--color-text-secondary);
}

.event-dates {
  display: flex;
  gap: var(--space-xl);
  margin: var(--space-sm) 0;
  font-size: 0.875rem;
}

.date-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-label {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.date-value {
  color: var(--color-text);
  font-weight: 600;
}

.time-remaining {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 6px 16px;
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.12), rgba(0, 220, 130, 0.06));
  border-radius: 20px;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 600;
  margin: var(--space-sm) 0;
  border: 1px solid rgba(0, 220, 130, 0.2);
}

.time-remaining.ongoing {
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.12), rgba(0, 220, 130, 0.06));
  color: var(--color-primary);
  border: 1px solid rgba(0, 220, 130, 0.2);
}

.time-icon {
  color: var(--color-primary);
}

.event-description {
  margin: var(--space-sm) 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
  max-width: 600px;
}

.event-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: 2px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  background: white;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-icon:hover {
  background: #f8faff;
  border-color: rgba(15, 23, 42, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
}

.btn-edit:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(0, 220, 130, 0.05);
}

.btn-danger:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.05);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-2xl);
  padding: var(--space-xl);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.01));
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border: 2px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  background: white;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  font-size: 0.875rem;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.2);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pagination-info {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .search-controls {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-md);
  }

  .search-input-wrapper {
    max-width: none;
  }

  .filter-tabs {
    flex-wrap: wrap;
  }

  .filter-tab {
    min-width: 120px;
  }

  .event-card {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
    padding: var(--space-lg);
  }

  .event-image-container {
    width: 100%;
    height: 160px;
    grid-row: 2;
  }

  .event-dates {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .event-actions {
    flex-wrap: wrap;
  }

  .pagination {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .pagination-info {
    order: -1;
  }

  .selection-controls {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .event-card {
    padding: var(--space-md);
  }

  .event-title {
    font-size: 1.125rem;
  }

  .search-input,
  .sort-select {
    padding: var(--space-sm) var(--space-md);
  }

  .filter-tab {
    padding: var(--space-xs) var(--space-sm);
    font-size: 0.8rem;
  }
}
</style>
