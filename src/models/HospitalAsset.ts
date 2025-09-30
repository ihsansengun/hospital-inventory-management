import { Asset } from './Asset'
import type { AssetData } from './Asset'
import type { HospitalConfig } from './HospitalConfig'

export interface HospitalAssetData extends AssetData {
  customFields?: Record<string, any>
  location?: string
  condition?: 'New' | 'Good' | 'Fair' | 'Maintenance Required'
  purchasePrice?: number
  warrantyExpiry?: Date
  lastCalibration?: Date
}

export class HospitalAsset extends Asset {
  protected declare data: HospitalAssetData
  private readonly customFields: Map<string, any>
  private readonly hospitalConfig: HospitalConfig

  constructor(data: Partial<HospitalAssetData>, config: HospitalConfig) {
    super(data)
    this.hospitalConfig = config
    this.customFields = new Map(Object.entries(data.customFields || {}))

    if (data.location) this.data.location = data.location
    if (data.condition) this.data.condition = data.condition
    if (data.purchasePrice) {
      this.data.purchasePrice = data.purchasePrice
      this.customFields.set('purchasePrice', data.purchasePrice)
    }
    if (data.warrantyExpiry) this.data.warrantyExpiry = data.warrantyExpiry
    if (data.lastCalibration) this.data.lastCalibration = data.lastCalibration
  }

  // Formats field values for display based on hospital-specific configuration
  // Handles both standard fields and custom fields (e.g., department)
  public getDisplayValue(field: keyof HospitalAssetData | string): string {
    // Check if it's a custom field first (like department)
    if (field === 'department' || !((field as string) in this.data)) {
      const value = this.customFields.get(field)
      return this.formatField(field, value)
    }
    // Otherwise use the data field
    const value = this.data[field as keyof HospitalAssetData]
    return this.formatField(field, value)
  }

  protected formatField(field: keyof HospitalAssetData | string, value: any): string {
    const customConfig = this.hospitalConfig.fields.find(f => f.key === field)

    if (customConfig) {
      switch (customConfig.type) {
        case 'currency':
          return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
          }).format(value)
        case 'date':
          return value ? new Date(value).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A'
        case 'percentage':
          return `${(value * 100).toFixed(1)}%`
        default:
          return String(value || '')
      }
    }

    return super.formatField(field as keyof AssetData, value as any)
  }

  public getCustomField(key: string): any {
    return this.customFields.get(key)
  }

  public setCustomField(key: string, value: any): void {
    this.customFields.set(key, value)
    this.isDirty = true
  }

  public getAllCustomFields(): Record<string, any> {
    return Object.fromEntries(this.customFields)
  }

  public serialize(): Record<string, any> {
    const base = super.serialize()
    return {
      ...base,
      customFields: this.getAllCustomFields(),
      location: this.data.location,
      condition: this.data.condition,
      purchasePrice: this.data.purchasePrice,
      warrantyExpiry: this.data.warrantyExpiry?.toISOString(),
      lastCalibration: this.data.lastCalibration?.toISOString(),
    }
  }

  public validate(): boolean {
    const baseValid = super.validate()

    for (const fieldConfig of this.hospitalConfig.fields) {
      if (fieldConfig.required) {
        const value = fieldConfig.key in this.data ?
          this.data[fieldConfig.key as keyof AssetData] :
          this.customFields.get(fieldConfig.key)

        if (value === undefined || value === null || value === '') {
          this.addError(fieldConfig.key as keyof AssetData, `${fieldConfig.label} is required`)
        }
      }
    }

    return baseValid && !this.hasErrors()
  }

  public needsCalibration(): boolean {
    if (!this.data.lastCalibration) return true
    const daysSinceCalibration = (Date.now() - this.data.lastCalibration.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceCalibration > 30
  }

  public isUnderWarranty(): boolean {
    if (!this.data.warrantyExpiry) return false
    return this.data.warrantyExpiry > new Date()
  }

  public getLocation(): string | undefined {
    return this.data.location
  }

  public getCondition(): 'New' | 'Good' | 'Fair' | 'Maintenance Required' | undefined {
    return this.data.condition
  }
}