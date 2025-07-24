// Test setup file for vitest
import { vi } from 'vitest'

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
}

// Mock Image constructor for testing
global.Image = vi.fn().mockImplementation(() => {
  const img = {
    onload: null as (() => void) | null,
    onerror: null as ((event: any) => void) | null,
    crossOrigin: null as string | null,
    referrerPolicy: '',
    _src: '',

    get src() {
      return this._src
    },

    set src(value: string) {
      this._src = value
      setTimeout(() => {
        if (value.includes('valid-image')) {
          this.onload?.()
        } else if (value.includes('invalid-image') || value.includes('i.scdn.co')) {
          this.onerror?.('Image load error')
        }
      }, 10)
    }
  }
  return img
})

// Mock canvas and context for placeholder generation
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    set fillStyle(value: any) {},
    set font(value: string) {},
    set textAlign(value: string) {}
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock-canvas-data')
}

global.document = {
  ...global.document,
  createElement: vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas
    }
    return {}
  })
} as any

// Mock btoa for SVG fallback
global.btoa = vi.fn((str: string) => Buffer.from(str).toString('base64'))
