<template>
  <div class="generation-section">
    <div class="section-header">
      <h2>Generate New QR Codes</h2>
      <div class="section-description">
        Generate QR codes for your products to track points and rewards
      </div>
    </div>
    
    <form @submit.prevent="generateQRCodes" class="qr-form">
      <div class="form-columns">
        <div class="form-column">
          <div class="form-group">
            <label for="product">Select Product</label>
            <div class="select-wrapper">
              <select v-model="productId" required id="product" class="form-control">
                <option value="" disabled selected>Choose a product</option>
                <option v-for="product in products" :key="product.id" :value="product.id">
                  {{ product.name }} ({{ product.points_value }} points)
                </option>
              </select>
              <div class="select-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            <div class="form-help">Select the product for which QR codes will be generated</div>
          </div>
        </div>
        
        <div class="form-column">
          <div class="form-group">
            <label for="quantity">Quantity</label>
            <div class="number-input-wrapper">
              <button type="button" class="number-control" @click="decrementQuantity" :disabled="quantity <= 1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <input type="number" v-model="quantity" min="1" required id="quantity" class="form-control number-input" />
              <button type="button" class="number-control" @click="incrementQuantity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
            <div class="form-help">Enter the number of QR codes to generate</div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button class="generate-btn" :disabled="loading || !productId" type="submit">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="7" y="7" width="3" height="3"></rect>
            <rect x="14" y="7" width="3" height="3"></rect>
            <rect x="7" y="14" width="3" height="3"></rect>
            <rect x="14" y="14" width="3" height="3"></rect>
          </svg>
          {{ loading ? 'Generating...' : 'Generate QR Codes' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase, withServiceRole } from '../../supabase'

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

const incrementQuantity = () => {
  quantity.value++
}

const decrementQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const generateQRCodes = async () => {
  if (!productId.value || quantity.value <= 0) {
    alert('Please select a valid product and quantity.')
    return
  }

  try {
    loading.value = true

    // Dynamic import of QRCode module
    const QRCodeModule = await import('qrcode')
    const QRCode = QRCodeModule.default

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
  margin-bottom: 1.5rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-secondary);
}

.section-description {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.95rem;
}

.qr-form {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.form-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-control {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  background: #f9f9f9;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.1);
  background: white;
}

.form-help {
  margin-top: 0.5rem;
  color: #888;
  font-size: 0.8rem;
}

/* Select styling */
.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  width: 100%;
  padding-right: 2.5rem;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

/* Number input styling */
.number-input-wrapper {
  display: flex;
  align-items: center;
}

.number-input {
  width: 100%;
  text-align: center;
  -moz-appearance: textfield; /* Firefox */
}

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #f2f2f2;
  border: 1px solid #e0e0e0;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.number-control:hover:not(:disabled) {
  background: #e9e9e9;
}

.number-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.number-control:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  border-right: none;
}

.number-control:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  border-left: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.generate-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 1rem;
}

.generate-btn:hover:not(:disabled) {
  background-color: #00b86b;
  transform: translateY(-1px);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .qr-form {
    padding: 1.5rem;
  }
  
  .form-columns {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
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
