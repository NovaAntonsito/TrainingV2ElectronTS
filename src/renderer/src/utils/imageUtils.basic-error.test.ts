/**
 * Basic error handling tests for image utilities
 */

import { describe, it, expect, vi } from 'vitest'
import {
  loadImageWithFallback,
  ImageError,
  ImageErrorType,
  getUserFriendlyErrorMessage,
  getSuggestedAction,
  isRetryableError,
  processImageUrl
} from './imageUtils'

describe('Basic Error Handling', () => {
  describe('URL validation', () => {
    it('should detect invalid URLs', () => {
      const result = processImageUrl('invalid-url')
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe(ImageErrorType.INVALID_URL)
    })

    it('should detect empty URLs', () => {
      const result = processImageUrl('')
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe(ImageErrorType.INVALID_URL)
    })

    it('should accept valid URLs', () => {
      const result = processImageUrl('https://example.com/image.jpg')
      expect(result.error).toBeUndefined()
    })
  })

  describe('Error callback system', () => {
    it('should call error callback for invalid URLs', async () => {
      const mockErrorCallback = vi.fn()

      const result = await loadImageWithFallback('invalid-url', 1000, 0, mockErrorCallback)

      expect(result.success).toBe(false)
      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ImageErrorType.INVALID_URL,
          url: 'invalid-url'
        })
      )
    })

    it('should provide user-friendly error messages', () => {
      const error: ImageError = {
        type: ImageErrorType.INVALID_URL,
        message: 'Invalid URL',
        url: 'invalid-url',
        timestamp: Date.now()
      }

      const userFriendly = getUserFriendlyErrorMessage(error)
      expect(userFriendly).toBe('Invalid image address')

      const suggestedAction = getSuggestedAction(error)
      expect(suggestedAction).toBe('Please enter a valid image URL')

      const canRetry = isRetryableError(error)
      expect(canRetry).toBe(false)
    })
  })

  describe('Error types and retry logic', () => {
    it('should identify retryable vs non-retryable errors', () => {
      const retryableErrors = [
        ImageErrorType.NETWORK_ERROR,
        ImageErrorType.TIMEOUT_ERROR,
        ImageErrorType.SERVER_ERROR,
        ImageErrorType.LOAD_ERROR
      ]

      const nonRetryableErrors = [ImageErrorType.CORS_ERROR, ImageErrorType.INVALID_URL]

      retryableErrors.forEach((errorType) => {
        const error: ImageError = {
          type: errorType,
          message: 'Test error',
          url: 'https://test.com/image.jpg',
          timestamp: Date.now()
        }
        expect(isRetryableError(error)).toBe(true)
      })

      nonRetryableErrors.forEach((errorType) => {
        const error: ImageError = {
          type: errorType,
          message: 'Test error',
          url: 'https://test.com/image.jpg',
          timestamp: Date.now()
        }
        expect(isRetryableError(error)).toBe(false)
      })
    })
  })

  describe('User-friendly messages', () => {
    it('should provide appropriate messages for all error types', () => {
      const testCases = [
        {
          type: ImageErrorType.CORS_ERROR,
          isSpotify: true,
          expected: 'Spotify image temporarily unavailable'
        },
        {
          type: ImageErrorType.CORS_ERROR,
          isSpotify: false,
          expected: 'Image temporarily unavailable due to security restrictions'
        },
        {
          type: ImageErrorType.NETWORK_ERROR,
          expected: 'Unable to connect to image server'
        },
        {
          type: ImageErrorType.TIMEOUT_ERROR,
          expected: 'Image loading took too long'
        },
        {
          type: ImageErrorType.INVALID_URL,
          expected: 'Invalid image address'
        },
        {
          type: ImageErrorType.LOAD_ERROR,
          expected: 'Image could not be displayed'
        },
        {
          type: ImageErrorType.SERVER_ERROR,
          expected: 'Image server is currently unavailable'
        },
        {
          type: ImageErrorType.UNKNOWN_ERROR,
          expected: 'Image temporarily unavailable'
        }
      ]

      testCases.forEach(({ type, isSpotify, expected }) => {
        const error: ImageError = {
          type,
          message: 'Test error',
          url: 'https://test.com/image.jpg',
          timestamp: Date.now(),
          isSpotify
        }

        const userFriendly = getUserFriendlyErrorMessage(error)
        expect(userFriendly).toBe(expected)
      })
    })

    it('should provide appropriate suggested actions', () => {
      const testCases = [
        {
          type: ImageErrorType.CORS_ERROR,
          isSpotify: true,
          expected: 'Try using a different image URL or upload the image directly'
        },
        {
          type: ImageErrorType.NETWORK_ERROR,
          expected: 'Check your internet connection and try again'
        },
        {
          type: ImageErrorType.TIMEOUT_ERROR,
          expected: 'Try again or use a different image'
        },
        {
          type: ImageErrorType.INVALID_URL,
          expected: 'Please enter a valid image URL'
        }
      ]

      testCases.forEach(({ type, isSpotify, expected }) => {
        const error: ImageError = {
          type,
          message: 'Test error',
          url: 'https://test.com/image.jpg',
          timestamp: Date.now(),
          isSpotify
        }

        const suggestedAction = getSuggestedAction(error)
        expect(suggestedAction).toBe(expected)
      })
    })
  })
})
