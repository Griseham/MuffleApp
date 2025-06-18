/* apps/threads/src/utils/avatarService.js  (overwrite the file) */
const avatarCache = new Map();

/** '' in dev, '/threads' after you build with  base:'/threads/' */
const BASE_URL =
  (typeof process !== 'undefined' && process.env.PUBLIC_URL) ||
  (typeof import.meta === 'object' && import.meta.env?.BASE_URL) ||
  '';

/** remove trailing slash then build the path */
const buildAvatarPath = (n) =>
  `${BASE_URL.replace(/\/$/, '')}/assets/image${n}.png`;

/** deterministic avatar for a user */
export const getAvatarForUser = (userId) => {
  if (avatarCache.has(userId)) return avatarCache.get(userId);
  const img = Math.abs(hashCode(String(userId)) % 200) + 1;   // 1-200
  const url = buildAvatarPath(img);
  avatarCache.set(userId, url);
  return url;
};

/** N distinct random avatars */
export const getRandomAvatars = (count) => {
  const used = new Set();
  const out  = [];
  while (out.length < count) {
    const n = Math.floor(Math.random() * 200) + 1;
    if (used.has(n)) continue;
    used.add(n);
    out.push(buildAvatarPath(n));
  }
  return out;
};

const hashCode = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return h;
};

/** Fallback for artist images */
export const getArtistImageWithFallback = (artist, fallbackId) =>
  (artist?.image?.startsWith('http') &&
   !artist.image.includes('placeholder') &&
   !artist.image.includes('picsum'))
     ? artist.image
     : getAvatarForUser(fallbackId || artist.id || artist.name);

export const clearAvatarCache = () => avatarCache.clear();
