<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase, withServiceRole } from '../supabase'
import ConfirmModal from '../components/ConfirmModal.vue'

const users = ref([])
const loading = ref(true)
const processing = ref(false)
const showModal = ref(false)
const selectedUser = ref(null)
const searchTerm = ref('')

// Computed property for filtered users
const filteredUsers = computed(() => {
  if (!searchTerm.value.trim()) return users.value
  
  const term = searchTerm.value.toLowerCase()
  return users.value.filter(user => 
    user.name?.toLowerCase().includes(term) || 
    user.email?.toLowerCase().includes(term) || 
    user.phone?.toLowerCase().includes(term) || 
    user.pan_card?.toLowerCase().includes(term)
  )
})

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
    <div class="page-header">
      <h1 class="page-title">PAN Card Verification</h1>
      <p class="page-description">Verify and manage PAN card submissions from users</p>
    </div>
    
    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          v-model="searchTerm"
          placeholder="Search users by name, email, phone or PAN card"
          class="search-input"
        />
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>
    <div v-else-if="!filteredUsers.length && searchTerm" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <p>No results found for "{{ searchTerm }}"</p>
    </div>
    <div v-else-if="!users.length" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p>No users with PAN cards to verify</p>
    </div>
    <div v-else class="user-list">
      <div v-for="user in filteredUsers" :key="user.id" class="user-card card">
        <div class="card-header">
          <div class="user-avatar">{{ user.name ? user.name[0].toUpperCase() : '?' }}</div>
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p>{{ user.email }}</p>
            <p class="text-secondary">{{ user.phone }}</p>
          </div>
          <div class="status-badge" :class="{'status-approved': user.kyc_status, 'status-pending': !user.kyc_status}">
            {{ user.kyc_status ? 'Approved' : 'Pending' }}
          </div>
        </div>
        <div class="card-body">
          <div class="pan-card-info">
            <h4>PAN Card Details</h4>
            <p class="pan-number">{{ user.pan_card }}</p>
          </div>
          <div v-if="!user.kyc_status" class="card-actions">
            <button 
              @click="approveKyc(user)" 
              :disabled="processing"
              class="btn btn-primary"
            >
              <span v-if="processing">
                <div class="loading-spinner"></div>
              </span>
              <span v-else>Approve</span>
            </button>
            <button 
              @click="confirmReject(user)" 
              :disabled="processing"
              class="btn btn-secondary reject"
            >
              Reject
            </button>
          </div>
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
  padding: var(--space-lg);
  max-width: var(--container-xl);
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-xs);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  max-width: 600px;
}

.search-container {
  margin-bottom: var(--space-xl);
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--border-radius-lg);
  padding: var(--space-md) var(--space-lg);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.search-box:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-outline);
}

.search-input {
  border: none;
  background: none;
  width: 100%;
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.search-input:focus {
  outline: none;
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-secondary);
}

.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: var(--space-lg);
}

.user-card {
  border: 1px solid var(--color-border);
  overflow: visible;
}

.card-header {
  padding: var(--space-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(to bottom, var(--color-background), white);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.user-info {
  flex-grow: 1;
}

.user-info h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-xs);
  color: var(--color-text);
}

.user-info p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.status-badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-full);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-approved {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.status-pending {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.card-body {
  padding: var(--space-lg);
}

.pan-card-info h4 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.pan-number {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-background);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  display: inline-block;
}

.card-actions {
  margin-top: var(--space-lg);
  display: flex;
  gap: var(--space-sm);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(0, 220, 130, 0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  color: var(--color-text-secondary);
  opacity: 0.5;
  margin-bottom: var(--space-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .pan-verification {
    padding: var(--space-md);
  }

  .user-list {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .status-badge {
    align-self: flex-start;
  }

  .card-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
