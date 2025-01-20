<template>
  <div class="product-list">
    <div class="header">
      <h2>Product Management</h2>
      <button class="add-button" @click="showCreateForm = true">
        <span>+</span> Add Product
      </button>
    </div>

    <div v-if="loading" class="loading">Loading products...</div>
    <div v-else-if="error" class="error-message">
      Error loading products: {{ error.message }}
    </div>
    <template v-else>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-points">
                  {{ product.points_value }} points
                </div>
              </td>
              <td class="product-description">
                {{ product.description || 'No description' }}
              </td>
              <td>
                <span :class="['status', product.is_active ? 'active' : 'inactive']">
                  {{ product.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="actions">
                <button class="edit-button" @click="editProduct(product)">
                  Edit
                </button>
                <button class="delete-button" @click="confirmDelete(product)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showCreateForm || editingProduct" class="form-modal">
        <div class="modal-backdrop" @click="closeForm"></div>
        <div class="modal-content">
          <ProductForm
            :key="editingProduct?.id || 'new'"
            :product="editingProduct"
            @submit="handleFormSubmit"
            @close="closeForm"
          />
        </div>
      </div>
    </template>

    <!-- Delete Confirmation Dialog -->
    <div v-if="productToDelete" class="confirmation-dialog">
      <div class="dialog-content">
        <h3>Confirm Deletion</h3>
        <p>Are you sure you want to delete this product?</p>
        <div class="product-details">
          <strong>{{ productToDelete.name }}</strong>
          <div>{{ productToDelete.description }}</div>
          <div>{{ productToDelete.points_value }} points</div>
        </div>
        <div class="dialog-actions">
          <button class="cancel-button" @click="productToDelete = null">
            Cancel
          </button>
          <button class="confirm-delete-button" @click="deleteProduct">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductStore } from '../stores/product'
import ProductForm from './ProductForm.vue'

const productStore = useProductStore()
const { products, loading, error } = storeToRefs(productStore)

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
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.add-button {
  background-color: #42b983;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-button span {
  font-size: 1.25rem;
}

.table-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
}

th {
  background-color: #f5f5f5;
  font-weight: 500;
}

tr {
  border-bottom: 1px solid #e0e0e0;
}

tr:last-child {
  border-bottom: none;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-name {
  font-weight: 500;
}

.product-points {
  color: #666;
  font-size: 0.875rem;
}

.product-description {
  color: #666;
  max-width: 400px;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status.inactive {
  background-color: #ffebee;
  color: #c62828;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.edit-button {
  background-color: #42b983;
  color: white;
}

.delete-button {
  background-color: #ff4444;
  color: white;
}

.confirmation-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
}

.product-details {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-button {
  background-color: #666;
  color: white;
}

.confirm-delete-button {
  background-color: #ff4444;
  color: white;
}

.form-modal {
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
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.error-message {
  padding: 2rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin: 1rem 0;
}
</style>
