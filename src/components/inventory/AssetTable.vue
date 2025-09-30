<script setup lang="ts" generic="T extends HospitalAsset">
import { ref, computed, watch } from 'vue'
import type { HospitalAsset } from '@/models/HospitalAsset'
import type { HospitalConfig } from '@/models/HospitalConfig'

interface Props {
  assets: T[]
  config: HospitalConfig
  loading?: boolean
  selectable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectable: false
})

const emit = defineEmits<{
  'row-select': [asset: T]
  'row-edit': [asset: T]
  'row-delete': [asset: T]
}>()

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(25) // Show 25 items per page for better performance

const totalPages = computed(() =>
  Math.ceil(props.assets.length / itemsPerPage.value)
)

const paginatedAssets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.assets.slice(start, end)
})

const goToPage = (page: number) => {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Reset to first page when assets change significantly
watch(() => props.assets.length, (newLength, oldLength) => {
  if (Math.abs(newLength - oldLength) > 50) {
    currentPage.value = 1
  }
})

const pageNumbers = computed(() => {
  const pages: number[] = []
  const maxPages = 7

  if (totalPages.value <= maxPages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    const start = Math.max(1, currentPage.value - 2)
    const end = Math.min(totalPages.value, currentPage.value + 2)

    if (start > 1) pages.push(1)
    if (start > 2) pages.push(-1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages.value - 1) pages.push(-1)
    if (end < totalPages.value) pages.push(totalPages.value)
  }

  return pages
})

const showExpiryDate = computed(() =>
  props.config.fields.some(f => f.key === 'expiryDate' && f.visible)
)
const showPrice = computed(() =>
  props.config.fields.some(f => f.key === 'purchasePrice' && f.visible)
)
const showDepartment = computed(() =>
  props.config.fields.some(f => f.key === 'department' && f.visible)
)

const getQuantityDisplay = (asset: T) => {
  const current = asset.get('quantity')
  const reorderPoint = asset.get('reorderPoint')
  const percentage = (current / reorderPoint) * 100

  let colorClass = 'text-optimal'
  let status = 'healthy'

  if (percentage <= 30) {
    colorClass = 'text-critical font-bold'
    status = 'critical'
  } else if (percentage < 100) {
    colorClass = 'text-essential font-semibold'
    status = 'low'
  }

  return {
    display: `${current} units`,
    percentage: Math.round(percentage),
    percentageText: `${Math.round(percentage)}%`,
    colorClass,
    status,
    reorderPoint
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-ink-20 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-ink-5 border-b border-ink-20">
          <tr>
            <th class="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink-60 font-medium w-[30%]">
              Equipment
            </th>
            <th class="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink-60 font-medium">
              Category
            </th>
            <th class="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink-60 font-medium">
              Stock Level
            </th>
            <th v-if="showExpiryDate" class="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink-60 font-medium">
              Expiry Date
            </th>
            <th v-if="showPrice" class="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink-60 font-medium">
              Price
            </th>
            <th v-if="showDepartment" class="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink-60 font-medium">
              Department
            </th>
            <th class="text-center px-4 py-3 text-xs uppercase tracking-wider text-ink-60 font-medium w-24">
              Actions
            </th>
          </tr>
        </thead>

        <tbody v-if="!loading" class="divide-y divide-ink-10">
          <tr
            v-for="asset in paginatedAssets"
            :key="asset.get('id')"
            :class="[
              'hover:bg-ink-5 transition-colors cursor-pointer group',
              asset.isCritical() ? 'bg-critical/5' : ''
            ]"
            data-cy="asset-row"
            @click="emit('row-select', asset)"
          >
            <td class="px-4 py-4">
              <div class="flex flex-col">
                <span class="font-medium text-sm text-ink-100">{{ asset.get('name') }}</span>
                <span class="text-xs text-ink-60 mt-0.5">{{ asset.get('manufacturer') }} · {{ asset.get('serialNumber') }}</span>
              </div>
            </td>

            <td class="px-4 py-4 text-sm text-ink-80">
              {{ asset.get('category') }}
            </td>

            <td class="px-4 py-4">
              <div class="flex flex-col gap-1.5">
                <div class="flex items-baseline gap-2">
                  <span :class="getQuantityDisplay(asset).colorClass" class="text-sm font-semibold">
                    {{ getQuantityDisplay(asset).display }}
                  </span>
                  <span class="text-xs text-ink-60">
                    ({{ getQuantityDisplay(asset).percentageText }} of target)
                  </span>
                </div>
                <div class="w-32 h-2 bg-ink-10 rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all duration-300"
                    :class="{
                      'bg-critical': getQuantityDisplay(asset).percentage <= 30,
                      'bg-essential': getQuantityDisplay(asset).percentage > 30 && getQuantityDisplay(asset).percentage < 100,
                      'bg-optimal': getQuantityDisplay(asset).percentage >= 100
                    }"
                    :style="{ width: Math.min(100, getQuantityDisplay(asset).percentage) + '%' }"
                  />
                </div>
              </div>
            </td>

            <td v-if="showExpiryDate" class="px-4 py-4 text-sm text-ink-80">
              {{ asset.get('expiryDate') ? new Date(asset.get('expiryDate')!).toLocaleDateString('en-GB') : 'N/A' }}
            </td>
            <td v-if="showPrice" class="px-4 py-4 text-sm font-mono text-ink-80">
              {{ asset.getCustomField('purchasePrice') ? asset.getDisplayValue('purchasePrice') : 'N/A' }}
            </td>
            <td v-if="showDepartment" class="px-4 py-4 text-sm text-ink-80">
              {{ asset.getCustomField('department') || 'N/A' }}
            </td>

            <!-- Actions -->
            <td class="px-4 py-4">
              <div class="flex gap-2 justify-center">
                <button
                  @click.stop="emit('row-edit', asset)"
                  data-cy="edit-btn"
                  class="p-2 bg-white border border-ink-20 rounded-lg text-ink-60 hover:bg-ink-5 hover:text-ink-100 hover:border-ink-40 transition-all duration-200"
                  aria-label="Edit asset"
                  title="Edit"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  @click.stop="emit('row-delete', asset)"
                  data-cy="delete-btn"
                  class="p-2 bg-white border border-ink-20 rounded-lg text-ink-60 hover:bg-critical/5 hover:text-critical hover:border-critical/30 transition-all duration-200"
                  aria-label="Delete asset"
                  title="Delete"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td :colspan="4 + (showExpiryDate ? 1 : 0) + (showPrice ? 1 : 0) + (showDepartment ? 1 : 0)" class="px-4 py-8 text-center text-ink-60">
              <div class="inline-flex items-center">
                <svg class="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading assets...
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="assets.length === 0 && !loading" class="px-4 py-8 text-center">
      <svg class="mx-auto h-12 w-12 text-ink-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
      <p class="mt-2 text-sm text-ink-60">No assets found</p>
    </div>

    <!-- Pagination Controls -->
    <div v-if="assets.length > 0 && totalPages > 1" class="px-4 py-3 bg-ink-5 border-t border-ink-20">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <!-- Results info -->
        <div class="text-xs sm:text-sm text-ink-60 text-center sm:text-left">
          Showing <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, assets.length) }}</span> of <span class="font-medium">{{ assets.length }}</span>
        </div>

        <!-- Page navigation -->
        <div class="flex items-center justify-center space-x-1">
          <!-- Previous button -->
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="p-1.5 sm:px-3 sm:py-1 text-sm rounded-md transition-colors"
            :class="currentPage === 1
              ? 'text-ink-40 cursor-not-allowed'
              : 'text-ink-80 hover:bg-white hover:border-ink-20 border border-transparent'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <!-- Page numbers - show fewer on mobile -->
          <div class="flex items-center space-x-1">
            <!-- Mobile: Show current page info -->
            <div class="sm:hidden text-sm text-ink-80 font-medium px-2">
              {{ currentPage }} / {{ totalPages }}
            </div>

            <!-- Desktop: Show page buttons -->
            <div class="hidden sm:flex items-center space-x-1">
              <template v-for="page in pageNumbers" :key="`page-${page}`">
                <span v-if="page === -1" class="px-1 text-ink-40">•••</span>
                <button
                  v-else
                  @click="goToPage(page)"
                  class="min-w-[32px] px-2 py-1 text-sm rounded-md transition-colors"
                  :class="page === currentPage
                    ? 'bg-ink-100 text-white font-medium'
                    : 'text-ink-80 hover:bg-white hover:border-ink-20 border border-transparent'"
                >
                  {{ page }}
                </button>
              </template>
            </div>
          </div>

          <!-- Next button -->
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="p-1.5 sm:px-3 sm:py-1 text-sm rounded-md transition-colors"
            :class="currentPage === totalPages
              ? 'text-ink-40 cursor-not-allowed'
              : 'text-ink-80 hover:bg-white hover:border-ink-20 border border-transparent'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>