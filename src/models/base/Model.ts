/**
 * Abstract base model implementing Active Record pattern
 * AI-Assisted: Initial boilerplate structure generated with Claude 3.5
 * Prompt: "Create TypeScript base model class with validation and dirty tracking"
 */
export abstract class Model<T extends Record<string, any>> {
  protected data: T
  protected errors: Map<keyof T, string[]> = new Map()
  protected isDirty = false

  constructor(data: Partial<T>) {
    this.data = this.initialize(data)
  }

  protected abstract initialize(data: Partial<T>): T

  public abstract validate(): boolean

  public abstract serialize(): Record<string, any>

  public get<K extends keyof T>(key: K): T[K] {
    return this.data[key]
  }

  public set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value
    this.isDirty = true
  }

  public hasErrors(): boolean {
    return this.errors.size > 0
  }

  public getErrors(): Record<string, string[]> {
    return Object.fromEntries(this.errors)
  }

  protected addError(field: keyof T, message: string): void {
    if (!this.errors.has(field)) {
      this.errors.set(field, [])
    }
    this.errors.get(field)!.push(message)
  }

  protected clearErrors(): void {
    this.errors.clear()
  }

  public isDirtyField(): boolean {
    return this.isDirty
  }

  public markAsClean(): void {
    this.isDirty = false
  }
}