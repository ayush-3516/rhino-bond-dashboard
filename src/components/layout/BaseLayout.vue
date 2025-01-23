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
  <div class="app-layout flex flex-col min-h-screen">
    <AppHeader :is-menu-open="isMenuOpen" @toggle-menu="emit('toggle-menu')" />

    <main class="container space-xl">
      <RouterView />
    </main>

    <AppFooter class="mt-auto" />
  </div>
</template>

<style scoped>
.app-layout {
  background-color: var(--color-background);
  color: var(--color-text);
  scroll-behavior: smooth;
}
</style>
