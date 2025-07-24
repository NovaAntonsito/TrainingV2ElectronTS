import { DataSource } from 'typeorm'
import { AppDataSource } from './data-source'

export class DatabaseService {
  private static instance: DatabaseService
  private dataSource: DataSource

  private constructor() {
    this.dataSource = AppDataSource
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  public async initialize(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize()
      console.log('Database connection initialized')
    }
  }

  public getConnection(): DataSource {
    return this.dataSource
  }

  public async close(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy()
      console.log('Database connection closed')
    }
  }
}
