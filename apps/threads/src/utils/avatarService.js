/**
 * Avatar Service - Manages random avatar assignment from public/assets/image1.png to image200.png
 * Uses public folder assets for direct URL access without imports
 */

// Cache for consistent avatar assignments
const avatarCache = new Map();

/**
 * Get a random avatar URL from the 200 available images
 * @param {string|number} userId - Unique identifier to ensure consistent avatars per user
 * @returns {string} Avatar URL path
 */
export const getAvatarForUser = (userId) => {
  // Check cache first for consistency
  if (avatarCache.has(userId)) {
    return avatarCache.get(userId);
  }

  // Generate random number 1-1000 based on userId
  const hash = hashCode(userId.toString());
  const imageNumber = Math.abs(hash % 200) + 1;
  const avatarUrl = `/assets/image${imageNumber}.png`;
  
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
  
  for (let i = 0; i < count; i++) {
    let imageNumber;
    do {
      imageNumber = Math.floor(Math.random() * 200) + 1;
    } while (usedNumbers.has(imageNumber));
    
    usedNumbers.add(imageNumber);
    avatars.push(`/assets/users/assets2/image${imageNumber}.png`);
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