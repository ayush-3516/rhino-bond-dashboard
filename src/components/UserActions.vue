<template>
  <div class="user-actions">
    <button 
      class="icon-button action-indicator manage-button prominent-manage" 
      @click="toggleUserDetails" 
      :class="{ 'active': showUserDetails }"
      title="Manage User"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
      </svg>
      <span>Manage</span>
      <span class="action-tooltip">Click to manage this user</span>
    </button>
    
    <div v-if="showUserDetails" class="action-menu">
      <!-- Confirm User Button -->
      <button
        @click="toggleAdminConfirmation"
        class="menu-item"
        :class="{'confirm-item': !user.admin_confirmation, 'warning-item': user.admin_confirmation}"
      >
        <svg v-if="!user.admin_confirmation" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        {{ user.admin_confirmation ? 'Remove Verification' : 'Confirm User' }}
      </button>
      
      <!-- Role Management Buttons -->
      <button
        v-if="user.role === 'user'"
        @click="promoteToAgent"
        class="menu-item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
        Promote to Agent
      </button>
      
      <button
        v-if="user.role === 'agent'"
        @click="demoteToUser"
        class="menu-item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 9 12 15 6 9"></polyline>
        </svg>
        Demote to User
      </button>
      
      <!-- Generate Agent Code Button -->
      <button
        v-if="user.role === 'agent' && !user.agent_code"
        @click="handleAssignCode"
        class="menu-item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        Generate Agent Code
      </button>
      
      <!-- Copy ID Buttons -->
      <button
        @click="copyToClipboard(user.id, 'User ID')"
        class="menu-item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy User ID
      </button>
      
      <button
        v-if="user.agent_code"
        @click="copyToClipboard(user.agent_code, 'Agent Code')"
        class="menu-item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy Agent Code
      </button>
      
      <!-- Delete User Button -->
      <button
        @click="confirmDelete"
        class="menu-item delete-item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Delete User
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { withServiceRole, assignAgentCode } from '@/supabase'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update-user', 'delete-user'])

const { showToast } = useNotifications()
const showUserDetails = ref(false)

function toggleUserDetails() {
  showUserDetails.value = !showUserDetails.value
}

async function toggleAdminConfirmation() {
  try {
    const newStatus = !props.user.admin_confirmation
    const { error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .update({ admin_confirmation: newStatus })
        .eq('id', props.user.id)
    })

    if (error) throw error
    
    emit('update-user', { ...props.user, admin_confirmation: newStatus })
    showToast(`User ${newStatus ? 'verified' : 'unverified'} successfully`, 
              newStatus ? 'success' : 'warning')
    
  } catch (error) {
    console.error('Error updating user:', error)
    showToast('Failed to update user verification status', 'error')
  }
}

async function promoteToAgent() {
  try {
    const { error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .update({ role: 'agent' })
        .eq('id', props.user.id)
    })

    if (error) throw error
    
    showToast('User promoted to agent successfully', 'success')
    
    // Automatically generate an agent code
    try {
      const code = await assignAgentCode(props.user.id)
      emit('update-user', { ...props.user, role: 'agent', agent_code: code })
      showToast(`Agent code generated: ${code}`, 'info')
    } catch (codeError) {
      console.error('Failed to generate agent code:', codeError)
      emit('update-user', { ...props.user, role: 'agent' })
    }
  } catch (error) {
    console.error('Error promoting user to agent:', error)
    showToast('Failed to promote user', 'error')
  }
}

async function demoteToUser() {
  try {
    const updates = { 
      role: 'user',
      agent_code: null 
    }
    
    const { error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .update(updates)
        .eq('id', props.user.id)
    })

    if (error) throw error
    
    // If they had an agent code, deactivate it
    if (props.user.agent_code) {
      try {
        await withServiceRole(async (client) => {
          return client
            .from('agent_codes')
            .update({ is_active: false })
            .eq('code', props.user.agent_code)
        })
      } catch (codeError) {
        console.error('Error deactivating agent code:', codeError)
      }
    }
    
    emit('update-user', { ...props.user, role: 'user', agent_code: null })
    showToast('User demoted to regular user successfully', 'info')
    
  } catch (error) {
    console.error('Error demoting user:', error)
    showToast('Failed to demote user', 'error')
  }
}

async function handleAssignCode() {
  try {
    // Check if user already has a code
    if (props.user.agent_code) {
      const regenerate = confirm(`User already has agent code: ${props.user.agent_code}. Regenerate new code?`)
      if (!regenerate) return
      
      // Deactivate old code
      const { error: deactivateError } = await withServiceRole(async (client) => {
        return client
          .from('agent_codes')
          .update({ is_active: false })
          .eq('code', props.user.agent_code)
      })
      
      if (deactivateError) {
        console.error('Error deactivating old agent code:', deactivateError)
      }
    }
    
    const code = await assignAgentCode(props.user.id)
    emit('update-user', { ...props.user, agent_code: code })
    showToast(`Agent code generated: ${code}`, 'success')
    
  } catch (error) {
    console.error('Error assigning agent code:', error)
    showToast('Failed to assign agent code', 'error')
  }
}

async function copyToClipboard(text, type = 'Text') {
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      showToast(`${type} copied to clipboard`, 'success')
    } else {
      // Fallback method for older browsers or non-HTTPS
      fallbackCopyToClipboard(text, type)
    }
  } catch (err) {
    console.error('Failed to copy with clipboard API: ', err)
    // Fallback method
    fallbackCopyToClipboard(text, type)
  }
}

// Fallback copy method using document.execCommand
function fallbackCopyToClipboard(text, type = 'Text') {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // Make it invisible
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    textArea.style.zIndex = '-1'
    
    document.body.appendChild(textArea)
    
    // Select and copy the text
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    
    // Clean up
    document.body.removeChild(textArea)
    
    if (successful) {
      showToast(`${type} copied to clipboard`, 'success')
    } else {
      showToast('Copy failed. Please select and copy manually.', 'error')
    }
  } catch (err) {
    console.error('Fallback copy failed: ', err)
    showToast('Copy failed. Please select and copy manually.', 'error')
  }
}

function confirmDelete() {
  emit('delete-user', props.user)
}
</script>

<style scoped>
.user-actions {
  position: relative;
}

.icon-button {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-secondary);
  position: relative;
}

.icon-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-text);
}

.icon-button.action-indicator.manage-button {
  width: auto;
  padding: 6px 12px;
  border-radius: 16px;
  background-color: rgba(66, 185, 131, 0.15);
  border: 1px solid rgba(66, 185, 131, 0.4);
  color: var(--color-primary, #42b983);
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(66, 185, 131, 0.2);
  animation: gentle-pulse 1.5s infinite alternate;
}

@keyframes gentle-pulse {
  0% {
    box-shadow: 0 1px 3px rgba(66, 185, 131, 0.2);
    background-color: rgba(66, 185, 131, 0.15);
  }
  100% {
    box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
    background-color: rgba(66, 185, 131, 0.25);
  }
}

.icon-button.action-indicator.manage-button span {
  display: inline-block;
  font-size: 0.9rem;
  font-weight: 600;
}

.icon-button.action-indicator.manage-button:hover,
.icon-button.action-indicator.manage-button.active {
  background-color: var(--color-primary, #42b983);
  color: white;
  animation: none;
  transform: scale(1.05);
  box-shadow: 0 2px 10px rgba(66, 185, 131, 0.4);
}

.action-tooltip {
  position: absolute;
  bottom: -30px;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 20;
}

.icon-button:hover .action-tooltip {
  opacity: 1;
  visibility: visible;
}

.action-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 220px;
  overflow: hidden;
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text);
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  position: relative;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.menu-item::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.menu-item:hover::after {
  background-color: var(--color-primary, #42b983);
}

.menu-item.confirm-item {
  color: var(--color-primary);
}

.menu-item.warning-item {
  color: #ff9800;
}

.menu-item.delete-item {
  color: #f44336;
}

/* Toast Message Styles */
.toast-message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  min-width: 300px;
  max-width: 400px;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.toast-message.show {
  transform: translateX(0);
  opacity: 1;
}

.toast-message.success {
  background: linear-gradient(135deg, #10b981, #059669);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.toast-message.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.toast-message.info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.toast-message svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.toast-message span {
  flex: 1;
  line-height: 1.4;
}
</style>
