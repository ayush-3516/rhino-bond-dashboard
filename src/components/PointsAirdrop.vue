<template>
    <div class="airdrop-container">
      <div class="form-section">
        <div class="search-controls">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="search-input"
          />
          <div class="bulk-actions">
            <button @click="selectAll" class="select-btn">Select All</button>
            <button @click="clearSelection" class="select-btn">Clear</button>
          </div>
        </div>

        <div class="user-list">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="user-item"
            :class="{ selected: isSelected(user.id) }"
            @click="toggleUser(user.id)"
          >
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <span class="user-points">{{ user.points_balance }} pts</span>
          </div>
        </div>

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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePointsStore } from '@/stores/points'
import AppHeader from '@/components/layout/AppHeader.vue'
const users = ref([])
const selectedUsers = ref([])
const points = ref(0)
const isLoading = ref(false)
const searchQuery = ref('')

const pointsStore = usePointsStore()

onMounted(async () => {
  try {
    users.value = await pointsStore.fetchUsers()
  } catch (error) {
    console.error('Error fetching users:', error)
  }
})

const filteredUsers = computed(() => {
  return users.value.filter(user => 
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

function isSelected(userId) {
  return selectedUsers.value.includes(userId)
}

function toggleUser(userId) {
  const index = selectedUsers.value.indexOf(userId)
  if (index === -1) {
    selectedUsers.value.push(userId)
  } else {
    selectedUsers.value.splice(index, 1)
  }
}

function selectAll() {
  selectedUsers.value = filteredUsers.value.map(user => user.id)
}

function clearSelection() {
  selectedUsers.value = []
}

async function handleAirdrop() {
  if (!selectedUsers.value.length || !points.value) return
  
  isLoading.value = true
  try {
    await pointsStore.airdropPoints({
      userIds: selectedUsers.value,
      points: Number(points.value)
    })
    alert('Points airdropped successfully!')
    selectedUsers.value = []
    points.value = 0
  } catch (error) {
    console.error('Airdrop failed:', error)
    alert(`Airdrop failed: ${error.message}`)
  } finally {
    isLoading.value = false
  }
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

.search-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.bulk-actions {
  display: flex;
  gap: 8px;
}

.select-btn {
  padding: 8px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.user-list {
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f8f8f8;
}

.user-item.selected {
  background-color: #e6f4ff;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
}

.user-email {
  font-size: 0.9em;
  color: #666;
}

.user-points {
  font-weight: 500;
  color: #42b983;
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
