/**
 * Utility functions for handling images, especially from external sources like Spotify
 */

// Error types for better error handling
export enum ImageErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INVALID_URL = 'INVALID_URL',
  LOAD_ERROR = 'LOAD_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ImageError {
  type: ImageErrorType
  message: string
  url: string
  timestamp: number
  retryCount?: number
  loadTime?: number
  isSpotify?: boolean
  httpStatus?: number
  userFriendlyMessage?: string
  canRetry?: boolean
  suggestedAction?: string
}

// Error callback interface for parent components
export interface ImageErrorCallback {
  (error: ImageError): void
}

// Success callback interface for parent components
export interface ImageSuccessCallback {
  (url: string, loadTime: number): void
}

// Enhanced logging utility for image operations
const logImageOperation = (
  operation: string,
  url: string,
  details?: Record<string, unknown>
): void => {
  const timestamp = new Date().toISOString()
  const safeUrl =
    typeof url === 'string' ? url.substring(0, 100) + (url.length > 100 ? '...' : '') : String(url)
  console.log(`[ImageUtils] ${timestamp} ${operation}:`, {
    url: safeUrl,
    ...details
  })
}

const logImageError = (
  operation: string,
  url: string,
  error: unknown,
  errorType?: ImageErrorType
): void => {
  const timestamp = new Date().toISOString()
  const safeUrl =
    typeof url === 'string' ? url.substring(0, 100) + (url.length > 100 ? '...' : '') : String(url)
  console.error(`[ImageUtils] ${timestamp} ${operation} failed:`, {
    url: safeUrl,
    errorType: errorType || ImageErrorType.UNKNOWN_ERROR,
    error: typeof error === 'object' ? JSON.stringify(error, null, 2) : error
  })
}

const logImageWarning = (operation: string, url: string, warning: unknown): void => {
  const timestamp = new Date().toISOString()
  const safeUrl =
    typeof url === 'string' ? url.substring(0, 100) + (url.length > 100 ? '...' : '') : String(url)
  console.warn(`[ImageUtils] ${timestamp} ${operation} warning:`, {
    url: safeUrl,
    warning
  })
}

/**
 * Gets user-friendly error message from ImageError
 */
export const getUserFriendlyErrorMessage = (error: ImageError): string => {
  // Return cached user-friendly message if available
  if (error.userFriendlyMessage) {
    return error.userFriendlyMessage
  }

  switch (error.type) {
    case ImageErrorType.CORS_ERROR:
      return error.isSpotify
        ? 'Spotify image temporarily unavailable'
        : 'Image temporarily unavailable due to security restrictions'
    case ImageErrorType.NETWORK_ERROR:
      return 'Unable to connect to image server'
    case ImageErrorType.TIMEOUT_ERROR:
      return 'Image loading took too long'
    case ImageErrorType.INVALID_URL:
      return 'Invalid image address'
    case ImageErrorType.LOAD_ERROR:
      return 'Image could not be displayed'
    case ImageErrorType.SERVER_ERROR:
      return 'Image server is currently unavailable'
    default:
      return 'Image temporarily unavailable'
  }
}

/**
 * Gets suggested action for error recovery
 */
export const getSuggestedAction = (error: ImageError): string => {
  if (error.suggestedAction) {
    return error.suggestedAction
  }

  switch (error.type) {
    case ImageErrorType.CORS_ERROR:
      return error.isSpotify
        ? 'Try using a different image URL or upload the image directly'
        : 'Try using a different image source'
    case ImageErrorType.NETWORK_ERROR:
      return 'Check your internet connection and try again'
    case ImageErrorType.TIMEOUT_ERROR:
      return 'Try again or use a different image'
    case ImageErrorType.INVALID_URL:
      return 'Please enter a valid image URL'
    case ImageErrorType.LOAD_ERROR:
      return 'Try a different image or check the URL'
    case ImageErrorType.SERVER_ERROR:
      return 'Try again later or use a different image'
    default:
      return 'Try again or use a different image'
  }
}

/**
 * Determines if an error is retryable
 */
export const isRetryableError = (error: ImageError): boolean => {
  if (error.canRetry !== undefined) {
    return error.canRetry
  }

  switch (error.type) {
    case ImageErrorType.NETWORK_ERROR:
    case ImageErrorType.TIMEOUT_ERROR:
    case ImageErrorType.SERVER_ERROR:
    case ImageErrorType.LOAD_ERROR:
      return true
    case ImageErrorType.CORS_ERROR:
    case ImageErrorType.INVALID_URL:
      return false
    default:
      return false
  }
}

/**
 * Checks if a URL is from Spotify's CDN
 */
export const isSpotifyImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    logImageWarning('Spotify URL detection', url, 'Empty or invalid URL provided')
    return false
  }

  try {
    const isSpotify = url.includes('i.scdn.co') || url.includes('mosaic.scdn.co')
    logImageOperation('Spotify URL detection', url, { isSpotify })
    return isSpotify
  } catch (error) {
    logImageError('Spotify URL detection', url, error, ImageErrorType.UNKNOWN_ERROR)
    return false
  }
}

/**
 * Attempts to convert a Spotify URL to a more accessible format
 * This is a fallback approach since Spotify images have CORS restrictions
 */
export const processImageUrl = (url: string): { processedUrl: string; error?: ImageError } => {
  if (!url || typeof url !== 'string') {
    const error: ImageError = {
      type: ImageErrorType.INVALID_URL,
      message: 'Empty or invalid URL provided',
      url: url || '',
      timestamp: Date.now(),
      userFriendlyMessage: 'Invalid image address',
      canRetry: false,
      suggestedAction: 'Please enter a valid image URL'
    }
    logImageWarning('URL processing', url, 'Empty or invalid URL provided')
    return { processedUrl: url, error }
  }

  try {
    // For Spotify URLs, we'll try to use them directly but with proper headers
    if (isSpotifyImageUrl(url)) {
      logImageOperation('URL processing', url, { type: 'Spotify', result: 'using original URL' })
      return { processedUrl: url }
    }

    // For other URLs, validate basic format
    try {
      new URL(url)
      logImageOperation('URL processing', url, { type: 'external', result: 'valid URL format' })
      return { processedUrl: url }
    } catch {
      const error: ImageError = {
        type: ImageErrorType.INVALID_URL,
        message: 'Invalid URL format',
        url,
        timestamp: Date.now(),
        userFriendlyMessage: 'Invalid image address',
        canRetry: false,
        suggestedAction: 'Please enter a valid image URL'
      }
      logImageError('URL processing', url, 'Invalid URL format', ImageErrorType.INVALID_URL)
      return { processedUrl: url, error }
    }
  } catch (error) {
    const imageError: ImageError = {
      type: ImageErrorType.UNKNOWN_ERROR,
      message: 'Unknown error during URL processing',
      url,
      timestamp: Date.now(),
      userFriendlyMessage: 'Image temporarily unavailable',
      canRetry: false,
      suggestedAction: 'Try again or use a different image'
    }
    logImageError('URL processing', url, error, ImageErrorType.UNKNOWN_ERROR)
    return { processedUrl: url, error: imageError }
  }
}

/**
 * Creates an image loading promise with timeout, retry logic, and comprehensive error handling
 */
export const loadImageWithFallback = (
  url: string,
  timeout = 8000,
  maxRetries = 2,
  onError?: ImageErrorCallback,
  onSuccess?: ImageSuccessCallback
): Promise<{ success: boolean; error?: ImageError }> => {
  return new Promise((resolve) => {
    // First validate the URL
    const urlValidation = processImageUrl(url)
    if (urlValidation.error) {
      logImageError('Image loading', url, urlValidation.error.message, urlValidation.error.type)
      onError?.(urlValidation.error)
      resolve({ success: false, error: urlValidation.error })
      return
    }

    const attemptLoad = (retryCount = 0): void => {
      const img = new Image()
      let timeoutId: NodeJS.Timeout | undefined
      const startTime = Date.now()

      const cleanup = (): void => {
        if (timeoutId) clearTimeout(timeoutId)
        img.onload = null
        img.onerror = null
      }

      img.onload = () => {
        const loadTime = Date.now() - startTime
        cleanup()
        logImageOperation('Image loading success', url, {
          loadTime: `${loadTime}ms`,
          retryCount,
          isSpotify: isSpotifyImageUrl(url),
          finalAttempt: retryCount === maxRetries
        })
        onSuccess?.(url, loadTime)
        resolve({ success: true })
      }

      img.onerror = (event) => {
        const loadTime = Date.now() - startTime
        cleanup()

        // Determine error type based on the event and context
        let errorType = ImageErrorType.LOAD_ERROR
        let errorMessage = 'Failed to load image'
        let httpStatus: number | undefined
        let canRetry = true

        const isSpotify = isSpotifyImageUrl(url)

        // Enhanced error detection
        let userFriendlyMessage: string
        let suggestedAction: string

        if (isSpotify) {
          errorType = ImageErrorType.CORS_ERROR
          errorMessage = 'CORS restriction prevented image loading (Spotify CDN)'
          userFriendlyMessage = 'Spotify image temporarily unavailable'
          suggestedAction = 'Try using a different image URL or upload the image directly'
          canRetry = false
        } else {
          // Try to determine if it's a network vs server error
          const errorEvent = event as ErrorEvent
          if (errorEvent && errorEvent.message) {
            if (errorEvent.message.includes('network') || errorEvent.message.includes('fetch')) {
              errorType = ImageErrorType.NETWORK_ERROR
              errorMessage = 'Network error while loading image'
              userFriendlyMessage = 'Unable to connect to image server'
              suggestedAction = 'Check your internet connection and try again'
            } else if (
              errorEvent.message.includes('404') ||
              errorEvent.message.includes('not found')
            ) {
              errorType = ImageErrorType.SERVER_ERROR
              errorMessage = 'Image not found on server (404)'
              userFriendlyMessage = 'Image not found'
              suggestedAction = 'Check the image URL or try a different image'
              httpStatus = 404
              canRetry = false
            } else if (
              errorEvent.message.includes('500') ||
              errorEvent.message.includes('server error')
            ) {
              errorType = ImageErrorType.SERVER_ERROR
              errorMessage = 'Server error while loading image (500)'
              userFriendlyMessage = 'Image server is currently unavailable'
              suggestedAction = 'Try again later or use a different image'
              httpStatus = 500
            } else {
              userFriendlyMessage = 'Image could not be displayed'
              suggestedAction = 'Try a different image or check the URL'
            }
          } else {
            userFriendlyMessage = 'Image could not be displayed'
            suggestedAction = 'Try a different image or check the URL'
          }
        }

        const error: ImageError = {
          type: errorType,
          message: errorMessage,
          url,
          timestamp: Date.now(),
          retryCount,
          loadTime,
          isSpotify,
          httpStatus,
          userFriendlyMessage,
          canRetry,
          suggestedAction
        }

        logImageError(
          'Image loading error',
          url,
          {
            errorType,
            event: event
              ? {
                  type: (event as Event).type,
                  message: (event as ErrorEvent).message,
                  target: (event as Event & { target?: { src?: string } }).target?.src
                }
              : 'no event details',
            loadTime: `${loadTime}ms`,
            retryCount,
            isSpotify,
            httpStatus,
            canRetry,
            finalAttempt: retryCount >= maxRetries
          },
          errorType
        )

        // Enhanced retry logic for transient failures
        if (retryCount < maxRetries && isRetryableError(error)) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000) // Exponential backoff, max 5s
          logImageWarning('Image loading retry', url, {
            reason: `Retryable error: ${errorType}`,
            retryDelay: `${retryDelay}ms`,
            attempt: `${retryCount + 1}/${maxRetries + 1}`,
            nextRetryIn: `${retryDelay}ms`
          })

          setTimeout(() => {
            attemptLoad(retryCount + 1)
          }, retryDelay)
        } else {
          // Log final failure
          if (retryCount >= maxRetries) {
            logImageError(
              'Image loading final failure',
              url,
              {
                reason: 'Max retries exceeded',
                totalAttempts: retryCount + 1,
                totalTime: `${Date.now() - startTime}ms`,
                finalError: errorType
              },
              errorType
            )
          }
          onError?.(error)
          resolve({ success: false, error })
        }
      }

      // Set timeout with enhanced error handling
      timeoutId = setTimeout(
        () => {
          const loadTime = Date.now() - startTime
          cleanup()

          const isSpotify = isSpotifyImageUrl(url)
          const error: ImageError = {
            type: ImageErrorType.TIMEOUT_ERROR,
            message: `Image loading timed out after ${timeout}ms`,
            url,
            timestamp: Date.now(),
            retryCount,
            loadTime,
            isSpotify,
            userFriendlyMessage: 'Image loading took too long',
            canRetry: true,
            suggestedAction: 'Try again or use a different image'
          }

          logImageError(
            'Image loading timeout',
            url,
            {
              timeout: `${timeout}ms`,
              loadTime: `${loadTime}ms`,
              retryCount,
              isSpotify,
              slowConnection: loadTime > timeout * 0.8,
              finalAttempt: retryCount >= maxRetries
            },
            ImageErrorType.TIMEOUT_ERROR
          )

          // Enhanced retry logic for timeouts (might be transient network issues)
          if (retryCount < maxRetries) {
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000)
            logImageWarning('Image loading timeout retry', url, {
              reason: 'Timeout - possible slow connection',
              retryDelay: `${retryDelay}ms`,
              attempt: `${retryCount + 1}/${maxRetries + 1}`,
              increasedTimeout: timeout + retryCount * 2000 // Increase timeout for retries
            })

            setTimeout(() => {
              attemptLoad(retryCount + 1)
            }, retryDelay)
          } else {
            logImageError(
              'Image loading timeout final failure',
              url,
              {
                reason: 'Max retries exceeded after timeout',
                totalAttempts: retryCount + 1,
                totalTime: `${Date.now() - startTime}ms`,
                configuredTimeout: `${timeout}ms`
              },
              ImageErrorType.TIMEOUT_ERROR
            )
            onError?.(error)
            resolve({ success: false, error })
          }
        },
        timeout + retryCount * 2000
      ) // Increase timeout for retry attempts

      try {
        // Set CORS attributes for external images
        if (isSpotifyImageUrl(url)) {
          img.crossOrigin = 'anonymous'
          img.referrerPolicy = 'no-referrer'
          logImageOperation('Image loading start', url, {
            type: 'Spotify',
            corsEnabled: true,
            retryCount,
            timeout: `${timeout}ms`
          })
        } else {
          logImageOperation('Image loading start', url, {
            type: 'external',
            corsEnabled: false,
            retryCount,
            timeout: `${timeout}ms`
          })
        }

        img.src = url
      } catch (setupError) {
        cleanup()
        const error: ImageError = {
          type: ImageErrorType.UNKNOWN_ERROR,
          message: 'Failed to setup image loading',
          url,
          timestamp: Date.now(),
          retryCount
        }
        logImageError('Image loading setup', url, setupError, ImageErrorType.UNKNOWN_ERROR)
        onError?.(error)
        resolve({ success: false, error })
      }
    }

    attemptLoad()
  })
}

/**
 * Generates a placeholder image data URL with album info
 */
export const generatePlaceholderImage = (
  albumName: string,
  artistName: string,
  onError?: ImageErrorCallback
): string => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      const error: ImageError = {
        type: ImageErrorType.UNKNOWN_ERROR,
        message: 'Canvas context not available',
        url: '',
        timestamp: Date.now()
      }
      logImageError(
        'Placeholder generation',
        '',
        'Canvas context not available',
        ImageErrorType.UNKNOWN_ERROR
      )
      onError?.(error)
      return generateFallbackPlaceholder(albumName, artistName, onError)
    }

    canvas.width = 200
    canvas.height = 200

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 200, 200)
    gradient.addColorStop(0, '#667eea')
    gradient.addColorStop(1, '#764ba2')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 200, 200)

    // Add music note icon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🎵', 100, 80)

    // Add album name
    ctx.fillStyle = 'white'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'

    const safeAlbumName = albumName || 'Unknown Album'
    const safeArtistName = artistName || 'Unknown Artist'

    const albumText =
      safeAlbumName.length > 20 ? safeAlbumName.substring(0, 17) + '...' : safeAlbumName
    ctx.fillText(albumText, 100, 130)

    // Add artist name
    ctx.font = '12px Arial'
    const artistText =
      safeArtistName.length > 25 ? safeArtistName.substring(0, 22) + '...' : safeArtistName
    ctx.fillText(artistText, 100, 150)

    const dataUrl = canvas.toDataURL()
    logImageOperation('Placeholder generation success', '', {
      albumName: safeAlbumName,
      artistName: safeArtistName,
      method: 'canvas'
    })
    return dataUrl
  } catch (error) {
    const imageError: ImageError = {
      type: ImageErrorType.UNKNOWN_ERROR,
      message: 'Failed to generate canvas placeholder',
      url: '',
      timestamp: Date.now()
    }
    logImageError('Placeholder generation', '', error, ImageErrorType.UNKNOWN_ERROR)
    onError?.(imageError)
    return generateFallbackPlaceholder(albumName, artistName, onError)
  }
}

/**
 * Generates a simple fallback placeholder when canvas is not available
 */
const generateFallbackPlaceholder = (
  albumName: string,
  artistName: string,
  onError?: ImageErrorCallback
): string => {
  try {
    // Create a simple SVG placeholder as fallback
    const safeAlbumName = albumName || 'Unknown Album'
    const safeArtistName = artistName || 'Unknown Artist'

    const albumText =
      safeAlbumName.length > 20 ? safeAlbumName.substring(0, 17) + '...' : safeAlbumName
    const artistText =
      safeArtistName.length > 25 ? safeArtistName.substring(0, 22) + '...' : safeArtistName

    // Escape text for SVG
    const escapeXml = (text: string): string =>
      text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#grad)" />
        <text x="100" y="80" font-family="Arial" font-size="48" fill="rgba(255,255,255,0.8)" text-anchor="middle">🎵</text>
        <text x="100" y="130" font-family="Arial" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(albumText)}</text>
        <text x="100" y="150" font-family="Arial" font-size="12" fill="white" text-anchor="middle">${escapeXml(artistText)}</text>
      </svg>
    `

    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`
    logImageOperation('Fallback placeholder generation success', '', {
      albumName: safeAlbumName,
      artistName: safeArtistName,
      method: 'svg'
    })
    return dataUrl
  } catch (error) {
    const imageError: ImageError = {
      type: ImageErrorType.UNKNOWN_ERROR,
      message: 'Failed to generate SVG fallback placeholder',
      url: '',
      timestamp: Date.now()
    }
    logImageError('Fallback placeholder generation', '', error, ImageErrorType.UNKNOWN_ERROR)
    onError?.(imageError)
    // Return empty string as last resort
    return ''
  }
}

/**
 * Test function to simulate various error scenarios for debugging
 * This should only be used in development/testing environments
 */
export const testImageErrorScenarios = async (
  onError?: ImageErrorCallback,
  onSuccess?: ImageSuccessCallback
): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[ImageUtils] testImageErrorScenarios should not be used in production')
    return
  }

  console.log('[ImageUtils] Starting error scenario testing...')

  const testScenarios = [
    {
      name: 'Invalid URL',
      url: 'not-a-valid-url',
      expectedError: ImageErrorType.INVALID_URL
    },
    {
      name: '404 Error',
      url: 'https://httpstat.us/404.jpg',
      expectedError: ImageErrorType.SERVER_ERROR
    },
    {
      name: 'Timeout Error',
      url: 'https://httpstat.us/200?sleep=15000', // 15 second delay
      expectedError: ImageErrorType.TIMEOUT_ERROR,
      timeout: 3000
    },
    {
      name: 'Spotify CORS Error',
      url: 'https://i.scdn.co/image/ab67616d0000b273invalid',
      expectedError: ImageErrorType.CORS_ERROR
    },
    {
      name: 'Valid Image',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZiIvPjwvc3ZnPg==',
      expectedError: null
    }
  ]

  for (const scenario of testScenarios) {
    console.log(`[ImageUtils] Testing scenario: ${scenario.name}`)

    try {
      const result = await loadImageWithFallback(
        scenario.url,
        scenario.timeout || 5000,
        1, // Only 1 retry for testing
        (error) => {
          console.log(`[ImageUtils] Expected error for ${scenario.name}:`, {
            expected: scenario.expectedError,
            actual: error.type,
            match: error.type === scenario.expectedError,
            error
          })
          onError?.(error)
        },
        (url, loadTime) => {
          console.log(`[ImageUtils] Success for ${scenario.name}:`, {
            url: url.substring(0, 50) + '...',
            loadTime: `${loadTime}ms`
          })
          onSuccess?.(url, loadTime)
        }
      )

      if (scenario.expectedError === null && result.success) {
        console.log(`[ImageUtils] ✅ ${scenario.name} passed - image loaded successfully`)
      } else if (
        scenario.expectedError !== null &&
        !result.success &&
        result.error?.type === scenario.expectedError
      ) {
        console.log(`[ImageUtils] ✅ ${scenario.name} passed - expected error occurred`)
      } else {
        console.log(`[ImageUtils] ❌ ${scenario.name} failed - unexpected result`, result)
      }
    } catch (error) {
      console.error(`[ImageUtils] ❌ ${scenario.name} threw unexpected error:`, error)
    }

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log('[ImageUtils] Error scenario testing completed')
}

/**
 * Logs comprehensive debugging information about the current image loading state
 */
export const logImageDebuggingInfo = (
  context: string,
  additionalInfo?: Record<string, unknown>
): void => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    context,
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    cookiesEnabled: navigator.cookieEnabled,
    language: navigator.language,
    additionalInfo
  }

  console.log(`[ImageUtils] Debug Info - ${context}:`, debugInfo)
}
