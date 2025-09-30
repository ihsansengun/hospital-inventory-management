import { Model } from '@/models/base/Model'

/**
 * Generic repository pattern for data persistence
 * AI-Assisted: Repository pattern boilerplate with Claude 3.5
 */
export abstract class Repository<T extends Model<any>> {
  protected storage: Map<string, T> = new Map()

  public abstract findAll(): Promise<T[]>
  public abstract findById(id: string): Promise<T | null>
  public abstract save(model: T): Promise<void>
  public abstract delete(id: string): Promise<boolean>
  public abstract count(): Promise<number>

  protected async beforeSave(model: T): Promise<void> {
    if (!model.validate()) {
      const errors = model.getErrors()
      const firstError = Object.values(errors)[0]?.[0] || 'Validation failed'
      throw new Error(`Model validation failed: ${firstError}`)
    }
  }

  protected async afterSave(model: T): Promise<void> {
    model.markAsClean()
  }

  public async findByIds(ids: string[]): Promise<T[]> {
    const results: T[] = []
    for (const id of ids) {
      const model = await this.findById(id)
      if (model) {
        results.push(model)
      }
    }
    return results
  }

  public async exists(id: string): Promise<boolean> {
    const model = await this.findById(id)
    return model !== null
  }

  public async deleteAll(): Promise<number> {
    const count = this.storage.size
    this.storage.clear()
    return count
  }
}