<script setup>
import { ref } from 'vue'
import { useEventStore } from '../../stores/event'
import { supabase, withServiceRole } from '../../supabase'

const eventStore = useEventStore()
const emit = defineEmits(['event-created'])

const loading = ref(false)
const error = ref(null)
const imagePreview = ref(null)

const form = ref({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  image_file: null,
})

function handleFileUpload(event) {
  form.value.image_file = event.target.files[0]
  
  // Generate preview
  if (form.value.image_file) {
    const reader = new FileReader()
    reader.onload = e => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(form.value.image_file)
  } else {
    imagePreview.value = null
  }
}

async function onSubmit() {
  try {
    loading.value = true
    error.value = null

    console.log('Starting event creation process')

    // Basic validation
    if (!form.value.title || !form.value.start_date || !form.value.end_date) {
      throw new Error('Title and dates are required')
    }

    let imageUrl = ''
    if (form.value.image_file) {
      console.log('Processing image upload')
      const fileExt = form.value.image_file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      console.log('Uploading image with service role')
      const { error: uploadError } = await withServiceRole(async (client) => {
        const result = await client.storage
          .from('event-images')
          .upload(filePath, form.value.image_file)
        console.log('Image upload result:', result)
        return result
      })

      if (uploadError) throw uploadError

      console.log('Getting public URL for uploaded image')
      const { data: urlData } = await withServiceRole(async (client) => {
        const result = await client.storage.from('event-images').getPublicUrl(filePath)
        console.log('Public URL result:', result)
        return result
      })

      imageUrl = urlData.publicUrl
      console.log('Image URL:', imageUrl)
    }

    console.log('Creating event with data:', {
      title: form.value.title,
      description: form.value.description,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      image_url: imageUrl,
    })

    const event = await eventStore.createEvent({
      title: form.value.title,
      description: form.value.description,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      image_url: imageUrl,
    })

    console.log('Event created successfully:', event)

    // Reset form after successful submission
    form.value = {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      image_file: null,
    }
    imagePreview.value = null
    
    // Emit event created event
    emit('event-created')
  } catch (err) {
    error.value = err.message
    console.error('Error creating event:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="event-form">
    <div class="form-row">
      <div class="form-group">
        <label for="title">Event Title</label>
        <input v-model="form.title" type="text" id="title" placeholder="Enter event title" required />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          v-model="form.description"
          id="description"
          placeholder="Enter event description"
          rows="4"
        />
      </div>
    </div>

    <div class="form-row two-columns">
      <div class="form-group">
        <label for="start_date">Start Date</label>
        <input v-model="form.start_date" type="datetime-local" id="start_date" required />
      </div>

      <div class="form-group">
        <label for="end_date">End Date</label>
        <input v-model="form.end_date" type="datetime-local" id="end_date" required />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group file-upload-group">
        <label for="image_file">Event Image</label>
        <div class="file-upload-container">
          <input type="file" id="image_file" accept="image/*" @change="handleFileUpload" class="file-input" />
          <label for="image_file" class="file-upload-label">
            <span>{{ form.image_file ? form.image_file.name : 'Choose File' }}</span>
            <button type="button" class="browse-btn">Browse</button>
          </label>
        </div>
        <div v-if="imagePreview" class="image-preview">
          <img :src="imagePreview" alt="Event Image Preview" />
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <div class="error-icon">!</div>
      <span>{{ error }}</span>
    </div>

    <div class="form-actions">
      <button type="submit" :disabled="loading" class="submit-btn">
        <span v-if="loading" class="spinner"></span>
        <span>{{ loading ? 'Creating Event...' : 'Create Event' }}</span>
      </button>
    </div>
  </form>
</template>

<style scoped>
.event-form {
  width: 100%;
  background: transparent;
  border-radius: 0;
}

.form-row {
  margin-bottom: var(--space-xl);
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
}

.form-group {
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: var(--space-sm);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.4;
}

input,
textarea {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  border: 2px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  font-size: var(--font-size-base);
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-text);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  line-height: 1.5;
}

input::placeholder,
textarea::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 
    0 0 0 4px rgba(0, 220, 130, 0.1),
    0 4px 12px rgba(0, 220, 130, 0.1);
  transform: translateY(-1px);
}

input:hover,
textarea:hover {
  border-color: rgba(15, 23, 42, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

textarea {
  min-height: 120px;
  line-height: 1.6;
  resize: vertical;
}

.file-upload-container {
  position: relative;
}

.file-input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}

.file-upload-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: rgba(255, 255, 255, 0.8);
  border: 2px dashed rgba(15, 23, 42, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 60px;
}

.file-upload-label:hover {
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.95);
  border-style: solid;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.1);
}

.file-upload-label span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.browse-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  border: none;
  padding: var(--space-sm) var(--space-lg);
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 220, 130, 0.2);
}

.browse-btn:hover {
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.3);
}

.image-preview {
  margin-top: var(--space-lg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 
    0 4px 6px rgba(15, 23, 42, 0.1),
    0 2px 4px rgba(15, 23, 42, 0.06);
  border: 2px solid rgba(15, 23, 42, 0.08);
  background: white;
  padding: var(--space-md);
  transition: all 0.3s ease;
}

.image-preview:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 12px rgba(15, 23, 42, 0.15),
    0 4px 8px rgba(15, 23, 42, 0.1);
}

.image-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: var(--space-lg) 0;
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  border-left: 4px solid var(--color-error);
  border-radius: 12px;
  color: #dc2626;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
}

.error-icon {
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-error);
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: 2px solid rgba(15, 23, 42, 0.06);
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-2xl);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 6px rgba(0, 220, 130, 0.2),
    0 2px 4px rgba(0, 220, 130, 0.1);
  min-height: 52px;
  letter-spacing: 0.02em;
}

.submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 8px 15px rgba(0, 220, 130, 0.3),
    0 4px 8px rgba(0, 220, 130, 0.2);
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
}

.submit-btn:active {
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .two-columns {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }

  .form-row {
    margin-bottom: var(--space-lg);
  }

  .form-actions {
    flex-direction: column;
    gap: var(--space-md);
    margin-top: var(--space-xl);
  }

  .submit-btn {
    width: 100%;
    justify-content: center;
    padding: var(--space-lg) var(--space-xl);
  }

  input,
  textarea,
  .file-upload-label {
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .form-row {
    margin-bottom: var(--space-md);
  }

  .submit-btn {
    padding: var(--space-md) var(--space-lg);
    font-size: 0.875rem;
  }
}
</style>
