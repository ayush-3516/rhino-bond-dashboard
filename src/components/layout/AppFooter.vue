<template>
  <footer class="app-footer">
    <div class="container">
      <p>© 2024 Rhino Bond Dashboard</p>
      <div class="footer-links">
        <router-link to="/privacy" class="footer-link">Privacy Policy</router-link>
        <router-link to="/terms" class="footer-link">Terms of Service</router-link>
      </div>
    </div>
  </footer>
</template>

<script setup>
// Footer component logic can be added here
</script>

<style scoped>
.app-footer {
  padding: var(--space-xl) 0;
  text-align: center;
  background-color: var(--color-secondary);
  color: var(--color-text-inverse);
  border-top: var(--border-width) solid var(--color-border);
}

.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  align-items: center;
}

.footer-links {
  display: flex;
  gap: var(--space-lg);
  margin-top: var(--space-sm);
}

.footer-link {
  color: var(--color-text-inverse);
  text-decoration: none;
  transition: var(--transition);
}

.footer-link:hover {
  color: color-mix(in srgb, var(--color-text-inverse), var(--color-primary) 30%);
}

@media (max-width: 768px) {
  .app-footer {
    padding: var(--space-lg) 0;
  }

  .footer-links {
    flex-direction: column;
    gap: var(--space-xs);
  }
}
</style>
