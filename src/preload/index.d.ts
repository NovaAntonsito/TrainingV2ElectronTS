import { ElectronAPI as BaseElectronAPI } from '@electron-toolkit/preload'

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

export interface ElectronAPI extends BaseElectronAPI {
  auth: {
    login: (credentials: LoginCredentials) => Promise<AuthResult>
    logout: () => Promise<{ success: boolean; error?: string }>
    getCurrentUser: () => Promise<User | null>
    isAuthenticated: () => Promise<boolean>
  }
  music: {
    getAllSongs: () => Promise<MusicServiceResult<Song[]>>
    getSongById: (id: string) => Promise<MusicServiceResult<Song>>
    createSong: (songData: CreateSongDto) => Promise<MusicServiceResult<Song>>
    updateSong: (id: string, updates: UpdateSongDto) => Promise<MusicServiceResult<Song>>
    deleteSong: (id: string) => Promise<MusicServiceResult<void>>
    searchSongs: (query: string) => Promise<MusicServiceResult<Song[]>>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ElectronAPI
  }
}
