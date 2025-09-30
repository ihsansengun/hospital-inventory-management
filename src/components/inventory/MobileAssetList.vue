<script setup lang="ts" generic="T extends HospitalAsset">
import { ref } from 'vue'
import type { HospitalAsset } from '@/models/HospitalAsset'
import type { HospitalConfig } from '@/models/HospitalConfig'

interface Props {
  assets: T[]
  config: HospitalConfig
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'asset-select': [asset: T]
  'asset-edit': [asset: T]
  'asset-delete': [asset: T]
}>()

const expandedCards = ref<Set<string>>(new Set())

function toggleCard(assetId: string) {
  if (expandedCards.value.has(assetId)) {
    expandedCards.value.delete(assetId)
  } else {
    expandedCards.value.add(assetId)
  }
  expandedCards.value = new Set(expandedCards.value)
}

function isExpanded(assetId: string) {
  return expandedCards.value.has(assetId)
}

const getStatusBadge = (asset: T) => {
  if (asset.isCritical()) {
    return { text: 'Critical', class: 'bg-critical text-white' }
  }
  if (asset.isLowStock()) {
    return { text: 'Low Stock', class: 'bg-essential text-ink-100' }
  }
  return { text: 'Optimal', class: 'bg-optimal text-white' }
}

const getCriticalityColor = (level: string) => {
  switch (level) {
    case 'critical': return 'border-critical'
    case 'essential': return 'border-essential'
    case 'routine': return 'border-routine'
    default: return 'border-ink-20'
  }
}
</script>

<template>
  <div class="space-y-3 px-3 py-2">
    <!-- Mobile Asset Cards -->
    <div
      v-for="asset in assets"
      :key="asset.get('id')"
      :class="[
        'bg-white rounded-lg border-2 shadow-sm transition-all',
        getCriticalityColor(asset.get('criticalLevel'))
      ]"
    >
      <!-- Card Header - Always Visible -->
      <div
        @click="toggleCard(asset.get('id'))"
        class="p-4 cursor-pointer"
        role="button"
        tabindex="0"
        :aria-expanded="isExpanded(asset.get('id'))"
        :aria-label="`View details for ${asset.get('name')}`"
        @keydown.enter="toggleCard(asset.get('id'))"
        @keydown.space.prevent="toggleCard(asset.get('id'))"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-ink-100 text-base truncate">
              {{ asset.get('name') }}
            </h3>
            <p class="text-sm text-ink-60">
              {{ asset.get('manufacturer') }}
            </p>
          </div>
          <span
            :class="getStatusBadge(asset).class"
            class="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2"
          >
            {{ getStatusBadge(asset).text }}
          </span>
        </div>

        <!-- Key Metrics Row -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center space-x-4">
            <div>
              <span class="text-ink-60">Stock:</span>
              <span class="font-semibold text-ink-100 ml-1">
                {{ asset.get('quantity') }}
              </span>
            </div>
            <div>
              <span class="text-ink-60">Category:</span>
              <span class="font-medium text-ink-100 ml-1">
                {{ asset.get('category') }}
              </span>
            </div>
          </div>

          <!-- Expand/Collapse Indicator -->
          <svg
            :class="{ 'rotate-180': isExpanded(asset.get('id')) }"
            class="w-5 h-5 text-ink-40 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>

      <!-- Expandable Details -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="max-h-0 opacity-0"
        enter-to-class="max-h-96 opacity-100"
        leave-from-class="max-h-96 opacity-100"
        leave-to-class="max-h-0 opacity-0"
      >
        <div
          v-if="isExpanded(asset.get('id'))"
          class="border-t border-ink-20 overflow-hidden"
        >
          <!-- Additional Details -->
          <div class="p-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-ink-60">Serial Number:</span>
              <span class="font-mono text-ink-100">{{ asset.get('serialNumber') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-60">Reorder Point:</span>
              <span class="text-ink-100">{{ asset.get('reorderPoint') }}</span>
            </div>
            <div v-if="asset.getLocation?.() || asset.getCustomField('location')" class="flex justify-between">
              <span class="text-ink-60">Location:</span>
              <span class="text-ink-100">{{ asset.getLocation?.() || asset.getCustomField('location') }}</span>
            </div>
            <div v-if="asset.getCustomField('purchasePrice')" class="flex justify-between">
              <span class="text-ink-60">Unit Price:</span>
              <span class="font-medium text-ink-100">
                £{{ asset.getCustomField('purchasePrice')?.toLocaleString('en-GB') }}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex border-t border-ink-20">
            <button
              @click.stop="emit('asset-select', asset)"
              class="flex-1 py-3 text-sm font-medium text-ink-80 hover:bg-ink-5 transition-colors"
              :aria-label="`View details for ${asset.get('name')}`"
            >
              View Details
            </button>
            <button
              @click.stop="emit('asset-edit', asset)"
              class="flex-1 py-3 text-sm font-medium text-ink-80 hover:bg-ink-5 transition-colors border-l border-r border-ink-20"
              :aria-label="`Edit ${asset.get('name')}`"
            >
              Edit
            </button>
            <button
              @click.stop="emit('asset-delete', asset)"
              class="flex-1 py-3 text-sm font-medium text-critical hover:bg-critical/10 transition-colors"
              :aria-label="`Delete ${asset.get('name')}`"
            >
              Delete
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Empty State -->
    <div
      v-if="assets.length === 0 && !loading"
      class="text-center py-12"
    >
      <svg class="w-16 h-16 mx-auto text-ink-40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
      <p class="text-ink-60">No assets found</p>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-critical mx-auto mb-4"></div>
      <p class="text-ink-60">Loading assets...</p>
    </div>
  </div>
</template>