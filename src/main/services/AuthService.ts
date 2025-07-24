import { Repository } from 'typeorm'
import { User } from '../models/User'
import { DatabaseService } from '../database/DatabaseService'

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export class AuthService {
  private static instance: AuthService
  private userRepository: Repository<User> | null = null
  private currentUser: User | null = null
  private isDatabaseAvailable: boolean = false

  private constructor() {
    this.initializeRepository()
  }

  private initializeRepository(): void {
    try {
      const dataSource = DatabaseService.getInstance().getConnection()
      if (dataSource && dataSource.isInitialized) {
        this.userRepository = dataSource.getRepository(User)
        this.isDatabaseAvailable = true
        console.log('AuthService: Database repository initialized')
      } else {
        console.log('AuthService: Database not initialized yet')
        this.isDatabaseAvailable = false
      }
    } catch (error) {
      console.log('AuthService: Database not available, using mock authentication')
      this.isDatabaseAvailable = false
    }
  }

  public reinitializeRepository(): void {
    this.initializeRepository()
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    console.log('AuthService.login called with:', {
      username: credentials?.username,
      hasPassword: !!credentials?.password
    })
    try {
      const { username, password } = credentials

      // Validate input
      if (!username || !password) {
        console.log('AuthService.login: validation failed')
        return {
          success: false,
          error: 'Username and password are required'
        }
      }

      // Check if repository is available, if not try to reinitialize
      if (!this.userRepository || !this.isDatabaseAvailable) {
        console.log('AuthService.login: reinitializing repository')
        this.reinitializeRepository()
      }

      // If still no repository, return error
      if (!this.userRepository) {
        console.error('AuthService: User repository not available')
        return {
          success: false,
          error: 'Database connection not available'
        }
      }

      // Find user by username
      const user = await this.userRepository.findOne({
        where: { username }
      })

      if (!user) {
        console.log('AuthService.login: user not found')
        return {
          success: false,
          error: 'Invalid username or password'
        }
      }

      console.log('AuthService.login: user found, validating password')
      // Validate password
      const isPasswordValid = await user.validatePassword(password)
      if (!isPasswordValid) {
        console.log('AuthService.login: password validation failed')
        return {
          success: false,
          error: 'Invalid username or password'
        }
      }

      // Set current user
      this.currentUser = user
      console.log('AuthService.login: login successful')

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        } as User
      }
    } catch (error) {
      console.error('AuthService.login error:', error)
      return {
        success: false,
        error: 'An error occurred during login'
      }
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser
  }

  async createUser(username: string, password: string): Promise<User> {
    const user = new User()
    user.username = username
    user.password = password // Will be hashed by the @BeforeInsert hook

    if (!this.userRepository) {
      throw new Error('User repository not initialized')
    }
    return await this.userRepository.save(user)
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }
}
