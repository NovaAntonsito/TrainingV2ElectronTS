import { AppDataSource } from './database/data-source'
import { AuthService } from './services/AuthService'

async function createMockUser() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      console.log('Database connection initialized')
    }

    // Get AuthService instance
    const authService = AuthService.getInstance()

    // Create mock user
    const user = await authService.createUser('anton', 'admin')
    console.log('Mock user created successfully:', {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    })

    // Test login with the created user
    const loginResult = await authService.login({
      username: 'anton',
      password: 'admin'
    })

    if (loginResult.success) {
      console.log('Login test successful:', loginResult.user)
    } else {
      console.log('Login test failed:', loginResult.error)
    }
  } catch (error) {
    console.error('Error creating mock user:', error)
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
      console.log('Database connection closed')
    }
  }
}

// Run the script
createMockUser()
