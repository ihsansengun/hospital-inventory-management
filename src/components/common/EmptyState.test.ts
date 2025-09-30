import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from './EmptyState.vue'

describe('EmptyState Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(EmptyState)

    expect(wrapper.text()).toContain('No data found')
    expect(wrapper.text()).toContain('Get started by adding your first item')
  })

  it('renders with custom props', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Custom Title',
        message: 'Custom Message',
        actionText: 'Custom Action'
      }
    })

    expect(wrapper.text()).toContain('Custom Title')
    expect(wrapper.text()).toContain('Custom Message')
    expect(wrapper.text()).toContain('Custom Action')
  })

  it('shows action button when actionText is provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        actionText: 'Add Item'
      }
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Add Item')
  })

  it('hides action button when actionText is not provided', () => {
    const wrapper = mount(EmptyState)

    const button = wrapper.find('button')
    expect(button.exists()).toBe(false)
  })

  it('emits action event when button is clicked', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        actionText: 'Add Item'
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('action')
    expect(wrapper.emitted('action')).toHaveLength(1)
  })

  it('renders custom icon SVG path', () => {
    const customIcon = 'M12 4v16m8-8H4'
    const wrapper = mount(EmptyState, {
      props: {
        icon: customIcon
      }
    })

    const svg = wrapper.find('svg path')
    expect(svg.attributes('d')).toBe(customIcon)
  })

  it('applies correct styling classes', () => {
    const wrapper = mount(EmptyState)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
    expect(wrapper.find('.rounded-lg').exists()).toBe(true)
    expect(wrapper.find('.border-ink-20').exists()).toBe(true)
  })
})