import { describe, it, expect, beforeEach } from 'vitest'
import { Asset } from './Asset'

describe('Asset Model', () => {
  let asset: Asset

  beforeEach(() => {
    asset = new Asset({
      name: 'Ventilator',
      manufacturer: 'MedTech',
      category: 'Life Support',
      quantity: 5,
      serialNumber: 'LS-123456',
      criticalLevel: 'critical',
      reorderPoint: 10
    })
  })

  describe('initialization', () => {
    it('should initialize with provided data', () => {
      expect(asset.get('name')).toBe('Ventilator')
      expect(asset.get('manufacturer')).toBe('MedTech')
      expect(asset.get('quantity')).toBe(5)
    })

    it('should generate ID if not provided', () => {
      expect(asset.get('id')).toBeTruthy()
      expect(typeof asset.get('id')).toBe('string')
    })

    it('should set default values for optional fields', () => {
      const minimalAsset = new Asset({ name: 'Test' })
      expect(minimalAsset.get('criticalLevel')).toBe('routine')
      expect(minimalAsset.get('reorderPoint')).toBe(10)
    })
  })

  describe('validation', () => {
    it('should validate successfully with valid data', () => {
      const isValid = asset.validate()
      expect(isValid).toBe(true)
      expect(asset.hasErrors()).toBe(false)
    })

    it('should fail validation without name', () => {
      asset.set('name', '')
      const isValid = asset.validate()
      expect(isValid).toBe(false)
      expect(asset.getErrors().name).toContain('Name is required')
    })

    it('should fail validation with negative quantity', () => {
      asset.set('quantity', -1)
      const isValid = asset.validate()
      expect(isValid).toBe(false)
      expect(asset.getErrors().quantity).toContain('Quantity cannot be negative')
    })

    it('should validate serial number format', () => {
      asset.set('serialNumber', 'INVALID')
      const isValid = asset.validate()
      expect(isValid).toBe(false)
      expect(asset.getErrors().serialNumber).toContain('Invalid serial number format (should be XX-000000)')
    })

    it('should validate reorder point', () => {
      asset.set('reorderPoint', -1)
      const isValid = asset.validate()
      expect(isValid).toBe(false)
      expect(asset.getErrors().reorderPoint).toContain('Reorder point cannot be negative')
    })
  })

  describe('business logic', () => {
    it('should detect low stock correctly', () => {
      asset.set('reorderPoint', 10)
      asset.set('quantity', 8) // Below reorder point but above critical (30%)
      expect(asset.isLowStock()).toBe(true)

      asset.set('quantity', 11) // Above reorder point
      expect(asset.isLowStock()).toBe(false)

      asset.set('quantity', 2) // At critical level (below 30%)
      expect(asset.isLowStock()).toBe(false) // Critical, not low
    })

    it('should identify critical items', () => {
      expect(asset.isCritical()).toBe(true)

      asset.set('criticalLevel', 'routine')
      expect(asset.isCritical()).toBe(false)

      asset.set('reorderPoint', 10)
      asset.set('quantity', 3) // At or below 30% of reorder point
      expect(asset.isCritical()).toBe(true) // Critical stock level
    })
  })

  describe('serialization', () => {
    it('should serialize to JSON correctly', () => {
      const date = new Date('2024-01-01')
      asset.set('lastMaintenance', date)

      const serialized = asset.serialize()
      expect(serialized.name).toBe('Ventilator')
      expect(serialized.lastMaintenance).toBe(date.toISOString())
    })
  })

  describe('display formatting', () => {
    it('should format quantity with units', () => {
      expect(asset.getDisplayValue('quantity')).toBe('5 units')
    })

    it('should format dates correctly', () => {
      const date = new Date('2024-01-01')
      asset.set('lastMaintenance', date)
      expect(asset.getDisplayValue('lastMaintenance')).toContain('2024')
    })

    it('should handle empty dates', () => {
      expect(asset.getDisplayValue('expiryDate')).toBe('N/A')
    })
  })

  describe('dirty tracking', () => {
    it('should track dirty state', () => {
      expect(asset.isDirtyField()).toBe(false)

      asset.set('quantity', 10)
      expect(asset.isDirtyField()).toBe(true)

      asset.markAsClean()
      expect(asset.isDirtyField()).toBe(false)
    })
  })
})