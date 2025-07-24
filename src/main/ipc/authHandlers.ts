import { ipcMain } from 'electron'
import { AuthService, LoginCredentials, AuthResult } from '../services/AuthService'
import { User } from '../models/User'

export class AuthHandlers {
  private authService: AuthService

  constructor() {
    this.authService = AuthService.getInstance()
    this.registerHandlers()
  }

  private registerHandlers(): void {
    // Login handler
    ipcMain.handle('auth:login', async (_, credentials: LoginCredentials): Promise<AuthResult> => {
      console.log('IPC auth:login called with:', {
        username: credentials?.username,
        hasPassword: !!credentials?.password
      })
      try {
        // Validate input
        if (!credentials || !credentials.username || !credentials.password) {
          console.log('IPC auth:login validation failed')
          return {
            success: false,
            error: 'Username and password are required'
          }
        }

        console.log('IPC auth:login calling authService.login')
        const result = await this.authService.login(credentials)
        console.log('IPC auth:login result:', {
          success: result.success,
          hasUser: !!result.user,
          error: result.error
        })
        return result
      } catch (error) {
        console.error('IPC auth:login error:', error)
        return {
          success: false,
          error: 'An error occurred during login'
        }
      }
    })

    // Logout handler
    ipcMain.handle('auth:logout', async (): Promise<{ success: boolean; error?: string }> => {
      try {
        await this.authService.logout()
        return { success: true }
      } catch (error) {
        console.error('IPC auth:logout error:', error)
        return {
          success: false,
          error: 'An error occurred during logout'
        }
      }
    })

    // Get current user handler
    ipcMain.handle('auth:getCurrentUser', async (): Promise<User | null> => {
      try {
        return await this.authService.getCurrentUser()
      } catch (error) {
        console.error('IPC auth:getCurrentUser error:', error)
        return null
      }
    })

    // Check if authenticated handler
    ipcMain.handle('auth:isAuthenticated', (): boolean => {
      try {
        return this.authService.isAuthenticated()
      } catch (error) {
        console.error('IPC auth:isAuthenticated error:', error)
        return false
      }
    })
  }
}
