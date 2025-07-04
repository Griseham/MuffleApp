// utils/enhancedFetchSimilar.js - Enhanced similar artists fetching with Apple Music images and caching

const CACHE_KEY = 'enhanced_similar_artists_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/* ---------- top of file (add just under CACHE_DURATION line) ---------- */
const RATE_DELAY_MS   = 300;               // 4 req/sec
const imageRequestMem = new Map();         // session-cache: name → artist

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));


// Cache management
const getFromCache = (key) => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${key}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
  }
  return null;
};

const saveToCache = (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify(cacheData));
  } catch (error) {
  }
};

// Generate cache key from selected artists
const generateCacheKey = (selectedArtists) => {
  return selectedArtists
    .map(artist => artist.name.toLowerCase().replace(/\s+/g, '_'))
    .sort()
    .join('|');
};

// Fetch similar artists from Last.fm
const fetchLastFmSimilarArtists = async (selectedArtists, targetCount = 50) => {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';
  
  try {
    const response = await fetch(`${API_BASE}/lastfm/similar-artists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedArtists: selectedArtists.map(artist => artist.name)
      })
    });

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data = await response.json();
    return data.similarArtists || [];
  } catch (error) {
    return [];
  }
};

// Fetch images from Apple Music for artists
/* ---------- replace the whole fetchAppleMusicImages function ----------- */
const fetchAppleMusicImages = async (artistNames, progressCallback = null) => {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';
  const artistsWithImages = [];

  for (let i = 0; i < artistNames.length; i++) {
    const name = artistNames[i];

    /* ① session cache – no fetch if we’ve asked for this name already */
    if (imageRequestMem.has(name)) {
      artistsWithImages.push(imageRequestMem.get(name));
      if (progressCallback) progressCallback(((i + 1) / artistNames.length) * 100);
      continue;
    }

    try {
      const res = await fetch(`${API_BASE}/apple-music/search-artists?query=${encodeURIComponent(name)}`);
      if (res.ok) {
        const results = await res.json();
        const best   = results.find(a => a.name.toLowerCase() === name.toLowerCase()) || results[0];

        if (best && best.image && !best.image.includes('fallback')) {
          imageRequestMem.set(name, best);          // memoise for this session
          artistsWithImages.push(best);
        }
      }
    } catch (_) {
      /* swallow network errors – we’ll just skip the image */
    }

    if (progressCallback)
      progressCallback(((i + 1) / artistNames.length) * 100);

    /* ② throttle – wait before the next Apple request */
    await sleep(RATE_DELAY_MS);
  }

  return artistsWithImages;
};


// Remove duplicates based on artist name (case insensitive)
const removeDuplicates = (artists, selectedArtists = []) => {
  const seen = new Set();
  const selectedNames = new Set(selectedArtists.map(a => a.name.toLowerCase()));
  
  return artists.filter(artist => {
    const nameLower = artist.name.toLowerCase();
    
    // Skip if already seen or if it's a selected artist
    if (seen.has(nameLower) || selectedNames.has(nameLower)) {
      return false;
    }
    
    seen.add(nameLower);
    return true;
  });
};

// Main function to fetch enhanced similar artists
export const fetchEnhancedSimilarArtists = async (selectedArtists, progressCallback = null) => {
  if (!selectedArtists || selectedArtists.length === 0) {
    return [];
  }

  // Check cache first
  const cacheKey = generateCacheKey(selectedArtists);
  const cached = getFromCache(cacheKey);
  if (cached) {
    if (progressCallback) progressCallback(100);
    return cached;
  }

  try {
    // Step 1: Fetch similar artists from Last.fm (20%)
    if (progressCallback) progressCallback(10);
    
    const similarArtists = await fetchLastFmSimilarArtists(selectedArtists, 60); // Get more to account for filtering
    
    if (progressCallback) progressCallback(20);
    
    if (similarArtists.length === 0) {
      return [];
    }

    // Step 2: Remove duplicates and limit count
    const uniqueArtists = removeDuplicates(similarArtists, selectedArtists);
    const limitedArtists = uniqueArtists.slice(0, 50); // Limit to 50 for efficiency
    
    if (progressCallback) progressCallback(25);
    
    // Step 3: Fetch images from Apple Music (25% -> 95%)
    
    const artistsWithImages = await fetchAppleMusicImages(
      limitedArtists.map(a => a.name),
      (imageProgress) => {
        // Map image fetching progress from 25% to 95%
        const mappedProgress = 25 + (imageProgress * 0.7);
        if (progressCallback) progressCallback(mappedProgress);
      }
    );

    // Step 4: Final filtering - only keep artists with images
    const finalArtists = artistsWithImages.filter(artist => 
      artist.image && 
      !artist.image.includes('fallback') && 
      !artist.image.includes('placeholder')
    );

    if (progressCallback) progressCallback(100);
    
    
    // Cache the results
    saveToCache(cacheKey, finalArtists);
    
    return finalArtists;
    
  } catch (error) {
    if (progressCallback) progressCallback(100);
    return [];
  }
};

// Fetch random genre artists from Apple Music (for negative similarity)
export const fetchRandomGenreArtists = async (count = 50, progressCallback = null) => {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'api';
  
  try {
    if (progressCallback) progressCallback(20);
    
    
    // Use the new random genre endpoint
    const response = await fetch(`${API_BASE}/apple-music/random-genre-artists?count=${count}`);
    
    if (!response.ok) {
      throw new Error(`Apple Music random genre fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (progressCallback) progressCallback(80);
    
    // Handle both old format (direct array) and new format ({ artists: [...] })
    const artistsArray = data.artists || data || [];
    
    // Filter out any artists without images
    const filteredArtists = artistsArray
      .filter(artist => artist.image && !artist.image.includes('fallback') && !artist.image.includes('placeholder'));
    
    if (progressCallback) progressCallback(100);
    
    
    return filteredArtists;
    
  } catch (error) {
    if (progressCallback) progressCallback(100);
    
    // Fallback to mock data
    return Array.from({ length: count }, (_, i) => ({
      id: `random-${i}`,
      name: `Random Artist ${i + 1}`,
      image: `https://picsum.photos/seed/random${i}/300/300`,
      genres: ['random']
    }));
  }
};

// Clear cache (utility function)
export const clearSimilarArtistsCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
  }
};