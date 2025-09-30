import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MedicalDataGenerator } from '@/fixtures/generators'
import type { HospitalConfig } from '@/models/HospitalConfig'

interface User {
  id: string
  username: string
  fullName: string
  role: string
  hospitalId: string
  hospitalName: string
  email: string
  avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const hospitalConfig = ref<HospitalConfig | null>(null)

  const testUsers = MedicalDataGenerator.generateTestUsers()
  const hospitalConfigs = MedicalDataGenerator.getHospitalConfigs()

  const userInitials = computed(() => {
    if (!currentUser.value) return ''
    return currentUser.value.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  })

  const userRole = computed(() => currentUser.value?.role || 'Guest')

  async function login(username: string, password: string): Promise<boolean> {
    const user = testUsers.find(u =>
      u.username === username && u.password === password
    )

    if (user) {
      currentUser.value = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: user.hospitalName,
        email: user.email
      }
      isAuthenticated.value = true
      hospitalConfig.value = hospitalConfigs[user.hospitalId] || null

      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
      localStorage.setItem('hospitalConfig', JSON.stringify(hospitalConfig.value))

      return true
    }

    return false
  }

  function logout(): void {
    currentUser.value = null
    isAuthenticated.value = false
    hospitalConfig.value = null

    localStorage.removeItem('currentUser')
    localStorage.removeItem('hospitalConfig')
  }

  function initializeFromStorage(): void {
    const storedUser = localStorage.getItem('currentUser')
    const storedConfig = localStorage.getItem('hospitalConfig')

    if (storedUser) {
      currentUser.value = JSON.parse(storedUser)
      isAuthenticated.value = true
    }

    if (storedConfig) {
      hospitalConfig.value = JSON.parse(storedConfig)
    }
  }

  function getHospitalConfig(): HospitalConfig {
    return hospitalConfig.value || MedicalDataGenerator.getDefaultConfig()
  }

  return {
    currentUser,
    isAuthenticated,
    hospitalConfig,
    userInitials,
    userRole,
    login,
    logout,
    initializeFromStorage,
    getHospitalConfig
  }
})