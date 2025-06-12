require('dotenv').config({ path: './.env' });
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const { getPopArtists, getArtistDetails, fetchImagesFor, getAccessToken } = require('./spotifyService');
const { fetchSimilarArtists } = require('./lastFmService');
const { getSnippetsForArtists, searchSongs, resolveAppleMusicArtistIds } = require('./appleMusicService');
const appleMusicService = require('./appleMusicService');

import express from 'express';
import { someRoomsRouteHandler } from './roomsController.js'; // your existing route handlers

const roomsRouter = express.Router();

roomsRouter.get('/some-endpoint', someRoomsRouteHandler); // define all routes here

export default function registerRoomsRoutes(app) {
  app.use('/api/rooms', roomsRouter);
}


//======================//
// Last.fm Similar Artists
//======================//
app.post('/lastfm/similar-artists', async (req, res) => {
    const { selectedArtists } = req.body;

    if (!selectedArtists || selectedArtists.length === 0) {
        return res.status(400).json({ error: 'No selected artists provided' });
    }

    try {
        const similarArtists = await fetchSimilarArtists(selectedArtists);
        res.json({ similarArtists });
    } catch (error) {
        console.error('Error in /lastfm/similar-artists route:', error.message);
        res.status(500).json({ error: 'Failed to fetch similar artists' });
    }
});

app.get('/spotify/artists', async (req, res) => {
    const { genre } = req.query;
    if (!genre) {
        return res.status(400).json({ error: 'Genre parameter is missing' });
    }
    try {
        const artists = await getPopArtists(genre); // Pass genre if the function accepts it
        res.json(artists);
    } catch (error) {
        console.error('Error in /spotify/artists route:', error.message);
        res.status(500).json({ error: 'Failed to fetch artists' });
    }
});

app.get('/apple-music/tracks', async (req, res) => {
    const { artistName } = req.query;
  
    if (!artistName) {
      return res.status(400).json({ error: 'Artist name is required' });
    }
  
    try {
      const { fetchAppleMusicTracks } = appleMusicService;
      const tracks = await fetchAppleMusicTracks(artistName);
      res.json(tracks);
    } catch (error) {
      console.error('Error fetching Apple Music tracks:', error.message);
      res.status(500).json({ error: 'Failed to fetch tracks' });
    }
  });

  


//======================//
// Spotify Artist Details
//======================//
app.post('/spotify/artists-data', async (req, res) => {
    const { artistNames } = req.body;

    if (!artistNames || artistNames.length === 0) {
        return res.status(400).json({ error: 'No artist names provided' });
    }

    try {
        const artistData = await getArtistDetails(artistNames);
        res.json({ artists: artistData });
    } catch (error) {
        console.error('Error in /spotify/artists-data route:', error.message);
        res.status(500).json({ error: 'Failed to fetch artist data' });
    }
});

//======================//
// Spotify Artist Images
//======================//
app.post('/spotify/fetch-images', async (req, res) => {
    const { artistNames } = req.body;

    if (!artistNames || artistNames.length === 0) {
        return res.status(400).json({ error: 'No artist names provided' });
    }

    try {
        const artistsWithImages = await fetchImagesFor(artistNames);
        res.json({ artists: artistsWithImages });
    } catch (error) {
        console.error('Error in /spotify/fetch-images route:', error.message);
        res.status(500).json({ error: 'Failed to fetch artist images' });
    }
});

//======================//
// Apple Music Snippets
//======================//
app.post('/apple-music/snippets', async (req, res) => {
    const { artistNames } = req.body;

    if (!artistNames || artistNames.length === 0) {
        return res.status(400).json({ error: 'No artist names provided' });
    }

    try {
        const resolvedArtists = await resolveAppleMusicArtistIds(artistNames);
        const artistIds = resolvedArtists.map((artist) => artist.id);
        const snippets = await getSnippetsForArtists(artistIds);
        res.json(snippets);
    } catch (error) {
        console.error('Error in /apple-music/snippets route:', error.message);
        res.status(500).json({ error: 'Failed to fetch snippets' });
    }
});

// Add this new endpoint to your index.js file

//======================//
// Apple Music Random Genre Artists
//======================//
//======================//
// Apple Music Random Genre Artists - IMAGES ONLY VERSION
//======================//
app.get('/apple-music/random-genre-artists', async (req, res) => {
  const { count = 50 } = req.query;
  
  // Helper function to validate image URLs
  function hasValidImageUrl(imageUrl) {
    return imageUrl && 
           imageUrl !== 'fallback.jpg' && 
           imageUrl !== '/placeholder-200.png' &&
           !imageUrl.includes('placeholder') &&
           !imageUrl.includes('picsum') &&
           imageUrl.startsWith('http') &&
           !imageUrl.includes('{w}x{h}'); // Ensure template was replaced
  }
  
  try {
    // Apple Music genres for random selection
    const genres = [
      'pop', 'rock', 'hip-hop', 'electronic', 'country', 'jazz', 'classical',
      'r-b', 'latin', 'indie', 'alternative', 'folk', 'blues', 'reggae',
      'metal', 'punk', 'dance', 'world', 'ambient', 'house'
    ];
    
    // Pick a random genre
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    
    console.log(`Fetching ${count} random artists with valid images from genre: ${randomGenre}`);
    
    // Get environment variables
    const APPLE_API_BASE_URL = process.env.REACT_APP_APPLE_API_BASE_URL;
    const APPLE_DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;

    // Validate environment variables
    if (!APPLE_API_BASE_URL || !APPLE_DEVELOPER_TOKEN) {
      throw new Error('Missing Apple Music API credentials');
    }

    // Popular artists by genre to ensure we get results with images
    const popularArtistsByGenre = {
      'pop': ['Taylor Swift', 'Ariana Grande', 'Dua Lipa', 'The Weeknd', 'Billie Eilish', 'Harry Styles', 'Olivia Rodrigo'],
      'rock': ['Imagine Dragons', 'Coldplay', 'Arctic Monkeys', 'Queen', 'The Beatles', 'Foo Fighters', 'Green Day'],
      'hip-hop': ['Drake', 'Kendrick Lamar', 'Travis Scott', 'Post Malone', 'Eminem', 'Jay-Z', 'Kanye West'],
      'electronic': ['Calvin Harris', 'David Guetta', 'Skrillex', 'Deadmau5', 'Martin Garrix', 'Diplo', 'Zedd'],
      'r-b': ['Beyoncé', 'The Weeknd', 'SZA', 'Frank Ocean', 'Alicia Keys', 'Rihanna', 'Chris Brown'],
      'country': ['Luke Bryan', 'Carrie Underwood', 'Keith Urban', 'Blake Shelton', 'Kane Brown', 'Chris Stapleton'],
      'indie': ['Arctic Monkeys', 'Tame Impala', 'Vampire Weekend', 'The Strokes', 'Foster the People', 'MGMT']
    };
    
    let allArtists = [];
    const targetCount = parseInt(count) * 3; // Get 3x more to filter for valid images
    
    // First, try to get popular artists from the genre
    const popularArtists = popularArtistsByGenre[randomGenre] || popularArtistsByGenre['pop'];
    
    for (const artistName of popularArtists) {
      if (allArtists.length >= targetCount) break;
      
      try {
        const encodedArtist = encodeURIComponent(artistName);
        const url = `${APPLE_API_BASE_URL}/search?term=${encodedArtist}&types=artists&limit=1`;

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}`,
          },
          timeout: 5000
        });

        const artists = response.data?.results?.artists?.data || [];
        
        for (const artist of artists) {
          const imageUrl = artist.attributes?.artwork?.url?.replace('{w}x{h}', '400x400');
          
          // Only add artists with valid images
          if (artist.attributes?.name && hasValidImageUrl(imageUrl)) {
            allArtists.push({
              id: artist.id || `apple-${Date.now()}-${Math.random()}`,
              name: artist.attributes.name,
              image: imageUrl,
              genres: artist.attributes.genreNames || [randomGenre]
            });
            
            console.log(`✅ Added ${artist.attributes.name} with valid image`);
          } else {
            console.log(`❌ Skipped ${artistName} - no valid image available`);
          }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (artistError) {
        console.error(`Error searching for ${artistName}:`, artistError.message);
        continue;
      }
    }
    
    // If we don't have enough, search by genre more broadly
    if (allArtists.length < count) {
      const searchQueries = [
        `genre:${randomGenre}`,
        randomGenre,
        `${randomGenre} music popular`,
        `${randomGenre} artist 2024`
      ];
      
      for (const query of searchQueries) {
        if (allArtists.length >= targetCount) break;
        
        try {
          const encodedQuery = encodeURIComponent(query);
          const url = `${APPLE_API_BASE_URL}/search?term=${encodedQuery}&types=artists&limit=25`;

          const response = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}`,
            },
            timeout: 5000
          });

          const artists = response.data?.results?.artists?.data || [];
          
          // Filter and format artists - only those with valid images
          for (const artist of artists) {
            if (allArtists.length >= targetCount) break;
            
            const imageUrl = artist.attributes?.artwork?.url?.replace('{w}x{h}', '400x400');
            const artistName = artist.attributes?.name;
            
            // Check if we already have this artist and if they have a valid image
            const alreadyExists = allArtists.some(a => a.name.toLowerCase() === artistName?.toLowerCase());
            
            if (artistName && !alreadyExists && hasValidImageUrl(imageUrl)) {
              allArtists.push({
                id: artist.id || `apple-${Date.now()}-${Math.random()}`,
                name: artistName,
                image: imageUrl,
                genres: artist.attributes.genreNames || [randomGenre]
              });
              
              console.log(`✅ Added ${artistName} from search with valid image`);
            }
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (queryError) {
          console.error(`Error with query "${query}":`, queryError.message);
          continue;
        }
      }
    }
    
    // Remove any duplicates by name (case insensitive)
    const uniqueArtists = [];
    const seenNames = new Set();
    
    for (const artist of allArtists) {
      const lowerName = artist.name.toLowerCase();
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        uniqueArtists.push(artist);
      }
    }
    
    // Shuffle and limit results to requested count
    const shuffled = uniqueArtists.sort(() => Math.random() - 0.5);
    const limited = shuffled.slice(0, parseInt(count));
    
    console.log(`✅ Successfully found ${limited.length} artists with valid images from genre "${randomGenre}"`);
    
    // Verify all returned artists have valid images
    const validArtists = limited.filter(artist => hasValidImageUrl(artist.image));
    
    if (validArtists.length !== limited.length) {
      console.warn(`⚠️ Filtered out ${limited.length - validArtists.length} artists without valid images`);
    }
    
    res.json({
      artists: validArtists,
      genre: randomGenre,
      total: validArtists.length,
      note: 'All artists have verified profile images'
    });
    
  } catch (error) {
    console.error('Error fetching random genre artists:', error.message);
    
    // Return empty array instead of mock data to ensure no placeholder images
    res.json({
      artists: [],
      genre: 'error',
      total: 0,
      error: 'Failed to fetch artists with valid images'
    });
  }
});
//======================//
// Spotify Artist Search
//======================//
app.get('/spotify/search-artists', async (req, res) => {
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

    console.log(`Search for "${query}" returned ${artists.length} artists`);
    res.json(artists);
  } catch (error) {
    console.error('Error in /spotify/search-artists route:', error.message);
    res.status(500).json({ 
      error: 'Failed to search for artists',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

// Add this new endpoint to your index.js file

//======================//
// Apple Music Artist Search
//======================//
// Optimized Apple Music Artist Search endpoint

app.get('/apple-music/search-artists', async (req, res) => {
    const { query } = req.query;
    
    // Input validation
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Valid search query is required' });
    }
    
    // Trim and sanitize the query
    const sanitizedQuery = query.trim();
    if (sanitizedQuery.length === 0) {
      return res.status(400).json({ error: 'Search query cannot be empty' });
    }
  
    try {
      // Get environment variables
      const APPLE_API_BASE_URL = process.env.REACT_APP_APPLE_API_BASE_URL;
      const APPLE_DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;
  
      // Validate environment variables
      if (!APPLE_API_BASE_URL || !APPLE_DEVELOPER_TOKEN) {
        throw new Error('Missing Apple Music API credentials');
      }
  
      // Create the request URL with a smaller limit (10 instead of 20)
      const encodedQuery = encodeURIComponent(sanitizedQuery);
      const url = `${APPLE_API_BASE_URL}/search?term=${encodedQuery}&types=artists&limit=10`;
  
      // Make the request
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}`,
        },
        timeout: 5000 // 5 second timeout for better error handling
      });
  
      // Process the response
      const artists = response.data?.results?.artists?.data || [];
      
      // Format data, using optional chaining and nullish coalescing for safety
      const formattedResults = artists.map(artist => ({
        id: artist.id || `unknown-${Date.now()}`, // Fallback ID
        name: artist.attributes?.name || 'Unknown Artist',
        image: artist.attributes?.artwork?.url?.replace('{w}x{h}', '300x300') || 'fallback.jpg',
        // Only include the most relevant genres (up to 3)
        genres: (artist.attributes?.genreNames || []).slice(0, 3),
      }));
  
      console.log(`Apple Music search for "${sanitizedQuery}" returned ${formattedResults.length} artists`);
      return res.json(formattedResults);
      
    } catch (error) {
      // Enhanced error handling
      console.error('Error in Apple Music search:', error.message);
      
      // Determine the appropriate error response
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return res.status(error.response.status).json({ 
          error: 'Apple Music API error', 
          details: error.response.data?.errors?.[0]?.title || 'Unknown API error'
        });
      } else if (error.request) {
        // The request was made but no response was received
        return res.status(504).json({ error: 'Apple Music API timeout or no response' });
      } else {
        // Something happened in setting up the request
        return res.status(500).json({ error: 'Failed to search for artists', message: error.message });
      }
    }
  });
// In your Express server
app.post('/apple-music/search', async (req, res) => {
    const { searchQuery } = req.body;
    if (!searchQuery) {
      return res.status(400).json({ error: 'No search query' });
    }
    try {
      // call your `searchSongs(searchQuery)` from appleMusicService
      console.log('[Server] /apple-music/search => searchQuery=', searchQuery);

      const results = await appleMusicService.searchSongs(searchQuery);
      return res.json(results);
    } catch (err) {
      console.error('Search failed', err);
      return res.status(500).json({ error: 'Failed searching songs' });
    }
  });

  // Add this to your index.js file after the existing Apple Music endpoints

//======================//
// Apple Music Artist Popular Songs - Dedicated Endpoint
//======================//
app.post('/apple-music/artist-songs', async (req, res) => {
  const { artistName } = req.body;
  console.log('[API] /artist-songs for', artistName);
  if (!artistName) {
    return res.status(400).json({ error: 'Artist name is required' });
  }

  try {
    const APPLE_API_BASE_URL = process.env.REACT_APP_APPLE_API_BASE_URL;
    const APPLE_DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;

    if (!APPLE_API_BASE_URL || !APPLE_DEVELOPER_TOKEN) {
      throw new Error('Missing Apple Music API credentials');
    }

    console.log(`Fetching popular songs for artist: ${artistName}`);

    // Step 1: First find the artist to get their ID
    const artistSearchUrl = `${APPLE_API_BASE_URL}/search?term=${encodeURIComponent(artistName)}&types=artists&limit=1`;
    
    const artistResponse = await axios.get(artistSearchUrl, {
      headers: { Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}` },
      timeout: 5000
    });

    const artists = artistResponse.data?.results?.artists?.data || [];
    
    if (artists.length === 0) {
      console.log(`No artist found for: ${artistName}`);
      return res.json({ songs: [], message: 'Artist not found' });
    }

    const artist = artists[0];
    const artistId = artist.id;
    
    console.log(`Found artist: ${artist.attributes.name} (ID: ${artistId})`);

    // Step 2: Try multiple approaches to get songs

    let allSongs = [];

    // Approach 1: Search for songs by this specific artist
    try {
      const songsSearchUrl = `${APPLE_API_BASE_URL}/search?term=${encodeURIComponent(artistName)}&types=songs&limit=25`;
      
      const songsResponse = await axios.get(songsSearchUrl, {
        headers: { Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}` },
        timeout: 5000
      });

      const searchSongs = songsResponse.data?.results?.songs?.data || [];
      
      // Filter to ensure songs are actually by this artist (exact match)
      const exactArtistSongs = searchSongs.filter(song => {
        const songArtist = song.attributes?.artistName?.toLowerCase().trim();
        const targetArtist = artistName.toLowerCase().trim();
        return songArtist === targetArtist;
      });

      console.log(`Found ${exactArtistSongs.length} songs via search for ${artistName}`);
      allSongs.push(...exactArtistSongs);

    } catch (searchError) {
      console.warn('Song search failed:', searchError.message);
    }

    // Approach 2: Try to get artist's top songs using the artist view (if available)
    try {
      const topSongsUrl = `${APPLE_API_BASE_URL}/artists/${artistId}?views=topSongs`;
      
      const topSongsResponse = await axios.get(topSongsUrl, {
        headers: { Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}` },
        timeout: 5000
      });

      const topSongsData = topSongsResponse.data?.data?.[0]?.views?.topSongs?.data || [];
      
      console.log(`Found ${topSongsData.length} top songs from artist view`);
      allSongs.push(...topSongsData);

    } catch (topSongsError) {
      console.warn('Top songs view failed:', topSongsError.message);
    }

    // Approach 3: Try iTunes lookup API as fallback for popular songs
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=10&sort=popular`;
      
      const itunesResponse = await axios.get(itunesUrl, {
        timeout: 5000
      });

      const itunesResults = itunesResponse.data?.results || [];
      
      // Convert iTunes format to Apple Music format
      const itunesSongs = itunesResults
        .filter(track => track.artistName?.toLowerCase().trim() === artistName.toLowerCase().trim())
        .map(track => ({
          id: track.trackId,
          attributes: {
            name: track.trackName,
            artistName: track.artistName,
            albumName: track.collectionName,
            artwork: {
              url: track.artworkUrl100?.replace('100x100', '300x300') || track.artworkUrl60?.replace('60x60', '300x300')
            },
            previews: track.previewUrl ? [{ url: track.previewUrl }] : []
          }
        }));

      console.log(`Found ${itunesSongs.length} songs from iTunes search`);
      allSongs.push(...itunesSongs);

    } catch (itunesError) {
      console.warn('iTunes search failed:', itunesError.message);
    }

    // Step 3: Process and deduplicate songs
    const processedSongs = [];
    const seenTracks = new Set();

    for (const song of allSongs) {
      const trackName = song.attributes?.name?.toLowerCase().trim();
      const artistNameFromSong = song.attributes?.artistName?.toLowerCase().trim();
      const targetArtist = artistName.toLowerCase().trim();

      // Only include songs that are actually by this artist and we haven't seen before
      if (trackName && 
          artistNameFromSong === targetArtist && 
          !seenTracks.has(trackName)) {
        
        seenTracks.add(trackName);
        
        const artworkUrl = song.attributes?.artwork?.url?.replace('{w}x{h}', '300x300');
        
        processedSongs.push({
          track: song.attributes.name,
          artist: song.attributes.artistName,
          album: song.attributes.albumName || '',
          artworkUrl: artworkUrl || '',
          previewUrl: song.attributes.previews?.[0]?.url || ''
        });
      }
    }

    // Sort by relevance (songs with artwork first, then alphabetically)
    processedSongs.sort((a, b) => {
      const aHasArtwork = a.artworkUrl && a.artworkUrl !== '';
      const bHasArtwork = b.artworkUrl && b.artworkUrl !== '';
      
      if (aHasArtwork && !bHasArtwork) return -1;
      if (!aHasArtwork && bHasArtwork) return 1;
      
      return a.track.localeCompare(b.track);
    });

    // Return top 5 songs
    const finalSongs = processedSongs.slice(0, 5);

    console.log(`✅ Returning ${finalSongs.length} popular songs for ${artistName}`);
    console.log('[API] returning', finalSongs.length, 'songs');
    res.json({
      artist: artistName,
      songs: finalSongs,
      total: finalSongs.length
    });

  } catch (error) {
    console.error(`Error fetching songs for artist ${artistName}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch artist songs',
      message: error.message 
    });
  }
});
// ======================//
// Apple Music Artist-only Search
// ======================//
app.post('/apple-music/artist-search', async (req, res) => {
  const { searchQuery, artistName } = req.body;
  if (!searchQuery || !artistName) {
    return res.status(400).json({ error: 'Missing query or artist' });
  }

  try {
    // reuse the helper that already filters exact-artist hits
    const results = await appleMusicService.searchSongsByArtists(
      searchQuery,
      [artistName]                // pass as one-element array
    );
    return res.json(results);
  } catch (err) {
    console.error('Artist-search failed:', err.message);
    return res.status(500).json({ error: 'Failed artist search' });
  }
});


  // Add these new endpoints to your index.js file

//======================//
// Background Artist Fetching - Batch Processing for Room Artists
//======================//

// NEW: Batch fetch similar artists with rate limiting
app.post('/lastfm/batch-similar-artists', async (req, res) => {
  const { artistBatches } = req.body; // Array of artist name arrays
  
  if (!artistBatches || artistBatches.length === 0) {
      return res.status(400).json({ error: 'No artist batches provided' });
  }

  try {
      const allSimilarArtists = new Map();
      const results = [];

      // Process each batch with delay to respect API limits
      for (let i = 0; i < artistBatches.length; i++) {
          const batch = artistBatches[i];
          console.log(`Processing batch ${i + 1}/${artistBatches.length}:`, batch);

          try {
              const batchResults = await fetchSimilarArtists(batch);
              
              // Add to our collection, avoiding duplicates
              batchResults.forEach(artist => {
                  if (!allSimilarArtists.has(artist.name.toLowerCase())) {
                      allSimilarArtists.set(artist.name.toLowerCase(), artist);
                  }
              });

              results.push({
                  batchIndex: i,
                  artists: batchResults,
                  status: 'success'
              });

              // Add delay between batches to respect API rate limits
              if (i < artistBatches.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
              }

          } catch (batchError) {
              console.error(`Error processing batch ${i}:`, batchError.message);
              results.push({
                  batchIndex: i,
                  artists: [],
                  status: 'error',
                  error: batchError.message
              });
          }
      }

      const uniqueSimilarArtists = Array.from(allSimilarArtists.values());
      
      res.json({
          totalArtists: uniqueSimilarArtists.length,
          batchResults: results,
          similarArtists: uniqueSimilarArtists
      });

  } catch (error) {
      console.error('Error in batch similar artists fetch:', error.message);
      res.status(500).json({ error: 'Failed to fetch similar artists in batches' });
  }
});

//======================//
// Background Image Fetching - Optimized for Large Lists
//======================//

// NEW: Batch fetch images with chunking to avoid overwhelming Spotify API
app.post('/spotify/batch-fetch-images', async (req, res) => {
  const { artistNames, chunkSize = 10 } = req.body;
  
  if (!artistNames || artistNames.length === 0) {
      return res.status(400).json({ error: 'No artist names provided' });
  }

  try {
      const allArtistsWithImages = [];
      const chunks = [];
      
      // Split artist names into chunks
      for (let i = 0; i < artistNames.length; i += chunkSize) {
          chunks.push(artistNames.slice(i, i + chunkSize));
      }

      console.log(`Processing ${artistNames.length} artists in ${chunks.length} chunks`);

      // Process each chunk with delay
      for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          try {
              const chunkResults = await fetchImagesFor(chunk);
              
              // Filter out artists without valid images
              const validArtists = chunkResults.filter(artist => 
                  artist.image && 
                  artist.image !== 'fallback.jpg' && 
                  !artist.image.includes('placeholder')
              );
              
              allArtistsWithImages.push(...validArtists);
              
              // Add delay between chunks to respect API rate limits
              if (i < chunks.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
              }

          } catch (chunkError) {
              console.error(`Error processing image chunk ${i}:`, chunkError.message);
              // Continue with other chunks even if one fails
          }
      }

      console.log(`Successfully fetched images for ${allArtistsWithImages.length}/${artistNames.length} artists`);

      res.json({
          artists: allArtistsWithImages,
          totalRequested: artistNames.length,
          totalWithImages: allArtistsWithImages.length,
          successRate: Math.round((allArtistsWithImages.length / artistNames.length) * 100)
      });

  } catch (error) {
      console.error('Error in batch image fetch:', error.message);
      res.status(500).json({ error: 'Failed to fetch artist images in batches' });
  }
});

//======================//
// Room Artist Pool Generation - Complete Pipeline
//======================//

// NEW: Generate complete artist pool for a room
app.post('/rooms/generate-artist-pool', async (req, res) => {
  const { roomArtists, maxRelatedArtists = 50 } = req.body;
  
  if (!roomArtists || roomArtists.length === 0) {
      return res.status(400).json({ error: 'No room artists provided' });
  }

  try {
      console.log(`Generating artist pool for ${roomArtists.length} room artists`);
      
      // Step 1: Get artist names from room artists
      const roomArtistNames = roomArtists.map(artist => artist.name);
      
      // Step 2: Fetch similar artists in batches (3 artists per batch)
      const batches = [];
      const batchSize = 3;
      
      for (let i = 0; i < roomArtistNames.length; i += batchSize) {
          batches.push(roomArtistNames.slice(i, i + batchSize));
      }

      const similarArtistsResponse = await axios.post(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001'}/lastfm/batch-similar-artists`, {
          artistBatches: batches
      });

      const allSimilarArtists = similarArtistsResponse.data.similarArtists || [];
      
      // Step 3: Get images for similar artists (take top 50 to avoid overwhelming)
      const topSimilarArtists = allSimilarArtists.slice(0, maxRelatedArtists);
      const similarArtistNames = topSimilarArtists.map(artist => artist.name);

      const imagesResponse = await axios.post(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001'}/spotify/batch-fetch-images`, {
          artistNames: similarArtistNames,
          chunkSize: 15 // Larger chunks for similar artists
      });

      const artistsWithImages = imagesResponse.data.artists || [];

      // Step 4: Combine room artists with related artists
      const finalArtistPool = [
          // Original room artists (marked as room artists)
          ...roomArtists.map(artist => ({
              ...artist,
              isRoomArtist: true,
              exponents: Math.floor(Math.random() * 6), // 0-5 exponents
              otherUsers: Math.floor(Math.random() * 5)  // 0-4 other users
          })),
          
          // Related artists with images
          ...artistsWithImages.map(artist => ({
              ...artist,
              isRoomArtist: false,
              exponents: Math.floor(Math.random() * 6),
              otherUsers: Math.floor(Math.random() * 5)
          }))
      ];

      // Step 5: Remove duplicates based on artist name
      const uniqueArtists = finalArtistPool.reduce((acc, artist) => {
          const key = artist.name.toLowerCase();
          if (!acc.has(key)) {
              acc.set(key, artist);
          }
          return acc;
      }, new Map());

      const result = Array.from(uniqueArtists.values());

      console.log(`Generated artist pool: ${result.length} total artists (${roomArtists.length} room, ${result.length - roomArtists.length} related)`);

      res.json({
          artistPool: result,
          stats: {
              totalArtists: result.length,
              roomArtists: roomArtists.length,
              relatedArtists: result.length - roomArtists.length,
              similarArtistsFetched: allSimilarArtists.length,
              artistsWithImages: artistsWithImages.length
          }
      });

  } catch (error) {
      console.error('Error generating artist pool:', error.message);
      res.status(500).json({ 
          error: 'Failed to generate artist pool',
          message: error.message 
      });
  }
});

//======================//
// Lightweight Similar Artists - For Real-time Expansion
//======================//

// NEW: Get similar artists for a single artist (lightweight for real-time use)
app.get('/lastfm/similar/:artistName', async (req, res) => {
  const { artistName } = req.params;
  const { limit = 10 } = req.query;
  
  if (!artistName) {
      return res.status(400).json({ error: 'Artist name is required' });
  }

  try {
      console.log(`Fetching similar artists for: ${artistName}`);
      
      const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
          params: {
              method: 'artist.getsimilar',
              artist: artistName,
              api_key: process.env.REACT_APP_LASTFM_API_KEY,
              format: 'json',
              limit: parseInt(limit)
          },
      });

      const similar = response.data?.similarartists?.artist || [];
      const similarArtistNames = similar.map(artist => artist.name);

      // Get images for the similar artists
      if (similarArtistNames.length > 0) {
          try {
              const imagesResponse = await fetchImagesFor(similarArtistNames);
              const artistsWithImages = imagesResponse.filter(artist => 
                  artist.image && artist.image !== 'fallback.jpg'
              );

              res.json({
                  sourceArtist: artistName,
                  similarArtists: artistsWithImages,
                  count: artistsWithImages.length
              });
          } catch (imageError) {
              // Return similar artists without images if image fetch fails
              res.json({
                  sourceArtist: artistName,
                  similarArtists: similar.map(artist => ({ name: artist.name })),
                  count: similar.length,
                  note: 'Images unavailable'
              });
          }
      } else {
          res.json({
              sourceArtist: artistName,
              similarArtists: [],
              count: 0
          });
      }

  } catch (error) {
      console.error(`Error fetching similar artists for ${artistName}:`, error.message);
      res.status(500).json({ 
          error: 'Failed to fetch similar artists',
          artist: artistName 
      });
  }
});

//======================//
// Artist Pool Refresh - For Dynamic Updates
//======================//

// NEW: Refresh artist pool with new random related artists
app.post('/rooms/refresh-artist-pool', async (req, res) => {
  const { currentPool, roomArtists, refreshCount = 5 } = req.body;
  
  if (!currentPool || currentPool.length === 0) {
      return res.status(400).json({ error: 'Current pool is required' });
  }

  try {
      console.log(`Refreshing artist pool: adding ${refreshCount} new artists`);
      
      // Get a random room artist to find more similar artists
      const roomArtistNames = roomArtists?.map(a => a.name) || [];
      if (roomArtistNames.length === 0) {
          return res.json({ 
              artistPool: currentPool,
              message: 'No room artists available for refresh'
          });
      }

      const randomRoomArtist = roomArtistNames[Math.floor(Math.random() * roomArtistNames.length)];
      
      // Fetch similar artists for the random room artist
      const similarResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001'}/lastfm/similar/${encodeURIComponent(randomRoomArtist)}`, {
          params: { limit: refreshCount * 2 } // Get more than needed to filter
      });

      const newSimilarArtists = similarResponse.data.similarArtists || [];
      
      // Filter out artists already in the current pool
      const currentArtistNames = new Set(currentPool.map(a => a.name.toLowerCase()));
      const freshArtists = newSimilarArtists
          .filter(artist => !currentArtistNames.has(artist.name.toLowerCase()))
          .slice(0, refreshCount)
          .map(artist => ({
              ...artist,
              isRoomArtist: false,
              exponents: Math.floor(Math.random() * 6),
              otherUsers: Math.floor(Math.random() * 5)
          }));

      // Combine with current pool
      const refreshedPool = [...currentPool, ...freshArtists];
      
      res.json({
          artistPool: refreshedPool,
          newArtistsAdded: freshArtists.length,
          sourceArtist: randomRoomArtist,
          totalPoolSize: refreshedPool.length
      });

  } catch (error) {
      console.error('Error refreshing artist pool:', error.message);
      res.status(500).json({ 
          error: 'Failed to refresh artist pool',
          artistPool: currentPool // Return original pool on error
      });
  }
});



//======================//
// Health Check for Background Services
//======================//

// NEW: Check API availability and rate limits
app.get('/api/health-check', async (req, res) => {
  const healthStatus = {
      timestamp: new Date().toISOString(),
      services: {}
  };

  // Check Last.fm API
  try {
      const testResponse = await axios.get('http://ws.audioscrobbler.com/2.0/', {
          params: {
              method: 'artist.getsimilar',
              artist: 'test',
              api_key: process.env.REACT_APP_LASTFM_API_KEY,
              format: 'json',
              limit: 1
          },
          timeout: 5000
      });
      
      healthStatus.services.lastfm = {
          status: 'operational',
          responseTime: Date.now() - new Date(healthStatus.timestamp).getTime()
      };
  } catch (error) {
      healthStatus.services.lastfm = {
          status: 'error',
          error: error.message
      };
  }

  // Check Spotify API
  try {
      const { getAccessToken } = require('./spotifyService');
      const token = await getAccessToken();
      healthStatus.services.spotify = {
          status: 'operational',
          hasToken: !!token
      };
  } catch (error) {
      healthStatus.services.spotify = {
          status: 'error',
          error: error.message
      };
  }

  // Check Apple Music API
  try {
      const APPLE_API_BASE_URL = process.env.REACT_APP_APPLE_API_BASE_URL;
      const APPLE_DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;
      
      healthStatus.services.appleMusic = {
          status: APPLE_API_BASE_URL && APPLE_DEVELOPER_TOKEN ? 'configured' : 'missing_credentials',
          hasCredentials: !!(APPLE_API_BASE_URL && APPLE_DEVELOPER_TOKEN)
      };
  } catch (error) {
      healthStatus.services.appleMusic = {
          status: 'error',
          error: error.message
      };
  }

  const overallStatus = Object.values(healthStatus.services).every(service => 
      service.status === 'operational' || service.status === 'configured'
  ) ? 'healthy' : 'degraded';

  res.json({
      ...healthStatus,
      overallStatus
  });
});

// Add imports at the top of your index.js file if not already present:
// const { fetchSimilarArtists } = require('./lastFmService');
// const { fetchImagesFor } = require('./spotifyService');
  
//======================//
// Start Server
//======================//
export default function registerRoomsRoutes(app) {
  // Put all your route definitions here — e.g.:
  app.use('/api/rooms', roomsRouter);
}
