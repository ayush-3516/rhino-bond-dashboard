import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/auth',
      name: 'phone-auth',
      component: () => import('../views/PhoneAuth.vue'),
    },
    {
      path: '/qr-codes',
      name: 'qr-codes',
      component: () => import('../views/QrCodePage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/events',
      name: 'events',
      component: () => import('../views/EventsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'user-management',
      component: () => import('../components/UserManagement.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth) {
    // Wait for session initialization to complete
    await authStore.initializeSession()
    
    if (!authStore.isAuthenticated) {
      next({ name: 'phone-auth', query: { redirect: to.fullPath } })
      return
    }
  }
  
  next()
})

export default router
