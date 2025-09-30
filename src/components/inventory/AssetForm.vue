<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { HospitalAsset } from '@/models/HospitalAsset'
import type { HospitalAssetData } from '@/models/HospitalAsset'
import type { HospitalConfig } from '@/models/HospitalConfig'

interface Props {
  asset?: HospitalAsset | null
  mode: 'create' | 'edit'
  config?: HospitalConfig
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: Partial<HospitalAssetData>]
  cancel: []
}>()

const formData = ref<Partial<HospitalAssetData & { reorderPoint?: number; department?: string; expiryDate?: Date | string | undefined }>>({
  name: '',
  manufacturer: '',
  category: 'Medical Supplies',
  quantity: 0,
  reorderPoint: 10,
  serialNumber: '',
  location: '',
  department: '',
  condition: 'New',
  purchasePrice: 0,
  expiryDate: undefined
})

const errors = ref<Record<string, string>>({})

const categories = [
  'Life Support',
  'Diagnostic Equipment',
  'Surgical Instruments',
  'Patient Monitoring',
  'Medical Supplies'
]

const conditions = ['New', 'Good', 'Fair', 'Maintenance Required'] as const

const departments = [
  'Emergency',
  'ICU',
  'Surgery',
  'Radiology',
  'Laboratory',
  'Pharmacy',
  'Pediatrics',
  'Cardiology',
  'Oncology',
  'Orthopedics',
  'Maternity',
  'General Ward'
] as const

// Expiry date only shown for hospitals that have it configured (King's College)
const showExpiryDate = computed(() => {
  // First check if this hospital has expiry date field enabled
  const configAllows = props.config?.fields.some(f => f.key === 'expiryDate' && f.visible) ?? false
  if (!configAllows) return false

  // If config allows, show for Medical Supplies or if already has value
  return props.mode === 'edit' ||
         formData.value.expiryDate ||
         formData.value.category === 'Medical Supplies' ||
         formData.value.category === 'Pharmacy'
})

// Check if price and department should be shown based on config
const showPrice = computed(() =>
  props.config?.fields.some(f => f.key === 'purchasePrice' && f.visible) ?? false
)
const showDepartment = computed(() =>
  props.config?.fields.some(f => f.key === 'department' && f.visible) ?? false
)

const isExpiryRequired = computed(() => {
  return formData.value.category === 'Medical Supplies'
})

// Load asset data in edit mode
watch(() => props.asset, (newAsset) => {
  if (newAsset && props.mode === 'edit') {
    const hospitalAsset = newAsset as HospitalAsset
    formData.value = {
      name: hospitalAsset.get('name'),
      manufacturer: hospitalAsset.get('manufacturer'),
      category: hospitalAsset.get('category'),
      quantity: hospitalAsset.get('quantity'),
      reorderPoint: hospitalAsset.get('reorderPoint'),
      serialNumber: hospitalAsset.get('serialNumber'),
      location: hospitalAsset.getLocation() || '',
      department: hospitalAsset.getCustomField('department') || '',
      condition: hospitalAsset.getCondition() || 'New',
      purchasePrice: hospitalAsset.getCustomField('purchasePrice') || 0,
      expiryDate: hospitalAsset.get('expiryDate') ? hospitalAsset.get('expiryDate') : undefined
    }
  }
}, { immediate: true })

// Auto-generate serial numbers to ensure uniqueness and prevent input errors
// Format: XX-000000 (category prefix + 6 random digits)
watch(() => formData.value.category, (category) => {
  if (category && props.mode === 'create' && !formData.value.serialNumber) {
    const prefix = category.substring(0, 2).toUpperCase()
    const numbers = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
    formData.value.serialNumber = `${prefix}-${numbers}`
  }
})

// Generate serial number on mount for create mode
onMounted(() => {
  if (props.mode === 'create' && formData.value.category && !formData.value.serialNumber) {
    const prefix = formData.value.category.substring(0, 2).toUpperCase()
    const numbers = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
    formData.value.serialNumber = `${prefix}-${numbers}`
  }
})

function validate(): boolean {
  errors.value = {}

  if (!formData.value.name?.trim()) {
    errors.value.name = 'Name is required'
  }

  if (!formData.value.manufacturer?.trim()) {
    errors.value.manufacturer = 'Manufacturer is required'
  }

  if (!formData.value.serialNumber?.match(/^[A-Z]{2}-\d{6}$/)) {
    errors.value.serialNumber = 'Invalid format'
  }

  if ((formData.value.quantity || 0) < 0) {
    errors.value.quantity = 'Cannot be negative'
  }

  if ((formData.value.reorderPoint || 0) < 0) {
    errors.value.reorderPoint = 'Cannot be negative'
  }

  // Validate expiry date for Medical Supplies
  if (formData.value.category === 'Medical Supplies' && !formData.value.expiryDate) {
    errors.value.expiryDate = 'Required for medical supplies'
  }

  if (formData.value.expiryDate) {
    const expiryDate = new Date(formData.value.expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (expiryDate <= today) {
      errors.value.expiryDate = 'Must be in the future'
    }
  }

  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (validate()) {
    emit('submit', formData.value)
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Clean Header -->
    <div class="pb-4 border-b border-ink-10">
      <h3 class="text-lg font-semibold text-ink-100">
        {{ mode === 'create' ? 'Add New Asset' : 'Edit Asset Details' }}
      </h3>
      <p class="text-sm text-ink-60 mt-1">Fields marked with * are required</p>
    </div>

    <!-- Required Fields Section -->
    <div class="space-y-4">
      <h4 class="text-sm font-semibold text-ink-80 uppercase tracking-wider">Required Information</h4>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Equipment Name -->
        <div>
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Equipment Name <span class="text-critical font-bold">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            class="w-full px-3 py-2.5 border rounded-lg bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-critical/20 focus:border-critical"
            :class="errors.name ? 'border-critical bg-critical/5' : 'border-ink-20 hover:border-ink-40'"
            placeholder="e.g., Ventilator Model X200"
          />
          <p v-if="errors.name" class="mt-1 text-xs text-critical">{{ errors.name }}</p>
        </div>

        <!-- Manufacturer -->
        <div>
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Manufacturer <span class="text-critical font-bold">*</span>
          </label>
          <input
            v-model="formData.manufacturer"
            type="text"
            class="w-full px-3 py-2.5 border rounded-lg bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-critical/20 focus:border-critical"
            :class="errors.manufacturer ? 'border-critical bg-critical/5' : 'border-ink-20 hover:border-ink-40'"
            placeholder="e.g., MedTech Solutions"
          />
          <p v-if="errors.manufacturer" class="mt-1 text-xs text-critical">{{ errors.manufacturer }}</p>
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Category <span class="text-critical font-bold">*</span>
          </label>
          <select
            v-model="formData.category"
            class="w-full px-3 py-2.5 border rounded-lg bg-white appearance-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-critical/20 focus:border-critical cursor-pointer"
            :class="errors.category ? 'border-critical bg-critical/5' : 'border-ink-20 hover:border-ink-40'"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Serial Number - Auto-generated and locked to prevent duplicates -->
        <div>
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Serial Number <span class="text-critical font-bold">*</span>
            <span class="text-xs text-ink-60 font-normal">(auto-generated)</span>
          </label>
          <div class="relative">
            <input
              v-model="formData.serialNumber"
              type="text"
              class="w-full px-3 py-2.5 pl-10 border rounded-lg font-mono text-sm bg-ink-10 text-ink-60 cursor-not-allowed"
              :class="errors.serialNumber ? 'border-critical bg-critical/5' : 'border-ink-20'"
              readonly
              disabled
            />
            <!-- Lock icon clearly indicates read-only field -->
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p v-if="errors.serialNumber" class="mt-1 text-xs text-critical">{{ errors.serialNumber }}</p>
        </div>

      </div>

      <!-- Expiry Date (conditional) - separate row -->
      <div v-if="showExpiryDate" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Expiry Date
            <span v-if="isExpiryRequired" class="text-critical font-bold">*</span>
          </label>
          <input
            v-model="formData.expiryDate"
            type="date"
            class="w-full px-3 py-2.5 border rounded-lg bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-critical/20 focus:border-critical"
            :class="errors.expiryDate ? 'border-critical bg-critical/5' : 'border-ink-20 hover:border-ink-40'"
            :min="new Date().toISOString().split('T')[0]"
          />
          <p v-if="errors.expiryDate" class="mt-1 text-xs text-critical">{{ errors.expiryDate }}</p>
        </div>
        <div><!-- Placeholder for grid alignment --></div>
      </div>
    </div>

    <!-- Stock Information -->
    <div class="space-y-4">
      <h4 class="text-sm font-semibold text-ink-80 uppercase tracking-wider">Stock Levels</h4>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Current Quantity
          </label>
          <input
            v-model.number="formData.quantity"
            type="number"
            min="0"
            class="w-full px-3 py-2.5 border rounded-lg bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-optimal/20 focus:border-optimal"
            :class="errors.quantity ? 'border-critical bg-critical/5' : 'border-ink-20 hover:border-ink-40'"
          />
          <p v-if="errors.quantity" class="mt-1 text-xs text-critical">{{ errors.quantity }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Reorder Point
            <span class="text-xs text-ink-60 font-normal ml-1">(triggers alert)</span>
          </label>
          <input
            v-model.number="formData.reorderPoint"
            type="number"
            min="0"
            class="w-full px-3 py-2.5 border rounded-lg bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-essential/20 focus:border-essential"
            :class="errors.reorderPoint ? 'border-critical bg-critical/5' : 'border-ink-20 hover:border-ink-40'"
          />
          <p v-if="errors.reorderPoint" class="mt-1 text-xs text-critical">{{ errors.reorderPoint }}</p>
        </div>
      </div>
    </div>

    <!-- Optional Information -->
    <div class="space-y-4">
      <h4 class="text-sm font-semibold text-ink-80 uppercase tracking-wider">Additional Information</h4>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Department - Only show for King's College -->
        <div v-if="showDepartment">
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Department/Ward
          </label>
          <select
            v-model="formData.department"
            class="w-full px-3 py-2.5 border border-ink-20 rounded-lg bg-white appearance-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ink-20 focus:border-ink-40 hover:border-ink-40 cursor-pointer"
          >
            <option value="">Select Department</option>
            <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Condition
          </label>
          <select
            v-model="formData.condition"
            class="w-full px-3 py-2.5 border border-ink-20 rounded-lg bg-white appearance-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ink-20 focus:border-ink-40 hover:border-ink-40 cursor-pointer"
          >
            <option v-for="cond in conditions" :key="cond" :value="cond">{{ cond }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Location
          </label>
          <input
            v-model="formData.location"
            type="text"
            class="w-full px-3 py-2.5 border border-ink-20 rounded-lg bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ink-20 focus:border-ink-40 hover:border-ink-40"
            placeholder="e.g., Storage Room A"
          />
        </div>

        <!-- Purchase Price - Only show for King's College -->
        <div v-if="showPrice">
          <label class="block text-sm font-medium text-ink-80 mb-1.5">
            Purchase Price (£)
          </label>
          <input
            v-model.number="formData.purchasePrice"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-3 py-2.5 border border-ink-20 rounded-lg bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ink-20 focus:border-ink-40 hover:border-ink-40"
            placeholder="0.00"
          />
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-between items-center mt-6 pt-6 border-t border-ink-10">
      <button
        type="button"
        @click="handleCancel"
        class="px-5 py-2.5 bg-white border border-ink-20 text-ink-80 rounded-lg hover:bg-ink-5 hover:border-ink-40 transition-all duration-200 font-medium text-sm"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="px-5 py-2.5 bg-ink-100 text-white rounded-lg hover:bg-ink-80 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
      >
        {{ mode === 'create' ? 'Add Asset' : 'Save Changes' }}
      </button>
    </div>
  </form>
</template>