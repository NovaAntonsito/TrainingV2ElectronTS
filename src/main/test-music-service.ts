import 'reflect-metadata'
import { DatabaseService } from './database/DatabaseService'
import { AuthService } from './services/AuthService'
import { MusicService } from './services/MusicService'

async function testMusicService() {
  try {
    console.log('🎵 Testing MusicService...')

    // Initialize database
    const dbService = DatabaseService.getInstance()
    await dbService.initialize()
    console.log('✅ Database initialized')

    // Get services
    const authService = AuthService.getInstance()
    const musicService = MusicService.getInstance()

    // Create a test user first (or use existing one)
    console.log('\n👤 Setting up test user...')
    let testUsername = `testuser_${Date.now()}`
    let testUser
    try {
      testUser = await authService.createUser(testUsername, 'password123')
      console.log('✅ Test user created:', testUser.username)
    } catch (error) {
      // If user already exists, try to login with existing testuser
      console.log('ℹ️ Using existing test user')
      testUsername = 'testuser'
    }

    // Login with the test user
    console.log('\n🔐 Logging in...')
    const loginResult = await authService.login({
      username: testUsername,
      password: 'password123'
    })

    if (!loginResult.success) {
      throw new Error('Login failed: ' + loginResult.error)
    }
    console.log('✅ Login successful')

    // Test creating a song
    console.log('\n🎶 Creating test song...')
    const createResult = await musicService.createSong({
      titulo: 'Test Song',
      album: 'Test Album',
      artista: 'Test Artist',
      duracion: 180.5,
      portadaAlbum: 'https://example.com/cover.jpg',
      previewMusica: 'https://example.com/preview.mp3'
    })

    if (!createResult.success) {
      throw new Error('Create song failed: ' + createResult.error)
    }
    console.log('✅ Song created:', createResult.data?.titulo)
    const createdSongId = createResult.data!.id

    // Test getting all songs
    console.log('\n📋 Getting all songs...')
    const getAllResult = await musicService.getAllSongs()
    if (!getAllResult.success) {
      throw new Error('Get all songs failed: ' + getAllResult.error)
    }
    console.log('✅ Found', getAllResult.data?.length, 'songs')

    // Test getting song by ID
    console.log('\n🔍 Getting song by ID...')
    const getByIdResult = await musicService.getSongById(createdSongId)
    if (!getByIdResult.success) {
      throw new Error('Get song by ID failed: ' + getByIdResult.error)
    }
    console.log('✅ Song found:', getByIdResult.data?.titulo)

    // Test updating the song
    console.log('\n✏️ Updating song...')
    const updateResult = await musicService.updateSong(createdSongId, {
      titulo: 'Updated Test Song',
      duracion: 200.0
    })
    if (!updateResult.success) {
      throw new Error('Update song failed: ' + updateResult.error)
    }
    console.log('✅ Song updated:', updateResult.data?.titulo)

    // Test searching songs
    console.log('\n🔎 Searching songs...')
    const searchResult = await musicService.searchSongs('Updated')
    if (!searchResult.success) {
      throw new Error('Search songs failed: ' + searchResult.error)
    }
    console.log('✅ Search found', searchResult.data?.length, 'songs')

    // Test search by album
    console.log('\n🔎 Searching by album...')
    const albumSearchResult = await musicService.searchSongs('Test Album')
    if (!albumSearchResult.success) {
      throw new Error('Album search failed: ' + albumSearchResult.error)
    }
    console.log('✅ Album search found', albumSearchResult.data?.length, 'songs')

    // Test search by artist
    console.log('\n🔎 Searching by artist...')
    const artistSearchResult = await musicService.searchSongs('Test Artist')
    if (!artistSearchResult.success) {
      throw new Error('Artist search failed: ' + artistSearchResult.error)
    }
    console.log('✅ Artist search found', artistSearchResult.data?.length, 'songs')

    // Test deleting the song
    console.log('\n🗑️ Deleting song...')
    const deleteResult = await musicService.deleteSong(createdSongId)
    if (!deleteResult.success) {
      throw new Error('Delete song failed: ' + deleteResult.error)
    }
    console.log('✅ Song deleted')

    // Verify song is deleted
    console.log('\n✅ Verifying deletion...')
    const verifyDeleteResult = await musicService.getSongById(createdSongId)
    if (verifyDeleteResult.success) {
      throw new Error('Song should have been deleted')
    }
    console.log('✅ Song deletion verified')

    // Test validation errors
    console.log('\n❌ Testing validation errors...')
    const invalidSongResult = await musicService.createSong({
      titulo: '', // Empty title should fail
      album: 'Test Album',
      artista: 'Test Artist',
      duracion: -1 // Negative duration should fail
    })
    if (invalidSongResult.success) {
      throw new Error('Invalid song should have failed validation')
    }
    console.log('✅ Validation errors handled correctly:', invalidSongResult.error)

    // Test unauthorized access
    console.log('\n🔒 Testing unauthorized access...')
    await authService.logout()
    const unauthorizedResult = await musicService.getAllSongs()
    if (unauthorizedResult.success) {
      throw new Error('Unauthorized access should have failed')
    }
    console.log('✅ Unauthorized access blocked correctly')

    console.log('\n🎉 All MusicService tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    // Close database connection
    const dbService = DatabaseService.getInstance()
    await dbService.close()
    console.log('🔌 Database connection closed')
  }
}

// Run the test
testMusicService()
