<template>
  <div class="batch-section">
    <h2>QR Code Batches</h2>
    <div class="batch-controls">
      <input
        v-model="batchFilter"
        type="text"
        placeholder="Search batches..."
        class="batch-search"
      />
      <div class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1">‹</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">›</button>
      </div>
    </div>

    <div v-if="batchLoading" class="loading">Loading batches...</div>
    <div v-else>
      <table class="batch-table">
        <thead>
          <tr>
            <th></th>
            <th>Batch ID</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(batch, index) in paginatedBatches"
            :key="batch?.id || index"
            :class="{ selected: batch?.id && selectedBatches.includes(batch.id) }"
          >
            <td>
              <input
                type="checkbox"
                :checked="batch?.id && selectedBatches.includes(batch.id)"
                @change="batch?.id && toggleBatchSelection(batch.id)"
              />
            </td>
            <td>{{ batch?.id || 'N/A' }}</td>
            <td>{{ formatDate(batch?.created_at) }}</td>
            <td>
              <button
                class="view-batch"
                @click="batch?.id && viewBatch(batch.id)"
                :disabled="!batch?.id"
              >
                View
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="batch-actions">
        <button @click="exportSelectedBatches" :disabled="selectedBatches.length === 0 || loading">
          {{ loading ? 'Exporting...' : `Export ${selectedBatches.length} Selected` }}
        </button>
        <span class="selected-count"> {{ selectedBatches.length }} selected </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  batches: {
    type: Array,
    required: true,
  },
  batchLoading: {
    type: Boolean,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:selectedBatches', 'viewBatch', 'exportBatches'])

const selectedBatches = ref([])
const currentPage = ref(1)
const itemsPerPage = 10
const batchFilter = ref('')

const filteredBatches = computed(() => {
  return props.batches.filter((batch) => {
    if (!batchFilter.value) return true
    return batch.id?.toLowerCase().includes(batchFilter.value.toLowerCase())
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredBatches.value.length / itemsPerPage)
})

const paginatedBatches = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredBatches.value.slice(start, end)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const toggleBatchSelection = (batchId) => {
  if (selectedBatches.value.includes(batchId)) {
    selectedBatches.value = selectedBatches.value.filter((id) => id !== batchId)
  } else {
    selectedBatches.value.push(batchId)
  }
  emit('update:selectedBatches', selectedBatches.value)
}

const viewBatch = (batchId) => {
  emit('viewBatch', batchId)
}

const exportSelectedBatches = () => {
  emit('exportBatches', selectedBatches.value)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
/* Copy batch table styles from QrCodePage.vue */
.batch-section {
  margin-bottom: 30px;
}

.batch-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.batch-search {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination button {
  padding: 5px 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #eee;
  cursor: not-allowed;
  opacity: 0.7;
}

.batch-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.batch-table th,
.batch-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.batch-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.batch-table tr:hover {
  background-color: #fafafa;
}

.batch-table tr.selected {
  background-color: #f0f8ff;
}

.selected-count {
  margin-left: 20px;
  color: #666;
  font-size: 0.9em;
}

.view-batch {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.view-batch:hover {
  background-color: #0056b3;
}

.view-batch:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.batch-actions {
  margin-top: 20px;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #666;
}

@media (max-width: 768px) {
  .batch-controls {
    flex-direction: column;
    gap: 10px;
  }

  .batch-search {
    width: 100%;
  }
}
</style>
