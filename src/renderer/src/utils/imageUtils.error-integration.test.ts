/**
 * Integration tests for error handling functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  loadImageWithFallback,
  ImageError,
  ImageErrorType,
  getUserFriendlyErrorMessage,
  getSuggestedAction,
  isRetryableError,
  logImageDebuggingInfo
} from './imageUtils'

// Mock console methods to capture logging
const mockConsoleLog = vi.fn()
const mockConsoleError = vi.fn()
const mockConsoleWarn = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(mockConsoleLog)
  vi.spyOn(console, 'error').mockImplementation(mockConsoleError)
  vi.spyOn(console, 'warn').mockImplementation(mockConsoleWarn)
})

describe('Error Handling Integration', () => {
  describe('Error callback system', () => {
    it('should call error callback with detailed error information', async () => {
      const mockErrorCallback = vi.fn()

      const result = await loadImageWithFallback('invalid-url', 1000, 0, mockErrorCallback)

      expect(result.success).toBe(false)
      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ImageErrorType.INVALID_URL,
          message: expect.any(String),
          url: 'invalid-url',
          timestamp: expect.any(Number)
        })
      )
    })

    it('should call success callback for valid images', async () => {
      const mockSuccessCallback = vi.fn()
      const validDataUrl =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9InJlZCIvPjwvc3ZnPg=='

      const result = await loadImageWithFallback(
        validDataUrl,
        5000,
        0,
        undefined,
        mockSuccessCallback
      )

      expect(result.success).toBe(true)
      expect(mockSuccessCallback).toHaveBeenCalledWith(validDataUrl, expect.any(Number))
    })
  })

  describe('User-friendly error messages', () => {
    it('should provide user-friendly messages for different error types', () => {
      const testCases = [
        {
          error: {
            type: ImageErrorType.CORS_ERROR,
            message: 'CORS error',
            url: 'https://i.scdn.co/image/test',
            timestamp: Date.now(),
            isSpotify: true
          },
          expectedMessage: 'Spotify image temporarily unavailable'
        },
        {
          error: {
            type: ImageErrorType.NETWORK_ERROR,
            message: 'Network error',
            url: 'https://example.com/image.jpg',
            timestamp: Date.now()
          },
          expectedMessage: 'Unable to connect to image server'
        },
        {
          error: {
            type: ImageErrorType.TIMEOUT_ERROR,
            message: 'Timeout error',
            url: 'https://example.com/image.jpg',
            timestamp: Date.now()
          },
          expectedMessage: 'Image loading took too long'
        }
      ]

      testCases.forEach(({ error, expectedMessage }) => {
        const userFriendlyMessage = getUserFriendlyErrorMessage(error as ImageError)
        expect(userFriendlyMessage).toBe(expectedMessage)
      })
    })

    it('should provide appropriate suggested actions', () => {
      const corsError: ImageError = {
        type: ImageErrorType.CORS_ERROR,
        message: 'CORS error',
        url: 'https://i.scdn.co/image/test',
        timestamp: Date.now(),
        isSpotify: true
      }

      const suggestedAction = getSuggestedAction(corsError)
      expect(suggestedAction).toBe('Try using a different image URL or upload the image directly')
    })

    it('should correctly identify retryable errors', () => {
      const retryableError: ImageError = {
        type: ImageErrorType.NETWORK_ERROR,
        message: 'Network error',
        url: 'https://example.com/image.jpg',
        timestamp: Date.now()
      }

      const nonRetryableError: ImageError = {
        type: ImageErrorType.CORS_ERROR,
        message: 'CORS error',
        url: 'https://i.scdn.co/image/test',
        timestamp: Date.now()
      }

      expect(isRetryableError(retryableError)).toBe(true)
      expect(isRetryableError(nonRetryableError)).toBe(false)
    })
  })

  describe('Comprehensive logging', () => {
    it('should log detailed debugging information', () => {
      const testContext = 'Test operation'
      const testData = {
        url: 'https://example.com/image.jpg',
        loadTime: 1234,
        retryCount: 1
      }

      logImageDebuggingInfo(testContext, testData)

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[ImageUtils] Debug Info - Test operation:'),
        expect.objectContaining({
          timestamp: expect.any(String),
          context: testContext,
          userAgent: expect.any(String),
          online: expect.any(Boolean),
          additionalInfo: testData
        })
      )
    })

    it('should log errors with appropriate detail level', async () => {
      await loadImageWithFallback('invalid-url', 1000, 0)

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ImageUtils]'),
        expect.objectContaining({
          url: 'invalid-url',
          errorType: ImageErrorType.INVALID_URL
        })
      )
    })
  })

  describe('Timeout handling', () => {
    it('should handle slow requests with timeout', async () => {
      const mockErrorCallback = vi.fn()

      // Use a very short timeout to ensure timeout occurs
      const result = await loadImageWithFallback(
        'https://httpstat.us/200?sleep=2000',
        100, // 100ms timeout
        0,
        mockErrorCallback
      )

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ImageErrorType.TIMEOUT_ERROR)
      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ImageErrorType.TIMEOUT_ERROR,
          userFriendlyMessage: 'Image loading took too long'
        })
      )
    }, 10000) // 10 second test timeout
  })

  describe('Retry logic', () => {
    it('should retry retryable errors', async () => {
      const mockErrorCallback = vi.fn()

      // This should trigger retries for timeout
      const result = await loadImageWithFallback(
        'https://httpstat.us/200?sleep=1000',
        200, // Short timeout to trigger retries
        2, // 2 retries
        mockErrorCallback
      )

      expect(result.success).toBe(false)
      // Should be called multiple times due to retries
      expect(mockErrorCallback.mock.calls.length).toBeGreaterThan(1)

      // Check that retry count increases
      const calls = mockErrorCallback.mock.calls
      if (calls.length > 1) {
        expect(calls[1][0].retryCount).toBeGreaterThan(calls[0][0].retryCount || 0)
      }
    }, 15000) // 15 second test timeout for retry logic

    it('should not retry non-retryable errors', async () => {
      const mockErrorCallback = vi.fn()

      const result = await loadImageWithFallback(
        'invalid-url',
        1000,
        2, // 2 retries configured
        mockErrorCallback
      )

      expect(result.success).toBe(false)
      // Should only be called once for non-retryable error
      expect(mockErrorCallback).toHaveBeenCalledTimes(1)
      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ImageErrorType.INVALID_URL
        })
      )
    })
  })
})
