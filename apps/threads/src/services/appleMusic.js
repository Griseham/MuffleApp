import { buildApiUrl } from "../utils/api";
import cachedAlbumArtworks from "../backend/cached_album_artworks.json";
import cachedArtistImages from "../backend/cached_artist_images.json";

// Apple Music API service for parameter threads
const APPLE_MUSIC_API_BASE = buildApiUrl("/apple-music-search");
const APPLE_MUSIC_ARTIST_IMAGES_API_BASE = buildApiUrl("/apple-music-artist-images");
const APPLE_MUSIC_ALBUM_ARTWORKS_API_BASE = buildApiUrl("/apple-music-album-artworks");
const LEGACY_APPLE_MUSIC_ARTIST_IMAGES_API_BASE = buildApiUrl("/apple-music/artist-images");
const artistImagesRequestCache = new Map();
const albumArtworksRequestCache = new Map();
const TRACK_KEY_SEPARATOR = "|||";
let artistImagesEndpointAvailable = true;
let albumArtworksEndpointAvailable = true;
const artistImageDiskCache = cachedArtistImages && typeof cachedArtistImages === "object" ? cachedArtistImages : {};
const albumArtworkDiskCache = cachedAlbumArtworks && typeof cachedAlbumArtworks === "object" ? cachedAlbumArtworks : {};

async function tryParseJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function logUnavailableEndpoint(message) {
  console.warn(message);
}

/**
 * Search for a song using Apple Music API via our backend
 * @param {string} query - Search query (e.g., "Demons - Imagine Dragons")
 * @returns {Promise<Object|null>} Song data or null if not found
 */
export async function searchAppleMusic(query) {
  try {
    const response = await fetch(`${APPLE_MUSIC_API_BASE}?query=${encodeURIComponent(query)}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      const song = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!song) {
        return null;
      }
      return {
        songName: song.attributes.name,
        artistName: song.attributes.artistName,
        artworkUrl: song.attributes.artwork?.url.replace("{w}", "300").replace("{h}", "300") || null,
        previewUrl: song.attributes.previews?.[0]?.url || null,
        albumName: song.attributes.albumName || '',
        releaseDate: song.attributes.releaseDate || '',
        duration: song.attributes.durationInMillis || null
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error searching Apple Music:', error);
    return null;
  }
}

/**
 * Batch search multiple queries for parameter threads
 * @param {Array<{commentId: string, query: string}>} queries - Array of search queries
 * @returns {Promise<Array>} Array of results with commentId and song data
 */
export async function batchSearchAppleMusic(queries) {
  // Process in parallel but with a small delay to avoid rate limiting
  const promises = queries.map(async (item, index) => {
    // Add small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, index * 100));
    
    const songData = await searchAppleMusic(item.query);
    return {
      commentId: item.commentId,
      query: item.query,
      songData
    };
  });
  
  const allResults = await Promise.all(promises);
  
  // Filter out null results
  return allResults.filter(result => result.songData !== null);
}

/**
 * Extract song query from comment text for parameter threads
 * @param {string} commentText - The comment body text
 * @returns {string|null} Extracted song query or null
 */
export function extractSongQuery(commentText) {
  if (!commentText) return null;
  
  // Look for patterns like "Song Title by Artist" or "Song Title - Artist"
  const patterns = [
    /(.+?)\s+by\s+(.+?)(?:\s|$|\.|!|\?)/i,
    /(.+?)\s*-\s*(.+?)(?:\s|$|\.|!|\?)/i,
    /(.+?)\s*–\s*(.+?)(?:\s|$|\.|!|\?)/i, // em dash
  ];
  
  for (const pattern of patterns) {
    const match = commentText.match(pattern);
    if (match && match[1] && match[2]) {
      const songTitle = match[1].trim();
      const artistName = match[2].trim();
      
      // Basic validation - must have reasonable lengths
      if (songTitle.length >= 2 && artistName.length >= 2) {
        return `${songTitle} - ${artistName}`;
      }
    }
  }
  
  // Fallback: take first 40 characters if no pattern matches
  return commentText.substring(0, 40).trim();
}

/**
 * Cache song artwork and preview locally
 * @param {string} artworkUrl - Apple Music artwork URL
 * @param {string} previewUrl - Apple Music preview URL  
 * @param {string} songId - Unique identifier for the song
 * @returns {Promise<{artworkPath: string, previewPath: string}>} Local file paths
 */
export async function cacheMediaAssets(artworkUrl, previewUrl, songId) {
  try {
    const cacheResponse = await fetch(buildApiUrl("/cache-media"), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artworkUrl,
        previewUrl,
        songId
      })
    });
    
    const result = await cacheResponse.json();
    
    if (result.success) {
      return {
        artworkPath: result.artworkPath,
        previewPath: result.previewPath
      };
    }
    
    // Fallback to original URLs if caching fails
    return {
      artworkPath: artworkUrl,
      previewPath: previewUrl
    };
  } catch (error) {
    console.error('Error caching media assets:', error);
    // Return original URLs as fallback
    return {
      artworkPath: artworkUrl,
      previewPath: previewUrl
    };
  }
}

function createArtistNamesCacheKey(artistNames) {
  return artistNames
    .map((name) => name.toLowerCase())
    .sort()
    .join("|");
}

function normalizeArtistCacheKey(name) {
  return String(name || "").trim().toLowerCase();
}

function normalizeTextForMatch(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function createTrackLookupKey(songName, artistName) {
  return `${String(songName || "").trim()}${TRACK_KEY_SEPARATOR}${String(artistName || "").trim()}`;
}

function createNormalizedTrackLookupKey(songName, artistName) {
  return `${normalizeTextForMatch(songName)}${TRACK_KEY_SEPARATOR}${normalizeTextForMatch(artistName)}`;
}

function createTracksCacheKey(tracks) {
  return tracks
    .map((track) => createTrackLookupKey(track.songName, track.artistName).toLowerCase())
    .sort()
    .join("|");
}

function getArtistImagesFromDiskCache(artistNames) {
  return Object.fromEntries(
    artistNames.map((name) => {
      const cacheEntry = artistImageDiskCache[normalizeArtistCacheKey(name)];
      return [name, cacheEntry?.imageUrl || null];
    })
  );
}

function getAlbumArtworksFromDiskCache(tracks) {
  return Object.fromEntries(
    tracks.map((track) => {
      const requestKey = createTrackLookupKey(track.songName, track.artistName);
      const cacheEntry = albumArtworkDiskCache[
        createNormalizedTrackLookupKey(track.songName, track.artistName)
      ];

      return [requestKey, {
        songName: track.songName,
        artistName: track.artistName,
        artworkUrl: cacheEntry?.artworkUrl || null,
        albumName: cacheEntry?.albumName || "",
        previewUrl: cacheEntry?.previewUrl || null,
        source: cacheEntry?.source || "disk-cache",
      }];
    })
  );
}

/**
 * Fetch artist image URLs for a fixed list of artists.
 * Results are memoized per unique artist-list key to avoid duplicate API calls.
 * @param {string[]} artistNames - Artist names
 * @param {{ refresh?: boolean }} options
 * @returns {Promise<Record<string, string|null>>}
 */
export async function getAppleMusicArtistImages(artistNames, options = {}) {
  const names = Array.isArray(artistNames)
    ? [...new Set(artistNames.map((name) => String(name || "").trim()).filter(Boolean))]
    : [];

  if (names.length === 0) {
    return {};
  }

  const refresh = Boolean(options.refresh);
  const key = createArtistNamesCacheKey(names);
  const fallback = getArtistImagesFromDiskCache(names);

  if (!refresh && artistImagesRequestCache.has(key)) {
    const cachedData = await artistImagesRequestCache.get(key);
    return Object.fromEntries(
      names.map((name) => [name, cachedData?.[name] ?? fallback[name] ?? null])
    );
  }

  const requestPromise = (async () => {
    if (!artistImagesEndpointAvailable) {
      return fallback;
    }

    try {
      let response = await fetch(APPLE_MUSIC_ARTIST_IMAGES_API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artists: names,
          refresh,
        }),
      });
      let result = await tryParseJson(response);

      if (response.status === 404) {
        response = await fetch(LEGACY_APPLE_MUSIC_ARTIST_IMAGES_API_BASE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            artistNames: names,
          }),
        });
        result = await tryParseJson(response);

        if (response.ok && Array.isArray(result?.artists)) {
          return Object.fromEntries(
            names.map((name) => {
              const match = result.artists.find(
                (artist) => String(artist?.name || "").trim().toLowerCase() === name.toLowerCase()
              );
              return [name, match?.image || null];
            })
          );
        }
      }

      if (response.ok && result.success && result.data && typeof result.data === "object") {
        return Object.fromEntries(
          names.map((name) => [name, result.data[name] ?? fallback[name] ?? null])
        );
      }

      if (response.status === 404) {
        artistImagesEndpointAvailable = false;
        logUnavailableEndpoint("Apple Music artist-image endpoint is unavailable; using fallback values.");
      }

      return fallback;
    } catch (error) {
      console.error("Error fetching Apple Music artist images:", error);
      return fallback;
    }
  })();

  if (!refresh) {
    artistImagesRequestCache.set(key, requestPromise);
  }

  const data = await requestPromise;
  if (!refresh) {
    artistImagesRequestCache.set(key, Promise.resolve(data));
  }
  return data;
}

/**
 * Fetch album artwork URLs for a fixed list of tracks.
 * @param {Array<{songName: string, artistName: string}>} tracks
 * @param {{ refresh?: boolean }} options
 * @returns {Promise<Record<string, {songName: string, artistName: string, artworkUrl: string|null, albumName?: string, previewUrl?: string|null, source?: string}>>}
 */
export async function getAppleMusicAlbumArtworks(tracks, options = {}) {
  const normalizedTracks = Array.isArray(tracks)
    ? [...new Map(
        tracks
          .map((track) => ({
            songName: String(track?.songName || "").trim(),
            artistName: String(track?.artistName || "").trim(),
          }))
          .filter((track) => track.songName && track.artistName)
          .map((track) => [createTrackLookupKey(track.songName, track.artistName).toLowerCase(), track])
      ).values()]
    : [];

  if (normalizedTracks.length === 0) {
    return {};
  }

  const refresh = Boolean(options.refresh);
  const cacheKey = createTracksCacheKey(normalizedTracks);
  const fallback = getAlbumArtworksFromDiskCache(normalizedTracks);

  if (!refresh && albumArtworksRequestCache.has(cacheKey)) {
    const cachedData = await albumArtworksRequestCache.get(cacheKey);
    return Object.fromEntries(
      normalizedTracks.map((track) => {
        const requestKey = createTrackLookupKey(track.songName, track.artistName);
        return [requestKey, cachedData?.[requestKey] || fallback[requestKey]];
      })
    );
  }

  const requestPromise = (async () => {
    if (!albumArtworksEndpointAvailable) {
      return fallback;
    }

    try {
      const response = await fetch(APPLE_MUSIC_ALBUM_ARTWORKS_API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tracks: normalizedTracks,
          refresh,
        }),
      });
      const result = await tryParseJson(response);

      if (response.ok && result.success && result.data && typeof result.data === "object") {
        return Object.fromEntries(
          normalizedTracks.map((track) => {
            const requestKey = createTrackLookupKey(track.songName, track.artistName);
            return [requestKey, result.data[requestKey] || fallback[requestKey]];
          })
        );
      }

      if (response.status === 404) {
        albumArtworksEndpointAvailable = false;
        logUnavailableEndpoint("Apple Music album-artwork endpoint is unavailable; using fallback values.");
      }

      return fallback;
    } catch (error) {
      console.error("Error fetching Apple Music album artworks:", error);
      return fallback;
    }
  })();

  if (!refresh) {
    albumArtworksRequestCache.set(cacheKey, requestPromise);
  }

  const data = await requestPromise;
  if (!refresh) {
    albumArtworksRequestCache.set(cacheKey, Promise.resolve(data));
  }
  return data;
}

export default {
  searchAppleMusic,
  batchSearchAppleMusic,
  extractSongQuery,
  cacheMediaAssets,
  getAppleMusicArtistImages,
  getAppleMusicAlbumArtworks
};
