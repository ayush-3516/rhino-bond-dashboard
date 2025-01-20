<template>
  <div class="product-management">
    <h1>Product Management</h1>
    <ProductList />
  </div>
</template>

<script setup>
import ProductList from '../components/ProductList.vue'
</script>

<style scoped>
.product-management {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
