import './assets/main.css'
import './assets/transactions-styles.css'
import './assets/enhanced.css'
import './assets/event-styles.css'
import './assets/button-styles.css'
import './assets/footer-styles.css'
import './assets/card-styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import { supabase } from './supabase'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store and validate session
const authStore = useAuthStore()
let refreshInterval = null

// Initialize session and setup refresh
const initializeSession = async () => {
  try {
    await authStore.initializeSession()

    // Only setup refresh if we have a valid session
    if (authStore.isAuthenticated) {
      refreshInterval = setInterval(async () => {
        try {
          await authStore.refreshSession()
        } catch (error) {
          console.error('Failed to refresh session:', error)
          clearInterval(refreshInterval)
        }
      }, 300000) // 5 minutes
      
      // Register auth state change listener for better session handling
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          authStore.setSession(session.user, session, session.expires_in)
        } else if (event === 'SIGNED_OUT') {
          authStore.clearSession()
        } else if (event === 'USER_UPDATED' && session) {
          authStore.setSession(session.user, session, session.expires_in)
        }
      })
    }
  } catch (error) {
    console.error('Failed to initialize session:', error)
  }
}

// Initialize session before mounting
initializeSession()

// Clear interval and cleanup on app unmount
app.config.globalProperties.$onAppUnmount = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
}

app.mount('#app')
