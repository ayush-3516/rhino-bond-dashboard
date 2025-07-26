<template>
  <div class="user-list-container">
    <div v-if="users.length === 0" class="no-results">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
      <p>No users found. Try a different search term.</p>
    </div>
    
    <div class="list-header">
      <span class="header-col user-col">User</span>
      <span class="header-col points-col">Points Balance</span>
      <span class="header-col select-col">Select</span>
    </div>
    
    <div class="user-list">
      <div
        v-for="user in users"
        :key="user.id"
        class="user-item"
        :class="{ selected: isSelected(user.id) }"
      >
        <div class="user-info">
          <div class="user-avatar">{{ getUserInitials(user.name) }}</div>
          <div class="user-details">
            <span class="user-name">{{ user.name || 'Unnamed User' }}</span>
            <span class="user-email">{{ user.email || 'No email' }}</span>
          </div>
        </div>
        
        <span class="user-points">{{ user.points_balance?.toLocaleString() || '0' }} pts</span>
        
        <div class="user-select">
          <button class="select-btn" @click="toggleUser(user.id)">
            <svg v-if="isSelected(user.id)" class="icon-selected" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <svg v-else class="icon-unselected" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16 L12 12 L12 8"></path>
            </svg>
            {{ isSelected(user.id) ? 'Selected' : 'Select' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  users: {
    type: Array,
    required: true,
    default: () => []
  },
  selectedUsers: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['toggle-user'])

function isSelected(userId) {
  return props.selectedUsers.includes(userId)
}

function toggleUser(userId) {
  emit('toggle-user', userId)
}

// Generate user initials for avatar
function getUserInitials(name) {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
</script>

<style scoped>
.user-list-container {
  display: flex;
  flex-direction: column;
}

.list-header {
  display: grid;
  grid-template-columns: 1fr 120px 100px;
  padding: 0 var(--space-sm);
  margin-bottom: var(--space-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary, #666);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: var(--space-sm);
}

.user-list {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius-lg);
  max-height: 450px;
  overflow-y: auto;
  background: white;
  box-shadow: var(--shadow-sm);
}

.user-item {
  display: grid;
  grid-template-columns: 1fr 120px 100px;
  align-items: center;
  padding: var(--space-sm) var(--space-sm);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background-color: rgba(66, 185, 131, 0.05);
  transform: translateX(4px);
}

.user-item.selected {
  background-color: rgba(66, 185, 131, 0.1);
  border-left: 3px solid var(--color-primary);
}

.user-info {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: var(--color-primary);
  color: white;
  font-weight: 500;
  border-radius: 50%;
  margin-right: var(--space-sm);
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.85rem;
  color: var(--color-text-secondary, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-points {
  font-weight: 500;
  color: var(--color-primary);
  text-align: center;
}

.user-select {
  display: flex;
  justify-content: flex-end;
}

.select-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: var(--border-radius);
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.icon-selected, .icon-unselected {
  width: 16px;
  height: 16px;
}

.icon-selected {
  color: var(--color-primary);
}

.icon-unselected {
  color: var(--color-text-secondary, #666);
}

.no-results {
  padding: var(--space-lg);
  text-align: center;
  color: var(--color-text-secondary, #666);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--border-radius);
}

.no-results svg {
  width: 36px;
  height: 36px;
  opacity: 0.5;
}

.no-results p {
  margin: 0;
}

@media (max-width: 640px) {
  .list-header {
    grid-template-columns: 1fr auto;
  }
  
  .user-item {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: var(--space-xs);
  }
  
  .user-points {
    grid-column: 2;
    grid-row: 1;
  }
  
  .user-select {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-content: flex-start;
  }
  
  .header-col.select-col {
    display: none;
  }
}
</style>
