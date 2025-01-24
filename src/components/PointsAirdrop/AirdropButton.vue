<template>
  <button
    @click="$emit('click')"
    :disabled="isLoading || !selectedUsersCount || !points"
    class="airdrop-btn"
  >
    {{ isLoading ? 'Processing...' : `Airdrop to ${selectedUsersCount} users` }}
  </button>
</template>

<script setup>
defineProps({
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
  }
})

defineEmits(['click'])
</script>

<style scoped>
.airdrop-btn {
  padding: 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.airdrop-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.airdrop-btn:not(:disabled):hover {
  background-color: #3aa876;
}
</style>
