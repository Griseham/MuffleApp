// hooks/useEnhancedRoomFeed.js - Enhanced room feed hook with simplified similarity logic

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateSimplifiedRooms, getSimilarityRangeInfo } from '../utils/simplifiedRoomGenerator';
import { fetchEnhancedSimilarArtists, fetchRandomGenreArtists } from '../utils/enhancedFetchSimilar';

// Debounce utility
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

export const useEnhancedRoomFeed = (selectedArtists = []) => {
  // State
  const [rooms, setRooms] = useState([]);
  const [relatedArtists, setRelatedArtists] = useState([]);
  const [randomArtists, setRandomArtists] = useState([]);
  const [currentSimilarity, setCurrentSimilarity] = useState(80);
  const [loadingState, setLoadingState] = useState({
    initialLoad: false,
    similarArtists: false,
    roomGeneration: false,
    progress: 0
  });
  const [error, setError] = useState(null);

  const lastParamsRef = useRef({ key: '', rooms: [] });
  
  // Refs for tracking
  const selectedArtistsRef = useRef([]);
  const fetchedDataRef = useRef({
    relatedArtists: [],
    randomArtists: [],
    lastSelectedArtists: []
  });
  
  // AbortControllers for cleanup
  const abortControllerRef = useRef(null);
  const roomGenerationAbortRef = useRef(null);
  
  // Debounced similarity to avoid too frequent updates
  const debouncedSimilarity = useDebounce(currentSimilarity, 300);
  
  // Update loading state helper
  const updateLoadingState = useCallback((updates) => {
    setLoadingState(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Fetch similar artists (initial load)
  const fetchSimilarArtists = useCallback(async () => {
    if (selectedArtists.length === 0) {
      setRelatedArtists([]);
      return;
    }
    
    // Check if we already have data for these artists
    const selectedNames = selectedArtists.map(a => a.name).sort().join('|');
    const lastNames = fetchedDataRef.current.lastSelectedArtists.map(a => a.name).sort().join('|');
    
    if (selectedNames === lastNames && fetchedDataRef.current.relatedArtists.length > 0) {
      setRelatedArtists(fetchedDataRef.current.relatedArtists);
      return;
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    updateLoadingState({ similarArtists: true, progress: 0 });
    setError(null);
    
    try {
      const enhanced = await fetchEnhancedSimilarArtists(
        selectedArtists,
        (progress) => updateLoadingState({ progress }),
        abortControllerRef.current.signal
      );
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      setRelatedArtists(enhanced);
      fetchedDataRef.current.relatedArtists = enhanced;
      fetchedDataRef.current.lastSelectedArtists = [...selectedArtists];
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Failed to fetch similar artists. Please try again.');
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        updateLoadingState({ similarArtists: false, progress: 100 });
      }
    }
  }, [selectedArtists, updateLoadingState]);
  
  // Fetch random artists for negative similarity
  const fetchRandomArtists = useCallback(async () => {
    if (fetchedDataRef.current.randomArtists.length > 0) {
      setRandomArtists(fetchedDataRef.current.randomArtists);
      return;
    }
    
    try {
      const random = await fetchRandomGenreArtists(50, (progress) => {
        // Progress callback
      });
      
      setRandomArtists(random);
      fetchedDataRef.current.randomArtists = random;
      
    } catch (err) {
      // Use fallback data
      const fallback = Array.from({ length: 30 }, (_, i) => ({
        id: `random-${i}`,
        name: `Random Artist ${i + 1}`,
        image: '/placeholder-200.png',
        genres: ['random']
      }));
      setRandomArtists(fallback);
    }
  }, []);
  
  // Generate rooms based on current mode (volume or similarity)
  const generateRooms = useCallback(async (primaryValue, targetSecondaryValue = null, mode = 'similarity') => {

       // ── 0. short-circuit if inputs are unchanged ────────────────
   const paramKey = JSON.stringify([
     mode,
     primaryValue,
     targetSecondaryValue,
     selectedArtists.map(a => a.name).sort()
   ]);

   if (paramKey === lastParamsRef.current.key && lastParamsRef.current.rooms.length) {
     setRooms(lastParamsRef.current.rooms);     // reuse stable copy
     return;
   }
    // Abort any ongoing room generation
    if (roomGenerationAbortRef.current) {
      roomGenerationAbortRef.current.abort();
    }
    
    // Create new AbortController for this room generation
    roomGenerationAbortRef.current = new AbortController();
    const signal = roomGenerationAbortRef.current.signal;
    
    updateLoadingState({ roomGeneration: true });
    
    try {
      let artistsToUse;
      
      if (mode === 'similarity') {
        // Similarity mode logic (existing)
        const rangeInfo = getSimilarityRangeInfo(primaryValue);
        
        if (rangeInfo.name === 'negative') {
          // Use random artists for negative similarity
          if (randomArtists.length === 0) {
            await fetchRandomArtists();
            if (signal.aborted) return;
            artistsToUse = fetchedDataRef.current.randomArtists;
          } else {
            artistsToUse = randomArtists;
          }
          
          // Check if aborted before generating
          if (signal.aborted) return;
          
          // Generate rooms with random artists only
          const generatedRooms = generateSimplifiedRooms([], artistsToUse, primaryValue, 8, targetSecondaryValue, 'similarity');
          
          // Check if aborted before setting state
          if (signal.aborted) return;
          lastParamsRef.current = { key: paramKey, rooms: generatedRooms };

          setRooms(generatedRooms);
          
        } else {
          // Use related artists for positive similarity
          if (relatedArtists.length === 0 && selectedArtists.length > 0) {
            await fetchSimilarArtists();
            if (signal.aborted) return;
            artistsToUse = fetchedDataRef.current.relatedArtists;
          } else {
            artistsToUse = relatedArtists;
          }
          
          // Check if aborted before generating
          if (signal.aborted) return;
          
          // Generate rooms with selected + related artists
          const generatedRooms = generateSimplifiedRooms(selectedArtists, artistsToUse, primaryValue, 8, targetSecondaryValue, 'similarity');
          
          // Check if aborted before setting state
          if (signal.aborted) return;
          lastParamsRef.current = { key: paramKey, rooms: generatedRooms };

          setRooms(generatedRooms);
        }
        
      } else {
        // Volume mode logic (new)
        // Always use related artists (no negative ranges in volume mode)
        if (relatedArtists.length === 0 && selectedArtists.length > 0) {
          await fetchSimilarArtists();
          if (signal.aborted) return;
          artistsToUse = fetchedDataRef.current.relatedArtists;
        } else {
          artistsToUse = relatedArtists;
        }
        
        // Check if aborted before generating
        if (signal.aborted) return;
        
        // Generate rooms with selected + related artists
        const generatedRooms = generateSimplifiedRooms(selectedArtists, artistsToUse, primaryValue, 8, targetSecondaryValue, 'volume');
        
        // Check if aborted before setting state
        if (signal.aborted) return;
        lastParamsRef.current = { key: paramKey, rooms: generatedRooms };

        setRooms(generatedRooms);
      }
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Failed to generate rooms. Please try again.');
      }
    } finally {
      if (!signal.aborted) {
        updateLoadingState({ roomGeneration: false });
      }
    }
  }, [selectedArtists, relatedArtists, randomArtists, fetchSimilarArtists, fetchRandomArtists, updateLoadingState]);
  
  // Handle similarity changes with optional landed volume
  const handleSimilarityChange = useCallback((newSimilarity, landedVolume = null) => {
    setCurrentSimilarity(newSimilarity);
    // Generate rooms immediately with the landed volume
    if (!loadingState.initialLoad && !loadingState.similarArtists) {
      generateRooms(newSimilarity, landedVolume, 'similarity');
    }
  }, [generateRooms, loadingState.initialLoad, loadingState.similarArtists]);
  
  // Handle volume changes with optional landed similarity
  const handleVolumeChange = useCallback((newVolume, landedSimilarity = null) => {
    // Generate rooms immediately with the landed similarity
    if (!loadingState.initialLoad && !loadingState.similarArtists) {
      generateRooms(newVolume, landedSimilarity, 'volume');
    }
  }, [generateRooms, loadingState.initialLoad, loadingState.similarArtists]);
  
  // Effect: Initial load when selected artists change
  useEffect(() => {
    const loadInitialData = async () => {
      updateLoadingState({ initialLoad: true });
      
      try {
        // Kick off both fetches in parallel
        const similarP = selectedArtists.length > 0
          ? fetchSimilarArtists()
          : Promise.resolve();
        
        const randomP = fetchRandomArtists();
        
        // Wait for both together
        await Promise.all([similarP, randomP]);
        
        // Generate initial rooms for current similarity
        await generateRooms(currentSimilarity);
        
        // Set initialLoad to false immediately after rooms are generated
        updateLoadingState({ initialLoad: false, progress: 100 });
        
      } catch (err) {
        setError('Failed to load initial data. Please try again.');
        updateLoadingState({ initialLoad: false });
      }
    };
    
    // Only load if selected artists have changed
    const currentNames = selectedArtists.map(a => a.name).sort().join('|');
    const previousNames = selectedArtistsRef.current.map(a => a.name).sort().join('|');
    
    if (currentNames !== previousNames) {
      selectedArtistsRef.current = [...selectedArtists];
      loadInitialData();
    }
  }, [selectedArtists, fetchSimilarArtists, fetchRandomArtists, generateRooms, currentSimilarity, updateLoadingState]);
  
  // Effect: Generate rooms when similarity changes
  useEffect(() => {
    if (!loadingState.initialLoad && !loadingState.similarArtists) {
      generateRooms(debouncedSimilarity);
    }
  }, [debouncedSimilarity, generateRooms, loadingState.initialLoad, loadingState.similarArtists]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      // Abort any ongoing requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (roomGenerationAbortRef.current) {
        roomGenerationAbortRef.current.abort();
      }
    };
  }, []);
  
  // Regenerate rooms manually
  const regenerateRooms = useCallback(() => {
    generateRooms(currentSimilarity);
  }, [generateRooms, currentSimilarity]);
  
  // Check if we're loading anything
  const isLoading = Object.values(loadingState).some(loading => 
    typeof loading === 'boolean' && loading
  );
  
  return {
    // Data
    rooms,
    selectedArtists,
    relatedArtists,
    currentSimilarity,
    
    // Loading states
    isLoading,
    loadingState,
    error,
    
    // Actions
    handleSimilarityChange,
    handleVolumeChange,
    regenerateRooms,
    
    // Utilities
    getSimilarityRangeInfo: (similarity) => getSimilarityRangeInfo(similarity || currentSimilarity)
  };
};