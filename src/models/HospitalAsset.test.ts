import { describe, it, expect, beforeEach } from 'vitest'
import { HospitalAsset } from './HospitalAsset'
import type { HospitalConfig } from './HospitalConfig'

describe('HospitalAsset Model', () => {
  let asset: HospitalAsset
  let config: HospitalConfig

  beforeEach(() => {
    config = {
      id: 'test-hospital',
      name: 'Test Hospital',
      fields: [
        { key: 'name', label: 'Equipment Name', type: 'text', required: true, visible: true },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true },
        { key: 'category', label: 'Category', type: 'text', required: true, visible: true },
        { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: true, visible: true },
        { key: 'purchasePrice', label: 'Price', type: 'currency', required: false, visible: true },
        { key: 'warrantyExpiry', label: 'Warranty', type: 'date', required: false, visible: true },
      ],
      features: {
        enableBarcoding: true,
        enableMaintenanceTracking: true,
        enableExpiryTracking: true,
        enableLocationTracking: true,
      }
    }

    asset = new HospitalAsset({
      name: 'Ventilator',
      manufacturer: 'MedTech',
      category: 'Life Support',
      quantity: 5,
      serialNumber: 'LS-123456',
      criticalLevel: 'critical',
      reorderPoint: 10,
      location: 'ICU',
      condition: 'Good',
      purchasePrice: 50000,
      warrantyExpiry: new Date('2025-12-31'),
      lastCalibration: new Date('2024-01-01'),
      customFields: {
        maintenanceNotes: 'Regular cleaning required',
        vendorContact: '+1-555-0123'
      }
    }, config)
  })

  describe('initialization', () => {
    it('should initialize with hospital-specific data', () => {
      expect(asset.getLocation()).toBe('ICU')
      expect(asset.getCondition()).toBe('Good')
      expect(asset.getCustomField('purchasePrice')).toBe(50000)
    })

    it('should handle custom fields', () => {
      expect(asset.getCustomField('maintenanceNotes')).toBe('Regular cleaning required')
      expect(asset.getCustomField('vendorContact')).toBe('+1-555-0123')
    })
  })

  describe('custom field management', () => {
    it('should set and get custom fields', () => {
      asset.setCustomField('testField', 'testValue')
      expect(asset.getCustomField('testField')).toBe('testValue')
    })

    it('should get all custom fields', () => {
      const allFields = asset.getAllCustomFields()
      expect(allFields).toHaveProperty('maintenanceNotes')
      expect(allFields).toHaveProperty('vendorContact')
      expect(allFields).toHaveProperty('purchasePrice')
      expect(Object.keys(allFields)).toHaveLength(3)
    })

    it('should mark as dirty when custom field is set', () => {
      asset.markAsClean()
      expect(asset.isDirtyField()).toBe(false)

      asset.setCustomField('newField', 'value')
      expect(asset.isDirtyField()).toBe(true)
    })
  })

  describe('display formatting', () => {
    it('should format currency fields', () => {
      const priceDisplay = asset.getDisplayValue('purchasePrice')
      expect(priceDisplay).toContain('£')
      expect(priceDisplay).toContain('50,000')
    })

    it('should format date fields', () => {
      const warrantyDisplay = asset.getDisplayValue('warrantyExpiry')
      expect(warrantyDisplay).toContain('2025')
      expect(warrantyDisplay).toContain('Dec')
    })

    it('should format percentage fields', () => {
      asset.setCustomField('utilizationRate', 0.75)
      config.fields.push({
        key: 'utilizationRate',
        label: 'Utilization',
        type: 'percentage',
        required: false,
        visible: true
      })

      const newAsset = new HospitalAsset(asset.serialize(), config)
      newAsset.setCustomField('utilizationRate', 0.75)
      const utilDisplay = newAsset.getDisplayValue('utilizationRate')
      expect(utilDisplay).toBe('75.0%')
    })

    it('should handle N/A for missing dates', () => {
      const asset2 = new HospitalAsset({
        name: 'Test',
        manufacturer: 'Test',
        category: 'Test',
        quantity: 1,
        serialNumber: 'TE-123456'
      }, config)

      const display = asset2.getDisplayValue('warrantyExpiry')
      expect(display).toBe('N/A')
    })
  })

  describe('validation', () => {
    it('should validate with all required fields', () => {
      const isValid = asset.validate()
      expect(isValid).toBe(true)
      expect(asset.hasErrors()).toBe(false)
    })

    it('should fail validation if required custom field is missing', () => {
      config.fields.push({
        key: 'requiredCustom',
        label: 'Required Custom',
        type: 'text',
        required: true,
        visible: true
      })

      const asset2 = new HospitalAsset({
        name: 'Test',
        manufacturer: 'Test',
        category: 'Test',
        quantity: 1,
        serialNumber: 'TE-123456'
      }, config)

      const isValid = asset2.validate()
      expect(isValid).toBe(false)
      expect(asset2.getErrors()).toHaveProperty('requiredCustom')
    })
  })

  describe('calibration tracking', () => {
    it('should detect when calibration is needed', () => {
      const recentCalibration = new HospitalAsset({
        name: 'Test',
        manufacturer: 'Test',
        category: 'Test',
        quantity: 1,
        serialNumber: 'TE-123456',
        lastCalibration: new Date()
      }, config)

      expect(recentCalibration.needsCalibration()).toBe(false)

      const oldCalibration = new HospitalAsset({
        name: 'Test',
        manufacturer: 'Test',
        category: 'Test',
        quantity: 1,
        serialNumber: 'TE-123456',
        lastCalibration: new Date('2023-01-01')
      }, config)

      expect(oldCalibration.needsCalibration()).toBe(true)
    })

    it('should indicate calibration needed if never calibrated', () => {
      const neverCalibrated = new HospitalAsset({
        name: 'Test',
        manufacturer: 'Test',
        category: 'Test',
        quantity: 1,
        serialNumber: 'TE-123456'
      }, config)

      expect(neverCalibrated.needsCalibration()).toBe(true)
    })
  })

  describe('warranty tracking', () => {
    it('should detect if under warranty', () => {
      const futureWarranty = new HospitalAsset({
        name: 'Test',
        manufacturer: 'Test',
        category: 'Test',
        quantity: 1,
        serialNumber: 'TE-123456',
        warrantyExpiry: new Date('2030-01-01')
      }, config)

      expect(futureWarranty.isUnderWarranty()).toBe(true)
    })

    it('should detect expired warranty', () => {
      const expiredWarranty = new HospitalAsset({
        name: 'Test',
        manufacturer: 'Test',
        category: 'Test',
        quantity: 1,
        serialNumber: 'TE-123456',
        warrantyExpiry: new Date('2020-01-01')
      }, config)

      expect(expiredWarranty.isUnderWarranty()).toBe(false)
    })

    it('should handle no warranty information', () => {
      const noWarranty = new HospitalAsset({
        name: 'Test',
        manufacturer: 'Test',
        category: 'Test',
        quantity: 1,
        serialNumber: 'TE-123456'
      }, config)

      expect(noWarranty.isUnderWarranty()).toBe(false)
    })
  })

  describe('serialization', () => {
    it('should serialize all data including custom fields', () => {
      const serialized = asset.serialize()

      expect(serialized).toHaveProperty('name', 'Ventilator')
      expect(serialized).toHaveProperty('location', 'ICU')
      expect(serialized).toHaveProperty('condition', 'Good')
      expect(serialized).toHaveProperty('purchasePrice', 50000)
      expect(serialized).toHaveProperty('customFields')
      expect(serialized.customFields).toHaveProperty('maintenanceNotes')
      expect(serialized.customFields).toHaveProperty('vendorContact')
    })

    it('should serialize dates as ISO strings', () => {
      const serialized = asset.serialize()

      expect(typeof serialized.warrantyExpiry).toBe('string')
      expect(typeof serialized.lastCalibration).toBe('string')
      expect(serialized.warrantyExpiry).toContain('2025-12-31')
      expect(serialized.lastCalibration).toContain('2024-01-01')
    })
  })

  describe('inheritance from Asset', () => {
    it('should have all Asset class methods', () => {
      expect(asset.isLowStock).toBeDefined()
      // isOverStock method removed - using only reorderPoint now
      expect(asset.isCritical).toBeDefined()
    })

    it('should correctly detect low stock', () => {
      asset.set('reorderPoint', 10)
      asset.set('quantity', 8) // Below reorder point
      expect(asset.isLowStock()).toBe(true)
    })

    it('should correctly identify critical items', () => {
      expect(asset.isCritical()).toBe(true)

      asset.set('criticalLevel', 'routine')
      expect(asset.isCritical()).toBe(false)
    })
  })
})