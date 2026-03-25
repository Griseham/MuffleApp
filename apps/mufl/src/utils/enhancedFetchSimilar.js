// utils/enhancedFetchSimilar.js - Enhanced similar artists fetching with Apple Music images and caching
import { buildApiUrl } from './api';

const CACHE_KEY = 'enhanced_similar_artists_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4" fill="%23222"/><path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill="%23222"/></svg>';

const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, externalSignal = null) => {
  const controller = new AbortController();

  const abortHandler = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', abortHandler);
    }
  }

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', abortHandler);
    }
  }
};

const runWithConcurrency = async (items, limit, worker) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const results = new Array(items.length);
  let index = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  });

  await Promise.all(runners);
  return results;
};

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
    console.error('Cache read error:', error);
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
    console.error('Cache write error:', error);
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
const fetchLastFmSimilarArtists = async (selectedArtists, targetCount = 50, options = {}) => {
  try {
    const response = await fetchWithTimeout(buildApiUrl('/lastfm/similar-artists'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedArtists: selectedArtists.map(artist => artist.name)
      })
    }, options.requestTimeoutMs, options.signal);

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data = await response.json();
    return data.similarArtists || [];
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error('Last.fm fetch error:', error);
    }
    return [];
  }
};

// Fetch images from Apple Music for artists; falls back to placeholder on auth/other failures
const fetchAppleMusicImages = async (artistNames, progressCallback = null, options = {}) => {
  const artistsWithImages = [];
  const placeholderImg = DEFAULT_PLACEHOLDER_IMG;
  const createPlaceholderArtist = (artistName, prefix = 'am-fallback', genres = []) => ({
    id: `${prefix}-${artistName}`,
    name: artistName,
    image: placeholderImg,
    genres,
  });
  const totalArtists = Math.max(artistNames.length, 1);
  let processedArtists = 0;
  const requestTimeoutMs = options.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;
  const concurrency = options.concurrency || DEFAULT_CONCURRENCY;

  const reportProgress = () => {
    if (!progressCallback) return;
    progressCallback(Math.min(100, (processedArtists / totalArtists) * 100));
  };
  
  let authFailed = false;

  const tasks = await runWithConcurrency(artistNames, concurrency, async (artistName) => {
    if (authFailed) {
      processedArtists += 1;
      reportProgress();
      return createPlaceholderArtist(artistName, 'am-authfail');
    }

    try {
      const response = await fetchWithTimeout(
        buildApiUrl(`/apple-music/search-artists?query=${encodeURIComponent(artistName)}`),
        {},
        requestTimeoutMs,
        options.signal
      );

      if (response.ok) {
        const results = await response.json();
        const exactMatch = results.find(
          (artist) => artist.name.toLowerCase() === artistName.toLowerCase()
        );
        const bestMatch = exactMatch || results[0];

        if (bestMatch && bestMatch.image && !bestMatch.image.includes('fallback')) {
          return {
            id: bestMatch.id,
            name: bestMatch.name,
            image: bestMatch.image,
            genres: bestMatch.genres || []
          };
        }

        return createPlaceholderArtist(
          bestMatch?.name || artistName,
          bestMatch?.id ? String(bestMatch.id) : 'am',
          bestMatch?.genres || []
        );
      }

      if (response.status === 401 || response.status === 403) {
        authFailed = true;
      }

      return createPlaceholderArtist(artistName, 'am-fallback');
    } catch (error) {
      if (error?.name === 'AbortError') {
        return createPlaceholderArtist(artistName, 'am-abort');
      }
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error fetching image for ${artistName}:`, error);
      }

      return createPlaceholderArtist(artistName, 'am-error');
    } finally {
      processedArtists += 1;
      reportProgress();
    }
  });

  artistsWithImages.push(...tasks.filter(Boolean));

  return { artistsWithImages, authFailed };
};

// Fetch images from Spotify as a fallback when Apple Music auth fails
const fetchSpotifyImages = async (artistNames, options = {}) => {
  const placeholderImg = DEFAULT_PLACEHOLDER_IMG;
  try {
    const response = await fetchWithTimeout(buildApiUrl('/spotify/fetch-images'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistNames })
    }, options.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS, options.signal);
    if (!response.ok) {
      throw new Error(`Spotify fetch-images failed: ${response.status}`);
    }
    const data = await response.json();
    return (data.artists || []).map((artist, idx) => ({
      id: artist.id || `spotify-${idx}`,
      name: artist.name,
      image: artist.image || placeholderImg,
      genres: artist.genres || []
    }));
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Spotify fallback error:', err);
    }
    return artistNames.map((name, idx) => ({
      id: `spotify-fallback-${idx}`,
      name,
      image: placeholderImg,
      genres: []
    }));
  }
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
export const fetchEnhancedSimilarArtists = async (
  selectedArtists,
  progressCallback = null,
  options = {}
) => {
  if (!selectedArtists || selectedArtists.length === 0) {
    return [];
  }

  const requestTimeoutMs = options.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;
  const concurrency = options.concurrency || DEFAULT_CONCURRENCY;

  // Check cache first
  const cacheKey = generateCacheKey(selectedArtists);
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log('Using cached similar artists');
    if (progressCallback) progressCallback(100);
    return cached;
  }

  try {
    // Step 1: Fetch similar artists from Last.fm (20%)
    if (progressCallback) progressCallback(10);
    console.log('Fetching similar artists from Last.fm...');
    
    const similarArtists = await fetchLastFmSimilarArtists(selectedArtists, 60, {
      signal: options.signal,
      requestTimeoutMs,
    }); // Get more to account for filtering
    
    if (progressCallback) progressCallback(20);
    
    if (similarArtists.length === 0) {
      console.warn('No similar artists found from Last.fm');
      const fallbackFromSelected = (selectedArtists || []).map((artist, idx) => ({
        id: artist.id || `selected-${idx}`,
        name: artist.name || `Artist ${idx + 1}`,
        image: artist.image || artist.artworkUrl || DEFAULT_PLACEHOLDER_IMG,
        genres: artist.genres || []
      }));
      return fallbackFromSelected;
    }

    // Step 2: Remove duplicates and limit count
    const uniqueArtists = removeDuplicates(similarArtists, selectedArtists);
    const limitedArtists = uniqueArtists.slice(0, 50); // Limit to 50 for efficiency
    
    if (progressCallback) progressCallback(25);
    
    // Step 3: Fetch images from Apple Music (25% -> 95%)
    console.log(`Fetching images for ${limitedArtists.length} artists from Apple Music...`);
    
    const { artistsWithImages, authFailed } = await fetchAppleMusicImages(
      limitedArtists.map(a => a.name),
      (imageProgress) => {
        // Map image fetching progress from 25% to 95%
        const mappedProgress = 25 + (imageProgress * 0.7);
        if (progressCallback) progressCallback(mappedProgress);
      },
      {
        signal: options.signal,
        requestTimeoutMs,
        concurrency,
      }
    );

    let finalArtists = artistsWithImages.filter(artist => artist?.image);

    if (finalArtists.length === 0) {
      finalArtists = limitedArtists.map((artist, idx) => ({
        id: artist.id || `am-fallback-${idx}`,
        name: artist.name,
        image: artist.image || DEFAULT_PLACEHOLDER_IMG,
        genres: artist.genres || []
      }));
    }

    // If Apple Music auth failed or results are sparse, use Spotify fallback for all names
    if (authFailed || finalArtists.length < limitedArtists.length) {
      const spotifyFallback = await fetchSpotifyImages(limitedArtists.map(a => a.name), {
        signal: options.signal,
        requestTimeoutMs,
      });
      // Prefer existing Apple entries when they have images; otherwise overwrite with Spotify
      const byName = new Map(finalArtists.map(a => [a.name.toLowerCase(), a]));
      spotifyFallback.forEach(artist => {
        const key = artist.name.toLowerCase();
        if (!byName.has(key) || !byName.get(key).image) {
          byName.set(key, artist);
        }
      });
      finalArtists = Array.from(byName.values());
    }

    if (progressCallback) progressCallback(100);
    
    console.log(`Successfully fetched ${finalArtists.length} similar artists with images`);
    
    // Cache the results
    saveToCache(cacheKey, finalArtists);
    
    return finalArtists;
    
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error('Error in fetchEnhancedSimilarArtists:', error);
    }
    if (progressCallback) progressCallback(100);
    return [];
  }
};

// Fetch random genre artists from Apple Music (for negative similarity)
export const fetchRandomGenreArtists = async (count = 50, progressCallback = null, options = {}) => {
  try {
    if (progressCallback) progressCallback(20);
    
    console.log(`Fetching ${count} random genre artists from Apple Music...`);
    
    // Use the new random genre endpoint
    const response = await fetchWithTimeout(
      buildApiUrl(`/apple-music/random-genre-artists?count=${count}`),
      {},
      options.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS,
      options.signal
    );
    
    if (!response.ok) {
      throw new Error(`Apple Music random genre fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (progressCallback) progressCallback(80);
    
    // Filter out any artists without images
    let filteredArtists = (data.artists || [])
      .filter(artist => artist.image && !artist.image.includes('fallback') && !artist.image.includes('placeholder'));

    if (filteredArtists.length === 0) {
      filteredArtists = Array.from({ length: count }, (_, i) => ({
        id: `random-fallback-${i}`,
        name: `Random Artist ${i + 1}`,
        image: DEFAULT_PLACEHOLDER_IMG,
        genres: ['random']
      }));
    }
    
    if (progressCallback) progressCallback(100);
    
    console.log(`Successfully fetched ${filteredArtists.length} random artists from genre: ${data.genre}`);
    
    return filteredArtists;
    
  } catch (error) {
    if (error?.name === 'AbortError') {
      return [];
    }
    console.error('Error fetching random genre artists:', error);
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
    console.log('Similar artists cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
