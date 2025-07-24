import { AppDataSource } from './database/data-source'
import { AuthService } from './services/AuthService'
import { MusicService } from './services/MusicService'

async function createSampleData() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      console.log('Database connection initialized')
    }

    // Get services
    const authService = AuthService.getInstance()
    const musicService = MusicService.getInstance()

    // Login as the mock user
    const loginResult = await authService.login({
      username: 'anton',
      password: 'admin'
    })

    if (!loginResult.success) {
      console.error('Failed to login:', loginResult.error)
      return
    }

    console.log('Logged in as:', loginResult.user?.username)

    // Sample songs data
    const sampleSongs = [
      {
        titulo: 'Bohemian Rhapsody',
        album: 'A Night at the Opera',
        artista: 'Queen',
        duracion: 355, // 5:55
        portadaAlbum:
          'https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_A_Night_at_the_Opera.png',
        previewMusica: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
      },
      {
        titulo: 'Stairway to Heaven',
        album: 'Led Zeppelin IV',
        artista: 'Led Zeppelin',
        duracion: 482, // 8:02
        portadaAlbum:
          'https://upload.wikimedia.org/wikipedia/en/2/26/Led_Zeppelin_-_Led_Zeppelin_IV.jpg'
      },
      {
        titulo: 'Hotel California',
        album: 'Hotel California',
        artista: 'Eagles',
        duracion: 391, // 6:31
        portadaAlbum: 'https://upload.wikimedia.org/wikipedia/en/4/49/Hotelcalifornia.jpg'
      },
      {
        titulo: 'Imagine',
        album: 'Imagine',
        artista: 'John Lennon',
        duracion: 183, // 3:03
        portadaAlbum:
          'https://upload.wikimedia.org/wikipedia/en/1/1d/John_Lennon_-_Imagine_John_Lennon.jpg'
      },
      {
        titulo: "Sweet Child O' Mine",
        album: 'Appetite for Destruction',
        artista: "Guns N' Roses",
        duracion: 356, // 5:56
        portadaAlbum: 'https://upload.wikimedia.org/wikipedia/en/5/50/Appetite_for_Destruction.jpg'
      },
      {
        titulo: 'Billie Jean',
        album: 'Thriller',
        artista: 'Michael Jackson',
        duracion: 294, // 4:54
        portadaAlbum:
          'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png'
      },
      {
        titulo: 'Smells Like Teen Spirit',
        album: 'Nevermind',
        artista: 'Nirvana',
        duracion: 301, // 5:01
        portadaAlbum:
          'https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg'
      },
      {
        titulo: 'Like a Rolling Stone',
        album: 'Highway 61 Revisited',
        artista: 'Bob Dylan',
        duracion: 369, // 6:09
        portadaAlbum:
          'https://upload.wikimedia.org/wikipedia/en/4/47/Bob_Dylan_-_Highway_61_Revisited.jpg'
      }
    ]

    // Create sample songs
    console.log('Creating sample songs...')
    for (const songData of sampleSongs) {
      try {
        const result = await musicService.createSong(songData)
        if (result.success) {
          console.log(`✓ Created song: ${songData.titulo} by ${songData.artista}`)
        } else {
          console.log(`✗ Failed to create song: ${songData.titulo} - ${result.error}`)
        }
      } catch (error) {
        console.log(`✗ Error creating song: ${songData.titulo} - ${error}`)
      }
    }

    // Get all songs to verify
    const allSongs = await musicService.getAllSongs()
    if (allSongs.success) {
      console.log(`\nTotal songs in database: ${allSongs.data?.length}`)
    }
  } catch (error) {
    console.error('Error creating sample data:', error)
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
      console.log('Database connection closed')
    }
  }
}

// Run the script
createSampleData()
