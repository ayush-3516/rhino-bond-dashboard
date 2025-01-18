<template>
  <div class="export-settings-dialog">
    <div class="dialog-content">
      <h3>Export Settings</h3>
      
      <div class="form-group">
        <label>QR Code Size (mm):</label>
        <input
          type="number"
          v-model.number="size"
          min="10"
          max="100"
          step="1"
        />
      </div>
      
      <div class="form-group">
        <label>QR Codes Per Row:</label>
        <input
          type="number"
          v-model.number="perRow"
          min="1"
          max="10"
          step="1"
        />
      </div>
      
      <div class="form-group">
        <label>Page Margin (mm):</label>
        <input
          type="number"
          v-model.number="margin"
          min="5"
          max="30"
          step="1"
        />
      </div>

      <div class="dialog-actions">
        <button class="btn-cancel" @click="closeDialog">Cancel</button>
        <button class="btn-confirm" @click="confirmSettings">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['confirm', 'close'])

const size = ref(30)
const perRow = ref(4)
const margin = ref(10)

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
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel, .btn-confirm {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.btn-cancel {
  background: #eee;
}

.btn-confirm {
  background: #007bff;
  color: white;
}
</style>
