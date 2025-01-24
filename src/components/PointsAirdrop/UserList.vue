<template>
  <div class="user-list">
    <div
      v-for="user in users"
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
</template>

<script setup>
const props = defineProps({
  users: {
    type: Array,
    required: true,
    default: () => []
  },
  selectedUsers: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['toggle-user'])

function isSelected(userId) {
  return props.selectedUsers.includes(userId)
}

function toggleUser(userId) {
  emit('toggle-user', userId)
}
</script>

<style scoped>
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
</style>
