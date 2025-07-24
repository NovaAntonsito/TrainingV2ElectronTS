console.log('=== PRELOAD SCRIPT STARTING ===')

import { contextBridge, ipcRenderer } from 'electron'

console.log('Preload script imports loaded')
console.log('Process contextIsolated:', process.contextIsolated)
console.log('contextBridge available:', !!contextBridge)
console.log('ipcRenderer available:', !!ipcRenderer)

// Define types for authentication
export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    username: string
    createdAt: Date
    updatedAt: Date
  }
  error?: string
}

export interface User {
  id: string
  username: string
  createdAt: Date
  updatedAt: Date
}

// Music-related types
export interface Song {
  id: string
  titulo: string
  album: string
  artista: string
  duracion: number
  portadaAlbum?: string
  previewMusica?: string
  userId: string
  user: User
  createdAt: Date
  updatedAt: Date
}

export interface CreateSongDto {
  titulo: string
  album: string
  artista: string
  duracion: number
  portadaAlbum?: string
  previewMusica?: string
}

export interface UpdateSongDto {
  titulo?: string
  album?: string
  artista?: string
  duracion?: number
  portadaAlbum?: string
  previewMusica?: string
}

export interface MusicServiceResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Custom APIs for renderer
const api = {
  // Authentication APIs
  auth: {
    login: (credentials: LoginCredentials): Promise<AuthResult> =>
      ipcRenderer.invoke('auth:login', credentials),

    logout: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('auth:logout'),

    getCurrentUser: (): Promise<User | null> => ipcRenderer.invoke('auth:getCurrentUser'),

    isAuthenticated: (): Promise<boolean> => ipcRenderer.invoke('auth:isAuthenticated')
  },

  // Music APIs
  music: {
    getAllSongs: (): Promise<MusicServiceResult<Song[]>> => ipcRenderer.invoke('music:getAllSongs'),

    getSongById: (id: string): Promise<MusicServiceResult<Song>> =>
      ipcRenderer.invoke('music:getSongById', id),

    createSong: (songData: CreateSongDto): Promise<MusicServiceResult<Song>> =>
      ipcRenderer.invoke('music:createSong', songData),

    updateSong: (id: string, updates: UpdateSongDto): Promise<MusicServiceResult<Song>> =>
      ipcRenderer.invoke('music:updateSong', id, updates),

    deleteSong: (id: string): Promise<MusicServiceResult<void>> =>
      ipcRenderer.invoke('music:deleteSong', id),

    searchSongs: (query: string): Promise<MusicServiceResult<Song[]>> =>
      ipcRenderer.invoke('music:searchSongs', query)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    console.log('Preload: Exposing APIs to main world')
    console.log('Preload: api object:', api)

    contextBridge.exposeInMainWorld('electron', api)
    contextBridge.exposeInMainWorld('api', api)

    // Test exposure
    contextBridge.exposeInMainWorld('preloadTest', {
      test: () => 'Preload script is working!'
    })

    console.log('Preload: APIs exposed successfully')
  } catch (error) {
    console.error('Preload: Error exposing APIs:', error)
  }
} else {
  console.log('Preload: Context isolation disabled, adding to window')
  // @ts-ignore (define in dts)
  window.electron = api
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.preloadTest = {
    test: () => 'Preload script is working!'
  }
}

console.log('Preload script completed')
