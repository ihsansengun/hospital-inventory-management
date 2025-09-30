import { onMounted, onUnmounted } from 'vue'

export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeydown = (event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const isCtrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !shortcut.ctrl
      const isMetaMatch = shortcut.meta ? event.metaKey : !shortcut.meta
      const isShiftMatch = shortcut.shift !== undefined ? (shortcut.shift === event.shiftKey) : true
      const isAltMatch = shortcut.alt !== undefined ? (shortcut.alt === event.altKey) : true

      // Handle both key and code for better compatibility
      const isKeyMatch = event.key === shortcut.key ||
                        event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                        (shortcut.key === '?' && event.key === '/' && event.shiftKey)

      if (isCtrlMatch && isMetaMatch && isShiftMatch && isAltMatch && isKeyMatch) {
        event.preventDefault()
        shortcut.handler()
        break
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    shortcuts
  }
}

export function useGlobalShortcuts() {
  const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0

  const formatShortcut = (shortcut: ShortcutConfig): string => {
    const keys: string[] = []

    if (shortcut.ctrl) keys.push(isMac ? '⌘' : 'Ctrl')
    if (shortcut.meta && !isMac) keys.push('Meta')
    if (shortcut.shift) keys.push('⇧')
    if (shortcut.alt) keys.push(isMac ? '⌥' : 'Alt')

    keys.push(shortcut.key.toUpperCase())

    return keys.join(isMac ? '' : '+')
  }

  return {
    formatShortcut
  }
}