<template>
  <form @submit.prevent="handleSubmit" class="product-form">
    <!-- Product Name Field -->
    <div class="form-group">
      <label for="name" class="field-label">
        <span class="label-text">Product Name</span>
        <span class="required-indicator">*</span>
      </label>
      <div class="input-container">
        <div class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        </div>
        <input
          type="text"
          id="name"
          v-model="form.name"
          :class="['form-input', { 'error': errors.name, 'filled': form.name }]"
          required
          maxlength="100"
          placeholder="Enter product name"
          :aria-describedby="errors.name ? 'name-error' : 'name-counter'"
          @blur="validateField('name')"
          @input="validateField('name')"
        />
      </div>
      <div class="field-footer">
        <div v-if="errors.name" id="name-error" class="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          {{ errors.name }}
        </div>
        <div id="name-counter" class="character-counter" :class="{ 'warning': nameLength > 80, 'danger': nameLength > 95 }">
          {{ nameLength }}/100
        </div>
      </div>
    </div>

    <!-- Description Field -->
    <div class="form-group">
      <label for="description" class="field-label">
        <span class="label-text">Description</span>
        <span class="optional-indicator">(Optional)</span>
      </label>
      <div class="input-container">
        <div class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="21" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="21" y1="18" x2="3" y2="18"></line>
          </svg>
        </div>
        <textarea
          id="description"
          v-model="form.description"
          :class="['form-input', { 'error': errors.description, 'filled': form.description }]"
          placeholder="Describe your product in detail..."
          rows="4"
          maxlength="500"
          :aria-describedby="errors.description ? 'description-error' : 'description-counter'"
          @blur="validateField('description')"
          @input="validateField('description')"
        ></textarea>
      </div>
      <div class="field-footer">
        <div v-if="errors.description" id="description-error" class="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          {{ errors.description }}
        </div>
        <div id="description-counter" class="character-counter" :class="{ 'warning': descriptionLength > 400, 'danger': descriptionLength > 480 }">
          {{ descriptionLength }}/500
        </div>
      </div>
    </div>

    <!-- Points Value Field -->
    <div class="form-group">
      <label for="points_value" class="field-label">
        <span class="label-text">Points Value</span>
        <span class="required-indicator">*</span>
      </label>
      <div class="input-container">
        <div class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </div>
        <input
          type="number"
          id="points_value"
          v-model.number="form.points_value"
          :class="['form-input', { 'error': errors.points_value, 'filled': form.points_value }]"
          required
          min="0"
          step="1"
          placeholder="0"
          :aria-describedby="errors.points_value ? 'points-error' : undefined"
          @blur="validateField('points_value')"
          @input="validateField('points_value')"
        />
        <div class="points-suffix">points</div>
      </div>
      <div v-if="errors.points_value" id="points-error" class="error-message">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        {{ errors.points_value }}
      </div>
    </div>

    <!-- Active Status Field -->
    <div class="form-group">
      <div class="status-section">
        <div class="status-header">
          <label for="is_active" class="field-label">
            <span class="label-text">Product Status</span>
          </label>
          <div class="status-toggle">
            <input
              type="checkbox"
              id="is_active"
              v-model="form.is_active"
              class="toggle-input"
              @change="validateField('is_active')"
            />
            <label for="is_active" class="toggle-label">
              <span class="toggle-slider"></span>
              <span class="toggle-text">{{ form.is_active ? 'Active' : 'Inactive' }}</span>
            </label>
          </div>
        </div>
        <div class="status-description">
          <div class="status-icon" :class="{ 'active': form.is_active }">
            <svg v-if="form.is_active" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div class="status-text">
            <strong>{{ form.is_active ? 'Active' : 'Inactive' }}</strong>
            <span>{{ form.is_active ? 'Product will be visible to users' : 'Product will be hidden from users' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Global Error Message -->
    <div v-if="globalError" class="global-error">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div class="error-content">
        <strong>Error</strong>
        <span>{{ globalError }}</span>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="form-actions">
      <button type="button" class="cancel-btn" @click="cancel" :disabled="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Cancel
      </button>
      <button type="submit" class="save-btn" :disabled="loading || hasErrors">
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
        {{ loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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
const globalError = ref('')
const errors = ref({})

// Computed property to check if we're editing
const editingProduct = computed(() => {
  return props.product && props.product.id
})

// Reset form when product prop changes
watch(() => props.product, (newProduct) => {
  form.value = { ...newProduct }
  errors.value = {}
  globalError.value = ''
}, { deep: true })

const validateField = (fieldName) => {
  const value = form.value[fieldName]
  
  switch (fieldName) {
    case 'name':
      if (!value || value.trim().length === 0) {
        errors.value[fieldName] = 'Product name is required'
      } else if (value.trim().length < 2) {
        errors.value[fieldName] = 'Product name must be at least 2 characters'
      } else if (value.trim().length > 100) {
        errors.value[fieldName] = 'Product name must be less than 100 characters'
      } else {
        delete errors.value[fieldName]
      }
      break
      
    case 'description':
      if (value && value.trim().length > 500) {
        errors.value[fieldName] = 'Description must be less than 500 characters'
      } else {
        delete errors.value[fieldName]
      }
      break
      
    case 'points_value':
      if (value === null || value === undefined || value === '') {
        errors.value[fieldName] = 'Points value is required'
      } else if (!Number.isInteger(Number(value)) || Number(value) < 0) {
        errors.value[fieldName] = 'Points value must be a positive integer'
      } else if (Number(value) > 1000000) {
        errors.value[fieldName] = 'Points value cannot exceed 1,000,000'
      } else {
        delete errors.value[fieldName]
      }
      break
      
    case 'is_active':
      if (typeof value !== 'boolean') {
        errors.value[fieldName] = 'Active status must be true or false'
      } else {
        delete errors.value[fieldName]
      }
      break
  }
}

const validateForm = () => {
  validateField('name')
  validateField('description')
  validateField('points_value')
  validateField('is_active')
  
  return Object.keys(errors.value).length === 0
}

const hasErrors = computed(() => {
  return Object.keys(errors.value).length > 0
})

const descriptionLength = computed(() => {
  return form.value.description?.length || 0
})

const nameLength = computed(() => {
  return form.value.name?.length || 0
})

const handleSubmit = async () => {
  globalError.value = ''
  
  if (!validateForm()) {
    globalError.value = 'Please fix the errors above before submitting'
    return
  }
  
  loading.value = true
  try {
    // Clean the form data
    const cleanData = {
      name: form.value.name.trim(),
      description: form.value.description?.trim() || '',
      points_value: Number(form.value.points_value),
      is_active: Boolean(form.value.is_active)
    }
    
    await emit('submit', cleanData)
  } catch (error) {
    globalError.value = error.message || 'An error occurred while saving the product'
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
  gap: 2rem;
  max-width: 100%;
  padding: 1.5rem;
}

/* Form Groups */
.form-group {
  margin-bottom: 0;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
  line-height: 1.2;
}

.label-text {
  font-weight: 600;
}

.required-indicator {
  color: #dc2626;
  font-weight: 700;
  font-size: 0.875rem;
}

.optional-indicator {
  color: var(--color-text-secondary);
  font-weight: 400;
  font-size: 0.75rem;
}

/* Input Container */
.input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  min-height: 56px;
}

.input-container:hover {
  border-color: rgba(0, 220, 130, 0.3);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.input-container:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(0, 220, 130, 0.1), 0 4px 8px rgba(0, 0, 0, 0.08);
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  color: var(--color-text-secondary);
  opacity: 0.7;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.input-container:focus-within .input-icon {
  color: var(--color-primary);
  opacity: 1;
}

.form-input {
  flex: 1;
  padding: 1rem 1rem 1rem 0;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: var(--color-text);
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1.4;
}

.form-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.form-input.filled {
  color: var(--color-text);
}

.form-input.error {
  color: #dc2626;
}

.form-input.error::placeholder {
  color: rgba(220, 38, 38, 0.6);
}

.points-suffix {
  padding: 0 1.25rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(0, 220, 130, 0.1);
  border-left: 1px solid rgba(0, 220, 130, 0.2);
  height: 100%;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

textarea.form-input {
  min-height: 120px;
  line-height: 1.5;
  resize: vertical;
  padding: 1rem 1rem 1rem 0;
  font-family: inherit;
}

/* Field Footer */
.field-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  min-height: 1.5rem;
}

.error-message {
  color: #dc2626;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.character-counter {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  opacity: 0.7;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.character-counter.warning {
  color: #f59e0b;
  font-weight: 500;
}

.character-counter.danger {
  color: #dc2626;
  font-weight: 600;
}

/* Status Section */
.status-section {
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.05), rgba(0, 220, 130, 0.02));
  border: 2px solid rgba(0, 220, 130, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.status-section:hover {
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.08), rgba(0, 220, 130, 0.04));
  border-color: rgba(0, 220, 130, 0.2);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.status-toggle {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle-input {
  display: none;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  user-select: none;
}

.toggle-slider {
  position: relative;
  width: 52px;
  height: 28px;
  background: #e5e7eb;
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-label .toggle-slider {
  background: var(--color-primary);
}

.toggle-input:checked + .toggle-label .toggle-slider::before {
  transform: translateX(24px);
}

.toggle-text {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
}

.status-description {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.status-icon.active {
  background: rgba(0, 220, 130, 0.1);
  color: var(--color-primary);
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-text strong {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
}

.status-text span {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.4;
}

/* Global Error */
.global-error {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.05));
  color: #dc2626;
  border: 2px solid rgba(220, 38, 38, 0.2);
  border-radius: 12px;
  font-size: 0.875rem;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-content strong {
  font-weight: 600;
}

.error-content span {
  line-height: 1.4;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.cancel-btn, .save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 140px;
  position: relative;
  overflow: hidden;
  line-height: 1.2;
}

.cancel-btn {
  background: #f3f4f6;
  color: var(--color-text);
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.cancel-btn:hover:not(:disabled) {
  background: #e5e7eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.save-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  box-shadow: 0 4px 8px rgba(0, 220, 130, 0.3);
}

.save-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.save-btn:hover:not(:disabled)::before {
  left: 100%;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 220, 130, 0.4);
}

.save-btn:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.spinner {
  animation: spin 1s linear infinite;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .product-form {
    gap: 1.5rem;
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
  
  .cancel-btn, .save-btn {
    width: 100%;
    justify-content: center;
  }
  
  .status-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .status-description {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .input-container {
    flex-direction: column;
    align-items: stretch;
    min-height: auto;
  }
  
  .input-icon {
    width: 100%;
    height: auto;
    padding: 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .form-input {
    padding: 1rem;
  }
  
  .points-suffix {
    width: 100%;
    justify-content: center;
    border-left: none;
    border-top: 1px solid rgba(0, 220, 130, 0.2);
    padding: 0.75rem;
  }
  
  .field-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
