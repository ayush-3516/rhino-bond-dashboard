<script setup>
import { ref } from 'vue'
import { useEventStore } from '../../stores/event'
import { supabase, withServiceRole } from '../../supabase'

const eventStore = useEventStore()

const loading = ref(false)
const error = ref(null)

const form = ref({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  image_file: null,
})

function handleFileUpload(event) {
  form.value.image_file = event.target.files[0]
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
      image_url: '',
    }
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
    <div class="form-group">
      <label for="title">Event Title</label>
      <input v-model="form.title" type="text" id="title" placeholder="Enter event title" required />
    </div>

    <div class="form-group">
      <label for="description">Description</label>
      <textarea
        v-model="form.description"
        id="description"
        placeholder="Enter event description"
        rows="4"
      />
    </div>

    <div class="form-group">
      <label for="start_date">Start Date</label>
      <input v-model="form.start_date" type="datetime-local" id="start_date" required />
    </div>

    <div class="form-group">
      <label for="end_date">End Date</label>
      <input v-model="form.end_date" type="datetime-local" id="end_date" required />
    </div>

    <div class="form-group">
      <label for="image_file">Event Image</label>
      <input type="file" id="image_file" accept="image/*" @change="handleFileUpload" />
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Creating Event...' : 'Create Event' }}
    </button>
  </form>
</template>

<style scoped>
.event-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input,
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  background-color: #42b983;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  color: #ff4444;
  margin-bottom: 1rem;
}
</style>
