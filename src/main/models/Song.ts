import 'reflect-metadata'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  Check
} from 'typeorm'
import { User } from './User'

@Entity()
@Check(`"duracion" > 0`)
export class Song {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', {
    length: 255,
    nullable: false
  })
  titulo!: string

  @Column('varchar', {
    length: 255,
    nullable: false
  })
  album!: string

  @Column('varchar', {
    length: 255,
    nullable: false
  })
  artista!: string

  @Column('real', {
    nullable: false
  }) // Para números decimales en SQLite
  duracion!: number // En segundos

  @Column('varchar', {
    nullable: true,
    length: 500
  })
  portadaAlbum?: string // URL o path a la imagen

  @Column('varchar', {
    nullable: true,
    length: 500
  })
  previewMusica?: string // URL o path al preview

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn()
  user!: User

  @Column('varchar', {
    nullable: false
  })
  userId!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @BeforeInsert()
  @BeforeUpdate()
  validateFields(): void {
    // Validate required fields
    if (!this.titulo || this.titulo.trim().length === 0) {
      throw new Error('El título es requerido')
    }

    if (!this.album || this.album.trim().length === 0) {
      throw new Error('El álbum es requerido')
    }

    if (!this.artista || this.artista.trim().length === 0) {
      throw new Error('El artista es requerido')
    }

    if (!this.duracion || this.duracion <= 0) {
      throw new Error('La duración debe ser un número positivo')
    }

    // Validate field lengths
    if (this.titulo.length > 255) {
      throw new Error('El título no puede exceder 255 caracteres')
    }

    if (this.album.length > 255) {
      throw new Error('El álbum no puede exceder 255 caracteres')
    }

    if (this.artista.length > 255) {
      throw new Error('El artista no puede exceder 255 caracteres')
    }

    // Validate optional fields if provided
    if (this.portadaAlbum && this.portadaAlbum.length > 500) {
      throw new Error('La URL de portada del álbum no puede exceder 500 caracteres')
    }

    if (this.previewMusica && this.previewMusica.length > 500) {
      throw new Error('La URL del preview de música no puede exceder 500 caracteres')
    }

    // Trim whitespace from string fields
    this.titulo = this.titulo.trim()
    this.album = this.album.trim()
    this.artista = this.artista.trim()

    if (this.portadaAlbum) {
      this.portadaAlbum = this.portadaAlbum.trim()
    }

    if (this.previewMusica) {
      this.previewMusica = this.previewMusica.trim()
    }
  }

  // Helper method to validate a song object before creating/updating
  static validateSongData(songData: Partial<Song>): string[] {
    const errors: string[] = []

    if (!songData.titulo || songData.titulo.trim().length === 0) {
      errors.push('El título es requerido')
    } else if (songData.titulo.length > 255) {
      errors.push('El título no puede exceder 255 caracteres')
    }

    if (!songData.album || songData.album.trim().length === 0) {
      errors.push('El álbum es requerido')
    } else if (songData.album.length > 255) {
      errors.push('El álbum no puede exceder 255 caracteres')
    }

    if (!songData.artista || songData.artista.trim().length === 0) {
      errors.push('El artista es requerido')
    } else if (songData.artista.length > 255) {
      errors.push('El artista no puede exceder 255 caracteres')
    }

    if (!songData.duracion || songData.duracion <= 0) {
      errors.push('La duración debe ser un número positivo')
    }

    if (songData.portadaAlbum && songData.portadaAlbum.length > 500) {
      errors.push('La URL de portada del álbum no puede exceder 500 caracteres')
    }

    if (songData.previewMusica && songData.previewMusica.length > 500) {
      errors.push('La URL del preview de música no puede exceder 500 caracteres')
    }

    return errors
  }
}
