export interface IPCError {
  code: string
  message: string
  details?: any
}

export enum ErrorCodes {
  AUTH_FAILED = 'AUTH_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class IPCErrorHandler {
  static createError(code: ErrorCodes, message: string, details?: any): IPCError {
    return {
      code,
      message,
      details
    }
  }

  static handleAuthError(error: any): IPCError {
    if (error.message === 'Authentication required') {
      return this.createError(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    return this.createError(ErrorCodes.AUTH_FAILED, 'Authentication failed', error.message)
  }

  static handleGenericError(error: any): IPCError {
    console.error('IPC Error:', error)
    return this.createError(ErrorCodes.INTERNAL_ERROR, 'An internal error occurred', error.message)
  }
}
