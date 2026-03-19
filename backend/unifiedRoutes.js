require('dotenv').config({ path: './.env' });
console.log(
  'Apple token loaded:',
  Boolean(process.env.APPLE_DEVELOPER_TOKEN)
);

const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const express = require('express');
const cors = require('cors');


const unifiedRouter = express.Router();
const SHARED_CACHED_MEDIA_DIR = path.resolve(__dirname, 'cached_media');
const THREADS_SRC_BACKEND_DIR = path.resolve(__dirname, '..', 'apps', 'threads', 'src', 'backend');
const MEDIA_DOWNLOAD_TIMEOUT_MS = 10_000;
const CONTENT_TYPE_EXTENSIONS = {
  'audio/mp4': '.m4a',
  'audio/mpeg': '.mp3',
  'audio/x-m4a': '.m4a',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
};

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const sanitizeCacheKeySegment = (value, fallback = 'media') => {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return cleaned || fallback;
};

const inferCachedFileExtension = (sourceUrl, contentType, fallbackExtension) => {
  try {
    const parsedUrl = new URL(sourceUrl);
    const urlExtension = path.extname(parsedUrl.pathname).toLowerCase();
    if (urlExtension) {
      return urlExtension;
    }
  } catch (error) {
    // Ignore malformed URLs and fall back to response metadata.
  }

  const normalizedContentType = String(contentType || '').split(';')[0].trim().toLowerCase();
  return CONTENT_TYPE_EXTENSIONS[normalizedContentType] || fallbackExtension;
};

const downloadRemoteAsset = async (sourceUrl) => {
  const response = await axios.get(sourceUrl, {
    responseType: 'arraybuffer',
    timeout: MEDIA_DOWNLOAD_TIMEOUT_MS,
  });

  return {
    buffer: Buffer.from(response.data),
    contentType: response.headers['content-type'] || '',
  };
};

ensureDirectory(SHARED_CACHED_MEDIA_DIR);
unifiedRouter.use('/cached_media', express.static(SHARED_CACHED_MEDIA_DIR));

const readJsonFile = (filePath, fallbackValue = {}) => {
  try {
    if (!fs.existsSync(filePath)) {
      return fallbackValue;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`Failed to read JSON file at ${filePath}:`, error.message);
    return fallbackValue;
  }
};

const fetchWithRetry = async (url, options = {}, maxAttempts = 3) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await axios.get(url, {
        timeout: 7000,
        headers: { 'User-Agent': 'MuflThreads/1.0 (+https://mufl.app)' },
        ...options,
      });
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }

  throw lastError || new Error(`Request failed for ${url}`);
};

//======================//
// Mock Data for Development/Demo
//======================//

// FIXED: Replace the mockArtists array in unifiedRoutes.js with this version
// Remove all Spotify URLs and use null/empty strings to force SVG fallbacks

const mockArtists = [
  { id: 'mock-1', name: 'Taylor Swift', image: null, genres: ['pop', 'country'], popularity: 100 },
  { id: 'mock-2', name: 'Drake', image: null, genres: ['hip-hop', 'rap'], popularity: 99 },
  { id: 'mock-3', name: 'Billie Eilish', image: null, genres: ['pop', 'alternative'], popularity: 98 },
  { id: 'mock-4', name: 'The Weeknd', image: null, genres: ['pop', 'r&b'], popularity: 97 },
  { id: 'mock-5', name: 'Bad Bunny', image: null, genres: ['latin', 'reggaeton'], popularity: 96 },
  { id: 'mock-6', name: 'Dua Lipa', image: null, genres: ['pop', 'dance'], popularity: 95 },
  { id: 'mock-7', name: 'Post Malone', image: null, genres: ['pop', 'hip-hop'], popularity: 94 },
  { id: 'mock-8', name: 'Ariana Grande', image: null, genres: ['pop', 'r&b'], popularity: 93 },
  { id: 'mock-9', name: 'Travis Scott', image: null, genres: ['hip-hop', 'rap'], popularity: 92 },
  { id: 'mock-10', name: 'BTS', image: null, genres: ['k-pop', 'pop'], popularity: 91 },
  { id: 'mock-11', name: 'Lil Nas X', image: null, genres: ['hip-hop', 'pop'], popularity: 90 },
  { id: 'mock-12', name: 'Olivia Rodrigo', image: null, genres: ['pop', 'alternative'], popularity: 89 },
  { id: 'mock-13', name: 'Doja Cat', image: null, genres: ['pop', 'hip-hop'], popularity: 88 },
  { id: 'mock-14', name: 'Harry Styles', image: null, genres: ['pop', 'rock'], popularity: 87 },
  { id: 'mock-15', name: 'Justin Bieber', image: null, genres: ['pop', 'r&b'], popularity: 86 },
  { id: 'mock-16', name: 'Ed Sheeran', image: null, genres: ['pop', 'folk'], popularity: 85 },
  { id: 'mock-17', name: 'Imagine Dragons', image: null, genres: ['rock', 'alternative'], popularity: 84 },
  { id: 'mock-18', name: 'Coldplay', image: null, genres: ['rock', 'alternative'], popularity: 83 },
  { id: 'mock-19', name: 'Kendrick Lamar', image: null, genres: ['hip-hop', 'rap'], popularity: 82 },
  { id: 'mock-20', name: 'The Chainsmokers', image: null, genres: ['electronic', 'pop'], popularity: 81 }
];

/* ---------- Apple Music playlist-artist helper (auto-resolves IDs) -- */
const PLAYLIST_NAMES = ["Top 100: USA", "Today's Hits"];
const playlistArtistCache = { data: [], ts: 0 };          // 1-hour cache

const fetchPlaylistId = async (name, token) => {
  const { data } = await axios.get(
    'https://api.music.apple.com/v1/catalog/us/search',
    {
      headers: { Authorization: `Bearer ${token}` },
      params : { term: name, types: 'playlists', limit: 1 }
    }
  );
  return data.results.playlists?.data?.[0]?.id || null;
};

const fetchPlaylistArtists = async () => {
  /* serve 1-hour cache if warm */
  if (playlistArtistCache.data.length &&
      Date.now() - playlistArtistCache.ts < 3_600_000) {
    return playlistArtistCache.data;
  }

  const token = process.env.APPLE_DEVELOPER_TOKEN;
  const uniq  = new Map();                       // name → artist object

  /* helper to sanitize search strings */
  const clean = (s) => s.replace(/[:’'"]/g, '');

  /* ① loop over editorial playlist names */
  for (const name of PLAYLIST_NAMES) {
    const id =
      (await fetchPlaylistId(name, token))      // try exact
      || (await fetchPlaylistId(clean(name), token)); // try sanitized

    if (!id) {
      console.warn(`Playlist "${name}" not found in Apple catalog.`);
      continue;
    }

    try {
      const url =
        `https://api.music.apple.com/v1/catalog/us/playlists/${id}?include=tracks`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout : 7_000
      });

      const tracks = data.data?.[0]?.relationships?.tracks?.data || [];
      if (tracks.length === 0) {
        console.warn(`Playlist "${name}" (${id}) has 0 tracks – skipping`);
        continue;
      }

      tracks.forEach((t, idx) => {
        const a        = t.attributes;
        const imageUrl = a.artwork?.url?.replace('{w}x{h}', '300x300');
        if (!imageUrl) return;                                      // ← no image, skip
      
        const key = a.artistName?.trim().toLowerCase();             // ← tightened key
        if (!key || uniq.has(key)) return;                          // de-dupe on name
      
        uniq.set(key, {
          id   : `pl-${t.id}`,
          name : a.artistName,
          image: imageUrl,
          popularity: idx + 1
        });
      });
    } catch (e) {
      console.warn(`Playlist fetch failed (${id}):`, e.response?.status || e.message);
    }
  }

  /* ② guaranteed fallback – Top-Songs chart */
  if (uniq.size === 0) {
    try {
      const chartUrl =
        'https://api.music.apple.com/v1/catalog/us/charts' +
        '?types=songs&chart=most-played&limit=100';
      const { data } = await axios.get(chartUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      (data.results.songs?.[0]?.data || []).forEach((song, idx) => {
        const a        = song.attributes;
        const imageUrl = a.artwork?.url?.replace('{w}x{h}', '300x300');
        if (!imageUrl) return;
      
        const key = a.artistName?.trim().toLowerCase();
        if (!key || seen.has(key)) return;
      
        seen.set(key, {
          id   : `ch-${song.id}`,
          name : a.artistName,
          image: imageUrl,
          genres: a.genreNames || [],
          popularity: idx + 1
        });
      });
      console.info('Used Top-Songs chart fallback – got', uniq.size, 'artists');
    } catch (e) {
      console.error('Chart fallback failed:', e.message);
    }
  }

  /* ③ absolute last resort – mock list */
  if (uniq.size === 0) {
    console.warn('Falling back to mock artist list');
    getRandomMockArtists(120).forEach((a) =>
      uniq.set(a.name.toLowerCase(), a)
    );
  }

  playlistArtistCache.data = Array.from(uniq.values());
  playlistArtistCache.ts   = Date.now();
  return playlistArtistCache.data;
};



const getRandomMockArtists = (count = 20, genre = null) => {
  let filteredArtists = mockArtists;
  
  if (genre && genre !== 'all') {
    filteredArtists = mockArtists.filter(artist => 
      artist.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
    );
  }
  
  // Shuffle and return requested count
  const shuffled = [...filteredArtists].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

const searchMockArtists = (query, limit = 20) => {
  const normalizedQuery = query.toLowerCase();
  return mockArtists
    .filter(artist => artist.name.toLowerCase().includes(normalizedQuery))
    .slice(0, limit);
};

//======================//
// Spotify Service Functions
//======================//

let spotifyToken = null;
let tokenExpiration = null;

const getAccessToken = async () => {
  if (spotifyToken && tokenExpiration && Date.now() < tokenExpiration) {
    return spotifyToken;
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Missing Spotify credentials');
    }

    const response = await axios.post('https://accounts.spotify.com/api/token', 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        }
      }
    );

    spotifyToken = response.data.access_token;
    tokenExpiration = Date.now() + (response.data.expires_in * 1000);
    return spotifyToken;
  } catch (error) {
    throw error;
  }
};
/* ---------- getPopArtists (overwrite the whole function) ------------- */
/* ---------- Apple Music popular artists (charts) ------------------- */
/* ---------- Apple Music popular artists (Top-Songs chart) ---------- */
/* ---------- Apple Music popular artists (Charts API) ------------- */
/* backend/unifiedRoutes.js  – overwrite getPopularAppleArtists */
const appleArtistCache = { data: null, ts: 0 };        // 1-hour cache

const getPopularAppleArtists = async (limit = 20) => {
  if (appleArtistCache.data && Date.now() - appleArtistCache.ts < 3_600_000) {
    return appleArtistCache.data.slice(0, limit);      // serve from cache
  }

  try {
    const token = process.env.APPLE_DEVELOPER_TOKEN;
    const url   = 'https://api.music.apple.com/v1/catalog/us/charts' +
                  '?types=songs&limit=100&chart=most-played';

    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    /* make a unique-artist list from the Top-Songs chart */
    const seen = new Map();                            // name → artist obj
    (data.results.songs?.[0]?.data || []).forEach(s => {
      const a = s.attributes;
      if (!seen.has(a.artistName)) {
        seen.set(a.artistName, {
          id   : `am-${s.id}`,
          name : a.artistName,
          image: a.artwork.url.replace('{w}x{h}', '300x300'),
          genres: a.genreNames || [],
          popularity: s.chartRank ?? 100
        });
      }
    });

    const artists = Array.from(seen.values()).slice(0, limit);
    appleArtistCache.data = artists;
    appleArtistCache.ts   = Date.now();
    return artists;

  } catch (e) {
    console.warn('Apple charts failed → mock list:', e.message);
    return getRandomMockArtists(limit);
  }
};


/* ---------- playlist-driven “popular artists” endpoint ------------- */
unifiedRouter.get('/apple-music/popular-artists', async (req, res) => {
  const limit  = Number(req.query.limit)  || 20;
  const offset = Number(req.query.offset) || 0;

  try {
    const all    = await fetchPlaylistArtists();        // deduped once
    const slice  = all.slice(offset, offset + limit);
    const hasMore = offset + slice.length < all.length;

    res.json({ artists: slice, hasMore });
  } catch (err) {
    console.error('Playlist artists error:', err.message);
    res.status(500).json({ error: 'Failed to load playlist artists' });
  }
});
/* ================================================
 * Apple-Music helpers – fetch artwork by artist list
 * ================================================ */
const fetchAppleImagesFor = async (artistNames = []) => {
  const token = process.env.APPLE_DEVELOPER_TOKEN;
  if (!token) throw new Error('APPLE_DEVELOPER_TOKEN not set');

  /* Search each name in parallel, but cap at 10 at a time
     to stay well under Apple’s public rate limits.          */
  const BATCH  = 10;
  const chunks = Array.from({ length: Math.ceil(artistNames.length / BATCH) },
                            (_, i) => artistNames.slice(i * BATCH, (i + 1) * BATCH));

  const results = [];
  for (const names of chunks) {
    const queries = names.map((name) =>
      axios.get('https://api.music.apple.com/v1/catalog/us/search', {
        headers: { Authorization: `Bearer ${token}` },
        params : { term: name, types: 'artists', limit: 1 }
      }).then(({ data }) => {
        const hit = data.results.artists?.data?.[0];
        const art = hit?.attributes?.artwork?.url;
        if (!hit || !art) return null;

        return {
          id   : hit.id,
          name : hit.attributes.name,
          image: art.replace('{w}x{h}', '300x300')
        };
      }).catch(() => null)  // swallow individual misses
    );

    const batch = await Promise.all(queries);
    results.push(...batch.filter(Boolean));
  }
  return results;
};

const TRACK_KEY_SEPARATOR = '|||';

const normalizeLookupValue = (value = '') =>
  String(value || '').trim().toLowerCase();

const normalizeTrackLookupValue = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const createTrackLookupKey = (songName = '', artistName = '') =>
  `${String(songName || '').trim()}${TRACK_KEY_SEPARATOR}${String(artistName || '').trim()}`;

const createNormalizedTrackLookupKey = (songName = '', artistName = '') =>
  `${normalizeTrackLookupValue(songName)}${TRACK_KEY_SEPARATOR}${normalizeTrackLookupValue(artistName)}`;

const buildPlaceholderArtworkUrl = (...parts) => {
  const label = parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' - ');

  return `https://via.placeholder.com/300x300/1a1a1a/ffffff?text=${encodeURIComponent(label || 'Artwork')}`;
};

const ALBUM_ARTWORK_CACHE_PATHS = [
  path.resolve(__dirname, 'cached_album_artworks.json'),
  path.resolve(THREADS_SRC_BACKEND_DIR, 'cached_album_artworks.json'),
];

let albumArtworkDiskCache = null;

const loadAlbumArtworkDiskCache = () => {
  if (albumArtworkDiskCache) {
    return albumArtworkDiskCache;
  }

  for (const cachePath of ALBUM_ARTWORK_CACHE_PATHS) {
    const cacheData = readJsonFile(cachePath, null);
    if (cacheData && typeof cacheData === 'object' && !Array.isArray(cacheData)) {
      albumArtworkDiskCache = cacheData;
      return albumArtworkDiskCache;
    }
  }

  albumArtworkDiskCache = {};
  return albumArtworkDiskCache;
};

const getAlbumArtworkFromDiskCache = (songName = '', artistName = '') => {
  const diskCache = loadAlbumArtworkDiskCache();
  return diskCache[createNormalizedTrackLookupKey(songName, artistName)] || null;
};

const buildArtistImageMap = async (artistNames = []) => {
  const requestedArtists = [...new Set(
    artistNames
      .map((name) => String(name || '').trim())
      .filter(Boolean)
  )];

  const data = Object.fromEntries(requestedArtists.map((name) => [name, null]));
  if (!requestedArtists.length) {
    return data;
  }

  try {
    if (!process.env.APPLE_DEVELOPER_TOKEN) {
      return data;
    }

    const artists = await fetchAppleImagesFor(requestedArtists);
    const resolvedByName = new Map(
      artists.map((artist) => [normalizeLookupValue(artist.name), artist.image || null])
    );

    requestedArtists.forEach((name) => {
      const normalizedName = normalizeLookupValue(name);
      if (resolvedByName.has(normalizedName)) {
        data[name] = resolvedByName.get(normalizedName);
      }
    });
  } catch (error) {
    console.warn('Compat artist-image lookup failed:', error.message);
  }

  return data;
};

const buildAlbumArtworkMap = async (tracks = []) => {
  const normalizedTracks = tracks
    .map((track) => ({
      songName: String(track?.songName || '').trim(),
      artistName: String(track?.artistName || '').trim(),
    }))
    .filter((track) => track.songName && track.artistName);

  const data = {};
  normalizedTracks.forEach((track) => {
    const key = createTrackLookupKey(track.songName, track.artistName);
    const cachedEntry = getAlbumArtworkFromDiskCache(track.songName, track.artistName);

    data[key] = {
      songName: track.songName,
      artistName: track.artistName,
      artworkUrl: cachedEntry?.artworkUrl || null,
      albumName: cachedEntry?.albumName || '',
      previewUrl: cachedEntry?.previewUrl || null,
      source: cachedEntry?.source || (cachedEntry?.artworkUrl ? 'disk-cache' : 'compat-fallback'),
    };
  });

  return data;
};

/* ------------------------------------------------
 *  POST /api/apple-music/artist-images
 *  Body: { artistNames: [ 'Drake', 'Billie Eilish', … ] }
 *  ------------------------------------------------ */
unifiedRouter.post('/apple-music/artist-images', async (req, res) => {
  const { artistNames } = req.body || {};
  if (!Array.isArray(artistNames) || artistNames.length === 0) {
    return res.status(400).json({ error: 'artistNames[] required' });
  }

  try {
    const artists = await fetchAppleImagesFor(artistNames);
    res.json({ artists });                    // ← front-end expects { artists: [...] }
  } catch (err) {
    console.error('Apple-images error:', err.message);
    res.status(502).json({ error: 'Apple Music API unavailable' });
  }
});

/* ------------------------------------------------
 *  Threads frontend compatibility routes
 *  Body: { artists: string[] } and { tracks: [{ songName, artistName }] }
 *  ------------------------------------------------ */
unifiedRouter.post('/apple-music-artist-images', async (req, res) => {
  const incomingArtists = Array.isArray(req.body?.artists) ? req.body.artists : [];
  const cleanedArtists = [...new Set(
    incomingArtists
      .map((name) => String(name || '').trim())
      .filter(Boolean)
  )].slice(0, 80);

  if (!cleanedArtists.length) {
    return res.status(400).json({
      success: false,
      error: 'Missing artists array in request body.',
    });
  }

  const data = await buildArtistImageMap(cleanedArtists);
  return res.json({
    success: true,
    data,
    meta: {
      requested: cleanedArtists.length,
      resolved: Object.values(data).filter(Boolean).length,
      source: 'unified-backend-compat',
    },
  });
});

unifiedRouter.post('/apple-music-album-artworks', async (req, res) => {
  const incomingTracks = Array.isArray(req.body?.tracks) ? req.body.tracks : [];
  const cleanedTracks = incomingTracks
    .map((track) => ({
      songName: String(track?.songName || '').trim(),
      artistName: String(track?.artistName || '').trim(),
    }))
    .filter((track) => track.songName && track.artistName)
    .slice(0, 120);

  if (!cleanedTracks.length) {
    return res.status(400).json({
      success: false,
      error: 'Missing tracks array in request body.',
    });
  }

  const data = await buildAlbumArtworkMap(cleanedTracks);
  return res.json({
    success: true,
    data,
    meta: {
      requested: cleanedTracks.length,
      resolved: Object.values(data).filter((entry) => entry?.artworkUrl).length,
      source: 'unified-backend-compat',
    },
  });
});

unifiedRouter.post('/cache-media', async (req, res) => {
  try {
    const { artworkUrl, previewUrl, songId } = req.body || {};

    if (!songId) {
      return res.status(400).json({ success: false, error: 'Missing songId' });
    }

    ensureDirectory(SHARED_CACHED_MEDIA_DIR);

    const safeSongId = sanitizeCacheKeySegment(songId, 'song');
    const results = {
      artworkPath: artworkUrl || null,
      previewPath: previewUrl || null,
    };

    if (artworkUrl) {
      try {
        const { buffer, contentType } = await downloadRemoteAsset(artworkUrl);
        const extension = inferCachedFileExtension(artworkUrl, contentType, '.jpg');
        const filename = `${safeSongId}_artwork${extension}`;
        fs.writeFileSync(path.join(SHARED_CACHED_MEDIA_DIR, filename), buffer);
        results.artworkPath = `/cached_media/${filename}`;
      } catch (error) {
        console.warn(`Failed to cache artwork for ${safeSongId}:`, error.message);
      }
    }

    if (previewUrl) {
      try {
        const { buffer, contentType } = await downloadRemoteAsset(previewUrl);
        const extension = inferCachedFileExtension(previewUrl, contentType, '.m4a');
        const filename = `${safeSongId}_preview${extension}`;
        fs.writeFileSync(path.join(SHARED_CACHED_MEDIA_DIR, filename), buffer);
        results.previewPath = `/cached_media/${filename}`;
      } catch (error) {
        console.warn(`Failed to cache preview for ${safeSongId}:`, error.message);
      }
    }

    return res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Error caching media assets:', error);
    return res.status(500).json({ success: false, error: 'Failed to cache media assets' });
  }
});


const fetchImagesFor = async (artistNames) => {
  try {
    const token = await getAccessToken();
    const artists = [];
    
    for (const name of artistNames) {
      try {
        const response = await axios.get('https://api.spotify.com/v1/search', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            q: `artist:${name}`,
            type: 'artist',
            limit: 1
          }
        });

        const artist = response.data.artists?.items[0];
        if (artist) {
          // Find the best quality image
          let imageUrl = null;
          if (artist.images && artist.images.length > 0) {
            const preferredImage = artist.images.find(img => img.height === 640 && img.width === 640);
            imageUrl = preferredImage ? preferredImage.url : artist.images[0].url;
          }
          
          if (imageUrl) {
            artists.push({
              id: artist.id,
              name: artist.name,
              image: imageUrl,
              genres: artist.genres || [],
            });
          }
        }
      } catch (artistError) {
      }
    }
    
    return artists;
  } catch (error) {
    throw error;
  }
};

//======================//
// Last.fm Service Functions
//======================//

const fetchSimilarArtists = async (selectedArtists) => {
  try {
    const apiKey = process.env.LASTFM_API_KEY || process.env.REACT_APP_LASTFM_API_KEY;
    if (!apiKey) {
      throw new Error('Missing Last.fm API key');
    }

    const allSimilar = [];
    
    for (const artistName of selectedArtists) {
      try {
        const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
          params: {
            method: 'artist.getsimilar',
            artist: artistName,
            api_key: apiKey,
            format: 'json',
            limit: 20
          }
        });

        const similar = response.data?.similarartists?.artist || [];
        allSimilar.push(...similar.map(artist => ({ name: artist.name })));
      } catch (artistError) {
      }
    }

    // Remove duplicates
    const uniqueArtists = [];
    const seen = new Set();
    
    for (const artist of allSimilar) {
      if (!seen.has(artist.name.toLowerCase())) {
        seen.add(artist.name.toLowerCase());
        uniqueArtists.push(artist);
      }
    }

    return uniqueArtists;
  } catch (error) {
    throw error;
  }
};

//======================//
// Apple Music Service Functions
//======================//

const searchAppleMusic = async (query) => {
  try {
    const APPLE_API_BASE_URL = process.env.APPLE_API_BASE_URL || process.env.REACT_APP_APPLE_API_BASE_URL;
    const APPLE_DEVELOPER_TOKEN = process.env.APPLE_DEVELOPER_TOKEN || process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;

    if (!APPLE_API_BASE_URL || !APPLE_DEVELOPER_TOKEN) {
      throw new Error('Missing Apple Music API credentials');
    }

    const encodedQuery = encodeURIComponent(query);
    const url = `${APPLE_API_BASE_URL}/search?term=${encodedQuery}&types=artists&limit=10`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}`,
      },
      timeout: 5000
    });

    const artists = response.data?.results?.artists?.data || [];
    
    return artists.map(artist => ({
      id: artist.id || `unknown-${Date.now()}`,
      name: artist.attributes?.name || 'Unknown Artist',
      image: artist.attributes?.artwork?.url?.replace('{w}x{h}', '300x300') || 'fallback.jpg',
      genres: (artist.attributes?.genreNames || []).slice(0, 3),
    }));
  } catch (error) {
    throw error;
  }
};

//======================//
// ROUTES
//======================//

// Spotify Routes
// 🚩 UPDATE the route so the front-end can set the floor & list size
unifiedRouter.get('/spotify/artists', async (req, res) => {
  const {
    genre          = 'pop',
    minPopularity  = 70,
    limit          = 40
  } = req.query;

  try {
    const artists = await getPopArtists(
      genre,
      Number(minPopularity),
      Number(limit)
    );
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});


unifiedRouter.get('/spotify/search-artists', async (req, res) => {
  const { query } = req.query;

  const key = query.toLowerCase();
if (searchCache.has(key) && Date.now() - searchCache.get(key).ts < CACHE_TTL) {
  return res.json(searchCache.get(key).data);
}

searchCache.set(key, { ts: Date.now(), data: results });

  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: query,
        type: 'artist',
        limit: 20,
      },
    });

    const artists = response.data.artists?.items.map((artist) => {
      // Find the best quality image (prefer 640x640, fallback to largest available)
      let imageUrl = null;
      if (artist.images && artist.images.length > 0) {
        // Try to find 640x640 image first
        const preferredImage = artist.images.find(img => img.height === 640 && img.width === 640);
        if (preferredImage) {
          imageUrl = preferredImage.url;
        } else {
          // Use the first (largest) image available
          imageUrl = artist.images[0].url;
        }
      }
      
      return {
        id: artist.id,
        name: artist.name,
        image: imageUrl,
        genres: artist.genres || [],
        popularity: artist.popularity,
      };
    }).filter(artist => artist.image) || []; // Only return artists with images

    res.json(artists);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to search for artists',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

unifiedRouter.post('/spotify/fetch-images', async (req, res) => {
  const { artistNames } = req.body;

  if (!artistNames || artistNames.length === 0) {
    return res.status(400).json({ error: 'No artist names provided' });
  }

  try {
    const artistsWithImages = await fetchImagesFor(artistNames);
    res.json({ artists: artistsWithImages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artist images' });
  }
});

unifiedRouter.post('/spotify/artists-data', async (req, res) => {
  const { artistNames } = req.body;

  if (!artistNames || artistNames.length === 0) {
    return res.status(400).json({ error: 'No artist names provided' });
  }

  try {
    const artistsWithImages = await fetchImagesFor(artistNames);
    res.json({ artists: artistsWithImages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artist data' });
  }
});

// Last.fm Routes
unifiedRouter.post('/lastfm/similar-artists', async (req, res) => {
  const { selectedArtists } = req.body;

  if (!selectedArtists || selectedArtists.length === 0) {
    return res.status(400).json({ error: 'No selected artists provided' });
  }

  try {
    const similarArtists = await fetchSimilarArtists(selectedArtists);
    res.json({ similarArtists });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch similar artists' });
  }
});

// Apple Music Routes
// Apple Music Routes
/* ---------------- Apple Music search artists ---------------- */
const searchCache = new Map();            // key → { ts, data }
const CACHE_TTL   = 900_000;              // 15 min

unifiedRouter.get('/apple-music/search-artists', async (req, res) => {
  const { query = '' } = req.query;
  if (!query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const key = query.toLowerCase();
  if (searchCache.has(key) && Date.now() - searchCache.get(key).ts < CACHE_TTL) {
    return res.json(searchCache.get(key).data);        // ← serve from cache
  }

  try {
    const token = process.env.APPLE_DEVELOPER_TOKEN;
    const { data } = await axios.get(
      'https://api.music.apple.com/v1/catalog/us/search',
      {
        headers: { Authorization: `Bearer ${token}` },
        params : { term: query, types: 'artists', limit: 20 }
      }
    );

        const results = (data.results.artists?.data || [])
      .flatMap(a => {
        const attr = a.attributes || {};
        const art  = attr.artwork?.url;
        /* skip entries that have no artwork or no name */
        if (!attr.name || !art) return [];
        return [{
          id   : a.id,
          name : attr.name,
          image: art.replace('{w}x{h}', '300x300')
        }];
      });
    searchCache.set(key, { ts: Date.now(), data: results });   // ← save
    return res.json(results);
  } catch (err) {
    const status = err.response?.status || 500;

    if (status === 400 || status === 404) {
      console.warn('Apple search miss:', query, '→', status);
      return res.json([]);                 // empty array = harmless
    }
  
    console.error('Apple search failed:', status, err.message);
    return res.status(500).json({ error: 'Apple search failed' });  }
});

  

unifiedRouter.get('/apple-music/random-genre-artists', async (req, res) => {
  const { count = 50 } = req.query;
  
  try {
    // For negative similarity, we want truly diverse artists from different genres
    // Use a wide variety of genres that are different from typical pop/rock/hip-hop
    const diverseGenres = [
      'jazz', 'classical', 'country', 'reggae', 'folk', 'blues', 
      'world', 'latin', 'electronic', 'ambient', 'metal', 'punk',
      'funk', 'r&b', 'alternative', 'indie', 'experimental'
    ];
    
    const allArtists = [];
    const targetCount = parseInt(count);
    const artistsPerGenre = Math.max(3, Math.ceil(targetCount / diverseGenres.length));
    
    // Fetch artists from multiple diverse genres to ensure variety
    for (const genre of diverseGenres) {
      try {
        const genreArtists = await getPopArtists(genre);
        if (genreArtists && genreArtists.length > 0) {
          // Take a few artists from each genre and shuffle them
          const shuffledGenreArtists = genreArtists.sort(() => 0.5 - Math.random());
          allArtists.push(...shuffledGenreArtists.slice(0, artistsPerGenre));
        }
      } catch (genreError) {
        // Continue with other genres if one fails
      }
      
      // Stop if we have enough artists
      if (allArtists.length >= targetCount) {
        break;
      }
    }
    
    // Final shuffle and limit to requested count
    const finalArtists = allArtists
      .sort(() => 0.5 - Math.random())
      .slice(0, targetCount);
    
    // Fallback to mock data if we don't have enough real artists
    if (finalArtists.length < targetCount) {
      const fallbackArtists = getRandomMockArtists(targetCount - finalArtists.length);
      finalArtists.push(...fallbackArtists);
    }
    
    res.json({ artists: finalArtists });
  } catch (error) {
    console.error('Random genre artists error:', error);
    // Fallback to mock data
    const fallbackArtists = getRandomMockArtists(parseInt(count));
    res.json({ artists: fallbackArtists });
  }
});

unifiedRouter.post('/apple-music/artist-songs', async (req, res) => {
  const { artist } = req.body;
  if (!artist) return res.status(400).json({ error: 'Artist name is required' });

  try {
    const token = process.env.APPLE_DEVELOPER_TOKEN;
    const url   = `https://api.music.apple.com/v1/catalog/us/search` +
                  `?term=${encodeURIComponent(artist)}` +
                  `&types=songs&limit=10`;

    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const pick = data.results?.songs?.data.find(
      s => Array.isArray(s.attributes?.previews) &&
           s.attributes.previews[0]?.url
    );

    if (!pick) {
      return res.json({ success: false, error: 'No song with preview found' });
    }

    const attr = pick.attributes;
    res.json({
      success: true,
      data: {
        id: pick.id,
        trackName: attr.name,
        artistName: attr.artistName,
        albumName: attr.albumName,
        artworkUrl: attr.artwork.url.replace('{w}x{h}', '300x300'),
        previewUrl: attr.previews[0].url
      }
    });
  } catch (err) {
    console.error('Artist-song lookup failed:', err.message);

    /* ➜ soft-fail so the front-end can pick another artist */
    return res.json({ success: false, error: 'No preview returned' });
  }
});



// General Apple Music search
unifiedRouter.post('/apple-music/search', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });
  try {
    const token = process.env.APPLE_DEVELOPER_TOKEN;
    const url = `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(query)}&types=songs&limit=10`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const results = data.results.songs.data.map(song => ({
      id: song.id,
      trackName: song.attributes.name,
      artistName: song.attributes.artistName,
      albumName: song.attributes.albumName,
      artworkUrl: song.attributes.artwork.url.replace('{w}x{h}', '100x100'),
      previewUrl: song.attributes.previews[0]?.url || null
    }));
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Apple Music search failed', details: err.message });
  }
});

// Apple Music artist search endpoint
unifiedRouter.post('/apple-music/artist-search', async (req, res) => {
  const { query, artistName } = req.body;
  
  if (!query || !artistName) {
    return res.status(400).json({ error: 'Query and artist name are required' });
  }
  
  try {
    // Mock artist-specific search results
    const mockResults = [
      {
        id: `artist_search_${Date.now()}_1`,
        name: `${query} by ${artistName}`,
        artistName: artistName,
        albumName: `${artistName} Collection`,
        artworkUrl: `https://via.placeholder.com/300x300/1a1a1a/ffffff?text=${encodeURIComponent(artistName)}`,
        previewUrl: null,
        duration: Math.floor(Math.random() * 180000) + 120000
      }
    ];
    
    res.json({ results: mockResults });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to search artist on Apple Music',
      message: error.message 
    });
  }
});


// Then replace your existing /reddit/posts route with this updated version:
unifiedRouter.get('/reddit/posts', async (req, res) => {
  const sub   = (req.query.sub || 'music').toLowerCase();   
  const limit = Math.min(req.query.limit || 25, 100);  // Cap at 100 (Reddit's max)
  const t     = req.query.t;                                

  const redditUrl = t
    ? `https://www.reddit.com/r/${sub}/top.json?t=${t}&limit=${limit}`
    : `https://www.reddit.com/r/${sub}/hot.json?limit=${limit}`;

  try {
    console.log(`Fetching Reddit posts from: ${redditUrl}`);
        const { data } = await axios.get(                      // add header + timeout
            redditUrl,
            {
              timeout : 7000,
              headers : { 'User-Agent': 'MuflThreads/1.0 (+https://mufl.app)' }
            }
          );    
    const posts = data.data.children.map(({ data: p }) => {
      /* ── image detection ─────────────────────────────────────── */
      let imageUrl = null;

      // direct link (jpg/png/gif/webp)
      if (/\.(jpe?g|png|gif|webp)$/i.test(p.url_overridden_by_dest || '')) {
        imageUrl = p.url_overridden_by_dest;
      }
      // preview image
      else if (p.preview?.images?.[0]?.source?.url) {
        imageUrl = p.preview.images[0].source.url.replace(/&amp;/g, '&');
      }
      // Reddit thumbnail (falls back to 140×140)
      else if (p.thumbnail && p.thumbnail.startsWith('http')) {
        imageUrl = p.thumbnail;
      }

      /* ── post-type logic ─────────────────────────────────────── */
      const trending =
        (p.num_comments ?? 0) >= 250 || (p.ups ?? 0) >= 1500;

      let postType = 'thread';
      if (sub === 'music')          postType = 'news';
      if (trending)                 postType = 'groupchat';

      return {
        id:           p.id,
        subreddit:    sub,
        author:       p.author,
        title:        p.title,
        selftext:     p.selftext,
        createdUtc:   p.created_utc,
        ups:          p.ups,
        num_comments: p.num_comments,
        postType,
        imageUrl,
        snippets: []                           
      };
    });

    console.log(`Successfully fetched ${posts.length} posts from r/${sub}`);
    res.json({ success: true, data: posts });
  } catch (err) {
    console.error('Reddit fetch failed after retries:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      url: redditUrl
    });
    
    res.status(502).json({ 
      success: false, 
      error: 'Reddit API unavailable',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});




// Additional routes for Threads app compatibility
unifiedRouter.get('/spotify-token', async (req, res) => {
  try {
    const token = await getAccessToken();
    res.json({ 
      success: true, 
      token: token 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get Spotify token' 
    });
  }
});

unifiedRouter.get('/apple-music-search', async (req, res) => {
  const { query } = req.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Valid search query is required' });
  }
  
  try {
    // Return mock song data in the format expected by PlayingScreen2.js and Widget.js
    const mockSong = {
      id: `search_${Date.now()}_${Math.random()}`,
      attributes: {
        name: `${query} - Top Result`,
        artistName: query,
        albumName: `${query} Collection`,
        artwork: {
          url: `https://via.placeholder.com/300x300/1a1a1a/ffffff?text=${encodeURIComponent(query)}`
        },
        previews: [{
          url: null // No preview available for mock data
        }]
      }
    };
    
    res.json({
      success: true,
      data: mockSong
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to search for songs', 
      message: error.message 
    });
  }
});

const THREADS_CACHE_DIR = path.resolve(__dirname, '..', 'apps', 'threads', 'src', 'cached_posts');
const DIVERSE_THREADS_SUBREDDITS = ['music', 'musicsuggestions', 'listentothis', 'hiphopheads', 'popheads'];

const loadCachedThreadPost = (postId) => {
  const fileName = fs.readdirSync(THREADS_CACHE_DIR)
    .find((file) => file.startsWith(postId) && file.endsWith('.json'));

  if (!fileName) {
    return null;
  }

  const fullPath = path.join(THREADS_CACHE_DIR, fileName);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  if (!Array.isArray(data.comments) || data.comments.length === 0) {
    const fallbackAuthor = data.author || 'RedditUser';
    data.comments = [
      {
        id: `auto_${Date.now()}`,
        author: fallbackAuthor,
        body: "No cached comments were found for this thread, so here's a placeholder.",
        createdUtc: Math.floor(Date.now() / 1000),
        ups: 1,
        replies: []
      }
    ];
  }

  const now = Date.now() / 1000;
  const oneYearAgo = now - 365 * 24 * 60 * 60;
  if (!data.createdUtc || data.createdUtc <= 0 || data.createdUtc > now) {
    data.createdUtc = oneYearAgo + Math.random() * (now - oneYearAgo);
  }

  return data;
};

const shuffleInPlace = (items = []) => {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

const summarizeCachedThreadPost = (post = {}) => ({
  id: post.id,
  title: post.title,
  author: post.author,
  subreddit: post.subreddit || 'music',
  selftext: post.selftext || '',
  imageUrl: post.imageUrl || null,
  postType: post.postType || 'thread',
  createdUtc: post.createdUtc || Math.floor(Date.now() / 1000),
  hasCachedData: true,
  num_comments: post.comments?.length || post.num_comments || 0,
  commentCount: post.comments?.length || 0,
  snippetCount: post.snippets?.length || 0,
});

const readThreadsCachedPosts = () => {
  try {
    const files = fs.existsSync(THREADS_CACHE_DIR)
      ? fs.readdirSync(THREADS_CACHE_DIR).filter((file) => file.endsWith('.json'))
      : [];

    return files
      .map((file) => {
        try {
          const filePath = path.join(THREADS_CACHE_DIR, file);
          return summarizeCachedThreadPost(
            JSON.parse(fs.readFileSync(filePath, 'utf8'))
          );
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    console.warn('Failed to read cached thread posts:', error.message);
    return [];
  }
};

const fetchRedditPostsForSubreddit = async (subreddit, limit = 8) => {
  const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
  const { data } = await axios.get(redditUrl, {
    timeout: 7000,
    headers: { 'User-Agent': 'MuflThreads/1.0 (+https://mufl.app)' }
  });

  return (data?.data?.children || []).map(({ data: p }) => {
    let imageUrl = null;
    if (/\.(jpe?g|png|gif|webp)$/i.test(p.url_overridden_by_dest || '')) {
      imageUrl = p.url_overridden_by_dest;
    } else if (p.preview?.images?.[0]?.source?.url) {
      imageUrl = p.preview.images[0].source.url.replace(/&amp;/g, '&');
    } else if (p.thumbnail && p.thumbnail.startsWith('http')) {
      imageUrl = p.thumbnail;
    }

    let postType = 'thread';
    if (subreddit === 'music') postType = 'news';
    if ((p.num_comments ?? 0) >= 250 || (p.ups ?? 0) >= 1500) postType = 'groupchat';

    return {
      id: p.id,
      subreddit,
      author: p.author,
      title: p.title,
      selftext: p.selftext || '',
      createdUtc: p.created_utc,
      ups: p.ups,
      num_comments: p.num_comments,
      postType,
      imageUrl,
      hasCachedData: false,
      snippets: [],
    };
  });
};

const buildDiverseThreadsFeed = async ({ shuffle = false } = {}) => {
  const cachedPosts = readThreadsCachedPosts().filter((post) => post.postType !== 'parameter');
  const redditResults = await Promise.allSettled(
    DIVERSE_THREADS_SUBREDDITS.map((subreddit) => fetchRedditPostsForSubreddit(subreddit, 8))
  );

  const redditPosts = redditResults
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)
    .filter((post) => post.postType !== 'parameter');

  const dedupedPosts = [];
  const seenIds = new Set();
  [...cachedPosts, ...redditPosts].forEach((post) => {
    if (!post?.id || seenIds.has(post.id)) return;
    seenIds.add(post.id);
    dedupedPosts.push(post);
  });

  const orderedPosts = shuffle
    ? shuffleInPlace([...dedupedPosts])
    : [...dedupedPosts].sort((a, b) => (b.createdUtc || 0) - (a.createdUtc || 0));

  return orderedPosts.slice(0, 40);
};

unifiedRouter.get('/diverse-posts', async (req, res) => {
  try {
    const data = await buildDiverseThreadsFeed();
    return res.json({
      success: true,
      data,
      message: 'Fetched diverse post mix',
    });
  } catch (error) {
    console.error('Error building diverse posts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to build diverse posts',
    });
  }
});

unifiedRouter.get('/refresh', async (req, res) => {
  try {
    const data = await buildDiverseThreadsFeed({ shuffle: true });
    return res.json({
      success: true,
      data,
      message: 'Successfully refreshed with new diverse posts',
    });
  } catch (error) {
    console.error('Error refreshing diverse posts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh posts',
    });
  }
});

unifiedRouter.get('/cached-posts/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const data = loadCachedThreadPost(postId);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});



unifiedRouter.get('/posts/:postId/snippets', async (req, res) => {
  const { postId } = req.params;

  try {
    const cachedPost = loadCachedThreadPost(postId);
    const snippets = Array.isArray(cachedPost?.snippets) ? cachedPost.snippets : [];
    return res.json({
      success: true,
      data: snippets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to load snippets',
    });
  }
});

unifiedRouter.get('/posts', async (req, res) => {
  // Return mock posts list
  res.json([
    {
      id: 'post-1',
      title: 'Mock Post 1',
      content: 'Mock content 1',
      author: 'user1',
      timestamp: new Date().toISOString()
    },
    {
      id: 'post-2', 
      title: 'Mock Post 2',
      content: 'Mock content 2',
      author: 'user2',
      timestamp: new Date().toISOString()
    }
  ]);
});

// Generate diverse mock posts for threads app with snippets and albums


// NEW: loads real files from apps/threads/src/cached_posts
unifiedRouter.get('/cached-posts', (req, res) => {
  try {
    const cacheDir = path.resolve(__dirname, '..', 'apps', 'threads', 'src', 'cached_posts');
    const posts = fs.readdirSync(cacheDir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(cacheDir, f), 'utf8')));
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

unifiedRouter.get('/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  const cachedPost = loadCachedThreadPost(id);
  const sub = (
    req.query.subreddit ||
    req.headers['x-thread-subreddit'] ||
    cachedPost?.subreddit ||
    'music'
  ).toLowerCase();
  const url = `https://www.reddit.com/r/${sub}/comments/${id}.json?limit=100`;

  try {
    console.log(`Fetching Reddit comments from: ${url}`);
    const { data } = await fetchWithRetry(url);
    
    // second listing ([1]) holds the comment tree
    const children = data?.[1]?.data?.children || [];

    const flatten = (items) =>
      items.flatMap(c => {
        const d = c.data || {};
        const node = {
          id:         d.id,
          author:     d.author,
          body:       d.body || '',
          createdUtc: d.created_utc,
          ups:        d.ups,
          replies:    []
        };
        if (d.replies?.data?.children?.length) {
          node.replies = flatten(d.replies.data.children);
        }
        return node;
      });

    console.log(`Successfully fetched comments for post ${id}`);
    return res.json({ success: true, data: flatten(children) });
  } catch (err) {
    console.error('Reddit comments fetch failed:', {
      message: err.message,
      postId: id,
      subreddit: sub
    });
    
	    return res.status(502).json({ 
	      success: false, 
	      error: 'Reddit API unavailable',
	      details: process.env.NODE_ENV === 'development' ? err.message : undefined
	    });
	  }
	});





// Health check
unifiedRouter.get('/health', async (req, res) => {
  res.json({ 
    status: 'operational', 
    timestamp: new Date().toISOString(),
    services: ['spotify', 'lastfm', 'apple-music']
  });
});

//======================//
// Export Route Registration Function
//======================//
module.exports = function registerUnifiedRoutes(app) {
  // Register routes with /api prefix for mufl app
  app.use('/api', unifiedRouter);
  
  // Register routes without prefix for threads app compatibility
  app.use('/', unifiedRouter);
};
