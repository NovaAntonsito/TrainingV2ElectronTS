import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as path from 'path'
import { User, Song } from '../models'

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production'

// Handle database path - use a fallback for testing outside Electron
let dbPath: string
try {
  // Dynamic import to avoid require() style import
  const electron = eval('require')('electron')
  const { app } = electron
  dbPath = isDev
    ? path.join(__dirname, '../../database.sqlite')
    : path.join(app.getPath('userData'), 'database.sqlite')
} catch {
  // Fallback for testing outside Electron
  dbPath = path.join(__dirname, '../../database.sqlite')
}

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  synchronize: true, // Enable sync for development and testing
  logging: isDev,
  logger: 'simple-console',
  entities: [User, Song],
  migrations: [isDev ? 'src/migration/*.ts' : path.join(__dirname, '../migration/*.js')],
  subscribers: [isDev ? 'src/subscriber/*.ts' : path.join(__dirname, '../subscriber/*.js')]
})
