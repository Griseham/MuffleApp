require('dotenv').config({ path: './.env' });
const axios = require('axios');
const express = require('express');
const cors = require('cors');

const unifiedRouter = express.Router();

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
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    
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
    console.error('Failed to get Spotify access token:', error.message);
    throw error;
  }
};

const getPopArtists = async (genre = 'pop') => {
  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: `genre:${genre}`,
        type: 'artist',
        limit: 50
      }
    });

    return response.data.artists?.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url || 'fallback.jpg',
      genres: artist.genres || [],
      popularity: artist.popularity,
    })) || [];
  } catch (error) {
    console.error('Failed to fetch artists:', error.message);
    throw error;
  }
};

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
          artists.push({
            id: artist.id,
            name: artist.name,
            image: artist.images[0]?.url || 'fallback.jpg',
            genres: artist.genres || [],
          });
        }
      } catch (artistError) {
        console.error(`Failed to fetch image for ${name}:`, artistError.message);
      }
    }
    
    return artists;
  } catch (error) {
    console.error('Failed to fetch artist images:', error.message);
    throw error;
  }
};

//======================//
// Last.fm Service Functions
//======================//

const fetchSimilarArtists = async (selectedArtists) => {
  try {
    const apiKey = process.env.REACT_APP_LASTFM_API_KEY;
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
        console.error(`Failed to fetch similar artists for ${artistName}:`, artistError.message);
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
    console.error('Failed to fetch similar artists:', error.message);
    throw error;
  }
};

//======================//
// Apple Music Service Functions
//======================//

const searchAppleMusic = async (query) => {
  try {
    const APPLE_API_BASE_URL = process.env.REACT_APP_APPLE_API_BASE_URL;
    const APPLE_DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;

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
    console.error('Apple Music search failed:', error.message);
    throw error;
  }
};

//======================//
// ROUTES
//======================//

// Spotify Routes
unifiedRouter.get('/spotify/artists', async (req, res) => {
  const { genre } = req.query;
  if (!genre) {
    return res.status(400).json({ error: 'Genre parameter is missing' });
  }
  try {
    const artists = await getPopArtists(genre);
    res.json(artists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

unifiedRouter.get('/spotify/search-artists', async (req, res) => {
  const { query } = req.query;
  
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

    const artists = response.data.artists?.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url || 'fallback.jpg',
      genres: artist.genres || [],
      popularity: artist.popularity,
    })) || [];

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
unifiedRouter.get('/apple-music/search-artists', async (req, res) => {
  const { query } = req.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Valid search query is required' });
  }
  
  try {
    const results = await searchAppleMusic(query.trim());
    res.json(results);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: 'Apple Music API error', 
        details: error.response.data?.errors?.[0]?.title || 'Unknown API error'
      });
    } else if (error.request) {
      return res.status(504).json({ error: 'Apple Music API timeout or no response' });
    } else {
      return res.status(500).json({ error: 'Failed to search for artists', message: error.message });
    }
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
  app.use('/api', unifiedRouter);
};