<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <img src="@/assets/logo.svg" alt="Rhino Bond Logo" class="auth-logo" />
        <h1>Welcome to Rhino Bond</h1>
        <p class="auth-subtitle">{{ otpSent ? 'Verify your phone number' : 'Sign in securely to access your dashboard' }}</p>
      </div>

      <form @submit.prevent="otpSent ? verifyOtp() : sendOtp()" class="auth-form">
        <div v-if="!otpSent" class="form-group">
          <label for="phone">Phone Number</label>
          <div class="phone-input-wrapper">
            <input 
              type="tel"
              id="phone"
              v-model="phoneNumber"
              placeholder="+1 (234) 567-8900"
              class="phone-input"
              :class="{ 'error': phoneError }"
              @input="validatePhone"
              required
            />
            <small class="input-hint">Include country code (e.g. +1 for US)</small>
          </div>
          <span v-if="phoneError" class="error-message">{{ phoneError }}</span>
        </div>

        <div v-else class="form-group">
          <label for="otp">Verification Code</label>
          <div class="otp-input-wrapper">
            <input 
              type="text"
              id="otp"
              v-model="otp"
              placeholder="Enter 6-digit code"
              class="otp-input"
              :class="{ 'error': error }"
              required
              maxlength="6"
              pattern="\d{6}"
              autocomplete="one-time-code"
            />
            <div class="otp-hint">
              <small>Code sent to {{ phoneNumber }}</small>
              <button 
                type="button" 
                class="resend-button" 
                :disabled="isResendDisabled"
                @click="resendOtp"
              >
                {{ resendText }}
              </button>
            </div>
          </div>
          <span v-if="error" class="error-message">{{ error }}</span>
        </div>

        <button 
          type="submit" 
          class="submit-button"
          :disabled="isLoading || (otpSent ? !otp : !!phoneError)"
        >
          <span v-if="!isLoading">{{ otpSent ? 'Verify Code' : 'Send Verification Code' }}</span>
          <div v-else class="button-loader"></div>
        </button>
      </form>

      <div class="auth-footer">
        <p>Need help? 
          <button @click="showSupport" class="support-link">
            Contact support
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const phoneNumber = ref('')
const phoneError = ref('')
const otp = ref('')
const otpSent = ref(false)
const error = ref('')
const isLoading = ref(false)
const resendTimer = ref(0)

onMounted(() => {
  if (authStore.user) {
    router.push('/')
  }
})

const validatePhone = () => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  if (!phoneNumber.value) {
    phoneError.value = 'Phone number is required'
  } else if (!phoneRegex.test(phoneNumber.value)) {
    phoneError.value = 'Please enter a valid phone number with country code'
  } else {
    phoneError.value = ''
  }
}

const startResendTimer = () => {
  resendTimer.value = 30
  const interval = setInterval(() => {
    if (resendTimer.value > 0) {
      resendTimer.value--
    } else {
      clearInterval(interval)
    }
  }, 1000)
}

const isResendDisabled = computed(() => resendTimer.value > 0)
const resendText = computed(() => 
  resendTimer.value > 0 
    ? `Resend in ${resendTimer.value}s` 
    : 'Resend code'
)

const sendOtp = async () => {
  validatePhone()
  if (phoneError.value) return

  isLoading.value = true
  try {
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: phoneNumber.value,
      options: {
        shouldCreateUser: true
      }
    })
    
    if (authError) throw new Error(authError.message || 'Failed to send code')
    
    otpSent.value = true
    error.value = ''
    startResendTimer()
  } catch (err) {
    console.error('Authentication Error:', err)
    error.value = err.message || 'An error occurred during authentication'
  } finally {
    isLoading.value = false
  }
}

const resendOtp = async () => {
  if (isResendDisabled.value) return
  await sendOtp()
}

const verifyOtp = async () => {
  if (!otp.value) return
  
  isLoading.value = true
  try {
    const { data, error: authError } = await supabase.auth.verifyOtp({
      phone: phoneNumber.value,
      token: otp.value,
      type: 'sms',
      options: {
        redirectTo: window.location.origin
      }
    })
    
    if (authError) throw new Error(authError.message || 'Invalid verification code')
    if (!data?.session) throw new Error('No session created')

    authStore.setSession(data.user, data.session)
    
    const redirectTo = router.currentRoute.value.query.redirect || '/'
    router.push(redirectTo)
  } catch (err) {
    console.error('Verification Error:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const showSupport = () => {
  window.location.href = 'mailto:support@rhinobond.com'
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.auth-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 420px;
  padding: 32px;
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-header {
  text-align: center;
  margin-bottom: 40px;
}

.auth-logo {
  width: 72px;
  height: 72px;
  margin-bottom: 28px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.auth-header h1 {
  color: #0f172a;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
  background: linear-gradient(to right, #0f172a, #334155);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.auth-subtitle {
  color: #64748b;
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
}

.auth-form {
  margin: 32px 0;
}

.form-group {
  margin-bottom: 28px;
}

.form-group label {
  display: block;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: left;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
}

.phone-input-wrapper,
.otp-input-wrapper {
  position: relative;
  max-width: 360px;
  margin: 0 auto;
}

.phone-input,
.otp-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s ease;
  background-color: white;
}

.phone-input:hover,
.otp-input:hover {
  border-color: #cbd5e1;
}

.phone-input:focus,
.otp-input:focus {
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.12);
  outline: none;
}

.phone-input.error,
.otp-input.error {
  border-color: #ef4444;
}

.input-hint,
.otp-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #64748b;
  font-size: 13px;
  margin-top: 8px;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
  text-align: left;
}

.error-message {
  color: #ef4444;
  font-size: 13px;
  margin-top: 8px;
  display: block;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-message::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ef4444'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'/%3E%3C/svg%3E");
}

.submit-button {
  width: 360px;
  padding: 14px;
  background: linear-gradient(to right, #42b983, #3aa876);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin: 0 auto;
  text-transform: none;
  box-shadow: 0 2px 4px rgba(66, 185, 131, 0.1);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.2);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  background: linear-gradient(to right, #94d3b7, #8fcdb3);
  cursor: not-allowed;
}

.button-loader {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

.resend-button {
  background: none;
  border: none;
  color: #42b983;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}

.resend-button:hover:not(:disabled) {
  color: #3aa876;
}

.resend-button:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  color: #64748b;
  font-size: 14px;
  margin-top: 32px;
}

.link {
  color: #42b983;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.link:hover {
  color: #3aa876;
}

.support-link {
  background: none;
  border: none;
  color: #64748b;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  padding: 4px 8px;
  margin-top: 12px;
  transition: all 0.2s ease;
  font-weight: 500;
  border-radius: 6px;
}

.support-link:hover {
  color: #334155;
  background: #f1f5f9;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 24px;
  }

  .auth-header h1 {
    font-size: 24px;
  }

  .auth-subtitle {
    font-size: 15px;
  }

  .submit-button,
  .phone-input-wrapper,
  .otp-input-wrapper {
    max-width: 100%;
  }
}
</style>
