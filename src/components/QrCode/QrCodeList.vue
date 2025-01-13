<template>
  <div v-if="codes.length > 0" class="qr-codes">
    <h2>QR Codes in Batch</h2>
    <div class="qr-code-list">
      <div v-for="(code, index) in codes" :key="index" class="qr-code-item">
        <canvas
          ref="qrCanvas"
          :data-value="JSON.stringify({ id: code.id })"
          width="150"
          height="150"
        ></canvas>
        <p>ID: {{ code.id }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  codes: {
    type: Array,
    required: true,
  },
})

const generateDisplayQRCodes = async () => {
  const canvases = document.querySelectorAll('canvas')
  if (!canvases) return

  for (const canvas of canvases) {
    try {
      const ctx = canvas.getContext('2d')
      const data = canvas.dataset.value

      await QRCode.toCanvas(canvas, data, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }
}

watch(
  () => props.codes,
  async () => {
    await generateDisplayQRCodes()
  },
)

onMounted(async () => {
  await generateDisplayQRCodes()
})
</script>

<style scoped>
.qr-codes {
  margin-top: 30px;
  padding: 20px;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.qr-code-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.qr-code-item {
  background-color: white;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 8px;
  text-align: center;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.qr-code-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.qr-code-item p {
  margin: 8px 0 0;
  font-size: 12px;
  color: #666;
  word-break: break-all;
}

.qr-code-item canvas {
  border: 1px solid #eee;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .qr-code-list {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
    padding: 15px;
  }
}

@media print {
  .qr-code-list {
    gap: 10px;
    padding: 10px;
  }

  .qr-code-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>
