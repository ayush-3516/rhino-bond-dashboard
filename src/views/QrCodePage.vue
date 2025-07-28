<template>
  <div class="qr-code-page">
    <div class="page-header">
      <div class="header-title">
        <h1>QR Code Management</h1>
        <p class="subtitle">Generate, manage, and export QR codes for your products</p>
      </div>
      <div class="header-actions">
        <div class="batch-stats">
          <div class="stat-item">
            <div class="stat-value">{{ batches.length }}</div>
            <div class="stat-label">Total Batches</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ totalQrCodes }}</div>
            <div class="stat-label">Total QR Codes</div>
          </div>
        </div>
      </div>
    </div>

    <div class="tabs-container">
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'generate' }]"
          @click="activeTab = 'generate'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Generate QR Codes
        </button>
        <button :class="['tab', { active: activeTab === 'export' }]" @click="activeTab = 'export'">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Manage & Export
        </button>
      </div>
    </div>

    <div class="content-card">
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
          :selected-batches="selectedBatches"
          :batch-loading="batchLoading"
          :current-page="currentPage"
          :total-pages="totalPages"
          :loading="loading"
          @update:selected-batches="handleUpdateSelectedBatches"
          @view-batch="viewBatch"
          @prev-page="prevPage"
          @next-page="nextPage"
          @export-selected-batches="() => showExportDialog = true"
          @delete-selected-batches="deleteSelectedBatches"
        />
      </div>
    </div>

    <div v-if="currentBatchQRCodes.length > 0" class="content-card qr-codes-viewer">
      <QrCodeList :codes="currentBatchQRCodes" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
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
const batches = ref([])
const showExportDialog = ref(false)
const selectedBatches = ref([])
const currentBatchQRCodes = ref([])
const loading = ref(false)
const batchLoading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10
const batchFilter = ref('')

// Export settings with defaults
const exportSettings = ref({
  size: 30,
  perRow: 4,
  margin: 10
})

// Computed properties
const filteredBatches = computed(() => {
  const searchTerm = batchFilter.value.toLowerCase()
  return batches.value.filter(batch => 
    !searchTerm || batch?.id?.toLowerCase().includes(searchTerm)
  )
})

const totalPages = computed(() => 
  Math.ceil(filteredBatches.value.length / itemsPerPage)
)

const paginatedBatches = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredBatches.value.slice(start, start + itemsPerPage)
})

const totalQrCodes = computed(() => 
  currentBatchQRCodes.value.length || 'N/A'
)

// Batch management methods
const handleUpdateSelectedBatches = (newValue) => {
  selectedBatches.value = newValue
}

const handleExportSettings = (settings) => {
  exportSettings.value = settings
  showExportDialog.value = false
  if (selectedBatches.value.length) {
    exportSelectedBatches(selectedBatches.value)
  }
}

// Fetch all QR code batches from Supabase
const fetchBatches = async () => {
  try {
    batchLoading.value = true
    console.log('Fetching batches from Supabase...')
    const { data, error } = await supabase
      .from('qr_codes')
      .select(`
        batch_id, 
        created_at, 
        id, 
        product_id,
        products:product_id (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    console.log('Supabase response:', data)
    
    if (!data || data.length === 0) {
      console.warn('No QR code batches found in database')
      batches.value = []
      return
    }

    // Use a Set to track unique batch IDs while preserving order
    const uniqueBatches = []
    const seenBatchIds = new Set()
    
    for (const code of data) {
      if (code?.batch_id && !seenBatchIds.has(code.batch_id)) {
        uniqueBatches.push({
          id: code.batch_id,
          created_at: code.created_at || new Date().toISOString(),
          productName: code.products?.name || 'No Product',
          product_id: code.product_id,
          count: 1
        })
        seenBatchIds.add(code.batch_id)
      }
    }
    
    console.log('Processed batches:', uniqueBatches)
    batches.value = uniqueBatches
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

    // First, get all QR code IDs in the selected batches
    const { data: qrCodes, error: fetchError } = await supabase
      .from('qr_codes')
      .select('id')
      .in('batch_id', batchIds)
    
    if (fetchError) throw fetchError
    
    // If we have QR codes, delete their references in points_transactions first
    if (qrCodes && qrCodes.length > 0) {
      const qrCodeIds = qrCodes.map(code => code.id)
      
      // Delete related records in points_transactions first to prevent foreign key constraint violation
      const { error: txError } = await supabase
        .from('points_transactions')
        .delete()
        .in('qr_code_id', qrCodeIds)
      
      if (txError) throw txError
    }

    // Now delete the QR codes themselves
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
const exportSelectedBatches = async (selectedBatchIds) => {
  try {
    loading.value = true
    
    if (!Array.isArray(selectedBatchIds) || !selectedBatchIds.length) {
      throw new Error('No batches selected for export')
    }
    
    const batchIds = [...selectedBatchIds]
    console.log('Exporting batches:', batchIds)
    
    const { data: qrCodes, error } = await supabase
      .from('qr_codes')
      .select('*')
      .in('batch_id', batchIds)
      .order('created_at', { ascending: true })

    if (error) throw error
    console.log('Fetched', qrCodes.length, 'QR codes for export')

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = exportSettings.value.margin
    const size = exportSettings.value.size
    const codesPerRow = exportSettings.value.perRow
    const spacing = (pageWidth - margin * 2 - (size * codesPerRow)) / (codesPerRow - 1)
    const qrPerPage = codesPerRow * Math.floor((pageHeight - margin * 2) / (size + 15))
    
    let x = margin
    let y = margin
    let canvases = []

    // Process QR codes in chunks to prevent memory issues
    const chunkSize = 50
    for (let i = 0; i < qrCodes.length; i += chunkSize) {
      const chunk = qrCodes.slice(i, i + chunkSize)
      
      // Generate QR codes for this chunk
      for (const code of chunk) {
        // Create temporary canvas
        const canvas = document.createElement('canvas')
        canvas.width = size * 2 // Double size for better quality
        canvas.height = size * 2
        const ctx = canvas.getContext('2d')
        
        // Generate QR code
        const qrData = JSON.stringify({ id: code.id })
        await QRCode.toCanvas(canvas, qrData, {
          width: size * 2,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })

        // Add to PDF
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', x, y, size, size)
        
        // Add manual identifier below QR code
        pdf.setFontSize(8)
        const identifier = code.manual_identifier
        const textWidth = pdf.getStringUnitWidth(identifier) * pdf.internal.getFontSize() / pdf.internal.scaleFactor
        pdf.text(identifier, x + (size - textWidth)/2, y + size + 5)

        // Update position
        x += size + spacing
        if (x + size > pageWidth - margin) {
          x = margin
          y += size + 15
        }

        // New page if needed
        if (y + size + 15 > pageHeight - margin) {
          pdf.addPage()
          x = margin
          y = margin
        }

        // Store canvas for cleanup
        canvases.push(canvas)
      }

      // Cleanup canvases after each chunk
      canvases.forEach(canvas => {
        canvas.width = 0
        canvas.height = 0
      })
      canvases = []
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
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-title h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-secondary);
}

.subtitle {
  margin: 0.5rem 0 0 0;
  font-size: 1rem;
  color: #666;
}

.header-actions {
  display: flex;
  align-items: center;
}

.batch-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 0.8rem 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-width: 120px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 0.2rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

.tabs-container {
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  padding: 0.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: fit-content;
}

.tab {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab:hover {
  color: var(--color-primary);
  background: rgba(0, 220, 130, 0.05);
}

.tab.active {
  color: var(--color-primary);
  background: rgba(0, 220, 130, 0.1);
  font-weight: 500;
}

.tab svg {
  color: currentColor;
}

.content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.qr-codes-viewer {
  background: white;
  border-radius: 12px;
}

.tab-content {
  margin-top: 0.5rem;
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
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Print styles for PDF export */
@media print {
  .qr-code-page {
    padding: 0;
  }
  
  .page-header,
  .tabs-container {
    display: none;
  }
}

@media (max-width: 768px) {
  .qr-code-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .batch-stats {
    width: 100%;
  }
  
  .stat-item {
    flex: 1;
  }
}
</style>
