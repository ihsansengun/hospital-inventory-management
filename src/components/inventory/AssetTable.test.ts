import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import AssetTable from './AssetTable.vue'
import { HospitalAsset } from '@/models/HospitalAsset'
import type { HospitalConfig } from '@/models/HospitalConfig'

describe('AssetTable Component', () => {
  let wrapper: VueWrapper<any>
  let mockAssets: HospitalAsset[]
  let mockConfig: HospitalConfig

  beforeEach(() => {
    // Create mock assets
    mockAssets = []
    for (let i = 1; i <= 50; i++) {
      const asset = new HospitalAsset({
        id: `asset-${i}`,
        name: `Asset ${i}`,
        manufacturer: `Manufacturer ${i}`,
        category: 'Medical Supplies',
        quantity: i * 10,
        serialNumber: `SN-${String(i).padStart(6, '0')}`,
        reorderPoint: 20,
        criticalLevel: 6,
        location: `Room ${i}`,
        condition: 'New'
      })
      mockAssets.push(asset)
    }

    // Create mock config
    mockConfig = {
      hospitalId: 'hospital-1',
      hospitalName: 'St Thomas Hospital',
      fields: [
        { key: 'name', label: 'Name', visible: true, required: true },
        { key: 'manufacturer', label: 'Manufacturer', visible: true, required: true },
        { key: 'category', label: 'Category', visible: true, required: true },
        { key: 'quantity', label: 'Quantity', visible: true, required: true },
        { key: 'serialNumber', label: 'Serial Number', visible: true, required: true },
        { key: 'expiryDate', label: 'Expiry Date', visible: false, required: false },
        { key: 'purchasePrice', label: 'Price', visible: false, required: false },
        { key: 'department', label: 'Department', visible: false, required: false }
      ],
      categories: ['Medical Supplies', 'Surgical Instruments', 'Diagnostic Equipment']
    }
  })

  describe('Rendering', () => {
    it('should render the table with correct headers', () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets,
          config: mockConfig
        }
      })

      const headers = wrapper.findAll('th')
      expect(headers.length).toBeGreaterThan(0)
      expect(headers[0].text()).toContain('Equipment')
      expect(headers[1].text()).toContain('Category')
      expect(headers[2].text()).toContain('Stock Level')
    })

    it('should not show optional columns when not configured', () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets,
          config: mockConfig
        }
      })

      const headers = wrapper.findAll('th')
      const headerTexts = headers.map(h => h.text())
      expect(headerTexts).not.toContain('Expiry Date')
      expect(headerTexts).not.toContain('Price')
      expect(headerTexts).not.toContain('Department')
    })

    it('should show optional columns when configured', () => {
      // Enable optional fields
      mockConfig.fields.find(f => f.key === 'expiryDate')!.visible = true
      mockConfig.fields.find(f => f.key === 'purchasePrice')!.visible = true
      mockConfig.fields.find(f => f.key === 'department')!.visible = true

      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets,
          config: mockConfig
        }
      })

      const headers = wrapper.findAll('th')
      const headerTexts = headers.map(h => h.text())
      expect(headerTexts).toContain('Expiry Date')
      expect(headerTexts).toContain('Price')
      expect(headerTexts).toContain('Department')
    })
  })

  describe('Pagination', () => {
    it('should show only 25 items per page', () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets,
          config: mockConfig
        }
      })

      const rows = wrapper.findAll('tbody tr[data-cy="asset-row"]')
      expect(rows.length).toBe(25)
    })

    it('should show pagination controls when more than 25 items', () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets,
          config: mockConfig
        }
      })

      const paginationInfo = wrapper.find('.text-xs.sm\\:text-sm.text-ink-60')
      expect(paginationInfo.exists()).toBe(true)
      expect(paginationInfo.text()).toContain('Showing')
      expect(paginationInfo.text()).toContain('1-25')
      expect(paginationInfo.text()).toContain('of 50')
    })

    it('should navigate to next page when next button clicked', async () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets,
          config: mockConfig
        }
      })

      // Find and click next button
      const nextButton = wrapper.findAll('button').find(btn =>
        btn.html().includes('M9 5l7 7-7 7')
      )
      expect(nextButton).toBeDefined()
      await nextButton?.trigger('click')

      // Check that page 2 data is shown
      const paginationInfo = wrapper.find('.text-xs.sm\\:text-sm.text-ink-60')
      expect(paginationInfo.text()).toContain('26-50')
    })

    it('should disable previous button on first page', () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets,
          config: mockConfig
        }
      })

      const prevButton = wrapper.findAll('button').find(btn =>
        btn.html().includes('M15 19l-7-7 7-7')
      )
      expect(prevButton?.classes()).toContain('cursor-not-allowed')
    })

    it('should not show pagination for less than 25 items', () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets.slice(0, 20),
          config: mockConfig
        }
      })

      const paginationDiv = wrapper.find('.px-4.py-3.bg-ink-5.border-t.border-ink-20')
      expect(paginationDiv.exists()).toBe(false)
    })
  })

  describe('Events', () => {
    it('should emit row-select when row is clicked', async () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets,
          config: mockConfig
        }
      })

      const firstRow = wrapper.find('tbody tr[data-cy="asset-row"]')
      await firstRow.trigger('click')

      expect(wrapper.emitted('row-select')).toBeTruthy()
      expect(wrapper.emitted('row-select')![0][0]).toStrictEqual(mockAssets[0])
    })

    it('should emit row-edit when edit button is clicked', async () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets,
          config: mockConfig
        }
      })

      const editButton = wrapper.find('button[data-cy="edit-btn"]')
      await editButton.trigger('click')

      expect(wrapper.emitted('row-edit')).toBeTruthy()
      expect(wrapper.emitted('row-edit')![0][0]).toStrictEqual(mockAssets[0])
    })

    it('should emit row-delete when delete button is clicked', async () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets,
          config: mockConfig
        }
      })

      const deleteButton = wrapper.find('button[data-cy="delete-btn"]')
      await deleteButton.trigger('click')

      expect(wrapper.emitted('row-delete')).toBeTruthy()
      expect(wrapper.emitted('row-delete')![0][0]).toStrictEqual(mockAssets[0])
    })
  })

  describe('Stock Level Display', () => {
    it('should show critical status for low stock items', () => {
      const criticalAsset = new HospitalAsset({
        id: 'critical-1',
        name: 'Critical Asset',
        manufacturer: 'Test',
        category: 'Medical Supplies',
        quantity: 3,
        serialNumber: 'SN-000001',
        reorderPoint: 10,
        criticalLevel: 3,
        location: 'Room 1',
        condition: 'New'
      })

      wrapper = mount(AssetTable, {
        props: {
          assets: [criticalAsset],
          config: mockConfig
        }
      })

      const row = wrapper.find('tbody tr[data-cy="asset-row"]')
      expect(row.classes()).toContain('bg-critical/5')

      const stockText = row.find('.text-critical')
      expect(stockText.exists()).toBe(true)
    })

    it('should show progress bar for stock levels', () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: mockAssets.slice(0, 1),
          config: mockConfig
        }
      })

      const progressBar = wrapper.find('.w-32.h-2.bg-ink-10.rounded-full')
      expect(progressBar.exists()).toBe(true)

      const progressFill = progressBar.find('div')
      expect(progressFill.exists()).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when loading prop is true', () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: [],
          config: mockConfig,
          loading: true
        }
      })

      const loadingRow = wrapper.find('.animate-spin')
      expect(loadingRow.exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading assets...')
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no assets', () => {
      wrapper = mount(AssetTable, {
        props: {
          assets: [],
          config: mockConfig,
          loading: false
        }
      })

      expect(wrapper.text()).toContain('No assets found')
    })
  })
})