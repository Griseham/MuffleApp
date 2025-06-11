import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, MusicNoteIcon, AlbumIcon } from './Icons/Icons';

// Front-end → Back-end base URL
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

// Additional icons needed for the new design
const SearchIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowLeftIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronUpIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 15L12 8L19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDownIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Widget = ({ selectedArtists = [], queuedSongs = [], setWidgetSelectedArtist, onRemoveArtist, onSongFromWidget }) => {
  // States
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [playingSong, setPlayingSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [personalQueue, setPersonalQueue] = useState([]);
  const [artistSongs, setArtistSongs] = useState({});
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // 🔍 global search
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [loadingSearchResults, setLoadingSearchResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Helper function to validate if an image URL is real
  const hasValidImage = (imageUrl) => {
    return imageUrl && 
           imageUrl !== 'fallback.jpg' && 
           imageUrl !== '/placeholder-200.png' &&
           !imageUrl.includes('placeholder') &&
           !imageUrl.includes('picsum') &&
           imageUrl.startsWith('http');
  };

  // Filter selected artists to only show those with valid images and from artist pool
  const validSelectedArtists = selectedArtists.filter(artist => 
    hasValidImage(artist.image) && artist.name && artist.id
  );

  // Fetch songs for an artist from the dedicated Apple Music artist songs endpoint
  const fetchArtistSongs = async (artistName) => {
    if (artistSongs[artistName]) {
      return artistSongs[artistName]; // Return cached songs
    }

    setLoadingSongs(true);
    setSearchError('');

    try {
      console.log('[Widget] fetching top tracks for', artistName);
      
      // Call the dedicated artist songs endpoint
      const response = await fetch(`${API_BASE}/apple-music/artist-songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          artistName: artistName
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const songs = (data.songs || []).slice(0, 3);   // keep only the first 3

      console.log('[Widget] top-tracks data →', songs);

      // Cache the songs
      setArtistSongs(prev => ({
        ...prev,
        [artistName]: songs
      }));

      return songs;

    } catch (error) {
      console.error(`Error fetching songs for ${artistName}:`, error);
      setSearchError(`Failed to load songs for ${artistName}`);
      return [];
    } finally {
      setLoadingSongs(false);
    }
  };

  // Sanitize search input to prevent injection attacks
  const sanitizeSearchInput = (input) => {
    if (!input || typeof input !== 'string') return '';
    
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
      .trim()
      .substring(0, 100); // Limit length
  };

  // Validate search query
  const validateSearchQuery = (query) => {
    const sanitized = sanitizeSearchInput(query);
    
    // Only allow safe characters for music search
    const allowedPattern = /^[a-zA-Z0-9\s\-'.,&()!?]+$/;
    if (sanitized && !allowedPattern.test(sanitized)) {
      console.warn('[Widget] Invalid characters in search query');
      return sanitized.replace(/[^a-zA-Z0-9\s\-'.,&()!?]/g, '');
    }
    
    return sanitized;
  };

  // Search ANY song on Apple Music with enhanced security
  const fetchGlobalSongs = async (query) => {
    const validatedQuery = validateSearchQuery(query);
    if (!validatedQuery || validatedQuery.length < 2) {
      setGlobalSearchResults([]);
      return;
    }
    
    setLoadingSearchResults(true);
    setSearchError('');
    
    try {
      console.log('[Widget] global search →', validatedQuery);

      const res = await fetch(
        `${API_BASE}/apple-music/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            searchQuery: validatedQuery,
            timestamp: Date.now(),
            source: 'widget_global_search'
          }),
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(15000)
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Validate response structure and sanitize results
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      const validatedResults = data
        .filter(song => 
          song &&
          typeof song === 'object' &&
          song.track &&
          typeof song.track === 'string' &&
          song.artist &&
          typeof song.artist === 'string'
        )
        .slice(0, 20); // Limit results

      console.log('[Widget] global search results =', validatedResults.length);
      setGlobalSearchResults(validatedResults);
    } catch (err) {
      console.error('[Widget] global search error', err);
      if (err.name === 'TimeoutError') {
        setSearchError('Search timed out – try again');
      } else {
        setSearchError('Search failed – try again');
      }
    } finally {
      setLoadingSearchResults(false);
    }
  };

  // Search within a specific artist's catalog with security
  const fetchArtistSearch = async (query, artistName) => {
    const validatedQuery = validateSearchQuery(query);
    const validatedArtistName = sanitizeSearchInput(artistName);
    
    if (!validatedQuery || validatedQuery.length < 2 || !validatedArtistName) {
      setGlobalSearchResults([]);
      return;
    }
    
    setLoadingSearchResults(true);
    setSearchError('');
    
    try {
      const res = await fetch(
        `${API_BASE}/apple-music/artist-search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            searchQuery: validatedQuery, 
            artistName: validatedArtistName,
            timestamp: Date.now(),
            source: 'widget_artist_search'
          }),
          // Add timeout
          signal: AbortSignal.timeout(15000)
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Validate and sanitize artist search results
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      const validatedResults = data
        .filter(song => 
          song &&
          typeof song === 'object' &&
          song.track &&
          typeof song.track === 'string' &&
          song.artist &&
          typeof song.artist === 'string'
        )
        .slice(0, 15); // Limit artist-specific results
      
      setGlobalSearchResults(validatedResults);
    } catch (err) {
      console.error('[Widget] artist search error', err);
      if (err.name === 'TimeoutError') {
        setSearchError('Search timed out – try again');
      } else {
        setSearchError('Search failed – try again');
      }
    } finally {
      setLoadingSearchResults(false);
    }
  };

  // Handle artist selection
  const handleSelectArtist = async (artistId) => {
    const artist = validSelectedArtists.find(a => a.id === artistId);
    if (artist) {
      setSelectedArtist(artist.id);
      setSearchQuery('');
      setSearchError('');
      setWidgetSelectedArtist(artist);
      
      // Fetch songs for this artist
      await fetchArtistSongs(artist.name);
    }
  };

  // Go back from detail view
  const handleBackToList = () => {
    setSelectedArtist(null);
    setSearchQuery('');
    setSearchError('');
    setWidgetSelectedArtist(null);
  };

  // Remove an artist from the selected list
  const handleRemoveArtist = (artistId) => {
    if (onRemoveArtist) {
      onRemoveArtist(artistId);
    }
    
    // If we're currently viewing this artist, go back to the list
    if (selectedArtist === artistId) {
      handleBackToList();
    }
  };

  // Toggle play state for a song
  const togglePlay = (songId) => {
    setPlayingSong(playingSong === songId ? null : songId);
  };

  // Add song to personal queue with validation and timer
  const addToPersonalQueue = (song) => {
    // Validate song object
    if (!song || typeof song !== 'object' || !song.track || !song.artist) {
      console.error('[Widget] Invalid song object for queue');
      return;
    }
    
    // Sanitize song data
    const sanitizedSong = {
      track: sanitizeSearchInput(song.track),
      artist: sanitizeSearchInput(song.artist),
      album: song.album ? sanitizeSearchInput(song.album) : '',
      artworkUrl: song.artworkUrl && song.artworkUrl.startsWith('http') ? song.artworkUrl : '',
      previewUrl: song.previewUrl && song.previewUrl.startsWith('http') ? song.previewUrl : ''
    };
    
    // Check for duplicate songs in queue
    const isDuplicate = personalQueue.some(item => 
      item.track === sanitizedSong.track && item.artist === sanitizedSong.artist
    );
    
    if (isDuplicate) {
      setSearchError('Song already in queue');
      setTimeout(() => setSearchError(''), 2000);
      return;
    }
    
    // Limit queue size
    if (personalQueue.length >= 10) {
      setSearchError('Queue is full (max 10 songs)');
      setTimeout(() => setSearchError(''), 2000);
      return;
    }
    
    const newQueueItem = {
      ...sanitizedSong,
      queueId: `queue-${Date.now()}-${Math.random()}`,
      countdown: 3,
      isPaused: false
    };
    
    setPersonalQueue(prev => [...prev, newQueueItem]);
  };

  // Toggle pause for a queued song
  const togglePauseTimer = (queueId) => {
    setPersonalQueue(prev => 
      prev.map(item => 
        item.queueId === queueId 
          ? { ...item, isPaused: !item.isPaused } 
          : item
      )
    );
  };

  // Move item in queue
  const moveItem = (queueId, direction) => {
    setPersonalQueue(prev => {
      const index = prev.findIndex(item => item.queueId === queueId);
      
      if ((direction === 'up' && index <= 0) || 
          (direction === 'down' && index >= prev.length - 1)) {
        return prev;
      }
      
      const newQueue = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap the items
      const temp = newQueue[index];
      newQueue[index] = newQueue[newIndex];
      newQueue[newIndex] = temp;
      
      return newQueue;
    });
  };

  // Remove song from personal queue
  const removeSong = (queueId) => {
    setPersonalQueue(prev => prev.filter(item => item.queueId !== queueId));
  };

  // Update countdowns every second and move finished songs to main queue
  useEffect(() => {
    const interval = setInterval(() => {
      setPersonalQueue(prev => {
        const songsToMoveToMain = [];
        
        // Process each item in the queue
        const updatedQueue = prev.map(item => {
          if (item.isPaused) return item;
          
          const newCountdown = item.countdown - 1;
          
          // If countdown reaches 0, add to songs that should move to main queue
          if (newCountdown <= 0) {
            songsToMoveToMain.push(item);
            return null; // Mark for removal
          }
          
          return { ...item, countdown: newCountdown };
        }).filter(item => item !== null); // Remove items that reached 0
        
        // Move finished songs to the main queue via callback
        if (songsToMoveToMain.length > 0 && onSongFromWidget) {
          console.log(`🎵 Moving ${songsToMoveToMain.length} songs from Widget to main queue`);
          
          songsToMoveToMain.forEach(song => {
            onSongFromWidget(song);
          });
        }
        
        return updatedQueue;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [onSongFromWidget]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Debounced search with security measures
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const artist = validSelectedArtists.find(a => a.id === selectedArtist);
    const validatedQuery = validateSearchQuery(searchQuery);
    
    if (!validatedQuery || validatedQuery.length < 2) {
      setGlobalSearchResults([]);
      return;
    }
    
    // Debounce search to prevent excessive API calls
    const timeout = setTimeout(() => {
      if (artist) {
        // limit search to this artist's catalogue
        fetchArtistSearch(validatedQuery, artist.name);
      } else {
        // no artist selected → fall back to global search
        fetchGlobalSongs(validatedQuery);
      }
    }, 600); // 600ms debounce
    
    setSearchTimeout(timeout);
    
    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchQuery, selectedArtist]);

  // Get current artist's songs
  const getCurrentArtistSongs = () => {
    // 1️⃣ global search overrides everything
    if (searchQuery.trim()) {
      return globalSearchResults;
    }

    // 2️⃣ otherwise show cached top-5 for the chosen artist
    if (!selectedArtist) return [];
    const artist = validSelectedArtists.find(a => a.id === selectedArtist);
    return artist ? (artistSongs[artist.name] || []) : [];
  };

  // Get filtered songs based on search query
  const filteredSongs = getCurrentArtistSongs();

  return (
    <div className="flex h-full rounded-lg overflow-hidden bg-gray-950 border border-gray-800">
      {/* LEFT PANEL */}
      <div className={`${selectedArtist ? 'w-3/5' : 'w-1/2'} bg-black transition-all duration-300 flex flex-col`}>
        {selectedArtist ? (
          // Artist Detail View with Search and Songs
          <div className="flex flex-col h-full">
            {/* Header with back button and artist image */}
            <div className="flex items-center p-3 border-b border-gray-800 bg-gray-900/30">
              <button 
                onClick={handleBackToList}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 mr-3"
              >
                <ArrowLeftIcon size={18} className="text-white" />
              </button>
              
              {/* Artist Profile Image */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center mr-3 shadow-lg">
                {hasValidImage(validSelectedArtists.find(a => a.id === selectedArtist)?.image) ? (
                  <img 
                    src={validSelectedArtists.find(a => a.id === selectedArtist)?.image} 
                    alt={validSelectedArtists.find(a => a.id === selectedArtist)?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MusicNoteIcon size={24} className="text-gray-600" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">
                  {validSelectedArtists.find(a => a.id === selectedArtist)?.name}
                </h3>
                <p className="text-xs text-gray-400">Popular songs</p>
              </div>
            </div>
            
            {/* Search bar */}
            <div className="p-3 border-b border-gray-800/50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search songs..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-md py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                  value={searchQuery}
                  onChange={(e) => {
                    const validatedValue = validateSearchQuery(e.target.value);
                    if (validatedValue !== e.target.value) {
                      e.target.value = validatedValue;
                    }
                    setSearchQuery(validatedValue);
                  }}
                  maxLength={100}
                  spellCheck={false}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  inputMode="search"
                  aria-label="Search for songs"
                  role="searchbox"
                />
                <div className="absolute left-3 top-2.5">
                  <SearchIcon size={16} className="text-gray-400" />
                </div>
              </div>
              {searchError && (
                <p className="text-xs text-red-400 mt-1">{searchError}</p>
              )}
            </div>
            
            {/* Song list */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {loadingSearchResults && (
                  <div className="flex flex-col items-center justify-center h-40 p-4">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-[#1DB954] rounded-full animate-spin mb-2"></div>
                    <p className="text-sm text-gray-400">Searching…</p>
                  </div>
                )}
                {loadingSongs ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-[#1DB954] rounded-full animate-spin mb-2"></div>
                    <p className="text-sm text-gray-400">Loading songs...</p>
                  </div>
                ) : filteredSongs.length > 0 ? (
                  <div className="space-y-1">
                    {filteredSongs.map((song, index) => (
                      <div 
                        key={`${song.track}-${index}`}
                        className={`flex items-center p-2 rounded-md ${
                          playingSong === `${song.track}-${index}`
                            ? 'bg-[#1DB954]/10 border border-[#1DB954]/30' 
                            : 'hover:bg-gray-900/80'
                        } group`}
                      >
                        {/* Song artwork or play button */}
                        <div className="w-9 h-9 rounded mr-3 overflow-hidden bg-gray-800 flex-shrink-0">
                          {song.artworkUrl && hasValidImage(song.artworkUrl) ? (
                            <img 
                              src={song.artworkUrl} 
                              alt={song.track}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <AlbumIcon size={20} className="text-gray-600" />
                            </div>
                          )}
                        </div>
                        
                        {/* Song info */}
                        <div className="flex-1 min-w-0 mr-2">
                          <h4 className="text-sm font-medium text-white truncate">
                            {song.track}
                          </h4>
                          <p className="text-xs text-gray-400 truncate">
                            {song.artist}
                          </p>
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Play button */}
                          <button 
                            onClick={() => togglePlay(`${song.track}-${index}`)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              playingSong === `${song.track}-${index}`
                                ? 'bg-[#1DB954]' 
                                : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                          >
                            {playingSong === `${song.track}-${index}` ? (
                              <PauseIcon size={12} className="text-black" />
                            ) : (
                              <PlayIcon size={12} className="text-white" />
                            )}
                          </button>
                          
                          {/* Add to queue button */}
                          <button 
                            onClick={() => addToPersonalQueue(song)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1DB954]/20 text-[#1DB954]"
                            title="Add to queue"
                          >
                            <PlusIcon size={14} className="text-[#1DB954]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                    <SearchIcon size={24} className="text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">No songs found</p>
                    <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
                  </div>
                ) : filteredSongs.length === 0 && !searchQuery.trim() ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                    <MusicNoteIcon size={24} className="text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">No popular songs found</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Try searching for specific song titles
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                    <MusicNoteIcon size={24} className="text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">Loading artist songs...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Artist Selection Grid - Only show artists from pool with valid images
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-gray-800 bg-gray-900/30">
              <h3 className="text-sm uppercase font-semibold tracking-wider text-[#1DB954]">
                Selected Artists ({validSelectedArtists.length})
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              {validSelectedArtists.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {validSelectedArtists.map(artist => (
                    <div key={artist.id} className="relative group">
                      <button
                        onClick={() => handleSelectArtist(artist.id)}
                        className="w-full flex flex-col items-center p-3 rounded-lg bg-gray-900/40 border border-gray-800/40 hover:bg-gray-900 hover:border-gray-700 transition-all"
                      >
                        {/* Artist avatar with real image */}
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center mb-2 shadow-lg">
                          {hasValidImage(artist.image) ? (
                            <img 
                              src={artist.image} 
                              alt={artist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <MusicNoteIcon size={28} className="text-gray-600" />
                          )}
                        </div>
                        
                        {/* Artist name */}
                        <span className="text-sm text-white text-center truncate w-full">
                          {artist.name}
                        </span>
                        
                     
                      </button>
                      
                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveArtist(artist.id);
                        }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove artist"
                      >
                        <XIcon size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <MusicNoteIcon size={32} className="text-gray-700 mb-3" />
                  <p className="text-gray-400 text-sm">No artists selected</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Select artists from the Pool tab to see their songs here
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* RIGHT PANEL - Personal Queue */}
      <div className={`${selectedArtist ? 'w-2/5' : 'w-1/2'} bg-gradient-to-br from-gray-900 to-black transition-all duration-300 flex flex-col`}>
        <div className="p-3 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center">
          <h3 className="text-sm uppercase font-semibold tracking-wider text-[#1DB954]">
            Your Queue
          </h3>
          <span className="text-xs text-gray-400 px-2 py-0.5 bg-black/30 rounded-full">
            {personalQueue.length} {personalQueue.length === 1 ? 'song' : 'songs'}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {personalQueue.length > 0 ? (
            <div className="space-y-2">
              {personalQueue.map((song, index) => (
                <div 
                  key={song.queueId} 
                  className={`relative group ${
                    song.isPaused
                      ? 'bg-gray-900/80 border border-gray-800'
                      : 'bg-[#1DB954]/10 border border-[#1DB954]/30'
                  } rounded-lg p-2`}
                >
                  {/* Reorder controls on hover */}
                  <div className="absolute -left-1 top-0 bottom-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => moveItem(song.queueId, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded-full bg-black/70 hover:bg-black/90 disabled:opacity-30 mb-1"
                    >
                      <ChevronUpIcon size={12} className="text-white" />
                    </button>
                    <button 
                      onClick={() => moveItem(song.queueId, 'down')}
                      disabled={index === personalQueue.length - 1}
                      className="p-1 rounded-full bg-black/70 hover:bg-black/90 disabled:opacity-30"
                    >
                      <ChevronDownIcon size={12} className="text-white" />
                    </button>
                  </div>
                  
                  <div className="flex items-center mb-1">
                    <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center mr-2 overflow-hidden">
                      {song.artworkUrl && hasValidImage(song.artworkUrl) ? (
                        <img 
                          src={song.artworkUrl} 
                          alt={song.track}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <AlbumIcon size={16} className="text-gray-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{song.track}</h4>
                      <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center justify-between pl-10 pr-1 mt-1 pt-1 border-t border-gray-800/50">
                    {/* Countdown timer */}
                    <div className={`flex items-center rounded px-1.5 py-0.5 ${
                      song.isPaused 
                        ? 'bg-gray-800/80 text-gray-400' 
                        : 'bg-[#1DB954]/20 text-[#1DB954]'
                    }`}>
                      <ClockIcon size={10} className={song.isPaused ? 'text-gray-400' : 'text-[#1DB954]'} />
                      <span className="text-xs ml-1">{song.countdown}s</span>
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex space-x-1">
                      {/* Pause/Resume button */}
                      <button 
                        onClick={() => togglePauseTimer(song.queueId)}
                        className={`p-1 rounded-full ${
                          song.isPaused
                            ? 'hover:bg-[#1DB954]/20 text-[#1DB954]'
                            : 'hover:bg-gray-800 text-gray-400'
                        }`}
                      >
                        {song.isPaused ? (
                          <PlayIcon size={14} className="text-[#1DB954]" />
                        ) : (
                          <PauseIcon size={14} className="text-gray-400" />
                        )}
                      </button>
                      
                      {/* Remove button */}
                      <button 
                        onClick={() => removeSong(song.queueId)}
                        className="p-1 rounded-full hover:bg-gray-800 text-gray-400"
                      >
                        <XIcon size={14} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <AlbumIcon size={32} className="text-gray-700 mb-3" />
              <p className="text-gray-400 text-sm">Your personal queue is empty</p>
              <p className="text-gray-500 text-xs mt-1">
                {selectedArtist 
                  ? "Add songs from the artist's top tracks"
                  : "Select an artist to view and add songs"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Widget;