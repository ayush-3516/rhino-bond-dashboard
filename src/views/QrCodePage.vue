<template>
  <div class="qr-code-page">
    <h1>QR Code Management</h1>

    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'generate' }]"
        @click="activeTab = 'generate'"
      >
        Generate QR Codes
      </button>
      <button :class="['tab', { active: activeTab === 'export' }]" @click="activeTab = 'export'">
        Export QR Codes
      </button>
    </div>

    <div v-if="activeTab === 'generate'" class="tab-content">
      <QrCodeGenerator @codes-generated="handleCodesGenerated" />
    </div>

    <div v-if="activeTab === 'export'" class="tab-content">
      <BatchTable
        :batches="paginatedBatches"
        :selected-batches="selectedBatches"
        :batch-loading="batchLoading"
        :current-page="currentPage"
        :total-pages="totalPages"
        :loading="loading"
        @toggle-batch-selection="toggleBatchSelection"
        @export-selected-batches="exportSelectedBatches"
        @view-batch="viewBatch"
        @prev-page="prevPage"
        @next-page="nextPage"
      />
    </div>

    <QrCodeList v-if="currentBatchQRCodes.length > 0" :codes="currentBatchQRCodes" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

// Tab management
const activeTab = ref('generate')
import { supabase } from '../supabase'
import BatchTable from '../components/QrCode/BatchTable.vue'
import QrCodeList from '../components/QrCode/QrCodeList.vue'
import QrCodeGenerator from '../components/QrCode/QrCodeGenerator.vue'

// Reactive state variables
const batches = ref([])
const selectedBatches = ref([])
const currentBatchQRCodes = ref([])
const loading = ref(false)
const batchLoading = ref(false)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = 10
const batchFilter = ref('')

// Computed properties
const filteredBatches = computed(() => {
  return batches.value.filter((batch) => {
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

// Fetch all QR code batches from Supabase
const fetchBatches = async () => {
  try {
    batchLoading.value = true
    const { data, error } = await supabase
      .from('qr_codes')
      .select('batch_id, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const batchesMap = new Map()
    data
      .filter((code) => code?.batch_id)
      .forEach((code) => {
        const batchId = code.batch_id
        const createdAt = code.created_at || new Date().toISOString()

        if (batchId && createdAt) {
          if (!batchesMap.has(batchId)) {
            batchesMap.set(batchId, {
              id: batchId,
              created_at: createdAt,
            })
          }
        }
      })

    batches.value = Array.from(batchesMap.values())
  } catch (error) {
    console.error('Error fetching batches:', error)
    alert('Failed to fetch batches. Please try again.')
  } finally {
    batchLoading.value = false
  }
}

// View details of a specific batch
const viewBatch = async (batchId) => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })

    if (error) throw error
    currentBatchQRCodes.value = data || []
  } catch (error) {
    console.error('Error fetching batch QR codes:', error)
    alert('Failed to fetch QR codes. Please try again.')
  } finally {
    loading.value = false
  }
}

// Toggle selection of batches for export
const toggleBatchSelection = (batchId) => {
  if (selectedBatches.value.includes(batchId)) {
    selectedBatches.value = selectedBatches.value.filter((id) => id !== batchId)
  } else {
    selectedBatches.value.push(batchId)
  }
}

// Handle new codes generated from QrCodeGenerator
const handleCodesGenerated = (newCodes) => {
  currentBatchQRCodes.value = newCodes
  fetchBatches()
}

// Initialize component
onMounted(async () => {
  await fetchBatches()
})
</script>

<style scoped>
.qr-code-page {
  padding: 20px;
}

.tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.tab {
  padding: 10px 20px;
  margin-right: 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s ease;
}

.tab:hover {
  color: #007bff;
}

.tab.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
}

.tab-content {
  margin-top: 20px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 24px;
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading::after {
  content: '';
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-left: 10px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Print styles for PDF export */
@media print {
  .qr-code-page {
    padding: 0;
  }
}
</style>
