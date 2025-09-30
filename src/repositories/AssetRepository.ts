import { Repository } from './base/Repository'
import { HospitalAsset } from '@/models/HospitalAsset'

/**
 * Repository for managing hospital inventory assets.
 * Handles data persistence, filtering, and search functionality.
 * Uses localStorage for demo purposes (production would use API).
 */
export class AssetRepository extends Repository<HospitalAsset> {
  private static instance: AssetRepository | null = null
  private static readonly STORAGE_KEY = 'hospital_inventory_assets'

  private constructor() {
    super()
    this.loadFromLocalStorage()
  }

  public static getInstance(): AssetRepository {
    if (!AssetRepository.instance) {
      AssetRepository.instance = new AssetRepository()
    }
    return AssetRepository.instance
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(AssetRepository.STORAGE_KEY)
      if (stored) {
        // Parse stored data for future use
        JSON.parse(stored)
        // Note: We're storing raw data, need to reconstruct HospitalAsset objects
        // For now, we'll just skip this and generate fresh data
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
  }

  private saveToLocalStorage(): void {
    try {
      const data = Array.from(this.storage.entries()).map(([id, asset]) => ({
        id,
        data: asset.serialize()
      }))
      localStorage.setItem(AssetRepository.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  public async findAll(): Promise<HospitalAsset[]> {
    return Array.from(this.storage.values())
  }

  public async findById(id: string): Promise<HospitalAsset | null> {
    return this.storage.get(id) || null
  }

  public async save(model: HospitalAsset): Promise<void> {
    await this.beforeSave(model)
    const id = model.get('id')
    this.storage.set(id, model)
    await this.afterSave(model)
    this.saveToLocalStorage()
  }

  public async delete(id: string): Promise<boolean> {
    const result = this.storage.delete(id)
    if (result) {
      this.saveToLocalStorage()
    }
    return result
  }

  public async count(): Promise<number> {
    return this.storage.size
  }

  public async findByCategory(category: string): Promise<HospitalAsset[]> {
    const all = await this.findAll()
    return all.filter(asset => asset.get('category') === category)
  }

  public async findByCriticalLevel(level: 'critical' | 'essential' | 'routine'): Promise<HospitalAsset[]> {
    const all = await this.findAll()
    return all.filter(asset => asset.get('criticalLevel') === level)
  }

  public async findLowStock(): Promise<HospitalAsset[]> {
    const all = await this.findAll()
    return all.filter(asset => asset.isLowStock())
  }

  public async findCritical(): Promise<HospitalAsset[]> {
    const all = await this.findAll()
    return all.filter(asset => asset.isCritical())
  }

  /**
   * Searches assets across multiple fields.
   * Searches: name, manufacturer, serial number, and category.
   * Case-insensitive partial matching.
   */
  public async search(query: string): Promise<HospitalAsset[]> {
    const all = await this.findAll()
    const lowerQuery = query.toLowerCase()

    return all.filter(asset => {
      const name = asset.get('name').toLowerCase()
      const manufacturer = asset.get('manufacturer').toLowerCase()
      const serialNumber = asset.get('serialNumber').toLowerCase()
      const category = asset.get('category').toLowerCase()

      return name.includes(lowerQuery) ||
             manufacturer.includes(lowerQuery) ||
             serialNumber.includes(lowerQuery) ||
             category.includes(lowerQuery)
    })
  }

  public async bulkSave(models: HospitalAsset[]): Promise<void> {
    for (const model of models) {
      await this.save(model)
    }
  }

  // Calculates total inventory value (quantity × purchase price)
  public async getTotalValue(): Promise<number> {
    const all = await this.findAll()
    return all.reduce((sum, asset) => {
      const quantity = asset.get('quantity')
      const price = asset.getCustomField('purchasePrice') || 0
      return sum + (quantity * price)
    }, 0)
  }

  public async deleteAll(): Promise<number> {
    const count = this.storage.size
    this.storage.clear()
    localStorage.removeItem(AssetRepository.STORAGE_KEY)
    return count
  }
}