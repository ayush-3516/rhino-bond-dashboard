<template>
    <div class="airdrop-container">
      <div class="form-section">
        <SearchControls
          @select-all="selectAll"
          @clear-selection="clearSelection"
        />

        <UserList
          :users="users"
          :selected-users="selectedUsers"
          @toggle-user="toggleUser"
        />

        <div class="points-control">
          <label for="points">Points to Airdrop:</label>
          <input
            id="points"
            v-model.number="points"
            type="number"
            min="1"
            required
            class="points-input"
          />
        </div>

        <button
          @click="handleAirdrop"
          :disabled="isLoading || !selectedUsers.length || !points"
          class="airdrop-btn"
        >
          {{ isLoading ? 'Processing...' : `Airdrop to ${selectedUsers.length} users` }}
        </button>
      </div>
    </div>
    <ConfirmModal
      :visible="showModal"
      :title="modalTitle"
      :message="modalMessage"
      :type="modalType"
      @close="handleModalClose"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePointsStore } from '@/stores/points'
import ConfirmModal from '@/components/ConfirmModal.vue'
import UserList from './PointsAirdrop/UserList.vue'
import SearchControls from './PointsAirdrop/SearchControls.vue'

const showModal = ref(false)
const isConfirmationModal = ref(false)
const modalTitle = ref('')
const modalMessage = ref('')
const modalType = ref('success')
const users = ref([])
const selectedUsers = ref([])
const points = ref(0)
const isLoading = ref(false)

const pointsStore = usePointsStore()

onMounted(async () => {
  try {
    users.value = await pointsStore.fetchUsers()
  } catch (error) {
    console.error('Error fetching users:', error)
  }
})

// User selection management
function toggleUser(userId) {
  const index = selectedUsers.value.indexOf(userId)
  if (index === -1) {
    selectedUsers.value.push(userId)
  } else {
    selectedUsers.value.splice(index, 1)
  }
}

function selectAll() {
  selectedUsers.value = users.value.map(user => user.id)
}

function clearSelection() {
  selectedUsers.value = []
}

// Modal handlers
function handleModalClose() {
  showModal.value = false
  selectedUsers.value = []
  points.value = 0
}

function handleModalCancel() {
  showModal.value = false
}

// Airdrop initiation
function handleAirdrop() {
  if (!selectedUsers.value.length || !points.value || isLoading.value) return
  
  modalTitle.value = 'Confirm Airdrop'
  modalMessage.value = `Are you sure you want to airdrop ${points.value} points to ${selectedUsers.value.length} users?`
  modalType.value = 'confirm'
  isConfirmationModal.value = true
  showModal.value = true
}

async function executeAirdrop() {
  if (isLoading.value) return
  
  isLoading.value = true
  try {
    await pointsStore.airdropPoints({
      userIds: selectedUsers.value,
      points: Number(points.value)
    })
    
    // Close modal after successful airdrop
    showModal.value = false
    
    // Only show success modal if not coming from confirmation
    if (!isConfirmationModal.value) {
      modalTitle.value = 'Success'
      modalMessage.value = 'Points airdropped successfully!'
      modalType.value = 'success'
      showModal.value = true
    }
    
    // Clear selections after successful airdrop
    selectedUsers.value = []
    points.value = 0
  } catch (error) {
    console.error('Airdrop failed:', error)
    modalTitle.value = 'Error'
    modalMessage.value = `Airdrop failed: ${error.message}`
    modalType.value = 'error'
    showModal.value = true
  } finally {
    isLoading.value = false
    isConfirmationModal.value = false
  }
}

function handleModalConfirm() {
  executeAirdrop()
}
</script>

<style scoped>
.airdrop-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.points-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.points-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
}

.airdrop-btn {
  padding: 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.airdrop-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.airdrop-btn:not(:disabled):hover {
  background-color: #3aa876;
}
</style>
