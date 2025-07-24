import { Repository, Like } from 'typeorm'
import { Song } from '../models/Song'
import { DatabaseService } from '../database/DatabaseService'
import { AuthService } from './AuthService'

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

export interface MusicServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export class MusicService {
  private static instance: MusicService
  private songRepository: Repository<Song>
  private authService: AuthService

  private constructor() {
    this.authService = AuthService.getInstance()
    this.initializeRepository()
  }

  private initializeRepository(): void {
    try {
      const dataSource = DatabaseService.getInstance().getConnection()
      if (dataSource && dataSource.isInitialized) {
        this.songRepository = dataSource.getRepository(Song)
        console.log('MusicService: Database repository initialized')
      } else {
        console.log('MusicService: Database not initialized yet')
      }
    } catch (error) {
      console.log('MusicService: Database not available')
    }
  }

  public reinitializeRepository(): void {
    this.initializeRepository()
  }

  public static getInstance(): MusicService {
    if (!MusicService.instance) {
      MusicService.instance = new MusicService()
    }
    return MusicService.instance
  }

  async getAllSongs(): Promise<MusicServiceResult<Song[]>> {
    try {
      // Check if repository is available, if not try to reinitialize
      if (!this.songRepository) {
        this.reinitializeRepository()
      }

      if (!this.songRepository) {
        console.error('MusicService: Song repository not available')
        return {
          success: false,
          error: 'Database connection not available'
        }
      }

      const currentUser = await this.authService.getCurrentUser()
      if (!currentUser) {
        return {
          success: false,
          error: 'Usuario no autenticado'
        }
      }

      const songs = await this.songRepository.find({
        where: { userId: currentUser.id },
        relations: ['user'],
        order: { createdAt: 'DESC' }
      })

      return {
        success: true,
        data: songs
      }
    } catch (error) {
      console.error('Error getting all songs:', error)
      return {
        success: false,
        error: 'Error al obtener las canciones'
      }
    }
  }

  async getSongById(id: string): Promise<MusicServiceResult<Song>> {
    try {
      const currentUser = await this.authService.getCurrentUser()
      if (!currentUser) {
        return {
          success: false,
          error: 'Usuario no autenticado'
        }
      }

      const song = await this.songRepository.findOne({
        where: { id, userId: currentUser.id },
        relations: ['user']
      })

      if (!song) {
        return {
          success: false,
          error: 'Canción no encontrada'
        }
      }

      return {
        success: true,
        data: song
      }
    } catch (error) {
      console.error('Error getting song by id:', error)
      return {
        success: false,
        error: 'Error al obtener la canción'
      }
    }
  }

  async createSong(songData: CreateSongDto): Promise<MusicServiceResult<Song>> {
    try {
      const currentUser = await this.authService.getCurrentUser()
      if (!currentUser) {
        return {
          success: false,
          error: 'Usuario no autenticado'
        }
      }

      // Validate song data using the Song entity's static method
      const validationErrors = Song.validateSongData(songData)
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join(', ')
        }
      }

      // Create new song instance
      const song = new Song()
      song.titulo = songData.titulo
      song.album = songData.album
      song.artista = songData.artista
      song.duracion = songData.duracion
      song.portadaAlbum = songData.portadaAlbum
      song.previewMusica = songData.previewMusica
      song.user = currentUser
      song.userId = currentUser.id

      // Save the song (validation will be triggered by @BeforeInsert)
      const savedSong = await this.songRepository.save(song)

      return {
        success: true,
        data: savedSong
      }
    } catch (error) {
      console.error('Error creating song:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear la canción'
      }
    }
  }

  async updateSong(id: string, updates: UpdateSongDto): Promise<MusicServiceResult<Song>> {
    try {
      const currentUser = await this.authService.getCurrentUser()
      if (!currentUser) {
        return {
          success: false,
          error: 'Usuario no autenticado'
        }
      }

      // Find the song to update
      const song = await this.songRepository.findOne({
        where: { id, userId: currentUser.id },
        relations: ['user']
      })

      if (!song) {
        return {
          success: false,
          error: 'Canción no encontrada'
        }
      }

      // Create a temporary object with the updates to validate
      const updatedData = { ...song, ...updates }
      const validationErrors = Song.validateSongData(updatedData)
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join(', ')
        }
      }

      // Apply updates
      Object.assign(song, updates)

      // Save the updated song (validation will be triggered by @BeforeUpdate)
      const savedSong = await this.songRepository.save(song)

      return {
        success: true,
        data: savedSong
      }
    } catch (error) {
      console.error('Error updating song:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar la canción'
      }
    }
  }

  async deleteSong(id: string): Promise<MusicServiceResult<void>> {
    try {
      const currentUser = await this.authService.getCurrentUser()
      if (!currentUser) {
        return {
          success: false,
          error: 'Usuario no autenticado'
        }
      }

      // Find the song to delete
      const song = await this.songRepository.findOne({
        where: { id, userId: currentUser.id }
      })

      if (!song) {
        return {
          success: false,
          error: 'Canción no encontrada'
        }
      }

      // Delete the song
      await this.songRepository.remove(song)

      return {
        success: true
      }
    } catch (error) {
      console.error('Error deleting song:', error)
      return {
        success: false,
        error: 'Error al eliminar la canción'
      }
    }
  }

  async searchSongs(query: string): Promise<MusicServiceResult<Song[]>> {
    try {
      const currentUser = await this.authService.getCurrentUser()
      if (!currentUser) {
        return {
          success: false,
          error: 'Usuario no autenticado'
        }
      }

      if (!query || query.trim().length === 0) {
        // If no query, return all songs
        return this.getAllSongs()
      }

      const searchTerm = `%${query.trim()}%`

      // Search in titulo, album, and artista fields
      const songs = await this.songRepository.find({
        where: [
          { userId: currentUser.id, titulo: Like(searchTerm) },
          { userId: currentUser.id, album: Like(searchTerm) },
          { userId: currentUser.id, artista: Like(searchTerm) }
        ],
        relations: ['user'],
        order: { createdAt: 'DESC' }
      })

      return {
        success: true,
        data: songs
      }
    } catch (error) {
      console.error('Error searching songs:', error)
      return {
        success: false,
        error: 'Error al buscar canciones'
      }
    }
  }
}
