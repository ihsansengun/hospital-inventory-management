<script setup lang="ts">
import { useGlobalShortcuts, type ShortcutConfig } from '@/composables/useKeyboardShortcuts'

const { formatShortcut } = useGlobalShortcuts()

const shortcuts: ShortcutConfig[] = [
  {
    key: 'k',
    ctrl: true,
    description: 'Focus search box',
    handler: () => {}
  },
  {
    key: 'n',
    ctrl: true,
    description: 'Add new asset',
    handler: () => {}
  },
  {
    key: 'v',
    ctrl: true,
    shift: true,
    description: 'Toggle between table and card view',
    handler: () => {}
  },
  {
    key: '/',
    description: 'Show keyboard shortcuts',
    handler: () => {}
  },
  {
    key: 'Escape',
    description: 'Close modal/dialog',
    handler: () => {}
  }
]
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-ink-60">
      Use keyboard shortcuts to navigate faster through the application.
    </p>

    <div class="space-y-2">
      <div
        v-for="shortcut in shortcuts"
        :key="shortcut.key"
        class="flex items-center justify-between py-2 px-3 bg-ink-5 rounded-md"
      >
        <span class="text-sm text-ink-100">{{ shortcut.description }}</span>
        <kbd class="px-2 py-1 bg-white border border-ink-20 rounded text-xs font-mono text-ink-80">
          {{ formatShortcut(shortcut) }}
        </kbd>
      </div>
    </div>

    <div class="border-t border-ink-20 pt-4">
      <p class="text-xs text-ink-60">
        Pro tip: Press <kbd class="px-1 py-0.5 bg-ink-10 rounded text-xs">?</kbd> anytime to show this help.
      </p>
    </div>
  </div>
</template>