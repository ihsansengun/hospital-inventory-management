import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AssetRepository } from '@/repositories/AssetRepository'
import { HospitalAsset } from '@/models/HospitalAsset'
import type { AssetData } from '@/models/Asset'
import { useAuthStore } from './auth'
import { MedicalDataGenerator } from '@/fixtures/generators'

export const useAssetStore = defineStore('assets', () => {
  const assets = ref<HospitalAsset[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const selectedCategory = ref<string | null>(null)
  const sortBy = ref<'name' | 'quantity' | 'category'>('name')
  const sortDirection = ref<'asc' | 'desc'>('asc')

  const repository = AssetRepository.getInstance()

  const activeFilter = ref<'all' | 'critical' | 'lowStock'>('all')

  const filteredAssets = computed(() => {
    let result = [...assets.value]

    // Apply special filters first
    if (activeFilter.value === 'critical') {
      result = result.filter(asset => asset.isCritical())
    } else if (activeFilter.value === 'lowStock') {
      result = result.filter(asset => asset.isLowStock())
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(asset =>
        asset.get('name').toLowerCase().includes(query) ||
        asset.get('serialNumber').toLowerCase().includes(query) ||
        asset.get('manufacturer').toLowerCase().includes(query)
      )
    }

    if (selectedCategory.value) {
      result = result.filter(asset =>
        asset.get('category') === selectedCategory.value
      )
    }

    result.sort((a, b) => {
      const aVal = a.get(sortBy.value)
      const bVal = b.get(sortBy.value)
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return sortDirection.value === 'asc' ? comparison : -comparison
    })

    return result
  })

  const criticalAssets = computed(() =>
    assets.value.filter(a => a.isCritical())
  )

  const lowStockAssets = computed(() =>
    assets.value.filter(a => a.isLowStock())
  )

  const totalValue = computed(() =>
    assets.value.reduce((sum, asset) => {
      const quantity = asset.get('quantity')
      const price = asset.getCustomField('purchasePrice') || 0
      return sum + (quantity * price)
    }, 0)
  )

  const categories = computed(() => {
    const cats = new Set(assets.value.map(a => a.get('category')))
    return Array.from(cats).sort()
  })

  const statistics = computed(() => ({
    totalAssets: assets.value.length,
    totalValue: totalValue.value,
    criticalCount: criticalAssets.value.length,
    lowStockCount: lowStockAssets.value.length,
    categoriesCount: categories.value.length
  }))

  async function loadAssets(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      let data = await repository.findAll()

      // Validate loaded data
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received')
      }

      // If no data exists, generate sample data
      if (data.length === 0) {
        console.log('No data found, generating sample data...')
        const authStore = useAuthStore()
        const hospitalId = authStore.currentUser?.hospitalId || 'hospital-1'
        const config = MedicalDataGenerator.getHospitalConfigs()[hospitalId] || MedicalDataGenerator.getDefaultConfig()

        // Generate 500 sample assets to demonstrate performance optimizations
        // This shows the need for virtual scrolling and other optimizations
        const sampleAssets = MedicalDataGenerator.generateBatchForHospital(500, hospitalId, config)
        const batchSize = 50

        for (let i = 0; i < sampleAssets.length; i += batchSize) {
          const batch = sampleAssets.slice(i, i + batchSize)
          await Promise.all(batch.map(asset => repository.save(asset)))
        }

        // Fetch the saved data
        data = await repository.findAll()
        console.log(`Generated ${data.length} sample assets for ${hospitalId}`)
      }

      assets.value = data
    } catch (e) {
      console.error('Error loading assets:', e)
      const errorMessage = e instanceof Error ? e.message : 'Failed to load assets'
      error.value = errorMessage

      // Return empty array on error to prevent app crash
      assets.value = []
    } finally {
      loading.value = false
    }
  }

  async function createAsset(asset: HospitalAsset): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Validate asset before saving
      if (!asset.validate()) {
        const errors = asset.getErrors()
        error.value = `Validation failed: ${Object.entries(errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ')}`
        return
      }

      await repository.save(asset)
      assets.value.push(asset)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to create asset'
      error.value = errorMessage
      console.error('Error creating asset:', e)
    } finally {
      loading.value = false
    }
  }

  async function updateAsset(id: string, updates: Record<string, unknown>): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const asset = await repository.findById(id)
      if (!asset) {
        error.value = `Asset with ID ${id} not found`
        return
      }

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (key.startsWith('custom_')) {
          asset.setCustomField(key.replace('custom_', ''), value)
        } else if (key === 'location') {
          // Handle HospitalAsset-specific properties
          (asset as any).data.location = value
        } else if (key === 'condition') {
          (asset as any).data.condition = value
        } else if (key in (asset as any).data) {
          asset.set(key as keyof AssetData, value as any)
        }
      })

      // Validate before saving
      if (!asset.validate()) {
        const errors = asset.getErrors()
        error.value = `Validation failed: ${Object.entries(errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ')}`
        return
      }

      await repository.save(asset)

      const index = assets.value.findIndex(a => a.get('id') === id)
      if (index !== -1) {
        assets.value[index] = asset
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update asset'
      console.error('Error updating asset:', e)
    } finally {
      loading.value = false
    }
  }

  async function deleteAsset(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const success = await repository.delete(id)
      if (!success) {
        error.value = 'Failed to delete asset'
        return
      }

      const index = assets.value.findIndex(a => a.get('id') === id)
      if (index !== -1) {
        assets.value.splice(index, 1)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete asset'
      console.error('Error deleting asset:', e)
    } finally {
      loading.value = false
    }
  }

  function setSearchQuery(query: string): void {
    searchQuery.value = query
  }

  function setCategory(category: string | null): void {
    selectedCategory.value = category
  }


  function clearFilters(): void {
    searchQuery.value = ''
    selectedCategory.value = null
    activeFilter.value = 'all'
  }

  function clearSearch(): void {
    searchQuery.value = ''
    selectedCategory.value = null
  }

  function setActiveFilter(filter: 'all' | 'critical' | 'lowStock'): void {
    activeFilter.value = filter
  }

  function exportToCSV(): string {
    const headers = ['Name', 'Manufacturer', 'Category', 'Quantity', 'Serial Number', 'Critical Level', 'Reorder Point', 'Location']
    const rows = assets.value.map(asset => [
      asset.get('name'),
      asset.get('manufacturer'),
      asset.get('category'),
      asset.get('quantity'),
      asset.get('serialNumber'),
      asset.get('criticalLevel'),
      asset.get('reorderPoint'),
      asset.getLocation?.() || asset.getCustomField?.('location') || 'N/A'
    ])

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
  }

  async function refreshData(): Promise<void> {
    await loadAssets()
  }

  return {
    assets,
    loading,
    error,
    searchQuery,
    selectedCategory,
    sortBy,
    sortDirection,
    activeFilter,
    filteredAssets,
    criticalAssets,
    lowStockAssets,
    totalValue,
    categories,
    statistics,
    loadAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    setSearchQuery,
    setCategory,
    setActiveFilter,
    clearFilters,
    clearSearch,
    exportToCSV,
    refreshData
  }
})