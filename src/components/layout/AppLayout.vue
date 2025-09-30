<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import { useBreakpoints } from '@/composables/useMediaQuery'

const authStore = useAuthStore()
const router = useRouter()
const { isMobile } = useBreakpoints()

const user = computed(() => authStore.currentUser)
const showMobileMenu = ref(false)

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-ink-5">
    <header class="bg-white border-b border-ink-20 sticky top-0 z-10 shadow-sm">
      <div class="px-3 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-14 sm:h-16">
          <div class="flex items-center">
            <div class="flex items-center space-x-2 sm:space-x-3">
              <div class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-critical rounded-lg">
                <svg class="w-5 h-5 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 3v6H3v6h6v6h6v-6h6V9h-6V3H9z"/>
                </svg>
              </div>
              <div>
                <h1 class="text-base sm:text-lg font-display font-bold text-ink-100">
                  Hospital Inventory
                </h1>
                <p class="text-[11px] sm:text-xs text-ink-100 font-medium truncate max-w-[150px] sm:max-w-none">{{ user?.hospitalName }}</p>
              </div>
            </div>
          </div>

          <!-- Desktop User Info -->
          <div v-if="!isMobile" class="flex items-center space-x-4">
            <div class="text-right">
              <p class="text-sm font-medium text-ink-100">{{ user?.fullName }}</p>
              <p class="text-xs text-ink-60">{{ user?.role }}</p>
            </div>

            <div class="flex items-center space-x-2">
              <div class="h-8 w-px bg-ink-20 mr-2"></div>

              <div class="w-10 h-10 bg-ink-100 rounded-full flex items-center justify-center shadow-sm ring-2 ring-ink-10">
                <span class="text-sm font-semibold text-white">
                  {{ authStore.userInitials }}
                </span>
              </div>

              <button
                @click="handleLogout"
                class="ml-2 p-2 hover:bg-ink-5 rounded-lg text-ink-60 hover:text-ink-100 transition-all duration-200"
                aria-label="Logout"
                title="Logout"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <div v-else class="flex items-center space-x-2">
            <div class="w-7 h-7 bg-ink-100 rounded-full flex items-center justify-center">
              <span class="text-[10px] font-medium text-white">
                {{ authStore.userInitials }}
              </span>
            </div>
            <button
              @click="showMobileMenu = !showMobileMenu"
              class="p-2 hover:bg-ink-5 rounded-md text-ink-60 hover:text-ink-100 transition-colors"
              aria-label="Menu"
            >
              <svg v-if="!showMobileMenu" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Menu Dropdown -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-48 opacity-100"
      leave-from-class="max-h-48 opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div
        v-if="showMobileMenu && isMobile"
        class="bg-white border-b border-ink-20 overflow-hidden"
      >
        <div class="px-4 py-3 space-y-3">
          <div>
            <p class="text-sm font-medium text-ink-100">{{ user?.fullName }}</p>
            <p class="text-xs text-ink-60">{{ user?.role }}</p>
          </div>
          <button
            @click="handleLogout"
            class="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-ink-100 text-white rounded-md hover:bg-ink-80 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </Transition>

    <main class="px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <slot />
    </main>
  </div>
</template>