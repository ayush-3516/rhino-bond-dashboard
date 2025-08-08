<template>
  <div class="product-list">
    <!-- Modern Header Section -->
    <div class="list-header">
      <div class="action-bar">
        <div class="left-section">
          <button class="add-button" @click="showCreateForm = true">
            <svg class="add-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Product</span>
          </button>
        </div>
        <div class="right-section">
          <div class="list-stats" v-if="!loading">
            <svg class="stats-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="12" x2="15" y2="12"></line>
              <line x1="9" y1="15" x2="13" y2="15"></line>
            </svg>
            <span>{{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'product' : 'products' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading products...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-message">
      <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div class="error-content">
        <h3>Error loading products</h3>
        <p>{{ error.message }}</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredProducts.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      </div>
      <h3>No products found</h3>
      <p>{{ searchTerm ? 'Try a different search term' : 'Add your first product to get started' }}</p>
      <button v-if="!searchTerm" class="add-button-empty" @click="showCreateForm = true">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Product
      </button>
    </div>

    <!-- Product Grid -->
    <div v-else class="product-grid">
      <div 
        v-for="product in filteredProducts" 
        :key="product.id" 
        class="product-card"
      >
        <!-- Card Header -->
        <div class="product-card-header">
          <div class="product-info">
            <div class="product-name-section">
              <h3 class="product-name">{{ product.name }}</h3>
              <span :class="['status-badge', product.is_active ? 'active' : 'inactive']">
                <svg v-if="product.is_active" class="status-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <svg v-else class="status-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                {{ product.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
          <div class="product-points">
            <div class="points-badge">
              <svg class="points-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>{{ product.points_value }} points</span>
            </div>
          </div>
        </div>
        
        <!-- Card Body -->
        <div class="product-card-body">
          <div class="product-description">
            {{ product.description || 'No description provided' }}
          </div>
        </div>
        
        <!-- Card Footer -->
        <div class="product-card-footer">
          <button class="card-button edit" @click="editProduct(product)" title="Edit">
            <svg class="button-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit</span>
          </button>
          <button class="card-button delete" @click="confirmDelete(product)" title="Delete">
            <svg class="button-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Product Form Modal -->
    <div v-if="showCreateForm || editingProduct" class="form-modal">
      <div class="modal-backdrop" @click="closeForm"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingProduct ? 'Edit Product' : 'Create New Product' }}</h3>
          <button class="close-button" @click="closeForm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <ProductForm
          :key="editingProduct?.id || 'new'"
          :product="editingProduct"
          @submit="handleFormSubmit"
        />
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="productToDelete" class="confirmation-dialog">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Confirm Deletion</h3>
          <button class="close-button" @click="productToDelete = null">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="dialog-body">
          <div class="warning-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <p>Are you sure you want to delete this product?</p>
          <div class="product-details">
            <strong>{{ productToDelete.name }}</strong>
            <div>{{ productToDelete.description }}</div>
            <div class="points-info">{{ productToDelete.points_value }} points</div>
          </div>
          <p class="deletion-warning">This action cannot be undone.</p>
        </div>
        
        <div class="dialog-actions">
          <button class="cancel-button" @click="productToDelete = null">
            Cancel
          </button>
          <button class="confirm-delete-button" @click="deleteProduct">
            Delete Product
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductStore } from '../stores/product'
import { useNotifications } from '../composables/useNotifications'
import ProductForm from './ProductForm.vue'

const props = defineProps({
  searchTerm: {
    type: String,
    default: ''
  }
})

const productStore = useProductStore()
const { products, loading, error } = storeToRefs(productStore)
const { showToast } = useNotifications()

// Computed property to filter products based on search term
const filteredProducts = computed(() => {
  if (!props.searchTerm) return products.value
  
  const term = props.searchTerm.toLowerCase()
  return products.value.filter(product => 
    product.name.toLowerCase().includes(term) || 
    (product.description && product.description.toLowerCase().includes(term))
  )
})

const showCreateForm = ref(false)
const editingProduct = ref(null)
const productToDelete = ref(null)

onMounted(async () => {
  await productStore.fetchProducts()
})

const editProduct = (product) => {
  closeForm()
  editingProduct.value = { ...product }
}

const confirmDelete = (product) => {
  productToDelete.value = product
}

const deleteProduct = async () => {
  if (productToDelete.value) {
    try {
      await productStore.deleteProduct(productToDelete.value.id)
      productToDelete.value = null
      showToast('Product deleted successfully!', 'success')
    } catch (error) {
      console.error('Error deleting product:', error)
      showToast(`Failed to delete product: ${error.message}`, 'error')
    }
  }
}

const handleFormSubmit = async (productData) => {
  try {
    if (editingProduct.value) {
      await productStore.updateProduct(editingProduct.value.id, productData)
      showToast('Product updated successfully!', 'success')
    } else {
      await productStore.createProduct(productData)
      showToast('Product created successfully!', 'success')
    }
    closeForm()
  } catch (error) {
    console.error('Error saving product:', error)
    showToast(`Failed to save product: ${error.message}`, 'error')
    // Re-throw the error so the form can display it
    throw error
  }
}

const closeForm = () => {
  showCreateForm.value = false
  editingProduct.value = null
}
</script>

<style scoped>
.product-list {
  padding: 0;
}

/* Modern Header Section */
.list-header {
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.add-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(0, 220, 130, 0.2);
  position: relative;
  overflow: hidden;
}

.add-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.add-button:hover::before {
  left: 100%;
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 220, 130, 0.3);
}

.add-button:active {
  transform: translateY(0);
}

.add-icon {
  transition: transform 0.3s ease;
}

.add-button:hover .add-icon {
  transform: rotate(90deg);
}

.list-stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.1), rgba(0, 220, 130, 0.05));
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-primary);
  border: 1px solid rgba(0, 220, 130, 0.2);
  box-shadow: 0 2px 4px rgba(0, 220, 130, 0.1);
}

.stats-icon {
  color: var(--color-primary);
  width: 16px;
  height: 16px;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
  gap: 1rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 220, 130, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 1rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-message {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  color: #dc2626;
  border-radius: 16px;
  margin: 1rem 0;
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.1);
}

.error-icon {
  color: #dc2626;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-content h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #dc2626;
}

.error-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #991b1b;
  line-height: 1.4;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
  gap: 1.5rem;
  text-align: center;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.empty-icon {
  color: var(--color-text-tertiary);
  opacity: 0.5;
  width: 64px;
  height: 64px;
}

.empty-state h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
  max-width: 400px;
  line-height: 1.5;
}

.add-button-empty {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(0, 220, 130, 0.2);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.add-button-empty:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 220, 130, 0.3);
}

.add-button-empty:active {
  transform: translateY(0);
}

.add-button-empty svg {
  transition: transform 0.3s ease;
}

.add-button-empty:hover svg {
  transform: rotate(90deg);
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  padding: 0;
}

/* Modern Product Cards */
.product-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover::before {
  opacity: 1;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 220, 130, 0.2);
}

/* Card Header */
.product-card-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.02), transparent);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name-section {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.product-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  border-radius: 20px;
  border: 1px solid transparent;
  height: 24px;
  flex-shrink: 0;
  white-space: nowrap;
}

.status-badge.active {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
  color: #16a34a;
  border-color: rgba(34, 197, 94, 0.2);
}

.status-badge.inactive {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.2);
}

.status-icon {
  width: 12px;
  height: 12px;
}

.product-points {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.points-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.1), rgba(0, 220, 130, 0.05));
  color: var(--color-primary);
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid rgba(0, 220, 130, 0.2);
  height: 32px;
  white-space: nowrap;
}

.points-icon {
  color: var(--color-primary);
  width: 16px;
  height: 16px;
}

/* Card Body */
.product-card-body {
  padding: 1.25rem 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.product-description {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

/* Card Footer */
.product-card-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(135deg, rgba(249, 250, 251, 0.8), rgba(255, 255, 255, 0.5));
}

.card-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  background: white;
  color: var(--color-text);
}

.card-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.card-button:hover::before {
  opacity: 1;
}

.card-button:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.2);
}

.card-button:active {
  transform: translateY(0);
}

.card-button.edit {
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.1), rgba(0, 220, 130, 0.05));
  color: var(--color-primary);
  border-color: rgba(0, 220, 130, 0.2);
}

.card-button.delete {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.2);
}

.card-button.delete::before {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.button-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
}

.card-button:hover .button-icon {
  transform: scale(1.1);
}

.card-button span {
  position: relative;
  z-index: 1;
}

/* Modal Styles */
.form-modal, .confirmation-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-modal-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  pointer-events: auto;
  width: 100vw;
  height: 100vh;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease;
  z-index: -1;
  width: 100vw;
  height: 100vh;
}

.modal-content, .dialog-content {
  position: relative;
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.08);
  z-index: var(--z-index-modal);
  pointer-events: auto;
}

.modal-header, .dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
  margin-bottom: 0;
  border-bottom: none;
}

.modal-header h3, .dialog-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
}

.close-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-text);
  transform: rotate(90deg);
}

.close-button svg {
  width: 20px;
  height: 20px;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 0;
}

.warning-icon {
  color: #dc2626;
  margin-bottom: 1.5rem;
  animation: pulseWarning 2s infinite;
}

.product-details {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.1);
  border-radius: 12px;
  width: 100%;
  text-align: left;
}

.points-info {
  margin-top: 0.5rem;
  font-weight: 600;
  color: var(--color-primary);
}

.deletion-warning {
  color: #dc2626;
  font-weight: 600;
  margin: 1rem 0 0;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-button, .confirm-delete-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 120px;
  font-size: 0.875rem;
}

.cancel-button {
  background-color: #f3f4f6;
  color: var(--color-text);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.cancel-button:hover {
  background-color: #e5e7eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.confirm-delete-button {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
}

.confirm-delete-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px rgba(220, 38, 38, 0.25);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseWarning {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }
  
  .list-header {
    padding: 1.25rem 1.5rem;
  }
  
  .action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .left-section, .right-section {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .list-header {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .product-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .product-points {
    align-self: flex-start;
  }
  
  .product-card-footer {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .modal-content, .dialog-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
}

@media (max-width: 480px) {
  .product-card {
    border-radius: 16px;
  }
  
  .product-card-header {
    padding: 1.25rem;
  }
  
  .product-card-body {
    padding: 1rem 1.25rem;
  }
  
  .product-card-footer {
    padding: 1rem 1.25rem;
  }
  
  .product-name {
    font-size: 1.125rem;
  }
}
</style>
