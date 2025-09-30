<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { MedicalDataGenerator } from '@/fixtures/generators'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showCredentials = ref(true)

const testUsers = MedicalDataGenerator.generateTestUsers()

const isFormValid = computed(() =>
  username.value.trim() !== '' && password.value.trim() !== ''
)

async function handleLogin() {
  if (!isFormValid.value) return

  loading.value = true
  error.value = ''

  try {
    const success = await authStore.login(username.value, password.value)
    if (success) {
      await router.push('/inventory')
    } else {
      error.value = 'Invalid username or password'
    }
  } catch (e) {
    error.value = 'An error occurred during login'
  } finally {
    loading.value = false
  }
}

function selectTestUser(user: typeof testUsers[0]) {
  username.value = user.username
  password.value = user.password
  showCredentials.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink-5 to-white">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-sm border border-ink-20 p-8">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-critical rounded-lg mb-4">
            <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 3v6H3v6h6v6h6v-6h6V9h-6V3H9z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-display font-bold text-ink-100">Hospital Inventory</h1>
          <p class="text-ink-60 mt-2">Sign in to manage medical assets</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="username" class="block text-sm font-medium text-ink-80 mb-1">
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              data-cy="username"
              class="w-full px-3 py-2 border border-ink-20 rounded-md focus:outline-none focus:ring-2 focus:ring-critical/20 focus:border-critical"
              :disabled="loading"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-ink-80 mb-1">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              data-cy="password"
              class="w-full px-3 py-2 border border-ink-20 rounded-md focus:outline-none focus:ring-2 focus:ring-critical/20 focus:border-critical"
              :disabled="loading"
              placeholder="Enter your password"
            />
          </div>

          <div v-if="error" class="text-sm text-critical bg-critical/10 px-3 py-2 rounded-md">
            {{ error }}
          </div>

          <button
            type="submit"
            data-cy="login-btn"
            :disabled="!isFormValid || loading"
            class="w-full py-2 px-4 bg-ink-100 text-white rounded-md hover:bg-ink-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div v-if="showCredentials" class="mt-8 pt-8 border-t border-ink-20">
          <p class="text-sm text-ink-60 mb-4 text-center">Test Credentials</p>
          <div class="space-y-2">
            <button
              v-for="user in testUsers"
              :key="user.id"
              @click="selectTestUser(user)"
              class="w-full text-left p-3 border border-ink-20 rounded-md hover:bg-ink-5 transition-colors"
            >
              <div class="font-medium text-ink-100">{{ user.fullName }}</div>
              <div class="text-sm text-ink-60">{{ user.hospitalName }}</div>
              <div class="text-xs text-ink-40 mt-1">
                Username: {{ user.username }} | Password: {{ user.password }}
              </div>
              <div class="text-xs text-optimal mt-1" v-if="user.hospitalId === 'hospital-1'">
                Basic view: Name, Manufacturer, Category, Quantity, Serial Number
              </div>
              <div class="text-xs text-optimal mt-1" v-if="user.hospitalId === 'hospital-2'">
                Extended view: + Price, Expiry Date, Department
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>