const axios = require('axios');
const LASTFM_API_KEY = process.env.REACT_APP_LASTFM_API_KEY;

/**
 * Fetches similar artists from Last.fm API, but only returns names
 * Images will be fetched separately through Spotify for better reliability
 * @param {Array} selectedArtists - List of artist names to find similar artists for
 * @returns {Array} - Array of similar artist objects with only name property
 */
async function fetchSimilarArtists(selectedArtists) {
    try {
        const allSimilarArtists = new Map();

        for (const artist of selectedArtists) {
            // Fetching similar artists
            try {
                const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
                    params: {
                        method: 'artist.getsimilar',
                        artist,
                        api_key: LASTFM_API_KEY,
                        format: 'json',
                    },
                });

                const similar = response.data?.similarartists?.artist || [];
                similar.forEach((sim) => {
                    if (!allSimilarArtists.has(sim.name)) {
                        // Only store the name, we'll get images from Spotify
                        allSimilarArtists.set(sim.name, {
                            name: sim.name,
                        });
                    }
                });
            } catch (error) {
                // Error fetching similar artists
            }
        }

        return Array.from(allSimilarArtists.values());
    } catch (error) {
        throw error;
    }
}

module.exports = { fetchSimilarArtists };
