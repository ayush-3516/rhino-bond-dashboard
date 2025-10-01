<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from './AppHeader.vue'
import NotificationToast from '../NotificationToast.vue'

defineProps<{
  isMenuOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-menu'): void
}>()

// Scroll to top button visibility
const showScrollTop = ref(false)

const checkScroll = () => {
  showScrollTop.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <div class="app-layout">
    <AppHeader :is-menu-open="isMenuOpen" @toggle-menu="emit('toggle-menu')" />

    <main class="main-content">
      <div class="page-container">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </div>
      
      <!-- Scroll to top button -->
      <button v-show="showScrollTop" @click="scrollToTop" class="scroll-top-btn" aria-label="Scroll to top">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </main>

    <NotificationToast />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
  scroll-behavior: smooth;
  position: relative;
  font-family: var(--font-family);
}

.main-content {
  flex: 1;
  padding: 1.5rem 0;
  position: relative;
}

.main-content::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.02) 0%, rgba(15, 23, 42, 0) 100%);
  z-index: 0;
  pointer-events: none;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
  padding: 0 var(--space-md);
}

/* Add subtle grain texture to background */
/* Removed the large decorative background element that was causing UI issues */

/* Hide any large decorative elements that might be appearing */
.app-layout::before,
.app-layout::after,
.main-content::before,
.main-content::after,
.page-container::before,
.page-container::after {
  display: none !important;
}

/* Hide any large circular or semi-circular objects */
[class*="circle"],
[class*="circular"],
[class*="semi"],
[class*="arc"],
[class*="ring"] {
  display: none !important;
}

/* Hide any elements with large border-radius that might create circular shapes */
[style*="border-radius: 50%"],
[style*="border-radius: 50px"],
[style*="border-radius: 100px"],
[style*="border-radius: 200px"] {
  display: none !important;
}

/* Hide any large decorative elements with specific dimensions */
[style*="width: 100vw"],
[style*="height: 100vh"],
[style*="width: 100%"],
[style*="height: 100%"] {
  max-width: 100% !important;
  max-height: 100% !important;
}

/* Scroll to top button */
.scroll-top-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  opacity: 0.9;
}

.scroll-top-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 220, 130, 0.3);
  opacity: 1;
}

.scroll-top-btn svg {
  transition: transform 0.2s ease;
}

.scroll-top-btn:hover svg {
  transform: translateY(-2px);
}

/* Page transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .main-content {
    padding: 0.5rem 0;
  }
  
  .scroll-top-btn {
    bottom: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
  }
}
</style>
