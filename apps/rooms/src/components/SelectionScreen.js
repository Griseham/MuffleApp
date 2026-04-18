import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './SelectionScreen.css';
import MuflThreadsSidebarLayout from './MuflThreadsSidebarLayout';
import { fetchSimilarArtists } from '../utils/fetchSimilar';
import { apiClient } from '../utils/api';
import { addArtistsToSessionPool } from '../utils/sessionArtistPool';
import {
  MIN_SEARCH_QUERY_LENGTH,
  sanitizeSearchInput,
  isSafeHttpUrl,
} from '../utils/searchSecurity';

const api = apiClient;
const EMPTY_STATE_DELAY_MS = 2000;
const SELECTION_MOBILE_MEDIA_QUERY = '(max-width: 600px)';
const SELECTION_TABLET_PORTRAIT_MEDIA_QUERY = '(min-width: 700px) and (max-width: 820px) and (orientation: portrait)';

const getInitialViewportMatch = (mediaQuery) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(mediaQuery).matches;
};

const isCanceledError = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError';
const hasValidImage = (artist) =>
  artist &&
  artist.image &&
  artist.image !== 'fallback.jpg' &&
  !artist.image.includes('/api/placeholder/');

// Simple user silhouette SVG as data URI for missing images
const USER_PLACEHOLDER_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4" fill="%23222"/><path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill="%23222"/></svg>';

// Utility functions
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const GENRE_QUERY_BY_LABEL = Object.freeze({
  All: 'all',
  Pop: 'pop',
  'Hip-Hop': 'hip-hop',
  Rock: 'rock',
  'R&B': 'r&b',
  Electronic: 'electronic',
  Country: 'country',
  Indie: 'indie',
  Latin: 'latin',
  Jazz: 'jazz',
  'K-Pop': 'k-pop',
  Alternative: 'alternative',
});

const getGenreQueryValue = (genre = 'All') =>
  GENRE_QUERY_BY_LABEL[genre] || String(genre || 'all').trim().toLowerCase();

const getArtistIdentityKey = (artist) => {
  if (!artist || typeof artist !== 'object') {
    return '';
  }

  if (artist.id) {
    return String(artist.id);
  }

  const normalizedName = String(artist.name || '').trim().toLowerCase();
  const normalizedImage = String(artist.image || '').trim();

  if (!normalizedName && !normalizedImage) {
    return '';
  }

  return `${normalizedName}|${normalizedImage}`;
};

// Reusable components
const ArtistImage = ({ name, src }) => {
  return (
    <img
      src={src || USER_PLACEHOLDER_SVG}
      alt={name}
      className="artist-circle-image"
      onError={(e) => { 
        e.currentTarget.src = USER_PLACEHOLDER_SVG;
      }}
    />
  );
};

const LoadingIndicator = ({ message = "Loading artists...", fullHeight = false }) => (
  <div className={`loading-container ${fullHeight ? 'loading-container-full' : ''}`}>
    <div className="loading-spinner"></div>
    {message ? <p>{message}</p> : null}
  </div>
);

// Main SelectionScreen component
const SelectionScreen = ({ onContinue }) => {
  const isMountedRef = useRef(true);
  const noticeTimeoutRef = useRef(null);
  const emptyStateDelayTimeoutRef = useRef(null);
  const artistListVersionRef = useRef(0);
  const requestControllers = useRef({
    main: null,
    genre: null,
    more: null,
    search: null
  });
  const searchDebounceRef = useRef(null);
  const latestSearchQueryRef = useRef('');
  const bottomAreaRef = useRef(null);

  // Cancel any in-flight request of a given type
  const cancelRequest = useCallback((key) => {
    const ctrl = requestControllers.current[key];
    if (ctrl) {
      ctrl.abort();
      requestControllers.current[key] = null;
    }
  }, []);

  const startRequest = useCallback((key) => {
    cancelRequest(key);
    const ctrl = new AbortController();
    requestControllers.current[key] = ctrl;
    return ctrl.signal;
  }, [cancelRequest]);

  // Ensure incoming artists get a unique id (avoids merges dropping items when API repeats data)
  const appendWithUniqueIds = useCallback((incoming, existing = []) => {
    // Use id when present, otherwise name+image combo to allow same name with different artwork
    const seenKeys = new Set(
      existing.map(a => {
        const keyId = a?.id;
        const keyName = a?.name ? a.name.toLowerCase() : '';
        const keyImg = a?.image || '';
        return keyId || `${keyName}|${keyImg}`;
      })
    );

    const result = [];

    incoming.forEach((artist, idx) => {
      const keyId = artist?.id;
      const keyName = artist?.name ? artist.name.toLowerCase() : '';
      const keyImg = artist?.image || '';
      const compositeKey = keyId || `${keyName}|${keyImg}`;

      if (seenKeys.has(compositeKey)) {
        return;
      }

      // Normalize image to always have something displayable
      const safeImage = hasValidImage(artist)
        ? artist.image
        : USER_PLACEHOLDER_SVG;

      const baseId = keyId || artist?.name || `artist-${Date.now()}-${idx}`;
      let uniqueId = baseId;
      let counter = 1;
      while (seenKeys.has(uniqueId)) {
        uniqueId = `${baseId}-dup-${counter++}`;
      }

      seenKeys.add(compositeKey);
      seenKeys.add(uniqueId);
      result.push({ ...artist, id: uniqueId, image: safeImage });
    });

    return result;
  }, []);

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
  const [notice, setNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [canShowBrowseEmptyState, setCanShowBrowseEmptyState] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() =>
    getInitialViewportMatch(SELECTION_MOBILE_MEDIA_QUERY)
  );
  const [isTabletPortraitView, setIsTabletPortraitView] = useState(() =>
    getInitialViewportMatch(SELECTION_TABLET_PORTRAIT_MEDIA_QUERY)
  );
  const [bottomAreaHeight, setBottomAreaHeight] = useState(0);
  
  // Refs
  const genreFiltersRef = useRef(null);
  const artistsAreaRef = useRef(null);


  
  // Constants
  const genreOptions = useMemo(() => 
    ['All', 'Pop', 'Hip-Hop', 'Rock', 'R&B', 'Electronic', 'Country', 'Indie', 'Latin', 'Jazz', 'K-Pop', 'Alternative'],
    []
  );
  
  // Helper for updating loading states
  const setLoading = useCallback((type, value) => {
    // Avoid state updates after unmount
    if (!isMountedRef.current) return;
    setLoadingState(prev => ({ ...prev, [type]: value }));
  }, []);

  const clearNotice = useCallback(() => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
      noticeTimeoutRef.current = null;
    }

    if (isMountedRef.current) {
      setNotice(null);
    }
  }, []);

  const showNotice = useCallback((message, durationMs = 5000) => {
    if (!message || !isMountedRef.current) {
      return;
    }

    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }

    setNotice(message);

    if (durationMs > 0) {
      noticeTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setNotice(null);
        }
        noticeTimeoutRef.current = null;
      }, durationMs);
    }
  }, []);

  const startBrowseEmptyStateDelay = useCallback(() => {
    if (emptyStateDelayTimeoutRef.current) {
      clearTimeout(emptyStateDelayTimeoutRef.current);
    }

    setCanShowBrowseEmptyState(false);
    emptyStateDelayTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setCanShowBrowseEmptyState(true);
      }
      emptyStateDelayTimeoutRef.current = null;
    }, EMPTY_STATE_DELAY_MS);
  }, []);

  const settleBrowseEmptyStateDelay = useCallback(() => {
    if (emptyStateDelayTimeoutRef.current) {
      clearTimeout(emptyStateDelayTimeoutRef.current);
      emptyStateDelayTimeoutRef.current = null;
    }

    if (isMountedRef.current) {
      setCanShowBrowseEmptyState(true);
    }
  }, []);
  
  // Mock artist data for demo/dev purposes
  const generateMockArtists = useCallback((baseNames, prefix = '') => {
    return baseNames.map((name, index) => ({
      name,
      image: USER_PLACEHOLDER_SVG,
      id: `${prefix}-${index + 1}`,
      isMain: true
    }));
  }, []);
  
  const searchArtists = useCallback(async (query) => {
    const finalQuery = sanitizeSearchInput(query);

    if (!finalQuery) {
      latestSearchQueryRef.current = '';
      cancelRequest('search');
      setSearchResults([]);
      setLoading('search', false);
      return;
    }

    if (finalQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      latestSearchQueryRef.current = finalQuery;
      cancelRequest('search');
      setSearchResults([]);
      setLoading('search', false);
      return;
    }

    setLoading('search', true);
    latestSearchQueryRef.current = finalQuery;

    try {
      const signal = startRequest('search');
      const res = await api.get('/spotify/search-artists', {
        params: { query: finalQuery },
        signal
      });

      if (!Array.isArray(res.data)) {
        throw new Error('Invalid response format');
      }

      const filteredResults = res.data
        .filter((artist) =>
          artist &&
          typeof artist === 'object' &&
          typeof artist.name === 'string' &&
          isSafeHttpUrl(artist.image) &&
          artist.image !== 'fallback.jpg' &&
          !artist.image.includes('/api/placeholder/')
        )
        .slice(0, 24);

      if (latestSearchQueryRef.current === finalQuery) {
        clearNotice();
        setSearchResults(filteredResults);
      }
    } catch (err) {
      if (isCanceledError(err)) {
        return;
      }

      const errorMessage = err.response?.status === 500
        ? 'Artist search is temporarily unavailable. Showing demo matches instead.'
        : err.code === 'ECONNABORTED'
          ? 'Artist search timed out. Showing demo matches instead.'
          : 'We could not complete the live artist search. Showing demo matches instead.';

      const queryLower = finalQuery.toLowerCase();
      const safeMockArtists = [
        'Taylor Swift', 'Drake', 'Billie Eilish', 'The Weeknd', 'Bad Bunny',
        'Dua Lipa', 'Post Malone', 'Ariana Grande', 'Travis Scott', 'BTS',
        'Lil Nas X', 'Olivia Rodrigo', 'Doja Cat', 'Harry Styles', 'Justin Bieber'
      ];

      const mockResults = safeMockArtists
        .filter((name) => name.toLowerCase().includes(queryLower))
        .slice(0, 10);

      const formattedResults = generateMockArtists(mockResults, 'search');

      if (latestSearchQueryRef.current === finalQuery) {
        showNotice(errorMessage);
        setSearchResults(formattedResults);
      }
    } finally {
      setLoading('search', false);
    }
  }, [cancelRequest, clearNotice, generateMockArtists, setLoading, showNotice, startRequest]);

// Also, let's apply the same filtering to the main artists fetch and genre fetch:
// For fetchMainArtists
  const fetchMainArtists = useCallback(async () => {
  const requestVersion = ++artistListVersionRef.current;
  startBrowseEmptyStateDelay();
  setLoading('main', true);
  try {
    const signal = startRequest('main');
    const res = await api.get('/spotify/artists', { params: { genre: 'pop' }, signal });
    
    // Filter out artists without images; if none, fall back to mock data
    const filteredArtists = (res.data || []).filter(hasValidImage);
    const finalArtists = filteredArtists.length > 0
      ? filteredArtists
      : generateMockArtists(['Artist A', 'Artist B', 'Artist C', 'Artist D'], 'fallback-main');
    
    const normalized = appendWithUniqueIds(shuffleArray(finalArtists));
    if (requestVersion !== artistListVersionRef.current) {
      return;
    }
    clearNotice();
    setDisplayedArtists(normalized);
    if (normalized.length > 0) {
      settleBrowseEmptyStateDelay();
    }
    setHasMore(normalized.length >= 8);
  } catch (err) {
    if (isCanceledError(err)) {
      setLoading('main', false);
      return;
    }
    showNotice('Live artist data is unavailable. Showing demo artists instead.');
    
    // Fallback to mock data if API fails
    const mockArtistNames = [
      'Taylor Swift', 'Drake', 'Billie Eilish', 'The Weeknd', 'Bad Bunny',
      'Dua Lipa', 'Post Malone', 'Ariana Grande', 'Travis Scott', 'BTS'
    ];
    const mockArtists = generateMockArtists(mockArtistNames, 'artist');
    const normalized = appendWithUniqueIds(shuffleArray(mockArtists));
    if (requestVersion !== artistListVersionRef.current) {
      return;
    }
    setDisplayedArtists(normalized);
    if (normalized.length > 0) {
      settleBrowseEmptyStateDelay();
    }
  }
  if (requestVersion !== artistListVersionRef.current) {
    return;
  }
  setLoading('main', false);
  setPage(1);
}, [appendWithUniqueIds, clearNotice, generateMockArtists, setLoading, settleBrowseEmptyStateDelay, showNotice, startBrowseEmptyStateDelay, startRequest]);

// For fetchArtistsByGenre
  const fetchArtistsByGenre = useCallback(async (genre) => {
  if (genre === 'All') {
    fetchMainArtists();
    return;
  }
  
  const requestVersion = ++artistListVersionRef.current;
  startBrowseEmptyStateDelay();
  setLoading('genre', true);
  try {
    const signal = startRequest('genre');
    const res = await api.get('/spotify/artists', {
      params: { genre: getGenreQueryValue(genre) },
      signal
    });
    
    // Filter out artists without images; if none, fall back to mock data
    const filteredArtists = (res.data || []).filter(hasValidImage);
    const finalArtists = filteredArtists.length > 0
      ? filteredArtists
      : generateMockArtists([
          `${genre} Artist 1`,
          `${genre} Artist 2`,
          `${genre} Artist 3`,
          `${genre} Artist 4`
        ], `genre-${genre.toLowerCase()}`);
    
    const normalized = appendWithUniqueIds(finalArtists);
    if (requestVersion !== artistListVersionRef.current) {
      return;
    }
    clearNotice();
    setDisplayedArtists(normalized);
    if (normalized.length > 0) {
      settleBrowseEmptyStateDelay();
    }
    setHasMore(normalized.length >= 6);
  } catch (err) {
    if (isCanceledError(err)) {
      setLoading('genre', false);
      return;
    }
    showNotice(`Could not load live ${genre} artists. Showing demo artists instead.`);
    
    // Fallback to mock data if API fails
    const genreArtists = generateMockArtists([
      `${genre} Artist 1`,
      `${genre} Artist 2`,
      `${genre} Artist 3`,
      `${genre} Artist 4`,
      `${genre} Artist 5`,
      `${genre} Artist 6`
    ], `genre-${genre.toLowerCase()}`);
    
    const normalized = appendWithUniqueIds(genreArtists);
    if (requestVersion !== artistListVersionRef.current) {
      return;
    }
    setDisplayedArtists(normalized);
    if (normalized.length > 0) {
      settleBrowseEmptyStateDelay();
    }
  }
  if (requestVersion !== artistListVersionRef.current) {
    return;
  }
  setLoading('genre', false);
  setPage(1);
}, [appendWithUniqueIds, clearNotice, fetchMainArtists, generateMockArtists, setLoading, settleBrowseEmptyStateDelay, showNotice, startBrowseEmptyStateDelay, startRequest]);
  
  // Load more artists
  const loadMoreArtists = useCallback(async () => {
    if (loadingState.more || !hasMore) return;
    
    const requestVersion = artistListVersionRef.current;
    setLoading('more', true);
    const newPage = page + 1;
    
    try {
      // Get the active genre
      const genre = selectedGenre === 'All' ? 'pop' : getGenreQueryValue(selectedGenre);
      const signal = startRequest('more');
      const res = await api.get('/spotify/artists', { 
        params: { 
          genre, 
          page: newPage,
          limit: 10 
        },
        signal 
      });
      
      // Add new artists to the displayed list
      if (res.data && res.data.length > 0) {
        if (requestVersion !== artistListVersionRef.current) {
          return;
        }
        clearNotice();
        setDisplayedArtists(prev => {
          const incoming = appendWithUniqueIds(res.data, prev);
          const next = [...prev, ...incoming];
          const grew = incoming.length > 0;
          setHasMore(res.data.length >= 10 && grew); // Only keep hasMore if we actually grew
          return next;
        });
      } else {
        if (requestVersion !== artistListVersionRef.current) {
          return;
        }
        setHasMore(false);
      }
    } catch (err) {
      if (isCanceledError(err)) {
        setLoading('more', false);
        return;
      }
      showNotice('Could not load more live artists. Showing demo artists instead.');
      
      // Fallback to mock data if API fails
      const moreArtists = generateMockArtists([
        `More Artist ${newPage}-1`,
        `More Artist ${newPage}-2`,
        `More Artist ${newPage}-3`,
        `More Artist ${newPage}-4`
      ], `more-page-${newPage}`);
      
      if (requestVersion !== artistListVersionRef.current) {
        return;
      }
      setDisplayedArtists(prev => {
        const incoming = appendWithUniqueIds(moreArtists, prev);
        const next = [...prev, ...incoming];
        return next;
      });
      setHasMore(newPage < 3); // Limit to 3 pages for mock data
    }
    
    if (requestVersion !== artistListVersionRef.current) {
      return;
    }
    setPage(newPage);
    setLoading('more', false);
  }, [appendWithUniqueIds, clearNotice, generateMockArtists, hasMore, loadingState.more, page, selectedGenre, setLoading, showNotice, startRequest]);
  
  // Handle genre selection
  const handleGenreSelect = useCallback((genre) => {
    if (genre === selectedGenre || loadingState.genre) return;
    
    cancelRequest('main');
    cancelRequest('genre');
    cancelRequest('more');
    cancelRequest('search');
    setSelectedGenre(genre);
    setLoading('main', false);
    setLoading('more', false);
    setLoadingState(prev => ({ ...prev, artistId: null }));
    fetchArtistsByGenre(genre);
    setSearchQuery('');
    setSearchResults([]);
    setLoading('search', false);
    // Reset scroll to top when changing genres so new content starts at the top
    if (artistsAreaRef.current) {
      artistsAreaRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [cancelRequest, selectedGenre, loadingState.genre, fetchArtistsByGenre, setLoading]);
  
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
  const handleSearchChange = useCallback((e) => {
    const sanitizedQuery = sanitizeSearchInput(e.target.value);

    setSearchQuery(sanitizedQuery);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!sanitizedQuery) {
      latestSearchQueryRef.current = '';
      cancelRequest('search');
      setLoading('search', false);
      setSearchResults([]);
      clearNotice();
      return;
    }

    if (sanitizedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      latestSearchQueryRef.current = sanitizedQuery;
      cancelRequest('search');
      setLoading('search', false);
      setSearchResults([]);
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      searchArtists(sanitizedQuery);
    }, 500);
  }, [cancelRequest, clearNotice, searchArtists, setLoading]);
  
  
  // Fetch similar artists - Now using the centralized fetchSimilarArtists utility
  const fetchSimilarForArtist = useCallback(async (artist) => {
    try {
      // Create a simple array with just this artist
      const similarArtists = await fetchSimilarArtists([artist]);
      return similarArtists;
    } catch {
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

    const artistKey = getArtistIdentityKey(artist);
    if (!artistKey) return;
    
    const isAlreadySelected = selectedArtists.some(
      (selectedArtist) => getArtistIdentityKey(selectedArtist) === artistKey
    );
    
    // Handle deselection
    if (isAlreadySelected) {
      setSelectedArtists(prev => prev.filter(
        (selectedArtist) => getArtistIdentityKey(selectedArtist) !== artistKey
      ));
      return;
    }
    
    // Handle selection (limit to 5)
    if (selectedArtists.length >= 5) {
      showNotice('Select up to 5 artists for the demo.');
      return;
    }

    setSelectedArtists(prev => [
      ...prev,
      artist.id ? artist : { ...artist, id: artistKey }
    ]);
    
    // Show similar artists if not in search mode
    if (artist.isMain && !searchQuery.trim()) {
      const requestVersion = artistListVersionRef.current;
      setLoadingState(prev => ({ ...prev, artistId: artist.id }));
      
      const similarArtists = await fetchSimilarForArtist(artist);
      if (requestVersion !== artistListVersionRef.current) {
        setLoadingState(prev => ({ ...prev, artistId: null }));
        return;
      }
      
      if (similarArtists && similarArtists.length > 0) {
        const relatedArtists = similarArtists.map(related => ({
          ...related,
          isMain: false,
          fadeIn: true
        }));
        
        // Insert related artists after the selected artist without duplicating prior entries
        setDisplayedArtists(prev => {
          const index = prev.findIndex(a => a.id === artist.id || a.name === artist.name);
          if (index === -1) {
            return prev;
          }

          const dedupedRelatedArtists = appendWithUniqueIds(relatedArtists, prev);
          if (dedupedRelatedArtists.length === 0) {
            return prev;
          }

          const updated = [...prev];
          updated.splice(index + 1, 0, ...dedupedRelatedArtists);
          return updated;
        });
      }
      
      setLoadingState(prev => ({ ...prev, artistId: null }));
    }
  }, [appendWithUniqueIds, fetchSimilarForArtist, loadingState.artistId, loadingState.genre, searchQuery, selectedArtists, showNotice]);
  
  // Effects ----------------
  
  // Initial data fetch
  useEffect(() => {
    fetchMainArtists();
  }, [fetchMainArtists]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mobileQuery = window.matchMedia(SELECTION_MOBILE_MEDIA_QUERY);
    const tabletPortraitQuery = window.matchMedia(SELECTION_TABLET_PORTRAIT_MEDIA_QUERY);
    const handleMobileChange = (event) => setIsMobileView(event.matches);
    const handleTabletPortraitChange = (event) => setIsTabletPortraitView(event.matches);

    setIsMobileView(mobileQuery.matches);
    setIsTabletPortraitView(tabletPortraitQuery.matches);

    if (
      typeof mobileQuery.addEventListener === 'function' &&
      typeof tabletPortraitQuery.addEventListener === 'function'
    ) {
      mobileQuery.addEventListener('change', handleMobileChange);
      tabletPortraitQuery.addEventListener('change', handleTabletPortraitChange);
      return () => {
        mobileQuery.removeEventListener('change', handleMobileChange);
        tabletPortraitQuery.removeEventListener('change', handleTabletPortraitChange);
      };
    }

    mobileQuery.addListener(handleMobileChange);
    tabletPortraitQuery.addListener(handleTabletPortraitChange);
    return () => {
      mobileQuery.removeListener(handleMobileChange);
      tabletPortraitQuery.removeListener(handleTabletPortraitChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const measureBottomArea = () => {
      const nextHeight = Math.ceil(bottomAreaRef.current?.offsetHeight || 0);
      setBottomAreaHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    measureBottomArea();

    let resizeObserver;
    if (typeof ResizeObserver === 'function' && bottomAreaRef.current) {
      resizeObserver = new ResizeObserver(() => measureBottomArea());
      resizeObserver.observe(bottomAreaRef.current);
    }

    window.addEventListener('resize', measureBottomArea);
    window.addEventListener('orientationchange', measureBottomArea);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', measureBottomArea);
      window.removeEventListener('orientationchange', measureBottomArea);
    };
  }, []);
  
  // Scroll event listener
  useEffect(() => {
    const currentRef = artistsAreaRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      return () => currentRef.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // Scroll selected genre button into view
  useEffect(() => {
    if (genreFiltersRef.current && selectedGenre !== 'All') {
      const button = genreFiltersRef.current.querySelector('.genre-button.active');
      if (button) {
        const containerWidth = genreFiltersRef.current.clientWidth;
        const buttonLeft = button.offsetLeft;
        const buttonWidth = button.clientWidth;
        
        // Center the button in the container
        genreFiltersRef.current.scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      }
    }
  }, [selectedGenre]);

  // Build a wider in-memory artist pool for later preview usage in PlayingScreen.
  useEffect(() => {
    addArtistsToSessionPool(displayedArtists);
  }, [displayedArtists]);

  useEffect(() => {
    addArtistsToSessionPool(searchResults);
  }, [searchResults]);

  useEffect(() => {
    addArtistsToSessionPool(selectedArtists);
  }, [selectedArtists]);
  
  // Clean up search timeout
  useEffect(() => {
    // React 18 strict mode mounts/unmounts twice in dev; re-affirm mount flag here
    isMountedRef.current = true;
    const controllers = requestControllers.current;

    return () => {
      isMountedRef.current = false;
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
      if (emptyStateDelayTimeoutRef.current) clearTimeout(emptyStateDelayTimeoutRef.current);
      Object.keys(controllers).forEach((key) => {
        const ctrl = controllers[key];
        if (ctrl) {
          ctrl.abort();
          controllers[key] = null;
        }
      });
    };
  }, []);
  
  // Computed values ----------------
  
  // Artists to display based on search state
  const artistsToShow = useMemo(() => 
    searchQuery.trim() ? searchResults : displayedArtists,
    [searchQuery, searchResults, displayedArtists]
  );
  const isBrowseLoading = !searchQuery.trim() && (loadingState.main || loadingState.genre);
  const shouldShowBrowseLoadingState =
    !searchQuery.trim() &&
    (isBrowseLoading || (!canShowBrowseEmptyState && displayedArtists.length === 0));
  
  // UI Rendering ----------------
  
  return (
    <MuflThreadsSidebarLayout activeItem="rooms" shellClassName="selection-shell">
      <div
        className={`selection-screen-container ${isMobileView ? 'is-mobile-view' : 'is-desktop-view'} ${isTabletPortraitView ? 'is-tablet-portrait-view' : ''}`}
        style={{ '--selection-bottom-area-height': `${bottomAreaHeight}px` }}
      >
        <div className="selection-screen-panel">
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
                maxLength={80}
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                inputMode="search"
                aria-label="Search for artists"
                role="searchbox"
              />
              {loadingState.search && <div className="search-spinner"></div>}
            </div>
            {notice && (
              <div className="error-message" role="status" aria-live="polite">
                {notice}
              </div>
            )}
            
            {/* Genre filters - only when not searching */}
            {!searchQuery.trim() && (
              <div className="genre-filters-container">
                <div className="genre-filters" ref={genreFiltersRef}>
                  {genreOptions.map(genre => (
                    <button
                      key={genre}
                      className={`genre-button ${selectedGenre === genre ? 'active' : ''}`}
                      onClick={() => handleGenreSelect(genre)}
                      disabled={loadingState.genre}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="artists-area" ref={artistsAreaRef}>
            {shouldShowBrowseLoadingState ? (
              <LoadingIndicator fullHeight message={null} />
            ) : (
              <>
                {loadingState.search ? (
                  <LoadingIndicator message="Searching for artists..." />
                ) : (
                  <div className="artists-grid">
                    {artistsToShow.length > 0 ? (
                      artistsToShow.map((artist, index) => {
                        const artistKey = getArtistIdentityKey(artist) || `${artist.name}-${index}`;
                        const isSelected = selectedArtists.some(
                          (selectedArtist) => getArtistIdentityKey(selectedArtist) === artistKey
                        );

                        return (
                          <button
                            type="button"
                            key={`${artistKey}-${index}`}
                            className={`selection-artist-circle ${
                              isSelected ? 'selected' : ''
                            } ${artist.fadeIn ? 'fade-in' : ''}`}
                            onClick={() => handleArtistSelection(artist)}
                            aria-pressed={isSelected}
                            disabled={
                              loadingState.genre ||
                              (loadingState.artistId !== null && loadingState.artistId !== artist.id)
                            }
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
                          </button>
                        );
                      })
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
                {!loadingState.main && !searchQuery.trim() && artistsToShow.length > 0 && (
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
        </div>
      
      {/* Bottom fixed area - Pill Chips design */}
      <div className="bottom-area" ref={bottomAreaRef}>
        <div className="bottom-chips-row">
          {selectedArtists.slice(0, 5).map((artist, index) => (
            <div
              key={`chip-${artist.id || artist.name}-${index}`}
              className="artist-chip"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className="artist-chip-avatar">
                <ArtistImage name={artist.name} src={artist.image} />
              </div>
              <span className="artist-chip-name">{artist.name}</span>
              <button
                className="artist-chip-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  const artistKey = getArtistIdentityKey(artist);
                  setSelectedArtists(prev => prev.filter(
                    (selectedArtist) => getArtistIdentityKey(selectedArtist) !== artistKey
                  ));
                }}
                aria-label={`Remove ${artist.name}`}
              >
                ×
              </button>
            </div>
          ))}
          {selectedArtists.length < 5 && Array.from({ length: 5 - selectedArtists.length }).map((_, i) => (
            <div key={`empty-${i}`} className="artist-chip-empty" />
          ))}
        </div>
        <button
          className="continue-button"
          disabled={selectedArtists.length === 0}
          onClick={() => {
            addArtistsToSessionPool(selectedArtists);
            onContinue(selectedArtists);
          }}
        >
          Continue · {selectedArtists.length}/5 selected
        </button>
      </div>
      </div>
    </MuflThreadsSidebarLayout>
  );
};

export default SelectionScreen;
