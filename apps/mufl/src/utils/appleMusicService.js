import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || '/api';

/**
 * Bulk–fetch square 300-px images for a list of artist names.
 * The back-end endpoint returns   { images:[{id,name,image}] }.
 */
export const fetchAppleMusicImages = async (names = []) => {
  if (!names.length) return [];

  try {
        const { data } = await axios.post(`${API}/apple-music/artist-images`, {
              artistNames: names          // ✅ matches the route
            });
            return data.artists || [];    // ✅ matches the response
  } catch (err) {
    console.error('[AppleMusicImages]', err);
    return [];
  }
};
