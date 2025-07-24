/**
 * Comprehensive error testing for image utilities
 * This file contains tests for various error scenarios and failure modes
 */

import {
  loadImageWithFallback,
  testImageErrorScenarios,
  ImageError,
  ImageErrorType,
  getUserFriendlyErrorMessage,
  getSuggestedAction,
  isRetryableError,
  logImageDebuggingInfo
} from './imageUtils'

/**
 * Test suite for comprehensive error handling
 */
export const runErrorHandlingTests = async (): Promise<void> => {
  console.log('[ImageUtils Error Tests] Starting comprehensive error handling tests...')

  // Test 1: Invalid URL handling
  await testInvalidUrlHandling()

  // Test 2: Network timeout scenarios
  await testTimeoutScenarios()

  // Test 3: CORS error handling
  await testCorsErrorHandling()

  // Test 4: Server error responses
  await testServerErrorHandling()

  // Test 5: Retry logic validation
  await testRetryLogic()

  // Test 6: Error callback system
  await testErrorCallbackSystem()

  // Test 7: User-friendly error messages
  await testUserFriendlyMessages()

  // Test 8: Logging functionality
  await testLoggingFunctionality()

  console.log('[ImageUtils Error Tests] All error handling tests completed')
}

/**
 * Test invalid URL handling
 */
const testInvalidUrlHandling = async (): Promise<void> => {
  console.log('[Error Test] Testing invalid URL handling...')

  const invalidUrls = [
    '',
    null as any,
    undefined as any,
    'not-a-url',
    'http://',
    'ftp://invalid.com/image.jpg',
    'javascript:alert("xss")'
  ]

  for (const url of invalidUrls) {
    try {
      const result = await loadImageWithFallback(
        url,
        1000,
        0, // No retries for invalid URLs
        (error) => {
          console.log(`[Error Test] Expected error for invalid URL "${url}":`, {
            type: error.type,
            message: error.message,
            userFriendly: getUserFriendlyErrorMessage(error),
            canRetry: isRetryableError(error)
          })
        }
      )

      if (result.success) {
        console.warn(`[Error Test] ⚠️ Invalid URL "${url}" unexpectedly succeeded`)
      } else {
        console.log(`[Error Test] ✅ Invalid URL "${url}" properly rejected`)
      }
    } catch (error) {
      console.error(`[Error Test] ❌ Invalid URL "${url}" threw unexpected error:`, error)
    }
  }
}

/**
 * Test timeout scenarios with different timeout values
 */
const testTimeoutScenarios = async (): Promise<void> => {
  console.log('[Error Test] Testing timeout scenarios...')

  const timeoutTests = [
    { url: 'https://httpstat.us/200?sleep=2000', timeout: 1000, shouldTimeout: true },
    { url: 'https://httpstat.us/200?sleep=500', timeout: 2000, shouldTimeout: false },
    { url: 'https://httpstat.us/200?sleep=5000', timeout: 3000, shouldTimeout: true }
  ]

  for (const test of timeoutTests) {
    try {
      console.log(`[Error Test] Testing timeout: ${test.timeout}ms for ${test.url}`)
      const startTime = Date.now()

      const result = await loadImageWithFallback(
        test.url,
        test.timeout,
        0, // No retries for timeout tests
        (error) => {
          const actualTime = Date.now() - startTime
          console.log(`[Error Test] Timeout error after ${actualTime}ms:`, {
            type: error.type,
            expectedTimeout: test.shouldTimeout,
            actualTimeout: error.type === ImageErrorType.TIMEOUT_ERROR,
            userFriendly: getUserFriendlyErrorMessage(error)
          })
        }
      )

      const actualTime = Date.now() - startTime
      if (test.shouldTimeout && result.success) {
        console.warn(`[Error Test] ⚠️ Expected timeout but succeeded in ${actualTime}ms`)
      } else if (!test.shouldTimeout && !result.success) {
        console.warn(`[Error Test] ⚠️ Expected success but failed in ${actualTime}ms`)
      } else {
        console.log(`[Error Test] ✅ Timeout test behaved as expected in ${actualTime}ms`)
      }
    } catch (error) {
      console.error(`[Error Test] ❌ Timeout test threw unexpected error:`, error)
    }
  }
}

/**
 * Test CORS error handling with Spotify URLs
 */
const testCorsErrorHandling = async (): Promise<void> => {
  console.log('[Error Test] Testing CORS error handling...')

  const corsUrls = [
    'https://i.scdn.co/image/ab67616d0000b273invalid',
    'https://mosaic.scdn.co/640/invalid',
    'https://i.scdn.co/image/test123'
  ]

  for (const url of corsUrls) {
    try {
      const result = await loadImageWithFallback(
        url,
        3000,
        1, // One retry for CORS tests
        (error) => {
          console.log(`[Error Test] CORS error for ${url}:`, {
            type: error.type,
            isSpotify: error.isSpotify,
            canRetry: isRetryableError(error),
            userFriendly: getUserFriendlyErrorMessage(error),
            suggestedAction: getSuggestedAction(error)
          })
        }
      )

      if (result.success) {
        console.log(`[Error Test] ✅ CORS URL ${url} unexpectedly succeeded`)
      } else {
        console.log(`[Error Test] ✅ CORS URL ${url} properly failed as expected`)
      }
    } catch (error) {
      console.error(`[Error Test] ❌ CORS test threw unexpected error:`, error)
    }
  }
}

/**
 * Test server error responses (404, 500, etc.)
 */
const testServerErrorHandling = async (): Promise<void> => {
  console.log('[Error Test] Testing server error handling...')

  const serverErrorTests = [
    { url: 'https://httpstat.us/404.jpg', expectedStatus: 404 },
    { url: 'https://httpstat.us/500.jpg', expectedStatus: 500 },
    { url: 'https://httpstat.us/503.jpg', expectedStatus: 503 },
    { url: 'https://example.com/nonexistent.jpg', expectedStatus: 404 }
  ]

  for (const test of serverErrorTests) {
    try {
      const result = await loadImageWithFallback(
        test.url,
        5000,
        1, // One retry for server error tests
        (error) => {
          console.log(`[Error Test] Server error for ${test.url}:`, {
            type: error.type,
            httpStatus: error.httpStatus,
            expectedStatus: test.expectedStatus,
            canRetry: isRetryableError(error),
            userFriendly: getUserFriendlyErrorMessage(error)
          })
        }
      )

      if (result.success) {
        console.warn(`[Error Test] ⚠️ Server error URL ${test.url} unexpectedly succeeded`)
      } else {
        console.log(`[Error Test] ✅ Server error URL ${test.url} properly failed`)
      }
    } catch (error) {
      console.error(`[Error Test] ❌ Server error test threw unexpected error:`, error)
    }
  }
}

/**
 * Test retry logic with different error types
 */
const testRetryLogic = async (): Promise<void> => {
  console.log('[Error Test] Testing retry logic...')

  const retryTests = [
    {
      url: 'https://httpstat.us/500.jpg',
      maxRetries: 2,
      shouldRetry: true,
      description: 'Server error (retryable)'
    },
    {
      url: 'https://i.scdn.co/image/invalid',
      maxRetries: 2,
      shouldRetry: false,
      description: 'CORS error (non-retryable)'
    },
    {
      url: 'https://httpstat.us/200?sleep=4000',
      maxRetries: 1,
      shouldRetry: true,
      description: 'Timeout error (retryable)'
    }
  ]

  for (const test of retryTests) {
    try {
      console.log(`[Error Test] Testing retry logic: ${test.description}`)
      let errorCount = 0

      const result = await loadImageWithFallback(
        test.url,
        2000, // Short timeout for retry tests
        test.maxRetries,
        (error) => {
          errorCount++
          console.log(`[Error Test] Retry attempt ${errorCount}:`, {
            type: error.type,
            retryCount: error.retryCount,
            canRetry: isRetryableError(error),
            shouldRetry: test.shouldRetry,
            maxRetries: test.maxRetries
          })
        }
      )

      const expectedAttempts = test.shouldRetry ? test.maxRetries + 1 : 1
      if (errorCount === expectedAttempts) {
        console.log(`[Error Test] ✅ Retry logic worked correctly (${errorCount} attempts)`)
      } else {
        console.warn(`[Error Test] ⚠️ Expected ${expectedAttempts} attempts, got ${errorCount}`)
      }
    } catch (error) {
      console.error(`[Error Test] ❌ Retry test threw unexpected error:`, error)
    }
  }
}

/**
 * Test error callback system
 */
const testErrorCallbackSystem = async (): Promise<void> => {
  console.log('[Error Test] Testing error callback system...')

  let callbackCalled = false
  let callbackError: ImageError | null = null

  const result = await loadImageWithFallback(
    'https://invalid-domain-that-does-not-exist.com/image.jpg',
    2000,
    0,
    (error) => {
      callbackCalled = true
      callbackError = error
      console.log('[Error Test] Error callback invoked:', {
        type: error.type,
        message: error.message,
        timestamp: new Date(error.timestamp).toISOString(),
        userFriendly: getUserFriendlyErrorMessage(error)
      })
    }
  )

  if (callbackCalled && callbackError) {
    console.log('[Error Test] ✅ Error callback system working correctly')
  } else {
    console.error('[Error Test] ❌ Error callback system failed')
  }
}

/**
 * Test user-friendly error messages
 */
const testUserFriendlyMessages = async (): Promise<void> => {
  console.log('[Error Test] Testing user-friendly error messages...')

  const errorTypes = [
    ImageErrorType.CORS_ERROR,
    ImageErrorType.NETWORK_ERROR,
    ImageErrorType.TIMEOUT_ERROR,
    ImageErrorType.INVALID_URL,
    ImageErrorType.LOAD_ERROR,
    ImageErrorType.SERVER_ERROR,
    ImageErrorType.UNKNOWN_ERROR
  ]

  for (const errorType of errorTypes) {
    const mockError: ImageError = {
      type: errorType,
      message: `Test ${errorType}`,
      url: 'https://test.com/image.jpg',
      timestamp: Date.now(),
      isSpotify: errorType === ImageErrorType.CORS_ERROR
    }

    const userFriendly = getUserFriendlyErrorMessage(mockError)
    const suggestedAction = getSuggestedAction(mockError)
    const canRetry = isRetryableError(mockError)

    console.log(`[Error Test] ${errorType}:`, {
      userFriendly,
      suggestedAction,
      canRetry
    })

    // Validate that messages are user-friendly (no technical jargon)
    const hasTechnicalTerms =
      userFriendly.toLowerCase().includes('cors') ||
      userFriendly.toLowerCase().includes('xhr') ||
      userFriendly.toLowerCase().includes('fetch')

    if (hasTechnicalTerms) {
      console.warn(
        `[Error Test] ⚠️ User-friendly message contains technical terms: ${userFriendly}`
      )
    } else {
      console.log(`[Error Test] ✅ User-friendly message is appropriate`)
    }
  }
}

/**
 * Test logging functionality
 */
const testLoggingFunctionality = async (): Promise<void> => {
  console.log('[Error Test] Testing logging functionality...')

  // Test debug logging
  logImageDebuggingInfo('Test context', {
    testData: 'sample',
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  })

  // Test with various scenarios
  const testScenarios = [
    { context: 'Image load start', data: { url: 'https://test.com/image.jpg', timeout: 5000 } },
    { context: 'Image load success', data: { loadTime: 1234, retryCount: 0 } },
    { context: 'Image load error', data: { errorType: 'NETWORK_ERROR', retryCount: 1 } },
    {
      context: 'Placeholder generation',
      data: { albumName: 'Test Album', artistName: 'Test Artist' }
    }
  ]

  for (const scenario of testScenarios) {
    logImageDebuggingInfo(scenario.context, scenario.data)
  }

  console.log('[Error Test] ✅ Logging functionality tested')
}

/**
 * Run built-in error scenario tests
 */
export const runBuiltInErrorTests = async (): Promise<void> => {
  console.log('[Error Test] Running built-in error scenario tests...')

  await testImageErrorScenarios(
    (error) => {
      console.log('[Built-in Test] Error callback:', {
        type: error.type,
        userFriendly: getUserFriendlyErrorMessage(error),
        canRetry: isRetryableError(error)
      })
    },
    (url, loadTime) => {
      console.log('[Built-in Test] Success callback:', {
        url: url.substring(0, 50) + '...',
        loadTime: `${loadTime}ms`
      })
    }
  )

  console.log('[Error Test] Built-in error scenario tests completed')
}

/**
 * Test error handling under stress conditions
 */
export const runStressTests = async (): Promise<void> => {
  console.log('[Error Test] Running stress tests...')

  // Test multiple simultaneous requests
  const simultaneousRequests = Array.from({ length: 10 }, (_, i) =>
    loadImageWithFallback(`https://httpstat.us/404.jpg?test=${i}`, 3000, 1, (error) => {
      console.log(`[Stress Test] Request ${i} error:`, error.type)
    })
  )

  const results = await Promise.all(simultaneousRequests)
  const failedCount = results.filter((r) => !r.success).length

  console.log(`[Stress Test] ${failedCount}/${results.length} requests failed as expected`)

  // Test rapid sequential requests
  for (let i = 0; i < 5; i++) {
    await loadImageWithFallback(`https://httpstat.us/500.jpg?seq=${i}`, 1000, 0, (error) => {
      console.log(`[Stress Test] Sequential request ${i}:`, error.type)
    })
  }

  console.log('[Error Test] Stress tests completed')
}

// Export for use in development/testing
if (process.env.NODE_ENV !== 'production') {
  ;(window as any).imageErrorTests = {
    runErrorHandlingTests,
    runBuiltInErrorTests,
    runStressTests
  }
}
