<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import ProfileEditor from '../../components/auth/ProfileEditor.vue'

interface Props {
  isMenuOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['toggle-menu'])
const authStore = useAuthStore()
const router = useRouter()

// User menu and profile editor states
const showUserMenu = ref(false)
const showProfileEditor = ref(false)

// Computed properties for user info
const userName = computed(() => authStore.user?.user_metadata?.name || authStore.user?.user_metadata?.full_name || '')
const userEmail = computed(() => authStore.user?.email || authStore.user?.phone || '')
const userInitials = computed(() => {
  const name = userName.value
  if (!name) return ''
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

// Avatar color from user metadata
const avatarColor = computed(() => {
  return authStore.user?.user_metadata?.avatarColor || '#00dc82'
})

// Menu toggle
const menuAriaLabel = computed(() => (props.isMenuOpen ? 'Close menu' : 'Open menu'))

// Profile functions
function openProfileEditor() {
  showUserMenu.value = false
  showProfileEditor.value = true
}

function closeProfileEditor() {
  showProfileEditor.value = false
}

function handleProfileUpdated(updatedUser: any) {
  // This function will be called when the profile is updated
  authStore.setSession(updatedUser, authStore.session, 3600)
}

// Logout function
async function logout() {
  await authStore.clearSession()
  showUserMenu.value = false
  router.push('/auth')
}

// Close user menu when clicking outside
function closeUserMenu(event: MouseEvent) {
  if (showUserMenu.value) {
    const target = event.target as HTMLElement
    if (!target.closest('.user-profile')) {
      showUserMenu.value = false
    }
  }
}

// Add and remove event listener for closing user menu
document.addEventListener('click', closeUserMenu)
</script>

<template>
  <header class="app-header">
    <!-- Profile Editor Modal -->
    <div v-if="showProfileEditor" class="profile-editor-modal">
      <div class="modal-backdrop" @click="closeProfileEditor"></div>
      <div class="modal-content">
        <ProfileEditor 
          :user="authStore.user" 
          @close="closeProfileEditor"
          @updated="handleProfileUpdated"
        />
      </div>
    </div>
    
    <nav class="navbar" aria-label="Main navigation">
      <div class="container">
        <div class="nav-brand">
          <router-link to="/" class="brand-link">
            <span class="brand-name">Rhino Bond</span>
          </router-link>
        </div>
        
        <div class="nav-links" :class="{ open: isMenuOpen }" :aria-expanded="isMenuOpen">
          <div class="nav-section">
            <router-link to="/" class="nav-item" aria-current="page">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Dashboard</span>
            </router-link>
            
            <router-link to="/qr-codes" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <rect x="7" y="7" width="3" height="3"></rect>
                <rect x="14" y="7" width="3" height="3"></rect>
                <rect x="7" y="14" width="3" height="3"></rect>
                <rect x="14" y="14" width="3" height="3"></rect>
              </svg>
              <span>QR Codes</span>
            </router-link>
            
            <router-link to="/events" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Events</span>
            </router-link>
            
            <router-link to="/users" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Users</span>
            </router-link>
            
            <router-link to="/products" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span>Products</span>
            </router-link>
          </div>
          
          <div class="nav-section">
            <router-link to="/points-airdrop" class="nav-item" exact-active-class="router-link-exact-active">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
              <span>Points Airdrop</span>
            </router-link>
            
            <router-link to="/transactions" class="nav-item" exact-active-class="router-link-exact-active">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <span>Transactions</span>
            </router-link>
            
            <router-link to="/contact-messages" class="nav-item" exact-active-class="router-link-exact-active">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Messages</span>
            </router-link>
            
            <router-link to="/pan-verification" class="nav-item" exact-active-class="router-link-exact-active">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Verification</span>
            </router-link>
          </div>
          
          <!-- Auth related buttons -->
          <div class="nav-section auth-section">
            <template v-if="authStore.isAuthenticated">
              <div class="user-profile">
                <button @click="showUserMenu = !showUserMenu" class="profile-button" :class="{ active: showUserMenu }">
                  <div class="avatar" :style="{ backgroundColor: avatarColor }">
                    <span v-if="userInitials">{{ userInitials }}</span>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <span class="user-name">{{ userName || 'User' }}</span>
                  <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                
                <div v-if="showUserMenu" class="user-menu">
                  <div class="menu-header">
                    <div class="menu-avatar" :style="{ backgroundColor: avatarColor }">{{ userInitials }}</div>
                    <div class="menu-user-info">
                      <div class="menu-name">{{ userName || 'User' }}</div>
                      <div class="menu-email">{{ userEmail || 'No email' }}</div>
                    </div>
                  </div>
                  <div class="menu-divider"></div>
                  <button @click="openProfileEditor" class="menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Edit Profile
                  </button>
                  <button @click="logout" class="menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </template>
            
            <router-link v-else to="/auth" class="auth-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span>Sign In</span>
            </router-link>
          </div>
        </div>
        
        <button class="menu-toggle" @click="emit('toggle-menu')" :aria-label="menuAriaLabel" :aria-expanded="isMenuOpen">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  background: linear-gradient(to right, var(--color-secondary), #252525);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: var(--container-2xl);
  width: 100%;
  margin: 0 auto;
  padding: 0.75rem var(--space-xl);
}

.nav-brand {
  display: flex;
  align-items: center;
  z-index: 1001;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  text-decoration: none;
  position: relative;
}

.logo {
  height: 34px;
  width: auto;
  transition: transform 0.3s var(--transition-timing);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.brand-link:hover .logo {
  transform: scale(1.05);
}

.brand-name {
  font-size: 1.3rem;
  font-weight: 700;
  background: linear-gradient(90deg, var(--color-primary), #a3ff9e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  position: relative;
}

.brand-name::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  transition: width 0.3s var(--transition-timing);
}

.brand-link:hover .brand-name::after {
  width: 100%;
}

.nav-links {
  display: flex;
  flex-grow: 1;
  justify-content: space-between;
  margin: 0 1rem;
  align-items: center;
  border-radius: 12px;
  padding: 0.25rem 0.5rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.nav-section {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.auth-section {
  margin-left: 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: all 0.3s var(--transition-timing);
  font-weight: 500;
  font-size: 0.95rem;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  transform: translate(-50%, -50%) scale(0);
  border-radius: inherit;
  transition: transform 0.3s var(--transition-timing);
}

.nav-item:hover::before {
  transform: translate(-50%, -50%) scale(1);
}

.nav-item svg {
  opacity: 0.75;
  transition: all 0.3s var(--transition-timing);
  position: relative;
  z-index: 1;
}

.nav-item span {
  position: relative;
  z-index: 1;
}

.nav-item:hover {
  color: white;
}

.nav-item:hover svg {
  opacity: 1;
  transform: translateY(-1px);
}

.nav-item.router-link-exact-active {
  background: linear-gradient(45deg, var(--color-primary), rgba(0, 220, 130, 0.8));
  color: var(--color-secondary);
  box-shadow: 
    0 4px 10px rgba(0, 220, 130, 0.25),
    0 0 0 1px rgba(0, 220, 130, 0.1) inset;
}

.nav-item.router-link-exact-active svg {
  opacity: 1;
  color: var(--color-secondary);
}

.nav-item.router-link-exact-active::before {
  display: none;
}

.auth-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(45deg, var(--color-primary), #90eea7);
  color: var(--color-secondary);
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s var(--transition-timing);
  text-decoration: none;
  font-size: 0.95rem;
  box-shadow: 
    0 4px 12px rgba(0, 220, 130, 0.2),
    0 0 0 1px rgba(0, 220, 130, 0.1) inset;
}

.auth-button:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 16px rgba(0, 220, 130, 0.3),
    0 0 0 1px rgba(0, 220, 130, 0.2) inset;
}

/* User profile styling */
.user-profile {
  position: relative;
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--color-text-inverse);
  cursor: pointer;
  transition: all 0.3s var(--transition-timing);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.profile-button:hover, .profile-button.active {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.dropdown-arrow {
  transition: transform 0.3s var(--transition-timing);
  opacity: 0.8;
}

.profile-button.active .dropdown-arrow {
  transform: rotate(180deg);
}

.avatar {
  width: 32px;
  height: 32px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary);
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.15),
    0 0 0 2px rgba(255, 255, 255, 0.1);
  transition: all 0.3s var(--transition-timing);
}

.profile-button:hover .avatar {
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.avatar svg {
  width: 16px;
  height: 16px;
}

.user-name {
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: -0.2px;
}

.user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  width: 280px;
  overflow: hidden;
  z-index: var(--z-index-dropdown);
  transform-origin: top right;
  animation: menuFadeIn 0.25s var(--transition-timing);
}

@keyframes menuFadeIn {
  from { 
    opacity: 0; 
    transform: translateY(-10px) scale(0.98); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

.menu-header {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(to bottom, rgba(0, 220, 130, 0.05), transparent);
}

.menu-avatar {
  width: 48px;
  height: 48px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary);
  font-weight: 700;
  font-size: 1.2rem;
  box-shadow: 
    0 4px 10px rgba(0, 220, 130, 0.2),
    0 0 0 2px rgba(0, 220, 130, 0.1);
}

.menu-user-info {
  flex: 1;
  min-width: 0;
}

.menu-name {
  font-weight: 600;
  color: var(--color-secondary);
  font-size: 1rem;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-email {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  word-break: break-all;
  line-height: 1.4;
}

.menu-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1), transparent);
  margin: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0.9rem 1.25rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--color-secondary);
  transition: all 0.2s var(--transition-timing);
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: rgba(0, 220, 130, 0.1);
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.3s var(--transition-timing);
}

.menu-item:hover::before {
  transform: translate(-50%, -50%) scale(1);
}

.menu-item svg {
  width: 18px;
  height: 18px;
  color: var(--color-text-secondary);
  position: relative;
  z-index: 1;
  transition: transform 0.3s var(--transition-timing);
}

.menu-item:hover svg {
  transform: translateX(2px);
  color: var(--color-primary);
}

.menu-item span {
  position: relative;
  z-index: 1;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xs);
  z-index: 1001;
  border-radius: 8px;
  transition: all 0.3s var(--transition-timing);
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-toggle .bar {
  display: block;
  width: 22px;
  height: 2px;
  background-color: var(--color-text-inverse);
  margin: 5px 0;
  transition: all 0.3s var(--transition-timing);
  border-radius: 2px;
}

.menu-toggle:hover .bar {
  background-color: var(--color-primary);
}

@media (max-width: 1100px) {
  .navbar .container {
    padding: 0.75rem var(--space-lg);
  }
  
  .nav-links {
    margin: 0 0.5rem;
  }
  
  .nav-section {
    gap: 0.1rem;
  }
  
  .nav-item {
    padding: 0.5rem 0.6rem;
  }
}

@media (max-width: 992px) {
  .nav-item span {
    display: none;
  }
  
  .nav-item {
    padding: 0.5rem;
  }
  
  .nav-item svg {
    margin: 0;
  }
  
  .user-name {
    display: none;
  }
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }
  
  .navbar .container {
    padding: 0.75rem 1rem;
  }
  
  .nav-links {
    position: fixed;
    top: 0;
    right: -100%;
    bottom: 0;
    width: 85%;
    max-width: 320px;
    background: var(--gradient-secondary);
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 1rem;
    padding: 5rem 1.5rem 2rem;
    margin: 0;
    box-shadow: 
      -10px 0 30px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.05) inset;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    border-radius: 0;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  .nav-links.open {
    right: 0;
  }
  
  .nav-section {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
  
  .nav-item {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
  }
  
  .nav-item span {
    display: inline;
  }
  
  .auth-section {
    margin: 0;
    margin-top: auto;
    width: 100%;
  }
  
  .auth-button {
    width: 100%;
    justify-content: center;
  }
  
  .user-profile {
    width: 100%;
  }
  
  .profile-button {
    width: 100%;
    justify-content: flex-start;
    padding: 0.75rem 1rem;
  }
  
  .user-name {
    display: block;
  }
  
  .user-menu {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 16px 16px 0 0;
    animation: slideUp 0.3s var(--transition-timing);
    max-height: 90vh;
    overflow-y: auto;
  }
  
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  
  .modal-content {
    width: 95%;
    padding: 1.25rem;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .menu-toggle.open .bar:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }
  
  .menu-toggle.open .bar:nth-child(2) {
    opacity: 0;
  }
  
  .menu-toggle.open .bar:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }
}

/* Profile editor modal styling */
.profile-editor-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s var(--transition-timing);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 550px;
  padding: 1.75rem;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(0, 0, 0, 0.1);
  z-index: 1;
  animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSlideIn {
  from { 
    transform: translateY(-30px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}
</style>
