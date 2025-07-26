<template>
  <Transition name="modal">
    <div v-if="visible" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            <slot name="header">
              <h3>Confirm Action</h3>
            </slot>
            <button class="close-button" @click="cancel">&times;</button>
          </div>

          <div class="modal-body">
            <slot name="body">
              Are you sure you want to perform this action?
            </slot>
          </div>

          <div class="modal-footer">
            <button class="cancel-button" @click="cancel">
              Cancel
            </button>
            <button class="confirm-button" @click="confirm">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const emit = defineEmits(['confirm', 'cancel'])

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('cancel')
}
</script>

<style>
.modal-mask {
  position: fixed;
  z-index: var(--z-index-modal);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(3px);
}

.modal-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 20px;
}

.modal-container {
  width: 450px;
  max-width: 100%;
  margin: 0px auto;
  padding: 0;
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  background-color: #f9f9f9;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: var(--color-secondary);
  font-size: var(--font-size-lg);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  margin: 0;
  line-height: 1;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  background-color: #f9f9f9;
  border-top: 1px solid rgba(0,0,0,0.1);
}

.cancel-button,
.confirm-button {
  padding: 8px 20px;
  border-radius: var(--border-radius);
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.cancel-button {
  background-color: #f1f1f1;
  color: #333;
}

.cancel-button:hover {
  background-color: #e1e1e1;
}

.confirm-button {
  background-color: var(--color-primary);
  color: white;
}

.confirm-button:hover {
  background-color: #00c070;
}

/* Modal animation */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(-30px);
}

/* Warning styling for modal content */
.warning {
  color: #d32f2f;
  font-weight: 500;
}
</style>
