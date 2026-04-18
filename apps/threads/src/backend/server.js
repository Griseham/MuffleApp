// server.js
import express from 'express';
import cors from 'cors';
import fs from "fs";
import os from "os";
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dotenvResult = dotenv.config({ path: path.resolve(__dirname, ".env") });
if (dotenvResult.error) { /* intentionally empty */ }

const APPLE_API_BASE_URL = process.env.APPLE_API_BASE_URL || "https://api.music.apple.com/v1/catalog/us";
const APPLE_DEVELOPER_TOKEN = process.env.APPLE_DEVELOPER_TOKEN;


if (!APPLE_DEVELOPER_TOKEN) { /* intentionally empty */ }

// Log cache configuration on startup








const app = express();
app.use(cors());
app.use(express.json()); // Add JSON body parser middleware

// Blacklist configuration
const BLACKLISTED_USERS = [
  'Smoothlarryy',
  'banstovia',
  'DrgRug9756',
    'jimviv'
];

// Function to check if a post should be blacklisted
function isPostBlacklisted(post) {
  return BLACKLISTED_USERS.includes(post.author);
}

// We'll store our data in memory for an MVP

// Caching variables with shorter TTL for more frequent refreshes
let cachedPosts = [];
let lastFetchTime = 0; 
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (reduced from 15 minutes) for more frequent variety

const commentsCache = {}; 
const COMMENT_CACHE_TTL_MS = 8 * 60 * 1000; // 8 minutes for comments
const snippetsCache = {}; // { [postId]: { data: [], timestamp: number } }
const SNIPPET_CACHE_TTL_MS = 12 * 60 * 1000; // 12 minutes for per-post snippet cache

// Apple Music query cache - 24 hour TTL to avoid hammering the API
const appleMusicQueryCache = {}; // { [query]: { data: [], timestamp: number } }
const APPLE_MUSIC_QUERY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Minimum snippets required for normal threads (not news/parameter)
const MIN_SNIPPETS_PER_THREAD = 5;
const DEFAULT_RUNTIME_DIR = path.resolve(
  process.env.MUFFLE_RUNTIME_DIR || path.join(os.tmpdir(), 'muffle-runtime', 'threads-backend')
);
const CACHED_MEDIA_DIR = path.resolve(
  process.env.THREADS_LOCAL_MEDIA_CACHE_DIR || path.join(DEFAULT_RUNTIME_DIR, 'cached_media')
);
if (!fs.existsSync(CACHED_MEDIA_DIR)) {
  fs.mkdirSync(CACHED_MEDIA_DIR, { recursive: true });
}

const ARTIST_IMAGE_CACHE_FILE = path.resolve(__dirname, "./cached_artist_images.json");
const ARTIST_IMAGE_REQUEST_DELAY_MS = 120;
const ALBUM_ARTWORK_CACHE_FILE = path.resolve(__dirname, "./cached_album_artworks.json");
const ALBUM_ARTWORK_REQUEST_DELAY_MS = 120;

function loadArtistImageCacheFromDisk() {
  try {
    if (!fs.existsSync(ARTIST_IMAGE_CACHE_FILE)) {
      fs.writeFileSync(ARTIST_IMAGE_CACHE_FILE, JSON.stringify({}, null, 2), "utf8");
      return {};
    }
    const raw = fs.readFileSync(ARTIST_IMAGE_CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch  {
    
    return {};
  }
}

function saveArtistImageCacheToDisk(cacheData) {
  try {
    fs.writeFileSync(ARTIST_IMAGE_CACHE_FILE, JSON.stringify(cacheData, null, 2), "utf8");
    return true;
  } catch  {
    
    return false;
  }
}

function normalizeArtistKey(name) {
  return String(name || "").trim().toLowerCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAppleArtworkUrl(template, size = 300) {
  if (!template || typeof template !== "string") return null;
  return template
    .replace(/\{w\}x\{h\}/g, `${size}x${size}`)
    .replace(/\{w\}/g, String(size))
    .replace(/\{h\}/g, String(size))
    .replace(/\{f\}/g, "jpg");
}

async function parseAppleResponse(response) {
  const bodyText = await response.text();
  if (!bodyText) return null;
  try {
    return JSON.parse(bodyText);
  } catch {
    
    return null;
  }
}

async function fetchArtistImageFromAppleMusic(artistName) {
  if (!APPLE_DEVELOPER_TOKEN || !APPLE_API_BASE_URL) {
    return null;
  }

  const headers = {
    Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}`,
    Accept: "application/json",
  };

  const artistSearchUrl =
    `${APPLE_API_BASE_URL}/search?term=${encodeURIComponent(artistName)}&limit=3&types=artists`;

  try {
    const artistResponse = await fetch(artistSearchUrl, { headers });
    if (artistResponse.ok) {
      const artistData = await parseAppleResponse(artistResponse);
      const artists = artistData?.results?.artists?.data || [];
      for (const artist of artists) {
        const artworkTemplate = artist?.attributes?.artwork?.url;
        const imageUrl = buildAppleArtworkUrl(artworkTemplate, 300);
        if (imageUrl) {
          return {
            artistId: artist?.id || null,
            artistName: artist?.attributes?.name || artistName,
            imageUrl,
            source: "artists",
          };
        }
      }
    } else { /* intentionally empty */ }
  } catch  { /* intentionally empty */ }

  // Fallback to song artwork when artist artwork is unavailable.
  const songSearchUrl =
    `${APPLE_API_BASE_URL}/search?term=${encodeURIComponent(artistName)}&limit=3&types=songs`;

  try {
    const songResponse = await fetch(songSearchUrl, { headers });
    if (songResponse.ok) {
      const songData = await parseAppleResponse(songResponse);
      const songs = songData?.results?.songs?.data || [];
      for (const song of songs) {
        const artworkTemplate = song?.attributes?.artwork?.url;
        const imageUrl = buildAppleArtworkUrl(artworkTemplate, 300);
        if (imageUrl) {
          return {
            artistId: null,
            artistName: song?.attributes?.artistName || artistName,
            imageUrl,
            source: "songs",
          };
        }
      }
    } else { /* intentionally empty */ }
  } catch  { /* intentionally empty */ }

  return null;
}

const artistImageCache = loadArtistImageCacheFromDisk();
const TRACK_CACHE_KEY_SEPARATOR = "|||";

function loadAlbumArtworkCacheFromDisk() {
  try {
    if (!fs.existsSync(ALBUM_ARTWORK_CACHE_FILE)) {
      fs.writeFileSync(ALBUM_ARTWORK_CACHE_FILE, JSON.stringify({}, null, 2), "utf8");
      return {};
    }
    const raw = fs.readFileSync(ALBUM_ARTWORK_CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch  {
    
    return {};
  }
}

function saveAlbumArtworkCacheToDisk(cacheData) {
  try {
    fs.writeFileSync(ALBUM_ARTWORK_CACHE_FILE, JSON.stringify(cacheData, null, 2), "utf8");
    return true;
  } catch  {
    
    return false;
  }
}

function normalizeTextForMatch(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeTrackCacheKey(songName, artistName) {
  return `${normalizeTextForMatch(songName)}${TRACK_CACHE_KEY_SEPARATOR}${normalizeTextForMatch(artistName)}`;
}

function createTrackRequestKey(songName, artistName) {
  return `${String(songName || "").trim()}${TRACK_CACHE_KEY_SEPARATOR}${String(artistName || "").trim()}`;
}

function chooseBestSongMatch(songs, songName, artistName) {
  if (!Array.isArray(songs) || songs.length === 0) return null;

  const normalizedSong = normalizeTextForMatch(songName);
  const normalizedArtist = normalizeTextForMatch(artistName);
  const songTokens = normalizedSong.split(" ").filter(Boolean);
  const artistTokens = normalizedArtist.split(" ").filter(Boolean);

  let best = null;
  let bestScore = -1;

  for (const candidate of songs) {
    const candidateSong = normalizeTextForMatch(candidate?.attributes?.name || "");
    const candidateArtist = normalizeTextForMatch(candidate?.attributes?.artistName || "");

    let score = 0;
    if (candidateSong === normalizedSong) score += 7;
    if (candidateArtist === normalizedArtist) score += 7;
    if (candidateSong.includes(normalizedSong) || normalizedSong.includes(candidateSong)) score += 3;
    if (candidateArtist.includes(normalizedArtist) || normalizedArtist.includes(candidateArtist)) score += 3;

    for (const token of songTokens) {
      if (candidateSong.includes(token)) score += 1;
    }
    for (const token of artistTokens) {
      if (candidateArtist.includes(token)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best || songs[0] || null;
}

const albumArtworkCache = loadAlbumArtworkCacheFromDisk();
const repairedSnippetMediaCache = new Map();
const repairedCachedPostsCache = new Map();

function isCachedMediaUrl(value = "") {
  return String(value || "").includes("/cached_media/");
}

function formatResolvedArtworkUrl(url, size = 300) {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return null;

  if (rawUrl.includes("{w}") || rawUrl.includes("{h}") || rawUrl.includes("{f}")) {
    return buildAppleArtworkUrl(rawUrl, size);
  }

  return rawUrl
    .replace(/\/\d+x\d+bb\.(jpg|png)$/i, `/${size}x${size}bb.jpg`)
    .replace(/\/\d+x\d+\.(jpg|png)$/i, `/${size}x${size}bb.jpg`);
}

function getSnippetSongName(snippet = {}) {
  return String(
    snippet?.songName ||
    snippet?.name ||
    snippet?.snippetData?.attributes?.name ||
    ""
  ).trim();
}

function getSnippetArtistName(snippet = {}) {
  return String(
    snippet?.artistName ||
    snippet?.snippetData?.attributes?.artistName ||
    ""
  ).trim();
}

function getSnippetArtworkUrl(snippet = {}) {
  return String(
    snippet?.artworkUrl ||
    snippet?.artwork ||
    snippet?.snippetData?.attributes?.artwork?.url ||
    ""
  ).trim();
}

function getSnippetPreviewUrl(snippet = {}) {
  return String(
    snippet?.previewUrl ||
    snippet?.snippetData?.attributes?.previews?.[0]?.url ||
    ""
  ).trim();
}

function mapAppleSongToMediaCandidate(song = {}) {
  return {
    songId: song?.id || null,
    songName: song?.attributes?.name || "",
    artistName: song?.attributes?.artistName || "",
    albumName: song?.attributes?.albumName || "",
    artworkUrl: formatResolvedArtworkUrl(song?.attributes?.artwork?.url, 300),
    previewUrl: song?.attributes?.previews?.[0]?.url || null,
    source: "apple-search",
  };
}

function mapItunesSongToMediaCandidate(song = {}) {
  return {
    songId: song?.trackId || null,
    songName: song?.trackName || "",
    artistName: song?.artistName || "",
    albumName: song?.collectionName || "",
    artworkUrl: formatResolvedArtworkUrl(
      song?.artworkUrl100 || song?.artworkUrl60 || song?.artworkUrl30 || "",
      300
    ),
    previewUrl: song?.previewUrl || null,
    source: "itunes-search",
  };
}

function scoreMediaCandidate(candidate = {}, songName = "", artistName = "") {
  const candidateSong = normalizeTextForMatch(candidate?.songName);
  const candidateArtist = normalizeTextForMatch(candidate?.artistName);
  const expectedSong = normalizeTextForMatch(songName);
  const expectedArtist = normalizeTextForMatch(artistName);

  let score = 0;

  if (expectedSong && candidateSong) {
    if (candidateSong === expectedSong) score += 120;
    else if (candidateSong.includes(expectedSong) || expectedSong.includes(candidateSong)) score += 70;
  }

  if (expectedArtist && candidateArtist) {
    if (candidateArtist === expectedArtist) score += 100;
    else if (candidateArtist.includes(expectedArtist) || expectedArtist.includes(candidateArtist)) score += 60;
  }

  if (candidate?.previewUrl) score += 20;
  if (candidate?.artworkUrl) score += 10;

  return score;
}

function findBestMediaCandidate(candidates = [], songName = "", artistName = "") {
  let bestCandidate = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = scoreMediaCandidate(candidate, songName, artistName);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

async function searchItunesSongs(query, limit = 8) {
  const safeQuery = String(query || "").trim();
  if (safeQuery.length < 2) {
    return [];
  }

  const url =
    `https://itunes.apple.com/search?term=${encodeURIComponent(safeQuery)}` +
    `&entity=song&limit=${Math.max(1, Math.min(Number(limit) || 8, 12))}&country=US`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data?.results) ? data.results : [];
  } catch  {
    
    return [];
  }
}

async function resolveSnippetMedia(snippet = {}) {
  const songName = getSnippetSongName(snippet);
  const artistName = getSnippetArtistName(snippet);
  const query = String(snippet?.query || "").trim();

  if (!songName || !artistName) {
    return {
      songName,
      artistName,
      albumName: snippet?.albumName || snippet?.snippetData?.attributes?.albumName || "",
      artworkUrl: getSnippetArtworkUrl(snippet) || null,
      previewUrl: getSnippetPreviewUrl(snippet) || null,
    };
  }

  const cacheKey = normalizeTrackCacheKey(songName, artistName);
  if (repairedSnippetMediaCache.has(cacheKey)) {
    return repairedSnippetMediaCache.get(cacheKey);
  }

  const currentArtworkUrl = getSnippetArtworkUrl(snippet);
  const currentPreviewUrl = getSnippetPreviewUrl(snippet);
  const cachedEntry = albumArtworkCache[cacheKey];

  const resolved = {
    songName,
    artistName,
    albumName: snippet?.albumName || snippet?.snippetData?.attributes?.albumName || cachedEntry?.albumName || "",
    artworkUrl: !isCachedMediaUrl(currentArtworkUrl) ? formatResolvedArtworkUrl(currentArtworkUrl, 300) : "",
    previewUrl: !isCachedMediaUrl(currentPreviewUrl) ? currentPreviewUrl : "",
  };

  if (!resolved.artworkUrl && cachedEntry?.artworkUrl && !isCachedMediaUrl(cachedEntry.artworkUrl)) {
    resolved.artworkUrl = formatResolvedArtworkUrl(cachedEntry.artworkUrl, 300);
  }
  if (!resolved.previewUrl && cachedEntry?.previewUrl && !isCachedMediaUrl(cachedEntry.previewUrl)) {
    resolved.previewUrl = cachedEntry.previewUrl;
  }

  const fillFromCandidate = (candidate) => {
    if (!candidate) return false;

    if (!resolved.artworkUrl && candidate.artworkUrl && !isCachedMediaUrl(candidate.artworkUrl)) {
      resolved.artworkUrl = formatResolvedArtworkUrl(candidate.artworkUrl, 300);
    }
    if (!resolved.previewUrl && candidate.previewUrl && !isCachedMediaUrl(candidate.previewUrl)) {
      resolved.previewUrl = candidate.previewUrl;
    }
    if (!resolved.albumName && candidate.albumName) {
      resolved.albumName = candidate.albumName;
    }

    if (candidate.songName && candidate.artistName && (candidate.artworkUrl || candidate.previewUrl)) {
      albumArtworkCache[cacheKey] = {
        requestSongName: songName,
        requestArtistName: artistName,
        matchedSongName: candidate.songName,
        matchedArtistName: candidate.artistName,
        songId: candidate.songId || null,
        albumName: candidate.albumName || "",
        artworkUrl: candidate.artworkUrl || null,
        previewUrl: candidate.previewUrl || null,
        source: candidate.source || "repair",
        updatedAt: new Date().toISOString(),
      };
      saveAlbumArtworkCacheToDisk(albumArtworkCache);
    }

    return Boolean(resolved.artworkUrl && resolved.previewUrl);
  };

  const searchTerms = [...new Set(
    [
      `${songName} ${artistName}`.trim(),
      query,
      songName,
    ].map((value) => String(value || "").trim()).filter((value) => value.length >= 2)
  )];

  try {
    for (const term of searchTerms) {
      if (resolved.artworkUrl && resolved.previewUrl) break;
      const appleSongs = await searchAppleMusic(term, 8);
      const appleCandidates = appleSongs.map(mapAppleSongToMediaCandidate);
      if (fillFromCandidate(findBestMediaCandidate(appleCandidates, songName, artistName))) {
        break;
      }
    }

    for (const term of searchTerms) {
      if (resolved.artworkUrl && resolved.previewUrl) break;
      const itunesSongs = await searchItunesSongs(term, 8);
      const itunesCandidates = itunesSongs.map(mapItunesSongToMediaCandidate);
      if (fillFromCandidate(findBestMediaCandidate(itunesCandidates, songName, artistName))) {
        break;
      }
    }
  } catch  { /* intentionally empty */ }

  repairedSnippetMediaCache.set(cacheKey, resolved);
  return resolved;
}

async function repairSnippetMedia(snippet = {}) {
  const songName = getSnippetSongName(snippet);
  const artistName = getSnippetArtistName(snippet);
  const artworkUrl = getSnippetArtworkUrl(snippet);
  const previewUrl = getSnippetPreviewUrl(snippet);

  const shouldRepair =
    songName &&
    artistName &&
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
    songName: songName || resolved.songName || "",
    artistName: artistName || resolved.artistName || "",
    albumName: resolved.albumName || snippet?.albumName || snippet?.snippetData?.attributes?.albumName || "",
    artworkUrl: nextArtworkUrl,
    artwork: nextArtworkUrl || snippet?.artwork || null,
    previewUrl: nextPreviewUrl,
    snippetData: {
      ...snippet?.snippetData,
      attributes: {
        ...snippet?.snippetData?.attributes,
        name: songName || snippet?.snippetData?.attributes?.name || "",
        artistName: artistName || snippet?.snippetData?.attributes?.artistName || "",
        albumName: resolved.albumName || snippet?.albumName || snippet?.snippetData?.attributes?.albumName || "",
        artwork: { url: nextArtworkUrl || "" },
        previews: nextPreviewUrl ? [{ url: nextPreviewUrl }] : [],
      },
    },
  };
}

async function repairCachedPostMedia(post = {}) {
  const snippets = Array.isArray(post?.snippets) ? post.snippets : [];
  if (!snippets.length) {
    return post;
  }

  const repairedSnippets = await Promise.all(snippets.map((snippet) => repairSnippetMedia(snippet)));
  return {
    ...post,
    snippets: repairedSnippets,
  };
}

async function cacheMediaForSong(songId, artworkUrl, previewUrl) {
  const safeId = String(songId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeId) return { artworkPath: null, previewPath: null };

  const artworkFilename = `${safeId}_artwork.jpg`;
  const previewFilename = `${safeId}_preview.m4a`;

  const artworkPathFs = path.join(CACHED_MEDIA_DIR, artworkFilename);
  const previewPathFs = path.join(CACHED_MEDIA_DIR, previewFilename);

  // Track whether caching succeeded
  let artworkCached = fs.existsSync(artworkPathFs);
  let previewCached = fs.existsSync(previewPathFs);

  // Try to cache artwork if not already cached
  if (artworkUrl && !artworkCached) {
    try {
      const resp = await fetch(artworkUrl);
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        fs.writeFileSync(artworkPathFs, buf);
        artworkCached = true;
        
      } else { /* intentionally empty */ }
    } catch  { /* intentionally empty */ }
  }

  // Try to cache preview if not already cached
  if (previewUrl && !previewCached) {
    try {
      const resp = await fetch(previewUrl);
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        fs.writeFileSync(previewPathFs, buf);
        previewCached = true;
        
      } else { /* intentionally empty */ }
    } catch  { /* intentionally empty */ }
  }

  // FIXED: Only return cached path if file actually exists, otherwise return original URL
  return {
    artworkPath: artworkCached ? `/cached_media/${artworkFilename}` : artworkUrl,
    previewPath: previewCached ? `/cached_media/${previewFilename}` : previewUrl,
  };
}


// A threshold for "short" comments
const _COMMENT_LENGTH_THRESHOLD = 80;

const postsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // limit each IP to 100 requests per window
});

const heavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // tighter limit for expensive endpoints
});

let spotifyTokenCache = {
  accessToken: null,
  expiresAt: 0,
};

const stripControlCharacters = (value) =>
  value.split('').filter((char) => {
    const code = char.charCodeAt(0);
    return code >= 32 && code !== 127;
  }).join('');

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not set");
  }

  if (spotifyTokenCache.accessToken && spotifyTokenCache.expiresAt > Date.now() + 30_000) {
    return spotifyTokenCache.accessToken;
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authString}`,
    },
    body: "grant_type=client_credentials"
  });

  if (!tokenRes.ok) {
    throw new Error(`Spotify token request failed with status ${tokenRes.status}`);
  }

  const data = await tokenRes.json();
  spotifyTokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Math.max(0, (Number(data.expires_in) || 3600) - 60) * 1000,
  };

  return spotifyTokenCache.accessToken;
}

function _saveToJSON(posts) {
  fs.writeFileSync("./db.json", JSON.stringify(posts, null, 2), "utf-8");
}

function flattenRedditComments(children, maxDepth = 1, currentDepth = 0) {
  let flat = [];
  for (const item of children) {
    if (!item || !item.data) continue;
    const c = item.data;
    let parentId = c.parent_id ? c.parent_id.replace(/^t\d_/, "") : null;
    if (currentDepth === 0) {
      parentId = null;
    }
    const flattened = {
      id: c.id,
      author: c.author,
      body: c.body || "",
      createdUtc: c.created_utc || 0,
      parentId: parentId,
    };
    flat.push(flattened);
    if (currentDepth < maxDepth) {
      if (c.replies?.data?.children) {
        const nested = flattenRedditComments(c.replies.data.children, maxDepth, currentDepth + 1);
        flat = flat.concat(nested);
      }
    }
  }
  return flat;
}

function removeLinks(text) {
  if (!text) return "";
  return text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, "$1")
             .replace(/https?:\/\/\S+/gi, "");
}

function extractImageUrl(post) {
  
  if (post.post_hint === 'image' && post.url) {
    
    return post.url;
  }
  if (post.preview && post.preview.images && post.preview.images.length > 0) {
    
    return post.preview.images[0].source.url;
  }
  if (post.is_gallery && post.gallery_data && post.media_metadata) {
    const items = post.gallery_data.items;
    const media = post.media_metadata;
    const imageUrls = items.map(item => {
      const mediaItem = media[item.media_id];
      const url = mediaItem?.s?.u || null;
      
      return url;
    }).filter(url => url !== null);
    if (imageUrls.length > 0) {
      
      return imageUrls[0];
    }
  }
  const extPattern = /\.(jpg|jpeg|png|gif)$/i;
  const isImageLink = extPattern.test(post.url) || post.url.includes("i.redd.it");
  if (isImageLink) {
    return post.url;
  }
  
  return null;
}

function decodeEntities(str) {
  return str.replace(/&amp;/g, "&");
}

// --- Updated fetchSubreddit function ---


function deduplicatePosts(posts) {
  const seen = new Set();
  return posts.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function _insertParameterThread(posts) {
  return posts;
}

function interleavePostsByType(posts, typeOrder = ["thread", "news", "groupchat", "parameter"]) {
  const buckets = new Map();
  for (const post of posts) {
    const key = post.postType || "thread";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(post);
  }

  const order = [...typeOrder];
  for (const key of buckets.keys()) {
    if (!order.includes(key)) order.push(key);
  }

  const out = [];
  let remaining = posts.length;
  while (remaining > 0) {
    let pushedThisRound = false;
    for (const key of order) {
      const bucket = buckets.get(key);
      if (bucket && bucket.length > 0) {
        out.push(bucket.shift());
        remaining -= 1;
        pushedThisRound = true;
      }
    }
    if (!pushedThisRound) break;
  }

  return out;
}

// --- Apple Music snippet search code ---

async function fetchSubreddit(subreddit) {
  let url;
  // Significantly increased limits for more diversity while maintaining quality
  if (subreddit === "musicsuggestions") {
    // For musicsuggestions, get posts with more comments by sorting by most comments
    url = `https://www.reddit.com/r/${subreddit}/top.json?t=year&limit=100`;
  } else if (subreddit === "musicrecommendations") {
    url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=40`;
  } else if (subreddit === "ifyoulikeblank") {
    url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=35`;
  } else if (subreddit === "listentothis") {
    url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=35`;
  } else {
    url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=25`;
  }
  
  
  
  const resp = await fetch(url);
  if (!resp.ok) {
    
    return [];
  }
  const data = await resp.json();
  if (!data || !data.data) return [];
  
  // Add randomness to ensure different posts appear when reloading
  const shuffled = shuffleArray([...data.data.children]);
  
  // Take a random subset based on comment count for musicsuggestions
  let selectedPosts;
  if (subreddit === "musicsuggestions") {
    // Sort by number of comments for musicsuggestions to get better group chat candidates
    const sortedByComments = [...shuffled].sort((a, b) => b.data.num_comments - a.data.num_comments);
    // Take top 20 posts with most comments
    selectedPosts = sortedByComments.slice(0, Math.min(20, sortedByComments.length));
  } else {
    selectedPosts = shuffled.slice(0, Math.min(15, shuffled.length));
  }
  
  const out = selectedPosts
    .map((child) => {
      const p = child.data;
      const rawUrl = extractImageUrl(p);
      const imageUrl = rawUrl ? decodeEntities(rawUrl) : null;
      
      let postType = "thread";
      if (subreddit === "music") {
        postType = "news";
      } else if (["musicrecommendations", "songrecommendations", "musicsuggestions"].includes(subreddit)) {
        // Mark all posts from musicsuggestions as groupchats if they have comments
        if (subreddit === "musicsuggestions" && p.num_comments && p.num_comments > 5) {
          postType = "groupchat";
        } else {
          postType = "thread";
        }
      }
      
      // Add timestamp randomization to ensure UI shows different posts first
      const randomizedTime = p.created_utc + Math.floor(Math.random() * 3600); 
      
      return {
        id: p.id,
        subreddit,
        title: p.title,
        author: p.author,
        ups: p.ups,
        downs: p.downs,
        url: p.url,
        is_self: p.is_self,
        selftext: p.selftext,
        createdUtc: randomizedTime, // Randomized timestamp
        imageUrl,
        postType,
        num_comments: p.num_comments,
      };
    })
    .filter(post => !isPostBlacklisted(post)); // Filter out blacklisted posts
  
  // For musicsuggestions, filter and promote high-comment posts
  const groupchatPosts = out.filter(post =>
    post.subreddit === "musicsuggestions" && post.num_comments >= 5
  );
  
  if (groupchatPosts.length > 0) {
    // Sort group chat posts by number of comments (most comments first)
    const sortedGroupChats = [...groupchatPosts].sort((a, b) => b.num_comments - a.num_comments);
    
    // Choose top 5 high-comment posts to promote
    const topGroupChatPosts = sortedGroupChats.slice(0, Math.min(5, sortedGroupChats.length));
    
    // Make sure they're all marked as groupchats and move to the beginning
    for (const selected of topGroupChatPosts) {
      selected.postType = "groupchat";
      
      // Remove it from its current position
      const currentIndex = out.findIndex(p => p.id === selected.id);
      if (currentIndex >= 0) {
        out.splice(currentIndex, 1);
      }
    }
    
    // Add all selected groupchats to the beginning
    out.unshift(...topGroupChatPosts);
  }
  
  
  return out;
}

// Enhanced fetchAllSubreddits function for greater variety with quality filtering
async function fetchAllSubreddits() {
  // Expanded list of music-related subreddits
  const subs = [
    "musicrecommendations", 
    "songrecommendations", 
    "musicsuggestions", 
    "music",
    "ifyoulikeblank",
    "listentothis",
    "indiemusicfeedback", // Adding more music subs for variety
    "newmusic", 
    "electronicmusic"
  ];
  
  
  
  let allPosts = [];
  for (const sub of subs) {
    const subset = await fetchSubreddit(sub);
    allPosts = allPosts.concat(subset);
  }
  
  // Quality filter - ensure we have posts with good engagement
  // Filter to keep posts that have at least 10 upvotes or 5 comments
  const qualityPosts = allPosts.filter(post => 
    (post.ups >= 10 || post.num_comments >= 5)
  );
  
  
  
  // If we have enough quality posts, use those; otherwise use all posts
  const postsToUse = qualityPosts.length >= 25 ? qualityPosts : allPosts;
  
  // Shuffle more aggressively for more variation
  shuffleArray(postsToUse);
  shuffleArray(postsToUse); // Double shuffle for more randomness
  
  // Dedupe posts
  const uniquePosts = deduplicatePosts(postsToUse);
  
  // Do not auto-insert parameter threads
  
  // Adjust limit for more content but not overwhelming UI
  const maxPosts = 40; // Increased from 30 to 40
  const finalPosts = uniquePosts.length > maxPosts ? uniquePosts.slice(0, maxPosts) : uniquePosts;
  
  
  return finalPosts;
}

// Enhanced function to ensure cache refreshes with more diversity
function forceRefreshCachedPosts() {
  // Make the cache expire immediately
  const REFRESH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes to completely expire
  
  // Update last fetch time to be much older, forcing an immediate refresh
  lastFetchTime = Date.now() - REFRESH_CACHE_TTL_MS - 5000;
  
  // Also clear the cached posts array to ensure completely fresh data
  cachedPosts = [];
  
  
}
async function searchAppleMusic(query, limit = 6) {
  if (!APPLE_DEVELOPER_TOKEN || !APPLE_API_BASE_URL) {
    
    return [];
  }

  // Normalize the query for caching (lowercase, trimmed)
  const cacheKey = query.toLowerCase().trim();
  const now = Date.now();
  
  // Check the query cache first (24-hour TTL)
  const cachedResult = appleMusicQueryCache[cacheKey];
  if (cachedResult && (now - cachedResult.timestamp < APPLE_MUSIC_QUERY_CACHE_TTL_MS)) {
    
    return cachedResult.data;
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 6, 10));
  const searchUrl = `${APPLE_API_BASE_URL}/search?term=${encodeURIComponent(query)}&limit=${safeLimit}&types=songs`;
  try {
    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}`,
        Accept: "application/json",
      },
    });

    const bodyText = await response.text();

    if (!response.ok) {
      
      return [];
    }

    if (!bodyText) {
      
      return [];
    }

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch {
      
      return [];
    }

    const songs = data?.results?.songs?.data;
    const results = Array.isArray(songs) ? songs : [];
    
    // Cache the result with 24-hour TTL
    appleMusicQueryCache[cacheKey] = {
      data: results,
      timestamp: now
    };
    
    
    return results;
  } catch  {
    
    return [];
  }
}

function isUsableSnippetComment(commentText) {
  return commentText.includes("-") && !/https?:\/\//i.test(commentText);
}

function cachePostToJson(postId, subreddit) {
  
  
  // Use path.resolve relative to this file's directory
  const cacheDir = path.resolve(__dirname, './cached_posts');
  
  
  if (!fs.existsSync(cacheDir)) {
    try {
      fs.mkdirSync(cacheDir, { recursive: true });
      
    } catch  {
      
      return Promise.resolve(false);
    }
  }
  
  return (async () => {
    try {
      // Fetch post details
      const postUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;
      const response = await fetch(postUrl);
      
      if (!response.ok) {
        
        return false;
      }
      
      const json = await response.json();
      const mainPost = json[0]?.data?.children[0]?.data;
      
      if (!mainPost) {
        
        return false;
      }
      
      // Extract comments
      const rawComments = json[1]?.data?.children || [];
      
      // Check if post should be blacklisted
      if (isPostBlacklisted({ author: mainPost.author })) {
        
        return false;
      }

      // Format for caching
      const cachedPost = {
        id: mainPost.id,
        subreddit: mainPost.subreddit,
        title: mainPost.title,
        author: mainPost.author,
        selftext: mainPost.selftext || "",
        imageUrl: extractImageUrl(mainPost),
        postType: "thread",
        comments: [],
        snippets: []
      };
      
      // Process comments - get up to 15 to find at least 5 with snippets
      const topComments = rawComments
        .filter(c => c.kind === "t1" && c.data && c.data.author !== "[deleted]")
        .slice(0, 15);
      
      let snippetCount = 0;
      
      // Process each comment
      for (const comment of topComments) {
        const c = comment.data;
        
        // Skip deleted comments
        if (!c.body || c.body === "[removed]" || c.body === "[deleted]") {
          continue;
        }
        
        // Check if comment might have a snippet
        const hasSnippet = isUsableSnippetComment(c.body || "");
        
        // Create comment object
        const commentObj = {
          id: c.id,
          author: c.author,
          body: removeLinks(c.body || ""),
          hasSnippet: false,
          replies: []
        };
        
        // If has snippet, search for song
        if (hasSnippet) {
          const query = c.body.substring(0, 40).trim();
          const songs = await searchAppleMusic(query);
          const song = songs[0];
          
          if (song) {
            // Found a match in Apple Music
            snippetCount++;
            
            // Store snippet info
            cachedPost.snippets.push({
              commentId: c.id,
              query,
              songName: song.attributes.name,
              artistName: song.attributes.artistName,
              artworkUrl: song.attributes.artwork?.url.replace("{w}", "300").replace("{h}", "300") || null,
              previewUrl: song.attributes.previews?.[0]?.url || null
            });
            
            // Mark comment as having snippet
            commentObj.hasSnippet = true;
          }
        }
        
        // Process replies to this comment
        if (c.replies?.data?.children) {
          const childReplies = c.replies.data.children
            .filter(r => r.kind === "t1" && r.data && r.data.author !== "[deleted]")
            .slice(0, 8); // Store up to 8 replies
          
          commentObj.replies = childReplies.map(reply => ({
            id: reply.data.id,
            author: reply.data.author,
            body: removeLinks(reply.data.body || ""),
            hasSnippet: false
          }));
        }
        
        // Add to cached post
        cachedPost.comments.push(commentObj);
        
        // If we have 10 comments and at least 5 with snippets, we're done
        if (cachedPost.comments.length >= 10 && snippetCount >= 5) {
          break;
        }
      }
      
      // Write to file - using absolute path
      const filename = path.join(cacheDir, `${postId}.json`);
      fs.writeFileSync(filename, JSON.stringify(cachedPost, null, 2));
      
      
      return true;
    } catch  {
      
      return false;
    }
  })();
}


async function getSnippetRecommendations(comments, minSnippets = MIN_SNIPPETS_PER_THREAD) {
  const snippetRecommendations = [];
  const processedCommentIds = new Set();
  
  // First pass: try comments that look like they have song recommendations (contain "-")
  for (const comment of comments) {
    if (snippetRecommendations.length >= minSnippets) break;
    
    const body = comment.data?.body || "";
    const commentId = comment.data?.id;
    
    if (processedCommentIds.has(commentId)) continue;
    
    if (isUsableSnippetComment(body)) {
      processedCommentIds.add(commentId);
      const query = body.substring(0, 40).trim();
      
      const songs = await searchAppleMusic(query);
      const song = songs[0];
      if (song) {
        
        const artworkRaw = song.attributes.artwork?.url || null;
        const artworkUrl = artworkRaw
          ? artworkRaw.replace("{w}", "300").replace("{h}", "300").replace("{f}", "jpg")
          : null;
        const previewUrl = song.attributes.previews?.[0]?.url || null;
        const cached = await cacheMediaForSong(song.id, artworkUrl, previewUrl);
        const finalArtworkUrl = cached.artworkPath || artworkUrl;
        const finalPreviewUrl = cached.previewPath || previewUrl;

        snippetRecommendations.push({
          commentId: commentId,
          query,
          snippetData: song,
          author: comment.data.author,
          timestamp: comment.data.created_utc,
          songName: song.attributes.name,
          artistName: song.attributes.artistName,
          artworkUrl: finalArtworkUrl,
          previewUrl: finalPreviewUrl,
          artistImage: cached.artworkPath || (artworkRaw
            ? artworkRaw.replace("{w}", "100").replace("{h}", "100").replace("{f}", "jpg")
            : null),
        });
      }
    }
  }
  
  // Second pass: if we still don't have enough snippets, try broader extraction from remaining comments
  if (snippetRecommendations.length < minSnippets) {
    
    
    for (const comment of comments) {
      if (snippetRecommendations.length >= minSnippets) break;
      
      const body = comment.data?.body || "";
      const commentId = comment.data?.id;
      
      if (processedCommentIds.has(commentId)) continue;
      if (!body || body === "[removed]" || body === "[deleted]") continue;
      if (body.length < 5) continue; // Skip very short comments
      
      processedCommentIds.add(commentId);
      
      // Try to extract a song query from the comment text
      // Look for patterns like "Artist - Song" or just use the first part
      let query = "";
      
      // Try to find "Artist - Song" or "Song by Artist" patterns
      const dashMatch = body.match(/([^-\n]{2,30})\s*[-–—]\s*([^-\n]{2,40})/);
      const byMatch = body.match(/(.{2,40})\s+by\s+(.{2,30})/i);
      
      if (dashMatch) {
        query = `${dashMatch[1].trim()} - ${dashMatch[2].trim()}`;
      } else if (byMatch) {
        query = `${byMatch[1].trim()} - ${byMatch[2].trim()}`;
      } else {
        // Fallback: use first 40 chars
        query = body.substring(0, 40).trim();
      }
      
      if (query.length < 5) continue;
      
      
      const songs = await searchAppleMusic(query);
      const song = songs[0];
      
      if (song) {
        
        const artworkRaw = song.attributes.artwork?.url || null;
        const artworkUrl = artworkRaw
          ? artworkRaw.replace("{w}", "300").replace("{h}", "300").replace("{f}", "jpg")
          : null;
        const previewUrl = song.attributes.previews?.[0]?.url || null;
        const cached = await cacheMediaForSong(song.id, artworkUrl, previewUrl);
        const finalArtworkUrl = cached.artworkPath || artworkUrl;
        const finalPreviewUrl = cached.previewPath || previewUrl;

        snippetRecommendations.push({
          commentId: commentId,
          query,
          snippetData: song,
          author: comment.data.author,
          timestamp: comment.data.created_utc,
          songName: song.attributes.name,
          artistName: song.attributes.artistName,
          artworkUrl: finalArtworkUrl,
          previewUrl: finalPreviewUrl,
          artistImage: cached.artworkPath || (artworkRaw
            ? artworkRaw.replace("{w}", "100").replace("{h}", "100").replace("{f}", "jpg")
            : null),
        });
      }
    }
  }
  
  
  
  // DEBUG: Log artwork URLs being returned
  snippetRecommendations.forEach((_s, _i) => { /* intentionally empty */ });
  
  return snippetRecommendations;
}

// Add to server.js

// Function to cache a post and its comments to a JSON file
// Add this function to server.js
// Fixes for server.js caching function




// Add these endpoints to server.js

// Endpoint to trigger caching
// Replace the existing /api/posts/:postId/cache endpoint
app.get("/api/posts/:postId/cache", async (_req, res) => {
  // Return that the post is already cached even if it's not
  // This prevents the client from trying to cache new posts
  return res.json({ 
    success: true, 
    message: "Caching disabled", 
    cached: true 
  });
});

// =========================
// GET /api/posts  (updated)
// =========================
app.get("/api/posts", postsLimiter, async (_req, res) => {
  try {
    // Get all cached posts first
    
    const cacheDir = path.resolve(__dirname, './cached_posts');
    let cachedPostsData = [];
    
    if (fs.existsSync(cacheDir)) {
      try {
        const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
        
        
        cachedPostsData = files.map(file => {
          try {
            const filePath = path.join(cacheDir, file);
            
            const fileContents = fs.readFileSync(filePath, 'utf8');
            const postData = JSON.parse(fileContents);
            return {
              id: postData.id,
              title: postData.title,
              author: postData.author,
              subreddit: postData.subreddit,
              selftext: postData.selftext || "",
              imageUrl: postData.imageUrl,
              postType: postData.postType || "thread",
              createdUtc: postData.createdUtc || Date.now()/1000,
              hasCachedData: true,
              num_comments: postData.comments?.length || 0
            };
          } catch  {
            
            return null;
          }
        }).filter(post => post !== null);
      } catch  { /* intentionally empty */ }
    }
    
    // If we have enough cached posts, use them exclusively
    if (cachedPostsData.length >= 5) {
      
      
      // Force at least one groupchat post type even from non-groupchat data
      const hasGroupChat = cachedPostsData.some(post => post.postType === "groupchat");
      
      // Explicitly look for group chat files by name pattern
      const explicitGroupChats = cachedPostsData.filter(post => 
        post.id.startsWith('groupchat') || 
        (post.subreddit === "musicsuggestions" && post.num_comments >= 5)
      );
      
      if (explicitGroupChats.length > 0) {
        explicitGroupChats.forEach(post => {
          post.postType = "groupchat";
        });
        
      } else if (!hasGroupChat) {
        // Try to find at least one post that can be marked as a group chat (has comments)
        const potentialGroupChat = cachedPostsData.find(post => post.num_comments >= 5);
        if (potentialGroupChat) {
          
          potentialGroupChat.postType = "groupchat";
        }
      }
      
      // Make sure we have some news threads
      const newsThreads = cachedPostsData.filter(post => post.postType === "news");
      if (newsThreads.length < 2) {
        // Mark some threads as news
        const regularThreads = cachedPostsData.filter(post => 
          post.postType !== "groupchat" && post.postType !== "news"
        );
        
        // Convert 2-3 regular threads to news
        const numToConvert = Math.min(3, regularThreads.length);
        for (let i = 0; i < numToConvert; i++) {
          if (regularThreads[i]) {
            
            regularThreads[i].postType = "news";
          }
        }
      }
      
      // Sort posts to prioritize groupchats and news
      cachedPostsData.sort((a, b) => {
        // Group chats first
        if (a.postType === 'groupchat' && b.postType !== 'groupchat') return -1;
        if (a.postType !== 'groupchat' && b.postType === 'groupchat') return 1;
        
        // Then news
        if (a.postType === 'news' && b.postType !== 'news') return -1;
        if (a.postType !== 'news' && b.postType === 'news') return 1;
        
        // Then by timestamp (newest first)
        return b.createdUtc - a.createdUtc;
      });
      
      // Update the cache
      cachedPosts = cachedPostsData;
      lastFetchTime = Date.now();
      
      
      const _typeCounts = cachedPosts.reduce((acc, post) => {
        acc[post.postType] = (acc[post.postType] || 0) + 1;
        return acc;
      }, {});
      
      
      return res.json({ success: true, data: cachedPosts });
    }
    
    // If we don't have enough cached posts, follow regular process
    const now = Date.now();
    if (cachedPosts.length > 0 && (now - lastFetchTime < CACHE_TTL_MS)) {
      
      return res.json({ success: true, data: cachedPosts });
    }
    
    
    const newPosts = await fetchAllSubreddits();
    
    // Merge with any cached posts we found
    if (cachedPostsData.length > 0) {
      // Add the cached posts and deduplicate
      const allPosts = [...cachedPostsData, ...newPosts];
      cachedPosts = deduplicatePosts(allPosts);
    } else {
      cachedPosts = newPosts;
    }
    
    lastFetchTime = now;
    return res.json({ success: true, data: cachedPosts });
  } catch (err) {
    
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// Also update the cached-posts endpoint to use the correct path
app.get("/api/cached-posts", (_req, res) => {
  try {
    const cacheDir = path.resolve(__dirname, './cached_posts');
    
    
    if (!fs.existsSync(cacheDir)) {
      
      return res.json({ success: true, data: [] });
    }
    
    const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
    
    
    const cachedPostIds = files.map(f => f.replace('.json', ''));
    
    const cachedPosts = cachedPostIds.map(id => {
      try {
        const filePath = path.join(cacheDir, `${id}.json`);
        
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContents);
        return {
          id: data.id,
          title: data.title,
          author: data.author,
          subreddit: data.subreddit,
          hasCachedData: true,
          num_comments: data.comments?.length || data.num_comments || 0,
          commentCount: data.comments?.length || 0,
          snippetCount: data.snippets?.length || 0,
          imageUrl: data.imageUrl,
          postType: data.postType || "thread",
          createdUtc: data.createdUtc || Date.now()/1000
        };
      } catch  {
        
        return { id, error: true };
      }
    });
    
    
    return res.json({ success: true, data: cachedPosts });
  } catch (error) {
    
    return res.status(500).json({ success: false, error: error.toString() });
  }
});

function findCachedFilePathById(postId) {
  const cacheDir = path.resolve(__dirname, "./cached_posts");
  if (!fs.existsSync(cacheDir)) return null;

  const normalized = postId?.startsWith("t3_") ? postId.slice(3) : postId;

  const direct1 = path.join(cacheDir, `${postId}.json`);
  if (fs.existsSync(direct1)) return direct1;

  const direct2 = path.join(cacheDir, `${normalized}.json`);
  if (fs.existsSync(direct2)) return direct2;

  const files = fs.readdirSync(cacheDir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    try {
      const fp = path.join(cacheDir, f);
      const data = JSON.parse(fs.readFileSync(fp, "utf8"));
      const fileBase = f.replace(".json", "");
      const dataId = data?.id;

      if (
        fileBase === postId ||
        fileBase === normalized ||
        dataId === postId ||
        dataId === normalized ||
        `t3_${dataId}` === postId
      ) {
        return fp;
      }
    } catch {
      // ignore bad file
    }
  }

  return null;
}

async function loadCachedPostWithRepairedMedia(postId) {
  const cacheKey = String(postId || "").trim();
  if (!cacheKey) {
    return null;
  }

  if (repairedCachedPostsCache.has(cacheKey)) {
    return repairedCachedPostsCache.get(cacheKey);
  }

  const repairPromise = Promise.resolve().then(async () => {
    const filePath = findCachedFilePathById(cacheKey);
    if (!filePath) {
      return null;
    }

    const cachedPost = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return repairCachedPostMedia(cachedPost);
  }).catch((error) => {
    repairedCachedPostsCache.delete(cacheKey);
    throw error;
  });

  repairedCachedPostsCache.set(cacheKey, repairPromise);
  return repairPromise;
}

// Also update the get specific cached post endpoint
app.get("/api/cached-posts/:postId", async (req, res) => {
  const { postId } = req.params;
  
  try {
    const cachedPost = await loadCachedPostWithRepairedMedia(postId);
    if (!cachedPost) {
      return res.status(404).json({ success: false, message: "Cached post not found" });
    }

    return res.json({ success: true, data: cachedPost });
  } catch (error) {
    
    return res.status(500).json({ success: false, error: error.toString() });
  }
});

// =========================
// ENHANCED /api/refresh
// Force a complete refresh with different posts
// =========================

app.get("/api/refresh", heavyLimiter, async (req, res) => {
  try {
    const key = process.env.REFRESH_KEY;
    if (key && req.header("x-refresh-key") !== key) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Clear cache and force refresh
    forceRefreshCachedPosts();
    
    // Fetch completely fresh data
    
    const newPosts = await fetchAllSubreddits();
    
    // Apply additional randomization for more diversity
    const shuffledPosts = [...newPosts];
    for (let i = 0; i < 3; i++) {
      shuffleArray(shuffledPosts); // Triple shuffle for maximum randomness
    }
    
    // Update the cache
    cachedPosts = shuffledPosts;
    lastFetchTime = Date.now();
    
    return res.json({ 
      success: true, 
      data: cachedPosts,
      message: "Successfully refreshed with new diverse posts"
    });
  } catch (err) {
    
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// Add a new endpoint for specifically requesting diverse posts
app.get("/api/diverse-posts", heavyLimiter, async (_req, res) => {
  try {
    
    
    // First, get all cached posts
    const cacheDir = path.resolve(__dirname, './cached_posts');
    
    let cachedPostsData = [];
    
    if (fs.existsSync(cacheDir)) {
      try {
        
        const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
        
        
        cachedPostsData = files.map(file => {
          try {
            const filePath = path.join(cacheDir, file);
            
            const fileContents = fs.readFileSync(filePath, 'utf8');
            const postData = JSON.parse(fileContents);
            return {
              id: postData.id,
              title: postData.title,
              author: postData.author,
              subreddit: postData.subreddit,
              selftext: postData.selftext || "",
              imageUrl: postData.imageUrl,
              postType: postData.postType || "thread",
              createdUtc: postData.createdUtc || Date.now()/1000,
              hasCachedData: true,
              num_comments: postData.comments?.length || 0,
              // Give cached posts a high diversity score to prioritize them
              diversityScore: 2.0 + (Math.random() * 0.5)
            };
          } catch  {
            
            return null;
          }
        }).filter(post => post !== null);
      } catch  { /* intentionally empty */ }
    }
    
    // Now fetch fresh posts for additional diversity
    const allFreshPosts = await fetchAllSubreddits();
    
    // Apply special diversity ranking algorithm to fresh posts
    const rankedFreshPosts = allFreshPosts.map(post => {
      // Calculate diversity score (subreddit variety + engagement quality)
      const subredditFactor = post.subreddit === "music" ? 0.8 :
                              post.subreddit === "musicsuggestions" ? 0.7 : 1.2;
      
      // Penalize extremely high upvote/comment counts to avoid domination
      const engagementDiversity = Math.min(300, post.ups) / 300 + 
                                Math.min(50, post.num_comments) / 50;
                                
      return {
        ...post,
        diversityScore: subredditFactor * engagementDiversity * (0.8 + Math.random() * 0.4)
      };
    });
    
    // Mark group chats appropriately in cached posts
    const explicitGroupChats = cachedPostsData.filter(post => 
      post.id.startsWith('groupchat') || 
      (post.subreddit === "musicsuggestions" && post.num_comments >= 5)
    );
    
    if (explicitGroupChats.length > 0) {
      explicitGroupChats.forEach(post => {
        post.postType = "groupchat";
        // Give group chats extra priority
        post.diversityScore += 0.5;
      });
      
    }
    
    // Combine cached and fresh posts (exclude parameter posts)
    const allPosts = [...cachedPostsData, ...rankedFreshPosts].filter(
      post => post.postType !== "parameter"
    );
    
    // Deduplicate posts
    const uniquePosts = deduplicatePosts(allPosts);
    
    // Sort by diversity score
    uniquePosts.sort((a, b) => b.diversityScore - a.diversityScore);
    
    // Take top results but prioritize specific types at the top
    const topPosts = uniquePosts.slice(0, 50);
    
    // Sort to prioritize cached posts, group chats and news
    topPosts.sort((a, b) => {
      // Cached posts first
      if (a.hasCachedData && !b.hasCachedData) return -1;
      if (!a.hasCachedData && b.hasCachedData) return 1;
      
      // Then group chats
      if (a.postType === 'groupchat' && b.postType !== 'groupchat') return -1;
      if (a.postType !== 'groupchat' && b.postType === 'groupchat') return 1;
      
      // Then news
      if (a.postType === 'news' && b.postType !== 'news') return -1;
      if (a.postType !== 'news' && b.postType === 'news') return 1;
      
      // Then by timestamp (newest first)
      return b.createdUtc - a.createdUtc;
    });
    
    // Update the cache with these diverse posts (interleave to avoid long type streaks)
    const interleavedPosts = interleavePostsByType(topPosts);
    cachedPosts = interleavedPosts.slice(0, 40);
    lastFetchTime = Date.now();
    
    // Log post type counts
    const _typeCounts = cachedPosts.reduce((acc, post) => {
      acc[post.postType] = (acc[post.postType] || 0) + 1;
      return acc;
    }, {});
    
    
    const _cachedCount = cachedPosts.filter(p => p.hasCachedData).length;
    
    
    return res.json({ 
      success: true, 
      data: cachedPosts,
      message: "Fetched highly diverse post mix with cached content prioritized"
    });
  } catch (err) {
    
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// Add new endpoint to check cache status
app.get("/api/cache-status", (_req, res) => {
  const now = Date.now();
  const cacheAge = now - lastFetchTime;
  const cacheExpired = cacheAge > CACHE_TTL_MS;
  
  // Calculate Apple Music cache stats
  const appleMusicCacheEntries = Object.keys(appleMusicQueryCache).length;
  let appleMusicCacheHits = 0;
  let appleMusicCacheOldest = null;
  let appleMusicCacheNewest = null;
  
  for (const key of Object.keys(appleMusicQueryCache)) {
    const entry = appleMusicQueryCache[key];
    if (entry.data && entry.data.length > 0) appleMusicCacheHits++;
    if (!appleMusicCacheOldest || entry.timestamp < appleMusicCacheOldest) {
      appleMusicCacheOldest = entry.timestamp;
    }
    if (!appleMusicCacheNewest || entry.timestamp > appleMusicCacheNewest) {
      appleMusicCacheNewest = entry.timestamp;
    }
  }
  
  // Calculate snippets cache stats
  const snippetsCacheEntries = Object.keys(snippetsCache).length;
  
  return res.json({
    success: true,
    data: {
      posts: {
        cacheAge: Math.floor(cacheAge / 1000),
        ttl: Math.floor(CACHE_TTL_MS / 1000),
        isExpired: cacheExpired,
        postCount: cachedPosts.length
      },
      snippets: {
        cachedPosts: snippetsCacheEntries,
        ttlMinutes: Math.floor(SNIPPET_CACHE_TTL_MS / 60000)
      },
      appleMusic: {
        queriesCached: appleMusicCacheEntries,
        queriesWithResults: appleMusicCacheHits,
        ttlHours: Math.floor(APPLE_MUSIC_QUERY_CACHE_TTL_MS / 3600000),
        oldestEntryAgeHours: appleMusicCacheOldest ? Math.floor((now - appleMusicCacheOldest) / 3600000) : null,
        newestEntryAgeMinutes: appleMusicCacheNewest ? Math.floor((now - appleMusicCacheNewest) / 60000) : null
      },
      config: {
        minSnippetsPerThread: MIN_SNIPPETS_PER_THREAD
      }
    }
  });
});

// New endpoint for browsing groupchats and news posts only
app.get("/api/browse-posts", async (_req, res) => {
  try {
    
    
    // Fetch fresh data from Reddit
    const musicPosts = await fetchSubreddit("music");  // These become news posts
    const musicSuggestionsPosts = await fetchSubreddit("musicsuggestions");  // Popular ones become groupchats
    
    // Filter and process posts - force mark music posts as news
    let newsPosts = musicPosts
      .map(post => ({
        ...post,
        postType: "news" // Force mark all music subreddit posts as news
      }))
      .slice(0, 8); // Get 8 news posts
    
    let groupchatPosts = musicSuggestionsPosts
      .filter(post => post.num_comments >= 8) // Posts with good engagement
      .map(post => ({
        ...post,
        postType: "groupchat" // Force mark as groupchat
      }))
      .slice(0, 8); // Get 8 potential groupchats
    
    // Combine and shuffle
    const browsePosts = [...newsPosts, ...groupchatPosts];
    shuffleArray(browsePosts);
    
    
    
    return res.json({ 
      success: true, 
      data: browsePosts,
      breakdown: {
        news: newsPosts.length,
        groupchats: groupchatPosts.length
      }
    });
  } catch (err) {
    
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// New endpoint to cache a selected post
app.post("/api/cache-post", async (req, res) => {
  try {
    const { postId, subreddit, postType } = req.body;
    
    if (!postId || !subreddit) {
      return res.status(400).json({ success: false, error: "Missing postId or subreddit" });
    }
    
    
    
    // Use the existing caching function but modify the postType
    const success = await cachePostToJson(postId, subreddit);
    
    if (success) {
      // Read the cached file and update the postType
      const cacheDir = path.resolve(__dirname, './cached_posts');
      const filename = path.join(cacheDir, `${postId}.json`);
      
      try {
        const cachedData = JSON.parse(fs.readFileSync(filename, 'utf8'));
        cachedData.postType = postType || cachedData.postType;
        fs.writeFileSync(filename, JSON.stringify(cachedData, null, 2));
        
        
        return res.json({ 
          success: true, 
          message: `Post ${postId} cached successfully as ${postType}`,
          postId 
        });
      } catch  {
        
        return res.json({ 
          success: true, 
          message: `Post ${postId} cached but could not update post type` 
        });
      }
    } else {
      return res.status(500).json({ 
        success: false, 
        error: `Failed to cache post ${postId}` 
      });
    }
  } catch (err) {
    
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// Call this function on server start to ensure first request gets fresh data
forceRefreshCachedPosts();

function findPostByIdWithFallback(postId) {
  const mem = cachedPosts.find((p) => p.id === postId);
  if (mem) return mem;

  try {
    const filePath = path.resolve(__dirname, "./cached_posts", `${postId}.json`);
    if (!fs.existsSync(filePath)) return null;

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      id: data.id,
      subreddit: data.subreddit,
      postType: data.postType || "thread",
    };
  } catch  {
    
    return null;
  }
}

async function resolvePostForId(postId) {
  const fromCache = findPostByIdWithFallback(postId);
  if (fromCache) return fromCache;

  try {
    const url = `https://www.reddit.com/comments/${postId}.json?limit=1`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "mufl-threads/1.0 (prototype)",
        "Accept": "application/json",
      },
    });
    if (!resp.ok) return null;
    const json = await resp.json();

    const postData =
      Array.isArray(json) &&
      json[0]?.data?.children?.[0]?.data
        ? json[0].data.children[0].data
        : null;

    if (!postData) return null;

    const subreddit = postData.subreddit;
    const numComments = postData.num_comments || 0;
    const postType =
      subreddit === "musicsuggestions" && numComments >= 8 ? "groupchat" : "thread";

    return { id: postId, subreddit, postType };
  } catch  {
    
    return null;
  }
}

app.get("/api/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const querySubreddit = (req.query.subreddit || "").toString().trim();
  const queryPostType = (req.query.postType || "").toString().trim();

  let post = null;
  if (querySubreddit) {
    post = { id: postId, subreddit: querySubreddit, postType: queryPostType || "thread" };
  } else {
    post = await resolvePostForId(postId);
  }

  // If we still can't resolve, return an empty result (NOT a 404)
  if (!post) {
    return res.json({ success: true, data: [], unresolved: true });
  }

  if (post.postType === "news" || post.postType === "parameter") {
    
    return res.json({ success: true, data: [], skipped: true, reason: post.postType });
  }

  // Respect an explicit postType from the caller. Only infer groupchat by subreddit
  // when no explicit type was provided.
  const normalizedPostType = (post.postType || "").toString().toLowerCase();
  const hasExplicitPostType = queryPostType.length > 0;
  const isGroupchat = normalizedPostType === "groupchat" || (!hasExplicitPostType && post.subreddit === "musicsuggestions");

  // Check if we have a fresh cache entry
  const cacheEntry = commentsCache[postId];
  const now = Date.now();
  if (
    cacheEntry &&
    (now - cacheEntry.timestamp < COMMENT_CACHE_TTL_MS)
  ) {
    
    return res.json({ success: true, data: cacheEntry.data });
  }

  // Prefer local cached post comments before making external Reddit requests.
  try {
    const cachedPost = await loadCachedPostWithRepairedMedia(postId);
    if (cachedPost && Array.isArray(cachedPost.comments) && cachedPost.comments.length > 0) {
      const cachedComments = cachedPost.comments;
      const finalData = isGroupchat
        ? {
            topLevel: cachedComments.slice(0, 15),
            replies: cachedComments.flatMap((comment) =>
              (Array.isArray(comment.replies) ? comment.replies : []).map((reply) => ({
                ...reply,
                parentId: reply.parentId || comment.id,
                parentAuthor: reply.parentAuthor || comment.author,
              }))
            ),
          }
        : cachedComments
            .slice(0, 18)
            .map((comment) => ({
              ...comment,
              body: removeLinks(comment.body),
              replies: Array.isArray(comment.replies)
                ? comment.replies.map((reply) => ({
                    ...reply,
                    body: removeLinks(reply.body),
                  }))
                : [],
            }));

      commentsCache[postId] = {
        data: finalData,
        timestamp: now,
      };

      return res.json({ success: true, data: finalData, cached: true, source: "cached-post" });
    }
  } catch  {
    // Fall through to live Reddit fetch.
  }

  // Not cached or stale. Let's fetch from Reddit
  const commentLimit = isGroupchat ? 50 : 18;
  const commentsUrl = `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}.json?limit=${commentLimit}&raw_json=1`;

  try {
    const fetchResp = await fetch(commentsUrl, {
      headers: {
        "User-Agent": "mufl-threads/1.0 (prototype)",
        "Accept": "application/json",
      },
    });
    if (!fetchResp.ok) {
      
      // If needed, store an empty result in the cache to avoid repeated attempts
      commentsCache[postId] = { data: [], timestamp: now };
      // Return an empty array or handle gracefully
      return res.json({ success: true, data: [] });
    }

    const json = await fetchResp.json();
    const rawComments = 
      Array.isArray(json) &&
      json.length > 1 &&
      json[1].data &&
      Array.isArray(json[1].data.children)
        ? json[1].data.children
        : [];

    let finalData;
    if (isGroupchat) {
      // Flatten logic, same as your code
      const flattened = flattenRedditComments(rawComments, 2);
      let topLevel = flattened.filter(c => !c.parentId).slice(0, 15);
      let replies = flattened.filter(c => c.parentId);
      finalData = { topLevel, replies };
    } else {
      // Normalize to the lightweight shape the frontend expects
      const flattened = flattenRedditComments(rawComments, 1)
        .map((c) => ({
          ...c,
          body: removeLinks(c.body),
        }));

      const repliesByParent = {};
      for (const c of flattened) {
        if (!c.parentId) continue;
        if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
        repliesByParent[c.parentId].push(c);
      }

      const topLevel = flattened
        .filter((c) => !c.parentId)
        .slice(0, 18)
        .map((c) => ({
          ...c,
          replies: repliesByParent[c.id] || [],
        }));

      finalData = topLevel;
    }

    // Store in cache
    commentsCache[postId] = {
      data: finalData,
      timestamp: now,
    };

    return res.json({ success: true, data: finalData });

  } catch (err) {
    commentsCache[postId] = { data: [], timestamp: now };
    return res.json({ success: true, data: [], degraded: true, error: err.toString() });
  }
});

app.get("/api/posts/:postId/snippets", async (req, res) => {
  const { postId } = req.params;
  const queryPostType = (req.query.postType || "").toString().trim();

  try {
    const cachedPost = await loadCachedPostWithRepairedMedia(postId);
    if (cachedPost && Array.isArray(cachedPost.snippets)) {
      snippetsCache[postId] = {
        data: cachedPost.snippets,
        timestamp: Date.now(),
      };
      return res.json({ success: true, data: cachedPost.snippets, cached: true, source: "cached-post" });
    }
  } catch  { /* intentionally empty */ }

  // Allow snippets for posts that aren't in our in-memory cache (e.g. loaded via the Reddit button)
  // by resolving basic post info from Reddit on-demand.
  const post = findPostByIdWithFallback(postId) || await resolvePostForId(postId);
  if (!post) {
    return res.json({ success: true, data: [], unresolved: true, postType: queryPostType || undefined });
  }

  // Skip news and parameter threads - they don't need music snippets
  if (post.postType === "news" || post.postType === "parameter") {
    
    return res.json({ success: true, data: [], skipped: true, reason: post.postType });
  }

  const now = Date.now();
  const cacheEntry = snippetsCache[postId];
  
  // Check per-post snippet cache (10-15 minute TTL)
  if (cacheEntry && cacheEntry.timestamp && now - cacheEntry.timestamp < SNIPPET_CACHE_TTL_MS) {
    const _cacheAgeMin = Math.round((now - cacheEntry.timestamp) / 60000);
    
    return res.json({ success: true, data: cacheEntry.data || [], cached: true });
  }

  
  const commentsUrl = `https://www.reddit.com/comments/${postId}.json?limit=60&raw_json=1`;
  try {
    const fetchResp = await fetch(commentsUrl, {
      headers: {
        "User-Agent": "mufl-threads/1.0 (prototype)",
        "Accept": "application/json",
      },
    });
    if (!fetchResp.ok) {
      
      snippetsCache[postId] = { data: [], timestamp: now };
      return res.json({ success: true, data: [] });
    }
    let json;
    try {
      json = await fetchResp.json();
    } catch  {
      
      json = null;
    }
    const comments =
      json && Array.isArray(json) && json.length > 1 && json[1].data && Array.isArray(json[1].data.children)
        ? json[1].data.children
        : [];
    
    
    const snippetRecommendations = await getSnippetRecommendations(comments, MIN_SNIPPETS_PER_THREAD);
    
    // Cache the results
    snippetsCache[postId] = { data: snippetRecommendations, timestamp: now };
    
    
    return res.json({ success: true, data: snippetRecommendations });
  } catch (err) {
    
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

app.get("/api/apple-music-search", async (req, res) => {
  const query = req.query.query;
  const limit = req.query.limit;
  if (!query) {
    return res.status(400).json({ success: false, error: "Missing query parameter" });
  }

  try {
    const results = await searchAppleMusic(query, limit);
    if (results.length > 0) {
      return res.json({ success: true, data: results });
    }
    return res.json({ success: false, message: "No results found." });
  } catch  {
    
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.post("/api/apple-music-artist-images", heavyLimiter, async (req, res) => {
  const incomingArtists = Array.isArray(req.body?.artists) ? req.body.artists : [];
  const refresh = Boolean(req.body?.refresh);
  const cleanedArtists = [...new Set(
    incomingArtists
      .map((name) => String(name || "").trim())
      .filter((name) => name.length > 0)
  )].slice(0, 80);

  if (cleanedArtists.length === 0) {
    return res.status(400).json({ success: false, error: "Missing artists array in request body." });
  }

  if (!APPLE_DEVELOPER_TOKEN || !APPLE_API_BASE_URL) {
    return res.status(500).json({ success: false, error: "Apple Music API credentials are missing." });
  }

  const data = {};
  let cacheChanged = false;

  try {
    for (let i = 0; i < cleanedArtists.length; i++) {
      const artistName = cleanedArtists[i];
      const key = normalizeArtistKey(artistName);
      const cachedEntry = artistImageCache[key];

      if (!refresh && cachedEntry) {
        data[artistName] = cachedEntry.imageUrl || null;
        continue;
      }

      const fetched = await fetchArtistImageFromAppleMusic(artistName);
      if (fetched?.imageUrl) {
        data[artistName] = fetched.imageUrl;
        artistImageCache[key] = {
          requestName: artistName,
          artistName: fetched.artistName || artistName,
          artistId: fetched.artistId,
          imageUrl: fetched.imageUrl,
          source: fetched.source,
          updatedAt: new Date().toISOString(),
        };
        cacheChanged = true;
      } else {
        data[artistName] = null;
        artistImageCache[key] = {
          requestName: artistName,
          artistName,
          artistId: null,
          imageUrl: null,
          source: "unresolved",
          updatedAt: new Date().toISOString(),
        };
        cacheChanged = true;
      }

      if (ARTIST_IMAGE_REQUEST_DELAY_MS > 0 && i < cleanedArtists.length - 1) {
        await sleep(ARTIST_IMAGE_REQUEST_DELAY_MS);
      }
    }

    if (cacheChanged) {
      saveArtistImageCacheToDisk(artistImageCache);
    }

    return res.json({
      success: true,
      data,
      meta: {
        requested: cleanedArtists.length,
        resolved: Object.values(data).filter(Boolean).length,
        cacheFile: path.basename(ARTIST_IMAGE_CACHE_FILE),
      },
    });
  } catch  {
    
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.post("/api/apple-music-album-artworks", heavyLimiter, async (req, res) => {
  const incomingTracks = Array.isArray(req.body?.tracks) ? req.body.tracks : [];
  const refresh = Boolean(req.body?.refresh);

  const normalizedInput = incomingTracks
    .map((track) => ({
      songName: String(track?.songName || "").trim(),
      artistName: String(track?.artistName || "").trim(),
    }))
    .filter((track) => track.songName.length > 0 && track.artistName.length > 0);

  const dedupedTracks = [];
  const seenTrackKeys = new Set();
  for (const track of normalizedInput) {
    const cacheKey = normalizeTrackCacheKey(track.songName, track.artistName);
    if (seenTrackKeys.has(cacheKey)) continue;
    seenTrackKeys.add(cacheKey);
    dedupedTracks.push(track);
  }

  const cleanedTracks = dedupedTracks.slice(0, 120);

  if (cleanedTracks.length === 0) {
    return res.status(400).json({ success: false, error: "Missing tracks array in request body." });
  }

  if (!APPLE_DEVELOPER_TOKEN || !APPLE_API_BASE_URL) {
    return res.status(500).json({ success: false, error: "Apple Music API credentials are missing." });
  }

  const data = {};
  let cacheChanged = false;

  try {
    for (let i = 0; i < cleanedTracks.length; i++) {
      const track = cleanedTracks[i];
      const requestKey = createTrackRequestKey(track.songName, track.artistName);
      const cacheKey = normalizeTrackCacheKey(track.songName, track.artistName);
      const cachedEntry = albumArtworkCache[cacheKey];

      if (!refresh && cachedEntry) {
        data[requestKey] = {
          songName: track.songName,
          artistName: track.artistName,
          artworkUrl: cachedEntry.artworkUrl || null,
          albumName: cachedEntry.albumName || "",
          previewUrl: cachedEntry.previewUrl || null,
          source: cachedEntry.source || "cache",
        };
        continue;
      }

      const query = `${track.songName} ${track.artistName}`.trim();
      const songs = await searchAppleMusic(query, 8);
      const best = chooseBestSongMatch(songs, track.songName, track.artistName);

      if (best) {
        const artworkUrl = buildAppleArtworkUrl(best?.attributes?.artwork?.url, 300);
        const previewUrl = best?.attributes?.previews?.[0]?.url || null;
        const albumName = best?.attributes?.albumName || "";
        const matchedSongName = best?.attributes?.name || track.songName;
        const matchedArtistName = best?.attributes?.artistName || track.artistName;

        data[requestKey] = {
          songName: track.songName,
          artistName: track.artistName,
          artworkUrl: artworkUrl || null,
          albumName,
          previewUrl,
          source: "search",
        };

        albumArtworkCache[cacheKey] = {
          requestSongName: track.songName,
          requestArtistName: track.artistName,
          matchedSongName,
          matchedArtistName,
          songId: best?.id || null,
          albumName,
          artworkUrl: artworkUrl || null,
          previewUrl,
          source: "search",
          updatedAt: new Date().toISOString(),
        };
        cacheChanged = true;
      } else {
        data[requestKey] = {
          songName: track.songName,
          artistName: track.artistName,
          artworkUrl: null,
          albumName: "",
          previewUrl: null,
          source: "unresolved",
        };
        albumArtworkCache[cacheKey] = {
          requestSongName: track.songName,
          requestArtistName: track.artistName,
          matchedSongName: track.songName,
          matchedArtistName: track.artistName,
          songId: null,
          albumName: "",
          artworkUrl: null,
          previewUrl: null,
          source: "unresolved",
          updatedAt: new Date().toISOString(),
        };
        cacheChanged = true;
      }

      if (ALBUM_ARTWORK_REQUEST_DELAY_MS > 0 && i < cleanedTracks.length - 1) {
        await sleep(ALBUM_ARTWORK_REQUEST_DELAY_MS);
      }
    }

    if (cacheChanged) {
      saveAlbumArtworkCacheToDisk(albumArtworkCache);
    }

    return res.json({
      success: true,
      data,
      meta: {
        requested: cleanedTracks.length,
        resolved: Object.values(data).filter((entry) => entry?.artworkUrl).length,
        cacheFile: path.basename(ALBUM_ARTWORK_CACHE_FILE),
      },
    });
  } catch  {
    
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// New endpoint to cache media assets (artwork and audio previews)
app.post("/api/cache-media", async (req, res) => {
  try {
    const { artworkUrl, previewUrl, songId } = req.body;
    
    if (!songId) {
      return res.status(400).json({ success: false, error: "Missing songId" });
    }
    
    if (!fs.existsSync(CACHED_MEDIA_DIR)) {
      fs.mkdirSync(CACHED_MEDIA_DIR, { recursive: true });
    }
    
    const results = {
      artworkPath: artworkUrl,
      previewPath: previewUrl
    };
    
    // Cache artwork if provided
    if (artworkUrl) {
      try {
        const artworkResponse = await fetch(artworkUrl);
        if (artworkResponse.ok) {
          const buffer = await artworkResponse.arrayBuffer();
          const ext = artworkUrl.includes('.jpg') ? '.jpg' : '.png';
          const artworkPath = path.join(CACHED_MEDIA_DIR, `${songId}_artwork${ext}`);
          fs.writeFileSync(artworkPath, Buffer.from(buffer));
          results.artworkPath = `/cached_media/${songId}_artwork${ext}`;
          
        }
      } catch  { /* intentionally empty */ }
    }
    
    // Cache preview if provided
    if (previewUrl) {
      try {
        const previewResponse = await fetch(previewUrl);
        if (previewResponse.ok) {
          const buffer = await previewResponse.arrayBuffer();
          const previewPath = path.join(CACHED_MEDIA_DIR, `${songId}_preview.m4a`);
          fs.writeFileSync(previewPath, Buffer.from(buffer));
          results.previewPath = `/cached_media/${songId}_preview.m4a`;
          
        }
      } catch  { /* intentionally empty */ }
    }
    
    return res.json({
      success: true,
      ...results
    });
  } catch (error) {
    
    return res.status(500).json({ success: false, error: error.toString() });
  }
});

// Serve cached media files
app.use('/cached_media', express.static(CACHED_MEDIA_DIR));

// server.js

app.get('/api/spotify-token', heavyLimiter, async (_req, res) => {
  try {
    const token = await getSpotifyAccessToken();
    res.json({ success: true, token });
  } catch  {
    
    res.status(500).json({ success: false, error: "Failed to get token" });
  }
});

app.get('/api/spotify-artist-search', heavyLimiter, async (req, res) => {
  const rawQuery = typeof req.query.q === "string" ? req.query.q : "";
  const sanitizedQuery = rawQuery
    .normalize("NFKC")
    .split('\n').map(stripControlCharacters).join(' ')
    .replace(/[^\p{L}\p{N}\s.'\-&()]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  if (sanitizedQuery.length < 2) {
    return res.status(400).json({ success: false, error: "Query must be at least 2 characters" });
  }

  try {
    const token = await getSpotifyAccessToken();
    const searchUrl = `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(sanitizedQuery)}&limit=5`;
    const spotifyResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!spotifyResponse.ok) {
      return res.status(spotifyResponse.status).json({ success: false, error: "Spotify search failed" });
    }

    const payload = await spotifyResponse.json();
    const items = Array.isArray(payload?.artists?.items) ? payload.artists.items : [];
    const artists = items.map((artist) => ({
      id: artist.id,
      name: typeof artist.name === "string" ? artist.name.slice(0, 200) : "Unknown Artist",
      imageUrl: Array.isArray(artist.images) && artist.images.length > 0 ? artist.images[0].url : null,
      genres: Array.isArray(artist.genres) ? artist.genres.slice(0, 5) : [],
      popularity: Number.isFinite(artist.popularity) ? artist.popularity : 0,
    }));

    return res.json({ success: true, artists });
  } catch  {
    
    return res.status(500).json({ success: false, error: "Search failed" });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => { /* intentionally empty */ });

// Periodic cache cleanup function - runs every hour
function cleanupExpiredCaches() {
  const now = Date.now();
  let appleMusicCleaned = 0;
  let snippetsCleaned = 0;
  
  // Clean up expired Apple Music query cache entries
  for (const key of Object.keys(appleMusicQueryCache)) {
    const entry = appleMusicQueryCache[key];
    if (now - entry.timestamp > APPLE_MUSIC_QUERY_CACHE_TTL_MS) {
      delete appleMusicQueryCache[key];
      appleMusicCleaned++;
    }
  }
  
  // Clean up expired snippets cache entries (using a longer TTL for cleanup - 1 hour)
  const SNIPPETS_CLEANUP_TTL_MS = 60 * 60 * 1000; // 1 hour
  for (const key of Object.keys(snippetsCache)) {
    const entry = snippetsCache[key];
    if (now - entry.timestamp > SNIPPETS_CLEANUP_TTL_MS) {
      delete snippetsCache[key];
      snippetsCleaned++;
    }
  }
  
  // Clean up expired comments cache
  let commentsCleaned = 0;
  const COMMENTS_CLEANUP_TTL_MS = 30 * 60 * 1000; // 30 minutes
  for (const key of Object.keys(commentsCache)) {
    const entry = commentsCache[key];
    if (now - entry.timestamp > COMMENTS_CLEANUP_TTL_MS) {
      delete commentsCache[key];
      commentsCleaned++;
    }
  }
  
  if (appleMusicCleaned > 0 || snippetsCleaned > 0 || commentsCleaned > 0) { /* intentionally empty */ }
}

// Run cache cleanup every hour
setInterval(cleanupExpiredCaches, 60 * 60 * 1000);

// Run initial cleanup on startup
cleanupExpiredCaches();

// Check caching directory on startup
try {
  const cacheDirPath = path.resolve(__dirname, './cached_posts');
  if (!fs.existsSync(cacheDirPath)) {
    fs.mkdirSync(cacheDirPath, { recursive: true });
    
  } else {
    
    
    // Log the actual files in the directory
    const _files = fs.readdirSync(cacheDirPath).filter(f => f.endsWith('.json'));
    
  }
} catch  { /* intentionally empty */ }
