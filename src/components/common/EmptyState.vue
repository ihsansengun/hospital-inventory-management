<script setup lang="ts">
interface Props {
  title?: string
  message?: string
  icon?: string
  actionText?: string
}

withDefaults(defineProps<Props>(), {
  title: 'No data found',
  message: 'Get started by adding your first item',
  icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
})

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="bg-white rounded-lg border border-ink-20 p-12">
    <div class="text-center max-w-md mx-auto">
      <div class="mx-auto h-16 w-16 bg-ink-5 rounded-full flex items-center justify-center mb-4">
        <svg class="h-8 w-8 text-ink-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="icon" />
        </svg>
      </div>

      <h3 class="text-lg font-medium text-ink-100 mb-2">{{ title }}</h3>
      <p class="text-sm text-ink-60 mb-6">{{ message }}</p>

      <button
        v-if="actionText"
        @click="emit('action')"
        class="px-4 py-2 bg-ink-100 text-white rounded-md hover:bg-ink-80 transition-colors inline-flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ actionText }}
      </button>
    </div>
  </div>
</template>