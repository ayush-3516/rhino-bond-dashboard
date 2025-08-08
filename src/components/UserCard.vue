<template>
  <div class="user-card">
    <div class="card-header">
      <div class="user-avatar" :style="{ backgroundColor: getUserColor(user.id) }">
        {{ getUserInitials(user.name) }}
      </div>
      <div class="user-info">
        <h3 class="user-name">{{ user.name || 'Unnamed User' }}</h3>
        <span class="user-role" :class="user.role">{{ user.role }}</span>
      </div>
      <div class="card-actions">
        <UserActions 
          :user="user" 
          @update-user="$emit('update-user', $event)"
          @delete-user="$emit('delete-user', $event)"
        />
      </div>
    </div>
    
    <div class="card-body">
      <div class="user-details">
        <div class="detail-item">
          <span class="detail-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Phone:
          </span>
          <span class="detail-value">{{ user.phone || 'Not provided' }}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Email:
          </span>
          <span class="detail-value">{{ user.email || 'Not provided' }}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Joined:
          </span>
          <span class="detail-value">{{ formatDate(user.created_at) }}</span>
        </div>
      </div>
      
      <div class="card-footer">
        <div class="status-badge" :class="{ active: user.admin_confirmation }">
          <span>{{ user.admin_confirmation ? 'Verified' : 'Unverified' }}</span>
        </div>
        
        <div class="points-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span>{{ user.points_balance || 0 }} points</span>
        </div>
        
        <div v-if="user.agent_code" class="agent-code">
          <span class="code-label">Agent Code:</span>
          <span class="code-value">
            {{ user.agent_code }}
            <button 
              class="copy-inline-btn" 
              title="Copy agent code"
              @click.stop="copyToClipboard(user.agent_code)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useNotifications } from '@/composables/useNotifications'

// Lazy load UserActions component
const UserActions = defineAsyncComponent(() => import('./UserActions.vue'))

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

defineEmits(['update-user', 'delete-user'])

const { showToast } = useNotifications()

// Generate user initials for avatar
function getUserInitials(name) {
  if (!name) return '?'
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Generate a color based on user ID for avatar
function getUserColor(id) {
  if (!id) return '#42b983'
  
  // Simple hash function to generate consistent color
  const hash = id.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  // Generate hue from hash (0-360)
  const hue = hash % 360
  
  // Return HSL color with fixed saturation and lightness
  return `hsl(${hue}, 70%, 65%)`
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// Copy to clipboard function
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Agent code copied to clipboard', 'success')
  } catch (err) {
    console.error('Failed to copy: ', err)
    showToast('Failed to copy to clipboard', 'error')
  }
}
</script>

<style scoped>
.user-card {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Card Header */
.card-header {
  padding: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
}

.user-info {
  flex-grow: 1;
  overflow: hidden;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-role.user {
  background-color: #e9f5fe;
  color: #0066cc;
}

.user-role.agent {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.user-role.admin {
  background-color: #fff3e0;
  color: #e65100;
}

/* Card Body */
.card-body {
  padding: var(--space-md);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.detail-value {
  font-size: 0.9rem;
  color: var(--color-text);
  word-break: break-word;
}

/* Card Footer */
.card-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  background-color: #ffecb3;
  color: #ff6f00;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.points-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: #f5f5f5;
  color: var(--color-text);
}

.points-badge svg {
  color: #ffc107;
}

.agent-code {
  margin-left: auto;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.code-label {
  color: var(--color-text-secondary);
}

.code-value {
  padding: 2px 6px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.copy-inline-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  color: var(--color-text-secondary);
}

.copy-inline-btn:hover {
  opacity: 1;
}
</style>
