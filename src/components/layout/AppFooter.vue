<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-primary">
        <div class="footer-logo">
          <img src="../../assets/logo.svg" alt="Rhino Bond Logo" class="logo" />
          <span class="brand-name">Rhino Bond</span>
        </div>
        <p class="footer-description">
          The sustainable reward platform for ecological conservation initiatives.
          Together we can make a difference in protecting our planet's biodiversity.
        </p>
        <div class="social-links">
          <a href="#" aria-label="Facebook" class="social-link" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="#" aria-label="Twitter" class="social-link" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
          </a>
          <a href="#" aria-label="LinkedIn" class="social-link" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </a>
          <a href="#" aria-label="GitHub" class="social-link" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>
        </div>
      </div>
      
      <div class="footer-links-section">
        <div class="footer-links-column">
          <h3>Platform</h3>
          <router-link to="/" class="footer-link">Dashboard</router-link>
          <router-link to="/qr-codes" class="footer-link">QR Codes</router-link>
          <router-link to="/events" class="footer-link">Events</router-link>
        </div>

        <div class="footer-links-column">
          <h3>Resources</h3>
          <router-link to="/users" class="footer-link">User Management</router-link>
          <router-link to="/products" class="footer-link">Products</router-link>
          <router-link to="/transactions" class="footer-link">Transactions</router-link>
        </div>

        <div class="footer-links-column">
          <h3>Legal</h3>
          <router-link to="/privacy" class="footer-link">Privacy Policy</router-link>
          <router-link to="/terms" class="footer-link">Terms of Service</router-link>
          <router-link to="/contact-messages" class="footer-link">Contact Us</router-link>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>© {{ new Date().getFullYear() }} Rhino Bond Dashboard. All rights reserved.</p>
      <p class="attribution">Designed with sustainability in mind 🌿</p>
    </div>
  </footer>
</template>

<script setup>
// Footer component logic
</script>

<style scoped>
.app-footer {
  background: linear-gradient(180deg, var(--color-background) 0%, var(--color-background-soft) 100%);
  color: var(--color-text);
  position: relative;
  overflow: hidden;
  z-index: 1;
  border-top: 1px solid var(--color-border);
  margin-top: 4rem;
}

.footer-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 4rem 2rem;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 4rem;
}

.footer-primary {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  height: 2.5rem;
  width: auto;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.footer-description {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-light);
  max-width: 400px;
}

.social-links {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-background-mute);
  color: var(--color-text);
  transition: all 0.2s ease;
}

.social-link:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-2px);
}

.footer-links-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.footer-links-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer-links-column h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.footer-link {
  color: var(--color-text-light);
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.footer-link:hover {
  color: var(--color-primary);
  transform: translateX(4px);
}

.footer-bottom {
  border-top: 1px solid var(--color-border);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-background-soft);
}

.footer-bottom p {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.attribution {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 1024px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .footer-primary {
    text-align: center;
    align-items: center;
  }

  .footer-description {
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .footer-content {
    padding: 3rem 1.5rem;
  }

  .footer-links-section {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
