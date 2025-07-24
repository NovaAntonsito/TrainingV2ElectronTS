import { AuthService } from '../services/AuthService'

export class AuthMiddleware {
  private authService: AuthService

  constructor() {
    this.authService = AuthService.getInstance()
  }

  /**
   * Middleware function to check if user is authenticated
   * Can be used to wrap IPC handlers that require authentication
   */
  requireAuth = <T extends any[], R>(handler: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R> => {
      if (!this.authService.isAuthenticated()) {
        throw new Error('Authentication required')
      }
      return handler(...args)
    }
  }

  /**
   * Check if current user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated()
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    return this.authService.getCurrentUser()
  }
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware()
