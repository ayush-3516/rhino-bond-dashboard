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
  background: white;
  border-radius: var(--border-radius);
}

.form-row {
  margin-bottom: var(--space-lg);
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

.form-group {
  margin-bottom: var(--space-sm);
}

label {
  display: block;
  margin-bottom: var(--space-xs);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
}

input,
textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background: white;
  color: var(--color-text);
  transition: all 0.2s ease;
}

input::placeholder,
textarea::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.7;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.1);
}

textarea {
  min-height: 120px;
  line-height: 1.5;
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
  padding: var(--space-sm) var(--space-md);
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-upload-label:hover {
  border-color: var(--color-primary);
  background: rgba(0, 220, 130, 0.02);
}

.file-upload-label span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--color-text-secondary);
}

.browse-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--border-radius);
  font-weight: 500;
  transition: all 0.2s ease;
}

.browse-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.image-preview {
  margin-top: var(--space-md);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  padding: var(--space-sm);
}

.image-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: var(--border-radius);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: var(--space-md) 0;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 68, 68, 0.1);
  border-left: 4px solid #ff4444;
  border-radius: var(--border-radius);
  color: #d32f2f;
}

.error-icon {
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  font-weight: bold;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-xl);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
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

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .event-form {
    background: var(--color-surface-dark, #1f2937);
  }

  label {
    color: var(--color-text-inverse);
  }

  input,
  textarea {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-inverse);
  }

  input:focus,
  textarea:focus {
    background: rgba(255, 255, 255, 0.08);
  }

  .file-upload-label {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .file-upload-label:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .image-preview {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .form-actions {
    border-color: rgba(255, 255, 255, 0.1);
  }
}

@media (max-width: 768px) {
  .two-columns {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .submit-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
