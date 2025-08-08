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
      <!-- Error message display -->
      <div v-if="error" class="error-banner">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        {{ error }}
      </div>

      <!-- Export progress indicator -->
      <div v-if="exportProgress.isExporting" class="export-progress">
        <div class="progress-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spinning">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6"></path>
            <path d="m21 12-6 0m-6 0-6 0"></path>
          </svg>
          <span>Exporting PDF... {{ exportProgress.percentage }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: exportProgress.percentage + '%' }"></div>
        </div>
        <div class="progress-details">
          Processing {{ exportProgress.current }} of {{ exportProgress.total }} chunks
        </div>
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

    <!-- Performance metrics (only shown in development or when explicitly enabled) -->
    <PerformanceMetrics
      v-if="isDevelopment"
      :metrics="performanceMetrics"
      :cache-stats="cacheStats"
      @clear-cache="clearPerformanceCache"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick, shallowRef } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'
import BatchTable from '../components/QrCode/BatchTable.vue'
import QrCodeList from '../components/QrCode/QrCodeList.vue'
import QrCodeGenerator from '../components/QrCode/QrCodeGenerator.vue'
import ExportSettingsDialog from '../components/QrCode/ExportSettingsDialog.vue'
import PerformanceMetrics from '../components/QrCode/PerformanceMetrics.vue'
import { 
  QRCodeCache, 
  PDFExportUtils, 
  BatchUtils, 
  ErrorHandler, 
  PerformanceMonitor,
  ValidationUtils 
} from '../utils/qrCodeUtils.js'
import { useQRCodePerformance } from '../composables/useQRCodePerformance.js'

// Lazy load heavy dependencies only when needed
const lazyImports = {
  html2canvas: null,
  jsPDF: null,
  QRCode: null
}

const loadExportDependencies = async () => {
  if (!lazyImports.html2canvas) {
    const [html2canvasModule, jsPDFModule, QRCodeModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
      import('qrcode')
    ])
    lazyImports.html2canvas = html2canvasModule.default
    lazyImports.jsPDF = jsPDFModule.default
    lazyImports.QRCode = QRCodeModule.default
  }
  return lazyImports
}

// Initialize cache and utilities
const cache = new QRCodeCache()
const performanceMonitor = PerformanceMonitor

// Use performance composable for enhanced functionality
const {
  metrics: performanceMetrics,
  getCacheStats,
  clearCache: clearPerformanceCache
} = useQRCodePerformance()

// Development mode check for showing performance metrics
const isDevelopment = import.meta.env.DEV || 
  localStorage.getItem('qr-show-metrics') === 'true'

// Computed cache stats for performance monitoring
const cacheStats = computed(() => getCacheStats())

// Explicitly register components
const components = {
  BatchTable,
  QrCodeList,
  QrCodeGenerator,
  ExportSettingsDialog,
  PerformanceMetrics
}

// Tab management
const activeTab = ref('generate')
const batches = shallowRef([]) // Use shallowRef for better performance with large arrays
const showExportDialog = ref(false)
const selectedBatches = ref([])
const currentBatchQRCodes = shallowRef([]) // Use shallowRef for better performance
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

// Error state management
const error = ref(null)
const retryCount = ref(0)
const MAX_RETRIES = 3

// Export progress tracking
const exportProgress = ref({
  isExporting: false,
  current: 0,
  total: 0,
  percentage: 0
})

// Computed properties with memoization
const filteredBatches = computed(() => {
  if (!batches.value || !Array.isArray(batches.value)) {
    return []
  }
  const searchTerm = batchFilter.value.toLowerCase()
  if (!searchTerm) return batches.value
  
  return batches.value.filter(batch => 
    batch && batch.id && batch.id.toLowerCase().includes(searchTerm)
  )
})

const totalPages = computed(() => {
  const filteredCount = filteredBatches.value.length
  return Math.max(1, Math.ceil(filteredCount / itemsPerPage))
})

const paginatedBatches = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredBatches.value.slice(start, start + itemsPerPage)
})

const totalQrCodes = computed(() => {
  if (!currentBatchQRCodes.value || !Array.isArray(currentBatchQRCodes.value)) {
    return 0
  }
  return currentBatchQRCodes.value.length
})

// Watch for page changes and reset current page if needed
watch(filteredBatches, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = 1
  }
}, { flush: 'post' })

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

// Utility functions
const handleError = (error, operation) => {
  console.error(`Error in ${operation}:`, error)
  error.value = ErrorHandler.createUserMessage(error, operation)
  
  // Auto-clear error after 5 seconds
  setTimeout(() => {
    error.value = null
  }, 5000)
}

// Optimized batch fetching with caching and performance monitoring
const fetchBatches = performanceMonitor.measure('fetchBatches', async (useCache = true) => {
  const cacheKey = 'fetchBatches'
  
  // Check cache first
  if (useCache && cache.has(cacheKey)) {
    batches.value = cache.get(cacheKey)
    return
  }
  
  try {
    batchLoading.value = true
    error.value = null
    
    const result = await ErrorHandler.retryWithBackoff(async () => {
      const { data, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError
      return data
    }, MAX_RETRIES)
    
    if (!result || result.length === 0) {
      console.warn('No QR code batches found in database')
      batches.value = []
      cache.set(cacheKey, [])
      return
    }

    // Use a Map for O(1) lookups instead of array operations
    const batchMap = new Map()
    
    for (const code of result) {
      if (ValidationUtils.isValidBatchId(code?.batch_id) && !batchMap.has(code.batch_id)) {
        batchMap.set(code.batch_id, {
          id: code.batch_id,
          created_at: code.created_at || new Date().toISOString(),
          productName: code.products?.name || 'Unknown Product',
          product_id: code.product_id,
          count: 1
        })
      }
    }
    
    const processedBatches = Array.from(batchMap.values())
    console.log('Processed batches:', processedBatches.length)
    
    batches.value = processedBatches
    cache.set(cacheKey, processedBatches)
    retryCount.value = 0 // Reset retry count on success
    
  } catch (error) {
    handleError(error, 'fetch batches')
    batches.value = []
  } finally {
    batchLoading.value = false
  }
})

// Optimized batch viewing with caching and performance monitoring
const viewBatch = performanceMonitor.measure('viewBatch', async (batchId) => {
  if (!ValidationUtils.isValidBatchId(batchId)) {
    console.warn('Invalid batch ID provided')
    return
  }
  
  const cacheKey = `viewBatch_${batchId}`
  
  // Check cache first
  if (cache.has(cacheKey)) {
    currentBatchQRCodes.value = cache.get(cacheKey)
    return
  }
  
  try {
    loading.value = true
    error.value = null
    console.log('Fetching QR codes for batch:', batchId)
    
    const result = await ErrorHandler.retryWithBackoff(async () => {
      const { data, error: fetchError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      return data
    })
    
    console.log('Fetched QR codes:', result?.length || 0)
    const codes = result || []
    
    if (!ValidationUtils.isValidQRCodeArray(codes) && codes.length > 0) {
      throw new Error('Invalid QR code data received')
    }
    
    currentBatchQRCodes.value = codes
    cache.set(cacheKey, codes)
    
    if (codes.length > 0) {
      console.log(`Loaded ${codes.length} QR codes for batch ${batchId}`)
    } else {
      console.warn('No QR codes found for batch:', batchId)
    }
  } catch (error) {
    handleError(error, 'fetch QR codes for this batch')
    currentBatchQRCodes.value = []
  } finally {
    loading.value = false
  }
})

// Handle new codes generated from QrCodeGenerator with optimistic updates
const handleCodesGenerated = async (newCodes) => {
  if (!ValidationUtils.isValidQRCodeArray(newCodes)) {
    console.warn('Invalid QR codes generated')
    return
  }
  
  currentBatchQRCodes.value = newCodes
  console.log('New QR codes generated:', newCodes.length)
  
  // Optimistic update: add new batch to the list immediately
  const newBatch = {
    id: newCodes[0].batch_id,
    created_at: new Date().toISOString(),
    productName: 'Loading...', // Will be updated when fetchBatches completes
    product_id: newCodes[0].product_id,
    count: newCodes.length
  }
  
  // Add to the beginning of the list
  batches.value = [newBatch, ...batches.value]
  
  // Invalidate cache and refresh in background
  cache.clear()
  await nextTick() // Wait for DOM update
  fetchBatches(false) // Force refresh without cache
}

// Optimized batch deletion with optimistic updates and error recovery
const deleteSelectedBatches = async (batchIds) => {
  if (!Array.isArray(batchIds) || batchIds.length === 0) {
    console.warn('No batches selected for deletion')
    return
  }

  // Optimistic update: remove batches from UI immediately
  const originalBatches = [...batches.value]
  batches.value = batches.value.filter(batch => !batchIds.includes(batch.id))
  
  // Clear current batch view if one of the deleted batches was being viewed
  if (currentBatchQRCodes.value.length > 0) {
    const currentBatchId = currentBatchQRCodes.value[0]?.batch_id
    if (currentBatchId && batchIds.includes(currentBatchId)) {
      currentBatchQRCodes.value = []
    }
  }

  try {
    loading.value = true
    error.value = null
    console.log('Deleting batches:', batchIds)

    // Use error handler with retry logic for critical operations
    await ErrorHandler.retryWithBackoff(async () => {
      // First, get all QR code IDs in the selected batches
      const { data: qrCodes, error: fetchError } = await supabase
        .from('qr_codes')
        .select('id')
        .in('batch_id', batchIds)
      
      if (fetchError) throw fetchError
      
      // If we have QR codes, delete their references in points_transactions first
      if (qrCodes && qrCodes.length > 0) {
        const qrCodeIds = qrCodes.map(code => code.id)
        console.log('Deleting transactions for QR codes:', qrCodeIds.length)
        
        // Use batch delete operations with parallel execution
        const deletePromises = [
          supabase
            .from('points_transactions')
            .delete()
            .in('qr_code_id', qrCodeIds),
          supabase
            .from('qr_codes')
            .delete()
            .in('batch_id', batchIds)
        ]
        
        const [{ error: txError }, { error: deleteError }] = await Promise.all(deletePromises)
        
        if (txError) throw txError
        if (deleteError) throw deleteError
      } else {
        // Only delete QR codes if no transactions exist
        const { error: deleteError } = await supabase
          .from('qr_codes')
          .delete()
          .in('batch_id', batchIds)
        
        if (deleteError) throw deleteError
      }
    })

    console.log('Successfully deleted batches')
    
    // Clear cache for affected items
    cache.clear()
    selectedBatches.value = []
    
    // Show success message
    const message = `Successfully deleted ${batchIds.length} batch${batchIds.length > 1 ? 'es' : ''}`
    console.log(message)
    
  } catch (error) {
    // Revert optimistic update on error
    batches.value = originalBatches
    handleError(error, 'delete batches')
  } finally {
    loading.value = false
  }
}

// Optimized PDF export with lazy loading, memory management, and progress tracking
const exportSelectedBatches = async (selectedBatchIds) => {
  if (!Array.isArray(selectedBatchIds) || selectedBatchIds.length === 0) {
    handleError(new Error('Please select at least one batch to export'), 'export')
    return
  }

  try {
    loading.value = true
    exportProgress.value.isExporting = true
    error.value = null
    console.log('Exporting batches:', selectedBatchIds)
    
    // Lazy load heavy dependencies
    const { jsPDF, QRCode } = await loadExportDependencies()
    
    const { data: qrCodes, error: fetchError } = await supabase
      .from('qr_codes')
      .select('*')
      .in('batch_id', selectedBatchIds)
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError
    
    if (!ValidationUtils.isValidQRCodeArray(qrCodes)) {
      throw new Error('No valid QR codes found in selected batches')
    }
    
    console.log('Fetched', qrCodes.length, 'QR codes for export')

    if (!ValidationUtils.isValidExportSettings(exportSettings.value)) {
      throw new Error('Invalid export settings')
    }

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    const layout = PDFExportUtils.calculateLayout(
      pageWidth, 
      pageHeight, 
      exportSettings.value.margin,
      exportSettings.value.size,
      exportSettings.value.perRow
    )
    
    let x = exportSettings.value.margin
    let y = exportSettings.value.margin
    let codeCount = 0

    // Process QR codes in chunks with progress tracking
    const chunkSize = 8 // Smaller chunks for better memory management and progress updates
    
    const processChunk = async (chunk, chunkIndex) => {
      const chunkResults = await Promise.all(
        chunk.map(async (code) => {
          try {
            const { canvas, ctx, canvasSize } = PDFExportUtils.createOptimizedCanvas(exportSettings.value.size)
            
            if (!ctx) {
              console.error('Could not get canvas context for QR code:', code.id)
              return null
            }

            // Generate QR code with optimized settings
            const qrData = JSON.stringify({ id: code.id })
            await QRCode.toCanvas(canvas, qrData, {
              width: canvasSize,
              margin: 1,
              color: {
                dark: '#000000',
                light: '#ffffff',
              },
              errorCorrectionLevel: 'M'
            })

            const imgData = canvas.toDataURL('image/png', 0.7)
            
            // Clean up canvas immediately
            PDFExportUtils.cleanupCanvas(canvas)
            
            return {
              imgData,
              manual_identifier: code.manual_identifier
            }
          } catch (codeError) {
            console.error('Error processing QR code:', code.id, codeError)
            return null
          }
        })
      )
      
      return chunkResults.filter(result => result !== null)
    }

    const onProgress = (progress) => {
      exportProgress.value = {
        isExporting: true,
        current: progress.completed,
        total: progress.total,
        percentage: progress.percentage
      }
    }

    const results = await BatchUtils.processInChunks(qrCodes, chunkSize, processChunk, onProgress)
    
    // Add processed QR codes to PDF
    for (const result of results) {
      pdf.addImage(result.imgData, 'PNG', x, y, exportSettings.value.size, exportSettings.value.size)
      
      // Add manual identifier below QR code
      if (result.manual_identifier) {
        pdf.setFontSize(8)
        const identifier = String(result.manual_identifier)
        const textWidth = pdf.getStringUnitWidth(identifier) * pdf.internal.getFontSize() / pdf.internal.scaleFactor
        pdf.text(identifier, x + (exportSettings.value.size - textWidth)/2, y + exportSettings.value.size + 5)
      }

      // Update position
      x += exportSettings.value.size + layout.spacing
      codeCount++
      
      // Check if we need to move to next row
      if (codeCount % exportSettings.value.perRow === 0) {
        x = exportSettings.value.margin
        y += layout.rowHeight
      }

      // Check if we need a new page
      if (y + exportSettings.value.size + 15 > pageHeight - exportSettings.value.margin) {
        pdf.addPage()
        x = exportSettings.value.margin
        y = exportSettings.value.margin
      }
    }

    // Save PDF with timestamp for uniqueness
    const filename = `qr_codes_${new Date().toISOString().slice(0,10)}_${Date.now()}.pdf`
    pdf.save(filename)
    console.log('PDF exported successfully:', filename)
    
  } catch (error) {
    handleError(error, 'export QR codes')
  } finally {
    loading.value = false
    exportProgress.value = {
      isExporting: false,
      current: 0,
      total: 0,
      percentage: 0
    }
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
  
  try {
    const authStore = useAuthStore()
    console.log('Authentication state:', authStore.isAuthenticated)
    console.log('User:', authStore.user)
    
    if (!authStore.isAuthenticated) {
      console.log('User not authenticated, redirecting to auth')
      return
    }
    
    console.log('User authenticated, fetching batches')
    
    // Initialize data arrays to prevent undefined errors
    batches.value = []
    currentBatchQRCodes.value = []
    selectedBatches.value = []
    
    // Fetch batches with error handling
    await fetchBatches()
  } catch (error) {
    console.error('Error during component initialization:', error)
    // Ensure we have valid arrays even if initialization fails
    batches.value = []
    currentBatchQRCodes.value = []
    selectedBatches.value = []
  }
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

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
  animation: slideIn 0.3s ease-out;
}

.error-banner svg {
  flex-shrink: 0;
}

.export-progress {
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  animation: slideIn 0.3s ease-out;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: var(--color-primary);
}

.progress-header svg.spinning {
  animation: spin 2s linear infinite;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
  animation: pulse 2s infinite;
}

.progress-details {
  font-size: 0.875rem;
  color: #64748b;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
