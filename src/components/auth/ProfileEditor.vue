<template>
  <div class="profile-editor">
    <div class="profile-header">
      <h2>Edit Profile</h2>
      <button @click="$emit('close')" class="close-button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <form @submit.prevent="updateProfile" class="profile-form">
      <div class="avatar-editor">
        <div class="avatar-preview" :style="{ backgroundColor: avatarColor }">
          <span v-if="userInitials">{{ userInitials }}</span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="avatar-actions">
          <button type="button" @click="randomizeAvatarColor" class="color-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8.5 14.5A4.5 4.5 0 0 1 13 10a4.5 4.5 0 0 1 4.5 4.5"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            New Color
          </button>
        </div>
      </div>

      <div class="form-group">
        <label for="fullName">Full Name</label>
        <div class="input-with-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="input-icon">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <input 
            type="text" 
            id="fullName" 
            v-model="form.fullName"
            placeholder="Enter your full name"
            :disabled="isLoading"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="phone">Phone Number</label>
        <div class="input-with-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="input-icon">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <input 
            type="tel" 
            id="phone" 
            v-model="form.phone"
            placeholder="Your phone number"
            disabled
          />
        </div>
        <p class="input-help" v-if="form.phone">Phone number cannot be changed directly</p>
      </div>

      <div class="form-actions">
        <button 
          type="button" 
          @click="$emit('close')" 
          class="cancel-button"
          :disabled="isLoading"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="save-button"
          :disabled="isLoading || !hasChanges"
        >
          <span v-if="!isLoading">Save Changes</span>
          <span v-else class="loading-spinner"></span>
        </button>
      </div>
    </form>

    <div v-if="errorMessage" class="auth-message error">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ errorMessage }}</span>
    </div>

    <div v-if="successMessage" class="auth-message success">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>{{ successMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../supabase'
import { useAuthStore } from '../../stores/auth'

// Props
const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close', 'updated'])

// Component state
const authStore = useAuthStore()
const form = ref({
  fullName: '',
  phone: '',
  avatarColor: '#00dc82'
})
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Get initial user data
onMounted(() => {
  form.value = {
    fullName: props.user?.user_metadata?.full_name || '',
    phone: props.user?.phone || '',
    avatarColor: props.user?.user_metadata?.avatarColor || '#00dc82'
  }
})

// Computed values
const userInitials = computed(() => {
  const name = form.value.fullName
  if (!name) return ''
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const avatarColor = computed(() => {
  return form.value.avatarColor
})

const hasChanges = computed(() => {
  return form.value.fullName !== (props.user?.user_metadata?.full_name || '') ||
         form.value.avatarColor !== (props.user?.user_metadata?.avatarColor || '#00dc82')
})

// Methods
function randomizeAvatarColor() {
  const colors = [
    '#00dc82', '#4CAF50', '#2196F3', '#3F51B5', 
    '#673AB7', '#9C27B0', '#E91E63', '#F44336',
    '#FF9800', '#607D8B', '#795548'
  ]
  const currentColor = form.value.avatarColor
  let newColor = currentColor
  
  // Make sure we get a different color
  while (newColor === currentColor) {
    newColor = colors[Math.floor(Math.random() * colors.length)]
  }
  
  form.value.avatarColor = newColor
}

async function updateProfile() {
  if (!form.value.fullName.trim()) {
    errorMessage.value = 'Name cannot be empty'
    return
  }
  
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: form.value.fullName,
        avatarColor: form.value.avatarColor
      }
    })
    
    if (error) throw error
    
    successMessage.value = 'Profile updated successfully'
    emit('updated', {
      ...props.user,
      user_metadata: {
        ...props.user.user_metadata,
        full_name: form.value.fullName,
        avatarColor: form.value.avatarColor
      }
    })
    
    // Wait a moment before closing
    setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err) {
    console.error('Error updating profile:', err)
    errorMessage.value = err.message || 'Failed to update profile'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.profile-editor {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.profile-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-secondary, #1e1e1e);
}

.close-button {
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--color-text-secondary, #666);
  cursor: pointer;
  transition: var(--transition, all 0.2s ease);
}

.close-button:hover {
  color: var(--color-primary, #00dc82);
}

.close-button svg {
  width: 18px;
  height: 18px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.avatar-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.75rem;
  font-weight: 600;
}

.avatar-preview svg {
  width: 40px;
  height: 40px;
}

.avatar-actions {
  display: flex;
  gap: 0.5rem;
}

.color-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f5f5f5;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition, all 0.2s ease);
}

.color-button:hover {
  background: #e8e8e8;
}

.color-button svg {
  width: 16px;
  height: 16px;
}

.form-group {
  margin-bottom: 0.5rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text, #1e1e1e);
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #999;
}

input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: var(--transition, all 0.2s ease);
}

input:focus {
  outline: none;
  border-color: var(--color-primary, #00dc82);
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.15);
}

input:disabled {
  background-color: #f8f8f8;
  cursor: not-allowed;
}

.input-help {
  font-size: 0.8rem;
  color: #777;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.cancel-button, .save-button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition, all 0.2s ease);
  display: flex;
  justify-content: center;
  align-items: center;
}

.cancel-button {
  background-color: #f5f5f5;
  color: var(--color-text, #1e1e1e);
}

.save-button {
  background-color: var(--color-primary, #00dc82);
  color: white;
}

.cancel-button:hover:not(:disabled) {
  background-color: #e8e8e8;
}

.save-button:hover:not(:disabled) {
  background-color: #00c476;
}

.cancel-button:disabled, .save-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-top: 1.5rem;
  animation: fadeIn 0.3s ease;
  font-size: 0.9rem;
}

.auth-message svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.auth-message.error {
  background-color: #FEEFEF;
  color: #D32F2F;
}

.auth-message.success {
  background-color: #E7F6E7;
  color: #2E7D32;
}

.auth-message.error svg {
  color: #D32F2F;
}

.auth-message.success svg {
  color: #2E7D32;
}

.section-divider {
  display: flex;
  align-items: center;
  margin: 1rem 0;
}

.section-divider::before,
.section-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background-color: #eee;
}

.section-divider span {
  padding: 0 1rem;
  font-size: 0.9rem;
  color: #999;
}

.password-section {
  margin-top: 0.5rem;
}

.password-reset-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition, all 0.2s ease);
}

.password-reset-button:hover:not(:disabled) {
  background-color: #e8e8e8;
}

.password-reset-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.password-reset-button svg {
  width: 16px;
  height: 16px;
}
</style>
