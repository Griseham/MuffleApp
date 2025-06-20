import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlayIcon, PauseIcon, MusicNoteIcon, AlbumIcon } from './Icons/Icons';
import axios from "axios";

// Front-end → Back-end base URL
const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';

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

/* ------------------------------------------------------------------ *
 * SHARED HELPERS                                                     *
 * ------------------------------------------------------------------ */

// 1) Normalise anything we get back from Apple Music or our mocks into
//    the internal shape the UI expects.
const normaliseSong = raw => ({
  id:             raw.id               ?? `tmp-${Date.now()}-${Math.random()}`,
  track:          raw.track            ?? raw.trackName   ?? raw.name        ?? 'Unknown',
  artist:         raw.artist           ?? raw.artistName  ?? 'Unknown',
  album:          raw.album            ?? raw.albumName   ?? '',
  artworkUrl:     raw.artworkUrl       ?? (raw.attributes?.artwork?.url
                       ? raw.attributes.artwork.url.replace('{w}x{h}', '300x300')
                       : ''),
  previewUrl:     raw.previewUrl       ?? raw.previews?.[0]?.url ?? '',
});

// 2) Image-sanity checker (unchanged, just moved down a little)
// Helper function to validate if an image URL is real
const hasValidImage = (imageUrl) => {
  return imageUrl && 
         imageUrl !== 'fallback.jpg' && 
         imageUrl !== '/placeholder-200.png' &&
         !imageUrl.includes('placeholder') &&
         !imageUrl.includes('picsum') &&
         !imageUrl.includes('scdn.co') && // ← ADD THIS LINE
         imageUrl.startsWith('http');
};

const Widget = ({ selectedArtists = [], queuedSongs = [], setWidgetSelectedArtist, onRemoveArtist, onSongFromWidget }) => {
  // States
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [playingSong, setPlayingSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [personalQueue, setPersonalQueue] = useState([]);
  const [artistSongs, setArtistSongs] = useState({});
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Global search states
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [loadingSearchResults, setLoadingSearchResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const audioRef = useRef(null);

  // Filter selected artists to only show those with valid images and from artist pool
// Memoised list so the reference is stable between renders
const validSelectedArtists = useMemo(
  () =>
    selectedArtists.filter(
      artist => hasValidImage(artist.image) && artist.name && artist.id
    ),
  [selectedArtists]
);

  // UPDATED: Generate mock popular songs based on artist name (no API calls)
  const generateMockPopularSongs = (artistName) => {
    // Create deterministic "popular" songs based on artist name
    const songTemplates = [
      { suffix: "- Greatest Hit", albumSuffix: "Best Of" },
      { suffix: "- Popular Track", albumSuffix: "Greatest Hits" },
      { suffix: "- Fan Favorite", albumSuffix: "Collection" },
      { suffix: "- Top Single", albumSuffix: "Singles" },
      { suffix: "- Chart Topper", albumSuffix: "Hits Collection" }
    ];

    return songTemplates.map((template, index) => ({
      track: `${artistName} ${template.suffix}`,
      artist: artistName,
      album: `${artistName} ${template.albumSuffix}`,
      artworkUrl: '', // No artwork - will show SVG fallback
      previewUrl: '' // No audio
    }));
  };

/* ------------------------------------------------------------------ *
 * FETCH helpers                                                      *
 * ------------------------------------------------------------------ */

const MAX_SONGS = 5;                       // show ≤ 5 songs for clarity

// a) Popular songs for the artist panel (real Apple Music data first,
//    fallback to deterministic mock)
const fetchArtistSongs = async (artistName) => {
  setLoadingSongs(true);
  try {
    // hit the generic search so we can grab a handful at once
    const { data } = await axios.post(
      `/apple-music/search`,
      { query: artistName }
    );

    const songs = (data.results || [])
      .filter(s => s.previewUrl)      // must be playable
      .slice(0, MAX_SONGS)            // keep it tidy
      .map(normaliseSong);

    // if nothing playable came back, fall through to mock
    if (songs.length) {
      setArtistSongs(prev => ({ ...prev, [artistName]: songs }));
      return;
    }
  } catch (err) {
  } finally {
    setLoadingSongs(false);
  }

  // deterministic mock so the UI never shows "empty"
  setArtistSongs(prev => ({
    ...prev,
    [artistName]: generateMockPopularSongs(artistName),
  }));
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
  const validateSearchQuery = useCallback((query) => {
    const sanitized = sanitizeSearchInput(query);
    
    // Only allow safe characters for music search
    const allowedPattern = /^[a-zA-Z0-9\s\-'.,&()!?]+$/;
    if (sanitized && !allowedPattern.test(sanitized)) {
      return sanitized.replace(/[^a-zA-Z0-9\s\-'.,&()!?]/g, '');
    }
    
    return sanitized;
  }, []);

const fetchGlobalSongs = useCallback(async (query) => {
  const validated = validateSearchQuery(query);
  if (!validated || validated.length < 2) return setGlobalSearchResults([]);

  setLoadingSearchResults(true); setSearchError('');
  try {
    const { data } = await axios.post(
      `${API_BASE}/apple-music/search`,
      { query: validated }
    );
    setGlobalSearchResults(
      (data.results || []).slice(0, MAX_SONGS).map(normaliseSong)
    );
  } catch { setSearchError('Search failed – try again'); }
  finally   { setLoadingSearchResults(false); }
}, [validateSearchQuery]);

const fetchArtistSearch = useCallback(async (query, artistName) => {
  const validated = validateSearchQuery(query);
  if (!validated || validated.length < 2) return setGlobalSearchResults([]);

  setLoadingSearchResults(true); setSearchError('');
  try {
    const { data } = await axios.post(
      `${API_BASE}/apple-music/search`,
      { query: `${artistName} ${validated}` }
    );
    setGlobalSearchResults(
      (data.results || []).slice(0, MAX_SONGS).map(normaliseSong)
    );
  } catch { setSearchError('Search failed – try again'); }
  finally   { setLoadingSearchResults(false); }
}, [validateSearchQuery]);


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

  // Toggle play state for a song (visual only - no audio)
  const togglePlay = (songKey, previewUrl) => {
    // pause the current track if it's already playing
    if (playingSong === songKey) {
      audioRef.current?.pause();
      setPlayingSong(null);
      return;
    }
  
    // stop any previous audio
    if (audioRef.current) audioRef.current.pause();
  
    // start the new preview
    if (previewUrl) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.play().catch(() => {});
      setPlayingSong(songKey);
    }
  };
  
  // clean-up on unmount
  useEffect(() => () => audioRef.current?.pause(), []);
  // Add song to personal queue with validation and timer
  const addToPersonalQueue = (song) => {
    // Validate song object
    if (!song || typeof song !== 'object' || !song.track || !song.artist) {
      return;
    }
    
    // Sanitize song data
    const sanitizedSong = {
      track: sanitizeSearchInput(song.track),
      artist: sanitizeSearchInput(song.artist),
      album: song.album ? sanitizeSearchInput(song.album) : '',
      artworkUrl: song.artworkUrl && song.artworkUrl.startsWith('http') ? song.artworkUrl : '',
      previewUrl: song.previewUrl || ''
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
    onSongFromWidget({
    
   id: song.id,
   track: song.track,
   artist: song.artist,
  album: song.album,
      artworkUrl: song.artworkUrl,
      previewUrl: song.previewUrl,
      isFromWidget: true
    });
    
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
// Update countdowns every second and move finished songs to main queue
useEffect(() => {
  const interval = setInterval(() => {
    let songsFinished = [];
    setPersonalQueue(prev => {
      const updated = prev.map(item => {
        if (item.isPaused) return item;
        
        const newCountdown = item.countdown - 1;
        
        if (newCountdown <= 0) {
          songsFinished.push(item);
          return null;
        }
        
        return { ...item, countdown: newCountdown };
      }).filter(Boolean);
      
      return updated;
    });

    /* fire AFTER React has finished updating Widget */
    if (songsFinished.length && onSongFromWidget) {
      Promise.resolve().then(() =>
        songsFinished.forEach(onSongFromWidget)
      );
    }
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
      if (globalSearchResults.length) {          // only clear if not already empty
        setGlobalSearchResults([]);
      }
      return;
    }
    
    
    // Debounce search to prevent excessive API calls
    const timeout = setTimeout(() => {
      if (artist) {
        // Search within this artist's catalog (mock)
        fetchArtistSearch(validatedQuery, artist.name);
      } else {
        // Global search using Spotify API
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
  }, [searchQuery, selectedArtist, validSelectedArtists.length,
    fetchArtistSearch, fetchGlobalSongs, validateSearchQuery]);

  // Get current artist's songs
  const getCurrentArtistSongs = () => {
    // Global search overrides everything
    if (searchQuery.trim()) {
      return globalSearchResults;
    }

    // Otherwise show cached popular songs for the chosen artist
    if (!selectedArtist) return [];
    const artist = validSelectedArtists.find(a => a.id === selectedArtist);
    return artist ? (artistSongs[artist.name] || []) : [];
  };

  // Get filtered songs based on search query
  const filteredSongs = getCurrentArtistSongs();

  return (
<div className="flex flex-col sm:flex-row h-full rounded-lg overflow-hidden bg-gray-950 border border-gray-800">      {/* LEFT PANEL */}
<div className={`widget-left ${selectedArtist ? 'sm:w-3/5' : 'sm:w-1/2'}  w-full h-[60%] h-1/2 sm:h-full bg-black transition-all duration-300 flex flex-col`}>
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
              
              {/* Artist Profile Image from Spotify */}
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
                        {/* Song artwork or icon */}
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
                        <div className="flex-1 min-w-0 mr-2 leading-tight">
                          <h4 className="text-sm font-medium text-white truncate">
                            {song.track}
                          </h4>
                          <p className="text-xs text-gray-400 truncate">
                            {song.artist}
                            {song.album && <> • {song.album}</>}
                          </p>
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Visual-only play button */}
                          <button
  onClick={() => togglePlay(`${song.track}-${index}`, song.previewUrl)}
  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800"
>
  {playingSong === `${song.track}-${index}` ? (
    <PauseIcon size={12} className="text-black" />
  ) : (
    <PlayIcon  size={12} className="text-white" />
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
                    <p className="text-sm text-gray-400">No popular songs available</p>
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
          // Artist Selection Grid - Only show artists from pool with valid Spotify images
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-gray-800 bg-gray-900/30">
              <h3 className="text-sm uppercase font-semibold tracking-wider text-[#1DB954]">
                Selected Artists ({validSelectedArtists.length})
              </h3>
              <p className="text-xs text-gray-400 mt-1">From Spotify artist pool</p>
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
                        {/* Artist avatar with Spotify image */}
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
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center
                           opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"                        title="Remove artist"
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
      <div className="widget-right flex-1 bg-gradient-to-br from-gray-900 to-black transition-all duration-300 flex flex-col sm:w-2/5 h-[40%] w-full h-1/2 sm:h-full">        <div className="p-3 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center">
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
                  ? "Add songs from the artist's catalog"
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