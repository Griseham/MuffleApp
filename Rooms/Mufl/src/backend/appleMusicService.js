const axios = require('axios');
const APPLE_STOREfront = 'us';

// RECOMMENDED: read env vars once
const APPLE_API_BASE_URL = process.env.REACT_APP_APPLE_API_BASE_URL;
const APPLE_DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;

// Environment variables loaded

if (!APPLE_API_BASE_URL || !APPLE_DEVELOPER_TOKEN) {
  // Missing Apple Music environment variables
}

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

async function fetchAppleMusicTracks(artistName) {
    try {
      const url = `${APPLE_API_BASE_URL}/search?term=${encodeURIComponent(artistName)}&types=songs&limit=5`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}`,
        },
      });
  
      if (!response.data || !response.data.results) {
        return [];
      }
      const appleSongs = response.data.results.songs?.data || [];
      return appleSongs; // raw Apple objects
    } catch (error) {
      return [];
    }
}

async function getArtistsFromMostPlayedSongs(limit = 50, genre = 'pop') {
    try {
        const APPLE_API_BASE_URL = process.env.REACT_APP_APPLE_API_BASE_URL;
        const APPLE_DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;

        if (!APPLE_API_BASE_URL || !APPLE_DEVELOPER_TOKEN) {
            throw new Error('Missing required environment variables: APPLE_API_BASE_URL or APPLE_DEVELOPER_TOKEN');
        }

        // Expanded artist lists for better variety
        const allArtists = {
            'pop': [
                'Taylor Swift', 'Ariana Grande', 'Dua Lipa', 'The Weeknd', 'Billie Eilish',
                'Harry Styles', 'Olivia Rodrigo', 'Doja Cat', 'Justin Bieber', 'Selena Gomez',
                'Ed Sheeran', 'Bruno Mars', 'Adele', 'Lady Gaga', 'Katy Perry',
                'Miley Cyrus', 'Camila Cabello', 'Shawn Mendes', 'Halsey', 'Lorde',
                'Charlie Puth', 'Troye Sivan', 'Bebe Rexha', 'Anne-Marie', 'Charli XCX',
                'Tate McRae', 'Sabrina Carpenter', 'Madison Beer', 'Ava Max', 'Kim Petras'
            ],
            'rock': [
                'Imagine Dragons', 'Coldplay', 'Red Hot Chili Peppers', 'Queen', 'The Beatles',
                'Arctic Monkeys', 'Foo Fighters', 'Green Day', 'Pearl Jam', 'Nirvana',
                'Radiohead', 'The Rolling Stones', 'Led Zeppelin', 'Pink Floyd', 'AC/DC',
                'Metallica', 'Black Sabbath', 'The Who', 'Deep Purple', 'Guns N\' Roses',
                'Linkin Park', 'Fall Out Boy', 'Panic! At The Disco', 'My Chemical Romance', 'Paramore'
            ],
            'hip-hop': [
                'Drake', 'Kendrick Lamar', 'Travis Scott', 'Post Malone', 'Eminem',
                'Jay-Z', 'Kanye West', 'Lil Wayne', 'Nicki Minaj', 'Cardi B',
                'Future', 'Migos', 'Lil Baby', 'DaBaby', 'Roddy Ricch',
                'Tyler, The Creator', 'J. Cole', 'Big Sean', 'Chance the Rapper', '21 Savage',
                'Lil Uzi Vert', 'Playboi Carti', 'A$AP Rocky', 'Juice WRLD', 'XXXTentacion'
            ],
            'r-n-b': [
                'Beyoncé', 'The Weeknd', 'SZA', 'Frank Ocean', 'Alicia Keys',
                'Rihanna', 'Chris Brown', 'Usher', 'John Legend', 'Miguel',
                'H.E.R.', 'Daniel Caesar', 'Summer Walker', 'Jhené Aiko', 'Kehlani',
                'Bryson Tiller', 'Trey Songz', 'Ne-Yo', 'Jason Derulo', 'Tinashe',
                'Solange', 'FKA twigs', 'Jorja Smith', 'Kali Uchis', 'Dvsn'
            ],
            'electronic': [
                'Calvin Harris', 'David Guetta', 'Skrillex', 'Deadmau5', 'Avicii',
                'Martin Garrix', 'Diplo', 'Zedd', 'Marshmello', 'Tiësto',
                'Swedish House Mafia', 'Disclosure', 'Flume', 'ODESZA', 'Porter Robinson',
                'Chainsmokers', 'Major Lazer', 'DJ Snake', 'Kygo', 'Alan Walker',
                'Alesso', 'Afrojack', 'Hardwell', 'Armin van Buuren', 'Above & Beyond'
            ],
            'country': [
                'Taylor Swift', 'Luke Bryan', 'Carrie Underwood', 'Keith Urban', 'Blake Shelton',
                'Florida Georgia Line', 'Thomas Rhett', 'Sam Hunt', 'Kane Brown', 'Chris Stapleton',
                'Maren Morris', 'Kacey Musgraves', 'Miranda Lambert', 'Little Big Town', 'Lady Antebellum',
                'Jason Aldean', 'Kenny Chesney', 'Brad Paisley', 'Tim McGraw', 'Faith Hill',
                'Shania Twain', 'Dolly Parton', 'Johnny Cash', 'Willie Nelson', 'Garth Brooks'
            ],
            'indie': [
                'Arctic Monkeys', 'Tame Impala', 'Vampire Weekend', 'The Strokes', 'Foster the People',
                'MGMT', 'Two Door Cinema Club', 'The 1975', 'Alt-J', 'Glass Animals',
                'Phoenix', 'Kings of Leon', 'The Killers', 'Franz Ferdinand', 'Interpol',
                'Yeah Yeah Yeahs', 'Bloc Party', 'The National', 'Arcade Fire', 'Modest Mouse',
                'Death Cab for Cutie', 'The Shins', 'Fleet Foxes', 'Bon Iver', 'Grizzly Bear'
            ]
        };

        const artistList = allArtists[genre] || allArtists['pop'];
        const results = [];
        const seenNames = new Set();

        // Make batch search requests to get more artists efficiently
        const batchSize = 8; // Smaller batches for more precise results
        const targetCount = Math.min(limit * 2, artistList.length); // Get 2x to filter for images
        
        // Searching for artists with valid images
        
        for (let i = 0; i < Math.ceil(targetCount / batchSize); i++) {
            const batch = artistList.slice(i * batchSize, (i + 1) * batchSize);
            
            try {
                // Search for each artist individually for better image quality
                for (const artistName of batch) {
                    if (results.length >= limit) break;
                    
                    try {
                        const url = `${APPLE_API_BASE_URL}/search?term=${encodeURIComponent(artistName)}&types=artists&limit=1`;
                        const response = await axios.get(url, {
                            headers: { Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}` },
                        });

                        const artists = response.data.results?.artists?.data || [];
                        
                        for (const artist of artists) {
                            if (results.length >= limit) break;
                            
                            const artistNameFromAPI = artist.attributes?.name;
                            const imageUrl = artist.attributes?.artwork?.url?.replace('{w}x{h}', '300x300');
                            
                            // Only add artists with valid images and names
                            if (artistNameFromAPI && 
                                !seenNames.has(artistNameFromAPI.toLowerCase()) && 
                                hasValidImageUrl(imageUrl)) {
                                
                                seenNames.add(artistNameFromAPI.toLowerCase());
                                results.push({
                                    id: artist.id,
                                    name: artistNameFromAPI,
                                    image: imageUrl,
                                    genres: artist.attributes.genreNames || [genre],
                                    isMain: true
                                });
                                
                                // Added artist with valid image
                            } else if (artistNameFromAPI && !hasValidImageUrl(imageUrl)) {
                                // Skipped artist - no valid image
                            }
                        }
                        
                        // Small delay to respect API limits
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (artistError) {
                        // Error searching for artist
                    }
                }
                
            } catch (searchError) {
                // Error in batch search
            }
        }

        return results;
        
    } catch (error) {
        // NO FALLBACK MOCK DATA - if Apple Music fails, return empty array
        // This ensures we only show real artists with real images
        return [];
    }
}

async function getSnippetsForArtists(artistIds) {
    try {
        const APPLE_API_BASE_URL = process.env.REACT_APP_APPLE_API_BASE_URL;
        const APPLE_DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;

        if (!APPLE_API_BASE_URL || !APPLE_DEVELOPER_TOKEN) {
            throw new Error('Missing required environment variables: APPLE_API_BASE_URL or APPLE_DEVELOPER_TOKEN');
        }

        const snippets = [];
        for (const artistId of artistIds) {
            const url = `${APPLE_API_BASE_URL}/artists/${artistId}/songs`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}` },
            });

            const songs = response.data.data || [];
            songs.slice(0, 1).forEach((song) => {
                const artworkUrl = song.attributes?.artwork?.url?.replace('{w}x{h}', '300x300');
                
                // Only add snippets with valid artwork
                if (hasValidImageUrl(artworkUrl)) {
                    snippets.push({
                        track: song.attributes?.name || 'Unknown Track',
                        artist: song.attributes?.artistName || 'Unknown Artist',
                        previewUrl: song.attributes?.previews?.[0]?.url || '',
                        artworkUrl: artworkUrl,
                        hashtags: song.attributes?.genreNames?.map((genre) => `#${genre}`) || ['#Music'],
                    });
                }
            });
        }

        return snippets;
    } catch (error) {
        return [];
    }
}

async function resolveAppleMusicArtistIds(artistNames) {
    const APPLE_API_BASE_URL = process.env.REACT_APP_APPLE_API_BASE_URL;
    const APPLE_DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;

    const resolvedArtists = [];
    for (const name of artistNames) {
        try {
            const response = await axios.get(`${APPLE_API_BASE_URL}/search`, {
                headers: { Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}` },
                params: { term: name, types: 'artists', limit: 1 },
            });

            const artist = response.data.results.artists?.data[0];
            const imageUrl = artist?.attributes?.artwork?.url?.replace('{w}x{h}', '300x300');
            
            // Only resolve artists with valid images
            if (artist && hasValidImageUrl(imageUrl)) {
                resolvedArtists.push({ 
                    id: artist.id, 
                    name: artist.attributes.name,
                    image: imageUrl
                });
            }
        } catch (error) {
            // Error resolving artist
        }
    }

    return resolvedArtists;
}

async function searchSongsByArtists(searchQuery, selectedArtists) {
    if (!APPLE_API_BASE_URL || !APPLE_DEVELOPER_TOKEN) {
        throw new Error('Missing Apple Music API credentials');
    }

    const results = [];

    try {
        for (const artistName of selectedArtists) {
            const url = `${APPLE_API_BASE_URL}/search?term=${encodeURIComponent(
                `${searchQuery} ${artistName}`
            )}&types=songs&limit=5`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}` },
            });

            const songs = response.data.results.songs.data || [];
            results.push(
                ...songs
                    .filter(song => {
                        const artworkUrl = song.attributes.artwork?.url?.replace('{w}x{h}', '300x300');
                        return hasValidImageUrl(artworkUrl);
                    })
                    .map((song) => ({
                        track: song.attributes.name,
                        artist: song.attributes.artistName,
                        previewUrl: song.attributes.previews?.[0]?.url || '',
                        artworkUrl: song.attributes.artwork.url.replace('{w}x{h}', '300x300'),
                    }))
            );
        }

        return results;
    } catch (error) {
        throw error;
    }
}

async function searchSongs(searchQuery) {
    const APPLE_API_BASE_URL = process.env.REACT_APP_APPLE_API_BASE_URL;
    const APPLE_DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN;

    if (!APPLE_API_BASE_URL || !APPLE_DEVELOPER_TOKEN) {
        throw new Error('Missing Apple Music API credentials');
    }
    
    try {
        const url = `${APPLE_API_BASE_URL}/search?term=${encodeURIComponent(searchQuery)}&types=songs&limit=10`;

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}` },
        });

        const songs = response.data.results?.songs?.data || [];

        // Map the results to a simplified structure, filtering for valid artwork
        return songs
            .filter(song => {
                const artworkUrl = song.attributes.artwork?.url?.replace('{w}x{h}', '300x300');
                return hasValidImageUrl(artworkUrl);
            })
            .map((song) => ({
                track: song.attributes.name,
                artist: song.attributes.artistName,
                previewUrl: song.attributes.previews?.[0]?.url || '',
                artworkUrl: song.attributes.artwork.url.replace('{w}x{h}', '300x300'),
            }));
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getArtistsFromMostPlayedSongs,
    getSnippetsForArtists,
    resolveAppleMusicArtistIds,
    searchSongsByArtists,
    searchSongs, 
    fetchAppleMusicTracks,
};