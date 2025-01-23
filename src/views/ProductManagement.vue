<template>
  <div class="product-management">
    <h1>Product Management</h1>
    
    <div class="tabs">
      <button 
        :class="['tab-button', { active: activeTab === 'products' }]"
        @click="activeTab = 'products'"
      >
        Products
      </button>
      <button 
        :class="['tab-button', { active: activeTab === 'prices' }]"
        @click="activeTab = 'prices'"
      >
        Prices
      </button>
    </div>

    <div class="tab-content">
      <ProductList v-if="activeTab === 'products'" />
      <PriceManagement v-if="activeTab === 'prices'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ProductList from '../components/ProductList.vue'
import PriceManagement from '../components/PriceManagement.vue'

const activeTab = ref('products')
</script>

<style scoped>
.product-management {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background: #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #e0e0e0;
}

.tab-button.active {
  background: #42b983;
  color: white;
}

.tab-content {
  margin-top: 1rem;
}
</style>
