<script setup>
import { ref, onMounted } from 'vue'
import { fetchContactMessages, deleteContactMessage } from '../supabase'
import ConfirmModal from './ConfirmModal.vue'

const messages = ref([])
const loading = ref(false)
const error = ref(null)

// Filter states
const filters = ref({
  topic: '',
  is_resolved: undefined,
  start_date: '',
  end_date: '',
  search: ''
})

const topics = [
  'General Inquiry',
  'Technical Support',
  'Account Issues',
  'Rewards Program',
  'Other Topic'
]

const loadMessages = async () => {
  try {
    loading.value = true
    messages.value = await fetchContactMessages(filters.value)
  } catch (err) {
    error.value = err.message
    console.error('Error loading messages:', err)
  } finally {
    loading.value = false
  }
}

const showConfirmModal = ref(false)
const messageToDelete = ref(null)

const handleDeleteClick = (id, event) => {
  event.stopPropagation()
  messageToDelete.value = id
  showConfirmModal.value = true
}

const handleDeleteConfirm = async () => {
  try {
    await deleteContactMessage(messageToDelete.value)
    messages.value = messages.value.filter(msg => msg.id !== messageToDelete.value)
    showConfirmModal.value = false
  } catch (err) {
    error.value = err.message
    console.error('Error deleting message:', err)
  }
}

onMounted(loadMessages)
</script>

<template>
  <div class="contact-messages">
    <div class="filters">
      <div class="filter-row">
        <select v-model="filters.topic" @change="loadMessages">
          <option value="">All Topics</option>
          <option v-for="topic in topics" :key="topic" :value="topic">
            {{ topic }}
          </option>
        </select>

        <select v-model="filters.is_resolved" @change="loadMessages">
          <option :value="undefined">All Statuses</option>
          <option :value="false">Pending</option>
          <option :value="true">Resolved</option>
        </select>
      </div>

      <div class="filter-row">
        <input
          type="date"
          v-model="filters.start_date"
          @change="loadMessages"
          placeholder="From date"
        >
        <input
          type="date"
          v-model="filters.end_date"
          @change="loadMessages"
          placeholder="To date"
        >
      </div>

      <div class="search-row">
        <input
          type="text"
          v-model="filters.search"
          @input="loadMessages"
          placeholder="Search name, email or message"
        >
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="messages.length === 0" class="empty">No messages found</div>
    <table v-else class="messages-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Topic</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="message in messages"
          :key="message.id"
          @click="$emit('select-message', message)"
          class="message-row"
        >
          <td>{{ message.name }}</td>
          <td>{{ message.email }}</td>
          <td>{{ message.topic }}</td>
          <td>{{ new Date(message.created_at).toLocaleString() }}</td>
          <td>
            <span :class="['status', message.is_resolved ? 'resolved' : 'pending']">
              {{ message.is_resolved ? 'Resolved' : 'Pending' }}
            </span>
          </td>
          <td>
            <button
              @click.stop="handleDeleteClick(message.id, $event)"
              class="delete-btn"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <ConfirmModal
      :visible="showConfirmModal"
      title="Confirm Delete"
      message="Are you sure you want to delete this message?"
      @confirm="handleDeleteConfirm"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<style scoped>
.contact-messages {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.filters {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.filter-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.search-row {
  margin-top: 10px;
}

select, input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.messages-table {
  width: 100%;
  border-collapse: collapse;
}

.messages-table th,
.messages-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.messages-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.message-row {
  cursor: pointer;
}

.message-row:hover {
  background-color: #f9f9f9;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
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

.loading, .error, .empty {
  padding: 20px;
  text-align: center;
  color: #666;
}

.error {
  color: #dc3545;
}

.delete-btn {
  padding: 6px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background-color: #c82333;
}
</style>
