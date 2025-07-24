import 'reflect-metadata'
import { AuthService } from './services/AuthService'
import { DatabaseService } from './database/DatabaseService'

async function testAuth() {
  try {
    // Initialize database
    const dbService = DatabaseService.getInstance()
    await dbService.initialize()

    const authService = AuthService.getInstance()

    // Test 1: Create a user
    console.log('Creating test user...')
    const user = await authService.createUser('testuser', 'testpassword')
    console.log('User created:', { id: user.id, username: user.username })

    // Test 2: Login with correct credentials
    console.log('\nTesting login with correct credentials...')
    const loginResult = await authService.login({
      username: 'testuser',
      password: 'testpassword'
    })
    console.log('Login result:', loginResult)

    // Test 3: Check if authenticated
    console.log('\nChecking authentication status...')
    console.log('Is authenticated:', authService.isAuthenticated())
    console.log('Current user:', await authService.getCurrentUser())

    // Test 4: Login with wrong credentials
    console.log('\nTesting login with wrong credentials...')
    const wrongLoginResult = await authService.login({
      username: 'testuser',
      password: 'wrongpassword'
    })
    console.log('Wrong login result:', wrongLoginResult)

    // Test 5: Logout
    console.log('\nTesting logout...')
    await authService.logout()
    console.log('Is authenticated after logout:', authService.isAuthenticated())
    console.log('Current user after logout:', await authService.getCurrentUser())

    // Test 6: Login with empty credentials
    console.log('\nTesting login with empty credentials...')
    const emptyLoginResult = await authService.login({
      username: '',
      password: ''
    })
    console.log('Empty login result:', emptyLoginResult)

    console.log('\nAll tests completed successfully!')
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    // Close database connection
    const dbService = DatabaseService.getInstance()
    await dbService.close()
  }
}

testAuth()
