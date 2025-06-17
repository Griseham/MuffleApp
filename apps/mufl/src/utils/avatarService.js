/**
 * Avatar Service - Manages random avatar assignment from /assets/users/assets2/image1.png … image200.png
 * Uses root-level assets folder for direct URL access without bundler imports
 */

// Cache for consistent avatar assignments
const avatarCache = new Map();

/**
 * Get a consistent “random” avatar URL for a given userId
 * @param {string|number} userId  – Unique identifier to ensure the same avatar each time
 * @returns {string}  Absolute URL under /assets/users/assets2
 */
export const getAvatarForUser = (userId) => {
  if (avatarCache.has(userId)) {
    return avatarCache.get(userId);
  }

  // Hash userId → 0…199, then +1 → 1…200
  const hash = hashCode(userId.toString());
  const imageNumber = Math.abs(hash % 200) + 1;

  // Interpolate the file name
  const baseURL = process.env.PUBLIC_URL || '';   // '' in plain CRA, '/rooms' when homepage is set
  const avatarUrl = `${baseURL}/assets/image${imageNumber}.png`;
  avatarCache.set(userId, avatarUrl);
  return avatarUrl;
};

/**
 * Get N distinct random avatars (e.g. for an artist pool)
 * @param {number} count  – Number of avatars to pick
 * @returns {string[]}   List of absolute URLs under /assets/users/assets2
 */
export const getRandomAvatars = (count) => {
  const avatars = [];
  const used = new Set();

  while (avatars.length < count) {
    const num = Math.floor(Math.random() * 200) + 1;
    if (used.has(num)) continue;
    used.add(num);
    avatars.push(`/assets/image${num}.png`);
  }

  return avatars;
};

/** Simple string → 32-bit integer hash */
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

/**
 * Return either a valid artist.image URL or fallback to a generated avatar
 * @param {Object} artist     – May have an .image property
 * @param {string} fallbackId – Used if artist.image is invalid
 * @returns {string}
 */
export const getArtistImageWithFallback = (artist, fallbackId) => {
  if (
    artist.image &&
    artist.image.startsWith('http') &&
    !artist.image.includes('placeholder') &&
    !artist.image.includes('picsum')
  ) {
    return artist.image;
  }
  return getAvatarForUser(fallbackId || artist.id || artist.name);
};

/** Clear the in-memory cache (for testing) */
export const clearAvatarCache = () => {
  avatarCache.clear();
};
