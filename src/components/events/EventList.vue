<script setup>
import { computed, ref } from 'vue'
import { useEventStore } from '@/stores/event'
import ConfirmModal from '@/components/ConfirmModal.vue'

const eventStore = useEventStore()
const selectedEvents = ref(new Set())
const filterActive = ref('upcoming') // 'upcoming', 'past', 'all'

const events = computed(() => eventStore.events)
const loading = computed(() => eventStore.loading)
const error = computed(() => eventStore.error)

function toggleEventSelection(eventId) {
  if (selectedEvents.value.has(eventId)) {
    selectedEvents.value.delete(eventId)
  } else {
    selectedEvents.value.add(eventId)
  }
}

function selectAllVisible() {
  const visibleEvents = filteredEvents.value
  if (selectedEvents.value.size === visibleEvents.length) {
    // Deselect all if all are selected
    selectedEvents.value.clear()
  } else {
    // Select all visible events
    visibleEvents.forEach(event => {
      selectedEvents.value.add(event.id)
    })
  }
}

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

// Event status helper functions
function parseDate(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    console.error('Invalid date string:', dateString)
    return null
  }
  return date
}

function isPastEvent(event) {
  const now = new Date()
  const endDate = parseDate(event.end_date)
  if (!endDate) return false
  return endDate <= now
}

function isUpcomingEvent(event) {
  const now = new Date()
  const startDate = parseDate(event.start_date)
  if (!startDate) return false
  return startDate > now
}

function isOngoingEvent(event) {
  const now = new Date()
  const startDate = parseDate(event.start_date)
  const endDate = parseDate(event.end_date)
  if (!startDate || !endDate) return false
  return now >= startDate && now <= endDate
}

function getEventStatus(event) {
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

const upcomingEvents = computed(() => 
  events.value.filter(event => isUpcomingEvent(event))
)

const ongoingEvents = computed(() =>
  events.value.filter(event => isOngoingEvent(event))
)

const pastEvents = computed(() =>
  events.value
    .filter(event => isPastEvent(event))
    .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
)

const filteredEvents = computed(() => {
  switch (filterActive.value) {
    case 'upcoming':
      return upcomingEvents.value
    case 'ongoing':
      return ongoingEvents.value
    case 'past':
      return pastEvents.value
    case 'all':
    default:
      return [...upcomingEvents.value, ...ongoingEvents.value, ...pastEvents.value]
  }
})

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
}

function getTimeRemaining(dateString) {
  const targetDate = new Date(dateString)
  const now = new Date()
  
  if (targetDate < now) {
    return 'Ended'
  }
  
  const diffMs = targetDate - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  }
  
  const diffMins = Math.floor(diffMs / (1000 * 60))
  return `${diffMins} min${diffMins > 1 ? 's' : ''}`
}

// This function is now defined above with the other helper functions

function handleImageError(event) {
  // Hide the image container if the image fails to load
  const imageContainer = event.target.parentElement
  const placeholder = imageContainer.parentElement.querySelector('.event-image-placeholder')
  if (placeholder) {
    imageContainer.style.display = 'none'
    placeholder.style.display = 'flex'
  }
}

function handleImageLoad(event) {
  // Hide loading spinner when image loads
  const loadingSpinner = event.target.parentElement.querySelector('.image-loading')
  if (loadingSpinner) {
    loadingSpinner.style.display = 'none'
  }
}
</script>

<template>
  <div class="event-list">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Loading events...</span>
    </div>
    <div v-else-if="error" class="error">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <span>{{ error }}</span>
    </div>
    <div v-else>
      <div class="event-controls">
        <div class="filter-buttons">
          <button 
            :class="['btn-tab', { active: filterActive === 'upcoming' }]" 
            @click="filterActive = 'upcoming'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Upcoming</span>
            <span v-if="upcomingEvents.length > 0" class="badge">{{ upcomingEvents.length }}</span>
          </button>
          <button 
            :class="['btn-tab', { active: filterActive === 'ongoing' }]" 
            @click="filterActive = 'ongoing'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Ongoing</span>
            <span v-if="ongoingEvents.length > 0" class="badge">{{ ongoingEvents.length }}</span>
          </button>
          <button 
            :class="['btn-tab', { active: filterActive === 'past' }]" 
            @click="filterActive = 'past'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 16 12 12 8 10"></polyline>
            </svg>
            <span>Past</span>
            <span v-if="pastEvents.length > 0" class="badge">{{ pastEvents.length }}</span>
          </button>
          <button 
            :class="['btn-tab', { active: filterActive === 'all' }]" 
            @click="filterActive = 'all'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span>All</span>
            <span v-if="events.length > 0" class="badge">{{ events.length }}</span>
          </button>
        </div>
        
        <div class="selection-controls">
          <button 
            class="btn btn-secondary select-all-btn" 
            @click="selectAllVisible" 
            v-if="filteredEvents.length > 0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            {{ selectedEvents.size === filteredEvents.length ? 'Deselect All' : 'Select All' }}
          </button>
          <button 
            v-if="selectedEvents.size > 0" 
            class="btn delete-btn" 
            @click="deleteSelectedEvents"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete ({{ selectedEvents.size }})
          </button>
        </div>
      </div>
      
      <div v-if="filteredEvents.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <path d="M8 14h.01"></path>
            <path d="M12 14h.01"></path>
            <path d="M16 14h.01"></path>
            <path d="M8 18h.01"></path>
            <path d="M12 18h.01"></path>
            <path d="M16 18h.01"></path>
          </svg>
        </div>
        <h3>No {{ filterActive }} events found</h3>
        <p class="subtitle">Create a new event for your conservation initiative to get started</p>
        <button class="btn btn-primary create-event-btn" @click="$emit('create-event')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create New Event
        </button>
      </div>
      
      <div v-else class="events">
        <div 
          v-for="event in filteredEvents" 
          :key="event.id" 
          class="event-card"
          :class="{ 
            'past-event': getEventStatus(event) === 'past', 
            'ongoing-event': getEventStatus(event) === 'ongoing',
            'selected': selectedEvents.has(event.id) 
          }"
        >
          <div class="event-select">
            <input 
              type="checkbox" 
              :checked="selectedEvents.has(event.id)"
              @change="toggleEventSelection(event.id)"
              class="styled-checkbox"
              :id="`event-${event.id}`"
            />
            <label :for="`event-${event.id}`" class="checkbox-label"></label>
          </div>

          <div class="event-date-badge">
            <div class="date-badge">
              <div class="month">{{ new Date(event.start_date).toLocaleString('en-US', { month: 'short' }).toUpperCase() }}</div>
              <div class="day">{{ new Date(event.start_date).getDate() }}</div>
              <div class="year">{{ new Date(event.start_date).getFullYear() }}</div>
            </div>
          </div>

          <div v-if="event.image_url" class="event-image">
            <img 
              :src="event.image_url" 
              :alt="event.title"
              class="event-image-img"
              @error="handleImageError"
              @load="handleImageLoad"
              loading="lazy"
            />
            <div class="image-loading">
              <div class="loading-spinner"></div>
            </div>
          </div>

          <div v-if="!event.image_url" class="event-image-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </div>
          
          <div class="event-content">
            <div class="event-header">
              <h3 class="event-title">{{ event.title }}</h3>
              <div class="event-status" :class="getEventStatus(event)">
                {{ getEventStatusText(event) }}
              </div>
            </div>
            
            <div class="event-details">
              <div class="event-dates">
                <div class="date-item">
                  <svg class="date-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <div class="date-content">
                    <div class="date-label">Starts</div>
                    <div class="date-value">{{ formatDate(event.start_date) }}</div>
                  </div>
                </div>
                
                <div class="date-item">
                  <svg class="date-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <div class="date-content">
                    <div class="date-label">Ends</div>
                    <div class="date-value">{{ formatDate(event.end_date) }}</div>
                  </div>
                </div>
              </div>
              
              <div v-if="getEventStatus(event) === 'upcoming'" class="time-remaining upcoming">
                <svg class="time-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 2h4"></path>
                  <path d="M12 14v-4"></path>
                  <path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6"></path>
                  <path d="M9 17H4v5"></path>
                </svg>
                <span>{{ getTimeRemaining(event.end_date) }} remaining</span>
              </div>
              <div v-if="getEventStatus(event) === 'ongoing'" class="time-remaining ongoing">
                <svg class="time-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Event in progress</span>
              </div>
            </div>
            
            <div v-if="event.description" class="event-description">
              <p>{{ event.description && event.description.length > 120 ? event.description.substring(0, 120) + '...' : event.description }}</p>
            </div>

            <div class="event-actions">
              <button class="btn btn-icon btn-edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button class="btn btn-icon btn-danger">
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
    </div>
  </div>

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

.event-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  background: linear-gradient(to right, rgba(15, 23, 42, 0.03), rgba(15, 23, 42, 0.01));
  padding: var(--space-md);
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(8px);
}

.filter-buttons {
  display: flex;
  gap: var(--space-xs);
}

.btn-tab {
  display: inline-flex;
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
}

.btn-tab:hover {
  background: rgba(15, 23, 42, 0.04);
  color: var(--color-text);
}

.btn-tab.active {
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

.btn-tab.active .badge {
  background: rgba(0, 220, 130, 0.12);
  color: var(--color-primary);
}

.events {
  display: grid;
  gap: var(--space-md);
}

.event-card {
  position: relative;
  background: linear-gradient(to right, #ffffff, #fafbff);
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: start;
  gap: var(--space-lg);
  padding: var(--space-lg);
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(15, 23, 42, 0.12);
  background: linear-gradient(to right, #ffffff, #f8faff);
}

.event-card.ongoing-event {
  border-left: 4px solid #3b82f6;
}

.event-card.past-event {
  opacity: 0.8;
}

.event-date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.date-badge {
  text-align: center;
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.12), rgba(0, 220, 130, 0.05));
  padding: var(--space-sm);
  border-radius: var(--border-radius);
  color: var(--color-primary);
  box-shadow: 0 2px 4px rgba(0, 220, 130, 0.1);
  border: 1px solid rgba(0, 220, 130, 0.1);
}

.date-badge .month {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-badge .day {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 2px 0;
  color: var(--color-primary-dark, #059669);
}

.date-badge .year {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.event-image {
  width: 120px;
  height: 80px;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.event-image-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
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
  transition: opacity 0.3s ease;
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

.event-card:hover .event-image-img {
  transform: scale(1.05);
}

.event-image-placeholder {
  width: 120px;
  height: 80px;
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
  color: var(--color-secondary, #1a202c);
  font-weight: 600;
  font-size: var(--font-size-lg);
  line-height: 1.4;
  margin-bottom: var(--space-xs);
}

.event-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(0, 220, 130, 0.12);
  color: var(--color-primary, #10b981);
}

.event-status.past {
  background: rgba(100, 116, 139, 0.12);
  color: var(--color-text-secondary, #64748b);
}

.event-status.ongoing {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}

.event-status.upcoming {
  background: rgba(0, 220, 130, 0.12);
  color: var(--color-primary, #10b981);
}

.event-details {
  display: flex;
  gap: var(--space-xl);
  margin: var(--space-md) 0;
  background: rgba(255, 255, 255, 0.6);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.event-dates {
  display: grid;
  gap: var(--space-sm);
}

.date-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-text-secondary);
}

.date-icon {
  color: var(--color-primary);
}

.date-content {
  display: flex;
  flex-direction: column;
}

.date-label {
  font-size: 0.8rem;
  color: #666;
}

.time-remaining {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.time-remaining.upcoming {
  background: rgba(0, 220, 130, 0.1);
  color: var(--color-primary);
}

.time-remaining.ongoing {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.event-actions {
  display: flex;
  gap: var(--space-xs);
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
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
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
  border-color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: var(--space-2xl);
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  border-radius: var(--border-radius-lg);
  border: 1px dashed rgba(15, 23, 42, 0.1);
  box-shadow: var(--shadow-sm);
}

.empty-state-icon {
  color: var(--color-primary);
  opacity: 0.7;
  margin-bottom: var(--space-md);
  filter: drop-shadow(0 2px 4px rgba(0, 220, 130, 0.2));
}

.empty-state h3 {
  font-size: var(--font-size-xl);
  color: var(--color-text);
  margin: 0 0 var(--space-xs);
  font-weight: 600;
}

.empty-state .subtitle {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-lg);
  font-size: var(--font-size-md);
}

.create-event-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 220, 130, 0.2);
}

.create-event-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 220, 130, 0.25);
}

@media (max-width: 768px) {
  .event-controls {
    flex-direction: column;
    gap: var(--space-md);
    align-items: stretch;
  }

  .filter-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .event-card {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .event-image {
    width: 100%;
    height: 120px;
    grid-row: 2;
  }

  .event-image-placeholder {
    width: 100%;
    height: 120px;
    grid-row: 2;
  }

  .event-date-badge {
    grid-row: 1;
  }

  .event-content {
    grid-row: 3;
  }

  .event-details {
    flex-direction: column;
    gap: var(--space-md);
  }

  .event-actions {
    justify-content: flex-start;
    margin-top: var(--space-md);
  }
}
</style>
