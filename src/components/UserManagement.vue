<script setup>
import { ref, onMounted } from 'vue'
import { supabase, withServiceRole, assignAgentCode } from '../supabase'
import ConfirmModal from './ConfirmModal.vue'

const users = ref([])
const loading = ref(false)
const showDeleteModal = ref(false)
const userToDelete = ref(null)

async function fetchUsers() {
  loading.value = true
  try {
    const { data, error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
    })

    if (error) throw error
    users.value = data
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

async function toggleAdminConfirmation(user) {
  try {
    const { error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .update({ admin_confirmation: !user.admin_confirmation })
        .eq('id', user.id)
    })

    if (error) throw error
    await fetchUsers()
  } catch (error) {
    console.error('Error updating user:', error)
  }
}

async function promoteToAgent(user) {
  try {
    const { error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .update({ role: 'agent' })
        .eq('id', user.id)
    })

    if (error) throw error
    await fetchUsers()
    alert('User promoted to agent successfully')
  } catch (error) {
    console.error('Error promoting user to agent:', error)
    alert('Failed to promote user: ' + error.message)
  }
}

async function handleAssignCode(user) {
  try {
    const code = await assignAgentCode(user.id)
    await fetchUsers()
    alert(`Agent code assigned: ${code}`)
  } catch (error) {
    console.error('Error assigning agent code:', error)
    alert('Failed to assign agent code: ' + error.message)
  }
}

function confirmDelete(user) {
  userToDelete.value = user
  showDeleteModal.value = true
}

async function deleteUser() {
  const user = userToDelete.value
  showDeleteModal.value = false
  try {
    // Delete related points transactions
    const { error: pointsError } = await withServiceRole(async (client) => {
      return client
        .from('points_transactions')
        .delete()
        .eq('user_id', user.id)
    })

    if (pointsError) throw pointsError

    // Delete user
    const { error: userError } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .delete()
        .eq('id', user.id)
    })

    if (userError) throw userError

    await fetchUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
    alert('Failed to delete user. Please try again.')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="user-management">
    <h1>User Management</h1>
    <div v-if="loading">Loading...</div>
    <table v-else>
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Role</th>
          <th>Agent Code</th>
          <th>Admin Confirmation</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.phone }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.agent_code || 'None' }}</td>
          <td>{{ user.admin_confirmation ? 'Confirmed' : 'Pending' }}</td>
          <td>
            <button
              v-if="user.role === 'user'"
              @click="promoteToAgent(user)"
              class="promote-btn"
            >
              Promote to Agent
            </button>
            <button
              v-if="(user.role === 'agent' || user.role === 'admin') && !user.agent_code"
              @click="handleAssignCode(user)"
            >
              Generate Code
            </button>
            <button
              class="delete-btn"
              @click="confirmDelete(user)"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <ConfirmModal
      :visible="showDeleteModal"
      title="Confirm Delete"
      message="Are you sure you want to delete this user?"
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="deleteUser"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<style scoped>
.user-management {
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #e0e0e0;
}

button.confirmed {
  background-color: #4caf50;
  color: white;
}

button.verified {
  background-color: #2196F3;
  color: white;
}

button.delete-btn {
  background-color: #f44336;
  color: white;
  margin-left: 8px;
}

button:hover {
  opacity: 0.8;
}
</style>
