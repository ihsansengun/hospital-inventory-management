<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  persistent: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal
})

function close() {
  if (!props.persistent) {
    isOpen.value = false
    emit('update:modelValue', false)
  }
}

function handleBackdropClick() {
  close()
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  }
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
        @keyup.escape="handleEscape"
      >
        <div class="flex min-h-screen items-center justify-center p-4">
          <div
            class="fixed inset-0 bg-black/30 backdrop-blur-sm"
            @click="handleBackdropClick"
          />

          <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isOpen"
              :class="[
                'relative bg-white rounded-lg shadow-xl w-full',
                sizeClasses[size]
              ]"
            >
              <div class="border-b border-ink-20 px-6 py-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-display font-semibold text-ink-100">
                    {{ title }}
                  </h3>
                  <button
                    @click="close"
                    class="p-1 hover:bg-ink-5 rounded-md transition-colors"
                  >
                    <svg class="w-5 h-5 text-ink-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="px-6 py-4">
                <slot />
              </div>

              <div class="border-t border-ink-20 px-6 py-4">
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>