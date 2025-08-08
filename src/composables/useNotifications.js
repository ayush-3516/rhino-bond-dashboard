import { ref, reactive } from 'vue'

const notifications = ref([])
let notificationId = 0

export function useNotifications() {
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = ++notificationId
    const notification = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now()
    }
    
    notifications.value.push(notification)
    
    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id)
    }, duration)
    
    return id
  }
  
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  const clearAll = () => {
    notifications.value.splice(0)
  }
  
  return {
    notifications,
    showToast,
    removeNotification,
    clearAll
  }
}
