import React, { useState, useEffect } from 'react'
import {
  isSpotifyImageUrl,
  loadImageWithFallback,
  generatePlaceholderImage,
  ImageError,
  ImageErrorCallback,
  ImageSuccessCallback,
  getUserFriendlyErrorMessage,
  getSuggestedAction,
  logImageDebuggingInfo
} from '../utils/imageUtils'

interface AlbumCoverProps {
  src?: string
  alt: string
  albumName: string
  artistName: string
  className?: string
  size?: 'small' | 'medium' | 'large'
  onError?: ImageErrorCallback
  onLoad?: ImageSuccessCallback
  showErrorDetails?: boolean // For debugging purposes
  enableRetry?: boolean // Allow manual retry
}

const AlbumCover: React.FC<AlbumCoverProps> = ({
  src,
  alt,
  albumName,
  artistName,
  className = '',
  size = 'medium',
  onError,
  onLoad,
  showErrorDetails = false,
  enableRetry = true
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error' | 'placeholder'>(
    'loading'
  )
  const [imageSrc, setImageSrc] = useState<string>('')
  const [placeholderSrc, setPlaceholderSrc] = useState<string>('')
  const [lastError, setLastError] = useState<ImageError | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)

  const loadImage = (url: string, isRetry = false) => {
    if (isRetry) {
      setRetryCount((prev) => prev + 1)
      logImageDebuggingInfo('Manual retry attempt', {
        url: url.substring(0, 50) + '...',
        retryCount: retryCount + 1,
        albumName,
        artistName
      })
    }

    setImageState('loading')
    setLastError(null)
    let isCancelled = false

    // Enhanced error callback
    const handleError: ImageErrorCallback = (error) => {
      if (isCancelled) return

      setLastError(error)
      setImageState('error')

      // Log detailed error information
      logImageDebuggingInfo('AlbumCover image load error', {
        error,
        albumName,
        artistName,
        componentRetryCount: retryCount,
        userFriendlyMessage: getUserFriendlyErrorMessage(error),
        suggestedAction: getSuggestedAction(error)
      })

      onError?.(error)
    }

    // Enhanced success callback
    const handleSuccess: ImageSuccessCallback = (loadedUrl, loadTime) => {
      if (isCancelled) return

      setImageSrc(loadedUrl)
      setImageState('loaded')
      setLastError(null)

      logImageDebuggingInfo('AlbumCover image load success', {
        url: loadedUrl.substring(0, 50) + '...',
        loadTime: `${loadTime}ms`,
        albumName,
        artistName,
        componentRetryCount: retryCount
      })

      onLoad?.(loadedUrl, loadTime)
    }

    // Try to load the image with enhanced callbacks
    loadImageWithFallback(url, 8000, 2, handleError, handleSuccess).then((result) => {
      if (isCancelled) return

      if (!result.success && result.error) {
        // Additional handling if needed
        logImageDebuggingInfo('AlbumCover final load result', {
          success: false,
          error: result.error,
          albumName,
          artistName
        })
      }
    })

    return () => {
      isCancelled = true
    }
  }

  useEffect(() => {
    if (!src) {
      setImageState('placeholder')
      setLastError(null)
      return
    }

    const cleanup = loadImage(src)
    return cleanup
  }, [src])

  useEffect(() => {
    // Generate placeholder image with error handling
    const handlePlaceholderError: ImageErrorCallback = (error) => {
      logImageDebuggingInfo('Placeholder generation error', {
        error,
        albumName,
        artistName
      })
    }

    const placeholder = generatePlaceholderImage(albumName, artistName, handlePlaceholderError)
    setPlaceholderSrc(placeholder)
  }, [albumName, artistName])

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'album-cover-small'
      case 'large':
        return 'album-cover-large'
      default:
        return 'album-cover-medium'
    }
  }

  const handleImageError = () => {
    const error: ImageError = {
      type: 'LOAD_ERROR' as any,
      message: 'Image element error event',
      url: imageSrc,
      timestamp: Date.now(),
      userFriendlyMessage: 'Image could not be displayed',
      canRetry: true,
      suggestedAction: 'Try refreshing or use a different image'
    }

    logImageDebuggingInfo('AlbumCover img element error', {
      url: imageSrc.substring(0, 50) + '...',
      albumName,
      artistName,
      error: 'img.onerror triggered'
    })

    setLastError(error)
    setImageState('error')
    onError?.(error)
  }

  const handleImageLoad = () => {
    setImageState('loaded')
    setLastError(null)
    onLoad?.(imageSrc, 0) // Load time not available from img element
  }

  const handleRetry = () => {
    if (src && enableRetry) {
      loadImage(src, true)
    }
  }

  if (imageState === 'loading') {
    return (
      <div className={`album-cover-container ${getSizeClass()} ${className}`}>
        <div className="album-cover-loading">
          <div className="loading-spinner-small"></div>
        </div>
      </div>
    )
  }

  if (imageState === 'loaded' && imageSrc) {
    return (
      <div className={`album-cover-container ${getSizeClass()} ${className}`}>
        <img
          src={imageSrc}
          alt={alt}
          className="album-cover-image"
          crossOrigin={isSpotifyImageUrl(imageSrc) ? 'anonymous' : undefined}
          referrerPolicy={isSpotifyImageUrl(imageSrc) ? 'no-referrer' : undefined}
          onError={handleImageError}
          onLoad={handleImageLoad}
          tabIndex={-1}
        />
      </div>
    )
  }

  // Show placeholder for error or no src with enhanced error information
  return (
    <div className={`album-cover-container ${getSizeClass()} ${className}`}>
      {placeholderSrc ? (
        <img
          src={placeholderSrc}
          alt={alt}
          className="album-cover-placeholder-image"
          tabIndex={-1}
        />
      ) : (
        <div className="album-cover-fallback" role="img" aria-label={alt}>
          <span className="music-icon" aria-hidden="true">
            🎵
          </span>
          <div className="album-info">
            <div className="album-name">
              {albumName.length > 15 ? albumName.substring(0, 12) + '...' : albumName}
            </div>
            <div className="artist-name">
              {artistName.length > 18 ? artistName.substring(0, 15) + '...' : artistName}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced error information for debugging */}
      {imageState === 'error' && lastError && showErrorDetails && (
        <div
          className="album-cover-error-details"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            fontSize: '10px',
            padding: '2px',
            zIndex: 1000
          }}
        >
          <div>Error: {getUserFriendlyErrorMessage(lastError)}</div>
          {enableRetry && (
            <button
              onClick={handleRetry}
              style={{
                fontSize: '10px',
                padding: '1px 4px',
                marginTop: '2px',
                background: 'white',
                color: 'red',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Retry ({retryCount})
            </button>
          )}
        </div>
      )}

      {/* Retry button for error state (when not showing details) */}
      {imageState === 'error' && enableRetry && !showErrorDetails && lastError?.canRetry && (
        <div
          className="album-cover-retry"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}
        >
          <button
            onClick={handleRetry}
            style={{
              fontSize: '12px',
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title={getSuggestedAction(lastError)}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

export default AlbumCover
