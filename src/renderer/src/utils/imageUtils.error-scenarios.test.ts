/**
 * Comprehensive error handling and logging tests for imageUtils
 * Tests all error scenarios and logging functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loadImageWithFallback,
  generatePlaceholderImage,
  isSpotifyImageUrl,
  processImageUrl,
  getUserFriendlyErrorMessage,
  getSuggestedAction,
  isRetryableError,
  testImageErrorScenarios,
  logImageDebuggingInfo,
  ImageError,
  ImageErrorType,
  ImageErrorCallback,
  ImageSuccessCallback
} from './imageUtils'

// Mock console methods to test logging
const mockConsoleLog = vi.fn()
const mockConsoleError = vi.fn()
const mockConsoleWarn = vi.fn()

describe('imageUtils - Error Handling and Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsoleLog)
    vi.spyOn(console, 'error').mockImplementation(mockConsoleError)
    vi.spyOn(console, 'warn').mockImplementation(mockConsoleWarn)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Error Type Detection and Handling', () => {
    it('should detect and handle CORS errors for Spotify URLs', async () => {
      const onError = vi.fn()
      const spotifyUrl = 'https://i.scdn.co/image/invalid'

      const result = await loadImageWithFallback(spotifyUrl, 1000, 0, onError)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ImageErrorType.CORS_ERROR)
      expect(result.error?.isSpotify).toBe(true)
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ImageErrorType.CORS_ERROR,
          isSpotify: true,
          canRetry: false
        })
      )
    })

    it('should detect and handle timeout errors', async () => {
      const onError = vi.fn()
      // Use a URL that will timeout
      const slowUrl = 'https://httpstat.us/200?sleep=5000'

      const result = await loadImageWithFallback(slowUrl, 1000, 0, onError)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ImageErrorType.TIMEOUT_ERROR)
      expect(result.error?.canRetry).toBe(true)
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ImageErrorType.TIMEOUT_ERROR,
          canRetry: true
        })
      )
    })

    it('should detect and handle invalid URL errors', async () => {
      const onError = vi.fn()
      const invalidUrl = 'not-a-valid-url'

      const result = await loadImageWithFallback(invalidUrl, 1000, 0, onError)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ImageErrorType.INVALID_URL)
      expect(result.error?.canRetry).toBe(false)
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ImageErrorType.INVALID_URL,
          canRetry: false
        })
      )
    })

    it('should handle network errors with retry logic', async () => {
      const onError = vi.fn()
      const networkErrorUrl = 'https://nonexistent-domain-12345.com/image.jpg'

      const result = await loadImageWithFallback(networkErrorUrl, 2000, 1, onError)

      expect(result.success).toBe(false)
      expect(onError).toHaveBeenCalled()
      // Should have attempted retry
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Image loading retry'),
        expect.any(String),
        expect.objectContaining({
          reason: expect.stringContaining('Retryable error')
        })
      )
    }, 10000)
  })

  describe('User-Friendly Error Messages', () => {
    it('should provide user-friendly messages for CORS errors', () => {
      const corsError: ImageError = {
        type: ImageErrorType.CORS_ERROR,
        message: 'CORS error',
        url: 'https://i.scdn.co/image/test',
        timestamp: Date.now(),
        isSpotify: true
      }

      const message = getUserFriendlyErrorMessage(corsError)
      expect(message).toBe('Spotify image temporarily unavailable')
    })

    it('should provide user-friendly messages for timeout errors', () => {
      const timeoutError: ImageError = {
        type: ImageErrorType.TIMEOUT_ERROR,
        message: 'Timeout error',
        url: 'https://example.com/image.jpg',
        timestamp: Date.now()
      }

      const message = getUserFriendlyErrorMessage(timeoutError)
      expect(message).toBe('Image loading took too long')
    })

    it('should provide user-friendly messages for network errors', () => {
      const networkError: ImageError = {
        type: ImageErrorType.NETWORK_ERROR,
        message: 'Network error',
        url: 'https://example.com/image.jpg',
        timestamp: Date.now()
      }

      const message = getUserFriendlyErrorMessage(networkError)
      expect(message).toBe('Unable to connect to image server')
    })

    it('should use cached user-friendly message if available', () => {
      const error: ImageError = {
        type: ImageErrorType.LOAD_ERROR,
        message: 'Load error',
        url: 'https://example.com/image.jpg',
        timestamp: Date.now(),
        userFriendlyMessage: 'Custom friendly message'
      }

      const message = getUserFriendlyErrorMessage(error)
      expect(message).toBe('Custom friendly message')
    })
  })

  describe('Suggested Actions', () => {
    it('should provide appropriate suggestions for CORS errors', () => {
      const corsError: ImageError = {
        type: ImageErrorType.CORS_ERROR,
        message: 'CORS error',
        url: 'https://i.scdn.co/image/test',
        timestamp: Date.now(),
        isSpotify: true
      }

      const action = getSuggestedAction(corsError)
      expect(action).toBe('Try using a different image URL or upload the image directly')
    })

    it('should provide appropriate suggestions for network errors', () => {
      const networkError: ImageError = {
        type: ImageErrorType.NETWORK_ERROR,
        message: 'Network error',
        url: 'https://example.com/image.jpg',
        timestamp: Date.now()
      }

      const action = getSuggestedAction(networkError)
      expect(action).toBe('Check your internet connection and try again')
    })

    it('should use cached suggested action if available', () => {
      const error: ImageError = {
        type: ImageErrorType.LOAD_ERROR,
        message: 'Load error',
        url: 'https://example.com/image.jpg',
        timestamp: Date.now(),
        suggestedAction: 'Custom suggested action'
      }

      const action = getSuggestedAction(error)
      expect(action).toBe('Custom suggested action')
    })
  })

  describe('Retry Logic', () => {
    it('should identify retryable errors correctly', () => {
      const retryableErrors = [
        ImageErrorType.NETWORK_ERROR,
        ImageErrorType.TIMEOUT_ERROR,
        ImageErrorType.SERVER_ERROR,
        ImageErrorType.LOAD_ERROR
      ]

      retryableErrors.forEach((errorType) => {
        const error: ImageError = {
          type: errorType,
          message: 'Test error',
          url: 'https://example.com/image.jpg',
          timestamp: Date.now()
        }
        expect(isRetryableError(error)).toBe(true)
      })
    })

    it('should identify non-retryable errors correctly', () => {
      const nonRetryableErrors = [ImageErrorType.CORS_ERROR, ImageErrorType.INVALID_URL]

      nonRetryableErrors.forEach((errorType) => {
        const error: ImageError = {
          type: errorType,
          message: 'Test error',
          url: 'https://example.com/image.jpg',
          timestamp: Date.now()
        }
        expect(isRetryableError(error)).toBe(false)
      })
    })

    it('should respect cached canRetry property', () => {
      const error: ImageError = {
        type: ImageErrorType.NETWORK_ERROR,
        message: 'Test error',
        url: 'https://example.com/image.jpg',
        timestamp: Date.now(),
        canRetry: false
      }

      expect(isRetryableError(error)).toBe(false)
    })

    it('should implement exponential backoff for retries', async () => {
      const onError = vi.fn()
      const failingUrl = 'https://httpstat.us/500.jpg'

      const startTime = Date.now()
      await loadImageWithFallback(failingUrl, 1000, 2, onError)
      const endTime = Date.now()

      // Should have taken time for retries with backoff
      expect(endTime - startTime).toBeGreaterThan(1000) // At least initial timeout
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('retry'),
        expect.any(String),
        expect.objectContaining({
          retryDelay: expect.stringMatching(/\d+ms/)
        })
      )
    }, 15000)
  })

  describe('Comprehensive Logging', () => {
    it('should log successful image operations', async () => {
      const onSuccess = vi.fn()
      const validImageUrl =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZiIvPjwvc3ZnPg=='

      await loadImageWithFallback(validImageUrl, 5000, 0, undefined, onSuccess)

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[ImageUtils]'),
        expect.stringContaining('Image loading success'),
        expect.any(String),
        expect.objectContaining({
          loadTime: expect.stringMatching(/\d+ms/)
        })
      )
    }, 10000)

    it('should log error details with context', async () => {
      const onError = vi.fn()
      const invalidUrl = 'invalid-url'

      await loadImageWithFallback(invalidUrl, 1000, 0, onError)

      // Check that error was logged (the exact format may vary)
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ImageUtils]'),
        expect.stringContaining('failed'),
        expect.objectContaining({
          errorType: ImageErrorType.INVALID_URL,
          url: invalidUrl
        })
      )
    })

    it('should log warnings for retry attempts', async () => {
      const onError = vi.fn()
      const timeoutUrl = 'https://httpstat.us/200?sleep=3000'

      await loadImageWithFallback(timeoutUrl, 1000, 1, onError)

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('[ImageUtils]'),
        expect.stringContaining('retry'),
        expect.any(String),
        expect.objectContaining({
          reason: expect.any(String),
          retryDelay: expect.stringMatching(/\d+ms/)
        })
      )
    }, 10000)

    it('should log debugging information', () => {
      const context = 'Test context'
      const additionalInfo = { testKey: 'testValue' }

      logImageDebuggingInfo(context, additionalInfo)

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[ImageUtils] Debug Info - ${context}:`),
        expect.objectContaining({
          context,
          userAgent: expect.any(String),
          online: expect.any(Boolean),
          additionalInfo
        })
      )
    })

    it('should safely truncate long URLs in logs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200) + '.jpg'
      const onError = vi.fn()

      await loadImageWithFallback(longUrl, 1000, 0, onError)

      // Check that the URL was truncated in the logs
      const errorCalls = mockConsoleError.mock.calls
      const hasUrlTruncation = errorCalls.some(
        (call) =>
          call.length >= 2 &&
          typeof call[1] === 'object' &&
          call[1].url &&
          call[1].url.endsWith('...')
      )
      expect(hasUrlTruncation).toBe(true)
    })
  })

  describe('Error Callback System', () => {
    it('should call error callbacks with detailed error information', async () => {
      const onError: ImageErrorCallback = vi.fn()
      const invalidUrl = 'invalid-url'

      await loadImageWithFallback(invalidUrl, 1000, 0, onError)

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ImageErrorType.INVALID_URL,
          message: expect.any(String),
          url: invalidUrl,
          timestamp: expect.any(Number),
          userFriendlyMessage: expect.any(String),
          canRetry: expect.any(Boolean),
          suggestedAction: expect.any(String)
        })
      )
    })

    it('should call success callbacks with load time information', async () => {
      const onSuccess: ImageSuccessCallback = vi.fn()
      const validImageUrl =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZiIvPjwvc3ZnPg=='

      await loadImageWithFallback(validImageUrl, 5000, 0, undefined, onSuccess)

      expect(onSuccess).toHaveBeenCalledWith(
        validImageUrl,
        expect.any(Number) // load time
      )
    }, 10000)

    it('should handle placeholder generation errors', () => {
      const onError: ImageErrorCallback = vi.fn()

      // Mock canvas to fail
      const originalCreateElement = document.createElement
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          const mockCanvas = originalCreateElement.call(document, tagName)
          vi.spyOn(mockCanvas, 'getContext').mockReturnValue(null)
          return mockCanvas
        }
        return originalCreateElement.call(document, tagName)
      })

      generatePlaceholderImage('Test Album', 'Test Artist', onError)

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ImageErrorType.UNKNOWN_ERROR,
          message: expect.stringContaining('Canvas context not available')
        })
      )
    })
  })

  describe('Error Scenario Testing', () => {
    it('should provide test function for development environments', async () => {
      // Mock NODE_ENV to be development
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const onError = vi.fn()
      const onSuccess = vi.fn()

      // This should run without throwing
      await expect(testImageErrorScenarios(onError, onSuccess)).resolves.toBeUndefined()

      // Should have logged test scenarios
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[ImageUtils] Starting error scenario testing...')
      )

      // Restore environment
      process.env.NODE_ENV = originalEnv
    }, 30000)

    it('should skip test function in production environment', async () => {
      // Mock NODE_ENV to be production
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      await testImageErrorScenarios()

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('testImageErrorScenarios should not be used in production')
      )

      // Restore environment
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Edge Cases and Error Recovery', () => {
    it('should handle null/undefined URLs gracefully', async () => {
      const onError = vi.fn()

      const result1 = await loadImageWithFallback(null as any, 1000, 0, onError)
      const result2 = await loadImageWithFallback(undefined as any, 1000, 0, onError)

      expect(result1.success).toBe(false)
      expect(result2.success).toBe(false)
      expect(onError).toHaveBeenCalledTimes(2)
    })

    it('should handle canvas failures gracefully in placeholder generation', () => {
      // Mock canvas to throw error
      const originalCreateElement = document.createElement
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          throw new Error('Canvas creation failed')
        }
        return originalCreateElement.call(document, tagName)
      })

      const result = generatePlaceholderImage('Test Album', 'Test Artist')

      // Should fallback to SVG
      expect(result).toContain('data:image/svg+xml')
    })

    it('should handle SVG fallback failures gracefully', () => {
      // Mock both canvas and btoa to fail
      vi.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('Canvas creation failed')
      })

      const originalBtoa = global.btoa
      global.btoa = vi.fn().mockImplementation(() => {
        throw new Error('btoa failed')
      })

      const result = generatePlaceholderImage('Test Album', 'Test Artist')

      // Should return empty string as last resort
      expect(result).toBe('')

      // Restore btoa
      global.btoa = originalBtoa
    })

    it('should handle concurrent image loading requests', async () => {
      const onError = vi.fn()
      const onSuccess = vi.fn()
      const validImageUrl =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZiIvPjwvc3ZnPg=='

      // Start multiple concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() => loadImageWithFallback(validImageUrl, 5000, 0, onError, onSuccess))

      const results = await Promise.all(promises)

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })

      expect(onSuccess).toHaveBeenCalledTimes(5)
    }, 15000)
  })
})
