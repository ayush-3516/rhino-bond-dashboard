<template>
  <div class="export-settings-dialog">
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>Export Settings</h3>
        <button class="close-dialog" @click="closeDialog" title="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="dialog-body">
        <div class="controls-section">
          <div class="form-group">
            <label for="size">QR Code Size (mm)</label>
            <div class="slider-container">
              <input
                type="range"
                id="size"
                v-model.number="size"
                min="25"
                max="60"
                step="5"
                class="slider"
              />
              <span class="slider-value">{{ size }}mm</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="perRow">QR Codes Per Row</label>
            <div class="number-input-wrapper">
              <button type="button" class="number-control" @click="decrementPerRow" :disabled="perRow <= 1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <input
                type="number"
                id="perRow"
                v-model.number="perRow"
                min="1"
                max="10"
                step="1"
                class="number-input"
              />
              <button type="button" class="number-control" @click="incrementPerRow" :disabled="perRow >= 10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="margin">Page Margin (mm)</label>
            <div class="slider-container">
              <input
                type="range"
                id="margin"
                v-model.number="margin"
                min="5"
                max="30"
                step="1"
                class="slider"
              />
              <span class="slider-value">{{ margin }}mm</span>
            </div>
          </div>

          <div class="dialog-buttons">
            <button class="btn-cancel" @click="closeDialog">Cancel</button>
            <button class="btn-confirm" @click="confirmSettings" :disabled="!!validationError">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export to PDF
            </button>
          </div>
        </div>

        <div class="preview-section">
          <div class="preview">
            <div class="preview-title">Preview (A4 Page Layout)</div>
            <div class="preview-page" :style="{ padding: margin + 'px' }">
              <div class="preview-grid" :style="previewGridStyle">
                <div v-for="i in previewItems" :key="i" class="preview-item" :style="{ aspectRatio: '1' }"></div>
              </div>
            </div>
            <div v-if="validationError" class="validation-error">
              {{ validationError }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['confirm', 'close'])

const size = ref(30)
const perRow = ref(4)
const margin = ref(10)

// A4 page dimensions in mm
const A4_WIDTH = 210
const A4_HEIGHT = 297

// Preview calculation and validation
const previewItems = computed(() => {
  return perRow.value * Math.ceil(20 / perRow.value) // Fill complete rows
})

const validationError = computed(() => {
  const totalWidth = (size.value * perRow.value) + (margin.value * 2)
  const spacing = (perRow.value - 1) * (size.value * 0.1) // Add 10% of QR size as spacing
  
  if (totalWidth + spacing > A4_WIDTH) {
    return `Total width (${Math.round(totalWidth + spacing)}mm) exceeds A4 page width (${A4_WIDTH}mm). Try reducing QR size or codes per row.`
  }

  const qrsPerPage = Math.floor((A4_HEIGHT - margin.value * 2) / (size.value + size.value * 0.1))
  if (qrsPerPage < perRow.value) {
    return `QR codes are too large to fit on the page vertically. Try reducing QR size.`
  }
  
  return null
})

const previewGridStyle = computed(() => {
  // Calculate sizes while maintaining proper A4 proportions
  const availableWidth = 100 - ((margin.value / A4_WIDTH) * 100 * 2) // Available width as percentage
  const qrSizePercent = (size.value / A4_WIDTH) * 100 // QR size as percentage of page width
  const gapPercent = qrSizePercent * 0.1 // Gap as 10% of QR size
  
  return {
    gridTemplateColumns: `repeat(${perRow.value}, ${qrSizePercent}%)`,
    gap: `${gapPercent}%`,
    alignContent: 'start'
  }
})

const incrementPerRow = () => {
  if (perRow.value < 10) {
    perRow.value++
  }
}

const decrementPerRow = () => {
  if (perRow.value > 1) {
    perRow.value--
  }
}

const confirmSettings = () => {
  emit('confirm', {
    size: size.value,
    perRow: perRow.value,
    margin: margin.value
  })
}

const closeDialog = () => {
  emit('close')
}
</script>

<style scoped>
.export-settings-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 5vh;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.dialog-content {
  background: white;
  width: min(1000px, 90vw);
  max-height: 90vh;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.dialog-body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 0;
  height: 600px;
  max-height: calc(90vh - 130px);
  overflow: hidden;
}

.controls-section {
  padding: 24px;
  border-right: 1px solid #e5e7eb;
  background: #f9fafb;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls-section::-webkit-scrollbar {
  width: 8px;
}

.controls-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.controls-section::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

.slider-value {
  min-width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #6b7280;
}

.number-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 160px;
}

.number-input {
  width: 60px;
  text-align: center;
  padding: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
}

.number-control {
  padding: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.number-control:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #374151;
}

.number-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-section {
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

.preview {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.preview-title {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-title::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'%3E%3C/path%3E%3Cpolyline points='14 2 14 8 20 8'%3E%3C/polyline%3E%3C/svg%3E");
  opacity: 0.5;
}

.preview-page {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  margin: 20px;
  border: 1px solid #e5e7eb;
}

.preview-grid {
  position: absolute;
  inset: v-bind('margin + "px"');
  display: grid;
  gap: v-bind('Math.max(4, margin/4) + "px"');
}

.preview-item {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  aspect-ratio: 1;
}

.validation-error {
  color: #dc2626;
  font-size: 0.875rem;
  padding: 12px 16px;
  background: #fef2f2;
  margin-top: 12px;
  border-radius: 8px;
  border: 1px solid #fee2e2;
}

.dialog-buttons {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.btn-cancel, .btn-confirm {
  height: 40px;
  padding: 0 20px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-cancel {
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
}

.btn-cancel:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-confirm {
  background: var(--color-primary);
  color: white;
  border: none;
  gap: 8px;
}

.btn-confirm:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-dialog {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;
  line-height: 0;
}

.close-dialog:hover {
  background: #f3f4f6;
  color: #374151;
}

@media (max-width: 768px) {
  .export-settings-dialog {
    padding-top: 0;
    align-items: stretch;
  }

  .dialog-content {
    width: 100%;
    height: 100%;
    max-height: none;
    border-radius: 0;
  }

  .dialog-body {
    grid-template-columns: 1fr;
    height: auto;
    max-height: none;
  }

  .controls-section {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .preview-section {
    flex: 1;
    min-height: 0;
  }

  .preview-page {
    margin: 12px;
  }
}
</style>
