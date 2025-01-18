<template>
  <Transition name="modal">
    <div v-if="visible" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            <slot name="header">
              <h3>Confirm Action</h3>
            </slot>
          </div>

          <div class="modal-body">
            <slot name="body">
              Are you sure you want to perform this action?
            </slot>
          </div>

          <div class="modal-footer">
            <button class="modal-default-button" @click="confirm">
              Confirm
            </button>
            <button class="modal-default-button" @click="cancel">
              Cancel
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
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
}

.modal-container {
  width: 400px;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
}

.modal-header h3 {
  margin-top: 0;
  color: #333;
}

.modal-body {
  margin: 20px 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal-default-button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.modal-default-button:first-child {
  background-color: #dc3545;
  color: white;
}

.modal-default-button:last-child {
  background-color: #6c757d;
  color: white;
}

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(1.1);
}
</style>
