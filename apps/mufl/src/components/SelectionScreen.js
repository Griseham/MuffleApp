import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import './SelectionScreen.css';
import { fetchSimilarArtists } from '../utils/fetchSimilar';
import _ from 'lodash';


// Set base URL for API requests
 axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL || '/api';

// Utility functions
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Remove artists that normalise to the same name
const normalise = (name) => {
  const raw = name.trim().toLowerCase();

  /* SPECIAL-CASE ── treat any “Morgan Wallen …” string as the same key */
  if (raw.includes('morgan wallen')) return 'morganwallen';

  /* default: strip spaces, quotes, punctuation */
  return raw.replace(/[\u2019’'".\s]/g, '');
};  // strips spaces & quotes


const dedupeArtists = (arr) => {
  const seen = new Set();
  return arr.filter((a) => {
    const key = normalise(a.name || '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};


// Reusable components
const ArtistImage = ({ name, src, size = "large" }) => {
  return (
    <img
      src={src || '/placeholder.jpg'}
      alt={name}
      className="artist-circle-image"
      onError={(e) => { 
        // Only use placeholder for non-search results to avoid placeholder circles
        if (!src || !src.includes("api.spotify.com")) {
          e.currentTarget.src = '/placeholder.jpg';
        }
      }}
    />
  );
};

const LoadingIndicator = ({ message = "Loading artists..." }) => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>{message}</p>
  </div>
);

// Main SelectionScreen component
const SelectionScreen = ({ onContinue }) => {
  // Consolidated loading states
  const [loadingState, setLoadingState] = useState({
    main: true,           // Main loading state
    more: false,          // Loading more artists
    search: false,        // Search in progress
    genre: false,         // Genre loading
    artistId: null        // ID of artist being loaded
  });
  
  // Artist data states
  const [displayedArtists, setDisplayedArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  
  // UI control states
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs
  const genreFiltersRef = useRef(null);
  const artistsAreaRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);

  
  
  // Helper for updating loading states
  const setLoading = useCallback((type, value) => {
    setLoadingState(prev => ({ ...prev, [type]: value }));
  }, []);
  
  // API helper function
  const safeApiCall = useCallback(async (apiCall, fallbackData = [], errorMsg = 'API Error') => {
    try {
      return await apiCall();
    } catch (error) {
      setError(errorMsg);
      return fallbackData;
    }
  }, []);
  
  // Mock artist data for demo/dev purposes
  const generateMockArtists = useCallback((baseNames, prefix = '') => {
    return baseNames.map((name, index) => ({
      name,
      image: `/api/placeholder/200/200`,
      id: `${prefix}-${index + 1}`,
      isMain: true
    }));
  }, []);

  // Sanitize input to prevent injection attacks
  const sanitizeInput = useCallback((input) => {
    // Remove potentially dangerous characters and patterns
    return input
      .replace(/[<>"'`\\]/g, '') // Remove HTML/script injection chars
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/\{\{.*?\}\}/g, '') // Remove template injection
      .replace(/\$\{.*?\}/g, '') // Remove ES6 template literals
      .replace(/eval\s*\(/gi, '') // Remove eval calls
      .replace(/Function\s*\(/gi, '') // Remove Function constructor
      .replace(/setTimeout\s*\(/gi, '') // Remove setTimeout
      .replace(/setInterval\s*\(/gi, '') // Remove setInterval
      .trim();
  }, []);

  // Validate search query length and content
  const validateSearchQuery = useCallback((query) => {
    const sanitized = sanitizeInput(query);
    
    // Length validation
    if (sanitized.length > 100) {
      return sanitized.substring(0, 100);
    }
    
    // Only allow alphanumeric, spaces, hyphens, apostrophes, and basic punctuation
    const allowedPattern = /^[a-zA-Z0-9\s\-'.,&()]+$/;
    if (sanitized && !allowedPattern.test(sanitized)) {
      return sanitized.replace(/[^a-zA-Z0-9\s\-'.,&()]/g, '');
    }
    
    return sanitized;
  }, [sanitizeInput]);
  
// Search for artists with enhanced security
const searchArtists = useCallback(async (query) => {
  if (!query.trim()) {
    setSearchResults([]);
    return;
  }



  // Additional server-side validation
  const finalQuery = validateSearchQuery(query);
  if (!finalQuery || finalQuery.length < 2) {
    setSearchResults([]);
    return;
  }
  
  setLoading('search', true);
  try {
    // Use GET request with query parameter
    const res = await axios.get('/apple-music/search-artists', {
      params : { query: finalQuery },
      timeout: 10_000
    });
    
    
    
    // Validate response structure
    if (!Array.isArray(res.data)) {
      throw new Error('Invalid response format');
    }
    
    // Filter and validate results
    const filteredResults = res.data
      .filter(artist => 
        artist && 
        typeof artist === 'object' &&
        artist.name &&
        typeof artist.name === 'string' &&
        artist.image && 
        artist.image !== 'fallback.jpg' && 
        !artist.image.includes('/api/placeholder/') &&
        artist.image.startsWith('http') // Ensure valid URL
      )
      .slice(0, 50); // Limit results to prevent memory issues
    
    setSearchResults(filteredResults);
  } catch (err) {
    
    // More descriptive error message based on error type
    const errorMessage = err.response?.status === 500 
      ? "Our search service is currently unavailable. Showing you similar results instead."
      : err.code === 'ECONNABORTED'
      ? "Search request timed out. Please try again."
      : "We couldn't complete your search. Showing you similar results instead.";
    
    setError(errorMessage);
    
    // Fallback to safe mock filtering if API fails
    const queryLower = finalQuery.toLowerCase();
    const safeMockArtists = [
      'Taylor Swift', 'Drake', 'Billie Eilish', 'The Weeknd', 'Bad Bunny',
      'Dua Lipa', 'Post Malone', 'Ariana Grande', 'Travis Scott', 'BTS',
      'Lil Nas X', 'Olivia Rodrigo', 'Doja Cat', 'Harry Styles', 'Justin Bieber'
    ];
    
    const mockResults = safeMockArtists
      .filter(name => name.toLowerCase().includes(queryLower))
      .slice(0, 10); // Limit mock results
    
    const formattedResults = generateMockArtists(mockResults, 'search');
    setSearchResults(formattedResults);
    
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  }
  setLoading('search', false);
}, [generateMockArtists, setLoading, validateSearchQuery]);
const debouncedSearch = useRef(_.debounce(searchArtists, 400)).current;

// Also, let's apply the same filtering to the main artists fetch and genre fetch:
// For fetchMainArtists
// SelectionScreen.js
const fetchMainArtists = useCallback(async () => {
  setLoading('main', true);
  try {
    const { data } = await axios.get('/apple-music/popular-artists', {
      params: { limit: 20, offset: 0 }
    });

    setDisplayedArtists(
      dedupeArtists(data.artists.filter(a => a.image))
    );

    /* 👉 store the whole pool NOW, while `data` is in scope */
    localStorage.setItem(
      'mufl_popularArtists',
      JSON.stringify(data.artists)      // we’ll re-use this in Rooms
    );
  } catch (err) {
    setError('Could not load artists – showing sample list');
    setDisplayedArtists(dedupeArtists(generateMockArtists(
      ['Taylor Swift','Drake','Billie Eilish','The Weeknd','Bad Bunny'],
      'apple-fallback'
    )));
    setHasMore(false);
  }
  setLoading('main', false);
}, [generateMockArtists, setLoading]);

// For fetchArtistsByGenre

  // Load more artists
  const loadMoreArtists = useCallback(async () => {
    if (loadingState.more || !hasMore) return;
  
    setLoading('more', true);
    try {
      const { data } = await axios.get('/apple-music/popular-artists', {
        params: {
          limit : 20,
          offset: displayedArtists.length
        }
      });
  
      if (data.artists.length) {
        setDisplayedArtists((prev) =>
          dedupeArtists([...prev, ...data.artists])
        );                                                    
                setHasMore(data.hasMore);
      } else {
        setHasMore(false);                 // nothing left across both playlists
      }
    } catch (_) {
      setError('Could not load more artists');
    }
    setLoading('more', false);
  }, [loadingState.more, hasMore, displayedArtists.length, setLoading]);
  
  // Handle genre selection

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (!artistsAreaRef.current || loadingState.more || !hasMore || searchQuery.trim()) return;
    
    const { scrollTop, scrollHeight, clientHeight } = artistsAreaRef.current;
    
    // Load more when near bottom
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      loadMoreArtists();
    }
  }, [loadingState.more, hasMore, searchQuery, loadMoreArtists]);

  // Handle search input with security measures
  const handleSearchChange = (e) => {
    const value = validateSearchQuery(e.target.value);   // keeps your “security” rules
    setSearchQuery(value);
    debouncedSearch(value);                              // ≤ 1 call / 400 ms
  };
  
  // Fetch similar artists - Now using the centralized fetchSimilarArtists utility
  const fetchSimilarForArtist = useCallback(async (artist) => {
    try {
      // Create a simple array with just this artist
      const similarArtists = await fetchSimilarArtists([artist]);
      return similarArtists;
    } catch (err) {
      
      // Fallback to mock data
      return generateMockArtists([
        `Similar to ${artist.name} 1`,
        `Similar to ${artist.name} 2`,
        `Similar to ${artist.name} 3`,
        `Similar to ${artist.name} 4`
      ], `similar-${artist.name.replace(/\s+/g, '-').toLowerCase()}`);
    }
  }, [generateMockArtists]);
  
  // Handle artist selection/deselection
  const handleArtistSelection = useCallback(async (artist) => {
    // Prevent interaction during loading
    if (loadingState.artistId !== null || loadingState.genre) return;
    
    const isAlreadySelected = selectedArtists.some(a => a.name === artist.name);
    
    // Handle deselection
    if (isAlreadySelected) {
      setSelectedArtists(prev => prev.filter(a => a.name !== artist.name));
      return;
    }
    
    // Handle selection (limit to 5)
    if (selectedArtists.length < 5) {
      setSelectedArtists(prev => [...prev, artist]);
      
      // Show similar artists if not in search mode
      if (artist.isMain && !searchQuery.trim()) {
        setLoadingState(prev => ({ ...prev, artistId: artist.id }));
        
        const similarArtists = await fetchSimilarForArtist(artist);
        
        if (similarArtists && similarArtists.length > 0) {
          const relatedArtists = similarArtists
  .filter(r => !displayedArtists.some(d => normalise(d.name) === normalise(r.name)))
  .map(r => ({ ...r, isMain:false, fadeIn:true }));

          
          // Insert related artists after the selected artist
          setDisplayedArtists(prev => {
            const index = prev.findIndex(a => a.id === artist.id || a.name === artist.name);
            if (index !== -1) {
              const updated = [...prev];
              updated.splice(index + 1, 0, ...relatedArtists);
              return updated;
            }
            return prev;
          });
        }
        
        setLoadingState(prev => ({ ...prev, artistId: null }));
      }
    }
  }, [loadingState.artistId, loadingState.genre, selectedArtists, searchQuery, fetchSimilarForArtist]);
  
  // Effects ----------------
  
  // Initial data fetch
  useEffect(() => {
    fetchMainArtists();
  }, [fetchMainArtists]);
  
  // Scroll event listener
  useEffect(() => {
    const currentRef = artistsAreaRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      return () => currentRef.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // Scroll selected genre button into view

  
  // Computed values ----------------
  
  // Artists to display based on search state
  const artistsToShow = useMemo(() => 
    searchQuery.trim() ? searchResults : displayedArtists,
    [searchQuery, searchResults, displayedArtists]
  );
  
  const isMaxSelected = useMemo(() => 
    selectedArtists.length >= 5,
    [selectedArtists]
  );
  
  // UI Rendering ----------------
  
  return (
    <div className="selection-screen-container">
      <div className="selection-header">
        <h1>Pick a few artists</h1>
        
        {/* Search bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for any artist..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
            autoComplete="off"
            maxLength={100}
            spellCheck={false}
            data-lpignore="true"
            data-form-type="other"
            inputMode="search"
            aria-label="Search for artists"
            role="searchbox"
          />
          {loadingState.search && <div className="search-spinner"></div>}
        </div>
        
      
      </div>

      <div className="artists-area" ref={artistsAreaRef}>
        {loadingState.main ? (
          <LoadingIndicator />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            {/* Search loading indicator */}
            {loadingState.search ? (
              <LoadingIndicator message="Searching for artists..." />
            ) : (
              <div className="artists-grid">
                {artistsToShow.length > 0 ? (
                  artistsToShow.map((artist, index) => (
                    <div
                      key={`${artist.id || artist.name}-${index}`}
                      className={`selection-artist-circle ${
                        selectedArtists.some(a => a.name === artist.name) ? 'selected' : ''
                      } ${artist.fadeIn ? 'fade-in' : ''}`}
                      onClick={() => handleArtistSelection(artist)}
                    >
                      <div className="selection-artist-image-container">
                        {loadingState.artistId === artist.id && (
                          <div className="artist-loading-overlay">
                            <div className="artist-loading-spinner"></div>
                          </div>
                        )}
                        <ArtistImage name={artist.name} src={artist.image} />
                      </div>
                      <div className="selection-artist-name">{artist.name}</div>
                    </div>
                  ))
                ) : searchQuery.trim() ? (
                  <div className="no-results">
                    No artists found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="no-results">
                    No artists available
                  </div>
                )}
              </div>
            )}
            
            {/* Load more button */}
            {!loadingState.main && !searchQuery.trim() && !loadingState.search && artistsToShow.length > 0 && (
              <div className="load-more-container">
                {loadingState.more ? (
                  <div className="loading-spinner"></div>
                ) : hasMore ? (
                  <button 
                    className="load-more-button" 
                    onClick={loadMoreArtists}
                    disabled={loadingState.more}
                  >
                    Load more artists
                  </button>
                ) : (
                  <span>No more artists to load</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Bottom fixed area */}
      <div className="bottom-area">
        <div className="selection-indicator">
          <div className="selected-artists-circles">
            {selectedArtists.slice(0, 5).map((artist, index) => (
              <div 
                key={`selected-${artist.id || artist.name}-${index}`} 
                className="small-artist-circle"
                style={{ zIndex: 5 - index }}
              >
                <ArtistImage name={artist.name} src={artist.image} size="small" />
              </div>
            ))}
          </div>
          <div className="selected-count">{selectedArtists.length} / 5</div>
        </div>
        
        <button
          className="continue-button"
          disabled={selectedArtists.length === 0}
          onClick={() => onContinue(selectedArtists)}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default SelectionScreen;