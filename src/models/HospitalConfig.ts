export interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean'
  required?: boolean
  visible?: boolean
  sortable?: boolean
  editable?: boolean
  format?: string
}

export interface HospitalConfig {
  id: string
  name: string
  fields: FieldConfig[]
  theme?: {
    primaryColor?: string
    logo?: string
  }
  features?: {
    enableBarcoding?: boolean
    enableMaintenanceTracking?: boolean
    enableExpiryTracking?: boolean
    enableLocationTracking?: boolean
  }
  customCategories?: string[]
  criticalityLevels?: Array<{
    name: string
    color: string
    minStockMultiplier: number
  }>
}