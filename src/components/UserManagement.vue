<script setup>
import { ref, onMounted } from 'vue'
import { supabase, withServiceRole } from '../supabase'
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

async function toggleKycStatus(user) {
  try {
    const { error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .update({ kyc_status: !user.kyc_status })
        .eq('id', user.id)
    })

    if (error) throw error
    await fetchUsers()
  } catch (error) {
    console.error('Error updating KYC status:', error)
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
          <th>Admin Confirmation</th>
          <th>KYC Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.phone }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.admin_confirmation ? 'Confirmed' : 'Pending' }}</td>
          <td>{{ user.kyc_status ? 'Verified' : 'Pending' }}</td>
          <td>
            <button
              @click="toggleAdminConfirmation(user)"
              :class="{ 'confirmed': user.admin_confirmation }"
            >
              {{ user.admin_confirmation ? 'Revoke' : 'Confirm' }}
            </button>
            <button
              @click="toggleKycStatus(user)"
              :class="{ 'verified': user.kyc_status }"
              style="margin-left: 8px;"
            >
              {{ user.kyc_status ? 'Reject KYC' : 'Approve KYC' }}
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
