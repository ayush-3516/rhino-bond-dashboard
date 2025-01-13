<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'

defineProps<{
  isMenuOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-menu'): void
}>()
</script>

<template>
  <div class="app-layout">
    <AppHeader :is-menu-open="isMenuOpen" @toggle-menu="emit('toggle-menu')" />

    <main class="container">
      <RouterView />
    </main>

    <AppFooter />
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
}

main {
  margin-top: var(--space-xl);
  margin-bottom: var(--space-xxl);
}

.container {
  padding: var(--space-xl);
  max-width: 1440px;
  margin: 0 auto;
  flex: 1;
}

@media (max-width: 1440px) {
  .container {
    padding: var(--space-xl);
  }
}

@media (max-width: 1024px) {
  .container {
    padding: var(--space-lg) var(--space-md);
  }
}

@media (max-width: 768px) {
  .container {
    padding: var(--space-md) var(--space-sm);
  }
}
</style>
