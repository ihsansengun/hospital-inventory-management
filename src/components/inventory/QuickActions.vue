<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAssetStore } from '@/stores/assets'
import { useToast } from '@/composables/useToast'

const assetStore = useAssetStore()
const toast = useToast()

const emit = defineEmits<{
  'add-asset': []
  'export-data': []
  'import-data': []
}>()

const showDropdown = ref(false)

const quickStats = computed(() => [
  {
    label: 'Critical',
    count: assetStore.criticalAssets.length,
    color: 'text-critical',
    bgColor: 'bg-critical/10',
    isActive: assetStore.activeFilter === 'critical',
    action: () => {
      if (assetStore.activeFilter === 'critical') {
        assetStore.setActiveFilter('all')
        toast.info('Showing all items')
      } else {
        assetStore.setActiveFilter('critical')
        toast.info('Showing critical items only')
      }
    }
  },
  {
    label: 'Low Stock',
    count: assetStore.lowStockAssets.length,
    color: 'text-essential',
    bgColor: 'bg-essential/10',
    isActive: assetStore.activeFilter === 'lowStock',
    action: () => {
      if (assetStore.activeFilter === 'lowStock') {
        assetStore.setActiveFilter('all')
        toast.info('Showing all items')
      } else {
        assetStore.setActiveFilter('lowStock')
        toast.info('Showing low stock items only')
      }
    }
  }
])

function exportToCSV() {
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
  showDropdown.value = false
}

function generateReport() {
  const report = {
    date: new Date().toISOString(),
    totalAssets: assetStore.statistics.totalAssets,
    totalValue: assetStore.statistics.totalValue,
    criticalCount: assetStore.statistics.criticalCount,
    lowStockCount: assetStore.statistics.lowStockCount,
    categories: assetStore.categories.map(cat => ({
      name: cat,
      count: assetStore.assets.filter(a => a.get('category') === cat).length
    }))
  }

  console.log('Inventory Report:', report)
  toast.info('Report generated in console')
  showDropdown.value = false
}

async function refreshData() {
  await assetStore.refreshData()
  toast.success('Data refreshed')
}
</script>

<template>
  <div class="bg-white rounded-lg border border-ink-20 p-3 md:p-4 mb-4 md:mb-6">
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
      <!-- Quick Stats -->
      <div class="flex gap-2 sm:gap-3 flex-1">
        <button
          v-for="stat in quickStats"
          :key="stat.label"
          @click="stat.action"
          :class="[
            stat.isActive ? 'ring-2 ring-offset-1' : '',
            stat.bgColor,
            stat.color,
            stat.isActive && stat.label === 'Critical' ? 'ring-critical' : '',
            stat.isActive && stat.label === 'Low Stock' ? 'ring-essential' : ''
          ]"
          class="flex-1 sm:flex-initial px-2 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium hover:opacity-80 transition-all min-h-[44px] sm:min-h-0 flex items-center justify-center"
        >
          <span class="sm:hidden">{{ stat.count }}</span>
          <span class="hidden sm:inline">{{ stat.label }}: {{ stat.count }}</span>
          <span class="sm:hidden ml-1 text-[10px]">{{ stat.label }}</span>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 justify-end">
        <button
          @click="refreshData"
          class="p-2 text-ink-60 hover:bg-ink-5 rounded-md transition-colors"
          title="Refresh data"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>

        <div class="relative">
          <button
            @click="showDropdown = !showDropdown"
            class="p-2 text-ink-60 hover:bg-ink-5 rounded-md transition-colors"
            title="More actions"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
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
              v-if="showDropdown"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-ink-20 z-10"
            >
              <button
                @click="exportToCSV"
                class="w-full text-left px-4 py-2 text-sm text-ink-100 hover:bg-ink-5 transition-colors"
              >
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                  </svg>
                  Export to CSV
                </div>
              </button>

              <button
                @click="generateReport"
                class="w-full text-left px-4 py-2 text-sm text-ink-100 hover:bg-ink-5 transition-colors"
              >
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m-3 2h18M10 8h4v2h-4V8z"/>
                  </svg>
                  Generate Report
                </div>
              </button>

              <div class="border-t border-ink-20">
                <button
                  @click="emit('import-data')"
                  class="w-full text-left px-4 py-2 text-sm text-ink-100 hover:bg-ink-5 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    Import Data
                  </div>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>