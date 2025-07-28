<template>
  <div class="batch-section">
    <div class="section-header">
      <h2>QR Code Batches</h2>
      <div class="batch-controls">
        <div class="search-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="batchFilter"
            type="text"
            placeholder="Search batches..."
            class="batch-search"
          />
        </div>
        <div class="pagination">
          <button @click="prevPage" :disabled="currentPage === 1" class="pagination-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span>Page {{ currentPage }} of {{ totalPages || 1 }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="pagination-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="batchLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading batches...</p>
    </div>
    <div v-else-if="paginatedBatches.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <rect x="7" y="7" width="3" height="3"></rect>
        <rect x="14" y="7" width="3" height="3"></rect>
        <rect x="7" y="14" width="3" height="3"></rect>
        <rect x="14" y="14" width="3" height="3"></rect>
      </svg>
      <p>No QR code batches found</p>
      <p class="empty-state-hint">Switch to the Generate tab to create new QR codes</p>
    </div>
    <div v-else>
      <div class="table-container">
        <table class="batch-table">
          <thead>
            <tr>
              <th width="40">
                <div class="checkbox-wrapper">
                  <input
                    type="checkbox"
                    :checked="props.selectedBatches.length > 0 && props.selectedBatches.length === paginatedBatches.length"
                    @change="toggleAllSelection"
                    id="select-all"
                    class="custom-checkbox"
                  />
                  <label for="select-all"></label>
                </div>
              </th>
              <th>Batch ID</th>
              <th>Product</th>
              <th>Created Date</th>
              <th width="100">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(batch, index) in paginatedBatches"
              :key="batch?.id || index"
              :class="{ selected: batch?.id && props.selectedBatches.includes(batch.id) }"
            >
              <td>
                <div class="checkbox-wrapper">
                  <input
                    type="checkbox"
                    :id="`batch-${index}`"
                    :checked="batch?.id && props.selectedBatches.includes(batch.id)"
                    @change="batch?.id && toggleBatchSelection(batch.id)"
                    class="custom-checkbox"
                  />
                  <label :for="`batch-${index}`"></label>
                </div>
              </td>
              <td class="batch-id">{{ batch?.id || 'N/A' }}</td>
              <td>{{ batch?.productName || 'N/A' }}</td>
              <td>{{ formatDate(batch?.created_at) }}</td>
              <td>
                <button
                  class="view-batch"
                  @click="batch?.id && viewBatch(batch.id)"
                  :disabled="!batch?.id"
                  title="View QR Codes"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>View</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="batch-actions">
        <div class="selection-info">
          <span class="selected-count">{{ props.selectedBatches.length }} batches selected</span>
        </div>
        <div class="action-buttons">
          <button 
            class="export-button" 
            @click="exportSelectedBatches" 
            :disabled="selectedBatches.length === 0 || loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {{ loading ? 'Exporting...' : `Export Selected` }}
          </button>
          <button 
            class="delete-button"
            @click="confirmDelete"
            :disabled="selectedBatches.length === 0 || loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Delete Selected
          </button>
        </div>
      </div>

      <div v-if="showDeleteDialog" class="delete-dialog-overlay">
        <div class="delete-dialog">
          <div class="dialog-header">
            <h3>Confirm Deletion</h3>
            <button class="close-dialog" @click="showDeleteDialog = false">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="dialog-content">
            <div class="warning-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <p>Are you sure you want to delete <strong>{{ selectedBatches.length }}</strong> batches?</p>
            <p class="warning-text">This action cannot be undone and will permanently delete all associated QR codes.</p>
          </div>
          <div class="dialog-buttons">
            <button class="cancel-button" @click="showDeleteDialog = false">Cancel</button>
            <button class="confirm-button" @click="deleteSelectedBatches">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  batches: {
    type: Array,
    required: true,
  },
  selectedBatches: {
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
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:selected-batches', 'viewBatch', 'export-selected-batches', 'delete-selected-batches', 'prev-page', 'next-page'])

const batchFilter = ref('')
const showDeleteDialog = ref(false)

// Add paginatedBatches computed property
const paginatedBatches = computed(() => {
  return props.batches || []
})

const toggleBatchSelection = (batchId) => {
  if (!batchId) return
  
  let newSelection
  if (props.selectedBatches.includes(batchId)) {
    newSelection = props.selectedBatches.filter(id => id !== batchId)
  } else {
    newSelection = [...props.selectedBatches, batchId]
  }
  emit('update:selected-batches', newSelection)
}

const toggleAllSelection = () => {
  const validBatches = props.batches?.filter(batch => batch?.id) || []
  const newSelection = props.selectedBatches.length === validBatches.length ? [] : validBatches.map(batch => batch.id)
  emit('update:selected-batches', newSelection)
}

const prevPage = () => emit('prev-page')
const nextPage = () => emit('next-page')
const viewBatch = (batchId) => batchId && emit('viewBatch', batchId)
const exportSelectedBatches = () => emit('export-selected-batches')
const deleteSelectedBatches = () => {
  showDeleteDialog.value = false
  emit('delete-selected-batches', props.selectedBatches)
}

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (e) {
    console.error('Date formatting error:', e)
    return dateString
  }
}
</script>

<style scoped>
.batch-section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-secondary);
}

.batch-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.batch-search {
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  width: 300px;
  font-size: 0.9rem;
  transition: all 0.2s;
  background: #f9f9f9;
}

.batch-search:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.1);
  background: white;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(0, 220, 130, 0.1);
  color: var(--color-primary);
}

.pagination-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.table-container {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
}

.batch-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0;
}

.batch-table th,
.batch-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.batch-table th {
  background-color: #f9f9f9;
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.batch-table tr:last-child td {
  border-bottom: none;
}

.batch-table tr:hover {
  background-color: rgba(0, 220, 130, 0.03);
}

.batch-table tr.selected {
  background-color: rgba(0, 220, 130, 0.07);
}

.batch-id {
  font-family: monospace;
  font-size: 0.9rem;
  color: #555;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.checkbox-wrapper {
  position: relative;
  width: 20px;
  height: 20px;
  margin: 0 auto;
}

.custom-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-wrapper label {
  position: absolute;
  top: 0;
  left: 0;
  height: 18px;
  width: 18px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox-wrapper label:hover {
  background-color: #e9e9e9;
}

.custom-checkbox:checked + label {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.custom-checkbox:checked + label:after {
  content: "";
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.view-batch {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background-color: rgba(0, 220, 130, 0.1);
  color: var(--color-primary);
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-batch:hover:not(:disabled) {
  background-color: rgba(0, 220, 130, 0.2);
}

.view-batch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-actions {
  margin-top: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.selection-info {
  color: #666;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.export-button, .delete-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.export-button {
  background-color: var(--color-primary);
  color: white;
}

.export-button:hover:not(:disabled) {
  background-color: #00b86b;
}

.export-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-button {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.delete-button:hover:not(:disabled) {
  background-color: rgba(239, 68, 68, 0.15);
}

.delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Delete dialog */
.delete-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.delete-dialog {
  background-color: white;
  border-radius: 12px;
  width: 450px;
  max-width: 90%;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  animation: dialog-appear 0.2s ease-out;
}

@keyframes dialog-appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.dialog-header h3 {
  margin: 0;
  color: #ef4444;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-dialog {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #888;
  transition: color 0.2s;
}

.close-dialog:hover {
  color: #333;
}

.dialog-content {
  padding: 1.5rem;
  text-align: center;
}

.warning-icon {
  margin-bottom: 1rem;
  color: #ef4444;
}

.warning-text {
  font-size: 0.9rem;
  color: #888;
  margin-top: 0.5rem;
}

.dialog-buttons {
  display: flex;
  padding: 1.25rem 1.5rem;
  gap: 0.75rem;
  justify-content: flex-end;
  background-color: #f9f9f9;
}

.cancel-button {
  background-color: white;
  color: #666;
  border: 1px solid #ddd;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover {
  background-color: #f3f3f3;
}

.confirm-button {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-button:hover {
  background-color: #dc2626;
}

/* Empty and Loading states */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.empty-state {
  color: #888;
}

.empty-state svg {
  margin-bottom: 1rem;
  color: #ccc;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.empty-state-hint {
  font-size: 0.9rem !important;
  color: #999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 220, 130, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .batch-controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    width: 100%;
  }
  
  .batch-search {
    width: 100%;
    box-sizing: border-box;
  }
  
  .pagination {
    justify-content: space-between;
    width: 100%;
  }
  
  .batch-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    width: 100%;
  }
  
  .export-button, .delete-button {
    flex: 1;
    justify-content: center;
  }
  
  .batch-table {
    display: block;
    overflow-x: auto;
  }
  
  .dialog-buttons {
    flex-direction: column-reverse;
  }
}
</style>