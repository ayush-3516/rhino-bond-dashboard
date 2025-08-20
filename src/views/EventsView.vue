<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import EventForm from '@/components/events/EventForm.vue'
import EventList from '@/components/events/EventList.vue'
import EventListOptimized from '@/components/events/EventListOptimized.vue'
import EventPerformanceMonitor from '@/components/events/EventPerformanceMonitor.vue'
import { useEventStore } from '@/stores/event'
import { useEventPerformance } from '@/composables/useEventPerformance'

const eventStore = useEventStore()
const showForm = ref(false)
const showPerformanceMonitor = ref(false)
const useOptimizedList = ref(true) // Toggle for A/B testing

// Performance monitoring
const { metrics, measurePerformance } = useEventPerformance()

// Computed properties for better performance
const events = computed(() => eventStore.events)
const loading = computed(() => eventStore.loading)
const error = computed(() => eventStore.error)

// Enhanced onMounted with performance measurement
onMounted(async () => {
  const fetchEvents = measurePerformance('render', async () => {
    await eventStore.fetchEvents()
  })
  
  await fetchEvents()
})

// Watch for events changes to update stats
watch(events, (newEvents) => {
  // Trigger any necessary updates when events change
}, { deep: true })

function toggleForm() {
  showForm.value = !showForm.value
}

function togglePerformanceMonitor() {
  showPerformanceMonitor.value = !showPerformanceMonitor.value
}

function toggleOptimizedList() {
  useOptimizedList.value = !useOptimizedList.value
}

// Event handlers
function handleCreateEvent() {
  showForm.value = true
}

function handleEditEvent(event) {
  // Handle edit event
  console.log('Edit event:', event)
}

// Enhanced stats computation
const upcomingEventsCount = computed(() => 
  events.value.filter(e => new Date(e.start_date) > new Date()).length
)

const ongoingEventsCount = computed(() => {
  const now = new Date()
  return events.value.filter(e => {
    const startDate = new Date(e.start_date)
    const endDate = new Date(e.end_date)
    return now >= startDate && now <= endDate
  }).length
})

const pastEventsCount = computed(() => 
  events.value.filter(e => new Date(e.end_date) <= new Date()).length
)

const totalEventsCount = computed(() => events.value.length)
</script>

<template>
  <div class="events-view">
    <!-- Enhanced Header Section -->
    <header class="events-header">
      <div class="header-background">
        <div class="header-pattern"></div>
        <div class="header-glow"></div>
        <div class="header-particles"></div>
      </div>
      
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="header-text">
            <h1>Event Management</h1>
            <p class="header-subtitle">Create and manage events for your conservation initiatives</p>
            <div class="header-stats">
              <span class="stat-item" :class="{ 'highlight': totalEventsCount > 0 }">
                <span class="stat-number">{{ totalEventsCount }}</span>
                <span class="stat-label">Total Events</span>
              </span>
              <span class="stat-item" :class="{ 'highlight': upcomingEventsCount > 0 }">
                <span class="stat-number">{{ upcomingEventsCount }}</span>
                <span class="stat-label">Upcoming</span>
              </span>
              <span class="stat-item" :class="{ 'highlight': ongoingEventsCount > 0 }">
                <span class="stat-number">{{ ongoingEventsCount }}</span>
                <span class="stat-label">Ongoing</span>
              </span>
              <span class="stat-item" :class="{ 'highlight': pastEventsCount > 0 }">
                <span class="stat-number">{{ pastEventsCount }}</span>
                <span class="stat-label">Past</span>
              </span>
            </div>
          </div>
        </div>
        
        <div class="header-actions">
          <button 
            class="action-btn btn-secondary" 
            @click="togglePerformanceMonitor"
            :class="{ 'active': showPerformanceMonitor }"
            title="Toggle Performance Monitor"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v5h5"></path>
              <path d="M21 21v-5h-5"></path>
              <path d="M21 7.5a9.5 9.5 0 1 0-6.5 9.3"></path>
            </svg>
            <span>{{ showPerformanceMonitor ? 'Hide Monitor' : 'Performance' }}</span>
          </button>
          
          <button 
            class="action-btn btn-secondary" 
            @click="toggleOptimizedList"
            :class="{ 'active': useOptimizedList }"
            title="Toggle Optimized List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 3l4 4-4 4"></path>
              <path d="M21 7H9"></path>
              <path d="M8 17l-4-4 4-4"></path>
              <path d="M3 13h12"></path>
            </svg>
            <span>{{ useOptimizedList ? 'Standard' : 'Optimized' }}</span>
          </button>
          
          <button class="action-btn btn-primary create-event-btn" @click="toggleForm">
            <svg v-if="!showForm" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="12"></line>
            </svg>
            <span>{{ showForm ? 'Hide Form' : 'Create Event' }}</span>
          </button>
        </div>
      </div>
    </header>

    <div class="content">
      <!-- Performance Monitor Section -->
      <transition name="slide-fade">
        <div v-if="showPerformanceMonitor" class="monitor-section">
          <EventPerformanceMonitor />
        </div>
      </transition>
      
      <!-- Event Form Section -->
      <transition name="slide-fade">
        <div v-if="showForm" class="form-section">
          <div class="form-card">
            <div class="form-card-header">
              <div class="form-header-content">
                <div class="form-header-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <div>
                  <h2>Create New Event</h2>
                  <p>Fill in the details below to create a new event</p>
                </div>
              </div>
              <button class="close-btn" @click="showForm = false">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="12"></line>
                </svg>
              </button>
            </div>
            <div class="form-card-body">
              <EventForm @event-created="eventStore.fetchEvents(); showForm = false" />
            </div>
          </div>
        </div>
      </transition>
      
      <!-- Events List Section -->
      <div class="list-section">
        <div class="list-card">
          <div class="list-card-header">
            <div class="list-header-content">
              <div class="list-header-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h2>Events</h2>
                <p>Manage and organize your events</p>
              </div>
            </div>
            
            <div class="list-header-actions">
              <div class="optimization-indicator" v-if="useOptimizedList">
                <div class="indicator-dot"></div>
                <span class="indicator-text">⚡ Optimized</span>
              </div>
              
              <button class="refresh-btn" @click="eventStore.fetchEvents()" title="Refresh Events">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          <div class="list-card-body">
            <!-- Conditional rendering of optimized vs standard list -->
            <EventListOptimized 
              v-if="useOptimizedList"
              :show-search="true"
              :items-per-page="20"
              @create-event="handleCreateEvent"
              @edit-event="handleEditEvent"
            />
            <EventList 
              v-else
              @create-event="showForm = true" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.events-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-md);
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Enhanced Header Styles */
.events-header {
  margin-bottom: var(--space-2xl);
  background: linear-gradient(135deg, 
    var(--color-primary) 0%, 
    var(--color-primary-dark) 50%,
    #00a854 100%
  );
  border-radius: 24px;
  padding: var(--space-2xl) var(--space-xl);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 20px 40px rgba(0, 220, 130, 0.15),
    0 8px 16px rgba(0, 220, 130, 0.1),
    inset 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.events-header:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 25px 50px rgba(0, 220, 130, 0.2),
    0 12px 24px rgba(0, 220, 130, 0.15),
    inset 0 1px rgba(255, 255, 255, 0.25);
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
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
  opacity: 0.7;
  animation: patternShift 20s ease-in-out infinite alternate;
}

.header-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: glowPulse 8s ease-in-out infinite;
}

.header-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.1;
  pointer-events: none;
}

.header-particles::before,
.header-particles::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.header-particles::before {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.header-particles::after {
  top: 60%;
  right: 15%;
  animation-delay: 3s;
}

@keyframes patternShift {
  0% { transform: translateX(-3%) translateY(-3%) scale(1.02); }
  100% { transform: translateX(3%) translateY(3%) scale(0.98); }
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
  25% { transform: translateY(-20px) translateX(10px); opacity: 1; }
  50% { transform: translateY(-10px) translateX(-5px); opacity: 0.8; }
  75% { transform: translateY(-15px) translateX(15px); opacity: 0.9; }
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-xl);
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
  flex: 1;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.header-icon:hover {
  transform: scale(1.05) rotate(5deg);
  background: rgba(255, 255, 255, 0.2);
}

.header-text h1 {
  color: #ffffff;
  margin: 0 0 var(--space-sm) 0;
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 var(--space-lg) 0;
  font-size: 1.125rem;
  line-height: 1.6;
  font-weight: 500;
  max-width: 500px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.header-stats {
  display: flex;
  gap: var(--space-lg);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 80px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-item:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.stat-item.highlight {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  white-space: nowrap;
  min-width: 140px;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.action-btn:hover::before {
  left: 100%;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.btn-secondary.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-primary-dark);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.create-event-btn {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  font-weight: 700;
  padding: var(--space-md) var(--space-xl);
}

.create-event-btn:hover {
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px) scale(1.02);
}

/* Content Sections */
.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.monitor-section {
  animation: slideInFromTop 0.4s ease-out;
}

.form-section {
  animation: slideInFromTop 0.4s ease-out;
}

/* Enhanced Card Styles */
.form-card,
.list-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 
    0 4px 6px rgba(15, 23, 42, 0.05),
    0 2px 4px rgba(15, 23, 42, 0.03),
    0 0 0 1px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(15, 23, 42, 0.06);
  position: relative;
}

.form-card:hover,
.list-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 12px rgba(15, 23, 42, 0.08),
    0 4px 8px rgba(15, 23, 42, 0.04),
    0 0 0 1px rgba(15, 23, 42, 0.08);
}

.form-card::before,
.list-card::before {
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

.form-card:hover::before,
.list-card:hover::before {
  opacity: 1;
}

.form-card-header,
.list-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl) var(--space-xl) var(--space-lg) var(--space-xl);
  background: linear-gradient(to right, 
    rgba(15, 23, 42, 0.02),
    rgba(15, 23, 42, 0.01)
  );
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.form-header-content,
.list-header-content {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.form-header-icon,
.list-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-radius: 12px;
  color: white;
  transition: all 0.3s ease;
}

.form-header-icon:hover,
.list-header-icon:hover {
  transform: scale(1.05);
}

.form-card-header h2,
.list-card-header h2 {
  color: var(--color-text);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 var(--space-xs) 0;
  line-height: 1.2;
}

.form-card-header p,
.list-card-header p {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: rgba(15, 23, 42, 0.05);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: rgba(15, 23, 42, 0.1);
  color: var(--color-text);
  transform: rotate(90deg);
}

.form-card-body,
.list-card-body {
  padding: var(--space-xl);
  background: #ffffff;
}

.list-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.optimization-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(0, 220, 130, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(0, 220, 130, 0.2);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  animation: pulse 2s infinite;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: rgba(15, 23, 42, 0.05);
  color: var(--color-text-secondary);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: rgba(15, 23, 42, 0.1);
  border-color: rgba(15, 23, 42, 0.15);
  color: var(--color-text);
  transform: translateY(-1px);
}

/* Enhanced Animations */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .events-view {
    max-width: 100%;
    padding: var(--space-lg) var(--space-md);
  }
  
  .header-content {
    flex-direction: column;
    gap: var(--space-lg);
  }
  
  .header-actions {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .events-view {
    padding: var(--space-md);
  }
  
  .events-header {
    padding: var(--space-xl) var(--space-lg);
    border-radius: 16px;
  }
  
  .header-left {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-md);
  }
  
  .header-icon {
    width: 56px;
    height: 56px;
  }
  
  .header-text h1 {
    font-size: 2rem;
  }
  
  .header-subtitle {
    font-size: 1rem;
  }
  
  .header-stats {
    justify-content: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .action-btn {
    min-width: auto;
    flex: 1;
    justify-content: center;
  }
  
  .form-card-header,
  .list-card-header {
    flex-direction: column;
    gap: var(--space-md);
    align-items: stretch;
    text-align: center;
  }
  
  .list-header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .form-card-body,
  .list-card-body {
    padding: var(--space-lg);
  }
}

@media (max-width: 480px) {
  .events-header {
    padding: var(--space-lg) var(--space-md);
  }
  
  .header-text h1 {
    font-size: 1.75rem;
  }
  
  .header-stats {
    flex-direction: column;
    gap: var(--space-sm);
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>
