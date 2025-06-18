require('dotenv').config({ path: './.env' });
const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const express = require('express');
const cors = require('cors');


const unifiedRouter = express.Router();

//======================//
// Mock Data for Development/Demo
//======================//

const mockArtists = [
  { id: 'mock-1', name: 'Taylor Swift', image: 'https://i.scdn.co/image/ab6761610000e5eb859e4c14fa59296c8649e0e4', genres: ['pop', 'country'], popularity: 100 },
  { id: 'mock-2', name: 'Drake', image: 'https://i.scdn.co/image/ab6761610000e5eb40b5c07ab77b6b1a9192c4ce', genres: ['hip-hop', 'rap'], popularity: 99 },
  { id: 'mock-3', name: 'Billie Eilish', image: 'https://i.scdn.co/image/ab6761610000e5eb60a3969b51b62e54658da069', genres: ['pop', 'alternative'], popularity: 98 },
  { id: 'mock-4', name: 'The Weeknd', image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb', genres: ['pop', 'r&b'], popularity: 97 },
  { id: 'mock-5', name: 'Bad Bunny', image: 'https://i.scdn.co/image/ab6761610000e5eb19c2790744c792d05570bb71', genres: ['latin', 'reggaeton'], popularity: 96 },
  { id: 'mock-6', name: 'Dua Lipa', image: 'https://i.scdn.co/image/ab6761610000e5eb4c63c6b89e6fb3dd84b00e1f', genres: ['pop', 'dance'], popularity: 95 },
  { id: 'mock-7', name: 'Post Malone', image: 'https://i.scdn.co/image/ab6761610000e5ebd0b53e3b8c6f6644c6e0d0fd', genres: ['pop', 'hip-hop'], popularity: 94 },
  { id: 'mock-8', name: 'Ariana Grande', image: 'https://i.scdn.co/image/ab6761610000e5ebc6aa0c51bab10f8c9c8c4cc7', genres: ['pop', 'r&b'], popularity: 93 },
  { id: 'mock-9', name: 'Travis Scott', image: 'https://i.scdn.co/image/ab6761610000e5ebb09e97e4b3b4e4e38eb5a7b6', genres: ['hip-hop', 'rap'], popularity: 92 },
  { id: 'mock-10', name: 'BTS', image: 'https://i.scdn.co/image/ab6761610000e5eb82c3b0a0c1e1c0c1c1c0c1c1', genres: ['k-pop', 'pop'], popularity: 91 },
  { id: 'mock-11', name: 'Lil Nas X', image: 'https://i.scdn.co/image/ab6761610000e5eb4d0c1e0c1c0c1c0c1c0c1c0c', genres: ['hip-hop', 'pop'], popularity: 90 },
  { id: 'mock-12', name: 'Olivia Rodrigo', image: 'https://i.scdn.co/image/ab6761610000e5eb5e1c0c1c0c1c0c1c0c1c0c1c', genres: ['pop', 'alternative'], popularity: 89 },
  { id: 'mock-13', name: 'Doja Cat', image: 'https://i.scdn.co/image/ab6761610000e5eb6e1c0c1c0c1c0c1c0c1c0c1c', genres: ['pop', 'hip-hop'], popularity: 88 },
  { id: 'mock-14', name: 'Harry Styles', image: 'https://i.scdn.co/image/ab6761610000e5eb7e1c0c1c0c1c0c1c0c1c0c1c', genres: ['pop', 'rock'], popularity: 87 },
  { id: 'mock-15', name: 'Justin Bieber', image: 'https://i.scdn.co/image/ab6761610000e5eb8e1c0c1c0c1c0c1c0c1c0c1c', genres: ['pop', 'r&b'], popularity: 86 },
  { id: 'mock-16', name: 'Ed Sheeran', image: 'https://i.scdn.co/image/ab6761610000e5eb9e1c0c1c0c1c0c1c0c1c0c1c', genres: ['pop', 'folk'], popularity: 85 },
  { id: 'mock-17', name: 'Imagine Dragons', image: 'https://i.scdn.co/image/ab6761610000e5ebae1c0c1c0c1c0c1c0c1c0c1c', genres: ['rock', 'alternative'], popularity: 84 },
  { id: 'mock-18', name: 'Coldplay', image: 'https://i.scdn.co/image/ab6761610000e5ebbe1c0c1c0c1c0c1c0c1c0c1c', genres: ['rock', 'alternative'], popularity: 83 },
  { id: 'mock-19', name: 'Kendrick Lamar', image: 'https://i.scdn.co/image/ab6761610000e5ebce1c0c1c0c1c0c1c0c1c0c1c', genres: ['hip-hop', 'rap'], popularity: 82 },
  { id: 'mock-20', name: 'The Chainsmokers', image: 'https://i.scdn.co/image/ab6761610000e5ebde1c0c1c0c1c0c1c0c1c0c1c', genres: ['electronic', 'pop'], popularity: 81 }
];

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

    return response.data.artists?.items.map(artist => {
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
  } catch (error) {
    // Return mock data when Spotify is unavailable
    return getRandomMockArtists(20, genre);
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
    res.status(500).json({ error: 'Apple Music fetch failed', details: err.message });
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
// ─────────────────────────────────────────────────────────────
//  /reddit/posts   – proxy to Reddit’s public JSON API
//    • supports  hot (default)  →  /hot.json
//    • supports  top by period  →  /top.json?t=year|month|week|day
//    • tags posts from r/music   →  postType = 'news'
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
//  /reddit/posts – proxy to Reddit’s JSON API
//    • /hot.json  (default)   or  /top.json?t=year|month|week
//    • r/music   → postType 'news'
//    • trending  → postType 'groupchat'
//    • robust image detection (url, preview, thumbnail)
// ─────────────────────────────────────────────────────────────

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
    const { data } = await fetchWithRetry(redditUrl);
    
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

// Mock routes for threads app data (since we don't have a real database)
unifiedRouter.get('/cached-posts/:postId', async (req, res) => {
  const { postId } = req.params;
  
  // Generate a single post with snippets for the specific postId
  const mockSongs = [
    { name: 'Midnight Studies', artist: 'Lo-Fi Dreams', album: 'Focus Flow' },
    { name: 'Electric Sunset', artist: 'Neon Waves', album: 'City Lights' },
    { name: 'Heavy Bassline', artist: 'Underground Kings', album: 'Street Symphony' },
    { name: 'Acoustic Morning', artist: 'Coffee House', album: 'Sunday Sessions' },
    { name: 'Digital Rain', artist: 'Synthwave Valley', album: 'Retro Future' }
  ];
  
  const authors = ['MusicFan42', 'BeatCollector', 'SoundExplorer', 'VibesOnly'];
  const postTypes = ['thread', 'groupchat', 'parameter'];
  
  // Create deterministic randomness based on postId
  const seed = postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (max = 1) => ((seed * 9301 + 49297) % 233280) / 233280 * max;
  
  const postType = postTypes[Math.floor(random() * postTypes.length)];
  const hasSnippets = postType === 'thread' || postType === 'groupchat';
  
  const snippets = hasSnippets ? Array.from({ length: Math.floor(random() * 3) + 1 }, (_, i) => {
    const song = mockSongs[Math.floor(random() * mockSongs.length)];
    return {
      commentId: `comment_${postId}_${i}`,
      query: `${song.artist} ${song.name}`,
      songName: song.name,
      artistName: song.artist,
      albumName: song.album,
      artworkUrl: `https://via.placeholder.com/300x300/1a1a1a/ffffff?text=${encodeURIComponent(song.album)}`,
      previewUrl: null,
      duration: Math.floor(random() * 180000) + 120000,
      releaseDate: `${2015 + Math.floor(random() * 9)}-${String(Math.floor(random() * 12) + 1).padStart(2, '0')}-01`
    };
  }) : [];
  
  const comments = snippets.map(snippet => ({
    id: snippet.commentId,
    author: authors[Math.floor(random() * authors.length)],
    body: `Check out this track: ${snippet.songName} by ${snippet.artistName}`,
    createdUtc: Date.now() / 1000,
    ups: Math.floor(random() * 50) + 1
  }));
  
  res.json({
    success: true,
    data: {
      id: postId,
      title: `Cached Post ${postId}`,
      author: authors[Math.floor(random() * authors.length)],
      postType: postType,
      createdUtc: Date.now() / 1000,
      ups: Math.floor(random() * 100) + 1,
      num_comments: comments.length,
      snippets: snippets,
      comments: comments,
      cached: true
    }
  });
});



unifiedRouter.get('/posts/:postId/snippets', async (req, res) => {
  const { postId } = req.params;
  
  // Return mock snippets
  res.json([
    {
      id: `snippet-1-${postId}`,
      title: 'Mock Song 1',
      artist: 'Mock Artist 1',
      preview_url: null,
      timestamp: new Date().toISOString()
    }
  ]);
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

// GET /cached-posts/:id  → return one cached post file with its comments/snippets
unifiedRouter.get('/cached-posts/:id', async (req, res) => {
  try {
    const postId   = req.params.id;                          // e.g. 1hqs8yj
    const cacheDir = path.resolve(__dirname, '..',
                                   'apps', 'threads', 'src', 'cached_posts');

    // File name is "<postId>.json" or "<postId>_something.json"
    const fileName = fs.readdirSync(cacheDir)
      .find(f => f.startsWith(postId) && f.endsWith('.json'));

    if (!fileName) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const fullPath = path.join(cacheDir, fileName);
    const data     = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

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

    // Make sure createdUtc is sane (matches useThreadData helper)
    const now         = Date.now() / 1000;
    const oneYearAgo  = now - 365 * 24 * 60 * 60;
    if (!data.createdUtc || data.createdUtc <= 0 || data.createdUtc > now) {
      data.createdUtc = oneYearAgo + Math.random() * (now - oneYearAgo);
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

unifiedRouter.get('/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  const sub = (req.query.subreddit || 'music').toLowerCase();
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

// GET /posts/:id/comments?subreddit=<sub>
// ---------------------------------------
// Proxies to Reddit and returns a flat array of comments
// GET /posts/:id/comments?subreddit=<sub>
unifiedRouter.get('/posts/:id/comments', async (req, res) => {

  const subreddit =
  (req.query.subreddit || req.headers['x-thread-subreddit'] || 'music').toLowerCase();

  const { id } = req.params;
  const sub    = (req.query.subreddit || 'music').toLowerCase();
  const url    = `https://www.reddit.com/r/${sub}/comments/${id}.json?limit=100`;

  try {
     const { data } = await axios.get(
         url,
         {
           timeout : 7000,
           headers : { 'User-Agent': 'MuflThreads/1.0 (+https://mufl.app)' }
         }
       );
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

    return res.json({ success: true, data: flatten(children) });
  } catch (err) {
    return res
      .status(502)
      .json({ success: false, error: 'Reddit API unavailable' });
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