<script setup lang="ts">
import { ref } from 'vue'
import BaseLayout from './components/layout/BaseLayout.vue'
import './assets/variables.css'
import './assets/main.css'

const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <BaseLayout :is-menu-open="isMenuOpen" @toggle-menu="toggleMenu" />
</template>
