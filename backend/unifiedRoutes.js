require('dotenv').config({ path: './.env' });
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
    console.error('Failed to fetch artists, using mock data:', error.message);
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
    // Generate random genre artists using mock data (since we don't have real Apple Music random endpoint)
    const genres = ['pop', 'rock', 'hip-hop', 'electronic', 'indie', 'jazz', 'country'];
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    
    // Use our existing Spotify endpoint to get artists by genre
    const artists = await getPopArtists(randomGenre);
    
    // Shuffle and limit the results
    const shuffled = artists.sort(() => 0.5 - Math.random());
    const limited = shuffled.slice(0, parseInt(count));
    
    res.json(limited);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch random genre artists',
      message: error.message 
    });
  }
});

// Apple Music artist songs endpoint for Widget and PlayingScreen
unifiedRouter.post('/apple-music/artist-songs', async (req, res) => {
  const { artistName } = req.body;
  
  if (!artistName) {
    return res.status(400).json({ error: 'Artist name is required' });
  }
  
  try {
    // Mock song data for the artist
    const mockSongs = [
      {
        id: `song_${Date.now()}_1`,
        name: `${artistName} - Song 1`,
        artistName: artistName,
        albumName: `${artistName} Album`,
        artworkUrl: `https://via.placeholder.com/300x300/1a1a1a/ffffff?text=${encodeURIComponent(artistName)}`,
        previewUrl: null,
        duration: Math.floor(Math.random() * 180000) + 120000
      },
      {
        id: `song_${Date.now()}_2`,
        name: `${artistName} - Song 2`,
        artistName: artistName,
        albumName: `${artistName} Album`,
        artworkUrl: `https://via.placeholder.com/300x300/1a1a1a/ffffff?text=${encodeURIComponent(artistName)}`,
        previewUrl: null,
        duration: Math.floor(Math.random() * 180000) + 120000
      }
    ];
    
    res.json({ songs: mockSongs });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch artist songs',
      message: error.message 
    });
  }
});

// Apple Music general search endpoint
unifiedRouter.post('/apple-music/search', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    // Mock search results
    const mockResults = [
      {
        id: `search_${Date.now()}_1`,
        name: `${query} - Result 1`,
        artistName: 'Various Artists',
        albumName: 'Search Results Album',
        artworkUrl: `https://via.placeholder.com/300x300/1a1a1a/ffffff?text=${encodeURIComponent(query)}`,
        previewUrl: null,
        duration: Math.floor(Math.random() * 180000) + 120000
      }
    ];
    
    res.json({ results: mockResults });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to search Apple Music',
      message: error.message 
    });
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

unifiedRouter.get('/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;
  
  // Return mock comments
  res.json([
    {
      id: `comment-1-${postId}`,
      content: 'Mock comment 1',
      author: 'user1',
      timestamp: new Date().toISOString()
    },
    {
      id: `comment-2-${postId}`,
      content: 'Mock comment 2', 
      author: 'user2',
      timestamp: new Date().toISOString()
    }
  ]);
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
const generateDiverseMockPosts = (count = 10) => {
  const postTypes = ['thread', 'news', 'groupchat', 'parameter', 'tweet'];
  const authors = ['MusicFan42', 'BeatCollector', 'SoundExplorer', 'VibesOnly', 'MelodyMaster', 'RhythmSeeker'];
  const titles = [
    'Need recommendations for late-night studying vibes',
    'Just discovered this amazing indie band!',
    'What\'s your go-to workout playlist?',
    'Breaking: Major festival lineup announced',
    'Live discussion: Album release party tonight',
    'Compare: 90s vs 2000s hip-hop',
    'Underrated artists that deserve more recognition',
    'Best streaming quality for audiophiles?',
    'Local music scene appreciation thread',
    'Nostalgic songs that hit different'
  ];

  // Mock music data for snippets
  const mockSongs = [
    { name: 'Midnight Studies', artist: 'Lo-Fi Dreams', album: 'Focus Flow' },
    { name: 'Electric Sunset', artist: 'Neon Waves', album: 'City Lights' },
    { name: 'Heavy Bassline', artist: 'Underground Kings', album: 'Street Symphony' },
    { name: 'Acoustic Morning', artist: 'Coffee House', album: 'Sunday Sessions' },
    { name: 'Digital Rain', artist: 'Synthwave Valley', album: 'Retro Future' },
    { name: 'Jazz in the Rain', artist: 'Blue Note Collective', album: 'Rainy Day Sessions' },
    { name: 'Indie Anthem', artist: 'Garage Band Heroes', album: 'DIY Dreams' },
    { name: 'Classical Remix', artist: 'Modern Orchestra', album: 'Timeless Reborn' }
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const randomSong = mockSongs[Math.floor(Math.random() * mockSongs.length)];
    const postId = `diverse_post_${Date.now()}_${i}`;
    const hasSnippets = Math.random() > 0.3; // 70% chance of having snippets
    
    const post = {
      id: postId,
      author: authors[Math.floor(Math.random() * authors.length)],
      title: titles[Math.floor(Math.random() * titles.length)],
      selftext: '',
      createdUtc: Date.now() / 1000,
      postType: postTypes[Math.floor(Math.random() * postTypes.length)],
      ups: Math.floor(Math.random() * 100) + 1,
      bookmarks: Math.floor(Math.random() * 50) + 1,
      num_comments: Math.floor(Math.random() * 25) + 1,
      imageUrl: null,
      username: authors[Math.floor(Math.random() * authors.length)],
      avatar: null
    };

    // Add snippets for thread and groupchat posts
    if (hasSnippets && (post.postType === 'thread' || post.postType === 'groupchat')) {
      const snippetCount = Math.floor(Math.random() * 3) + 1; // 1-3 snippets
      post.snippets = Array.from({ length: snippetCount }, (_, j) => {
        const song = mockSongs[Math.floor(Math.random() * mockSongs.length)];
        return {
          commentId: `comment_${postId}_${j}`,
          query: `${song.artist} ${song.name}`,
          songName: song.name,
          artistName: song.artist,
          albumName: song.album,
          artworkUrl: `https://via.placeholder.com/300x300/000000/FFFFFF?text=${encodeURIComponent(song.album)}`,
          previewUrl: null, // Will use fallback
          duration: Math.floor(Math.random() * 180000) + 120000, // 2-5 minutes
          releaseDate: `${2015 + Math.floor(Math.random() * 9)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`
        };
      });

      // Add comments corresponding to snippets
      post.comments = post.snippets.map((snippet, j) => ({
        id: snippet.commentId,
        author: authors[Math.floor(Math.random() * authors.length)],
        body: `Check out this track: ${snippet.songName} by ${snippet.artistName}`,
        createdUtc: Date.now() / 1000,
        ups: Math.floor(Math.random() * 50) + 1
      }));
    }

    return post;
  });
};

unifiedRouter.get('/diverse-posts', async (req, res) => {
  try {
    const diversePosts = generateDiverseMockPosts(15);
    res.json({
      success: true,
      data: diversePosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate diverse posts'
    });
  }
});

unifiedRouter.get('/refresh', async (req, res) => {
  try {
    const refreshPosts = generateDiverseMockPosts(12);
    res.json({
      success: true,
      data: refreshPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh posts'
    });
  }
});

unifiedRouter.get('/cached-posts', async (req, res) => {
  try {
    const cachedPosts = generateDiverseMockPosts(20);
    res.json({
      success: true,
      data: cachedPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load cached posts'
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