<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const error = ref<Error | null>(null)
const errorInfo = ref<string>('')

onErrorCaptured((err: Error, _instance, info) => {
  error.value = err
  errorInfo.value = info
  console.error('Error caught by boundary:', err, info)

  // Prevent the error from propagating
  return false
})

function resetError() {
  error.value = null
  errorInfo.value = ''
  window.location.reload()
}
</script>

<template>
  <div v-if="error" class="min-h-screen flex items-center justify-center bg-ink-5 p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div class="flex items-center mb-4">
        <div class="w-12 h-12 bg-critical/10 rounded-full flex items-center justify-center mr-3">
          <svg class="w-6 h-6 text-critical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-ink-100">Something went wrong</h2>
          <p class="text-sm text-ink-60">An unexpected error occurred</p>
        </div>
      </div>

      <div class="bg-ink-5 rounded p-3 mb-4">
        <p class="text-sm text-ink-80 font-mono">{{ error.message }}</p>
        <p v-if="errorInfo" class="text-xs text-ink-60 mt-1">{{ errorInfo }}</p>
      </div>

      <button
        @click="resetError"
        class="w-full px-4 py-2 bg-ink-100 text-white rounded-md hover:bg-ink-80 transition-colors"
      >
        Reload Application
      </button>
    </div>
  </div>

  <slot v-else />
</template>