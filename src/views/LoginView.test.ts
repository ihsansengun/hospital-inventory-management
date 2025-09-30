import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import LoginView from './LoginView.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}))

describe('LoginView Component', () => {
  let wrapper: VueWrapper<any>
  let mockPush: ReturnType<typeof vi.fn>
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    // Mock router
    mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush
    } as any)

    // Mount component with testing pinia
    wrapper = mount(LoginView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false
          })
        ]
      }
    })

    authStore = useAuthStore()
  })

  describe('Component Rendering', () => {
    it('should render login form', () => {
      expect(wrapper.find('h1').text()).toContain('Hospital Inventory')
      expect(wrapper.find('p').text()).toContain('Sign in to manage medical assets')
    })

    it('should render username and password fields', () => {
      const usernameInput = wrapper.find('input[data-cy="username"]')
      const passwordInput = wrapper.find('input[data-cy="password"]')

      expect(usernameInput.exists()).toBe(true)
      expect(passwordInput.exists()).toBe(true)
      expect(passwordInput.attributes('type')).toBe('password')
    })

    it('should render test credentials section', () => {
      expect(wrapper.text()).toContain('Test Credentials')

      // Check for St Thomas' test user
      expect(wrapper.text()).toContain('Dr. Sarah Johnson')
      expect(wrapper.text()).toContain('St Thomas\' Hospital')
      expect(wrapper.text()).toContain('thomas')
      expect(wrapper.text()).toContain('thomas123')

      // Check for King's College test user
      expect(wrapper.text()).toContain('Dr. Michael Chen')
      expect(wrapper.text()).toContain('King\'s College Hospital')
      expect(wrapper.text()).toContain('kings')
      expect(wrapper.text()).toContain('kings123')
    })

    it('should show hospital-specific configuration hints', () => {
      expect(wrapper.text()).toContain('Basic view: Name, Manufacturer, Category, Quantity, Serial Number')
      expect(wrapper.text()).toContain('Extended view: + Price, Expiry Date, Department')
    })
  })

  describe('Form Validation', () => {
    it('should disable submit button when form is empty', () => {
      const submitButton = wrapper.find('button[data-cy="login-btn"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should enable submit button when form is filled', async () => {
      const usernameInput = wrapper.find('input[data-cy="username"]')
      const passwordInput = wrapper.find('input[data-cy="password"]')

      await usernameInput.setValue('thomas')
      await passwordInput.setValue('thomas123')

      const submitButton = wrapper.find('button[data-cy="login-btn"]')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('Test User Selection', () => {
    it('should populate form when St Thomas test user is clicked', async () => {
      const testUserButtons = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Dr. Sarah Johnson')
      )

      expect(testUserButtons.length).toBe(1)
      await testUserButtons[0].trigger('click')

      const usernameInput = wrapper.find('input[data-cy="username"]') as any
      const passwordInput = wrapper.find('input[data-cy="password"]') as any

      expect(usernameInput.element.value).toBe('thomas')
      expect(passwordInput.element.value).toBe('thomas123')
    })

    it('should populate form when Kings College test user is clicked', async () => {
      const testUserButtons = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Dr. Michael Chen')
      )

      expect(testUserButtons.length).toBe(1)
      await testUserButtons[0].trigger('click')

      const usernameInput = wrapper.find('input[data-cy="username"]') as any
      const passwordInput = wrapper.find('input[data-cy="password"]') as any

      expect(usernameInput.element.value).toBe('kings')
      expect(passwordInput.element.value).toBe('kings123')
    })

    it('should hide test credentials after selection', async () => {
      // Initially visible
      expect(wrapper.text()).toContain('Test Credentials')

      // Click a test user
      const testUserButton = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Dr. Sarah Johnson')
      )[0]

      await testUserButton.trigger('click')

      // Should be hidden after selection
      expect(wrapper.find('p').text()).not.toContain('Test Credentials')
    })
  })

  describe('Login Process', () => {
    it('should call auth store login with correct credentials', async () => {
      // Mock successful login
      authStore.login = vi.fn().mockResolvedValue(true)

      const usernameInput = wrapper.find('input[data-cy="username"]')
      const passwordInput = wrapper.find('input[data-cy="password"]')

      await usernameInput.setValue('thomas')
      await passwordInput.setValue('thomas123')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      expect(authStore.login).toHaveBeenCalledWith('thomas', 'thomas123')
    })

    it('should redirect to inventory on successful login', async () => {
      // Mock successful login
      authStore.login = vi.fn().mockResolvedValue(true)

      const usernameInput = wrapper.find('input[data-cy="username"]')
      const passwordInput = wrapper.find('input[data-cy="password"]')

      await usernameInput.setValue('thomas')
      await passwordInput.setValue('thomas123')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      // Wait for async operations
      await wrapper.vm.$nextTick()

      expect(mockPush).toHaveBeenCalledWith('/inventory')
    })

    it('should show error message on failed login', async () => {
      // Mock failed login
      authStore.login = vi.fn().mockResolvedValue(false)

      const usernameInput = wrapper.find('input[data-cy="username"]')
      const passwordInput = wrapper.find('input[data-cy="password"]')

      await usernameInput.setValue('wrong')
      await passwordInput.setValue('credentials')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Invalid username or password')
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should show loading state during login', async () => {
      // Mock slow login
      authStore.login = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(true), 100))
      )

      const usernameInput = wrapper.find('input[data-cy="username"]')
      const passwordInput = wrapper.find('input[data-cy="password"]')

      await usernameInput.setValue('thomas')
      await passwordInput.setValue('thomas123')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      // Check loading state
      const submitButton = wrapper.find('button[data-cy="login-btn"]')
      expect(submitButton.text()).toContain('Signing in...')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should handle login errors gracefully', async () => {
      // Mock login error
      authStore.login = vi.fn().mockRejectedValue(new Error('Network error'))

      const usernameInput = wrapper.find('input[data-cy="username"]')
      const passwordInput = wrapper.find('input[data-cy="password"]')

      await usernameInput.setValue('thomas')
      await passwordInput.setValue('thomas123')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('An error occurred during login')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const usernameLabel = wrapper.find('label[for="username"]')
      const passwordLabel = wrapper.find('label[for="password"]')

      expect(usernameLabel.text()).toContain('Username')
      expect(passwordLabel.text()).toContain('Password')
    })

    it('should have proper autocomplete attributes', () => {
      const usernameInput = wrapper.find('input[data-cy="username"]')
      const passwordInput = wrapper.find('input[data-cy="password"]')

      expect(usernameInput.attributes('autocomplete')).toBe('username')
      expect(passwordInput.attributes('autocomplete')).toBe('current-password')
    })
  })
})