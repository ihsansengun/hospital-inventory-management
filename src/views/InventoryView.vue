<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAssetStore } from '@/stores/assets'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useKeyboardShortcuts, useGlobalShortcuts } from '@/composables/useKeyboardShortcuts'
import { useBreakpoints } from '@/composables/useMediaQuery'
import { useDebouncedRef } from '@/composables/usePerformance'
import AssetTable from '@/components/inventory/AssetTable.vue'
import AssetCard from '@/components/inventory/AssetCard.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import AssetForm from '@/components/inventory/AssetForm.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import KeyboardShortcutsHelp from '@/components/common/KeyboardShortcutsHelp.vue'
import { HospitalAsset } from '@/models/HospitalAsset'
import type { HospitalAssetData } from '@/models/HospitalAsset'

const assetStore = useAssetStore()
const authStore = useAuthStore()
const toast = useToast()
const { isMobile } = useBreakpoints()

// Debounce search input by 300ms to improve performance with large datasets
const searchTerm = useDebouncedRef('', 300)
const showAssetModal = ref(false)
const showShortcutsModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const selectedAsset = ref<HospitalAsset | null>(null)
const viewMode = ref<'table' | 'card'>('table')
// Pagination is now used for performance optimization with large datasets
const searchInputRef = ref<HTMLInputElement>()
const showActionsDropdown = ref(false)

onMounted(async () => {
  await assetStore.loadAssets()
})


// Keyboard shortcuts
useGlobalShortcuts()

useKeyboardShortcuts([
  {
    key: 'k',
    ctrl: true,
    handler: () => {
      searchInputRef.value?.focus()
      searchInputRef.value?.select()
    },
    description: 'Focus search'
  },
  {
    key: 'n',
    ctrl: true,
    handler: () => openAddModal(),
    description: 'New asset'
  },
  {
    key: 'Escape',
    handler: () => {
      showAssetModal.value = false
      showShortcutsModal.value = false
    },
    description: 'Close modal'
  },
  {
    key: 'v',
    ctrl: true,
    shift: true,
    handler: () => {
      viewMode.value = viewMode.value === 'table' ? 'card' : 'table'
      toast.info(`Switched to ${viewMode.value} view`)
    },
    description: 'Toggle view'
  },
  {
    key: '?',
    handler: () => {
      showShortcutsModal.value = true
    },
    description: 'Show keyboard shortcuts'
  }
])

const hospitalConfig = computed(() => authStore.getHospitalConfig())

// Filtered assets update automatically when search/filters change
const filteredAssets = computed(() => {
  // Always update the search query in the store, even when empty
  assetStore.setSearchQuery(searchTerm.value)
  return assetStore.filteredAssets
})

const selectedCategory = computed({
  get: () => assetStore.selectedCategory,
  set: (val) => assetStore.setCategory(val)
})

function openAddModal(): void {
  modalMode.value = 'create'
  selectedAsset.value = null
  showAssetModal.value = true
}

function handleEdit(asset: HospitalAsset): void {
  modalMode.value = 'edit'
  selectedAsset.value = asset
  showAssetModal.value = true
}

async function handleDelete(asset: HospitalAsset): Promise<void> {
  if (confirm(`Are you sure you want to delete ${asset.get('name')}?`)) {
    try {
      await assetStore.deleteAsset(asset.get('id'))
      toast.success('Asset deleted successfully')
    } catch (error) {
      toast.error('Failed to delete asset')
    }
  }
}

async function handleFormSubmit(data: Partial<HospitalAssetData>): Promise<void> {
  try {
    if (modalMode.value === 'create') {
      const newAsset = new HospitalAsset(data, hospitalConfig.value)
      await assetStore.createAsset(newAsset)
      toast.success('Asset added successfully')
    } else if (selectedAsset.value) {
      await assetStore.updateAsset(selectedAsset.value.get('id'), data)
      toast.success('Asset updated successfully')
    }
    showAssetModal.value = false
  } catch (error) {
    toast.error(modalMode.value === 'create' ? 'Failed to add asset' : 'Failed to update asset')
  }
}

function handleSelect(asset: HospitalAsset): void {
  console.log('Selected asset:', asset.get('id'))
}

function clearFilters(): void {
  searchTerm.value = ''
  assetStore.clearFilters()
}

// Format large currency values for compact display (e.g., 1.5M, 250K)
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toFixed(0)
}

function exportToCSV(): void {
  const headers = ['Name', 'Manufacturer', 'Category', 'Quantity', 'Serial Number', 'Status']
  const rows = assetStore.assets.map(asset => [
    asset.get('name'),
    asset.get('manufacturer'),
    asset.get('category'),
    asset.get('quantity'),
    asset.get('serialNumber'),
    asset.isLowStock() ? 'Low Stock' : 'In Stock'
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)

  toast.success('Data exported successfully')
  showActionsDropdown.value = false
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <!-- Enhanced Header Section -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-2 text-sm text-ink-60 mb-2">
              <span>Dashboard</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="text-ink-100">Inventory</span>
            </div>
            <h2 class="text-2xl font-display font-bold text-ink-100 mb-1">Medical Equipment & Supplies</h2>
            <p class="text-ink-60">{{ assetStore.assets.length }} total items across {{ assetStore.categories.length }} categories</p>
          </div>

        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <!-- Critical Items - HIGHEST Priority -->
        <div class="bg-white rounded-lg border border-ink-20 p-3 md:p-4 relative overflow-hidden"
             :class="{ 'ring-2 ring-critical/30': assetStore.statistics.criticalCount > 0 }">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-[10px] md:text-xs uppercase tracking-wider text-critical font-semibold truncate">Critical</p>
              <p class="text-2xl md:text-3xl font-bold text-critical mt-0.5 md:mt-1">
                {{ assetStore.statistics.criticalCount }}
              </p>
              <p class="text-[10px] md:text-xs text-ink-60">need immediate attention</p>
            </div>
            <div class="w-10 h-10 md:w-12 md:h-12 bg-critical/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 md:w-6 md:h-6 text-critical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Low Stock - Second Priority -->
        <div class="bg-white rounded-lg border border-ink-20 p-3 md:p-4">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-[10px] md:text-xs uppercase tracking-wider text-essential font-semibold truncate">Low Stock</p>
              <p class="text-2xl md:text-3xl font-bold text-essential mt-0.5 md:mt-1">
                {{ assetStore.statistics.lowStockCount }}
              </p>
              <p class="text-[10px] md:text-xs text-ink-60">need reordering soon</p>
            </div>
            <div class="w-10 h-10 md:w-12 md:h-12 bg-essential/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 md:w-6 md:h-6 text-essential" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Total Assets - Neutral Info -->
        <div class="bg-white rounded-lg border border-ink-20 p-3 md:p-4">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-[10px] md:text-xs uppercase tracking-wider text-ink-60 font-medium truncate">Total Assets</p>
              <p class="text-xl md:text-2xl font-bold text-ink-100 mt-0.5 md:mt-1">
                {{ assetStore.statistics.totalAssets.toLocaleString('en-GB') }}
              </p>
              <p class="text-[10px] md:text-xs text-ink-60">in inventory</p>
            </div>
            <div class="w-8 h-8 lg:w-10 lg:h-10 bg-ink-5 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 lg:w-5 lg:h-5 text-ink-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Total Value - Least Important -->
        <div class="bg-white rounded-lg border border-ink-20 p-3 md:p-4">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-[10px] md:text-xs uppercase tracking-wider text-ink-60 font-medium truncate">Total Value</p>
              <p class="text-xl md:text-2xl font-bold text-ink-100 mt-0.5 md:mt-1">
                £{{ formatCurrency(assetStore.statistics.totalValue) }}
              </p>
              <p class="text-[10px] md:text-xs text-ink-60">estimated</p>
            </div>
            <div class="w-8 h-8 lg:w-10 lg:h-10 bg-ink-5 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 lg:w-5 lg:h-5 text-ink-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Unified Control Bar (Sticky) -->
      <div class="sticky top-[56px] sm:top-[64px] z-30 -mx-6 px-6 py-3 mb-6 bg-ink-5">
        <div class="bg-white rounded-lg border border-ink-20 shadow-sm p-3">
          <!-- Single Row Layout -->
          <div class="flex flex-wrap lg:flex-nowrap gap-3 items-center">
            <!-- Search Input -->
            <div class="flex-1 min-w-[280px] max-w-lg">
              <div class="relative">
                <input
                  ref="searchInputRef"
                  v-model="searchTerm"
                  type="text"
                  data-cy="search"
                  placeholder="Search inventory..."
                  class="w-full pl-9 pr-9 py-2 border border-ink-20 rounded-md focus:outline-none focus:ring-2 focus:ring-critical/20 focus:border-critical text-sm"
                />
                <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <button
                  v-if="searchTerm"
                  @click="searchTerm = ''"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-ink-10 text-ink-40 hover:text-ink-60 transition-colors"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="h-8 w-px bg-ink-20 hidden lg:block"></div>

            <!-- Category Filter (moved to left) -->
            <select
              v-model="selectedCategory"
              class="px-3 py-2 border border-ink-20 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-critical/20 focus:border-critical"
            >
              <option :value="null">All Categories</option>
              <option v-for="cat in assetStore.categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>

            <div class="h-8 w-px bg-ink-20 hidden lg:block"></div>

            <!-- Simplified Status Filters (no All button) -->
            <div class="flex items-center gap-2">
              <button
                @click="assetStore.setActiveFilter(assetStore.activeFilter === 'critical' ? 'all' : 'critical')"
                :class="[
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5',
                  assetStore.activeFilter === 'critical'
                    ? 'bg-critical text-white'
                    : 'bg-white border-2 border-critical text-critical hover:bg-critical/5'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                Critical
                <span class="px-1.5 py-0.5 text-xs font-bold rounded"
                      :class="assetStore.activeFilter === 'critical' ? 'bg-white/20' : 'bg-critical/20'">
                  {{ assetStore.criticalAssets.length }}
                </span>
              </button>
              <button
                @click="assetStore.setActiveFilter(assetStore.activeFilter === 'lowStock' ? 'all' : 'lowStock')"
                :class="[
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5',
                  assetStore.activeFilter === 'lowStock'
                    ? 'bg-essential text-white'
                    : 'bg-white border-2 border-essential text-essential hover:bg-essential/5'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                </svg>
                Low Stock
                <span class="px-1.5 py-0.5 text-xs font-bold rounded"
                      :class="assetStore.activeFilter === 'lowStock' ? 'bg-white/20' : 'bg-essential/20'">
                  {{ assetStore.lowStockAssets.length }}
                </span>
              </button>
            </div>

            <!-- Spacer to push actions to the right -->
            <div class="flex-1 hidden lg:block"></div>

            <!-- View Toggle -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-ink-60 font-medium">View:</span>
              <div class="inline-flex bg-ink-5 rounded-md p-0.5">
                <button
                  @click="viewMode = 'table'"
                  :class="[
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    viewMode === 'table' ? 'bg-white text-ink-100 shadow-sm' : 'text-ink-60 hover:text-ink-80'
                  ]"
                >
                  Table
                </button>
                <button
                  @click="viewMode = 'card'"
                  :class="[
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    viewMode === 'card' ? 'bg-white text-ink-100 shadow-sm' : 'text-ink-60 hover:text-ink-80'
                  ]"
                >
                  Cards
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <!-- Export as primary action -->
              <button
                @click="exportToCSV"
                class="px-3 py-2 bg-white border border-ink-20 text-ink-80 rounded-md hover:bg-ink-5 transition-colors text-sm font-medium inline-flex items-center gap-1.5"
                title="Export to CSV"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                </svg>
                <span class="hidden sm:inline">Export</span>
              </button>

              <button
                @click="openAddModal"
                data-cy="add-asset-btn"
                class="px-3 py-2 bg-ink-100 text-white rounded-md hover:bg-ink-80 transition-colors text-sm font-medium inline-flex items-center gap-1.5"
                :title="!isMobile ? 'Add new asset (⌘N)' : ''"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                <span class="hidden sm:inline">Add Asset</span>
              </button>

              <!-- Simplified Actions Dropdown -->
              <div class="relative">
                <button
                  @click="showActionsDropdown = !showActionsDropdown"
                  class="p-2 border border-ink-20 text-ink-60 rounded-md hover:bg-ink-5 transition-colors"
                  title="More actions"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/>
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <Transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <div
                    v-if="showActionsDropdown"
                    class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-ink-20 z-50"
                  >
                    <button
                      @click="assetStore.refreshData(); toast.success('Data refreshed'); showActionsDropdown = false"
                      class="w-full text-left px-4 py-2 text-sm text-ink-100 hover:bg-ink-5 transition-colors flex items-center gap-2 rounded-t-lg"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Refresh Data
                    </button>

                    <button
                      @click="clearFilters(); showActionsDropdown = false"
                      class="w-full text-left px-4 py-2 text-sm text-ink-100 hover:bg-ink-5 transition-colors flex items-center gap-2 rounded-b-lg"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      Clear All Filters
                    </button>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assets Display -->
      <div v-if="filteredAssets.length === 0 && !assetStore.loading">
        <EmptyState
          title="No assets found"
          :message="searchTerm || selectedCategory ? 'Try adjusting your filters' : 'Start by adding your first medical asset'"
          :action-text="!searchTerm && !selectedCategory ? 'Add Asset' : undefined"
          @action="openAddModal"
        />
      </div>

      <!-- Table View with Pagination for Performance -->
      <AssetTable
        v-if="viewMode === 'table' && filteredAssets.length > 0"
        :assets="(filteredAssets as any)"
        :config="hospitalConfig"
        :loading="assetStore.loading"
        @row-edit="handleEdit"
        @row-delete="handleDelete"
        @row-select="handleSelect"
      />

      <!-- Card View -->
      <div v-else-if="viewMode === 'card' && filteredAssets.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AssetCard
          v-for="asset in filteredAssets"
          :key="asset.get('id')"
          :asset="asset as HospitalAsset"
          @edit="handleEdit"
          @delete="handleDelete"
          @select="handleSelect"
        />
      </div>

    <!-- Asset Modal -->
    <BaseModal
      v-model="showAssetModal"
      :title="modalMode === 'create' ? 'Add New Asset' : 'Edit Asset'"
      size="xl"
    >
      <AssetForm
        :asset="selectedAsset as HospitalAsset | null"
        :mode="modalMode"
        :config="hospitalConfig"
        @submit="handleFormSubmit"
        @cancel="showAssetModal = false"
      />
      <template #footer>
        <!-- Footer is handled by AssetForm -->
      </template>
    </BaseModal>

    <!-- Keyboard Shortcuts Modal -->
    <BaseModal
      :modelValue="showShortcutsModal"
      @update:modelValue="showShortcutsModal = $event"
      title="Keyboard Shortcuts"
      size="md"
    >
      <KeyboardShortcutsHelp />
      <template #footer>
        <button
          @click="showShortcutsModal = false"
          class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          Got it
        </button>
      </template>
    </BaseModal>

    <!-- Toast Container -->
    <ToastContainer />
    </div> <!-- End max-w-7xl mx-auto -->
  </AppLayout>
</template>