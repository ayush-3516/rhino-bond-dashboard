<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Main Auth Content -->
      <div class="auth-header">
        <img src="../assets/logo.svg" alt="Rhino Bond Logo" class="auth-logo" />
        <h1>Welcome to Rhino Bond</h1>
        <p class="auth-subtitle">Sign in to access the dashboard</p>
      </div>

      <!-- Auth Tabs -->
      <div class="auth-tabs">
        <button 
          class="auth-tab active"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tab-icon">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          Phone
        </button>
      </div>

      <!-- Phone Authentication Form -->
      <form @submit.prevent="handlePhoneSubmit" class="auth-form">
        <div v-if="!otpSent" class="form-step phone-step">
          <div class="input-group">
            <label for="phone">Phone Number</label>
            <div class="input-with-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <input 
                type="tel" 
                id="phone" 
                v-model="phoneNumber"
                placeholder="Enter your phone number"
                :disabled="isLoading"
                required
              />
            </div>
            <p class="input-help">Include country code (e.g., +91 for IN)</p>
          </div>

          <button 
            type="submit" 
            class="auth-button"
            :disabled="isLoading || !phoneNumber"
          >
            <span v-if="!isLoading">Send Verification Code</span>
            <span v-else class="loading-spinner"></span>
          </button>
        </div>

        <div v-else class="form-step otp-step">
          <div class="input-group">
            <div class="otp-info">
              <p class="verification-sent">
                Verification code sent to
                <strong>{{ phoneNumber }}</strong>
              </p>
            </div>
            <label for="otp">Verification Code</label>
            <div class="input-with-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input 
                type="text" 
                id="otp" 
                v-model="otp"
                placeholder="Enter the 6-digit code"
                :disabled="isLoading"
                inputmode="numeric"
                maxlength="6"
                required
              />
            </div>
          </div>

          <div class="auth-actions">
            <button 
              type="submit" 
              class="auth-button"
              :disabled="isLoading || !otp || otp.length < 6"
            >
              <span v-if="!isLoading">Verify Code</span>
              <span v-else class="loading-spinner"></span>
            </button>
            <button 
              type="button" 
              class="link-button"
              :disabled="isLoading || resendCountdown > 0"
              @click="resendOtp"
            >
              {{ resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code' }}
            </button>
            <button 
              type="button" 
              class="link-button"
              :disabled="isLoading"
              @click="resetForm"
            >
              Change phone number
            </button>
          </div>
        </div>
      </form>

      <!-- Auth Messages -->
      <div v-if="errorMessage" class="auth-message error">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="successMessage" class="auth-message success">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ successMessage }}</span>
      </div>

      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'

// Component state
const authStore = useAuthStore()
const router = useRouter()
const phoneNumber = ref('')
const otp = ref('')
const otpSent = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const resendCountdown = ref(0)

// Handle phone auth submission
async function handlePhoneSubmit() {
  if (!otpSent.value) {
    await sendPhoneOtp()
  } else {
    await verifyPhoneOtp()
  }
}

// Phone number OTP
async function sendPhoneOtp() {
  if (!phoneNumber.value) {
    errorMessage.value = 'Please enter a valid phone number'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: phoneNumber.value,
      options: {
        shouldCreateUser: true
      }
    })
    
    if (authError) {
      throw new Error(authError.message || 'Failed to send verification code')
    }
    
    otpSent.value = true
    successMessage.value = 'Verification code sent successfully'
    startCountdown()
  } catch (err) {
    console.error('Authentication Error:', err)
    errorMessage.value = err.message || 'Failed to send verification code'
  } finally {
    isLoading.value = false
  }
}

async function verifyPhoneOtp() {
  if (!otp.value || otp.value.length < 6) {
    errorMessage.value = 'Please enter the 6-digit verification code'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const { data, error: authError } = await supabase.auth.verifyOtp({
      phone: phoneNumber.value,
      token: otp.value,
      type: 'sms'
    })
    
    if (authError) {
      throw new Error(authError.message || 'Invalid verification code')
    }

    if (!data?.session) {
      throw new Error('Authentication failed. Please try again.')
    }

    authStore.setSession(data.user, data.session)
    successMessage.value = 'Authentication successful!'
    
    // Wait a moment before redirecting to ensure session is set
    setTimeout(() => {
      const redirectTo = router.currentRoute.value.query.redirect || '/'
      router.push(redirectTo)
    }, 1000)
  } catch (err) {
    console.error('Verification Error:', err)
    errorMessage.value = err.message || 'Failed to verify code'
  } finally {
    isLoading.value = false
  }
}

async function resendOtp() {
  if (resendCountdown.value > 0) return
  
  await sendPhoneOtp()
}

// Utility functions
function resetForm() {
  phoneNumber.value = ''
  otp.value = ''
  otpSent.value = false
  errorMessage.value = ''
  successMessage.value = ''
  resendCountdown.value = 0
}

function startCountdown() {
  resendCountdown.value = 60
  const timer = setInterval(() => {
    if (resendCountdown.value > 0) {
      resendCountdown.value -= 1
    } else {
      clearInterval(timer)
    }
  }, 1000)
}

// Check if already authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    const redirectTo = router.currentRoute.value.query.redirect || '/'
    router.push(redirectTo)
  }
})
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-background-soft, #f8f8f8);
  padding: 1rem;
}

.auth-card {
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-lg, 0 4px 20px rgba(0, 0, 0, 0.1));
  width: 100%;
  max-width: 450px;
  padding: 2rem;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo {
  width: 60px;
  height: auto;
  margin-bottom: 1rem;
}

.auth-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-secondary, #1e1e1e);
}

.auth-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary, #666);
}

.auth-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 1.5rem;
}

.auth-tab {
  flex: 1;
  background: none;
  border: none;
  padding: 1rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--color-text-secondary, #666);
  transition: var(--transition, all 0.2s ease);
  position: relative;
}

.auth-tab::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--color-primary, #00dc82);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.auth-tab.active {
  color: var(--color-primary, #00dc82);
  font-weight: 500;
}

.auth-tab.active::after {
  transform: scaleX(1);
}

.auth-tab:hover {
  color: var(--color-primary, #00dc82);
}

.tab-icon {
  width: 18px;
  height: 18px;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.form-step {
  animation: fadeIn 0.3s ease;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text, #1e1e1e);
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #999;
}

input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: var(--transition, all 0.2s ease);
}

input:focus {
  outline: none;
  border-color: var(--color-primary, #00dc82);
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.15);
}

input:disabled {
  background-color: #f8f8f8;
  cursor: not-allowed;
}

.input-help {
  font-size: 0.8rem;
  color: #777;
  margin-top: 0.25rem;
}

.auth-button {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--color-primary, #00dc82);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition, all 0.2s ease);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 48px;
}

.auth-button:hover:not(:disabled) {
  background-color: #00c476;
  transform: translateY(-1px);
}

.auth-button:active:not(:disabled) {
  transform: translateY(0);
}

.auth-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.link-button {
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--color-text-secondary, #666);
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition, all 0.2s ease);
}

.link-button:hover:not(:disabled) {
  color: var(--color-primary, #00dc82);
}

.link-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.3s ease;
  font-size: 0.9rem;
}

.auth-message svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.auth-message.error {
  background-color: #FEEFEF;
  color: #D32F2F;
}

.auth-message.success {
  background-color: #E7F6E7;
  color: #2E7D32;
}

.auth-message.error svg {
  color: #D32F2F;
}

.auth-message.success svg {
  color: #2E7D32;
}

.auth-footer {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-secondary, #666);
}

.auth-footer p {
  margin-bottom: 0.5rem;
}

.auth-footer a {
  color: var(--color-primary, #00dc82);
  text-decoration: none;
  font-weight: 500;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.help-link {
  font-size: 0.8rem;
}

.otp-info {
  text-align: center;
  margin-bottom: 1.5rem;
}

.verification-sent {
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.verification-help {
  font-size: 0.9rem;
  color: var(--color-text-secondary, #666);
}

.verification-icon {
  width: 50px;
  height: 50px;
  color: var(--color-primary, #00dc82);
  margin: 0 auto 1rem;
  display: block;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }
  
  .auth-header h1 {
    font-size: 1.5rem;
  }
}
</style>
