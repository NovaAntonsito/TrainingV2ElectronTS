import 'reflect-metadata'
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { DatabaseService } from './database/DatabaseService'
import { AuthHandlers } from './ipc/authHandlers'
import { MusicHandlers } from './ipc/musicHandlers'
import { AuthService } from './services/AuthService'
import { MusicService } from './services/MusicService'

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
    console.log('Services reinitialized with database connection')

    // Create mock user and sample data if they don't exist
    try {
      const authService = AuthService.getInstance()
      const musicService = MusicService.getInstance()

      // Create mock user
      let mockUser
      try {
        mockUser = await authService.createUser('anton', 'admin')
        console.log('Mock user created:', mockUser.username)
      } catch (error) {
        console.log('Mock user might already exist, trying to login...')
        const loginResult = await authService.login({ username: 'anton', password: 'admin' })
        if (loginResult.success) {
          mockUser = loginResult.user
          console.log('Using existing mock user:', mockUser.username)
        }
      }

      // Create sample songs if user exists and has no songs
      if (mockUser) {
        const songsResult = await musicService.getAllSongs()
        if (songsResult.success && songsResult.data && songsResult.data.length === 0) {
          console.log('Creating sample songs...')
          const sampleSongs = [
            {
              titulo: 'Bohemian Rhapsody',
              album: 'A Night at the Opera',
              artista: 'Queen',
              duracion: 355,
              portadaAlbum:
                'https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_A_Night_at_the_Opera.png'
            },
            {
              titulo: 'Hotel California',
              album: 'Hotel California',
              artista: 'Eagles',
              duracion: 391,
              portadaAlbum: 'https://upload.wikimedia.org/wikipedia/en/4/49/Hotelcalifornia.jpg'
            },
            {
              titulo: 'Imagine',
              album: 'Imagine',
              artista: 'John Lennon',
              duracion: 183,
              portadaAlbum:
                'https://upload.wikimedia.org/wikipedia/en/1/1d/John_Lennon_-_Imagine_John_Lennon.jpg'
            }
          ]

          for (const songData of sampleSongs) {
            await musicService.createSong(songData)
          }
          console.log('Sample songs created')
        }
      }
    } catch (error) {
      console.log('Error creating mock data:', error instanceof Error ? error.message : error)
    }
  } catch (error) {
    console.error('Error during Data Source initialization:', error)
    console.log('Continuing without database - some features may not work')
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
