import { ref, onMounted, onUnmounted } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mediaQuery: MediaQueryList | undefined

  const update = () => {
    if (mediaQuery) {
      matches.value = mediaQuery.matches
    }
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      mediaQuery = window.matchMedia(query)
      matches.value = mediaQuery.matches

      // Modern browsers support addEventListener
      mediaQuery.addEventListener('change', update)
    }
  })

  onUnmounted(() => {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', update)
    }
  })

  return matches
}

// Preset breakpoints matching Tailwind CSS defaults
export function useBreakpoints() {
  const isMobile = useMediaQuery('(max-width: 639px)')
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)')

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop
  }
}

// Helper to detect touch devices
export function useTouchDevice() {
  const isTouch = ref(false)

  onMounted(() => {
    isTouch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  return isTouch
}