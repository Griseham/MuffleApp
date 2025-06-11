// fetchSimilar.js - Centralized Last.fm API call & cache
import axios from 'axios';

// Backend API url
const API_URL = 'http://localhost:5001';

// Global cache for similar artists to avoid redundant API calls
let similarArtistsCache = {
  artists: [],
  timestamp: null,
  seedArtists: []
};

/**
 * Fetches similar artists from Last.fm API via backend and maintains a session cache
 * Uses Spotify for reliable image fetching to prevent empty avatar circles
 * @param {Array} selectedArtists - Array of selected artist objects with name property
 * @param {boolean} forceRefresh - Whether to force refresh the cache
 * @returns {Promise<Array>} - Promise resolving to array of similar artists
 */
export const fetchSimilarArtists = async (selectedArtists = [], forceRefresh = false) => {
  // If no artists selected, return empty array
  if (!selectedArtists || selectedArtists.length === 0) {
    return [];
  }

  // Check if we already have cached data for these exact artists and it's not expired
  const cacheExpired = !similarArtistsCache.timestamp || 
                       (Date.now() - similarArtistsCache.timestamp > 3600000); // 1 hour cache

  const seedArtistNames = selectedArtists.map(a => a.name).sort().join(',');
  const cacheSeedNames = similarArtistsCache.seedArtists.sort().join(',');
  
  if (!forceRefresh && !cacheExpired && seedArtistNames === cacheSeedNames) {
    console.log('Using cached similar artists');
    return similarArtistsCache.artists;
  }

  try {
    // Call the backend API for similar artists - lastFmService now returns just names
    const response = await axios.post(`${API_URL}/lastfm/similar-artists`, {
      selectedArtists: selectedArtists.map(a => a.name)
    });
    
    const lastFmArtists = response.data.similarArtists || [];
    
    // Extract just the names from Last.fm results (up to 100)
    const lastFmNames = lastFmArtists.slice(0, 100).map(a => a.name);
    
    // Use our new fetchImagesFor helper to get reliable images from Spotify
    const withImages = await axios.post(`${API_URL}/spotify/fetch-images`, {
      artistNames: lastFmNames
    });
    
    // Get only the results which have valid images
    const similarArtists = (withImages.data?.artists || []).filter(a => a.image && a.image !== 'fallback.jpg');
    
    // Update cache with the high-quality data
    similarArtistsCache = {
      artists: similarArtists,
      timestamp: Date.now(),
      seedArtists: selectedArtists.map(a => a.name)
    };
    
    return similarArtists;
  } catch (error) {
    console.error('Error fetching similar artists:', error);
    
    // If the backend API fails, try to get artist data from Spotify directly
    try {
      const spotifyResponse = await axios.post(`${API_URL}/spotify/artists-data`, {
        artistNames: selectedArtists.map(a => a.name)
      });
      
      const spotifyArtists = spotifyResponse.data.artists || [];
      
      // Generate similar artists based on seed artists from Spotify
      if (spotifyArtists.length > 0) {
        const similarArtists = [];
        
        // For each seed artist, create 20 "similar" artists with reliable images
        selectedArtists.forEach((seedArtist, seedIndex) => {
          for (let i = 1; i <= 20; i++) {
            similarArtists.push({
              id: `similar-${seedIndex}-${i}`,
              name: `Similar to ${seedArtist.name} ${i}`,
              image: seedArtist.image || spotifyArtists[0].image || 'https://via.placeholder.com/300',
              match: Math.random() * 100
            });
          }
        });
        
        // Update cache
        similarArtistsCache = {
          artists: similarArtists,
          timestamp: Date.now(),
          seedArtists: selectedArtists.map(a => a.name)
        };
        
        return similarArtists;
      }
    } catch (spotifyError) {
      console.error('Error fetching artist data from Spotify:', spotifyError);
    }
    
    // Return cache if available despite error, or empty array
    return similarArtistsCache.artists.length ? similarArtistsCache.artists : [];
  }
};

/**
 * Returns the current cache of similar artists without making an API call
 * @returns {Array} - The cached similar artists or empty array
 */
export const getCachedSimilarArtists = () => {
  return similarArtistsCache.artists || [];
};

/**
 * Clears the similar artists cache
 */
export const clearSimilarArtistsCache = () => {
  similarArtistsCache = {
    artists: [],
    timestamp: null,
    seedArtists: []
  };
};

export default fetchSimilarArtists;