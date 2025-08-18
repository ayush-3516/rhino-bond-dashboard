<template>
  <div v-if="codes.length > 0" class="qr-codes">
    <div class="section-header">
      <div class="header-main">
        <h2>QR Codes in Batch</h2>
        <span class="code-count">{{ codes.length }} QR codes</span>
      </div>
      <div class="header-actions">
        <button class="action-button" @click="copyAllIds" title="Copy all IDs">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy All IDs</span>
        </button>
        <button class="action-button download-btn" @click="downloadAllQrCodes" title="Download All QR Codes">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Download All</span>
        </button>
      </div>
    </div>
    
    <div class="qr-code-list" ref="qrCodeListContainer">
      <div v-for="(code, index) in codes" :key="`${code.id}-${index}`" class="qr-code-item">
        <div class="qr-code-image">
          <canvas
            :ref="el => setCanvasRef(el, index)"
            :data-value="JSON.stringify({ id: code.id })"
            :data-index="index"
            width="150"
            height="150"
          ></canvas>
        </div>
        <div class="qr-code-details">
          <div class="qr-id">
            <span class="id-label">ID:</span>
            <span class="id-value">{{ shortenId(code.id) }}</span>
            <button class="copy-btn" @click="copyToClipboard(code.id)" title="Copy ID">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          <div class="qr-manual-id">{{ code.manual_identifier || 'No manual ID' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  codes: {
    type: Array,
    required: true,
  },
})

// Canvas management
const qrCodeListContainer = ref(null)
const canvasRefs = ref(new Map())

const setCanvasRef = (el, index) => {
  if (el) {
    canvasRefs.value.set(index, el)
  } else {
    canvasRefs.value.delete(index)
  }
}

// Helper functions for new features
const shortenId = (id) => {
  if (!id) return 'N/A'
  return id.length > 10 ? `${id.substring(0, 10)}...` : id
}

const copyToClipboard = async (text) => {
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      showToast('ID copied to clipboard', 'success')
    } else {
      // Fallback method for older browsers or non-HTTPS
      fallbackCopyToClipboard(text, 'ID')
    }
  } catch (err) {
    console.error('Failed to copy with clipboard API: ', err)
    // Fallback method
    fallbackCopyToClipboard(text, 'ID')
  }
}

// Fallback copy method using document.execCommand
const fallbackCopyToClipboard = (text, type = 'Text') => {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // Make it invisible
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    textArea.style.zIndex = '-1'
    
    document.body.appendChild(textArea)
    
    // Select and copy the text
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    
    // Clean up
    document.body.removeChild(textArea)
    
    if (successful) {
      showToast(`${type} copied to clipboard`, 'success')
    } else {
      showToast('Copy failed. Please select and copy manually.', 'error')
    }
  } catch (err) {
    console.error('Fallback copy failed: ', err)
    showToast('Copy failed. Please select and copy manually.', 'error')
  }
}

const copyAllIds = async () => {
  try {
    const allIds = props.codes.map(code => code.id).join('\n')
    
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(allIds)
      showToast('All IDs copied to clipboard', 'success')
    } else {
      // Fallback method for older browsers or non-HTTPS
      fallbackCopyToClipboard(allIds, 'All IDs')
    }
  } catch (err) {
    console.error('Failed to copy all IDs with clipboard API: ', err)
    // Fallback method
    const allIds = props.codes.map(code => code.id).join('\n')
    fallbackCopyToClipboard(allIds, 'All IDs')
  }
}

// Simple toast notification function
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div')
  toast.className = `toast-message ${type}`
  toast.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${type === 'success' ? '<polyline points="20 6 9 17 4 12"></polyline>' : 
        type === 'error' ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' :
        '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12.01" y2="16"></line><line x1="12" y1="8" x2="12" y2="12"></line>'}
    </svg>
    <span>${message}</span>
  `
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.classList.add('show')
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 300)
    }, 2000)
  }, 100)
}

const downloadAllQrCodes = async () => {
  try {
    // Create a zip file with all QR codes
    alert('Download feature will be implemented soon')
    // TODO: Implement download functionality using JSZip or similar library
  } catch (err) {
    console.error('Failed to download QR codes: ', err)
  }
}

const generateDisplayQRCodes = async () => {
  try {
    if (!props.codes || props.codes.length === 0) {
      return
    }

    await nextTick() // Wait for DOM updates

    // Process canvases in chunks to prevent memory issues
    const chunkSize = 10 // Reduced chunk size
    const canvasArray = Array.from(canvasRefs.value.values())
    
    for (let i = 0; i < canvasArray.length; i += chunkSize) {
      const chunk = canvasArray.slice(i, i + chunkSize)
      
      // Generate QR codes for this chunk
      await Promise.all(chunk.map(async (canvas, chunkIndex) => {
        try {
          if (!canvas) return
          
          const actualIndex = i + chunkIndex
          const code = props.codes[actualIndex]
          if (!code) return

          const ctx = canvas.getContext('2d')
          if (!ctx) return

          // Clear previous content
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          const qrData = JSON.stringify({ id: code.id })
          await QRCode.toCanvas(canvas, qrData, {
            width: 150,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          })
        } catch (error) {
          console.error('Error generating QR code for index', i + chunkIndex, ':', error)
        }
      }))

      // Small delay between chunks to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 5))
    }
  } catch (error) {
    console.error('Error generating QR codes:', error)
  }
}

// Cleanup function
const cleanup = () => {
  try {
    canvasRefs.value.forEach((canvas) => {
      if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    })
    canvasRefs.value.clear()
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
}

watch(
  () => props.codes,
  async (newCodes, oldCodes) => {
    // Cleanup previous canvases
    cleanup()
    
    if (newCodes && newCodes.length > 0) {
      await generateDisplayQRCodes()
    }
  },
  { deep: true }
)

onMounted(async () => {
  if (props.codes && props.codes.length > 0) {
    await generateDisplayQRCodes()
  }
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style scoped>
.qr-codes {
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

.header-main {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-secondary);
}

.code-count {
  color: #666;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  background-color: white;
  border: 1px solid #e0e0e0;
  color: #555;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  border-color: #ccc;
  background-color: #f9f9f9;
}

.download-btn {
  background-color: rgba(0, 220, 130, 0.1);
  border-color: rgba(0, 220, 130, 0.3);
  color: var(--color-primary);
}

.download-btn:hover {
  background-color: rgba(0, 220, 130, 0.15);
  border-color: var(--color-primary);
}

.qr-code-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.25rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 12px;
}

.qr-code-item {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.2s;
}

.qr-code-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.08);
}

.qr-code-image {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
}

.qr-code-image canvas {
  border-radius: 6px;
}

.qr-code-details {
  padding: 0.75rem;
  background-color: #fafafa;
}

.qr-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.id-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
}

.id-value {
  font-size: 0.8rem;
  font-family: monospace;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  margin-left: auto;
}

.copy-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #555;
}

.qr-manual-id {
  font-size: 0.85rem;
  color: #777;
  background-color: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.25rem;
  text-align: center;
  font-family: monospace;
  word-break: break-all;
}

/* Toast Message Styles */
.toast-message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  min-width: 300px;
  max-width: 400px;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.toast-message.show {
  transform: translateX(0);
  opacity: 1;
}

.toast-message.success {
  background: linear-gradient(135deg, #10b981, #059669);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.toast-message.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.toast-message.info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.toast-message svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.toast-message span {
  flex: 1;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .qr-code-list {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }
}

@media print {
  .header-actions, .copy-btn {
    display: none;
  }
  
  .qr-code-list {
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .qr-code-item {
    break-inside: avoid;
    page-break-inside: avoid;
    box-shadow: none;
  }
}
</style>