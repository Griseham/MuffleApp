import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlayIcon, PauseIcon, MusicNoteIcon, AlbumIcon } from './Icons/Icons';
import { buildApiUrl } from '../utils/api';
import {
  MAX_SEARCH_QUERY_LENGTH,
  MIN_SEARCH_QUERY_LENGTH,
  sanitizeSearchInput as sanitizeUserInput,
  isSafeHttpUrl,
} from '../utils/searchSecurity';

const PLACEHOLDER_SONG_COUNT = 3;
const PLACEHOLDER_TRACK_NAME = 'Song name';
const PLACEHOLDER_ARTIST_NAME = 'Artist name';
const PLACEHOLDER_ARTWORK_URL = 'https://placehold.co/320x320/111827/9ca3af.png?text=No+Preview';

const createPlaceholderSongsForArtist = (artistName = '') => {
  const normalizedArtistSeed = sanitizeUserInput(artistName, { maxLength: 120 }) || 'artist';
  const slug = normalizedArtistSeed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'artist';

  return Array.from({ length: PLACEHOLDER_SONG_COUNT }, (_, index) => ({
    id: `placeholder-${slug}-${index + 1}`,
    track: PLACEHOLDER_TRACK_NAME,
    artist: PLACEHOLDER_ARTIST_NAME,
    album: '',
    artworkUrl: PLACEHOLDER_ARTWORK_URL,
    previewUrl: '',
    isPlaceholder: true,
    allowQueueWithoutPreview: true,
    placeholderForArtist: normalizedArtistSeed,
  }));
};

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

const Widget = ({
  apiBaseUrl = "",
  selectedArtists = [],
  setWidgetSelectedArtist,
  onRemoveArtist,
  onSongFromWidget
}) => {
  const apiUrl = useCallback((path) => buildApiUrl(path, apiBaseUrl), [apiBaseUrl]);
  // States
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [playingSong, setPlayingSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [personalQueue, setPersonalQueue] = useState([]);
  const [artistSongs, setArtistSongs] = useState({});
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mobileAddStatusBySong, setMobileAddStatusBySong] = useState({});

  // --- AUDIO (single shared player for the widget) ---
  const audioRef = React.useRef(null);
  const [, setAudioError] = useState(false);
  const searchDebounceRef = React.useRef(null);
  const searchAbortRef = React.useRef(null);
  const searchRequestIdRef = React.useRef(0);
  const latestSearchQueryRef = React.useRef('');
  const personalQueueRef = React.useRef([]);
  const addStatusTimersRef = React.useRef({});

  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  const getSongStatusKey = useCallback(
    (song) => String(song?.id || `${song?.track || 'track'}|${song?.artist || 'artist'}`),
    []
  );

  const clearAddStatusTimers = useCallback((songKey) => {
    const timers = addStatusTimersRef.current[songKey] || [];
    timers.forEach((timerId) => window.clearTimeout(timerId));
    delete addStatusTimersRef.current[songKey];
  }, []);

  const startMobileAddStatusSequence = useCallback((song) => {
    const songKey = getSongStatusKey(song);
    clearAddStatusTimers(songKey);

    const setStatus = (label, phase) => {
      setMobileAddStatusBySong((prev) => ({
        ...prev,
        [songKey]: { label, phase },
      }));
    };

    setStatus('Adding song in 3', 'countdown');

    const timers = [
      window.setTimeout(() => setStatus('Adding song in 2', 'countdown'), 1000),
      window.setTimeout(() => setStatus('Adding song in 1', 'countdown'), 2000),
      window.setTimeout(() => setStatus('Song Added!', 'added'), 3000),
      window.setTimeout(() => {
        setMobileAddStatusBySong((prev) =>
          prev[songKey]
            ? { ...prev, [songKey]: { ...prev[songKey], phase: 'fade' } }
            : prev
        );
      }, 3900),
      window.setTimeout(() => {
        setMobileAddStatusBySong((prev) => {
          if (!prev[songKey]) return prev;
          const next = { ...prev };
          delete next[songKey];
          return next;
        });
        clearAddStatusTimers(songKey);
      }, 4400),
    ];

    addStatusTimersRef.current[songKey] = timers;
  }, [clearAddStatusTimers, getSongStatusKey]);

  // 🔍 global search
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [loadingSearchResults, setLoadingSearchResults] = useState(false);

  useEffect(() => {
    personalQueueRef.current = personalQueue;
  }, [personalQueue]);

  // Helper function to validate if an image URL is real
  const hasValidImage = (imageUrl) => {
    return imageUrl && 
           imageUrl !== 'fallback.jpg' && 
           imageUrl !== '/placeholder-200.png' &&
           !imageUrl.includes('placeholder') &&
           !imageUrl.includes('picsum') &&
           isSafeHttpUrl(imageUrl);
  };

  // Filter selected artists to only show those with valid images and from artist pool
  const validSelectedArtists = useMemo(
    () =>
      selectedArtists.filter(
        (artist) => hasValidImage(artist.image) && artist.name && artist.id
      ),
    [selectedArtists]
  );

  const selectedArtistRecord = useMemo(
    () => validSelectedArtists.find((artist) => artist.id === selectedArtist) || null,
    [selectedArtist, validSelectedArtists]
  );

  const normalizeSearchQuery = useCallback(
    (query) => sanitizeUserInput(query, { maxLength: MAX_SEARCH_QUERY_LENGTH }),
    []
  );

  const cancelPendingSearch = useCallback(() => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }
  }, []);

  const clearSearchResults = useCallback(() => {
    cancelPendingSearch();
    setLoadingSearchResults(false);
    setGlobalSearchResults((prev) => (prev.length > 0 ? [] : prev));
  }, [cancelPendingSearch]);

  const startTimedSearchRequest = useCallback(() => {
    cancelPendingSearch();
    searchRequestIdRef.current += 1;
    const requestId = searchRequestIdRef.current;
    const controller = new AbortController();
    let timedOut = false;

    searchAbortRef.current = controller;

    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    return {
      requestId,
      signal: controller.signal,
      didTimeout: () => timedOut,
      cleanup: () => {
        window.clearTimeout(timeoutId);
        if (searchAbortRef.current === controller) {
          searchAbortRef.current = null;
        }
      }
    };
  }, [cancelPendingSearch]);

  // Fetch songs for an artist from the dedicated Apple Music artist songs endpoint
  const fetchArtistSongs = useCallback(async (artistName) => {
    const safeArtistName = sanitizeUserInput(artistName, { maxLength: 120 });

    if (!safeArtistName) {
      setSearchError('Invalid artist name');
      return [];
    }

    if (artistSongs[safeArtistName]) {
      return artistSongs[safeArtistName]; // Return cached songs
    }

    setLoadingSongs(true);
    setSearchError('');

    try {
      // Call the dedicated artist songs endpoint
      const response = await fetch(apiUrl('/apple-music/artist-songs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          artist: safeArtistName,
          artistName: safeArtistName
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const normalizedSongs = Array.isArray(data?.songs)
        ? data.songs
        : data?.data
          ? [data.data]
          : [];
      const songs = normalizedSongs
        .map((song) => ({
          id: song.id || `${safeArtistName}-${song.trackName || song.track || 'song'}`,
          track: sanitizeUserInput(song.track || song.trackName || '', { maxLength: 120 }),
          artist: sanitizeUserInput(song.artist || song.artistName || safeArtistName, { maxLength: 120 }),
          album: sanitizeUserInput(song.album || song.albumName || '', { maxLength: 120 }),
          artworkUrl: isSafeHttpUrl(song.artworkUrl) ? song.artworkUrl : '',
          previewUrl: isSafeHttpUrl(song.previewUrl) ? song.previewUrl : ''
        }))
        .filter((song) => song.track)
        .slice(0, 3);

      const finalSongs = songs.length > 0 ? songs : createPlaceholderSongsForArtist(safeArtistName);

      // Cache the songs
      setArtistSongs(prev => ({
        ...prev,
        [safeArtistName]: finalSongs
      }));

      return finalSongs;

    } catch {
      setSearchError(`Failed to load songs for ${artistName}`);
      return [];
    } finally {
      setLoadingSongs(false);
    }
  }, [apiUrl, artistSongs]);

  // Search ANY song on Apple Music with enhanced security
  const fetchGlobalSongs = useCallback(async (query) => {
    const validatedQuery = normalizeSearchQuery(query);

    if (!validatedQuery || validatedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      latestSearchQueryRef.current = validatedQuery;
      clearSearchResults();
      return;
    }
    
    setLoadingSearchResults(true);
    setSearchError('');
    latestSearchQueryRef.current = validatedQuery;

    const request = startTimedSearchRequest();
    
    try {
      const res = await fetch(
        apiUrl('/apple-music/search'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: validatedQuery,
            searchQuery: validatedQuery,
            timestamp: Date.now(),
            source: 'widget_global_search'
          }),
          signal: request.signal
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const rawResults = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      const validatedResults = rawResults
        .map((song) => ({
          id: song.id || `${song.track || song.trackName || song.name}-${song.artist || song.artistName || 'artist'}`,
          track: sanitizeUserInput(song.track || song.trackName || song.name || '', { maxLength: 120 }),
          artist: sanitizeUserInput(song.artist || song.artistName || '', { maxLength: 120 }),
          album: sanitizeUserInput(song.album || song.albumName || '', { maxLength: 120 }),
          artworkUrl: isSafeHttpUrl(song.artworkUrl) ? song.artworkUrl : '',
          previewUrl: isSafeHttpUrl(song.previewUrl) ? song.previewUrl : ''
        }))
        .filter(song => 
          song &&
          typeof song === 'object' &&
          song.track &&
          typeof song.track === 'string' &&
          song.artist &&
          typeof song.artist === 'string'
        )
        .slice(0, 20); // Limit results

      if (request.requestId === searchRequestIdRef.current &&
          latestSearchQueryRef.current === validatedQuery) {
        setGlobalSearchResults(validatedResults);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (request.didTimeout() && request.requestId === searchRequestIdRef.current) {
          setSearchError('Search timed out - try again');
          setLoadingSearchResults(false);
        }
        return;
      }
      if (request.requestId === searchRequestIdRef.current) {
        setSearchError('Search failed – try again');
      }
    } finally {
      request.cleanup();
      if (request.requestId === searchRequestIdRef.current) {
        setLoadingSearchResults(false);
      }
    }
  }, [apiUrl, clearSearchResults, normalizeSearchQuery, startTimedSearchRequest]);

  // Search within a specific artist's catalog with security
  const fetchArtistSearch = useCallback(async (query, artistName) => {
    const validatedQuery = normalizeSearchQuery(query);
    const validatedArtistName = sanitizeUserInput(artistName, { maxLength: 120 });
    
    if (!validatedQuery || validatedQuery.length < MIN_SEARCH_QUERY_LENGTH || !validatedArtistName) {
      latestSearchQueryRef.current = validatedQuery;
      clearSearchResults();
      return;
    }
    
    setLoadingSearchResults(true);
    setSearchError('');
    latestSearchQueryRef.current = validatedQuery;

    const request = startTimedSearchRequest();
    
    try {
      const res = await fetch(
        apiUrl('/apple-music/artist-search'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: validatedQuery,
            searchQuery: validatedQuery, 
            artistName: validatedArtistName,
            timestamp: Date.now(),
            source: 'widget_artist_search'
          }),
          signal: request.signal
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const rawResults = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      const validatedResults = rawResults
        .map((song) => ({
          id: song.id || `${song.track || song.trackName || song.name}-${validatedArtistName}`,
          track: sanitizeUserInput(song.track || song.trackName || song.name || '', { maxLength: 120 }),
          artist: sanitizeUserInput(song.artist || song.artistName || validatedArtistName, { maxLength: 120 }),
          album: sanitizeUserInput(song.album || song.albumName || '', { maxLength: 120 }),
          artworkUrl: isSafeHttpUrl(song.artworkUrl) ? song.artworkUrl : '',
          previewUrl: isSafeHttpUrl(song.previewUrl) ? song.previewUrl : ''
        }))
        .filter(song => 
          song &&
          typeof song === 'object' &&
          song.track &&
          typeof song.track === 'string' &&
          song.artist &&
          typeof song.artist === 'string'
        )
        .slice(0, 15); // Limit artist-specific results
      
      if (request.requestId === searchRequestIdRef.current &&
          latestSearchQueryRef.current === validatedQuery) {
        setGlobalSearchResults(validatedResults);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (request.didTimeout() && request.requestId === searchRequestIdRef.current) {
          setSearchError('Search timed out - try again');
          setLoadingSearchResults(false);
        }
        return;
      }
      if (request.requestId === searchRequestIdRef.current) {
        setSearchError('Search failed – try again');
      }
    } finally {
      request.cleanup();
      if (request.requestId === searchRequestIdRef.current) {
        setLoadingSearchResults(false);
      }
    }
  }, [apiUrl, clearSearchResults, normalizeSearchQuery, startTimedSearchRequest]);

  // Handle artist selection
  const handleSelectArtist = async (artistId) => {
    const artist = validSelectedArtists.find(a => a.id === artistId);
    if (artist) {
      setSelectedArtist(artist.id);
      setSearchQuery('');
      setSearchError('');
      latestSearchQueryRef.current = '';
      clearSearchResults();
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
    latestSearchQueryRef.current = '';
    clearSearchResults();
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

  // Play/pause a specific song (uses previewUrl)
  const togglePlay = async (songKey, song) => {
    const url =
      song?.previewUrl &&
      typeof song.previewUrl === "string" &&
      isSafeHttpUrl(song.previewUrl)
        ? song.previewUrl
        : "";

    if (!url) {
      setSearchError("No preview available for this song");
      setTimeout(() => setSearchError(""), 2000);
      return;
    }

    if (!audioRef.current) return;

    if (playingSong === songKey) {
      if (audioRef.current.paused) {
        try {
          await audioRef.current.play();
          setAudioError(false);
        } catch {
          setAudioError(true);
        }
      } else {
        audioRef.current.pause();
      }
      setPlayingSong(audioRef.current.paused ? null : songKey);
      return;
    }

    try {
      setAudioError(false);
      stopAudio();
      audioRef.current.src = url;
      await audioRef.current.play();
      setPlayingSong(songKey);
    } catch {
      setAudioError(true);
      setPlayingSong(null);
      setSearchError("Audio blocked — click play again");
      setTimeout(() => setSearchError(""), 2000);
    }
  };

  const handleAudioEnded = () => setPlayingSong(null);

  const handleAudioError = () => {
    setAudioError(true);
    setPlayingSong(null);
  };

  // Add song to personal queue with validation and timer
  const addToPersonalQueue = (song) => {
    // Validate song object
    if (!song || typeof song !== 'object' || !song.track || !song.artist) {
      return false;
    }
    
    // Sanitize song data
    const allowQueueWithoutPreview = Boolean(song.isPlaceholder || song.allowQueueWithoutPreview);
    const safeSongId = sanitizeUserInput(String(song.id || ''), { maxLength: 180 });
    const sanitizedSong = {
      id: safeSongId || '',
      track: sanitizeUserInput(song.track, { maxLength: 120 }),
      artist: sanitizeUserInput(song.artist, { maxLength: 120 }),
      album: song.album ? sanitizeUserInput(song.album, { maxLength: 120 }) : '',
      artworkUrl: isSafeHttpUrl(song.artworkUrl) ? song.artworkUrl : '',
      previewUrl: isSafeHttpUrl(song.previewUrl) ? song.previewUrl : '',
      isPlaceholder: allowQueueWithoutPreview && !isSafeHttpUrl(song.previewUrl),
      allowQueueWithoutPreview
    };

    if (!sanitizedSong.previewUrl && !sanitizedSong.allowQueueWithoutPreview) {
      setSearchError('No snippet preview available for this song');
      setTimeout(() => setSearchError(''), 2000);
      return false;
    }
    
    const incomingSongKey = sanitizedSong.id
      ? `id:${sanitizedSong.id}`
      : `song:${sanitizedSong.track}|artist:${sanitizedSong.artist}`;

    // Check for duplicate songs in queue
    const isDuplicate = personalQueue.some((item) => {
      const existingSongKey = item.id
        ? `id:${item.id}`
        : `song:${item.track}|artist:${item.artist}`;
      return existingSongKey === incomingSongKey;
    });
    
    if (isDuplicate) {
      setSearchError('Song already in queue');
      setTimeout(() => setSearchError(''), 2000);
      return false;
    }
    
    // Limit queue size
    if (personalQueue.length >= 10) {
      setSearchError('Queue is full (max 10 songs)');
      setTimeout(() => setSearchError(''), 2000);
      return false;
    }
    
    const newQueueItem = {
      ...sanitizedSong,
      queueId: `queue-${Date.now()}-${Math.random()}`,
      countdown: 3,
      isPaused: false
    };
    
    setPersonalQueue(prev => [...prev, newQueueItem]);
    return true;
  };

  const handleAddToPersonalQueue = (song) => {
    const wasAdded = addToPersonalQueue(song);
    if (wasAdded) {
      startMobileAddStatusSequence(song);
    }
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
      const currentQueue = personalQueueRef.current;
      if (!currentQueue.length) return;

      const songsToMoveToMain = [];
      const updatedQueue = currentQueue
        .map((item) => {
          if (item.isPaused) return item;

          const newCountdown = item.countdown - 1;
          if (newCountdown <= 0) {
            songsToMoveToMain.push(item);
            return null;
          }

          return { ...item, countdown: newCountdown };
        })
        .filter(Boolean);

      personalQueueRef.current = updatedQueue;
      setPersonalQueue(updatedQueue);

      if (songsToMoveToMain.length > 0 && onSongFromWidget) {
        songsToMoveToMain.forEach((song) => {
          onSongFromWidget(song);
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [onSongFromWidget]);

  // Cleanup search resources on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      cancelPendingSearch();
    };
  }, [cancelPendingSearch]);

  useEffect(() => {
    return () => {
      Object.values(addStatusTimersRef.current).forEach((timers) => {
        timers.forEach((timerId) => window.clearTimeout(timerId));
      });
      addStatusTimersRef.current = {};
    };
  }, []);

  // Debounced search with security measures
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    const validatedQuery = normalizeSearchQuery(searchQuery);
    
    if (!validatedQuery || validatedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      latestSearchQueryRef.current = validatedQuery;
      clearSearchResults();
      return;
    }
    
    // Debounce search to prevent excessive API calls
    searchDebounceRef.current = setTimeout(() => {
      if (selectedArtistRecord) {
        // limit search to this artist's catalogue
        fetchArtistSearch(validatedQuery, selectedArtistRecord.name);
      } else {
        // no artist selected → fall back to global search
        fetchGlobalSongs(validatedQuery);
      }
    }, 600); // 600ms debounce

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [clearSearchResults, fetchArtistSearch, fetchGlobalSongs, normalizeSearchQuery, searchQuery, selectedArtistRecord]);

  // Get current artist's songs
  const getCurrentArtistSongs = () => {
    // 1️⃣ global search overrides everything
    if (searchQuery.trim()) {
      return globalSearchResults;
    }

    // 2️⃣ otherwise show cached top-5 for the chosen artist
    if (!selectedArtist) return [];
    return selectedArtistRecord ? (artistSongs[selectedArtistRecord.name] || []) : [];
  };

  // Get filtered songs based on search query
  const filteredSongs = getCurrentArtistSongs();

  return (
    <div className="flex h-full rounded-lg overflow-hidden bg-gray-950 border border-gray-800">
      {/* Single shared audio element for widget previews */}
      <audio ref={audioRef} preload="metadata" onEnded={handleAudioEnded} onError={handleAudioError} />
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
                {hasValidImage(selectedArtistRecord?.image) ? (
                  <img 
                    src={selectedArtistRecord?.image} 
                    alt={selectedArtistRecord?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MusicNoteIcon size={24} className="text-gray-600" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">
                  {selectedArtistRecord?.name}
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
                  onChange={(e) => setSearchQuery(normalizeSearchQuery(e.target.value))}
                  maxLength={MAX_SEARCH_QUERY_LENGTH}
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
                    {filteredSongs.map((song, index) => {
                        const songPlayKey = `${song.track}-${index}`;
                        const songStatus = mobileAddStatusBySong[getSongStatusKey(song)];
                        const canPlayPreview = Boolean(song.previewUrl && isSafeHttpUrl(song.previewUrl));

                        return (
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
                              <div className="widget-song-artist-row">
                                <p className="text-xs text-gray-400 truncate widget-song-artist-text">
                                  {song.artist}
                                </p>
                                {songStatus ? (
                                  <span
                                    className={`widget-song-add-status ${
                                      songStatus.phase === 'added' ? 'is-added' : ''
                                    } ${songStatus.phase === 'fade' ? 'is-fade' : ''}`}
                                    aria-live="polite"
                                  >
                                    {songStatus.label}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            
                            {/* Controls */}
                            <div className="widget-song-controls flex items-center gap-1">
                              {/* Play button */}
                              <button 
                                onClick={() => togglePlay(songPlayKey, song)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  playingSong === `${song.track}-${index}`
                                    ? 'bg-[#1DB954]' 
                                    : 'bg-gray-800 hover:bg-gray-700'
                                } ${canPlayPreview ? '' : 'opacity-40 cursor-not-allowed hover:bg-gray-800'}`}
                                disabled={!canPlayPreview}
                                title={canPlayPreview ? 'Play preview' : 'No preview available'}
                              >
                                {playingSong === `${song.track}-${index}` ? (
                                  <PauseIcon size={12} className="text-black" />
                                ) : (
                                  <PlayIcon size={12} className="text-white" />
                                )}
                              </button>
                              
                              {/* Add to queue button */}
                              <button 
                                onClick={() => handleAddToPersonalQueue(song)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1DB954]/20 text-[#1DB954]"
                                title="Add to queue"
                              >
                                <PlusIcon size={14} className="text-[#1DB954]" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
