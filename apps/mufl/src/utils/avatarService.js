/**
 * Avatar Service - Manages deterministic avatar assignment from shared repo assets.
 * The unified server exposes /Users/graham/Desktop/UpdatedWebsite2/assets at /assets/*.
 */

// Cache for consistent avatar assignments
const avatarCache = new Map();
const AVATAR_COUNT = 200;
const AVATAR_BASE_PATH = "/assets/users/assets2";

const buildAvatarPath = (imageNumber) =>
  `${AVATAR_BASE_PATH}/image${imageNumber}.png`;

/**
 * Get a deterministic avatar URL from the shared avatar set.
 * @param {string|number} userId - Unique identifier to ensure consistent avatars per user
 * @returns {string} Avatar URL path
 */
export const getAvatarForUser = (userId) => {
  // Check cache first for consistency
  if (avatarCache.has(userId)) {
    return avatarCache.get(userId);
  }

  // Generate a stable image number based on userId
  const hash = hashCode(userId.toString());
  const imageNumber = Math.abs(hash % AVATAR_COUNT) + 1;
  const avatarUrl = buildAvatarPath(imageNumber);
  
  // Cache the result
  avatarCache.set(userId, avatarUrl);
  
  return avatarUrl;
};

/**
 * Get multiple random avatars (for artist pool when no specific artist image available)
 * @param {number} count - Number of avatars needed
 * @returns {string[]} Array of avatar URLs
 */
export const getRandomAvatars = (count) => {
  const avatars = [];
  const usedNumbers = new Set();

  while (avatars.length < Math.min(count, AVATAR_COUNT)) {
    let imageNumber;
    do {
      imageNumber = Math.floor(Math.random() * AVATAR_COUNT) + 1;
    } while (usedNumbers.has(imageNumber));

    usedNumbers.add(imageNumber);
    avatars.push(buildAvatarPath(imageNumber));
  }

  return avatars;
};

/**
 * Simple hash function for consistent avatar assignment
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
};

/**
 * Get avatar with fallback for artist images
 * @param {Object} artist - Artist object with potential image
 * @param {string} fallbackId - ID to use for avatar fallback
 * @returns {string} Image URL (artist image or avatar fallback)
 */
export const getArtistImageWithFallback = (artist, fallbackId) => {
  // If artist has a valid image, use it
  if (artist.image && 
      artist.image !== 'fallback.jpg' && 
      artist.image !== '/placeholder-200.png' &&
      !artist.image.includes('placeholder') &&
      !artist.image.includes('picsum') &&
      artist.image.startsWith('http')) {
    return artist.image;
  }
  
  // Otherwise use avatar
  return getAvatarForUser(fallbackId || artist.id || artist.name);
};

/**
 * Clear avatar cache (useful for testing or resetting)
 */
export const clearAvatarCache = () => {
  avatarCache.clear();
};
