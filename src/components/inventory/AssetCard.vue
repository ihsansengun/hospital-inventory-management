<script setup lang="ts">
import type { HospitalAsset } from '@/models/HospitalAsset'

interface Props {
  asset: HospitalAsset
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [asset: HospitalAsset]
  delete: [asset: HospitalAsset]
  select: [asset: HospitalAsset]
}>()

const getStatusColor = () => {
  const level = props.asset.get('criticalLevel')
  switch (level) {
    case 'critical': return 'border-critical bg-critical/5'
    case 'essential': return 'border-essential bg-essential/5'
    case 'routine': return 'border-routine bg-routine/5'
    default: return 'border-ink-20'
  }
}

const getStockStatus = () => {
  if (props.asset.isCritical()) {
    return { class: 'bg-critical text-white', text: 'Critical' }
  }
  if (props.asset.isLowStock()) {
    return { class: 'bg-essential text-white', text: 'Low Stock' }
  }
  return { class: 'bg-optimal text-white', text: 'In Stock' }
}
</script>

<template>
  <div
    :class="[
      'bg-white rounded-lg border-2 p-4 hover:shadow-lg transition-all cursor-pointer',
      getStatusColor()
    ]"
    @click="emit('select', asset)"
  >
    <!-- Header -->
    <div class="flex justify-between items-start mb-3">
      <div class="flex-1">
        <h3 class="font-medium text-ink-100 text-sm line-clamp-1">
          {{ asset.get('name') }}
        </h3>
        <p class="text-xs text-ink-60 mt-1">
          {{ asset.get('manufacturer') }}
        </p>
      </div>
      <span
        :class="getStockStatus().class"
        class="px-2 py-1 rounded-full text-xs font-medium"
      >
        {{ getStockStatus().text }}
      </span>
    </div>

    <!-- Details Grid -->
    <div class="grid grid-cols-2 gap-2 text-xs mb-3">
      <div>
        <span class="text-ink-60">Category:</span>
        <p class="font-medium text-ink-100">{{ asset.get('category') }}</p>
      </div>
      <div>
        <span class="text-ink-60">Serial:</span>
        <p class="font-mono text-ink-100">{{ asset.get('serialNumber') }}</p>
      </div>
      <div>
        <span class="text-ink-60">Quantity:</span>
        <p class="font-medium text-ink-100">{{ asset.get('quantity') }} units</p>
      </div>
      <div>
        <span class="text-ink-60">Location:</span>
        <p class="font-medium text-ink-100">{{ asset.getLocation?.() || asset.getCustomField?.('location') || 'N/A' }}</p>
      </div>
    </div>

    <!-- Stock Bar -->
    <div class="mb-3">
      <div class="flex justify-between text-xs text-ink-60 mb-1">
        <span>Stock Level</span>
        <span>{{ asset.get('quantity') }} units (Reorder: {{ asset.get('reorderPoint') }})</span>
      </div>
      <div class="h-2 bg-ink-10 rounded-full overflow-hidden">
        <div
          :class="{
            'bg-critical': asset.isCritical(),
            'bg-essential': asset.isLowStock(),
            'bg-optimal': !asset.isLowStock() && !asset.isCritical()
          }"
          :style="{
            width: `${Math.min((asset.get('quantity') / Math.max(asset.get('reorderPoint') * 2, asset.get('quantity'))) * 100, 100)}%`
          }"
          class="h-full transition-all"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        @click.stop="emit('edit', asset)"
        class="flex-1 px-3 py-1.5 text-xs bg-ink-5 text-ink-80 rounded hover:bg-ink-10 transition-colors"
      >
        Edit
      </button>
      <button
        @click.stop="emit('delete', asset)"
        class="px-3 py-1.5 text-xs bg-critical/10 text-critical rounded hover:bg-critical/20 transition-colors"
      >
        Delete
      </button>
    </div>
  </div>
</template>