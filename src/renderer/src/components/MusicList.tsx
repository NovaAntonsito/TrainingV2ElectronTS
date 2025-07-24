import React, { useState } from 'react'
import { Song } from '../../../preload/index.d'
import './MusicList.css'

interface MusicListProps {
  songs: Song[]
  onEdit: (song: Song) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

const MusicList: React.FC<MusicListProps> = ({ songs, onEdit, onDelete, isLoading = false }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Calculate pagination
  const totalPages = Math.ceil(songs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSongs = songs.slice(startIndex, endIndex)

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handlePageChange = (page: number): void => {
    setCurrentPage(page)
  }

  const handleEdit = (song: Song): void => {
    onEdit(song)
  }

  const handleDelete = (id: string): void => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta canción?')) {
      onDelete(id)
    }
  }

  const renderPagination = (): React.ReactNode => {
    if (totalPages <= 1) return null

    const pages: React.ReactNode[] = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹
      </button>
    )

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      )
    }

    // Next button
    pages.push(
      <button
        key="next"
        className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        ›
      </button>
    )

    return (
      <div className="pagination">
        <div className="pagination-info">
          Mostrando {startIndex + 1}-{Math.min(endIndex, songs.length)} de {songs.length} canciones
        </div>
        <div className="pagination-controls">{pages}</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="music-list-loading">
        <div className="loading-spinner"></div>
        <p>Cargando canciones...</p>
      </div>
    )
  }

  if (songs.length === 0) {
    return (
      <div className="music-list-empty">
        <div className="empty-icon">🎵</div>
        <h3>No hay canciones</h3>
        <p>Tu colección está vacía. Agrega tu primera canción para comenzar.</p>
      </div>
    )
  }

  return (
    <div className="music-list">
      <div className="music-list-header">
        <div className="list-info">
          <h3>Canciones ({songs.length})</h3>
        </div>
        <div className="list-controls">
          <div className="view-toggle">
            <button
              className={`view-button ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Vista de tabla"
            >
              📋
            </button>
            <button
              className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula"
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="music-table-container">
          <table className="music-table">
            <thead>
              <tr>
                <th>Portada</th>
                <th>Título</th>
                <th>Artista</th>
                <th>Álbum</th>
                <th>Duración</th>
                <th>Preview</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentSongs.map((song) => (
                <tr key={song.id} className="music-row">
                  <td className="cover-cell">
                    {song.portadaAlbum ? (
                      <img
                        src={song.portadaAlbum}
                        alt={`Portada de ${song.album}`}
                        className="album-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div className={`cover-placeholder ${song.portadaAlbum ? 'hidden' : ''}`}>
                      🎵
                    </div>
                  </td>
                  <td className="title-cell">
                    <div className="song-title">{song.titulo}</div>
                  </td>
                  <td className="artist-cell">{song.artista}</td>
                  <td className="album-cell">{song.album}</td>
                  <td className="duration-cell">{formatDuration(song.duracion)}</td>
                  <td className="preview-cell">
                    {song.previewMusica ? (
                      <audio controls className="audio-preview">
                        <source src={song.previewMusica} type="audio/mpeg" />
                        Tu navegador no soporta el elemento de audio.
                      </audio>
                    ) : (
                      <span className="no-preview">Sin preview</span>
                    )}
                  </td>
                  <td className="date-cell">{formatDate(song.createdAt)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="action-button edit"
                        onClick={() => handleEdit(song)}
                        title="Editar canción"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-button delete"
                        onClick={() => handleDelete(song.id)}
                        title="Eliminar canción"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="music-grid">
          {currentSongs.map((song) => (
            <div key={song.id} className="music-card">
              <div className="card-cover">
                {song.portadaAlbum ? (
                  <img
                    src={song.portadaAlbum}
                    alt={`Portada de ${song.album}`}
                    className="card-album-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={`card-cover-placeholder ${song.portadaAlbum ? 'hidden' : ''}`}>
                  🎵
                </div>
                <div className="card-overlay">
                  <div className="card-actions">
                    <button
                      className="card-action-button edit"
                      onClick={() => handleEdit(song)}
                      title="Editar canción"
                    >
                      ✏️
                    </button>
                    <button
                      className="card-action-button delete"
                      onClick={() => handleDelete(song.id)}
                      title="Eliminar canción"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-content">
                <h4 className="card-title">{song.titulo}</h4>
                <p className="card-artist">{song.artista}</p>
                <p className="card-album">{song.album}</p>
                <div className="card-details">
                  <span className="card-duration">{formatDuration(song.duracion)}</span>
                  <span className="card-date">{formatDate(song.createdAt)}</span>
                </div>
                {song.previewMusica && (
                  <div className="card-preview">
                    <audio controls className="card-audio">
                      <source src={song.previewMusica} type="audio/mpeg" />
                    </audio>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {renderPagination()}
    </div>
  )
}

export default MusicList
