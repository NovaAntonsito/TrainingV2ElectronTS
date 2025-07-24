import { ipcMain } from 'electron'
import {
  MusicService,
  CreateSongDto,
  UpdateSongDto,
  MusicServiceResult
} from '../services/MusicService'
import { Song } from '../models/Song'

export class MusicHandlers {
  private musicService: MusicService

  constructor() {
    this.musicService = MusicService.getInstance()
    this.registerHandlers()
  }

  private registerHandlers(): void {
    // Get all songs handler
    ipcMain.handle('music:getAllSongs', async (): Promise<MusicServiceResult<Song[]>> => {
      try {
        return await this.musicService.getAllSongs()
      } catch (error) {
        console.error('IPC music:getAllSongs error:', error)
        return {
          success: false,
          error: 'Error al obtener las canciones'
        }
      }
    })

    // Get song by ID handler
    ipcMain.handle(
      'music:getSongById',
      async (_, id: string): Promise<MusicServiceResult<Song>> => {
        try {
          if (!id || typeof id !== 'string') {
            return {
              success: false,
              error: 'ID de canción requerido'
            }
          }

          return await this.musicService.getSongById(id)
        } catch (error) {
          console.error('IPC music:getSongById error:', error)
          return {
            success: false,
            error: 'Error al obtener la canción'
          }
        }
      }
    )

    // Create song handler
    ipcMain.handle(
      'music:createSong',
      async (_, songData: CreateSongDto): Promise<MusicServiceResult<Song>> => {
        try {
          if (!songData) {
            return {
              success: false,
              error: 'Datos de la canción requeridos'
            }
          }

          return await this.musicService.createSong(songData)
        } catch (error) {
          console.error('IPC music:createSong error:', error)
          return {
            success: false,
            error: 'Error al crear la canción'
          }
        }
      }
    )

    // Update song handler
    ipcMain.handle(
      'music:updateSong',
      async (_, id: string, updates: UpdateSongDto): Promise<MusicServiceResult<Song>> => {
        try {
          if (!id || typeof id !== 'string') {
            return {
              success: false,
              error: 'ID de canción requerido'
            }
          }

          if (!updates || Object.keys(updates).length === 0) {
            return {
              success: false,
              error: 'Datos de actualización requeridos'
            }
          }

          return await this.musicService.updateSong(id, updates)
        } catch (error) {
          console.error('IPC music:updateSong error:', error)
          return {
            success: false,
            error: 'Error al actualizar la canción'
          }
        }
      }
    )

    // Delete song handler
    ipcMain.handle('music:deleteSong', async (_, id: string): Promise<MusicServiceResult<void>> => {
      try {
        if (!id || typeof id !== 'string') {
          return {
            success: false,
            error: 'ID de canción requerido'
          }
        }

        return await this.musicService.deleteSong(id)
      } catch (error) {
        console.error('IPC music:deleteSong error:', error)
        return {
          success: false,
          error: 'Error al eliminar la canción'
        }
      }
    })

    // Search songs handler
    ipcMain.handle(
      'music:searchSongs',
      async (_, query: string): Promise<MusicServiceResult<Song[]>> => {
        try {
          return await this.musicService.searchSongs(query || '')
        } catch (error) {
          console.error('IPC music:searchSongs error:', error)
          return {
            success: false,
            error: 'Error al buscar canciones'
          }
        }
      }
    )
  }
}
