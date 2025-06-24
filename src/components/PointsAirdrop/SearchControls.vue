<template>
  <div class="search-controls">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search users..."
      class="search-input"
      @input="handleSearch"
    />
    <div class="bulk-actions">
      <button @click="selectAll" class="select-btn">Select All</button>
      <button @click="clearSelection" class="select-btn">Clear</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const searchQuery = ref('')
const debounceTimeout = ref(null)

const emit = defineEmits(['search', 'select-all', 'clear-selection'])

function handleSearch() {
  // Clear any existing timeout
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
  
  // Set a new timeout to debounce the search
  debounceTimeout.value = setTimeout(() => {
    emit('search', searchQuery.value)
  }, 300) // 300ms debounce
}

function selectAll() {
  emit('select-all')
}

function clearSelection() {
  emit('clear-selection')
}
</script>

<style scoped>
.search-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.bulk-actions {
  display: flex;
  gap: 8px;
}

.select-btn {
  padding: 8px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
</style>
