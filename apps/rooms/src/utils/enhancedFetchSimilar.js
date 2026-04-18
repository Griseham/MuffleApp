// utils/enhancedFetchSimilar.js - Enhanced similar artists fetching with Apple Music images and caching
import { buildApiUrl } from './api';

const CACHE_KEY = 'enhanced_similar_artists_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_SIMILAR_ARTIST_LOOKUP_LIMIT = 35;
const MAX_429_RETRIES = 3;
const BASE_429_RETRY_DELAY_MS = 500;
const DEFAULT_PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4" fill="%23222"/><path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill="%23222"/></svg>';
const inFlightEnhancedRequests = new Map();
const appleArtistImageCache = new Map();
const appleArtistImageInFlight = new Map();

const createAbortError = () => {
  try {
    return new DOMException('The operation was aborted.', 'AbortError');
  } catch (error) {
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    return abortError;
  }
};

const wait = (ms, signal = null) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(createAbortError());
    return;
  }

  const timeoutId = setTimeout(() => {
    if (signal) signal.removeEventListener('abort', onAbort);
    resolve();
  }, ms);

  const onAbort = () => {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onAbort);
    reject(createAbortError());
  };

  if (signal) {
    signal.addEventListener('abort', onAbort, { once: true });
  }
});

const parseRetryAfterMs = (retryAfterHeader) => {
  if (!retryAfterHeader) return null;
  const parsedSeconds = Number(retryAfterHeader);
  if (Number.isFinite(parsedSeconds)) {
    return Math.max(0, Math.round(parsedSeconds * 1000));
  }

  const parsedDate = Date.parse(retryAfterHeader);
  if (!Number.isNaN(parsedDate)) {
    return Math.max(0, parsedDate - Date.now());
  }

  return null;
};

const get429DelayMs = (response, attempt) => {
  const retryAfterMs = parseRetryAfterMs(response.headers.get('Retry-After'));
  if (Number.isFinite(retryAfterMs) && retryAfterMs >= 0) {
    return Math.min(10_000, retryAfterMs);
  }

  const backoff = BASE_429_RETRY_DELAY_MS * (2 ** attempt);
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(10_000, backoff + jitter);
};

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
  } catch {}
  return null;
};

const saveToCache = (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify(cacheData));
  } catch {}
};

// Generate cache key from selected artists
const generateCacheKey = (selectedArtists) => {
  return selectedArtists
    .map(artist => artist.name.toLowerCase().replace(/\s+/g, '_'))
    .sort()
    .join('|');
};

const createPlaceholderArtist = (artistName, prefix = 'am-fallback', genres = []) => ({
  id: `${prefix}-${artistName}`,
  name: artistName,
  image: DEFAULT_PLACEHOLDER_IMG,
  genres,
  isFallbackImage: true,
});

const fetchAppleArtistWithRetry = async (artistName, options = {}) => {
  const cacheKey = artistName.toLowerCase();
  if (appleArtistImageCache.has(cacheKey)) {
    return appleArtistImageCache.get(cacheKey);
  }

  if (appleArtistImageInFlight.has(cacheKey)) {
    return appleArtistImageInFlight.get(cacheKey);
  }

  const requestTimeoutMs = options.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;
  const lookupPromise = (async () => {
    let attempt = 0;

    while (attempt <= MAX_429_RETRIES) {
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

        const normalizedArtist = (bestMatch && bestMatch.image && !bestMatch.image.includes('fallback'))
          ? {
            id: bestMatch.id,
            name: bestMatch.name,
            image: bestMatch.image,
            genres: bestMatch.genres || [],
            isFallbackImage: false,
          }
          : createPlaceholderArtist(
            bestMatch?.name || artistName,
            bestMatch?.id ? String(bestMatch.id) : 'am',
            bestMatch?.genres || []
          );

        appleArtistImageCache.set(cacheKey, normalizedArtist);
        return normalizedArtist;
      }

      if (response.status === 401 || response.status === 403) {
        return { ...createPlaceholderArtist(artistName, 'am-authfail'), authFailed: true };
      }

      if (response.status === 429 && attempt < MAX_429_RETRIES) {
        const delayMs = get429DelayMs(response, attempt);
        await wait(delayMs, options.signal);
        attempt += 1;
        continue;
      }

      return createPlaceholderArtist(artistName, 'am-fallback');
    }

    return createPlaceholderArtist(artistName, 'am-fallback');
  })();

  appleArtistImageInFlight.set(cacheKey, lookupPromise);

  try {
    return await lookupPromise;
  } finally {
    appleArtistImageInFlight.delete(cacheKey);
  }
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
    return [];
  }
};

// Fetch images from Apple Music for artists; falls back to placeholder on auth/other failures
const fetchAppleMusicImages = async (artistNames, progressCallback = null, options = {}) => {
  const artistsWithImages = [];
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
      const result = await fetchAppleArtistWithRetry(artistName, {
        signal: options.signal,
        requestTimeoutMs,
      });

      if (result?.authFailed) {
        authFailed = true;
      }

      return result;
    } catch (error) {
      if (error?.name === 'AbortError') {
        return createPlaceholderArtist(artistName, 'am-abort');
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
      genres: artist.genres || [],
      isFallbackImage: !artist.image || artist.image === placeholderImg,
    }));
  } catch {
    return artistNames.map((name, idx) => ({
      id: `spotify-fallback-${idx}`,
      name,
      image: placeholderImg,
      genres: [],
      isFallbackImage: true,
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
    if (progressCallback) progressCallback(100);
    return cached;
  }

  if (inFlightEnhancedRequests.has(cacheKey)) {
    return inFlightEnhancedRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
    // Step 1: Fetch similar artists from Last.fm (20%)
    if (progressCallback) progressCallback(10);
    
    const similarArtists = await fetchLastFmSimilarArtists(selectedArtists, 60, {
      signal: options.signal,
      requestTimeoutMs,
    }); // Get more to account for filtering
    
    if (progressCallback) progressCallback(20);
    
    if (similarArtists.length === 0) {
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
    const similarArtistLookupLimit = Math.max(
      1,
      Math.min(options.similarArtistLookupLimit || DEFAULT_SIMILAR_ARTIST_LOOKUP_LIMIT, 50)
    );
    const limitedArtists = uniqueArtists.slice(0, similarArtistLookupLimit);
    
    if (progressCallback) progressCallback(25);
    
    // Step 3: Fetch images from Apple Music (25% -> 95%)
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
        genres: artist.genres || [],
        isFallbackImage: true,
      }));
    }

    const artistsByName = new Map(finalArtists.map(artist => [artist.name.toLowerCase(), artist]));
    const namesNeedingFallback = limitedArtists
      .map(artist => artist.name)
      .filter((name) => {
        const existing = artistsByName.get(name.toLowerCase());
        return !existing || existing.isFallbackImage;
      });

    // If Apple Music auth failed or any artists still use placeholders, fill from Spotify
    if (authFailed || namesNeedingFallback.length > 0) {
      const spotifyFallback = await fetchSpotifyImages(namesNeedingFallback, {
        signal: options.signal,
        requestTimeoutMs,
      });

      const byName = new Map(finalArtists.map(a => [a.name.toLowerCase(), a]));
      spotifyFallback.forEach(artist => {
        const key = artist.name.toLowerCase();
        if (!byName.has(key) || byName.get(key).isFallbackImage) {
          byName.set(key, artist);
        }
      });
      finalArtists = Array.from(byName.values());
    }

    if (progressCallback) progressCallback(100);

    // Cache the results
    saveToCache(cacheKey, finalArtists);
    
    return finalArtists;
    
    } catch {
      if (progressCallback) progressCallback(100);
      return [];
    }
  })();

  inFlightEnhancedRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightEnhancedRequests.delete(cacheKey);
  }
};

// Fetch random genre artists from Apple Music (for negative similarity)
export const fetchRandomGenreArtists = async (count = 50, progressCallback = null, options = {}) => {
  try {
    if (progressCallback) progressCallback(20);

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

    return filteredArtists;
    
  } catch (error) {
    if (error?.name === 'AbortError') {
      return [];
    }
    if (progressCallback) progressCallback(100);
    
    // Fallback to mock data
    return Array.from({ length: count }, (_, i) => ({
      id: `random-${i}`,
      name: `Random Artist ${i + 1}`,
      image: DEFAULT_PLACEHOLDER_IMG,
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
  } catch {}
};
