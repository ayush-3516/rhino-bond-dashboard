<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePriceStore } from '@/stores/price'

const priceStore = usePriceStore()
const selectedProduct = ref(null)
const selectedProductId = computed({
  get: () => selectedProduct.value?.id || null,
  set: (id) => {
    selectedProduct.value = priceStore.products.find(p => p.id === id) || null
  }
})
const newPrice = ref({
  variation: '',
  price: null
})
const editingPrice = ref(null)
const errorMessage = ref('')
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    await priceStore.fetchProductsWithPrices()
  } catch (error) {
    errorMessage.value = 'Failed to load products and prices'
  } finally {
    isLoading.value = false
  }
})

const parseVariation = (variation) => {
  // Extract numeric value from variation string (e.g. "1kg" -> 1)
  const match = variation.match(/\d+/)
  return match ? parseFloat(match[0]) : 0
}

const currentPrices = computed(() => {
  if (!selectedProduct.value) return []
  const prices = priceStore.getPrices(selectedProduct.value.id)
  return prices.slice().sort((a, b) => {
    const aVal = parseVariation(a.variation)
    const bVal = parseVariation(b.variation)
    return aVal - bVal
  })
})

const variationModel = computed({
  get: () => editingPrice.value ? editingPrice.value.variation : newPrice.value.variation,
  set: (value) => {
    if (editingPrice.value) {
      editingPrice.value.variation = value
    } else {
      newPrice.value.variation = value
    }
  }
})

const priceModel = computed({
  get: () => editingPrice.value ? editingPrice.value.price : newPrice.value.price,
  set: (value) => {
    if (editingPrice.value) {
      editingPrice.value.price = value
    } else {
      newPrice.value.price = value
    }
  }
})

const validatePrice = () => {
  // Only validate variation when adding new price
  if (!editingPrice.value && !newPrice.value.variation.trim()) {
    errorMessage.value = 'Variation is required'
    return false
  }
  
  const priceToValidate = editingPrice.value ? editingPrice.value.price : newPrice.value.price
  if (!priceToValidate || priceToValidate <= 0) {
    errorMessage.value = 'Price must be greater than 0'
    return false
  }
  
  errorMessage.value = ''
  return true
}

const addPrice = async () => {
  if (!selectedProduct.value || !validatePrice()) return
  
  isLoading.value = true
  try {
    await priceStore.addPrice(selectedProduct.value.id, newPrice.value)
    newPrice.value = { variation: '', price: null }
  } catch (error) {
    errorMessage.value = 'Failed to add price'
  } finally {
    isLoading.value = false
  }
}

const editPrice = (price) => {
  editingPrice.value = { ...price }
}

const updatePrice = async () => {
  if (!selectedProduct.value || !validatePrice()) return
  
  isLoading.value = true
  try {
    await priceStore.updatePrice(editingPrice.value.id, { price: editingPrice.value.price })
    editingPrice.value = null
  } catch (error) {
    errorMessage.value = 'Failed to update price'
  } finally {
    isLoading.value = false
  }
}

const deletePrice = async (priceId) => {
  isLoading.value = true
  try {
    await priceStore.deletePrice(priceId)
  } catch (error) {
    errorMessage.value = 'Failed to delete price'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="price-management">
    <h2>Manage Prices</h2>
    
    <div class="product-select">
      <label>Select Product</label>
      <select v-model="selectedProductId" :disabled="isLoading">
        <option 
          v-for="product in priceStore.products" 
          :key="product.id" 
          :value="product.id"
        >
          {{ product.name }}
        </option>
      </select>
    </div>

    <div v-if="selectedProduct" class="price-form">
      <h3>{{ editingPrice ? 'Edit Price' : 'Add New Price' }}</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Variation</label>
          <input 
            v-model="variationModel"
            placeholder="e.g. 1kg, 2kg"
            :disabled="isLoading || !!editingPrice"
            :readonly="!!editingPrice"
          />
        </div>
        <div class="form-group">
          <label>Price</label>
          <input 
            type="number" 
            v-model.number="priceModel"
            :disabled="isLoading"
          />
        </div>
        <button 
          @click="editingPrice ? updatePrice() : addPrice()"
          :disabled="isLoading"
        >
          {{ editingPrice ? 'Update' : 'Add' }} Price
        </button>
        <button 
          v-if="editingPrice"
          @click="editingPrice = null"
          class="cancel-button"
          :disabled="isLoading"
        >
          Cancel
        </button>
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>

    <div v-if="selectedProduct" class="price-table">
      <h3>Current Prices</h3>
      <table>
        <thead>
          <tr>
            <th>Variation</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="price in currentPrices" :key="price.id">
            <td>{{ price.variation }}</td>
            <td>{{ price.price }}</td>
            <td class="actions">
              <button @click="editPrice(price)" class="edit-button">Edit</button>
              <button @click="deletePrice(price.id)" class="delete-button">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.price-management {
  margin: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-width: 800px;
}

.product-select {
  margin-bottom: 2rem;
}

.product-select label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.product-select select {
  width: 100%;
  max-width: 300px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.price-form {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.form-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

button:not(.cancel-button) {
  background-color: #42b983;
  color: white;
}

button:not(.cancel-button):hover:not(:disabled) {
  background-color: #3aa876;
}

.cancel-button {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
}

.error-message {
  color: #dc3545;
  margin-top: 1rem;
}

.price-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.edit-button {
  background-color: #ffc107;
  color: black;
}

.delete-button {
  background-color: #dc3545;
  color: white;
}

.edit-button:hover:not(:disabled),
.delete-button:hover:not(:disabled) {
  opacity: 0.9;
}
</style>
