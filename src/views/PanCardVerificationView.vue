<script setup>
import { ref, onMounted } from 'vue'
import { supabase, withServiceRole } from '../supabase'
import ConfirmModal from '../components/ConfirmModal.vue'

const users = ref([])
const loading = ref(true)
const processing = ref(false)
const showModal = ref(false)
const selectedUser = ref(null)

onMounted(() => fetchUsersWithPanCards())

async function fetchUsersWithPanCards() {
  loading.value = true
  try {
    const { data } = await withServiceRole(client =>
      client.from('users')
        .select('*')
        .not('pan_card', 'is', null)
    )
    users.value = data
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

async function approveKyc(user) {
  processing.value = true
  try {
    const { error } = await withServiceRole(client =>
      client.from('users')
        .update({ kyc_status: true })
        .eq('id', user.id)
    )
    if (error) throw error
    user.kyc_status = true // Optimistic update
  } catch (error) {
    console.error('Error approving KYC:', error)
    alert(`Failed to approve: ${error.message}`)
  } finally {
    processing.value = false
  }
}

function confirmReject(user) {
  selectedUser.value = user
  showModal.value = true
}

async function rejectKyc() {
  processing.value = true
  try {
    const { error } = await withServiceRole(client =>
      client.from('users')
        .update({ pan_card: null, kyc_status: false })
        .eq('id', selectedUser.value.id)
    )
    if (error) throw error
    users.value = users.value.filter(u => u.id !== selectedUser.value.id)
  } catch (error) {
    console.error('Error rejecting KYC:', error)
    alert(`Failed to reject: ${error.message}`)
  } finally {
    processing.value = false
    showModal.value = false
  }
}
</script>

<template>
  <div class="pan-verification">
    <h1>PAN Card Verification</h1>
    <div v-if="loading">Loading users...</div>
    <div v-else-if="!users.length">No users with PAN cards to verify</div>
    <div v-else class="user-list">
      <div v-for="user in users" :key="user.id" class="user-card">
        <div class="user-info">
          <h3>{{ user.name }}</h3>
          <p>Email: {{ user.email }}</p>
          <p>Phone: {{ user.phone }}</p>
        </div>
        <div class="pan-card">
          <h4>PAN Card:</h4>
          <p>{{ user.pan_card }}</p>
        </div>
        <div class="status" :class="{approved: user.kyc_status}">
          {{ user.kyc_status ? 'Approved' : 'Pending' }}
        </div>
        <div class="actions" v-if="!user.kyc_status">
          <button @click="approveKyc(user)" :disabled="processing">
            {{ processing ? 'Approving...' : 'Approve' }}
          </button>
          <button @click="confirmReject(user)" :disabled="processing" class="reject">
            Reject
          </button>
        </div>
      </div>
    </div>

    <ConfirmModal
      :visible="showModal"
      title="Reject PAN Card"
      message="Are you sure you want to reject this PAN card?"
      confirm-text="Reject"
      cancel-text="Cancel"
      @confirm="rejectKyc"
      @cancel="showModal = false"
    />
  </div>
</template>

<style scoped>
.pan-verification {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.user-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status {
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  text-align: center;
  background: #ff9800;
  color: white;
}

.status.approved {
  background: #4caf50;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  flex: 1;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.reject {
  background: #f44336;
  color: white;
}
</style>
