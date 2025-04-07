<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

interface Props {
  isMenuOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['toggle-menu'])
const authStore = useAuthStore()

const menuAriaLabel = computed(() => (props.isMenuOpen ? 'Close menu' : 'Open menu'))
</script>

<template>
  <header>
    <nav class="navbar" aria-label="Main navigation">
      <div class="container">
        <div class="nav-brand">
          <img src="../../assets/logo.svg" alt="Rhino Bond Logo" class="logo" />
          <span class="brand-name">Rhino Bond</span>
        </div>
        <div class="nav-links" :class="{ open: isMenuOpen }" :aria-expanded="isMenuOpen">
          <router-link to="/" class="nav-item" aria-current="page">Home</router-link>
          <router-link to="/qr-codes" class="nav-item">QR Codes</router-link>
          <router-link to="/events" class="nav-item">Events</router-link>
          <router-link to="/users" class="nav-item">User Management</router-link>
          <router-link to="/products" class="nav-item">Products</router-link>
          <router-link
            to="/points-airdrop"
            class="nav-item"
            exact-active-class="router-link-exact-active"
          >
            Points Airdrop
          </router-link>
          <router-link
            to="/transactions"
            class="nav-item"
            exact-active-class="router-link-exact-active"
          >
            Transactions
          </router-link>
          <router-link
            to="/contact-messages"
            class="nav-item"
            exact-active-class="router-link-exact-active"
          >
            Contact Messages
          </router-link>
          <router-link
            to="/pan-verification"
            class="nav-item"
            exact-active-class="router-link-exact-active"
          >
            PAN Verification
          </router-link>
          <router-link to="/auth" class="nav-item">Authentication</router-link>
        </div>
        <button
          class="menu-toggle"
          @click="emit('toggle-menu')"
          :aria-label="menuAriaLabel"
          :aria-expanded="isMenuOpen"
        >
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </nav>
  </header>
</template>

<style scoped>
header {
  background-color: var(--color-secondary);
  padding: var(--space-md) 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: var(--shadow-sm);
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-lg);
  padding: 0 var(--space-xl);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.logo {
  height: 40px;
  width: auto;
}

.brand-name {
  color: var(--color-text-inverse);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
}

.nav-links {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xs);
}

.menu-toggle .bar {
  display: block;
  width: 25px;
  height: 3px;
  background-color: var(--color-text-inverse);
  margin: 4px 0;
  transition: var(--transition);
}

.nav-item {
  color: var(--color-text-inverse);
  text-decoration: none;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  transition: var(--transition);
}

.nav-item:hover {
  background-color: color-mix(in srgb, var(--color-secondary), white 10%);
}

.nav-item.router-link-exact-active {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

@media (max-width: 1024px) {
  .navbar .container {
    padding: 0 var(--space-lg);
  }
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }

  .nav-links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--color-secondary);
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-md);
    display: none;
    box-shadow: var(--shadow-md);
  }

  .nav-links.open {
    display: flex;
  }

  .nav-item {
    padding: var(--space-sm);
    text-align: center;
  }
}
</style>
