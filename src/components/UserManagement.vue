<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const users = ref([])
const loading = ref(false)

async function fetchUsers() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
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
    const { error } = await supabase
      .from('users')
      .update({ admin_confirmation: !user.admin_confirmation })
      .eq('id', user.id)
    
    if (error) throw error
    await fetchUsers()
  } catch (error) {
    console.error('Error updating user:', error)
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
          <th>Email</th>
          <th>Role</th>
          <th>Admin Confirmation</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.admin_confirmation ? 'Confirmed' : 'Pending' }}</td>
          <td>
            <button 
              @click="toggleAdminConfirmation(user)"
              :class="{ 'confirmed': user.admin_confirmation }"
            >
              {{ user.admin_confirmation ? 'Revoke' : 'Confirm' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
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

button:hover {
  opacity: 0.8;
}
</style>
