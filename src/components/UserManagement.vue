<script setup>
import { ref, onMounted } from 'vue'
import { supabase, withServiceRole, assignAgentCode } from '../supabase'
import ConfirmModal from './ConfirmModal.vue'

const users = ref([])
const loading = ref(false)
const showDeleteModal = ref(false)
const userToDelete = ref(null)
const copySuccess = ref(null)

// Function to copy text to clipboard
async function copyToClipboard(text, userId) {
  try {
    await navigator.clipboard.writeText(text);
    copySuccess.value = userId;
    setTimeout(() => {
      copySuccess.value = null;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

async function fetchUsers() {
  loading.value = true
  try {
    const { data, error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .select('*, points_balance')
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

async function demoteToUser(user) {
  try {
    const { error } = await withServiceRole(async (client) => {
      return client
        .from('users')
        .update({ role: 'user' })
        .eq('id', user.id)
    })

    if (error) throw error
    await fetchUsers()
    alert('User demoted to regular user successfully')
  } catch (error) {
    console.error('Error demoting user:', error)
    alert('Failed to demote user: ' + error.message)
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
          <th>User ID</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Role</th>
          <th>Points</th>
          <th>Agent Code</th>
          <th>Admin Confirmation</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td class="user-id-cell" @click="copyToClipboard(user.id, user.id)">
            <div class="copy-container">
              <span :class="{ copied: copySuccess === user.id }" class="truncated-id">{{ user.id.substring(0, 8) }}...</span>
              <span class="copy-icon">📋</span>
              <span v-if="copySuccess === user.id" class="copy-success">Copied!</span>
            </div>
          </td>
          <td>{{ user.name }}</td>
          <td>{{ user.phone }}</td>
          <td>{{ user.role }}</td>
          <td class="points-cell">
            <div class="points-value">{{ user.points_balance || 0 }}</div>
          </td>
          <td>{{ user.agent_code || 'None' }}</td>
          <td>{{ user.admin_confirmation ? 'Confirmed' : 'Pending' }}</td>
          <td>
            <div class="dropdown">
              <button class="dropdown-toggle">Actions</button>
              <div class="dropdown-content">
                <button
                  v-if="user.role === 'user'"
                  @click="promoteToAgent(user)"
                  class="dropdown-item"
                >
                  Promote to Agent
                </button>
                <button
                  v-if="user.role === 'agent'"
                  @click="demoteToUser(user)"
                  class="dropdown-item"
                >
                  Demote to User
                </button>
                <button
                  v-if="!user.admin_confirmation"
                  @click="toggleAdminConfirmation(user)"
                  class="dropdown-item confirm-item"
                >
                  Confirm User
                </button>
                <button
                  v-if="(user.role === 'agent' || user.role === 'admin') && !user.agent_code"
                  @click="handleAssignCode(user)"
                  class="dropdown-item"
                >
                  Generate Code
                </button>
                <button
                  @click="confirmDelete(user)"
                  class="dropdown-item delete-item"
                >
                  Delete
                </button>
                <button
                  @click="copyToClipboard(user.id, user.id)"
                  class="dropdown-item"
                >
                  Copy ID <span class="dropdown-id-badge">{{ user.id.substring(0, 5) }}...</span>
                  <span v-if="copySuccess === user.id" class="copy-success-dropdown">✓</span>
                </button>
              </div>
            </div>
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

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-toggle {
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
}

.dropdown-toggle:hover {
  background-color: #e9e9e9;
  border-color: #ccc;
}

.dropdown-toggle::after {
  content: "▼";
  font-size: 0.7em;
  margin-left: 4px;
}

.dropdown-content {
  display: none;
  position: absolute;
  background-color: white;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-radius: 6px;
  z-index: 10;
  right: 0;
  margin-top: 4px;
  overflow: hidden;
  border: 1px solid #eee;
}

.dropdown:hover .dropdown-content {
  display: block;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-item {
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
  color: #333;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #f8f8f8;
}

.dropdown-item i {
  width: 16px;
  text-align: center;
}

.delete-item {
  color: #f44336;
}

.delete-item:hover {
  background-color: #ffeeee;
}

.confirm-item {
  color: #4caf50;
}

.confirm-item:hover {
  background-color: #f0fff0;
}

/* User ID copy functionality styles */
.user-id-cell {
  cursor: pointer;
  position: relative;
  user-select: all;
  transition: all 0.2s ease;
}

.copy-container {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.truncated-id {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 4px 8px;
  border: 1px solid #eee;
  color: #555;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
}

.copy-icon {
  font-size: 0.9em;
  opacity: 0;
  margin-left: 0;
  transition: opacity 0.2s ease;
}

.user-id-cell:hover .truncated-id {
  background-color: #e9f5fe;
  border-color: #cce5ff;
  color: #0066cc;
}

.user-id-cell:hover .copy-icon {
  opacity: 0.8;
}

.copy-success {
  position: absolute;
  top: -24px;
  left: 0;
  background-color: #4caf50;
  color: white;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 500;
  animation: fadeOut 2s forwards;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.copied {
  background-color: #e8f5e9 !important;
  border-color: #a5d6a7 !important;
  color: #2e7d32 !important;
}

@keyframes fadeOut {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

/* Points cell styling */
.points-cell {
  position: relative;
}

.points-value {
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f8ff;
  color: #0066cc;
  border-radius: 16px;
  padding: 4px 12px;
  border: 1px solid #cce5ff;
  font-size: 14px;
  min-width: 60px;
  text-align: center;
}

.points-value::before {
  content: "★";
  margin-right: 5px;
  color: #ffc107;
  font-size: 12px;
}

.dropdown-id-badge {
  display: inline-block;
  background-color: #eee;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8em;
  color: #666;
  margin-left: 5px;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}

.copy-success-dropdown {
  color: #4caf50;
  font-weight: bold;
  margin-left: 5px;
  animation: fadeOut 2s forwards;
}
</style>
