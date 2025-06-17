<template>
  <div class="generation-section">
    <h2>Generate New QR Codes</h2>
    <form @submit.prevent="generateQRCodes">
      <div class="form-group">
        <label for="product">Select Product:</label>
        <select v-model="productId" required id="product">
          <option v-for="product in products" :key="product.id" :value="product.id">
            {{ product.name }} ({{ product.points_value }} points)
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="quantity">Quantity:</label>
        <input type="number" v-model="quantity" min="1" required id="quantity" />
      </div>

      <button :disabled="loading" type="submit">
        {{ loading ? 'Generating...' : 'Generate QR Codes' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase, withServiceRole } from '../../supabase'
import QRCode from 'qrcode'

// UUID generation fallback
const generateUUID = () => {
  try {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID()
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  } catch (e) {
    console.warn('UUID generation error:', e)
    // Simple fallback
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }
}

const emit = defineEmits(['codes-generated'])

const productId = ref('')
const quantity = ref(1)
const products = ref([])
const loading = ref(false)

const fetchProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    products.value = data || []
  } catch (error) {
    console.error('Error fetching products:', error)
    alert('Failed to fetch products. Please try again.')
  }
}

const generateManualIdentifier = () => {
  const randomHash = generateUUID().replace(/-/g, '').slice(0, 8)
  return `QR-${randomHash}`
}

const generateQRCodes = async () => {
  if (!productId.value || quantity.value <= 0) {
    alert('Please select a valid product and quantity.')
    return
  }

  try {
    loading.value = true

    const {
      data: { user },
      error: authError,
    } = await withServiceRole((client) => client.auth.getUser())
    if (authError || !user) throw new Error('Authentication required')

    const product = products.value.find((p) => p.id === productId.value)

    if (!product) {
      throw new Error('Invalid product selected')
    }

    const batchId = generateUUID()
    const qrCodes = []

    // Generate QR codes and store in database
    for (let i = 0; i < quantity.value; i++) {
      const codeId = generateUUID()
      const codeData = JSON.stringify({
        productId: product.id,
        pointsValue: product.points_value,
        codeId: codeId,
        batchId: batchId,
      })

      const qrCodeUrl = await QRCode.toDataURL(codeData)

      const { data: newCode, error: insertError } = await supabase
        .from('qr_codes')
        .insert([
          {
            id: codeId,
            batch_id: batchId,
            product_id: product.id,
            points_value: product.points_value,
            created_at: new Date().toISOString(),
            manual_identifier: generateManualIdentifier(),
          },
        ])
        .select()
        .single()

      if (insertError) {
        throw new Error('Failed to insert QR code: ' + insertError.message)
      }

      qrCodes.push(newCode)
    }

    emit('codes-generated', qrCodes)
    alert(`${quantity.value} QR codes generated successfully in batch ${batchId}!`)
  } catch (error) {
    console.error('Error generating QR codes:', error)
    alert(error.message || 'Failed to generate QR codes. Please try again.')
  } finally {
    loading.value = false
  }
}

fetchProducts()
</script>

<style scoped>
.generation-section {
  margin-top: 30px;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-group select,
.form-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group input[type='number'] {
  width: 100px;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .form-group input[type='number'] {
    width: 100%;
  }
}
</style>
