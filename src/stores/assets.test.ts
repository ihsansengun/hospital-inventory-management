import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAssetStore } from './assets'
import { AssetRepository } from '@/repositories/AssetRepository'
import { HospitalAsset } from '@/models/HospitalAsset'
import { MedicalDataGenerator } from '@/fixtures/generators'

// Mock the auth store
vi.mock('./auth', () => ({
  useAuthStore: () => ({
    currentUser: { hospitalId: 'hospital-1' }
  })
}))

// Mock the repository
vi.mock('@/repositories/AssetRepository', () => ({
  AssetRepository: {
    getInstance: vi.fn()
  }
}))

describe('Assets Store', () => {
  let store: ReturnType<typeof useAssetStore>
  let mockRepository: any
  const testConfig = MedicalDataGenerator.getDefaultConfig()

  beforeEach(() => {
    setActivePinia(createPinia())

    // Reset and setup mock repository
    mockRepository = {
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      count: vi.fn(),
      search: vi.fn(),
      findByCategory: vi.fn(),
      findByCriticalLevel: vi.fn(),
      findLowStock: vi.fn(),
      getTotalValue: vi.fn(),
      bulkSave: vi.fn()
    }

    vi.mocked(AssetRepository.getInstance).mockReturnValue(mockRepository)
    store = useAssetStore()
  })

  describe('loading assets', () => {
    it('should load all assets', async () => {
      const mockAssets = [
        new HospitalAsset({
          id: '1',
          name: 'Ventilator',
          manufacturer: 'MedTech',
          category: 'Life Support',
          quantity: 5,
          serialNumber: 'LS-123456'
        }, testConfig),
        new HospitalAsset({
          id: '2',
          name: 'X-Ray Machine',
          manufacturer: 'Global Medical',
          category: 'Diagnostic',
          quantity: 3,
          serialNumber: 'DG-123456'
        }, testConfig)
      ]

      mockRepository.findAll.mockResolvedValue(mockAssets)

      await store.loadAssets()

      expect(store.assets).toHaveLength(2)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle loading errors', async () => {
      const error = new Error('Failed to load assets')
      mockRepository.findAll.mockRejectedValue(error)

      await store.loadAssets()

      expect(store.error).toBe('Failed to load assets')
      expect(store.loading).toBe(false)
      expect(store.assets).toHaveLength(0)
    })

    it('should set loading state during load', async () => {
      mockRepository.findAll.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      )

      const loadPromise = store.loadAssets()
      expect(store.loading).toBe(true)

      await loadPromise
      expect(store.loading).toBe(false)
    })
  })

  describe('creating assets', () => {
    it('should create a new asset', async () => {
      const newAsset = new HospitalAsset({
        id: '1',
        name: 'New Equipment',
        manufacturer: 'MedTech',
        category: 'Diagnostic',
        quantity: 10,
        serialNumber: 'NE-123456'
      }, testConfig)

      mockRepository.save.mockResolvedValue(newAsset)

      await store.createAsset(newAsset)

      expect(store.assets).toHaveLength(1)
      expect(store.assets[0]?.get('id')).toBe('1')
      expect(store.assets[0]?.get('name')).toBe('New Equipment')
      expect(mockRepository.save).toHaveBeenCalledWith(newAsset)
    })

    it('should handle create errors', async () => {
      const newAsset = new HospitalAsset({
        id: '1',
        name: 'New Equipment',
        manufacturer: 'MedTech',
        category: 'Diagnostic',
        quantity: 10,
        serialNumber: 'NE-123456'
      }, testConfig)

      mockRepository.save.mockRejectedValue(new Error('Save failed'))

      await store.createAsset(newAsset)
      expect(store.error).toBe('Save failed')
      expect(store.assets).toHaveLength(0)
    })
  })

  describe('updating assets', () => {
    beforeEach(async () => {
      const mockAsset = new HospitalAsset({
        id: '1',
        name: 'Original Name',
        manufacturer: 'MedTech',
        category: 'Diagnostic',
        quantity: 5,
        serialNumber: 'LS-123456'
      }, testConfig)

      store.assets = [mockAsset]
    })

    it('should update an existing asset', async () => {
      const updatedAsset = new HospitalAsset({
        id: '1',
        name: 'Updated Name',
        manufacturer: 'MedTech',
        category: 'Diagnostic',
        quantity: 10,
        serialNumber: 'LS-123456'
      }, testConfig)

      mockRepository.findById.mockResolvedValue(updatedAsset)
      mockRepository.save.mockResolvedValue(updatedAsset)

      await store.updateAsset('1', { name: 'Updated Name', quantity: 10 })

      expect(mockRepository.save).toHaveBeenCalled()
      expect(store.assets[0]?.get('id')).toBe('1')
    })

    it('should handle update errors', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await store.updateAsset('1', { name: 'Updated' })
      expect(store.error).toBe('Asset with ID 1 not found')
    })
  })

  describe('deleting assets', () => {
    beforeEach(async () => {
      const mockAssets = [
        new HospitalAsset({
          id: '1',
          name: 'Asset 1',
          manufacturer: 'MedTech',
          category: 'Diagnostic',
          quantity: 5,
          serialNumber: 'A1-123456'
        }, testConfig),
        new HospitalAsset({
          id: '2',
          name: 'Asset 2',
          manufacturer: 'MedTech',
          category: 'Surgical',
          quantity: 3,
          serialNumber: 'A2-123456'
        }, testConfig)
      ]

      store.assets = mockAssets
    })

    it('should delete an asset', async () => {
      mockRepository.delete.mockResolvedValue(true)

      await store.deleteAsset('1')

      expect(store.assets).toHaveLength(1)
      expect(store.assets[0]?.get('id')).toBe('2')
      expect(mockRepository.delete).toHaveBeenCalledWith('1')
    })

    it('should handle delete errors', async () => {
      mockRepository.delete.mockResolvedValue(false)

      await store.deleteAsset('1')
      expect(store.error).toBe('Failed to delete asset')
      expect(store.assets).toHaveLength(2)
    })
  })

  describe('filtering', () => {
    beforeEach(async () => {
      const mockAssets = [
        new HospitalAsset({
          id: '1',
          name: 'Ventilator',
          manufacturer: 'MedTech',
          category: 'Life Support',
          quantity: 2,
          reorderPoint: 3,
          criticalLevel: 'critical',
          serialNumber: 'LS-123456'
        }, testConfig),
        new HospitalAsset({
          id: '2',
          name: 'X-Ray Machine',
          manufacturer: 'Global',
          category: 'Diagnostic',
          quantity: 5,
          reorderPoint: 1,
          criticalLevel: 'essential',
          serialNumber: 'DG-123456'
        }, testConfig)
      ]

      store.assets = mockAssets
    })

    it('should filter by search query', () => {
      store.searchQuery = 'Ventilator'
      const filtered = store.filteredAssets

      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.get('name')).toBe('Ventilator')
    })

    it('should filter by category', () => {
      store.selectedCategory = 'Life Support'
      const filtered = store.filteredAssets

      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.get('name')).toBe('Ventilator')
    })

    it('should clear filters', () => {
      store.selectedCategory = 'Life Support'
      expect(store.filteredAssets).toHaveLength(1)

      store.clearSearch()
      expect(store.searchQuery).toBe('')
      expect(store.selectedCategory).toBeNull()
    })
  })

  describe('sorting', () => {
    beforeEach(async () => {
      const mockAssets = [
        new HospitalAsset({
          id: '1',
          name: 'Zebra Equipment',
          manufacturer: 'MedTech',
          category: 'Diagnostic',
          quantity: 10,
          serialNumber: 'ZE-123456'
        }, testConfig),
        new HospitalAsset({
          id: '2',
          name: 'Alpha Equipment',
          manufacturer: 'Global',
          category: 'Surgical',
          quantity: 5,
          serialNumber: 'AE-123456'
        }, testConfig)
      ]

      store.assets = mockAssets
    })

    it('should sort by name ascending', () => {
      store.sortBy = 'name'
      store.sortDirection = 'asc'

      const sorted = store.filteredAssets
      expect(sorted[0]?.get('name')).toBe('Alpha Equipment')
      expect(sorted[1]?.get('name')).toBe('Zebra Equipment')
    })

    it('should sort by name descending', () => {
      store.sortBy = 'name'
      store.sortDirection = 'desc'

      const sorted = store.filteredAssets
      expect(sorted[0]?.get('name')).toBe('Zebra Equipment')
      expect(sorted[1]?.get('name')).toBe('Alpha Equipment')
    })

    it('should sort by quantity', () => {
      store.sortBy = 'quantity'
      store.sortDirection = 'asc'

      const sorted = store.filteredAssets
      expect(sorted[0]?.get('quantity')).toBe(5)
      expect(sorted[1]?.get('quantity')).toBe(10)
    })
  })

  describe('computed statistics', () => {
    beforeEach(async () => {
      const mockAssets = [
        new HospitalAsset({
          id: '1',
          name: 'Asset 1',
          manufacturer: 'MedTech',
          category: 'Life Support',
          quantity: 2,
          reorderPoint: 3,
          criticalLevel: 'critical',
          serialNumber: 'A1-123456',
          customFields: { purchasePrice: 1000 }
        }, testConfig),
        new HospitalAsset({
          id: '2',
          name: 'Asset 2',
          manufacturer: 'Global',
          category: 'Diagnostic',
          quantity: 5,
          reorderPoint: 1,
          criticalLevel: 'essential',
          serialNumber: 'A2-123456',
          customFields: { purchasePrice: 500 }
        }, testConfig)
      ]

      store.assets = mockAssets
    })

    it('should calculate total assets', () => {
      expect(store.statistics.totalAssets).toBe(2)
    })

    it('should count low stock items', () => {
      expect(store.statistics.lowStockCount).toBe(1)
    })

    it('should count critical items', () => {
      expect(store.statistics.criticalCount).toBe(1)
    })

    it('should calculate total value', () => {
      // Asset 1: 2 * 1000 = 2000
      // Asset 2: 5 * 500 = 2500
      // Total: 4500
      expect(store.statistics.totalValue).toBe(4500)
    })

    it('should list unique categories', () => {
      expect(store.categories).toHaveLength(2)
      expect(store.categories).toContain('Life Support')
      expect(store.categories).toContain('Diagnostic')
    })
  })

  describe('export functionality', () => {
    beforeEach(async () => {
      const mockAssets = [
        new HospitalAsset({
          id: '1',
          name: 'Test Equipment',
          manufacturer: 'MedTech',
          category: 'Diagnostic',
          quantity: 5,
          serialNumber: 'TE-123456'
        }, testConfig)
      ]

      store.assets = mockAssets
    })

    it('should export to CSV', () => {
      const csv = store.exportToCSV()

      expect(csv).toContain('Name,Manufacturer,Category,Quantity,Serial Number,Critical Level,Reorder Point,Location')
      expect(csv).toContain('"Test Equipment","MedTech","Diagnostic","5","TE-123456"')
    })
  })
})