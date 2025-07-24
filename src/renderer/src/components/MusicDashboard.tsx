import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Song, CreateSongDto, UpdateSongDto } from '../../../preload/index.d'
import MusicList from './MusicList'
import MusicForm from './MusicForm'
import SearchComponent from './SearchComponent'
import './MusicDashboard.css'

const MusicDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const [songs, setSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMusicForm, setShowMusicForm] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)

  useEffect(() => {
    loadSongs()
  }, [])

  const loadSongs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await window.electron.music.getAllSongs()
      if (result.success && result.data) {
        setSongs(result.data)
        setFilteredSongs(result.data)
      } else {
        setError(result.error || 'Error al cargar las canciones')
      }
    } catch (err) {
      setError('Error de conexión al cargar las canciones')
      console.error('Error loading songs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSong = (song: Song) => {
    setEditingSong(song)
    setShowMusicForm(true)
  }

  const handleAddSong = () => {
    setEditingSong(null)
    setShowMusicForm(true)
  }

  const handleFormClose = () => {
    setShowMusicForm(false)
    setEditingSong(null)
  }

  const handleFormSubmit = async (songData: CreateSongDto | UpdateSongDto) => {
    try {
      let result
      if (editingSong) {
        // Update existing song
        result = await window.electron.music.updateSong(editingSong.id, songData as UpdateSongDto)
        if (result.success) {
          showToast('Canción actualizada exitosamente', 'success')
        }
      } else {
        // Create new song
        result = await window.electron.music.createSong(songData as CreateSongDto)
        if (result.success) {
          showToast('Canción agregada exitosamente', 'success')
        }
      }

      if (result.success) {
        await loadSongs() // Reload songs to get updated data
        handleFormClose()
      } else {
        showToast(`Error: ${result.error}`, 'error')
      }
    } catch (err) {
      console.error('Error saving song:', err)
      showToast('Error de conexión al guardar la canción', 'error')
    }
  }

  const handleDeleteSong = async (id: string): Promise<void> => {
    try {
      const result = await window.electron.music.deleteSong(id)
      if (result.success) {
        // Update songs list immediately without reloading
        const updatedSongs = songs.filter((song) => song.id !== id)
        setSongs(updatedSongs)
        setFilteredSongs((prevFiltered) => prevFiltered.filter((song) => song.id !== id))
        showToast('Canción eliminada exitosamente', 'success')
      } else {
        showToast(`Error al eliminar la canción: ${result.error}`, 'error')
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error deleting song:', err)
      showToast('Error de conexión al eliminar la canción', 'error')
      throw err
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Error during logout:', err)
    }
  }

  const handleSearchResults = (searchResults: Song[]) => {
    setFilteredSongs(searchResults)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Mi Colección de Música</h1>
            <div className="collection-stats">
              {!isLoading && (
                <span className="song-count">
                  {filteredSongs.length} de {songs.length}{' '}
                  {songs.length === 1 ? 'canción' : 'canciones'}
                  {filteredSongs.length !== songs.length && ' (filtradas)'}
                </span>
              )}
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-details">
                <span className="username">Bienvenido, {user?.username}</span>
                <span className="user-since">
                  Miembro desde {user?.createdAt ? formatDate(user.createdAt) : ''}
                </span>
              </div>
              <button onClick={handleLogout} className="logout-button">
                <span className="logout-icon">🚪</span>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Cargando tu colección de música...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Error al cargar las canciones</h3>
              <p>{error}</p>
              <button onClick={loadSongs} className="retry-button">
                Intentar de nuevo
              </button>
            </div>
          ) : songs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h3>Tu colección está vacía</h3>
              <p>Comienza agregando tu primera canción a la colección</p>
              <button className="add-first-song-button" onClick={handleAddSong}>
                <span className="button-icon">➕</span>
                Agregar Primera Canción
              </button>
            </div>
          ) : (
            <div className="music-content">
              <div className="content-header">
                <h2>Tu Biblioteca Musical</h2>
                <div className="content-actions">
                  <button className="action-button primary" onClick={handleAddSong}>
                    <span className="button-icon">➕</span>
                    Agregar Canción
                  </button>
                </div>
              </div>

              <SearchComponent songs={songs} onSearchResults={handleSearchResults} />

              {filteredSongs.length === 0 && songs.length > 0 ? (
                <div className="no-results-state">
                  <div className="no-results-icon">🔍</div>
                  <h3>No se encontraron resultados</h3>
                  <p>No hay canciones que coincidan con tu búsqueda.</p>
                  <p>Intenta con otros términos o revisa la ortografía.</p>
                </div>
              ) : (
                <MusicList
                  songs={filteredSongs}
                  onEdit={handleEditSong}
                  onDelete={handleDeleteSong}
                  isLoading={isLoading}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {showMusicForm && (
        <MusicForm
          song={editingSong || undefined}
          onSave={handleFormSubmit}
          onCancel={handleFormClose}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

export default MusicDashboard
