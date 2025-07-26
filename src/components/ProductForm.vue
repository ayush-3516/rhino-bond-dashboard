<template>
  <form @submit.prevent="handleSubmit" class="product-form">
    <div class="form-group">
      <label for="name">Product Name</label>
      <div class="input-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        <input
          type="text"
          id="name"
          v-model="form.name"
          required
          placeholder="Enter product name"
          class="form-input"
        />
      </div>
    </div>

    <div class="form-group">
      <label for="description">Description</label>
      <div class="input-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="21" y1="10" x2="3" y2="10"></line>
          <line x1="21" y1="6" x2="3" y2="6"></line>
          <line x1="21" y1="14" x2="3" y2="14"></line>
          <line x1="21" y1="18" x2="3" y2="18"></line>
        </svg>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="Enter product description"
          class="form-input"
          rows="4"
        ></textarea>
      </div>
    </div>

    <div class="form-group">
      <label for="points_value">Points Value</label>
      <div class="input-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <input
          type="number"
          id="points_value"
          v-model.number="form.points_value"
          required
          min="0"
          placeholder="Enter points value"
          class="form-input"
        />
      </div>
    </div>

    <div class="form-group checkbox-group">
      <div class="checkbox-container">
        <input
          type="checkbox"
          id="is_active"
          v-model="form.is_active"
          class="styled-checkbox"
        />
        <label for="is_active" class="checkbox-label">
          <span class="checkbox-text">Active Status</span>
          <span class="status-hint">{{ form.is_active ? 'Product will be visible to users' : 'Product will be hidden from users' }}</span>
        </label>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="cancel-btn" @click="cancel" :disabled="loading">
        Cancel
      </button>
      <button type="submit" class="save-btn" :disabled="loading">
        <svg v-if="loading" class="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        {{ loading ? 'Saving...' : 'Save Product' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  product: {
    type: Object,
    default: () => ({
      name: '',
      description: '',
      points_value: 0,
      is_active: true
    })
  }
})

const emit = defineEmits(['submit', 'cancel'])

const form = ref({ ...props.product })
const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  try {
    await emit('submit', form.value)
  } finally {
    loading.value = false
  }
}

const cancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.product-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.form-group {
  margin-bottom: var(--space-md);
}

label {
  display: inline-block;
  margin-bottom: var(--space-sm);
  font-weight: 600;
  color: var(--color-text);
  font-size: var(--font-size-sm);
  transition: color 0.2s ease;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-container svg {
  position: absolute;
  left: var(--space-sm);
  color: var(--color-text-secondary);
  opacity: 0.7;
  transition: all 0.2s ease;
}

.form-input {
  width: 100%;
  padding: var(--space-md) var(--space-md) var(--space-md) var(--space-xl);
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-text);
}

.form-input:hover {
  border-color: rgba(66, 185, 131, 0.3);
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
  box-shadow: 0 0 0 4px rgba(66, 185, 131, 0.1);
}

.form-input:focus + svg {
  color: var(--color-primary);
  opacity: 1;
}

textarea.form-input {
  min-height: 120px;
  line-height: 1.6;
  resize: vertical;
  padding-left: var(--space-md);
}

.checkbox-group {
  padding: var(--space-md) var(--space-sm);
  background: rgba(66, 185, 131, 0.05);
  border-radius: var(--border-radius);
  border: 1px solid rgba(66, 185, 131, 0.1);
}

.styled-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-text-secondary);
  border-radius: 6px;
  position: relative;
  cursor: pointer;
  margin-top: 3px;
  transition: all 0.2s ease;
}

.styled-checkbox:hover {
  border-color: var(--color-primary);
}

.styled-checkbox:checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.styled-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-label {
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.checkbox-text {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.status-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  opacity: 0.9;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.cancel-btn, .save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-xl);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 120px;
}

.cancel-btn {
  background-color: #f3f4f6;
  color: var(--color-text);
}

.cancel-btn:hover {
  background-color: #e5e7eb;
  transform: translateY(-1px);
}

.save-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  box-shadow: 0 4px 6px rgba(66, 185, 131, 0.2);
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px rgba(66, 185, 131, 0.25);
}

.save-btn:active {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .cancel-btn, .save-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
