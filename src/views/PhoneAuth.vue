<template>
  <div class="phone-auth">
    <h1>Phone Authentication</h1>
    <div v-if="!otpSent">
      <input v-model="phoneNumber" type="tel" placeholder="Enter phone number" />
      <button @click="sendOtp">Send OTP</button>
    </div>
    <div v-else>
      <input v-model="otp" type="text" placeholder="Enter OTP" />
      <button @click="verifyOtp">Verify OTP</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'

const router = useRouter()

const phoneNumber = ref('')
const otp = ref('')
const otpSent = ref(false)
const error = ref('')
const authStore = useAuthStore()

onMounted(() => {
  if (authStore.user) {
    error.value = 'Already logged in'
    otpSent.value = true
  }
})

const sendOtp = async () => {
  try {
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: phoneNumber.value,
      options: {
        shouldCreateUser: true
      }
    })
    
    if (authError) {
      console.error('OTP Send Error:', authError)
      throw new Error(authError.message || 'Failed to send OTP')
    }
    
    otpSent.value = true
    error.value = ''
  } catch (err) {
    console.error('Authentication Error:', err)
    error.value = err.message || 'An error occurred during authentication'
  }
}

const verifyOtp = async () => {
  try {
    const { data, error: authError } = await supabase.auth.verifyOtp({
      phone: phoneNumber.value,
      token: otp.value,
      type: 'sms',
      options: {
        redirectTo: window.location.origin
      }
    })
    
    if (authError) {
      console.error('OTP Verification Error:', authError)
      throw new Error(authError.message || 'Invalid OTP')
    }

    if (!data?.session) {
      throw new Error('No session created')
    }

    authStore.setSession(data.user, data.session)
    error.value = 'Login successful!'
    
    // Wait a moment before redirecting to ensure session is set
    setTimeout(() => {
      const redirectTo = router.currentRoute.value.query.redirect || '/'
      router.push(redirectTo)
    }, 500)
  } catch (err) {
    console.error('Verification Error:', err)
    error.value = err.message || 'Failed to verify OTP'
  }
}
</script>

<style scoped>
.phone-auth {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

input {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
}

button {
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
