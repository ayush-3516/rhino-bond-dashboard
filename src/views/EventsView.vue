<script setup>
import { onMounted } from 'vue'
import EventForm from '@/components/events/EventForm.vue'
import EventList from '@/components/events/EventList.vue'
import { useEventStore } from '@/stores/event'

const eventStore = useEventStore()

onMounted(async () => {
  await eventStore.fetchEvents()
})
</script>

<template>
  <div class="events-view">
    <h1>Event Management</h1>
    <div class="content">
      <div class="form-section">
        <h2>Create New Event</h2>
        <EventForm @event-created="eventStore.fetchEvents()" />
      </div>
      <div class="list-section">
        <h2>Upcoming Events</h2>
        <EventList />
      </div>
    </div>
  </div>
</template>

<style scoped>
.events-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.form-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #42b983;
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
