import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as path from 'path'
import { User, Song } from '../models'

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production'

// Handle database path - use a fallback for testing outside Electron
let dbPath: string
try {
  let electron, app
  if (typeof require !== 'undefined') {
    electron = require('electron')
    app = electron.app
    dbPath = isDev
      ? path.join(__dirname, '../../database.sqlite')
      : path.join(app.getPath('userData'), 'database.sqlite')
  } else {
    dbPath = path.join(__dirname, '../../database.sqlite')
  }
} catch {
  // Fallback for testing outside Electron
  dbPath = path.join(__dirname, '../../database.sqlite')
}

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  synchronize: true, // Enable sync for development and testing
  logger: 'simple-console',
  entities: [User, Song],
  migrations: [
    isDev
      ? path.join(__dirname, '../../src/migration/*.ts')
      : path.join(__dirname, '../migration/*.js')
  ],
  subscribers: [
    isDev
      ? path.join(__dirname, '../../src/subscriber/*.ts')
      : path.join(__dirname, '../subscriber/*.js')
  ]
})
