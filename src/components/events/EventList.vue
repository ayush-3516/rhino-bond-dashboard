<script setup>
import { computed } from 'vue'
import { useEventStore } from '@/stores/event'

const eventStore = useEventStore()

const events = computed(() => eventStore.events)
const loading = computed(() => eventStore.loading)
const error = computed(() => eventStore.error)

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
      <div v-if="events.length === 0" class="no-events">No upcoming events found</div>
      <div v-else class="events">
        <div v-for="event in events" :key="event.id" class="event-item">
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
</template>

<style scoped>
.event-list {
  width: 100%;
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
</style>
