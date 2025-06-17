/**
 * Avatar Service – picks consistent avatars from
 * /assets/users/assets2/image1.png … image200.png
 */

const avatarCache = new Map();
const BASE_URL = process.env.PUBLIC_URL || '';   // '' in dev, '/rooms' when homepage is set

const buildAvatarPath = (n) =>
  `${BASE_URL}/assets/users/assets2/image${n}.png`;

/** Hash a string → deterministic 0…199 index */
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;          // 32-bit
  }
  return hash;
};

/** Consistent avatar for a given userId */
export const getAvatarForUser = (userId) => {
  if (avatarCache.has(userId)) return avatarCache.get(userId);

  const imageNumber = Math.abs(hashCode(String(userId)) % 200) + 1; // 1-200
  const url = buildAvatarPath(imageNumber);

  avatarCache.set(userId, url);
  return url;
};

/** Get N distinct random avatars */
export const getRandomAvatars = (count) => {
  const avatars = [];
  const used = new Set();

  while (avatars.length < count) {
    const num = Math.floor(Math.random() * 200) + 1;
    if (used.has(num)) continue;
    used.add(num);
    avatars.push(buildAvatarPath(num));
  }
  return avatars;
};

/** Artist image helper */
export const getArtistImageWithFallback = (artist, fallbackId) => {
  if (
    artist?.image?.startsWith('http') &&
    !artist.image.includes('placeholder') &&
    !artist.image.includes('picsum')
  ) {
    return artist.image;
  }
  return getAvatarForUser(fallbackId || artist.id || artist.name);
};

/** Clear cache (useful in tests) */
export const clearAvatarCache = () => avatarCache.clear();
