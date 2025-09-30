<script setup lang="ts">
interface Props {
  type?: 'text' | 'card' | 'table' | 'stat'
  count?: number
  height?: string
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  count: 1,
  height: '20px'
})
</script>

<template>
  <div class="animate-pulse">
    <!-- Text Skeleton -->
    <template v-if="type === 'text'">
      <div
        v-for="i in count"
        :key="i"
        class="bg-ink-20 rounded mb-2"
        :style="{ height }"
      />
    </template>

    <!-- Card Skeleton -->
    <template v-else-if="type === 'card'">
      <div
        v-for="i in count"
        :key="i"
        class="bg-white rounded-lg shadow-sm p-4 mb-3"
      >
        <div class="h-6 bg-ink-20 rounded mb-3 w-3/4" />
        <div class="h-4 bg-ink-20 rounded mb-2" />
        <div class="h-4 bg-ink-20 rounded w-2/3" />
      </div>
    </template>

    <!-- Table Skeleton -->
    <template v-else-if="type === 'table'">
      <div class="bg-white rounded-lg shadow-sm">
        <div class="p-4 border-b border-ink-10">
          <div class="h-4 bg-ink-20 rounded w-1/4" />
        </div>
        <div
          v-for="i in count"
          :key="i"
          class="p-4 border-b border-ink-10 flex space-x-4"
        >
          <div class="h-4 bg-ink-20 rounded flex-1" />
          <div class="h-4 bg-ink-20 rounded flex-1" />
          <div class="h-4 bg-ink-20 rounded flex-1" />
          <div class="h-4 bg-ink-20 rounded w-24" />
        </div>
      </div>
    </template>

    <!-- Statistics Skeleton -->
    <template v-else-if="type === 'stat'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-white rounded-lg shadow-sm p-4"
        >
          <div class="h-4 bg-ink-20 rounded mb-2 w-2/3" />
          <div class="h-8 bg-ink-20 rounded w-1/2" />
        </div>
      </div>
    </template>
  </div>
</template>