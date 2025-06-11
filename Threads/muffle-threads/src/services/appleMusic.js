// Apple Music API service for parameter threads
const APPLE_MUSIC_API_BASE = 'http://localhost:4000/api/apple-music-search';

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
      const song = result.data;
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
    return null;
  }
}

/**
 * Batch search multiple queries for parameter threads
 * @param {Array<{commentId: string, query: string}>} queries - Array of search queries
 * @returns {Promise<Array>} Array of results with commentId and song data
 */
export async function batchSearchAppleMusic(queries) {
  const results = [];
  
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
    /(.+?)\s+by\s+(.+?)(?:\s|$|\.|\!|\?)/i,
    /(.+?)\s*-\s*(.+?)(?:\s|$|\.|\!|\?)/i,
    /(.+?)\s*–\s*(.+?)(?:\s|$|\.|\!|\?)/i, // em dash
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
    const cacheResponse = await fetch('http://localhost:4000/api/cache-media', {
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
    // Return original URLs as fallback
    return {
      artworkPath: artworkUrl,
      previewPath: previewUrl
    };
  }
}

export default {
  searchAppleMusic,
  batchSearchAppleMusic,
  extractSongQuery,
  cacheMediaAssets
};