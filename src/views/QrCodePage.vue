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
      <ExportSettingsDialog
        v-if="showExportDialog"
        @confirm="handleExportSettings"
        @close="showExportDialog = false"
      />
      <BatchTable
        :batches="paginatedBatches"
        v-model:selected-batches="selectedBatches"
        :batch-loading="batchLoading"
        :current-page="currentPage"
        :total-pages="totalPages"
        :loading="loading"
        @view-batch="viewBatch"
        @prev-page="prevPage"
        @next-page="nextPage"
        @export-selected-batches="() => showExportDialog = true"
        @delete-selected-batches="deleteSelectedBatches"
      />
    </div>

    <QrCodeList v-if="currentBatchQRCodes.length > 0" :codes="currentBatchQRCodes" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { supabase } from '../supabase'
import BatchTable from '../components/QrCode/BatchTable.vue'
import QrCodeList from '../components/QrCode/QrCodeList.vue'
import QrCodeGenerator from '../components/QrCode/QrCodeGenerator.vue'
import ExportSettingsDialog from '../components/QrCode/ExportSettingsDialog.vue'

// Explicitly register components
const components = {
  BatchTable,
  QrCodeList,
  QrCodeGenerator,
  ExportSettingsDialog
}

// Tab management
const activeTab = ref('generate')

// Reactive state variables
const batches = ref([])
const showExportDialog = ref(false)
const exportSettings = ref({
  size: 30,
  perRow: 4,
  margin: 10
})
const selectedBatches = ref([])

watch(selectedBatches, (newValue) => {
  console.log('Selected batches updated:', newValue)
}, { deep: true })
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
    console.log('Fetching batches from Supabase...')
    const { data, error } = await supabase
      .from('qr_codes')
      .select('batch_id, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    
    console.log('Supabase response:', data)
    
    if (!data || data.length === 0) {
      console.warn('No QR code batches found in database')
      return
    }

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
      
    console.log('Processed batches:', Array.from(batchesMap.values()))

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

// Handle new codes generated from QrCodeGenerator
const handleCodesGenerated = (newCodes) => {
  currentBatchQRCodes.value = newCodes
  fetchBatches()
}

// Delete selected batches
const deleteSelectedBatches = async (batchIds) => {
  try {
    loading.value = true
    
    if (!batchIds || batchIds.length === 0) {
      throw new Error('No batches selected for deletion')
    }

    // Delete all QR codes in the selected batches
    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .in('batch_id', batchIds)

    if (error) throw error

    // Refresh batches list
    await fetchBatches()
    selectedBatches.value = []
    alert('Batches deleted successfully')
  } catch (error) {
    console.error('Error deleting batches:', error)
    alert('Failed to delete batches. Please try again.')
  } finally {
    loading.value = false
  }
}

// Export selected batches as PDF
const handleExportSettings = (settings) => {
  exportSettings.value = settings
  showExportDialog.value = false
  
  // Create a new array from the selected batches to avoid Proxy issues
  const batchesToExport = Array.isArray(selectedBatches.value) 
    ? [...selectedBatches.value]
    : []
  
  exportSelectedBatches(batchesToExport)
}

const exportSelectedBatches = async (selectedBatchIds) => {
  try {
    loading.value = true
    
    // Ensure we have a valid array of batch IDs
    if (!Array.isArray(selectedBatchIds) || !selectedBatchIds.length) {
      throw new Error('No batches selected for export')
    }
    
    // Convert Proxy to plain array if needed
    const batchIds = [...selectedBatchIds]
    
    console.log('Exporting batches:', batchIds)
    console.log('Batch IDs type:', typeof batchIds)
    console.log('Batch IDs length:', batchIds.length)
    
    console.log('Starting PDF export for batches:', selectedBatchIds)
    
    // Get all QR codes for selected batches
    const { data: qrCodes, error } = await supabase
      .from('qr_codes')
      .select('*')
      .in('batch_id', selectedBatchIds)
      .order('created_at', { ascending: true })

    if (error) throw error
    
    console.log('Fetched', qrCodes.length, 'QR codes for export')

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = exportSettings.value.margin
    const size = exportSettings.value.size
    // Calculate available width and spacing
    const availableWidth = pageWidth - margin * 2
    const codesPerRow = exportSettings.value.perRow
    const spacing = (availableWidth - (size * codesPerRow)) / (codesPerRow - 1)
    const qrPerPage = codesPerRow * Math.floor((pageHeight - margin * 2) / (size + 15))
    
    let currentPage = 1
    let x = margin
    let y = margin

    for (let i = 0; i < qrCodes.length; i++) {
      const code = qrCodes[i]
      
      // Create temporary canvas for QR code
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      
      console.log('Creating canvas for QR code:', code.id)
      
      try {
        // Generate QR code with JSON data containing only id
        const qrData = JSON.stringify({ id: code.id })
        await QRCode.toCanvas(canvas, qrData, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
        console.log('Successfully generated QR code for:', code.id)
        
        // Verify canvas has content
        const imageData = ctx.getImageData(0, 0, size, size)
        console.log('Canvas image data:', imageData)
      } catch (err) {
        console.error('Error generating QR code:', err)
        throw err
      }

      // Add QR code to PDF
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', x, y, size, size)
      
      // Add manual identifier below QR code
      pdf.setFontSize(8)
      const identifier = code.manual_identifier
      const textWidth = pdf.getStringUnitWidth(identifier) * pdf.internal.getFontSize() / pdf.internal.scaleFactor
      pdf.text(identifier, x + (size - textWidth)/2, y + size + 5)

      // Update position for next QR code
      x += size + spacing
      if (x + size > pageWidth - margin) {
        x = margin
        y += size + 15
      }

      // Add new page if needed
      if ((i + 1) % qrPerPage === 0 && i < qrCodes.length - 1) {
        pdf.addPage()
        currentPage++
        x = margin
        y = margin
      }
    }

    // Save PDF
    pdf.save(`qr_codes_${new Date().toISOString().slice(0,10)}.pdf`)
    
  } catch (error) {
    console.error('Error exporting QR codes:', error)
    alert('Failed to export QR codes. Please try again.')
  } finally {
    loading.value = false
  }
}

// Pagination methods
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Initialize component
onMounted(async () => {
  console.log('QrCodePage mounted')
  const authStore = useAuthStore()
  console.log('Authentication state:', authStore.isAuthenticated)
  console.log('User:', authStore.user)
  
  if (!authStore.isAuthenticated) {
    console.log('User not authenticated, redirecting to auth')
    return
  }
  
  console.log('User authenticated, fetching batches')
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
