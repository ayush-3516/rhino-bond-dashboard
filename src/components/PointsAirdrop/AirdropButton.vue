<template>
  <button
    @click="$emit('click')"
    :disabled="isLoading || !selectedUsersCount || !points"
    class="airdrop-btn"
  >
    <svg v-if="isLoading" class="spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
      <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"></path>
    </svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v6m0 12v2M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24"></path>
    </svg>
    <span class="btn-text">{{ buttonText }}</span>
    <span v-if="showDetails && !isLoading" class="btn-details">{{ pointsText }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isLoading: {
    type: Boolean,
    required: true
  },
  selectedUsersCount: {
    type: Number,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  showDetails: {
    type: Boolean,
    default: true
  }
})

defineEmits(['click'])

const buttonText = computed(() => {
  if (props.isLoading) {
    return 'Processing...'
  }
  return `Airdrop to ${props.selectedUsersCount} users`
})

const pointsText = computed(() => {
  if (!props.selectedUsersCount || !props.points) {
    return ''
  }
  const total = props.selectedUsersCount * props.points
  return `${props.points} points each (${total.toLocaleString()} total)`
})
</script>

<style scoped>
.airdrop-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  border: none;
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(66, 185, 131, 0.25);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.airdrop-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-text {
  position: relative;
  z-index: 2;
}

.btn-details {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.15);
  font-size: 0.75rem;
  padding: 3px;
  text-align: center;
  transition: all 0.2s ease;
  transform: translateY(100%);
}

.airdrop-btn:not(:disabled):hover {
  background-color: var(--color-primary-dark, #3aa876);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(66, 185, 131, 0.25);
}

.airdrop-btn:not(:disabled):hover .btn-details {
  transform: translateY(0);
}

.airdrop-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
