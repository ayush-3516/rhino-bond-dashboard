import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '../supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const sessionExpiry = ref(null)
  let refreshTimeout = null

  // Cross-tab synchronization
  const syncSession = () => {
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth_session') {
        const newSession = JSON.parse(event.newValue)
        if (newSession) {
          user.value = newSession.user
          session.value = newSession.session
          sessionExpiry.value = newSession.expiry
        } else {
          clearSession()
        }
      }
    })
  }

  const isAuthenticated = computed(() => {
    if (!session.value) return false
    if (sessionExpiry.value && Date.now() > sessionExpiry.value) {
      clearSession()
      return false
    }
    return true
  })

  const isAdmin = computed(() => {
    return user.value?.user_metadata?.role === 'admin'
  })

  // Initialize session from storage and validate with Supabase
  const initializeSession = async () => {
    const storedSession = localStorage.getItem('auth_session')
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession)
        if (parsed.expiry && Date.now() > parsed.expiry) {
          clearSession()
          return
        }

        // Validate session with Supabase
        const {
          data: { user: validatedUser },
          error,
        } = await supabase.auth.getUser(parsed.session.access_token)
        if (error) throw error

        user.value = validatedUser
        session.value = parsed.session
        sessionExpiry.value = parsed.expiry
        scheduleRefresh(parsed.expiry - Date.now())
      } catch (error) {
        console.error('Session validation failed:', error)
        clearSession()
      }
    }
  }

  // Schedule automatic session refresh
  const scheduleRefresh = (expiresIn) => {
    if (refreshTimeout) clearTimeout(refreshTimeout)
    // Refresh 5 minutes before expiration
    const refreshTime = expiresIn - 300000
    if (refreshTime > 0) {
      refreshTimeout = setTimeout(() => {
        refreshSession()
      }, refreshTime)
    }
  }

  function setSession(newUser, newSession, expiresIn = 3600) {
    const expiry = Date.now() + expiresIn * 1000
    user.value = newUser
    session.value = newSession
    sessionExpiry.value = expiry
    scheduleRefresh(expiresIn * 1000)

    try {
      const sessionData = JSON.stringify({
        user: newUser,
        session: newSession,
        expiry: expiry,
      })
      localStorage.setItem('auth_session', sessionData)
      // Trigger storage event for other tabs
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'auth_session',
          newValue: sessionData,
        }),
      )
    } catch (error) {
      console.error('Failed to store session:', error)
      throw new Error('Failed to persist session')
    }
  }

  async function clearSession() {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear local state
      user.value = null
      session.value = null
      sessionExpiry.value = null
      
      // Remove from local storage
      localStorage.removeItem('auth_session')
      
      // Trigger storage event for other tabs
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'auth_session',
          newValue: null,
        }),
      )
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  async function refreshSession() {
    if (!session.value) return
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error

      setSession(data.user, data.session)
    } catch (error) {
      console.error('Failed to refresh session:', error)
      clearSession()
    }
  }

  // Initialize session on store creation
  initializeSession()
  syncSession()

  return {
    user,
    session,
    sessionExpiry,
    isAuthenticated,
    isAdmin,
    setSession,
    clearSession,
    refreshSession,
    initializeSession,
  }
})
