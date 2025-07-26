<template>
  <div class="product-list">
    <div class="list-header">
      <div class="action-bar">
        <button class="add-button" @click="showCreateForm = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Product
        </button>
        <div class="list-stats" v-if="!loading">
          <span>{{ filteredProducts.length }} products</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div>Loading products...</div>
    </div>
    <div v-else-if="error" class="error-message">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      Error loading products: {{ error.message }}
    </div>
    <template v-else>
      <div v-if="filteredProducts.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <h3>No products found</h3>
        <p>{{ searchTerm ? 'Try a different search term' : 'Add your first product to get started' }}</p>
        <button v-if="!searchTerm" class="add-button-empty" @click="showCreateForm = true">Add Product</button>
      </div>
      
      <div v-else class="product-grid">
        <div 
          v-for="product in filteredProducts" 
          :key="product.id" 
          class="product-card"
        >
          <div class="product-card-header">
            <div class="product-name-container">
              <div class="product-name-row">
                <h3>{{ product.name }}</h3>
                <span :class="['status-badge', product.is_active ? 'active' : 'inactive']">
                  {{ product.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            <div class="product-points-badge">{{ product.points_value }} points</div>
          </div>
          
          <div class="product-description">
            {{ product.description || 'No description provided' }}
          </div>
          
          <div class="product-card-footer">
            <button class="card-button edit" @click="editProduct(product)" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
            <button class="card-button delete" @click="confirmDelete(product)" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </template>

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
import ProductForm from './ProductForm.vue'

const props = defineProps({
  searchTerm: {
    type: String,
    default: ''
  }
})

const productStore = useProductStore()
const { products, loading, error } = storeToRefs(productStore)

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
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }
}

const handleFormSubmit = async (productData) => {
  try {
    if (editingProduct.value) {
      await productStore.updateProduct(editingProduct.value.id, productData)
    } else {
      await productStore.createProduct(productData)
    }
    closeForm()
  } catch (error) {
    console.error('Error saving product:', error)
  }
}

const closeForm = () => {
  showCreateForm.value = false
  editingProduct.value = null
}
</script>

<style scoped>
.product-list {
  padding: var(--space-md);
}

.list-header {
  margin-bottom: var(--space-xl);
  background: white;
  padding: var(--space-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-xl);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(66, 185, 131, 0.2);
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(66, 185, 131, 0.25);
}

.add-button:active {
  transform: translateY(0);
}

.add-button svg {
  transition: transform 0.3s ease;
}

.add-button:hover svg {
  transform: rotate(90deg);
}

.list-stats {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: rgba(66, 185, 131, 0.1);
  padding: var(--space-xs) var(--space-md);
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid rgba(66, 185, 131, 0.2);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  color: var(--color-text-secondary, #666);
  gap: var(--space-md);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background-color: #ffebee;
  color: #c62828;
  border-radius: var(--border-radius);
  margin: var(--space-md) 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  color: var(--color-text-secondary, #666);
  gap: var(--space-md);
  text-align: center;
}

.empty-state svg {
  color: var(--color-text-tertiary, #999);
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--color-text);
}

.empty-state p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.add-button-empty {
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-md);
}

.product-card {
  background: linear-gradient(to bottom right, #ffffff, #fafbff);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(66, 185, 131, 0.2);
}

.product-card-header {
  padding: var(--space-lg);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(to right, rgba(0, 220, 130, 0.02), transparent);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-md);
}

.product-name-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.product-name-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.product-card h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.status-badge {
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 20px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  height: 24px;
}

.status-badge.active {
  background-color: rgba(46, 125, 50, 0.1);
  color: #2e7d32;
  border-color: rgba(46, 125, 50, 0.2);
}

.status-badge.inactive {
  background-color: rgba(198, 40, 40, 0.1);
  color: #c62828;
  border-color: rgba(198, 40, 40, 0.2);
}

.product-points-badge {
  background: linear-gradient(135deg, var(--color-primary-light), rgba(66, 185, 131, 0.1));
  color: var(--color-primary);
  padding: 4px 16px;
  border-radius: 20px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  border: 1px solid rgba(66, 185, 131, 0.2);
  display: inline-flex;
  align-items: center;
  height: 28px;
  white-space: nowrap;
  justify-self: end;
}

.product-description {
  padding: var(--space-md);
  flex-grow: 1;
  color: var(--color-text-secondary, #666);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  min-height: 80px;
}

.product-card-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.5), rgba(249, 250, 251, 0.8));
}

.card-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.card-button svg {
  transition: transform 0.3s ease;
}

.card-button:hover svg {
  transform: scale(1.1);
}

.card-button.edit {
  background: linear-gradient(135deg, rgba(66, 185, 131, 0.1), rgba(66, 185, 131, 0.15));
  color: var(--color-primary);
  border: 1px solid rgba(66, 185, 131, 0.2);
}

.card-button.edit::before {
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

.card-button.edit:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  color: white;
}

.card-button.edit:hover::before {
  opacity: 1;
}

.card-button.delete {
  background: linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.15));
  color: #ff4444;
  border: 1px solid rgba(255, 68, 68, 0.2);
}

.card-button.delete::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #ff4444, #ff1111);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.card-button.delete:hover {
  transform: translateY(-2px);
  border-color: #ff4444;
  color: white;
}

.card-button.delete:hover::before {
  opacity: 1;
}

.card-button svg,
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
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  animation: fadeIn 0.2s ease;
}

.modal-content, .dialog-content {
  position: relative;
  background: linear-gradient(to bottom right, #ffffff, #fafbff);
  border-radius: var(--border-radius-lg);
  padding: var(--space-xl);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-header, .dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.modal-header h3, .dialog-header h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  background: linear-gradient(45deg, var(--color-text), var(--color-secondary));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-text);
  transform: rotate(90deg);
}

.dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-xl) 0;
}

.warning-icon {
  color: #ff4444;
  margin-bottom: var(--space-lg);
  animation: pulseWarning 2s infinite;
}

.product-details {
  margin: var(--space-lg) 0;
  padding: var(--space-lg);
  background: rgba(255, 68, 68, 0.05);
  border: 1px solid rgba(255, 68, 68, 0.1);
  border-radius: var(--border-radius);
  width: 100%;
  text-align: left;
}

.points-info {
  margin-top: var(--space-xs);
  font-weight: 600;
  color: var(--color-secondary);
}

.deletion-warning {
  color: #ff4444;
  font-weight: 600;
  margin: var(--space-md) 0 0;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-xl);
}

.cancel-button, .confirm-delete-button {
  padding: var(--space-sm) var(--space-xl);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 120px;
}

.cancel-button {
  background-color: #f3f4f6;
  color: var(--color-text);
}

.cancel-button:hover {
  background-color: #e5e7eb;
  transform: translateY(-1px);
}

.confirm-delete-button {
  background: linear-gradient(135deg, #ff4444, #ff1111);
  color: white;
  box-shadow: 0 4px 6px rgba(255, 68, 68, 0.2);
}

.confirm-delete-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px rgba(255, 68, 68, 0.25);
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

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
  
  .action-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }
  
  .product-card-header {
    flex-direction: column;
  }
  
  .product-points-badge {
    align-self: flex-start;
  }
}
</style>
