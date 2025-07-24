import React, { useState, useEffect } from 'react'
import { Song, CreateSongDto, UpdateSongDto } from '../../../preload/index.d'
import AlbumCover from './AlbumCover'
import './MusicForm.css'
import './AlbumCover.css'

interface MusicFormProps {
  song?: Song // undefined para crear, Song para editar
  onSave: (songData: CreateSongDto | UpdateSongDto) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

interface FormData {
  titulo: string
  album: string
  artista: string
  duracion: string // String for input handling, converted to number on submit
  portadaAlbum: string
  previewMusica: string
}

interface ValidationErrors {
  titulo?: string
  album?: string
  artista?: string
  duracion?: string
  portadaAlbum?: string
  previewMusica?: string
}

const MusicForm: React.FC<MusicFormProps> = ({ song, onSave, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    album: '',
    artista: '',
    duracion: '',
    portadaAlbum: '',
    previewMusica: ''
  })

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string>('')
  const [imageLoadError, setImageLoadError] = useState<string>('')

  const isEditMode = !!song

  // Initialize form data when song prop changes
  useEffect(() => {
    if (song) {
      setFormData({
        titulo: song.titulo,
        album: song.album,
        artista: song.artista,
        duracion: song.duracion.toString(),
        portadaAlbum: song.portadaAlbum || '',
        previewMusica: song.previewMusica || ''
      })
    } else {
      setFormData({
        titulo: '',
        album: '',
        artista: '',
        duracion: '',
        portadaAlbum: '',
        previewMusica: ''
      })
    }

    setValidationErrors({})
    setGeneralError('')
  }, [song])

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    // Required field validation: titulo
    if (!formData.titulo.trim()) {
      errors.titulo = 'El título es requerido'
    } else if (formData.titulo.trim().length < 1) {
      errors.titulo = 'El título no puede estar vacío'
    } else if (formData.titulo.trim().length > 200) {
      errors.titulo = 'El título no puede exceder 200 caracteres'
    }

    // Required field validation: album
    if (!formData.album.trim()) {
      errors.album = 'El álbum es requerido'
    } else if (formData.album.trim().length < 1) {
      errors.album = 'El álbum no puede estar vacío'
    } else if (formData.album.trim().length > 200) {
      errors.album = 'El álbum no puede exceder 200 caracteres'
    }

    // Required field validation: artista
    if (!formData.artista.trim()) {
      errors.artista = 'El artista es requerido'
    } else if (formData.artista.trim().length < 1) {
      errors.artista = 'El artista no puede estar vacío'
    } else if (formData.artista.trim().length > 200) {
      errors.artista = 'El artista no puede exceder 200 caracteres'
    }

    // Required field validation: duracion (must be positive number)
    if (!formData.duracion.trim()) {
      errors.duracion = 'La duración es requerida'
    } else {
      const duracionNum = parseFloat(formData.duracion)
      if (isNaN(duracionNum)) {
        errors.duracion = 'La duración debe ser un número válido'
      } else if (duracionNum <= 0) {
        errors.duracion = 'La duración debe ser un número positivo'
      } else if (duracionNum > 86400) {
        // 24 hours in seconds
        errors.duracion = 'La duración no puede exceder 24 horas (86400 segundos)'
      } else if (duracionNum < 0.1) {
        errors.duracion = 'La duración debe ser al menos 0.1 segundos'
      }
    }

    // Optional URL validation for portadaAlbum
    if (formData.portadaAlbum.trim()) {
      if (!isValidUrl(formData.portadaAlbum.trim())) {
        errors.portadaAlbum = 'Debe ser una URL válida (ej: https://ejemplo.com/imagen.jpg)'
      } else if (!isImageUrl(formData.portadaAlbum.trim())) {
        errors.portadaAlbum = 'La URL debe apuntar a una imagen válida o ser de Spotify'
      }
    }

    // Optional URL validation for previewMusica
    if (formData.previewMusica.trim() && !isValidUrl(formData.previewMusica.trim())) {
      errors.previewMusica = 'Debe ser una URL válida (ej: https://ejemplo.com/audio.mp3)'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const isImageUrl = (url: string): boolean => {
    if (!isValidUrl(url)) return false
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    const urlLower = url.toLowerCase()
    return (
      imageExtensions.some((ext) => urlLower.includes(ext)) ||
      urlLower.includes('scdn.co') || // Spotify CDN
      urlLower.includes('image')
    ) // Generic image indicator
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

    // Real-time validation for specific fields with enhanced error messages
    const errors: ValidationErrors = { ...validationErrors }

    if (name === 'titulo') {
      if (!value.trim()) {
        errors.titulo = 'El título es requerido'
      } else if (value.trim().length < 1) {
        errors.titulo = 'El título no puede estar vacío'
      } else if (value.trim().length > 200) {
        errors.titulo = 'El título no puede exceder 200 caracteres'
      } else {
        delete errors.titulo
      }
    } else if (name === 'album') {
      if (!value.trim()) {
        errors.album = 'El álbum es requerido'
      } else if (value.trim().length < 1) {
        errors.album = 'El álbum no puede estar vacío'
      } else if (value.trim().length > 200) {
        errors.album = 'El álbum no puede exceder 200 caracteres'
      } else {
        delete errors.album
      }
    } else if (name === 'artista') {
      if (!value.trim()) {
        errors.artista = 'El artista es requerido'
      } else if (value.trim().length < 1) {
        errors.artista = 'El artista no puede estar vacío'
      } else if (value.trim().length > 200) {
        errors.artista = 'El artista no puede exceder 200 caracteres'
      } else {
        delete errors.artista
      }
    } else if (name === 'duracion') {
      if (!value.trim()) {
        errors.duracion = 'La duración es requerida'
      } else {
        const duracionNum = parseFloat(value)
        if (isNaN(duracionNum)) {
          errors.duracion = 'La duración debe ser un número válido'
        } else if (duracionNum <= 0) {
          errors.duracion = 'La duración debe ser un número positivo'
        } else if (duracionNum < 0.1) {
          errors.duracion = 'La duración debe ser al menos 0.1 segundos'
        } else if (duracionNum > 86400) {
          errors.duracion = 'La duración no puede exceder 24 horas (86400 segundos)'
        } else {
          delete errors.duracion
        }
      }
    } else if (name === 'portadaAlbum') {
      if (value.trim()) {
        if (!isValidUrl(value.trim())) {
          errors.portadaAlbum = 'Debe ser una URL válida (ej: https://ejemplo.com/imagen.jpg)'
        } else if (!isImageUrl(value.trim())) {
          errors.portadaAlbum = 'La URL debe apuntar a una imagen válida o ser de Spotify'
        } else {
          delete errors.portadaAlbum
        }
      } else {
        delete errors.portadaAlbum
      }
    } else if (name === 'previewMusica') {
      if (value.trim() && !isValidUrl(value.trim())) {
        errors.previewMusica = 'Debe ser una URL válida (ej: https://ejemplo.com/audio.mp3)'
      } else {
        delete errors.previewMusica
      }
    }

    setValidationErrors(errors)

    // Clear general error when user makes changes
    if (generalError) {
      setGeneralError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    // Clear any previous general errors
    setGeneralError('')

    // Validate form before submission
    if (!validateForm()) {
      setGeneralError('Por favor, corrige los errores en el formulario antes de continuar.')
      return
    }

    setIsSubmitting(true)

    try {
      const portadaAlbumData = formData.portadaAlbum.trim() || undefined
      const previewMusicaData = formData.previewMusica.trim() || undefined

      // Final validation of processed data
      const songData = {
        titulo: formData.titulo.trim(),
        album: formData.album.trim(),
        artista: formData.artista.trim(),
        duracion: parseFloat(formData.duracion),
        portadaAlbum: portadaAlbumData,
        previewMusica: previewMusicaData
      }

      // Validate that required fields are not empty after trimming
      if (!songData.titulo || !songData.album || !songData.artista || isNaN(songData.duracion)) {
        setGeneralError('Todos los campos requeridos deben estar completos.')
        return
      }

      await onSave(songData)
    } catch (error) {
      console.error('Error saving song:', error)
      if (error instanceof Error) {
        setGeneralError(`Error al guardar la canción: ${error.message}`)
      } else {
        setGeneralError('Error al guardar la canción. Por favor, intenta nuevamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (!isSubmitting) {
      onCancel()
    }
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="music-form-container">
      <div className="music-form-card">
        <div className="form-header">
          <h2>{isEditMode ? 'Editar Canción' : 'Agregar Nueva Canción'}</h2>
          <p>
            {isEditMode
              ? 'Modifica los datos de la canción'
              : 'Completa la información de la nueva canción'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="music-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="titulo">
                Título <span className="required">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                className={validationErrors.titulo ? 'error' : ''}
                disabled={isSubmitting || isLoading}
                placeholder="Ingresa el título de la canción"
                maxLength={200}
              />
              {validationErrors.titulo && (
                <span className="error-message">{validationErrors.titulo}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="artista">
                Artista <span className="required">*</span>
              </label>
              <input
                type="text"
                id="artista"
                name="artista"
                value={formData.artista}
                onChange={handleInputChange}
                className={validationErrors.artista ? 'error' : ''}
                disabled={isSubmitting || isLoading}
                placeholder="Ingresa el nombre del artista"
                maxLength={200}
              />
              {validationErrors.artista && (
                <span className="error-message">{validationErrors.artista}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="album">
                Álbum <span className="required">*</span>
              </label>
              <input
                type="text"
                id="album"
                name="album"
                value={formData.album}
                onChange={handleInputChange}
                className={validationErrors.album ? 'error' : ''}
                disabled={isSubmitting || isLoading}
                placeholder="Ingresa el nombre del álbum"
                maxLength={200}
              />
              {validationErrors.album && (
                <span className="error-message">{validationErrors.album}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="duracion">
                Duración (segundos) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="duracion"
                name="duracion"
                value={formData.duracion}
                onChange={handleInputChange}
                className={validationErrors.duracion ? 'error' : ''}
                disabled={isSubmitting || isLoading}
                placeholder="Ej: 180"
                min="1"
                step="0.1"
              />
              {formData.duracion && !validationErrors.duracion && (
                <span className="duration-preview">
                  Duración: {formatDuration(parseFloat(formData.duracion) || 0)}
                </span>
              )}
              {validationErrors.duracion && (
                <span className="error-message">{validationErrors.duracion}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="portadaAlbum">Portada del Álbum</label>
            <input
              type="url"
              id="portadaAlbum"
              name="portadaAlbum"
              value={formData.portadaAlbum}
              onChange={handleInputChange}
              className={validationErrors.portadaAlbum ? 'error' : ''}
              disabled={isSubmitting || isLoading}
              placeholder="https://ejemplo.com/portada.jpg"
            />
            {validationErrors.portadaAlbum && (
              <span className="error-message">{validationErrors.portadaAlbum}</span>
            )}
            {formData.portadaAlbum && !validationErrors.portadaAlbum && (
              <div className="image-preview">
                <AlbumCover
                  src={formData.portadaAlbum}
                  alt="Vista previa de la portada"
                  albumName={formData.album || 'Álbum'}
                  artistName={formData.artista || 'Artista'}
                  size="medium"
                  className="form-preview-cover"
                  onError={() => {
                    setImageLoadError(
                      'No se pudo cargar la imagen. Se mostrará un marcador de posición.'
                    )
                    console.log('Error loading album cover preview for URL:', formData.portadaAlbum)
                  }}
                  onLoad={() => {
                    setImageLoadError('')
                    console.log(
                      'Album cover preview loaded successfully for URL:',
                      formData.portadaAlbum
                    )
                  }}
                />
                {imageLoadError && (
                  <div className="image-load-info">
                    <span className="info-icon">ℹ️</span>
                    {imageLoadError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="previewMusica">Preview de Música</label>
            <input
              type="url"
              id="previewMusica"
              name="previewMusica"
              value={formData.previewMusica}
              onChange={handleInputChange}
              className={validationErrors.previewMusica ? 'error' : ''}
              disabled={isSubmitting || isLoading}
              placeholder="https://ejemplo.com/preview.mp3"
            />
            {validationErrors.previewMusica && (
              <span className="error-message">{validationErrors.previewMusica}</span>
            )}
            {formData.previewMusica && !validationErrors.previewMusica && (
              <div className="audio-preview">
                <audio controls>
                  <source src={formData.previewMusica} type="audio/mpeg" />
                  Tu navegador no soporta el elemento de audio.
                </audio>
              </div>
            )}
          </div>

          {generalError && <div className="error-banner">{generalError}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button"
              disabled={isSubmitting || isLoading}
            >
              Cancelar
            </button>
            <button type="submit" className="save-button" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  {isEditMode ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                <>
                  <span className="save-icon">{isEditMode ? '✏️' : '💾'}</span>
                  {isEditMode ? 'Actualizar Canción' : 'Guardar Canción'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MusicForm
