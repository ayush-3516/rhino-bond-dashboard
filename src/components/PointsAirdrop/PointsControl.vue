<template>
  <div class="points-control">
    <label for="points" class="control-label">Points to Airdrop:</label>
    <div class="input-with-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="input-icon">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      <input
        id="points"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value ? parseInt($event.target.value) : '')"
        type="number"
        min="1"
        required
        placeholder="Enter points amount"
        class="points-input"
      />
    </div>
    
    <div class="quick-values">
      <button 
        v-for="value in quickValues" 
        :key="value" 
        @click="$emit('update:modelValue', value)"
        class="quick-value-btn"
        :class="{ active: modelValue === value }"
      >
        {{ value }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  }
})

defineEmits(['update:modelValue'])

// Quick selection values
const quickValues = [100, 500, 1000, 5000]
</script>

<style scoped>
.points-control {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.control-label {
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: var(--space-sm);
  width: 18px;
  height: 18px;
  color: var(--color-text-secondary, #666);
  opacity: 0.7;
}

.points-input {
  width: 100%;
  padding: var(--space-sm) var(--space-sm) var(--space-sm) calc(var(--space-sm) * 2 + 18px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
}

.points-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.15);
}

.quick-values {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.quick-value-btn {
  background-color: rgba(66, 185, 131, 0.1);
  border: 1px solid rgba(66, 185, 131, 0.2);
  color: var(--color-primary);
  border-radius: var(--border-radius-md);
  padding: var(--space-xs) var(--space-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.quick-value-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(66, 185, 131, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
  z-index: 0;
}

.quick-value-btn:hover::before {
  width: 200%;
  height: 200%;
}

.quick-value-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.2);
}

.quick-value-btn.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.25);
}
</style>
