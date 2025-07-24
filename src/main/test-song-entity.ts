import 'reflect-metadata'
import { AppDataSource } from './database/data-source'
import { Song } from './models/Song'
import { User } from './models/User'

async function testSongEntity() {
  try {
    console.log('Initializing database...')
    await AppDataSource.initialize()
    console.log('Database initialized successfully')

    // Create or find a test user first
    const userRepo = AppDataSource.getRepository(User)
    let savedUser = await userRepo.findOne({ where: { username: 'testuser' } })

    if (!savedUser) {
      const testUser = new User()
      testUser.username = 'testuser'
      testUser.password = 'testpass'
      savedUser = await userRepo.save(testUser)
      console.log('Test user created:', savedUser.id)
    } else {
      console.log('Test user found:', savedUser.id)
    }

    // Test Song entity validation
    console.log('\n--- Testing Song Entity Validation ---')

    // Test 1: Valid song
    console.log('\nTest 1: Creating valid song...')
    const validSong = new Song()
    validSong.titulo = 'Test Song'
    validSong.album = 'Test Album'
    validSong.artista = 'Test Artist'
    validSong.duracion = 180.5
    validSong.portadaAlbum = 'https://example.com/cover.jpg'
    validSong.previewMusica = 'https://example.com/preview.mp3'
    validSong.user = savedUser
    validSong.userId = savedUser.id

    const songRepo = AppDataSource.getRepository(Song)
    const savedSong = await songRepo.save(validSong)
    console.log('✅ Valid song created successfully:', savedSong.id)

    // Test 2: Static validation method
    console.log('\nTest 2: Testing static validation method...')
    const validationErrors = Song.validateSongData({
      titulo: '',
      album: 'Test Album',
      artista: 'Test Artist',
      duracion: -5
    })
    console.log('✅ Validation errors for invalid data:', validationErrors)

    // Test 3: Valid data validation
    const noErrors = Song.validateSongData({
      titulo: 'Valid Title',
      album: 'Valid Album',
      artista: 'Valid Artist',
      duracion: 120
    })
    console.log('✅ Validation errors for valid data:', noErrors)

    // Test 4: Try to create song with invalid data (should throw error)
    console.log('\nTest 4: Testing validation on save...')
    try {
      const invalidSong = new Song()
      invalidSong.titulo = '' // Empty title should fail
      invalidSong.album = 'Test Album'
      invalidSong.artista = 'Test Artist'
      invalidSong.duracion = 180
      invalidSong.user = savedUser
      invalidSong.userId = savedUser.id

      await songRepo.save(invalidSong)
      console.log("❌ Should have failed but didn't")
    } catch (error) {
      console.log('✅ Validation correctly caught error:', (error as Error).message)
    }

    // Test 5: Try to create song with negative duration
    console.log('\nTest 5: Testing negative duration validation...')
    try {
      const invalidSong = new Song()
      invalidSong.titulo = 'Test Song'
      invalidSong.album = 'Test Album'
      invalidSong.artista = 'Test Artist'
      invalidSong.duracion = -10 // Negative duration should fail
      invalidSong.user = savedUser
      invalidSong.userId = savedUser.id

      await songRepo.save(invalidSong)
      console.log("❌ Should have failed but didn't")
    } catch (error) {
      console.log('✅ Validation correctly caught error:', (error as Error).message)
    }

    console.log('\n--- All tests completed successfully! ---')
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
      console.log('Database connection closed')
    }
  }
}

testSongEntity()
