import 'reflect-metadata'
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { DatabaseService } from './database/DatabaseService'
import { AuthHandlers } from './ipc/authHandlers'
import { MusicHandlers } from './ipc/musicHandlers'
import { AuthService } from './services/AuthService'
import { MusicService } from './services/MusicService'
import { c } from 'vite/dist/node/moduleRunnerTransport.d-DJ_mE5sf'

let mainWindow: BrowserWindow

const createWindow = (): void => {
  const preloadPath = join(__dirname, '../preload/index.js')
  console.log('Preload path:', preloadPath)
  console.log('Preload file exists:', existsSync(preloadPath))

  // Create the browser window
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath
    }
  })

  // Load your renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile('dist/renderer/index.html')
  }
}

app.whenReady().then(async () => {
  try {
    // Initialize database
    const databaseService = DatabaseService.getInstance()
    await databaseService.initialize()
    console.log('Database initialized successfully')

    // Log database path for debugging
    const dbConnection = databaseService.getConnection()
    console.log('Database path:', dbConnection.options.database)

    // Reinitialize services after database is ready
    AuthService.getInstance().reinitializeRepository()
    MusicService.getInstance().reinitializeRepository()
    console.log('Services reinitialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    return
  }

  try {
    // Initialize IPC handlers
    new AuthHandlers()
    new MusicHandlers()
    console.log('IPC handlers initialized')
  } catch (error) {
    console.error('Error initializing IPC handlers:', error)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  // Close database connection when app is about to quit
  const databaseService = DatabaseService.getInstance()
  await databaseService.close()
})
