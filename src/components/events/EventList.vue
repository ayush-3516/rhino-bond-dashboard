<script setup>
import { computed, ref } from 'vue'
import { useEventStore } from '@/stores/event'
import ConfirmModal from '@/components/ConfirmModal.vue'

const eventStore = useEventStore()
const selectedEvents = ref(new Set())

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

const upcomingEvents = computed(() => 
  events.value.filter(event => new Date(event.end_date) > new Date())
)

const pastEvents = computed(() =>
  events.value
    .filter(event => new Date(event.end_date) <= new Date())
    .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
)

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
</script>

<template>
  <div class="event-list">
    <div v-if="loading" class="loading">Loading events...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else>
      <div class="events-section">
        <h2>Upcoming Events</h2>
        <div v-if="upcomingEvents.length === 0" class="no-events">No upcoming events found</div>
        <div v-else class="events">
          <div v-for="event in upcomingEvents" :key="event.id" class="event-item">
            <div class="event-checkbox">
              <input 
                type="checkbox" 
                :checked="selectedEvents.has(event.id)"
                @change="toggleEventSelection(event.id)"
              />
            </div>
            <div class="event-header">
            <h3 class="event-title">{{ event.title }}</h3>
            <div class="event-dates">
              <div class="event-date">
                <span class="date-label">Start:</span> {{ formatDate(event.start_date) }}
              </div>
              <div class="event-date">
                <span class="date-label">End:</span> {{ formatDate(event.end_date) }}
              </div>
            </div>
          </div>
          <div v-if="event.image_url" class="event-image">
            <img :src="event.image_url" :alt="event.title" />
          </div>
          <div class="event-description" v-if="event.description">
            {{ event.description }}
          </div>
        </div>
      </div>
      </div>

      <div class="events-section" v-if="pastEvents.length > 0">
        <h2>Past Events</h2>
        <div class="events">
          <div v-for="event in pastEvents" :key="event.id" class="event-item past-event">
            <div class="event-checkbox">
              <input 
                type="checkbox" 
                :checked="selectedEvents.has(event.id)"
                @change="toggleEventSelection(event.id)"
              />
            </div>
            <div class="event-header">
              <h3 class="event-title">{{ event.title }}</h3>
              <div class="event-dates">
                <div class="event-date">
                  <span class="date-label">Start:</span> {{ formatDate(event.start_date) }}
                </div>
                <div class="event-date">
                  <span class="date-label">End:</span> {{ formatDate(event.end_date) }}
                </div>
              </div>
            </div>
            <div v-if="event.image_url" class="event-image">
              <img :src="event.image_url" :alt="event.title" />
            </div>
            <div class="event-description" v-if="event.description">
              {{ event.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="selectedEvents.size > 0" class="delete-actions">
      <button class="delete-button" @click="deleteSelectedEvents">
        Delete Selected ({{ selectedEvents.size }})
      </button>
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
      Are you sure you want to delete {{ selectedEvents.size }} selected event(s)?
      This action cannot be undone.
    </template>
  </ConfirmModal>
</template>

<style scoped>
.event-list {
  width: 100%;
  position: relative;
}

.event-checkbox {
  position: absolute;
  left: -1.5rem;
  top: 1rem;
}

.delete-actions {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 100;
}

.delete-button {
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.delete-button:hover {
  background-color: #cc0000;
}

.event-item {
  position: relative;
}

.loading,
.error,
.no-events {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.error {
  color: #ff4444;
}

.events {
  display: grid;
  gap: 1rem;
}

.event-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.event-title {
  margin: 0;
  color: #2c3e50;
}

.event-dates {
  text-align: right;
}

.event-date {
  color: #666;
  font-size: 0.9rem;
}

.date-label {
  font-weight: bold;
  color: #42b983;
}

.event-image {
  margin: 1rem 0;
}

.event-image img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 4px;
}

.event-description {
  color: #666;
  line-height: 1.5;
}

.events-section {
  margin-bottom: 2rem;
}

.events-section h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.past-event {
  opacity: 0.7;
}

.past-event .event-title {
  color: #666;
}

.past-event .event-date {
  color: #999;
}

.past-event .event-description {
  color: #999;
}
</style>
