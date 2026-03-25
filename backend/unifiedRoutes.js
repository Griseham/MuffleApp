require('dotenv').config({ path: './.env' });
console.log(
  'Apple token loaded:',
  Boolean(process.env.APPLE_DEVELOPER_TOKEN)
);

const fs   = require('fs');
const dns = require('dns').promises;
const net = require('net');
const os = require('os');
const path = require('path');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');


const unifiedRouter = express.Router();
const DEFAULT_RUNTIME_DIR = path.resolve(process.env.MUFFLE_RUNTIME_DIR || path.join(os.tmpdir(), 'muffle-runtime'));
const SHARED_CACHED_MEDIA_DIR = path.resolve(
  process.env.THREADS_MEDIA_CACHE_DIR || path.join(DEFAULT_RUNTIME_DIR, 'cached_media')
);
const THREADS_SRC_BACKEND_DIR = path.resolve(__dirname, '..', 'apps', 'threads', 'src', 'backend');
const MEDIA_DOWNLOAD_TIMEOUT_MS = 10_000;
const MEDIA_DOWNLOAD_MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_REMOTE_MEDIA_HOSTS = ['itunes.apple.com', 'mzstatic.com'];
const ALLOWED_ARTWORK_CONTENT_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const ALLOWED_PREVIEW_CONTENT_TYPES = new Set([
  'audio/aac',
  'audio/mp4',
  'audio/mpeg',
  'audio/x-m4a',
]);
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

const createRouteLimiter = (max, message) => rateLimit({
  windowMs: 15 * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: message,
  },
});

const searchLimiter = createRouteLimiter(60, 'Too many search requests. Please try again later.');
const heavyLookupLimiter = createRouteLimiter(30, 'Too many expensive requests. Please try again later.');
const mediaCacheLimiter = createRouteLimiter(20, 'Too many media cache requests. Please try again later.');

const normalizeIpAddress = (address = '') => (
  String(address || '').toLowerCase().startsWith('::ffff:')
    ? String(address).slice(7)
    : String(address || '')
);

const isPrivateIpAddress = (address = '') => {
  const normalizedAddress = normalizeIpAddress(address);
  const ipVersion = net.isIP(normalizedAddress);

  if (ipVersion === 4) {
    const octets = normalizedAddress.split('.').map((part) => Number(part));
    if (octets.length !== 4 || octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
      return true;
    }

    const [first, second] = octets;
    return (
      first === 10 ||
      first === 127 ||
      first === 0 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }

  if (ipVersion === 6) {
    return (
      normalizedAddress === '::' ||
      normalizedAddress === '::1' ||
      normalizedAddress.startsWith('fc') ||
      normalizedAddress.startsWith('fd') ||
      normalizedAddress.startsWith('fe80:')
    );
  }

  return true;
};

const isAllowedRemoteMediaHostname = (hostname = '') => {
  const normalizedHostname = String(hostname || '').trim().toLowerCase();
  if (!normalizedHostname) {
    return false;
  }

  return ALLOWED_REMOTE_MEDIA_HOSTS.some((allowedHost) => (
    normalizedHostname === allowedHost || normalizedHostname.endsWith(`.${allowedHost}`)
  ));
};

const validateRemoteMediaUrl = async (sourceUrl) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch (error) {
    throw new Error('Invalid media URL');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Only HTTPS media URLs are allowed');
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error('Media URL credentials are not allowed');
  }

  if (parsedUrl.port && parsedUrl.port !== '443') {
    throw new Error('Unexpected media URL port');
  }

  if (!isAllowedRemoteMediaHostname(parsedUrl.hostname)) {
    throw new Error('Media host is not allowed');
  }

  const resolvedAddresses = await dns.lookup(parsedUrl.hostname, { all: true, verbatim: true });
  if (!resolvedAddresses.length) {
    throw new Error('Could not resolve media host');
  }

  if (resolvedAddresses.some((entry) => isPrivateIpAddress(entry.address))) {
    throw new Error('Media host resolves to a private address');
  }

  return parsedUrl.toString();
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

const downloadRemoteAsset = async (sourceUrl, allowedContentTypes) => {
  const safeSourceUrl = await validateRemoteMediaUrl(sourceUrl);
  const response = await axios.get(safeSourceUrl, {
    responseType: 'arraybuffer',
    timeout: MEDIA_DOWNLOAD_TIMEOUT_MS,
    maxContentLength: MEDIA_DOWNLOAD_MAX_BYTES,
    maxBodyLength: MEDIA_DOWNLOAD_MAX_BYTES,
    validateStatus: (status) => status >= 200 && status < 300,
  });

  const normalizedContentType = String(response.headers['content-type'] || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  const contentLength = Number(response.headers['content-length'] || 0);

  if (!allowedContentTypes.has(normalizedContentType)) {
    throw new Error(`Unsupported media content type: ${normalizedContentType || 'unknown'}`);
  }

  if (Number.isFinite(contentLength) && contentLength > MEDIA_DOWNLOAD_MAX_BYTES) {
    throw new Error('Media file is too large to cache');
  }

  const buffer = Buffer.from(response.data);
  if (buffer.length > MEDIA_DOWNLOAD_MAX_BYTES) {
    throw new Error('Media download exceeded the size limit');
  }

  return {
    buffer,
    contentType: normalizedContentType,
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

const THREADS_DEFAULT_ARTWORK_PATH = '/assets/default-artist.png';

const sanitizeSongSearchQuery = (value = '') =>
  String(value || '')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s.'\-&()]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);

const toArtworkUrl = (url, size = 300) => {
  if (!url || typeof url !== 'string') {
    return THREADS_DEFAULT_ARTWORK_PATH;
  }

  return url
    .replace('{w}', String(size))
    .replace('{h}', String(size))
    .replace('{f}', 'jpg');
};

const mapTrackToThreadSong = (track) => {
  const artworkSource =
    track?.artworkUrl100 ||
    track?.artworkUrl60 ||
    track?.artworkUrl30 ||
    track?.attributes?.artwork?.url ||
    THREADS_DEFAULT_ARTWORK_PATH;

  const previewUrl =
    typeof track?.previewUrl === 'string'
      ? track.previewUrl
      : track?.attributes?.previews?.[0]?.url || null;

  const artworkUrl = toArtworkUrl(artworkSource, 300);

  return {
    id: String(track?.trackId || track?.id || `track_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    attributes: {
      name: track?.trackName || track?.attributes?.name || 'Unknown Song',
      artistName: track?.artistName || track?.attributes?.artistName || 'Unknown Artist',
      albumName: track?.collectionName || track?.attributes?.albumName || '',
      artwork: { url: artworkUrl },
      previews: previewUrl ? [{ url: previewUrl }] : [],
      durationInMillis: Number.isFinite(track?.trackTimeMillis)
        ? track.trackTimeMillis
        : (Number.isFinite(track?.attributes?.durationInMillis) ? track.attributes.durationInMillis : null),
      releaseDate: track?.releaseDate || track?.attributes?.releaseDate || null,
      url: track?.trackViewUrl || track?.attributes?.url || null,
    },
  };
};

const mapTrackToMuflSong = (track) => {
  const normalizedTrack = mapTrackToThreadSong(track);
  const attributes = normalizedTrack.attributes || {};

  return {
    id: normalizedTrack.id,
    track: attributes.name || 'Unknown Song',
    trackName: attributes.name || 'Unknown Song',
    artist: attributes.artistName || 'Unknown Artist',
    artistName: attributes.artistName || 'Unknown Artist',
    album: attributes.albumName || '',
    albumName: attributes.albumName || '',
    artworkUrl: attributes.artwork?.url || THREADS_DEFAULT_ARTWORK_PATH,
    previewUrl: attributes.previews?.[0]?.url || null,
    duration: attributes.durationInMillis || null,
  };
};

const dedupeMuflSongs = (songs = []) => {
  const seen = new Set();

  return songs.filter((song) => {
    const key = `${String(song?.track || '').toLowerCase()}|||${String(song?.artist || '').toLowerCase()}`;
    if (!song?.track || !song?.artist || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const searchAppleCatalogSongs = async (query, limit = 10) => {
  const sanitizedQuery = sanitizeSongSearchQuery(query);
  const token = process.env.APPLE_DEVELOPER_TOKEN;

  if (!sanitizedQuery || sanitizedQuery.length < 2 || !token) {
    return [];
  }

  const url =
    `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(sanitizedQuery)}` +
    `&types=songs&limit=${Math.max(1, Math.min(Number(limit) || 10, 25))}`;

  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 7000,
  });

  return Array.isArray(data?.results?.songs?.data) ? data.results.songs.data : [];
};

const getPreviewableSongsForArtist = async (artistName, limit = 3) => {
  const normalizedArtistName = normalizeLookupValue(artistName);
  const tracks = await searchAppleCatalogSongs(artistName, Math.max(Number(limit) * 4, 12));

  return dedupeMuflSongs(
    tracks
      .map(mapTrackToMuflSong)
      .filter((song) => song.previewUrl)
      .sort((left, right) => {
        const leftName = normalizeLookupValue(left.artist);
        const rightName = normalizeLookupValue(right.artist);
        const leftRank = leftName === normalizedArtistName ? 0 : leftName.includes(normalizedArtistName) ? 1 : 2;
        const rightRank = rightName === normalizedArtistName ? 0 : rightName.includes(normalizedArtistName) ? 1 : 2;

        return leftRank - rightRank;
      })
  ).slice(0, Math.max(1, Math.min(Number(limit) || 3, 10)));
};

const repairedSnippetMediaCache = new Map();
const repairedCachedPostCache = new Map();

const isCachedMediaUrl = (value = '') =>
  String(value || '').trim().includes('/cached_media/');

const getSnippetSongName = (snippet = {}) =>
  String(
    snippet?.songName ||
    snippet?.name ||
    snippet?.snippetData?.attributes?.name ||
    ''
  ).trim();

const getSnippetArtistName = (snippet = {}) =>
  String(
    snippet?.artistName ||
    snippet?.snippetData?.attributes?.artistName ||
    ''
  ).trim();

const getSnippetArtworkUrl = (snippet = {}) =>
  String(
    snippet?.artworkUrl ||
    snippet?.artwork ||
    snippet?.snippetData?.attributes?.artwork?.url ||
    ''
  ).trim();

const getSnippetPreviewUrl = (snippet = {}) =>
  String(
    snippet?.previewUrl ||
    snippet?.snippetData?.attributes?.previews?.[0]?.url ||
    ''
  ).trim();

const searchItunesSongs = async (query, limit = 10) => {
  const sanitizedQuery = sanitizeSongSearchQuery(query);
  if (!sanitizedQuery || sanitizedQuery.length < 2) {
    return [];
  }

  const { data } = await axios.get('https://itunes.apple.com/search', {
    params: {
      term: sanitizedQuery,
      entity: 'song',
      limit: Math.max(1, Math.min(Number(limit) || 10, 25)),
      country: 'US',
    },
    timeout: 7000,
  });

  return Array.isArray(data?.results) ? data.results : [];
};

const scoreTrackCandidate = (track, targetSongName, targetArtistName) => {
  const mappedTrack = mapTrackToMuflSong(track);
  const candidateSong = normalizeTrackLookupValue(mappedTrack?.trackName || mappedTrack?.track);
  const candidateArtist = normalizeTrackLookupValue(mappedTrack?.artistName || mappedTrack?.artist);
  const expectedSong = normalizeTrackLookupValue(targetSongName);
  const expectedArtist = normalizeTrackLookupValue(targetArtistName);

  let score = 0;

  if (expectedSong && candidateSong) {
    if (candidateSong === expectedSong) score += 120;
    else if (candidateSong.includes(expectedSong) || expectedSong.includes(candidateSong)) score += 70;
  }

  if (expectedArtist && candidateArtist) {
    if (candidateArtist === expectedArtist) score += 100;
    else if (candidateArtist.includes(expectedArtist) || expectedArtist.includes(candidateArtist)) score += 60;
  }

  if (mappedTrack?.previewUrl) score += 20;
  if (mappedTrack?.artworkUrl) score += 10;

  return score;
};

const findBestTrackMatch = (tracks, songName, artistName) => {
  let bestTrack = null;
  let bestScore = -1;

  for (const track of tracks || []) {
    const score = scoreTrackCandidate(track, songName, artistName);
    if (score > bestScore) {
      bestScore = score;
      bestTrack = track;
    }
  }

  return bestTrack ? mapTrackToMuflSong(bestTrack) : null;
};

const resolveSnippetMedia = async (snippet = {}) => {
  const songName = getSnippetSongName(snippet);
  const artistName = getSnippetArtistName(snippet);
  const query = String(snippet?.query || '').trim();

  if (!songName || !artistName) {
    return {
      artworkUrl: getSnippetArtworkUrl(snippet) || null,
      previewUrl: getSnippetPreviewUrl(snippet) || null,
      albumName: snippet?.albumName || snippet?.snippetData?.attributes?.albumName || '',
      songName,
      artistName,
    };
  }

  const cacheKey = createNormalizedTrackLookupKey(songName, artistName);
  if (repairedSnippetMediaCache.has(cacheKey)) {
    return repairedSnippetMediaCache.get(cacheKey);
  }

  const currentArtworkUrl = getSnippetArtworkUrl(snippet);
  const currentPreviewUrl = getSnippetPreviewUrl(snippet);
  const diskEntry = getAlbumArtworkFromDiskCache(songName, artistName);

  const resolved = {
    artworkUrl: !isCachedMediaUrl(currentArtworkUrl) ? currentArtworkUrl : '',
    previewUrl: !isCachedMediaUrl(currentPreviewUrl) ? currentPreviewUrl : '',
    albumName: snippet?.albumName || snippet?.snippetData?.attributes?.albumName || diskEntry?.albumName || '',
    songName,
    artistName,
  };

  if (!resolved.artworkUrl && diskEntry?.artworkUrl && !isCachedMediaUrl(diskEntry.artworkUrl)) {
    resolved.artworkUrl = diskEntry.artworkUrl;
  }
  if (!resolved.previewUrl && diskEntry?.previewUrl && !isCachedMediaUrl(diskEntry.previewUrl)) {
    resolved.previewUrl = diskEntry.previewUrl;
  }

  const searchTerms = [...new Set(
    [
      `${songName} ${artistName}`.trim(),
      query,
      songName,
    ].map((term) => sanitizeSongSearchQuery(term)).filter((term) => term.length >= 2)
  )];

  const fillFromTrack = (track) => {
    if (!track) return false;
    if (!resolved.artworkUrl && track.artworkUrl && !isCachedMediaUrl(track.artworkUrl)) {
      resolved.artworkUrl = track.artworkUrl;
    }
    if (!resolved.previewUrl && track.previewUrl && !isCachedMediaUrl(track.previewUrl)) {
      resolved.previewUrl = track.previewUrl;
    }
    if (!resolved.albumName && track.albumName) {
      resolved.albumName = track.albumName;
    }
    return Boolean(resolved.artworkUrl && resolved.previewUrl);
  };

  try {
    for (const term of searchTerms) {
      if (resolved.artworkUrl && resolved.previewUrl) break;
      const appleCandidates = await searchAppleCatalogSongs(term, 8);
      if (fillFromTrack(findBestTrackMatch(appleCandidates, songName, artistName))) {
        break;
      }
    }

    for (const term of searchTerms) {
      if (resolved.artworkUrl && resolved.previewUrl) break;
      const itunesCandidates = await searchItunesSongs(term, 8);
      if (fillFromTrack(findBestTrackMatch(itunesCandidates, songName, artistName))) {
        break;
      }
    }
  } catch (error) {
    console.warn(`Snippet media repair failed for ${songName} - ${artistName}:`, error.message);
  }

  repairedSnippetMediaCache.set(cacheKey, resolved);
  return resolved;
};

const repairSnippetMedia = async (snippet = {}) => {
  const songName = getSnippetSongName(snippet);
  const artistName = getSnippetArtistName(snippet);
  const artworkUrl = getSnippetArtworkUrl(snippet);
  const previewUrl = getSnippetPreviewUrl(snippet);

  const shouldRepair =
    (songName && artistName) &&
    (
      !artworkUrl ||
      !previewUrl ||
      isCachedMediaUrl(artworkUrl) ||
      isCachedMediaUrl(previewUrl)
    );

  if (!shouldRepair) {
    return snippet;
  }

  const resolved = await resolveSnippetMedia(snippet);
  const nextArtworkUrl = resolved.artworkUrl || artworkUrl || null;
  const nextPreviewUrl = resolved.previewUrl || previewUrl || null;

  return {
    ...snippet,
    songName: songName || resolved.songName || snippet?.songName || '',
    artistName: artistName || resolved.artistName || snippet?.artistName || '',
    albumName: resolved.albumName || snippet?.albumName || snippet?.snippetData?.attributes?.albumName || '',
    artworkUrl: nextArtworkUrl,
    previewUrl: nextPreviewUrl,
    artwork: nextArtworkUrl || snippet?.artwork || null,
    snippetData: {
      ...snippet?.snippetData,
      attributes: {
        ...snippet?.snippetData?.attributes,
        name: songName || snippet?.snippetData?.attributes?.name || '',
        artistName: artistName || snippet?.snippetData?.attributes?.artistName || '',
        albumName: resolved.albumName || snippet?.albumName || snippet?.snippetData?.attributes?.albumName || '',
        artwork: { url: nextArtworkUrl || '' },
        previews: nextPreviewUrl ? [{ url: nextPreviewUrl }] : [],
      },
    },
  };
};

const repairCachedThreadPostMedia = async (post = {}) => {
  const snippets = Array.isArray(post?.snippets) ? post.snippets : [];
  if (!snippets.length) {
    return post;
  }

  const repairedSnippets = await Promise.all(snippets.map((snippet) => repairSnippetMedia(snippet)));
  return {
    ...post,
    snippets: repairedSnippets,
  };
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

unifiedRouter.post('/cache-media', mediaCacheLimiter, async (req, res) => {
  try {
    const { artworkUrl, previewUrl, songId } = req.body || {};

    if (!songId) {
      return res.status(400).json({ success: false, error: 'Missing songId' });
    }

    if (!artworkUrl && !previewUrl) {
      return res.status(400).json({ success: false, error: 'At least one media URL is required' });
    }

    if (artworkUrl) {
      try {
        await validateRemoteMediaUrl(artworkUrl);
      } catch (error) {
        return res.status(400).json({ success: false, error: `Invalid artworkUrl: ${error.message}` });
      }
    }

    if (previewUrl) {
      try {
        await validateRemoteMediaUrl(previewUrl);
      } catch (error) {
        return res.status(400).json({ success: false, error: `Invalid previewUrl: ${error.message}` });
      }
    }

    ensureDirectory(SHARED_CACHED_MEDIA_DIR);

    const safeSongId = sanitizeCacheKeySegment(songId, 'song');
    const results = {
      artworkPath: artworkUrl || null,
      previewPath: previewUrl || null,
    };

    if (artworkUrl) {
      try {
        const { buffer, contentType } = await downloadRemoteAsset(
          artworkUrl,
          ALLOWED_ARTWORK_CONTENT_TYPES
        );
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
        const { buffer, contentType } = await downloadRemoteAsset(
          previewUrl,
          ALLOWED_PREVIEW_CONTENT_TYPES
        );
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

const SPOTIFY_GENRE_ALIASES = {
  'r&b': 'r-n-b',
  'rnb': 'r-n-b',
  'hip hop': 'hip-hop',
  'hiphop': 'hip-hop',
  'kpop': 'k-pop',
  'all': 'pop',
};

const SPOTIFY_GENRE_QUERY_CANDIDATES = {
  pop: ['pop'],
  'hip-hop': ['hip-hop', 'hip hop', 'hiphop', 'rap', 'trap'],
  rock: ['rock', 'alternative rock', 'classic rock'],
  'r-n-b': ['r-n-b', 'soul', 'neo soul'],
  electronic: ['electronic', 'edm', 'house'],
  country: ['country', 'modern country'],
  indie: ['indie', 'indie-pop', 'indie rock'],
  latin: ['latin', 'reggaeton'],
  jazz: ['jazz', 'smooth jazz'],
  'k-pop': ['k-pop', 'korean pop', 'pop'],
  alternative: ['alternative', 'alt-rock', 'alternative rock'],
};

const normalizeSpotifyGenre = (genre = 'pop') => {
  const normalized = String(genre || 'pop').trim().toLowerCase();
  return SPOTIFY_GENRE_ALIASES[normalized] || normalized || 'pop';
};

const getSpotifyGenreSearchTerms = (genre = 'pop') => {
  const normalizedGenre = normalizeSpotifyGenre(genre);
  const candidates = SPOTIFY_GENRE_QUERY_CANDIDATES[normalizedGenre] || [normalizedGenre];

  return Array.from(
    new Set(
      candidates
        .map((candidate) => String(candidate || '').trim().toLowerCase())
        .filter(Boolean)
    )
  );
};

const getPopArtists = async (genre = 'pop', minPopularity = 70, limit = 40, page = 1) => {
  const requestedLimit = Math.max(1, Math.min(Number(limit) || 40, 50));
  const requestedPage = Math.max(1, Number(page) || 1);
  const requestedMinPopularity = Math.max(0, Math.min(Number(minPopularity) || 70, 100));
  const normalizedGenre = normalizeSpotifyGenre(genre);

  try {
    const token = await getAccessToken();
    const offset = (requestedPage - 1) * requestedLimit;
    const searchTerms = getSpotifyGenreSearchTerms(genre);
    const collectedArtists = new Map();
    let lastError = null;

    for (const searchTerm of searchTerms) {
      try {
        const response = await axios.get('https://api.spotify.com/v1/search', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            q: `genre:"${searchTerm}"`,
            type: 'artist',
            limit: requestedLimit,
            offset,
          },
          timeout: 7000,
        });

        const artists = (response.data?.artists?.items || [])
          .map((artist) => {
            const imageUrl = artist.images?.[0]?.url || null;
            return {
              id: artist.id,
              name: artist.name,
              image: imageUrl,
              genres: artist.genres || [],
              popularity: artist.popularity || 0,
            };
          })
          .filter((artist) => artist.image && artist.popularity >= requestedMinPopularity);

        for (const artist of artists) {
          if (!collectedArtists.has(artist.id)) {
            collectedArtists.set(artist.id, artist);
          }

          if (collectedArtists.size >= requestedLimit) {
            return Array.from(collectedArtists.values()).slice(0, requestedLimit);
          }
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (collectedArtists.size > 0) {
      return Array.from(collectedArtists.values()).slice(0, requestedLimit);
    }

    if (lastError) {
      console.warn(`Spotify artist search failed for genre "${normalizedGenre}":`, lastError.message);
    } else {
      console.warn(`Spotify artist search returned no artists for genre "${normalizedGenre}"`);
    }

    return getRandomMockArtists(requestedLimit, genre);
  } catch (error) {
    console.warn(`Spotify artist search failed for genre "${normalizedGenre}":`, error.message);
    return getRandomMockArtists(requestedLimit, genre);
  }
};

//======================//
// Last.fm Service Functions
//======================//

// Spotify fallback: if Last.fm is unreachable/empty, try related artists
const fetchSpotifyRelatedArtists = async (artistName, limit = 20) => {
  try {
    const token = await getAccessToken();
    const searchResp = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: artistName, type: 'artist', limit: 1 },
      timeout: 7000,
    });

    const seedId = searchResp.data?.artists?.items?.[0]?.id;
    if (!seedId) {
      return [];
    }

    const relatedResp = await axios.get(
      `https://api.spotify.com/v1/artists/${seedId}/related-artists`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 7000,
      }
    );

    return (relatedResp.data?.artists || [])
      .slice(0, limit)
      .map((artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url || null,
        genres: artist.genres || [],
        popularity: artist.popularity || 0,
      }))
      .filter((artist) => artist.name);
  } catch (error) {
    console.warn(`Spotify related-artists failed for "${artistName}":`, error.message);
    return [];
  }
};

const fetchSimilarArtists = async (selectedArtists) => {
  const apiKey = process.env.LASTFM_API_KEY || process.env.REACT_APP_LASTFM_API_KEY;
  const normalizedArtists = (selectedArtists || [])
    .map((a) => (typeof a === 'string' ? a : a?.name))
    .filter(Boolean);

  const allSimilar = [];

  for (const artistName of normalizedArtists) {
    let addedFromLastfm = false;

    if (apiKey) {
      try {
        const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
          params: {
            method: 'artist.getsimilar',
            artist: artistName,
            api_key: apiKey,
            format: 'json',
            limit: 30,
            autocorrect: 1,
          },
          headers: { 'User-Agent': 'MuflThreads/1.0 (+https://mufl.app)' },
          timeout: 7000,
        });

        const similar = response.data?.similarartists?.artist || [];
        if (similar.length > 0) {
          addedFromLastfm = true;
          allSimilar.push(
            ...similar.map((artist) => ({
              name: artist.name,
              match: Number(artist.match) || null,
            }))
          );
        }
      } catch (artistError) {
        console.warn(`Last.fm similar fetch failed for "${artistName}":`, artistError.message);
      }
    }

    if (!addedFromLastfm) {
      const spotifyFallback = await fetchSpotifyRelatedArtists(artistName, 20);
      if (spotifyFallback.length > 0) {
        allSimilar.push(...spotifyFallback);
      }
    }
  }

  // Remove duplicates by name (case-insensitive)
  const uniqueArtists = [];
  const seen = new Set();

  for (const artist of allSimilar) {
    const key = (artist.name || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueArtists.push(artist);
  }

  if (uniqueArtists.length === 0) {
    console.warn('Similar artist lookup returned empty; using mock fallback list');
    return getRandomMockArtists(40);
  }

  return uniqueArtists;
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
    limit          = 40,
    page           = 1,
  } = req.query;

  try {
    const artists = await getPopArtists(
      genre,
      Number(minPopularity),
      Number(limit),
      Number(page)
    );
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});


const spotifySearchCache = new Map();
const appleArtistSearchCache = new Map();
const CACHE_TTL   = 900_000;              // 15 min

unifiedRouter.get('/spotify/search-artists', searchLimiter, async (req, res) => {
  const { query = '' } = req.query;

  if (!query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const key = query.toLowerCase();
  if (spotifySearchCache.has(key) && Date.now() - spotifySearchCache.get(key).ts < CACHE_TTL) {
    return res.json(spotifySearchCache.get(key).data);
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

    spotifySearchCache.set(key, { ts: Date.now(), data: artists });
    res.json(artists);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to search for artists',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

unifiedRouter.post('/spotify/fetch-images', heavyLookupLimiter, async (req, res) => {
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

unifiedRouter.post('/spotify/artists-data', heavyLookupLimiter, async (req, res) => {
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
unifiedRouter.post('/lastfm/similar-artists', heavyLookupLimiter, async (req, res) => {
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
unifiedRouter.get('/apple-music/search-artists', searchLimiter, async (req, res) => {
  const { query = '' } = req.query;
  if (!query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const key = query.toLowerCase();
  if (appleArtistSearchCache.has(key) && Date.now() - appleArtistSearchCache.get(key).ts < CACHE_TTL) {
    return res.json(appleArtistSearchCache.get(key).data);        // ← serve from cache
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
    appleArtistSearchCache.set(key, { ts: Date.now(), data: results });   // ← save
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

unifiedRouter.post('/apple-music/artist-songs', heavyLookupLimiter, async (req, res) => {
  const artistName = String(req.body?.artist || req.body?.artistName || '').trim();
  const limit = Math.max(1, Math.min(Number(req.body?.limit) || 3, 10));

  if (!artistName) {
    return res.status(400).json({ error: 'Artist name is required' });
  }

  try {
    const songs = await getPreviewableSongsForArtist(artistName, limit);

    if (!songs.length) {
      return res.json({ success: false, error: 'No song with preview found', songs: [] });
    }

    res.json({
      success: true,
      data: songs[0],
      songs,
    });
  } catch (err) {
    console.error('Artist-song lookup failed:', err.message);

    /* ➜ soft-fail so the front-end can pick another artist */
    return res.json({ success: false, error: 'No preview returned', songs: [] });
  }
});

unifiedRouter.post('/apple-music/snippets', heavyLookupLimiter, async (req, res) => {
  const artistNames = Array.isArray(req.body?.artistNames)
    ? req.body.artistNames.map((name) => String(name || '').trim()).filter(Boolean).slice(0, 12)
    : [];

  if (!artistNames.length) {
    return res.status(400).json({ error: 'artistNames array is required' });
  }

  try {
    const snippets = [];

    for (const artistName of artistNames) {
      const [firstSong] = await getPreviewableSongsForArtist(artistName, 1);
      if (firstSong) {
        snippets.push(firstSong);
      }
    }

    return res.json(snippets);
  } catch (error) {
    console.error('Apple snippet lookup failed:', error.message);
    return res.status(500).json({ error: 'Failed to fetch snippets' });
  }
});



// General Apple Music search
unifiedRouter.post('/apple-music/search', searchLimiter, async (req, res) => {
  const query = String(req.body?.query || req.body?.searchQuery || '').trim();
  if (!query) return res.status(400).json({ error: 'Query required' });
  try {
    const results = dedupeMuflSongs(
      (await searchAppleCatalogSongs(query, 10)).map(mapTrackToMuflSong)
    );
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Apple Music search failed', details: err.message });
  }
});

// Apple Music artist search endpoint
unifiedRouter.post('/apple-music/artist-search', searchLimiter, async (req, res) => {
  const query = String(req.body?.query || req.body?.searchQuery || '').trim();
  const artistName = String(req.body?.artistName || '').trim();
  
  if (!query || !artistName) {
    return res.status(400).json({ error: 'Query and artist name are required' });
  }
  
  try {
    const combinedSongs = dedupeMuflSongs([
      ...(await searchAppleCatalogSongs(`${artistName} ${query}`, 10)).map(mapTrackToMuflSong),
      ...(await searchAppleCatalogSongs(query, 6))
        .map(mapTrackToMuflSong)
        .filter((song) => normalizeLookupValue(song.artist).includes(normalizeLookupValue(artistName))),
    ]).slice(0, 10);

    res.json({ results: combinedSongs });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to search artist on Apple Music',
      message: error.message 
    });
  }
});


// Then replace your existing /reddit/posts route with this updated version:
unifiedRouter.get('/reddit/posts', heavyLookupLimiter, async (req, res) => {
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
unifiedRouter.get('/apple-music-search', searchLimiter, async (req, res) => {
  const sanitizedQuery = sanitizeSongSearchQuery(req.query?.query);
  const requestedLimit = Math.max(1, Math.min(Number(req.query?.limit) || 6, 10));

  if (!sanitizedQuery || sanitizedQuery.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'A valid search query with at least 2 characters is required',
    });
  }

  const appleDeveloperToken = process.env.APPLE_DEVELOPER_TOKEN;
  const appleApiBaseUrl = process.env.APPLE_API_BASE_URL || 'https://api.music.apple.com/v1/catalog/us';

  try {
    if (appleDeveloperToken) {
      const appleUrl = `${appleApiBaseUrl}/search?term=${encodeURIComponent(sanitizedQuery)}&types=songs&limit=${requestedLimit}`;
      const { data } = await axios.get(appleUrl, {
        headers: { Authorization: `Bearer ${appleDeveloperToken}` },
        timeout: 7000,
      });

      const appleSongs = Array.isArray(data?.results?.songs?.data)
        ? data.results.songs.data.map(mapTrackToThreadSong).filter(Boolean)
        : [];

      if (appleSongs.length > 0) {
        return res.json({
          success: true,
          source: 'apple-music',
          data: appleSongs,
        });
      }
    }

    const { data } = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: sanitizedQuery,
        entity: 'song',
        limit: requestedLimit,
        country: 'US',
      },
      timeout: 7000,
    });

    const fallbackSongs = Array.isArray(data?.results)
      ? data.results.map(mapTrackToThreadSong).filter(Boolean)
      : [];

    return res.json({
      success: true,
      source: 'itunes-search',
      data: fallbackSongs,
    });
  } catch (error) {
    console.error('Failed to search for songs:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search for songs',
      message: error?.message || 'Unknown error',
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

const loadCachedThreadPostWithRepairedMedia = async (postId) => {
  const cacheKey = String(postId || '').trim();
  if (!cacheKey) {
    return null;
  }

  if (repairedCachedPostCache.has(cacheKey)) {
    return repairedCachedPostCache.get(cacheKey);
  }

  const repairPromise = Promise.resolve().then(async () => {
    const cachedPost = loadCachedThreadPost(cacheKey);
    if (!cachedPost) {
      return null;
    }

    return repairCachedThreadPostMedia(cachedPost);
  }).catch((error) => {
    repairedCachedPostCache.delete(cacheKey);
    throw error;
  });

  repairedCachedPostCache.set(cacheKey, repairPromise);
  return repairPromise;
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

unifiedRouter.get('/diverse-posts', heavyLookupLimiter, async (req, res) => {
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

unifiedRouter.get('/refresh', heavyLookupLimiter, async (req, res) => {
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
    const data = await loadCachedThreadPostWithRepairedMedia(postId);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});



unifiedRouter.get('/posts/:postId/snippets', heavyLookupLimiter, async (req, res) => {
  const { postId } = req.params;

  try {
    const cachedPost = await loadCachedThreadPostWithRepairedMedia(postId);
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

unifiedRouter.get('/posts/:id/comments', heavyLookupLimiter, async (req, res) => {
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
