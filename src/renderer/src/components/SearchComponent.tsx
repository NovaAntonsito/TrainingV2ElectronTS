import React, { useState, useEffect } from 'react'
import { Song } from '../../../preload/index.d'
import './SearchComponent.css'

interface SearchComponentProps {
  songs: Song[]
  onSearchResults: (filteredSongs: Song[]) => void
  placeholder?: string
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  songs,
  onSearchResults,
  placeholder = 'Buscar por título, álbum o artista...'
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const performSearch = () => {
      setIsSearching(true)

      if (!searchQuery.trim()) {
        // If search is empty, show all songs
        onSearchResults(songs)
        setIsSearching(false)
        return
      }

      const query = searchQuery.toLowerCase().trim()
      const filteredSongs = songs.filter(
        (song) =>
          song.titulo.toLowerCase().includes(query) ||
          song.album.toLowerCase().includes(query) ||
          song.artista.toLowerCase().includes(query)
      )

      onSearchResults(filteredSongs)
      setIsSearching(false)
    }

    // Debounce search to avoid excessive filtering
    const debounceTimer = setTimeout(performSearch, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, songs, onSearchResults])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  return (
    <div className="search-component">
      <div className="search-input-container">
        <div className="search-icon">🔍</div>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          autoComplete="off"
        />
        {searchQuery && (
          <button
            className="clear-search-button"
            onClick={handleClearSearch}
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
        {isSearching && (
          <div className="search-loading">
            <div className="search-spinner"></div>
          </div>
        )}
      </div>
      {searchQuery && <div className="search-info">Buscando: "{searchQuery}"</div>}
    </div>
  )
}

export default SearchComponent
