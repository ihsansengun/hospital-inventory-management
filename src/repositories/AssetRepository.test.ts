import { describe, it, expect, beforeEach } from 'vitest'
import { AssetRepository } from './AssetRepository'
import { HospitalAsset } from '@/models/HospitalAsset'
import { MedicalDataGenerator } from '@/fixtures/generators'

describe('AssetRepository', () => {
  let repository: AssetRepository
  let testConfig = MedicalDataGenerator.getDefaultConfig()

  beforeEach(() => {
    // Get fresh instance
    repository = AssetRepository.getInstance()
    repository.deleteAll()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AssetRepository.getInstance()
      const instance2 = AssetRepository.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('CRUD operations', () => {
    it('should save and retrieve an asset', async () => {
      const asset = new HospitalAsset({
        id: 'test-1',
        name: 'Test Equipment',
        manufacturer: 'MedTech',
        category: 'Diagnostic',
        serialNumber: 'TE-123456',
        quantity: 5
      }, testConfig)

      await repository.save(asset)
      const retrieved = await repository.findById('test-1')

      expect(retrieved).toBeTruthy()
      expect(retrieved?.get('name')).toBe('Test Equipment')
    })

    it('should find all assets', async () => {
      const asset1 = new HospitalAsset({
        id: 'test-1',
        name: 'Equipment 1',
        manufacturer: 'MedTech',
        category: 'Diagnostic',
        serialNumber: 'TE-111111',
        quantity: 1
      }, testConfig)

      const asset2 = new HospitalAsset({
        id: 'test-2',
        name: 'Equipment 2',
        manufacturer: 'MedTech',
        category: 'Surgical',
        serialNumber: 'TE-222222',
        quantity: 2
      }, testConfig)

      await repository.save(asset1)
      await repository.save(asset2)

      const all = await repository.findAll()
      expect(all).toHaveLength(2)
    })

    it('should delete an asset', async () => {
      const asset = new HospitalAsset({
        id: 'test-1',
        name: 'Test Equipment',
        manufacturer: 'MedTech',
        category: 'Diagnostic',
        serialNumber: 'TE-123456',
        quantity: 1
      }, testConfig)

      await repository.save(asset)
      const deleted = await repository.delete('test-1')
      expect(deleted).toBe(true)

      const retrieved = await repository.findById('test-1')
      expect(retrieved).toBeNull()
    })

    it('should count assets', async () => {
      const count1 = await repository.count()
      expect(count1).toBe(0)

      const asset = new HospitalAsset({
        id: 'test-1',
        name: 'Test',
        manufacturer: 'MedTech',
        category: 'Diagnostic',
        serialNumber: 'TE-123456',
        quantity: 1
      }, testConfig)

      await repository.save(asset)
      const count2 = await repository.count()
      expect(count2).toBe(1)
    })
  })

  describe('search and filtering', () => {
    beforeEach(async () => {
      const assets = [
        new HospitalAsset({
          id: '1',
          name: 'Ventilator',
          manufacturer: 'MedTech',
          category: 'Life Support',
          criticalLevel: 'critical',
          quantity: 2,
          reorderPoint: 3,
          serialNumber: 'LS-111111'
        }, testConfig),
        new HospitalAsset({
          id: '2',
          name: 'X-Ray Machine',
          manufacturer: 'Global Medical',
          category: 'Diagnostic',
          criticalLevel: 'essential',
          quantity: 5,
          reorderPoint: 1,
          serialNumber: 'DG-222222'
        }, testConfig),
        new HospitalAsset({
          id: '3',
          name: 'Syringe',
          manufacturer: 'CarePlus',
          category: 'Supplies',
          criticalLevel: 'routine',
          quantity: 100,
          reorderPoint: 50,
          serialNumber: 'SP-333333'
        }, testConfig)
      ]

      for (const asset of assets) {
        await repository.save(asset)
      }
    })

    it('should find by category', async () => {
      const lifeSupport = await repository.findByCategory('Life Support')
      expect(lifeSupport).toHaveLength(1)
      expect(lifeSupport[0]?.get('name')).toBe('Ventilator')
    })

    it('should find by critical level', async () => {
      const critical = await repository.findByCriticalLevel('critical')
      expect(critical).toHaveLength(1)
      expect(critical[0]?.get('name')).toBe('Ventilator')
    })

    it('should find low stock items', async () => {
      const lowStock = await repository.findLowStock()
      expect(lowStock).toHaveLength(1)
      expect(lowStock[0]?.get('name')).toBe('Ventilator')
    })

    it('should search by text', async () => {
      const results = await repository.search('ray')
      expect(results).toHaveLength(1)
      expect(results[0]?.get('name')).toBe('X-Ray Machine')
    })

    it('should search case-insensitive', async () => {
      const results = await repository.search('VENTILATOR')
      expect(results).toHaveLength(1)
      expect(results[0]?.get('name')).toBe('Ventilator')
    })
  })

  describe('bulk operations', () => {
    it('should bulk save multiple assets', async () => {
      const assets = [
        new HospitalAsset({
          id: '1',
          name: 'Asset 1',
          manufacturer: 'MedTech',
          category: 'Diagnostic',
          serialNumber: 'AS-111111',
          quantity: 1
        }, testConfig),
        new HospitalAsset({
          id: '2',
          name: 'Asset 2',
          manufacturer: 'MedTech',
          category: 'Surgical',
          serialNumber: 'AS-222222',
          quantity: 2
        }, testConfig)
      ]

      await repository.bulkSave(assets)
      const count = await repository.count()
      expect(count).toBe(2)
    })
  })

  describe('validation', () => {
    it('should reject invalid assets', async () => {
      const invalidAsset = new HospitalAsset({
        id: 'invalid',
        name: '', // Invalid - empty name
        serialNumber: 'INVALID' // Invalid format
      }, testConfig)

      await expect(repository.save(invalidAsset)).rejects.toThrow('Model validation failed')
    })
  })

  describe('calculations', () => {
    it('should calculate total value', async () => {
      const asset1 = new HospitalAsset({
        id: '1',
        name: 'Equipment 1',
        manufacturer: 'MedTech',
        category: 'Diagnostic',
        quantity: 2,
        serialNumber: 'EQ-111111',
        customFields: { purchasePrice: 1000 }
      }, testConfig)

      const asset2 = new HospitalAsset({
        id: '2',
        name: 'Equipment 2',
        manufacturer: 'MedTech',
        category: 'Surgical',
        quantity: 3,
        serialNumber: 'EQ-222222',
        customFields: { purchasePrice: 500 }
      }, testConfig)

      await repository.save(asset1)
      await repository.save(asset2)

      const totalValue = await repository.getTotalValue()
      expect(totalValue).toBe(2000 + 1500) // (2*1000) + (3*500)
    })
  })
})