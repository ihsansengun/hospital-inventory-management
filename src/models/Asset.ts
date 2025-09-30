import { Model } from './base/Model'
import { generateId } from '@/utils/id'

export interface AssetData {
  id: string
  name: string
  manufacturer: string
  category: string
  quantity: number
  serialNumber: string
  criticalLevel: 'critical' | 'essential' | 'routine'
  lastMaintenance?: Date
  expiryDate?: Date
  reorderPoint: number
}

export class Asset extends Model<AssetData> {
  protected initialize(data: Partial<AssetData>): AssetData {
    return {
      id: data.id || generateId(),
      name: data.name || '',
      manufacturer: data.manufacturer || '',
      category: data.category || '',
      quantity: data.quantity !== undefined ? data.quantity : 0,
      serialNumber: data.serialNumber || '',
      criticalLevel: data.criticalLevel || 'routine',
      lastMaintenance: data.lastMaintenance,
      expiryDate: data.expiryDate,
      reorderPoint: data.reorderPoint !== undefined ? data.reorderPoint : 10
    }
  }

  public validate(): boolean {
    this.clearErrors()

    if (!this.data.name?.trim()) {
      this.addError('name', 'Name is required')
    } else if (this.data.name.length > 100) {
      this.addError('name', 'Name must be less than 100 characters')
    }

    if (this.data.quantity === undefined || this.data.quantity === null) {
      this.addError('quantity', 'Quantity is required')
    } else if (this.data.quantity < 0) {
      this.addError('quantity', 'Quantity cannot be negative')
    } else if (this.data.quantity > 999999) {
      this.addError('quantity', 'Quantity exceeds maximum allowed value')
    } else if (!Number.isInteger(this.data.quantity)) {
      this.addError('quantity', 'Quantity must be a whole number')
    }

    if (!this.data.serialNumber) {
      this.addError('serialNumber', 'Serial number is required')
    } else if (!this.data.serialNumber.match(/^[A-Z]{2}-\d{6}$/)) {
      this.addError('serialNumber', 'Invalid serial number format (should be XX-000000)')
    }

    if (this.data.reorderPoint < 0) {
      this.addError('reorderPoint', 'Reorder point cannot be negative')
    }

    return !this.hasErrors()
  }

  public serialize(): Record<string, any> {
    return {
      ...this.data,
      lastMaintenance: this.data.lastMaintenance?.toISOString(),
      expiryDate: this.data.expiryDate?.toISOString(),
    }
  }

  public getDisplayValue(field: keyof AssetData): string {
    return this.formatField(field, this.data[field])
  }

  protected formatField(field: keyof AssetData, value: any): string {
    switch (field) {
      case 'quantity':
        return `${value} units`
      case 'lastMaintenance':
      case 'expiryDate':
        return value ? new Date(value).toLocaleDateString() : 'N/A'
      default:
        return String(value || '')
    }
  }

  public isLowStock(): boolean {
    return this.data.quantity < this.data.reorderPoint && this.data.quantity > this.data.reorderPoint * 0.3
  }

  public isCritical(): boolean {
    if (this.data.criticalLevel === 'critical') {
      return true
    }
    // NHS guideline: 30% of reorder point triggers urgent procurement
    return this.data.quantity <= this.data.reorderPoint * 0.3
  }
}