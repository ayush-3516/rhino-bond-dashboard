<template>
  <div class="welcome-banner" v-if="shouldShow">
    <div class="welcome-content">
      <div class="welcome-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <div class="welcome-message">
        <h3>Welcome, {{ userName }}!</h3>
        <p>You've successfully signed in to the Rhino Bond Dashboard.</p>
      </div>
      <button @click="dismiss" class="dismiss-btn" aria-label="Dismiss welcome message">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const shouldShow = ref(false)

const userName = computed(() => {
  return authStore.user?.user_metadata?.name || 
         authStore.user?.user_metadata?.full_name || 
         'there'
})

function dismiss() {
  shouldShow.value = false
  localStorage.setItem('welcome_dismissed', Date.now().toString())
}

onMounted(() => {
  // Only show welcome banner if user is newly authenticated and hasn't dismissed it recently
  const lastDismissed = localStorage.getItem('welcome_dismissed')
  const lastLoginTime = localStorage.getItem('last_login_time')
  const currentTime = Date.now()

  // If we have a last login time, and it was more than 1 hour ago, or if this is a first login
  if (!lastLoginTime || (currentTime - parseInt(lastLoginTime)) > 3600000) {
    // And if it wasn't dismissed in the last 10 minutes
    if (!lastDismissed || (currentTime - parseInt(lastDismissed)) > 600000) {
      shouldShow.value = true
    }
  }
  
  // Update last login time
  if (authStore.isAuthenticated) {
    localStorage.setItem('last_login_time', currentTime.toString())
  }
  
  // Auto-dismiss after 10 seconds
  if (shouldShow.value) {
    setTimeout(() => {
      shouldShow.value = false
    }, 10000)
  }
})
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, var(--color-primary), #4CAF50);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
  animation: slideDown 0.5s ease-out;
  position: relative;
}

@keyframes slideDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  position: relative;
}

.welcome-icon {
  background: rgba(255, 255, 255, 0.2);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 1rem;
}

.welcome-icon svg {
  width: 28px;
  height: 28px;
}

.welcome-message h3 {
  margin: 0 0 0.25rem;
  font-weight: 600;
  font-size: 1.25rem;
}

.welcome-message p {
  margin: 0;
  opacity: 0.9;
}

.dismiss-btn {
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dismiss-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dismiss-btn svg {
  width: 14px;
  height: 14px;
}

@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1rem;
  }
  
  .welcome-icon {
    margin-right: 0;
    margin-bottom: 1rem;
  }
  
  .dismiss-btn {
    right: 0.75rem;
    top: 0.75rem;
  }
}
</style>
