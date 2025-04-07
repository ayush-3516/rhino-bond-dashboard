<script setup>
import { ref } from 'vue'
import { updateContactMessage } from '../supabase'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update-message', 'close'])

const isResolved = ref(props.message.is_resolved)
const saving = ref(false)
const error = ref(null)

const handleToggleResolved = async () => {
  try {
    saving.value = true
    error.value = null

    const updatedMessage = await updateContactMessage(props.message.id, {
      is_resolved: isResolved.value
    })
    emit('update-message', updatedMessage)
  } catch (err) {
    error.value = err.message
    console.error('Error updating message status:', err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="message-detail">
    <button class="close-btn" @click="$emit('close')">&times;</button>

    <div class="message-header">
      <h3>Message Details</h3>
      <div class="meta">
        <span class="date">
          {{ new Date(message.created_at).toLocaleString() }}
        </span>
        <span :class="['status', message.is_resolved ? 'resolved' : 'pending']">
          {{ message.is_resolved ? 'Resolved' : 'Pending' }}
        </span>
      </div>
    </div>

    <div class="message-content">
      <div class="field">
        <label>From:</label>
        <div>{{ message.name }} &lt;{{ message.email }}&gt;</div>
      </div>

      <div class="field">
        <label>Topic:</label>
        <div>{{ message.topic }}</div>
      </div>

      <div class="field">
        <label>Message:</label>
        <div class="message-text">{{ message.message }}</div>
      </div>

      <div v-if="message.admin_reply" class="field">
        <label>Admin Reply:</label>
        <div class="reply-text">{{ message.admin_reply }}</div>
        <div class="reply-date" v-if="message.replied_at">
          Replied: {{ new Date(message.replied_at).toLocaleString() }}
        </div>
      </div>

      <div v-if="message.users?.phone" class="field">
        <label>Phone:</label>
        <div>{{ message.users.phone }}</div>
      </div>
    </div>

    <div class="status-control">
      <label class="resolve-toggle">
        <input
          type="checkbox"
          v-model="isResolved"
          @change="handleToggleResolved"
        />
        Mark as resolved
      </label>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<style scoped>
.message-detail {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.message-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.message-header h3 {
  margin: 0 0 10px 0;
}

.meta {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9rem;
}

.status {
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.status.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status.resolved {
  background-color: #d4edda;
  color: #155724;
}

.message-content {
  margin-bottom: 30px;
}

.field {
  margin-bottom: 15px;
}

.field label {
  display: block;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.message-text, .reply-text {
  white-space: pre-wrap;
  line-height: 1.5;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.reply-date {
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
}

.status-control {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resolve-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.error {
  color: #dc3545;
}
</style>
