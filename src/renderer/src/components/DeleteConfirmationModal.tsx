import React from 'react'
import { Song } from '../../../preload/index.d'
import './DeleteConfirmationModal.css'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  song: Song | null
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  song,
  onConfirm,
  onCancel,
  isDeleting = false
}) => {
  if (!isOpen || !song) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Enter' && !isDeleting) {
      onConfirm()
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="modal-content delete-modal">
        <div className="modal-header">
          <div className="modal-icon delete-icon">🗑️</div>
          <h3 className="modal-title">Confirmar eliminación</h3>
        </div>

        <div className="modal-body">
          <p className="confirmation-message">
            ¿Estás seguro de que quieres eliminar esta canción?
          </p>

          <div className="song-preview">
            <div className="song-cover">
              {song.portadaAlbum ? (
                <img
                  src={song.portadaAlbum}
                  alt={`Portada de ${song.album}`}
                  className="preview-cover"
                />
              ) : (
                <div className="preview-cover-placeholder">🎵</div>
              )}
            </div>
            <div className="song-details">
              <h4 className="song-title">{song.titulo}</h4>
              <p className="song-artist">{song.artista}</p>
              <p className="song-album">{song.album}</p>
            </div>
          </div>

          <div className="warning-message">
            <span className="warning-icon">⚠️</span>
            Esta acción no se puede deshacer.
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-button cancel" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button className="modal-button delete" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <span className="loading-spinner small"></span>
                Eliminando...
              </>
            ) : (
              <>
                <span className="button-icon">🗑️</span>
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal
