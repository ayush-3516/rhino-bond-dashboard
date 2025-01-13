import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
    },
    {
      path: '/events',
      name: 'events',
      component: () => import('../views/EventsView.vue'),
    },
  ],
})

export default router
