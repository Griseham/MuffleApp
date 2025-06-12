import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Info } from "lucide-react";
import InfoIconModal from "./InfoIconModal";

import { Search } from 'lucide-react';
import { TOTAL_WIDTH, TOTAL_HEIGHT } from './utils';
import { validateAndSanitizeInput, sanitizeSearchQuery, checkRateLimit } from '../utils/security';

/**
 * Enhanced Artist Filter Bar component for the Starfield interface
 * Supports both windowed and fullscreen modes with different styles for each
 * Provides artist search, selection, and constellation navigation
 */
const EnhancedArtistFilterBar = ({
  onAddArtist,
  onRemoveArtist,
  onSelectArtist,
  onNavigateConstellation,
  selectedArtist,
  activeArtists = [],
  isFullscreen = false,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [constellationIndex, setConstellationIndex] = useState(0);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Mock function to simulate searching for artists
  // In a real implementation, this would call your Spotify API
// Replace the mock searchForArtists function with this improved version
// that connects to a more realistic API endpoint

// Replace the mock searchForArtists function with this real Spotify API implementation
// Place this in your EnhancedArtistFilterBar.jsx file

const searchForArtists = useCallback(async (searchQuery) => {
  if (!searchQuery || searchQuery.trim().length < 2) return [];
  
  // Rate limiting check
  if (!checkRateLimit('artist-search', 10, 60000)) {
    setError('Too many search requests. Please wait a moment.');
    return [];
  }
  
  // Sanitize the search query
  const sanitizedQuery = sanitizeSearchQuery(searchQuery);
  if (!sanitizedQuery || sanitizedQuery.length === 0) {
    setError('Invalid search query');
    return [];
  }
  
  setLoading(true);
  setError('');
  
  try {
    // Step 1: Get the Spotify token from your server
    const tokenResponse = await fetch('${import.meta.env.VITE_API_BASE_URL}/spotify-token');
    
    if (!tokenResponse.ok) {
      setError("Could not connect to Spotify API");
      return [];
    }
    
    const tokenData = await tokenResponse.json();
    if (!tokenData.success || !tokenData.token) {
      setError("Authentication error");
      return [];
    }
    
    const token = tokenData.token;
    
    // Step 2: Search for artists using the sanitized token
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(sanitizedQuery)}&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!searchResponse.ok) {
      setError("Search failed. Please try again.");
      return [];
    }
    
    const searchData = await searchResponse.json();
    
    // Process and return the artists
    if (searchData.artists && searchData.artists.items && searchData.artists.items.length > 0) {
      // Map to our expected format
      return searchData.artists.items.map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images && artist.images.length > 0 ? artist.images[0].url : null,
        genres: artist.genres || [],
        popularity: artist.popularity
      }));
    } else {
      return [];
    }
  } catch (error) {
    setError("Search error. Please try again.");
    return [];
  } finally {
    setLoading(false);
  }
}, []);



  // Handle search input changes
  const handleSearchChange = useCallback(async (e) => {
    const value = e.target.value;
    
    // Validate and sanitize the input
    const validation = validateAndSanitizeInput(value, {
      maxLength: 100,
      minLength: 0,
      type: 'search'
    });
    
    if (!validation.isValid && value.length > 0) {
      setError(validation.error || 'Invalid input');
      return;
    }
    
    // Use sanitized value
    const sanitizedValue = validation.sanitized;
    setQuery(sanitizedValue);
    
    // Clear error if input becomes valid
    if (error && validation.isValid) {
      setError('');
    }
    
    if (sanitizedValue.trim().length >= 2) {
      const results = await searchForArtists(sanitizedValue);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchForArtists, error]);

  // Generate a random coordinate for a new constellation
  const generateConstellationCoordinate = useCallback(() => {
    const centerX = TOTAL_WIDTH / 2;
    const centerY = TOTAL_HEIGHT / 2;
    const angle = Math.random() * Math.PI * 2;
    const distance = 2000 + Math.random() * 3000; // Keep constellations far from center
    
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance
    };
  }, []);

  // Handle adding a new artist
// Replace the handleAddArtist function with this improved version
// It includes better validation and more consistent coordinate generation

const handleAddArtist = useCallback((artist) => {
  // Validate the artist object
  if (!artist || !artist.id || !artist.name) {
    setError('Invalid artist data received');
    setTimeout(() => setError(''), 2000);
    return;
  }
  
  // Sanitize artist name to prevent XSS
  const validation = validateAndSanitizeInput(artist.name, {
    maxLength: 200,
    minLength: 1,
    type: 'text'
  });
  
  if (!validation.isValid) {
    setError('Invalid artist name');
    setTimeout(() => setError(''), 2000);
    return;
  }
  
  // Skip if already added - improved check that's more robust
  if (activeArtists.some(a => a.id === artist.id || a.name.toLowerCase() === validation.sanitized.toLowerCase())) {
    setError(`Artist "${validation.sanitized}" is already added`);
    setTimeout(() => setError(''), 2000);
    return;
  }
  
  // Generate multiple constellation coordinates with better spacing
  const numConstellations = 1 + Math.floor(Math.random() * 2); // 1-3 constellations
  const constellations = [];
  
  // Create a seeded random number generator based on artist ID
  // This ensures the same artist will get the same coordinates
  const seed = artist.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pseudoRandom = (index) => {
    const val = Math.sin(seed + index * 9999) * 10000;
    return Math.abs(val - Math.floor(val));
  };
  
  for (let i = 0; i < numConstellations; i++) {
    // Use the centerX and centerY from the constants
    const centerX = TOTAL_WIDTH / 2;
    const centerY = TOTAL_HEIGHT / 2;
    
    // Use the pseudoRandom function to generate a consistent angle for this artist and constellation
    const angle = pseudoRandom(i) * Math.PI * 2;
    
    // Distance from center - further out for more space between constellations
    // Min: 2500, Max: 6000 - this keeps them in view but separated
    const minDistance = 2500;
    const maxDistance = 6000;
    const distance = minDistance + pseudoRandom(i + 100) * (maxDistance - minDistance);
    
    // Calculate coordinates
    const x = Math.round(centerX + Math.cos(angle) * distance);
    const y = Math.round(centerY + Math.sin(angle) * distance);
    
    // Add to constellation list
    constellations.push({ x, y });
  }
  
  // Extend the artist object with additional useful info and sanitized name
  const artistWithCoordinates = {
    ...artist,
    name: validation.sanitized, // Use sanitized name
    coordinate: constellations[0], // Main coordinate (first constellation)
    constellations, // All constellation coordinates
    addedAt: new Date().toISOString() // Track when it was added
  };
  
  // Validate that coordinates are valid numbers
  if (!Number.isFinite(artistWithCoordinates.coordinate.x) || 
      !Number.isFinite(artistWithCoordinates.coordinate.y)) {
    setError("Could not generate valid coordinates");
    setTimeout(() => setError(''), 2000);
    return;
  }
  
  // Call parent callback with the enhanced artist object
  onAddArtist(artistWithCoordinates);
  
  // Clear search UI
  setQuery('');
  setSearchResults([]);
}, [activeArtists, onAddArtist, TOTAL_WIDTH, TOTAL_HEIGHT]);
  // Handle selecting an artist to view their constellations
  const handleSelectArtist = useCallback((artist) => {
    setConstellationIndex(0);
    onSelectArtist(artist, 0);
  }, [onSelectArtist]);

  // Navigate between constellations
  const handleNavigateConstellation = useCallback((direction) => {
    if (!selectedArtist || !selectedArtist.constellations) return;
    
    const count = selectedArtist.constellations.length;
    if (count <= 1) return;
    
    const newIndex = (constellationIndex + direction + count) % count;
    setConstellationIndex(newIndex);
    onNavigateConstellation(selectedArtist, newIndex);
  }, [constellationIndex, onNavigateConstellation, selectedArtist]);

  // Handle removing an artist
  const handleRemoveArtist = useCallback((artist, event) => {
    if (event) event.stopPropagation();
    onRemoveArtist(artist);
  }, [onRemoveArtist]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current && 
        !resultsRef.current.contains(event.target)
      ) {
        setSearchResults([]);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={isFullscreen ? styles.containerFullscreen : styles.containerWindowed}>
      {/* Search Area with Constellations Info Icon */}
<div style={styles.searchArea} ref={searchRef}>
  <form
    onSubmit={(e) => {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleAddArtist(searchResults[0]);
      }
    }}
    style={{ width: '100%' }}
  >
    <div style={styles.searchInputContainer}>
      <Search size={16} color="#aaa" style={styles.searchIcon} />
      <input
        type="text"
        value={query}
        onChange={handleSearchChange}
        placeholder="Search for artists..."
        style={styles.searchInput}
      />
      {loading && <div style={styles.loadingSpinner} />}
    </div>
  </form>

  {/* Info icon, pinned to top-right of the search area */}
  <div
    style={{
      position: 'absolute',
      top: '8px',
      right: '16px',
      zIndex: 1001
    }}
  >
    <InfoIconModal
      title="Constellations"
      iconSize={16}
      buttonText={false}
      steps={[
        {
          icon: <Info size={18} color="#a9b6fc" />,
          title: "Constellations",
          content:
            "Use this tool to find specific artists within the threads in the starfield."
        },
        {
          icon: <Info size={18} color="#a9b6fc" />,
          title: "Thread Connections",
          content:
            "The Threads containing the searched artists will connect like constellations"
        }
      ]}
    />
  </div>

  {/* Error Message */}
  {error && <div style={styles.errorMessage}>{error}</div>}

  {/* Search Results Dropdown */}
  {searchResults.length > 0 && (
    <div style={styles.resultsDropdown} ref={resultsRef}>
      {searchResults.map(artist => (
        <div
          key={artist.id}
          style={styles.resultItem}
          onClick={() => handleAddArtist(artist)}
        >
          <div style={styles.resultIcon}>
            {artist.imageUrl ? (
              <img src={artist.imageUrl} alt="" style={styles.artistImage} />
            ) : (
              <div style={styles.artistInitial}>{artist.name[0]}</div>
            )}
          </div>
          <div style={styles.resultInfo}>
            <div style={styles.resultName}>{artist.name}</div>
            {artist.genres && (
              <div style={styles.resultGenres}>
                {artist.genres.slice(0, 2).join(', ')}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      
      {/* Active Artists Row */}
      {activeArtists.length > 0 && (
        <div style={styles.artistsContainer}>
          {activeArtists.map(artist => {
            const isSelected = selectedArtist && selectedArtist.id === artist.id;
            const hasMultipleConstellations = 
              artist.constellations && artist.constellations.length > 1;
              
            return (
              <div 
                key={artist.id}
                style={{
                  ...styles.artistPill,
                  ...(isSelected ? styles.selectedArtistPill : {})
                }}
                onClick={() => handleSelectArtist(artist)}
              >
                {artist.imageUrl ? (
                  <img src={artist.imageUrl} alt="" style={styles.pillImage} />
                ) : (
                  <div style={styles.pillInitial}>{artist.name[0]}</div>
                )}
                <span style={styles.pillName}>{artist.name}</span>
                
                {/* Remove button */}
                <button 
                  onClick={(e) => handleRemoveArtist(artist, e)}
                  style={styles.removeButton}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Constellation Navigation - Only show if artist has multiple constellations */}
      {selectedArtist && selectedArtist.constellations && selectedArtist.constellations.length > 1 && (
        <div style={styles.navigationControls}>
          <button 
            onClick={() => handleNavigateConstellation(-1)}
            style={styles.navButton}
          >
            ←
          </button>
          <div style={styles.navStatus}>
            Constellation {constellationIndex + 1} of {selectedArtist.constellations.length}
          </div>
          <button 
            onClick={() => handleNavigateConstellation(1)}
            style={styles.navButton}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

// Styles for both windowed and fullscreen modes
const styles = {
  containerWindowed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 16px',
    backgroundColor: 'rgba(13, 13, 30, 0.85)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderRadius: '0 0 12px 12px',
    zIndex: 1000,
    transition: 'all 0.3s ease',
  },
  containerFullscreen: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'auto',
    minWidth: '500px',
    maxWidth: '90%',
    padding: '15px 20px',
    backgroundColor: 'rgba(13, 13, 30, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    transition: 'all 0.3s ease',
  },
  searchArea: {
    position: 'relative',
    width: '100%',
  },
  searchInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    backgroundColor: 'rgba(20, 20, 40, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  loadingSpinner: {
    position: 'absolute',
    right: '12px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTopColor: '#1DB954', // Spotify green for branding
    animation: 'spin 1s linear infinite',
  },
  errorMessage: {
    fontSize: '12px',
    color: '#ff5555',
    marginTop: '4px',
    padding: '0 4px',
  },
  resultsDropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 20, 40, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    maxHeight: '200px',
    overflowY: 'auto',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    zIndex: 1001,
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
  },
  resultIcon: {
    width: '32px',
    height: '32px',
    marginRight: '10px',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  artistImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  artistInitial: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1DB954', // Spotify green
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  resultInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  resultName: {
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
  },
  resultGenres: {
    color: '#aaa',
    fontSize: '12px',
  },
  artistsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    paddingTop: '4px',
  },
  artistPill: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 50, 0.7)',
    borderRadius: '20px',
    padding: '5px 10px 5px 5px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  selectedArtistPill: {
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
    borderColor: 'rgba(29, 185, 84, 0.5)',
    boxShadow: '0 0 8px rgba(29, 185, 84, 0.3)',
  },
  pillImage: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    marginRight: '8px',
    objectFit: 'cover',
  },
  pillInitial: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#1DB954',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    marginRight: '8px',
  },
  pillName: {
    color: 'white',
    fontSize: '13px',
    maxWidth: '100px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  removeButton: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    fontSize: '12px',
    marginLeft: '6px',
    padding: 0,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  navigationControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '4px',
  },
  navButton: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(30, 30, 50, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s ease',
  },
  navStatus: {
    color: '#ccc',
    fontSize: '13px',
    padding: '0 8px',
  }
};

export default EnhancedArtistFilterBar;