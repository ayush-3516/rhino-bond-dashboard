<template>
  <div class="products-view">
    <header class="products-header">
      <div class="header-content">
        <h1>Product Management</h1>
        <div class="header-actions">
          <div class="search-box">
            <input type="text" placeholder="Search products..." v-model="searchTerm" />
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      <div class="tabs-container">
        <div class="tabs">
          <button 
            :class="['tab-button', { active: activeTab === 'products' }]"
            @click="activeTab = 'products'"
          >
            <svg v-if="activeTab === 'products'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="12" x2="15" y2="12"></line>
              <line x1="9" y1="15" x2="13" y2="15"></line>
            </svg>
            Products
          </button>
          <button 
            :class="['tab-button', { active: activeTab === 'prices' }]"
            @click="activeTab = 'prices'"
          >
            <svg v-if="activeTab === 'prices'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Prices
          </button>
        </div>
      </div>
    </header>

    <div class="content">
      <transition name="fade" mode="out-in">
        <ProductList v-if="activeTab === 'products'" :searchTerm="searchTerm" />
        <PriceManagement v-else-if="activeTab === 'prices'" v-model:searchTerm="searchTerm" />
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ProductList from '../components/ProductList.vue'
import PriceManagement from '../components/PriceManagement.vue'

const activeTab = ref('products')
const searchTerm = ref('')
</script>

<style scoped>
.products-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-lg) var(--space-md);
}

.products-header {
  margin-bottom: var(--space-xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

h1 {
  color: var(--color-secondary);
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.search-box {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: var(--border-radius);
  padding: var(--space-sm) var(--space-md);
  box-shadow: var(--shadow-sm);
  width: 250px;
}

.search-box input {
  border: none;
  outline: none;
  flex: 1;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
}

.search-box svg {
  color: var(--color-secondary);
  opacity: 0.7;
}

.tabs-container {
  border-bottom: 1px solid rgba(0,0,0,0.1);
  margin-bottom: var(--space-md);
}

.tabs {
  display: flex;
  gap: var(--space-md);
  overflow-x: auto;
  padding-bottom: var(--space-xs);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: none;
  background: none;
  color: var(--color-text);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.tab-button::after {
  content: '';
  position: absolute;
  bottom: -9px;
  left: 0;
  width: 100%;
  height: 3px;
  background: transparent;
  transition: all 0.2s ease;
}

.tab-button.active {
  color: var(--color-primary);
}

.tab-button.active::after {
  background: var(--color-primary);
}

.tab-button:hover:not(.active) {
  background: rgba(0,0,0,0.05);
}

.content {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  min-height: 60vh;
}

/* Animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }
  
  .search-box {
    width: 100%;
  }
}
</style>
