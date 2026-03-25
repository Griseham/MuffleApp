import { FOLLOWED_ARTISTS } from "./timelineMockData";
import artistImagesCache from "./cache/artist_images.json";
import artistDiscographyCache from "./cache/artist_discography.json";

const VALID_COMMA_ARTISTS = new Set(
  FOLLOWED_ARTISTS.map((artist) => normalizeName(artist?.name))
);

function normalizeName(name) {
  return String(name || "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeAppleArtworkUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;
  return raw.replace("{w}x{h}", "300x300").replace("{w}", "300").replace("{h}", "300");
}

function buildDiscographyMap() {
  const byName = new Map();

  for (const [rawName, profile] of Object.entries(artistDiscographyCache || {})) {
    const key = normalizeName(rawName);
    if (!key || !profile || byName.has(key)) continue;
    byName.set(key, profile);
  }

  return byName;
}

function buildArtistImageMap() {
  const byName = new Map();

  for (const [rawName, imageUrl] of Object.entries(artistImagesCache || {})) {
    const key = normalizeName(rawName);
    const normalizedImageUrl = normalizeAppleArtworkUrl(imageUrl);
    if (!key || !normalizedImageUrl || byName.has(key)) continue;
    byName.set(key, normalizedImageUrl);
  }

  return byName;
}

function getValidAlbums(profile) {
  return Array.isArray(profile?.albums)
    ? profile.albums.filter((album) => String(album?.title || "").trim())
    : [];
}

function isLikelyCompositeArtistName(name) {
  const raw = String(name || "").trim();
  const normalized = normalizeName(raw);

  if (!normalized) return true;
  if (/[\/]/.test(raw)) return true;
  if (/\s&\s/.test(raw)) return true;
  if (/\sx\s/i.test(raw)) return true;
  if (/\b(and|with|feat\.?|featuring)\b/i.test(raw)) return true;

  const commaCount = (raw.match(/,/g) || []).length;
  if (commaCount > 1) return true;
  if (commaCount === 1 && !VALID_COMMA_ARTISTS.has(normalized)) return true;

  return false;
}

function buildFollowedArtistEntries(artistImageByName) {
  return FOLLOWED_ARTISTS.map((artist) => {
    const normalizedName = normalizeName(artist?.name);
    return {
      ...artist,
      normalizedName,
      artworkUrl: artistImageByName.get(normalizedName) || null,
      isFollowedArtist: true,
      source: "mock",
    };
  }).filter((artist) => artist.normalizedName && artist.artworkUrl);
}

function buildCacheBackedArtistEntries(artistImageByName, discographyByName, followedNameSet) {
  const artists = [];

  for (const [normalizedName, profile] of discographyByName.entries()) {
    if (followedNameSet.has(normalizedName)) continue;

    const name = String(profile?.name || normalizedName).trim();
    const artworkUrl = artistImageByName.get(normalizedName) || null;
    const albums = getValidAlbums(profile);

    if (!name) continue;
    if (!artworkUrl) continue;
    if (albums.length === 0) continue;
    if (isLikelyCompositeArtistName(name)) continue;

    artists.push({
      ...profile,
      name,
      normalizedName,
      artworkUrl,
      albums,
      isFollowedArtist: false,
      source: "cache",
    });
  }

  return artists.sort((left, right) => left.name.localeCompare(right.name));
}

const ARTIST_IMAGE_BY_NAME = buildArtistImageMap();
const ARTIST_DISCOGRAPHY_BY_NAME = buildDiscographyMap();
const FOLLOWED_NAME_SET = new Set(
  FOLLOWED_ARTISTS.map((artist) => normalizeName(artist?.name)).filter(Boolean)
);

export const CACHE_READY_FOLLOWED_ARTISTS = buildFollowedArtistEntries(ARTIST_IMAGE_BY_NAME);
export const CACHE_READY_EXTRA_ARTISTS = buildCacheBackedArtistEntries(
  ARTIST_IMAGE_BY_NAME,
  ARTIST_DISCOGRAPHY_BY_NAME,
  FOLLOWED_NAME_SET
);
export const CACHE_READY_TIMELINE_ARTISTS = [
  ...CACHE_READY_FOLLOWED_ARTISTS,
  ...CACHE_READY_EXTRA_ARTISTS,
];
export const CACHE_READY_TIMELINE_ARTISTS_BY_NAME = new Map(
  CACHE_READY_TIMELINE_ARTISTS.map((artist) => [artist.normalizedName, artist])
);

export function getCacheReadyArtistByName(name) {
  return CACHE_READY_TIMELINE_ARTISTS_BY_NAME.get(normalizeName(name)) || null;
}

export function getCacheReadyTimelineArtists() {
  return CACHE_READY_TIMELINE_ARTISTS.map((artist) => ({ ...artist }));
}

export {
  ARTIST_IMAGE_BY_NAME,
  ARTIST_DISCOGRAPHY_BY_NAME,
  isLikelyCompositeArtistName,
  normalizeName,
  normalizeAppleArtworkUrl,
};
