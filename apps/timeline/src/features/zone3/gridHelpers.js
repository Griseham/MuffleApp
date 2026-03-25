import { GRID_ARTISTS } from "../../backend/timelineMockData";

// ── Utilities ─────────────────────────────────────────────────────────────────

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function hashStringToInt(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rand01(seed) {
  const n = typeof seed === "number" ? seed : hashStringToInt(String(seed));
  return mulberry32(n)();
}

// ── Public helpers ─────────────────────────────────────────────────────────────

export const getRandomArtist = (seed) => {
  const idx = hashStringToInt(String(seed)) % GRID_ARTISTS.length;
  return GRID_ARTISTS[idx];
};

export const getRanking = (seed) => {
  const r = rand01(seed);
  return Math.floor(r * 100) + 1;
};

export const getGradient = (userId, bucketKey) => {
  const angle = (hashStringToInt(`${userId}-${bucketKey}`) % 360) + 1;
  return `linear-gradient(${angle}deg, #282B29 0%, #1a1a1a 50%, #282B29 100%)`;
};

function densityForUser(user, config) {
  const norm = user.__norm || { volume01: 0.2, rated01: 0.2, genre01: 0.2 };
  if (config.zone3Filter === "mostRated") return clamp01(0.15 + 0.75 * norm.rated01);
  if (config.zone3Filter === "volume")    return clamp01(0.15 + 0.75 * norm.volume01);
  if (config.zone3Filter === "genre")     return clamp01(0.15 + 0.75 * norm.genre01);
  return clamp01(0.08 + 0.35 * norm.volume01);
}

export const hasAlbum = (user, bucket, config) => {
  if (!user || !bucket) return false;
  if (user.isTopAlbums) return true;

  if (config.zone3Filter === "volume" && user.__stats?.volume < config.zone3VolumeMin) {
    return false;
  }

  const density = densityForUser(user, config);
  const indices = Array.isArray(bucket.bucketIndices) ? bucket.bucketIndices : [];

  if (indices.length > 1) {
    for (const mi of indices) {
      if (rand01(`${user.id}-${mi}`) < density) return true;
    }
    return false;
  }

  return rand01(`${user.id}-${bucket.key ?? indices[0] ?? 0}`) < density;
};