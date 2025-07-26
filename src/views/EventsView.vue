<script setup>
import { onMounted, ref } from 'vue'
import EventForm from '@/components/events/EventForm.vue'
import EventList from '@/components/events/EventList.vue'
import { useEventStore } from '@/stores/event'

const eventStore = useEventStore()
const showForm = ref(false)

onMounted(async () => {
  await eventStore.fetchEvents()
})

function toggleForm() {
  showForm.value = !showForm.value
}
</script>

<template>
  <div class="events-view">
    <header class="events-header">
      <div class="header-pattern"></div>
      <div class="header-content">
        <div class="header-title">
          <h1>Event Management</h1>
          <p class="header-subtitle">Create and manage events for your conservation initiatives</p>
        </div>
        <button class="btn btn-primary toggle-form-btn" @click="toggleForm">
          <span>{{ showForm ? 'Hide Form' : 'Create New Event' }}</span>
          <svg v-if="!showForm" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="header-accent"></div>
    </header>

    <div class="content">
      <transition name="slide-fade">
        <div v-if="showForm" class="form-section">
          <div class="card card-form">
            <div class="card-header">
              <h2>Create New Event</h2>
              <button class="btn-close" @click="showForm = false">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="card-body">
              <EventForm @event-created="eventStore.fetchEvents(); showForm = false" />
            </div>
          </div>
        </div>
      </transition>
      
      <div class="list-section">
        <div class="card card-accent">
          <div class="card-header">
            <h2>Events</h2>
            <div class="card-actions">
              <button class="btn btn-secondary btn-sm" @click="eventStore.fetchEvents()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
                </svg>
                Refresh
              </button>
            </div>
          </div>
          <div class="card-body">
            <EventList @create-event="showForm = true" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.events-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-md);
}

.events-header {
  margin-bottom: var(--space-xl);
  background: linear-gradient(135deg, 
    var(--color-primary) 0%, 
    var(--color-primary-dark) 100%
  );
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius-lg);
  padding: var(--space-xl) var(--space-lg);
  position: relative;
  overflow: hidden;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 10px 30px rgba(0, 220, 130, 0.15),
    0 2px 4px rgba(0, 220, 130, 0.1),
    inset 0 1px rgba(255, 255, 255, 0.2);
}

.events-header:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 15px 35px rgba(0, 220, 130, 0.25),
    inset 0 1px rgba(255, 255, 255, 0.3);
}

.header-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 150%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% -50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
    linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 0.6;
  animation: patternShift 15s ease-in-out infinite alternate;
  z-index: -1;
}

@keyframes patternShift {
  0% { transform: translateX(-5%) translateY(-5%) scale(1.05); }
  100% { transform: translateX(5%) translateY(5%) scale(0.95); }
}

.header-content {
  position: relative;
  z-index: 2;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  position: relative;
  z-index: 2;
}

h1 {
  color: #ffffff;
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  letter-spacing: -0.5px;
  background: linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0.9));
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.9);
  margin: var(--space-xs) 0 0 0;
  font-size: var(--font-size-md);
  max-width: 500px;
  line-height: 1.5;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.toggle-form-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-xl);
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-primary);
  border: none;
  border-radius: 30px;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
}

.toggle-form-btn:hover {
  transform: translateY(-1px) scale(1.02);
  background: #ffffff;
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.08);
}

.toggle-form-btn:active {
  transform: translateY(0) scale(0.98);
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Card styles */
.card {
  background: linear-gradient(to bottom right, #ffffff, #fafbff);
  border-radius: var(--border-radius-lg);
  box-shadow: 
    0 1px 3px rgba(15, 23, 42, 0.08),
    0 1px 2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(15, 23, 42, 0.06);
  position: relative;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 4px 6px rgba(15, 23, 42, 0.08),
    0 2px 4px rgba(15, 23, 42, 0.05);
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right,
    var(--color-primary),
    var(--color-primary-light)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card:hover::before {
  opacity: 1;
}

.card-form {
  background: linear-gradient(to bottom right, #ffffff, #f8faff);
  border-top: 4px solid var(--color-primary);
  box-shadow: 
    0 4px 6px rgba(15, 23, 42, 0.08),
    0 2px 4px rgba(15, 23, 42, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg) var(--space-xl);
  background: linear-gradient(to right, 
    rgba(15, 23, 42, 0.03),
    rgba(15, 23, 42, 0.01)
  );
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.card-header h2 {
  color: var(--color-text);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  background: linear-gradient(to right, 
    var(--color-text),
    var(--color-text-secondary)
  );
  -webkit-background-clip: text;
  background-clip: text;
}

.card-body {
  padding: var(--space-lg);
}

.card-actions {
  display: flex;
  gap: var(--space-sm);
}

.btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: rgba(15, 23, 42, 0.05);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-close:hover {
  background: rgba(15, 23, 42, 0.1);
  color: var(--color-text);
  transform: rotate(90deg);
}

.btn-secondary {
  background: linear-gradient(to bottom right,
    rgba(15, 23, 42, 0.05),
    rgba(15, 23, 42, 0.02)
  );
  border: 1px solid rgba(15, 23, 42, 0.1);
  color: var(--color-text-secondary);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(15, 23, 42, 0.08);
  border-color: rgba(15, 23, 42, 0.15);
  color: var(--color-text);
}

/* Animation for form */
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

@media (prefers-color-scheme: dark) {
  .card {
    background: linear-gradient(to bottom right,
      var(--color-surface-dark, #1f2937),
      rgba(17, 24, 39, 0.95)
    );
    border-color: rgba(255, 255, 255, 0.05);
    box-shadow: 
      0 4px 6px rgba(0, 0, 0, 0.2),
      0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    background: linear-gradient(to right,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.02)
    );
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
  
  .card-header h2 {
    color: #ffffff;
    background: linear-gradient(to right, 
      rgba(255, 255, 255, 0.95),
      rgba(255, 255, 255, 0.8)
    );
    -webkit-background-clip: text;
    background-clip: text;
  }

  .toggle-form-btn {
    background: var(--color-primary);
    color: white;
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.2),
      0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .toggle-form-btn:hover {
    background: var(--color-primary-dark);
    box-shadow: 
      0 4px 6px rgba(0, 0, 0, 0.25),
      0 2px 4px rgba(0, 0, 0, 0.15);
  }
  
  .btn-close {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
  }
  
  .btn-close:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }
}

@media (max-width: 768px) {
  .events-view {
    padding: var(--space-md) var(--space-sm);
  }
  
  .events-header {
    padding: var(--space-lg) var(--space-md);
    margin-bottom: var(--space-lg);
  }
  
  .header-content {
    flex-direction: column;
    gap: var(--space-lg);
    align-items: flex-start;
  }
  
  .toggle-form-btn {
    width: 100%;
    justify-content: center;
    padding: var(--space-md) var(--space-lg);
  }
  
  .card-header {
    padding: var(--space-md);
    flex-direction: column;
    gap: var(--space-sm);
    align-items: flex-start;
  }
  
  .card-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>
