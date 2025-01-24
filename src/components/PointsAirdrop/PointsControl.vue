<template>
  <div class="points-control">
    <label for="points">Points to Airdrop:</label>
    <input
      id="points"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      type="number"
      min="1"
      required
      class="points-input"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Number,
    required: true
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
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
</style>
