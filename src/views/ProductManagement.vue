<template>
  <div class="products-view">
    <!-- Modern Header Section -->
    <header class="products-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-title-section">
            <h1 class="page-title">
              <svg class="title-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              Product Management
            </h1>
            <p class="page-subtitle">Manage your product catalog and pricing</p>
          </div>
        </div>
        
        <div class="header-actions">
          <div class="search-container">
            <div class="search-box">
              <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search products..." 
                v-model="searchTerm"
                class="search-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Tab Navigation -->
      <div class="tabs-container">
        <div class="tabs">
          <button 
            :class="['tab-button', { active: activeTab === 'products' }]"
            @click="activeTab = 'products'"
          >
            <svg v-if="activeTab === 'products'" class="tab-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="12" x2="15" y2="12"></line>
              <line x1="9" y1="15" x2="13" y2="15"></line>
            </svg>
            <span class="tab-text">Products</span>
            <div class="tab-indicator"></div>
          </button>
          <button 
            :class="['tab-button', { active: activeTab === 'prices' }]"
            @click="activeTab = 'prices'"
          >
            <svg v-if="activeTab === 'prices'" class="tab-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <span class="tab-text">Prices</span>
            <div class="tab-indicator"></div>
          </button>
        </div>
      </div>
    </header>

    <!-- Content Section -->
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Modern Header Styles */
.products-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 2rem 2rem 0 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
}

.header-left {
  flex: 1;
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-secondary);
  line-height: 1.2;
}

.title-icon {
  color: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.2);
}

.page-subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-container {
  position: relative;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 300px;
}

.search-box:hover {
  border-color: rgba(0, 220, 130, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-box:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(0, 220, 130, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-icon {
  color: var(--color-text-secondary);
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

/* Modern Tab Navigation */
.tabs-container {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin: 0 -2rem;
  padding: 0 2rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 12px 12px 0 0;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  min-height: 48px;
}

.tab-button:hover:not(.active) {
  background: rgba(0, 220, 130, 0.05);
  color: var(--color-text);
}

.tab-button.active {
  color: var(--color-primary);
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}

.tab-icon {
  transition: transform 0.3s ease;
}

.tab-button.active .tab-icon {
  transform: scale(1.1);
}

.tab-text {
  font-weight: 600;
  letter-spacing: 0.025em;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-primary);
  border-radius: 2px 2px 0 0;
  transform: scaleX(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-button.active .tab-indicator {
  transform: scaleX(1);
}

/* Content Section */
.content {
  background: transparent;
  padding: 2rem;
  min-height: calc(100vh - 200px);
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .products-view {
    padding: 0;
  }
  
  .products-header {
    padding: 1.5rem 1.5rem 0 1.5rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }
  
  .search-box {
    min-width: 100%;
  }
  
  .content {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .products-header {
    padding: 1rem 1rem 0 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .header-content {
    gap: 1rem;
  }
  
  .tabs-container {
    margin: 0 -1rem;
    padding: 0 1rem;
  }
  
  .tab-button {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
  }
  
  .content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.25rem;
  }
  
  .title-icon {
    padding: 0.375rem;
    width: 20px;
    height: 20px;
  }
  
  .tab-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>
