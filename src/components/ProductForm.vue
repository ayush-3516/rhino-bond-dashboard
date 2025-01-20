<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="name">Product Name</label>
      <input
        type="text"
        id="name"
        v-model="form.name"
        required
      />
    </div>

    <div class="form-group">
      <label for="description">Description</label>
      <textarea
        id="description"
        v-model="form.description"
      ></textarea>
    </div>

    <div class="form-group">
      <label for="points_value">Points Value</label>
      <input
        type="number"
        id="points_value"
        v-model.number="form.points_value"
        required
        min="0"
      />
    </div>

    <div class="form-group">
      <label for="is_active">Active Status</label>
      <input
        type="checkbox"
        id="is_active"
        v-model="form.is_active"
      />
    </div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Saving...' : 'Save Product' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  product: {
    type: Object,
    default: () => ({
      name: '',
      description: '',
      points_value: 0,
      is_active: true
    })
  }
})

const emit = defineEmits(['submit'])

const form = ref({ ...props.product })
const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  try {
    await emit('submit', form.value)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
}

input[type="text"],
input[type="number"],
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
