const axios = require('axios');
require('dotenv').config({ path: '../../.env' });

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  // Missing Spotify credentials
}

//=====================//
// 1) Obtain AccessToken
//=====================//
async function getAccessToken() {
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    throw error;
  }
}

//=======================//
// 2) Fetch Pop Artists
//=======================//
async function getPopArtists(genre = 'pop') {
  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: `genre:${genre}`,
        type: 'artist',
        limit: 50,
      },
    });

    const artists = response.data.artists?.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url || 'fallback.jpg',
    }));

    return artists;
  } catch (error) {
    throw error;
  }
}

//=======================//
// 3) Fetch Artist Details
//=======================//
async function getArtistDetails(artistNames) {
  try {
    const token = await getAccessToken();
    const artistData = [];
    const batchSize = 10;

    for (let i = 0; i < artistNames.length; i += batchSize) {
      const batch = artistNames.slice(i, i + batchSize);

      const requests = batch.map(async (name) => {
        try {
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { Authorization: `Bearer ${token}` },
            params: { q: name, type: 'artist', limit: 1 },
          });

          const artist = response.data.artists?.items[0];
          if (artist) {
            return {
              id: artist.id,
              name: artist.name,
              image: artist.images[0]?.url || 'fallback.jpg',
            };
          }
        } catch (error) {
          return null; // Skip failed requests
        }
      });

      const batchResults = await Promise.all(requests);
      artistData.push(...batchResults.filter((item) => item !== null));
    }

    return artistData;
  } catch (error) {
    throw error;
  }
}

//=======================//
// 4) Fetch Images For Artists (MISSING FUNCTION)
//=======================//
async function fetchImagesFor(artistNames) {
  try {
    const token = await getAccessToken();
    const artistsWithImages = [];
    const batchSize = 15;

    for (let i = 0; i < artistNames.length; i += batchSize) {
      const batch = artistNames.slice(i, i + batchSize);

      const requests = batch.map(async (name) => {
        try {
          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { Authorization: `Bearer ${token}` },
            params: { q: name, type: 'artist', limit: 1 },
          });

          const artist = response.data.artists?.items[0];
          if (artist && artist.images && artist.images.length > 0) {
            return {
              id: artist.id,
              name: artist.name,
              image: artist.images[0]?.url || 'fallback.jpg',
              genres: artist.genres || [],
              popularity: artist.popularity || 0
            };
          } else {
            return null;
          }
        } catch (error) {
          return null;
        }
      });

      const batchResults = await Promise.all(requests);
      artistsWithImages.push(...batchResults.filter((item) => item !== null));

      // Small delay between batches to respect rate limits
      if (i + batchSize < artistNames.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return artistsWithImages;
  } catch (error) {
    throw error;
  }
}

//=======================//
// 5) Fetch Single Artist Image (OPTIMIZED FOR SPEED)
//=======================//
async function fetchSingleArtistImage(artistName) {
  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: artistName, type: 'artist', limit: 1 },
      timeout: 3000 // 3 second timeout for speed
    });

    const artist = response.data.artists?.items[0];
    if (artist && artist.images && artist.images.length > 0) {
      return {
        id: artist.id,
        name: artist.name,
        image: artist.images[0]?.url || 'fallback.jpg',
        genres: artist.genres || [],
        popularity: artist.popularity || 0
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}


module.exports = {
  getAccessToken,
  getPopArtists,
  getArtistDetails,
  fetchImagesFor,
  fetchSingleArtistImage
};


