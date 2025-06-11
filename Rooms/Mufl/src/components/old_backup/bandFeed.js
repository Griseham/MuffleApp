// Combined bandFeed.js - Fixed implementation with consolidated tuner state
import { useEffect, useRef, useState } from 'react';
import { MIN_SIMILARITY, MAX_SIMILARITY, BAND_SIZE, SIMILARITY_BAND_SIZE, clamp } from '../components/radioUtils';

const IDLE_MS = 1000; // Reduced from 3000ms to 1000ms for faster feedback
const STATION_NAMES = ['KBLX', 'KKSF', 'KITS', 'KMEL', 'KIOI', 'KBAY', 'KFOG', 'KSAN', 'KQED', 'KCBS'];

/**
 * Calculates the "band slot" based on the active section.
 * For volume: simple division into bands of 300
 * For similarity: division based on similarity ranges
 */
const getBandIndex = (section, vol, sim) => {
  if (section === 'volume') {
    // Volume bands: 0-299, 300-599, etc.
    return Math.floor(vol / BAND_SIZE);
  } else {
    // Similarity bands: We adjust by MIN_SIMILARITY to get a positive index
    // Example: -1000 would be index 0, -900 would be index 1, etc.
    return Math.floor((sim - MIN_SIMILARITY) / SIMILARITY_BAND_SIZE);
  }
};

/**
 * Generates simulated radio band feed for display with support for similarity mode
 * FIXED: Ensures the first card correctly displays the expected value in similarity mode
 */
export const generateBandFeed = (
  activeSection,
  tuner = {}
) => {
  // Extract values from tuner safely with defaults
  const bandFreqs = tuner.bandFreqs || [];
  const landedFreq = tuner.landedFreq || null;
  const volume = tuner.volume || 1500;
  const similarity = tuner.similarity || 0;
  const bandIndex = tuner.bandIndex || getBandIndex(activeSection, volume, similarity);
  
  const freqs = bandFreqs.length
    ? bandFreqs
    : activeSection === 'volume'
        ? [10, 20, 30]              // fallback if list missing
        : [200, 400, 800];          // ...

  // Guarantee the landed‑on freq sits in slot 0
  const ordered = landedFreq != null
    ? [landedFreq, ...freqs.filter(f => f !== landedFreq)]
    : freqs;

  return ordered.map((freq, i) => {
    let vol, sim;

    if (activeSection === 'volume') {
      // In volume mode: 
      // - First number (volume) should be the exact band volume
      // - Second number (similarity) is the frequency value
      vol = i === 0 && landedFreq
            ? volume  // Keep exactly the volume landed on for first card
            : clamp(volume + (Math.random() * 60 - 30), 0, 3200);
      // decimal part
      sim = freq;
    } else {
      // In similarity mode:
      // - For the first card (i === 0):
      //   - If it's a landed frequency point, use that exact frequency
      //   - Otherwise use a frequency value from the ordered list
      // - For all cards, similarity should be the exact value landed on for first card
      
      // FIXED: In similarity mode, if we landed on a point (slot 0), 
      // don't assign freq to vol for the first card - keep the user-selected similarity
      // value consistent across cards
      if (i === 0 && landedFreq != null) {
        // First card with landed frequency should show the exact frequency value
        vol = landedFreq; 
      } else {
        // Other cards or no landed frequency
        vol = freq;
      }
      
      // FIXED: For the first card, always show the exact similarity value
      // For other cards, add a slight variation so they're "near" the center value
      sim = i === 0 
          ? similarity
          : clamp(similarity + (Math.random() * 40 - 20),
                   MIN_SIMILARITY, MAX_SIMILARITY);
    }
    
    return {
      id: `${activeSection}-${bandIndex}-${freq}`,
      freqNumber: `${Math.round(vol)}.${Math.round(sim)}`,
      volume: Math.round(vol),
      similarity: Math.round(sim),
      name: STATION_NAMES[i % STATION_NAMES.length],
      listeners: 10 + Math.floor(Math.random() * 90),
      recommendations: 5 + Math.floor(Math.random() * 35),
      minutes: 30 + Math.floor(Math.random() * 60),
      artists: ['Artist A', 'Artist B', 'Artist C'].slice(0, 1 + (i % 3)),
      freq: freq
    };
  });
};

/**
 * Hook to provide filtered radio stations based on current volume and similarity values
 */
export const useBandFeed = (activeSection, volume, similarity, landed = null, bandFreqs = []) => {
  // For backward compatibility, we're just returning an array
  const [feed, setFeed] = useState([]);
  const cache = useRef(new Map());
  const lastBand = useRef(null);
  const lastSection = useRef(activeSection);
  const idleTimer = useRef(null);

  // Calculate band index based on active section
  const bandIndex = getBandIndex(activeSection, volume, similarity);

  // Create a unique cache key that includes section type
  const cacheKey = `${activeSection}-${bandIndex}-${landed ?? 'none'}`;

  useEffect(() => {
    // Reset the timer on band change or section change
    clearTimeout(idleTimer.current);
    
    // Track if section has changed
    const sectionChanged = lastSection.current !== activeSection;
    if (sectionChanged) {
      lastSection.current = activeSection;
      // Force regeneration when switching modes
      lastBand.current = null;
    }
    
    idleTimer.current = setTimeout(() => {
      // Update last band reference
      lastBand.current = bandIndex;
      
      // Generate new feed if not in cache
      if (!cache.current.has(cacheKey)) {
        // Generate feed with proper context for the current mode and landed frequency
        cache.current.set(
          cacheKey, 
          generateBandFeed(
            activeSection, 
            { volume, similarity, landedFreq: landed, bandFreqs, bandIndex }
          )
        );
      }
      
      // Update state with cached or new feed
      setFeed(cache.current.get(cacheKey));
    }, IDLE_MS);

    return () => clearTimeout(idleTimer.current);
  }, [bandIndex, activeSection, cacheKey, volume, similarity, landed, bandFreqs]);

  // For compatibility with your existing code, we'll just return the feed array
  return feed;
};

// Export the enhanced hook that returns an object with more features
export const useEnhancedBandFeed = (activeSection, volume, similarity, landed = null, hasPoint = false, bandFreqs = []) => {
  // For backward compatibility, accept individual params or unified tuner object
  let tunerVolume = volume;
  let tunerSimilarity = similarity;
  let tunerLanded = landed;
  let tunerHasPoint = hasPoint;
  let tunerBandFreqs = bandFreqs || [];
  
  // Check if volume is actually a tuner object
  if (typeof volume === 'object' && volume !== null) {
    const tuner = volume;
    tunerVolume = tuner.volume || 1500;
    tunerSimilarity = tuner.similarity || 0;
    tunerLanded = tuner.landedFreq || null;
    tunerHasPoint = tuner.hasPoint || false;
    tunerBandFreqs = tuner.bandFreqs || [];
  }

  // Debug logging
  console.log('useEnhancedBandFeed → activeSection:', activeSection, 
              'vol:', tunerVolume, 'sim:', tunerSimilarity, 
              'landed:', tunerLanded, 'hasPoint:', tunerHasPoint);

  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const cache = useRef(new Map());
  const lastBand = useRef(null);
  const lastSection = useRef(activeSection);
  const idleTimer = useRef(null);
  const regenerateTimer = useRef(null);

  // Calculate band index based on active section
  const bandIndex = getBandIndex(activeSection, tunerVolume, tunerSimilarity);
  
  // Create a unique cache key that includes section, band index and landed value
  // FIXED: Include landed value in cache key to ensure different landed frequencies
  // generate different card sets
  const cacheKey = `${activeSection}-${bandIndex}-${tunerLanded ?? 'none'}`;

  // Effect for handling no landed point
  useEffect(() => {
    if (tunerHasPoint === false) {
      // Show spinner for 1 second, then regenerate rooms
      clearTimeout(regenerateTimer.current);
      setIsLoading(true);
      regenerateTimer.current = setTimeout(() => {
        // Generate new content for this band
        regenerateRooms();
      }, 1000);
    }
    
    return () => clearTimeout(regenerateTimer.current);
  }, [tunerHasPoint]);

  useEffect(() => {
    // Reset the timer on band change or section change
    clearTimeout(idleTimer.current);
    
    // Track if section has changed
    const sectionChanged = lastSection.current !== activeSection;
    if (sectionChanged) {
      lastSection.current = activeSection;
      // Force regeneration when switching modes
      lastBand.current = null;
      // Clear the cache on section change to ensure fresh content
      cache.current.clear();
    }
    
    // Set loading state for better UX during changes
    setIsLoading(true);
    
    idleTimer.current = setTimeout(() => {
      // Update last band reference
      lastBand.current = bandIndex;
      
      // FIXED: Also regenerate if landedFreq changes
      const shouldRegenerate = !cache.current.has(cacheKey) || 
                               !tunerHasPoint || 
                               (tunerLanded != null);
      
      // Generate new feed if not in cache or if we need to regenerate
      if (shouldRegenerate) {
        // Generate feed with current context values for proper similarity stations
        const newFeed = generateBandFeed(
          activeSection,
          {
            volume: tunerVolume,
            similarity: tunerSimilarity,
            landedFreq: tunerLanded,
            bandFreqs: tunerBandFreqs,
            bandIndex
          }
        );
        
        cache.current.set(cacheKey, newFeed);
        
        // Update state with new feed
        setFeed(newFeed);
      } else {
        // Update state with cached feed
        setFeed(cache.current.get(cacheKey));
      }
      
      setIsLoading(false);
    }, IDLE_MS);

    return () => clearTimeout(idleTimer.current);
  }, [bandIndex, activeSection, cacheKey, tunerVolume, tunerSimilarity, tunerLanded, tunerHasPoint, tunerBandFreqs]);

  // Function to force regeneration of rooms
  const regenerateRooms = () => {
    setIsLoading(true);
    
    // Clear cache entry for current band
    cache.current.delete(cacheKey);
    
    // Generate new feed with consolidated tuner state
    const newFeed = generateBandFeed(
      activeSection,
      {
        volume: tunerVolume,
        similarity: tunerSimilarity,
        landedFreq: tunerLanded,
        bandFreqs: tunerBandFreqs,
        bandIndex
      }
    );
    cache.current.set(cacheKey, newFeed);
    
    // Update state
    setFeed(newFeed);
    setIsLoading(false);
  };

  return {
    feed,
    isLoading,
    regenerateRooms
  };
};