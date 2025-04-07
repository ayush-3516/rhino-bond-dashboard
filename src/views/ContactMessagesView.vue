<script setup>
import { ref } from 'vue'
import ContactMessagesTable from '../components/ContactMessagesTable.vue'
import ContactMessageDetail from '../components/ContactMessageDetail.vue'

const selectedMessage = ref(null)
const showDetail = ref(false)

const handleSelectMessage = (message) => {
  selectedMessage.value = message
  showDetail.value = true
}

const handleUpdateMessage = (updatedMessage) => {
  selectedMessage.value = updatedMessage
}
</script>

<template>
  <div class="contact-messages-view">
    <h2>Contact Messages</h2>

    <ContactMessagesTable
      v-if="!showDetail"
      @select-message="handleSelectMessage"
    />

    <ContactMessageDetail
      v-else
      :message="selectedMessage"
      @update-message="handleUpdateMessage"
      @close="showDetail = false"
    />
  </div>
</template>

<style scoped>
.contact-messages-view {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}
</style>
