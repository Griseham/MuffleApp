import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  getCacheReadyTimelineArtists,
  loadCacheReadyArtists,
} from "../../backend/cacheReadyArtists";
import ZONE3_DATA from "../../backend/cache/zone3_data.json";
import Zone1Header from "./Zone1Header";
import ArtistDot from "./ArtistDot";
import { BellIcon } from "../Icons";
import { getAvatarSrcFromNumber } from "../avatarAssets";
import { ZONE1_TAB_INFO_MODALS } from "../infoContent";
import {
  ZONE1_MONTHS,
  ZONE1_PAST_YEARS,
  ZONE1_CURRENT_TIMELINE_YEAR,
  ZONE1_FUTURE_YEAR,
  ZONE1_CURRENT_MONTH_INDEX,
  ZONE1_SEPARATOR_INDEX,
} from "./timelineBounds";
import {
  getActiveRating,
  getBaselineRating,
  getViewLabel,
  getXPosition,
  getYPosition,
} from "./position";

const SEPARATOR_INDEX = ZONE1_SEPARATOR_INDEX;
const PAST_YEARS = ZONE1_PAST_YEARS;
const CURRENT_TIMELINE_YEAR = ZONE1_CURRENT_TIMELINE_YEAR;
const FUTURE_YEAR = ZONE1_FUTURE_YEAR;
const FUTURE_ARTIST_COUNT_DEFAULT = 7;
const FUTURE_ARTIST_COUNT_ANTICIPATED = 5;
const TOP_ARTISTS_PER_YEAR = 5;
const TOP_ARTISTS_POOL_PER_YEAR = 14;
const TOP_ARTISTS_FUTURE_MIN = 1;
const TOP_ARTISTS_FUTURE_MAX = 3;
const MAX_FRIEND_TIMELINES = 3;
const YOU_AVATAR_SRC = getAvatarSrcFromNumber(182);
const AVAILABLE_ZONE1_FRIENDS = [
  {
    id: "friend_alex",
    name: "Alex",
    avatar: "A",
    avatarSrc: getAvatarSrcFromNumber(241),
    color: "#85C1E9",
  },
  {
    id: "friend_jordan",
    name: "Jordan",
    avatar: "J",
    avatarSrc: getAvatarSrcFromNumber(377),
    color: "#C9B1FF",
  },
  {
    id: "friend_sam",
    name: "Sam",
    avatar: "S",
    avatarSrc: getAvatarSrcFromNumber(512),
    color: "#7DD3C0",
  },
  {
    id: "friend_riley",
    name: "Riley",
    avatar: "R",
    avatarSrc: getAvatarSrcFromNumber(689),
    color: "#F1948A",
  },
];
const TOP_ARTISTS_LANE_HEIGHT = 224;
const TOP_ARTISTS_LANE_GAP = 18;
const TOP_ARTISTS_LANE_DOT_Y = 16;
const TOP_ARTISTS_ALBUM_SIZE = 112;
const TOP_ARTISTS_ALBUM_TOP = 78;
const TOP_ALBUMS_VIEW_TRANSITION_MS = 420;
const MONTH_START_BY_YEAR = (() => {
  const starts = new Map();
  ZONE1_MONTHS.forEach((month, index) => {
    if (!starts.has(month.year)) starts.set(month.year, index);
  });
  return starts;
})();

let ALBUM_ARTWORK_BY_ARTIST_AND_ALBUM = new Map();
let albumArtworkLoadPromise = null;

function getMiddleMonthIndex(year, fallbackIndex) {
  const monthIndexes = [];
  for (let i = 0; i < ZONE1_MONTHS.length; i += 1) {
    if (ZONE1_MONTHS[i].year === year) monthIndexes.push(i);
  }
  if (monthIndexes.length === 0) return fallbackIndex;
  return monthIndexes[Math.floor(monthIndexes.length / 2)];
}

function getCenteredMonthScrollLeft(monthIndex, monthWidth, viewportWidth) {
  const monthCenterX = (monthIndex + 0.5) * monthWidth;
  return Math.max(0, monthCenterX - viewportWidth / 2);
}

const ANTICIPATED_ALBUM_NAMES = [
  "Nation II", "R9", "Hurry Up Tomorrow", "Lana", "Eternal Atake 2",
];
const GENRE_MANUAL_ARTIST_FALLBACKS = {
  Electronic: [
    "Martin Garrix",
    "Martin Garrix & Dua Lipa",
    "Marshmello & Imanbek",
    "Taylor Swift & Skream",
    "Jonas Blue",
    "Sabrina Carpenter & Jonas Blue",
    "Calvin Harris, Dua Lipa & Young Thug",
  ],
};
const MANUAL_GENRE_ARTIST_SETS = Object.fromEntries(
  Object.entries(GENRE_MANUAL_ARTIST_FALLBACKS).map(([genre, artists]) => [
    genre,
    new Set((artists || []).map((name) => normalizeName(name))),
  ])
);
const TOP_ALBUM_NAMES = [
  "Midnight Sessions", "Neon Dreams", "Velvet Horizon", "Dark Paradise",
  "Golden Hour", "Electric Soul", "Phantom Waves", "Crystal Memory",
  "Silk & Steel", "Shadow Dance", "Lunar Phase", "Ember Glow",
  "Sonic Bloom", "Violet Haze", "Iron Butterfly", "Ocean Floor",
  "Star Residue", "Glass Cathedral", "Thunder Rose", "Binary Sunset",
  "After Hours", "Scorpion", "Renaissance", "Utopia", "SOS",
  "Happier Than Ever", "Future Nostalgia", "Astroworld", "Blond",
  "Cowboy Carter", "GNX", "Vultures", "Eternal Sunshine",
];

function normalizeName(name) {
  return String(name || "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getArtistInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function sanitizeArtistKey(name) {
  const normalized = normalizeName(name).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "artist";
}

const { ARTIST_GENRE_SCORES_BY_NAME, ZONE3_ARTISTS_BY_GENRE } = (() => {
  const byName = new Map();
  const artistsByGenre = new Map();
  const genreCountsByArtist = new Map();
  const zone3Albums = Array.isArray(ZONE3_DATA?.albums) ? ZONE3_DATA.albums : [];

  zone3Albums.forEach((entry) => {
    const genre = String(entry?.genre || "").trim();
    const artistName = String(entry?.artistName || "").trim();
    const normalizedName = normalizeName(artistName);
    if (!genre || !normalizedName) return;

    if (!genreCountsByArtist.has(normalizedName)) {
      genreCountsByArtist.set(normalizedName, new Map());
    }
    const genreCounts = genreCountsByArtist.get(normalizedName);
    genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);

    if (!artistsByGenre.has(genre)) {
      artistsByGenre.set(genre, new Map());
    }
    const byGenre = artistsByGenre.get(genre);
    let artist = byGenre.get(normalizedName);
    if (!artist) {
      artist = {
        id: `zone3-${sanitizeArtistKey(artistName)}`,
        name: artistName,
        initials: getArtistInitials(artistName),
        artworkUrl: String(entry?.artistImageUrl || entry?.artworkUrl || "").trim() || null,
        albums: [],
      };
      byGenre.set(normalizedName, artist);
    }

    const albumTitle = String(entry?.albumName || "").trim();
    const albumArtworkUrl = String(entry?.artworkUrl || "").trim();
    if (albumTitle && !artist.albums.some((album) => normalizeName(album?.title) === normalizeName(albumTitle))) {
      artist.albums.push({
        title: albumTitle,
        artworkUrl: albumArtworkUrl || null,
      });
    }
  });

  genreCountsByArtist.forEach((genreCounts, normalizedName) => {
    const total = Array.from(genreCounts.values()).reduce((sum, count) => sum + count, 0);
    if (!total) return;
    const normalizedScores = {};
    genreCounts.forEach((count, genre) => {
      normalizedScores[genre] = count / total;
    });
    byName.set(normalizedName, normalizedScores);
  });

  return {
    ARTIST_GENRE_SCORES_BY_NAME: byName,
    ZONE3_ARTISTS_BY_GENRE: artistsByGenre,
  };
})();

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function formatWaitersCount(count) {
  if (!count) return "0";
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`.replace(".0K", "K");
  }
  return String(count);
}

function makeRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng(items, rng) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickCountForYear(rng) {
  return 5 + Math.floor(rng() * 5);
}

function dedupeArtistsByName(artists) {
  const seen = new Set();
  const deduped = [];
  for (const artist of artists) {
    const key = normalizeName(artist.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(artist);
  }
  return deduped;
}

const FALLBACK_ARTIST_COLORS = [
  "#8B7355",
  "#6B8E8E",
  "#7B6B8E",
  "#8E6B7A",
  "#5E6B5C",
  "#5C6B5E",
  "#7D6A4F",
  "#6D7C8E",
];

function getArtistColor(artist, seed = "") {
  const explicitColor = String(artist?.color || "").trim();
  if (explicitColor) return explicitColor;
  const key = `${normalizeName(artist?.name)}-${seed}`;
  return FALLBACK_ARTIST_COLORS[hashString(key) % FALLBACK_ARTIST_COLORS.length];
}

function getArtistAlbumTitles(artist) {
  const titles = [];
  const seen = new Set();

  const addTitle = (value) => {
    const title = String(value || "").trim();
    const normalized = normalizeName(title);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    titles.push(title);
  };

  addTitle(artist?.albumName);
  (artist?.albums || []).forEach((album) => addTitle(album?.title));
  return titles;
}

function buildAlbumArtworkLookup(albumArtworksCache) {
  const map = new Map();
  Object.values(albumArtworksCache || {}).forEach((entry) => {
    const artworkUrl = String(entry?.artworkUrl || "").trim();
    const artistName = normalizeName(entry?.artistName);
    const albumName = normalizeName(entry?.albumName);
    if (!artworkUrl || !artistName || !albumName) return;
    const key = `${artistName}|||${albumName}`;
    if (!map.has(key)) {
      map.set(key, artworkUrl);
    }
  });
  return map;
}

function getDataUrl(fileName) {
  return `${import.meta.env.BASE_URL}data/${fileName}`;
}

async function loadAlbumArtworkCache() {
  if (albumArtworkLoadPromise) return albumArtworkLoadPromise;

  albumArtworkLoadPromise = fetch(getDataUrl("album_artworks.json"), { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load album_artworks.json: ${response.status}`);
      }
      return response.json();
    })
    .then((albumArtworksCache) => {
      ALBUM_ARTWORK_BY_ARTIST_AND_ALBUM = buildAlbumArtworkLookup(albumArtworksCache);
      return true;
    })
    .catch(() => {
      return false;
    })
    .finally(() => {
      albumArtworkLoadPromise = null;
    });

  return albumArtworkLoadPromise;
}

function getAlbumArtworkForArtistAlbum(artistName, albumName) {
  const key = `${normalizeName(artistName)}|||${normalizeName(albumName)}`;
  return ALBUM_ARTWORK_BY_ARTIST_AND_ALBUM.get(key) || null;
}

function buildTimelinePlacement(
  uniqueArtists,
  {
    futureArtistCount = FUTURE_ARTIST_COUNT_DEFAULT,
    pastArtistCount = null,
  } = {}
) {
  const signature = uniqueArtists.map((a) => normalizeName(a.name)).sort().join("|");
  const rng = makeRng(hashString(signature || "zone1"));
  const sourceArtists = shuffleWithRng(uniqueArtists, rng);
  const available = [...sourceArtists];
  let recycleCycle = 0;
  const output = [];

  const takeNextArtist = () => {
    if (!sourceArtists.length) return null;
    if (!available.length) {
      recycleCycle += 1;
      available.push(
        ...shuffleWithRng(
          sourceArtists.map((artist) => ({
            ...artist,
            id: `${artist.id}-repeat-${recycleCycle}`,
          })),
          rng
        )
      );
    }
    return available.pop();
  };

  const assignYear = (year, count) => {
    const yearStart = MONTH_START_BY_YEAR.get(year);
    if (yearStart === undefined) return;
    for (let i = 0; i < count; i += 1) {
      const artist = takeNextArtist();
      if (!artist) break;
      const monthOffset = Math.floor(rng() * 12);
      const releaseDay = 1 + Math.floor(rng() * 28);
      const isFuture = year === FUTURE_YEAR;
      output.push({
        ...artist,
        releaseMonth: yearStart + monthOffset,
        releaseDay,
        isAnticipated: isFuture,
        albumName: isFuture ? (ANTICIPATED_ALBUM_NAMES[i % ANTICIPATED_ALBUM_NAMES.length]) : (artist.albumName || null),
      });
    }
  };
  PAST_YEARS.forEach((year) => assignYear(year, pastArtistCount ?? pickCountForYear(rng)));
  assignYear(FUTURE_YEAR, futureArtistCount);
  return output.sort((a, b) =>
    a.releaseMonth - b.releaseMonth || a.releaseDay - b.releaseDay || a.name.localeCompare(b.name)
  );
}

function buildUniqueZone1Artists(
  artistPool,
  {
    futureArtistCount = FUTURE_ARTIST_COUNT_DEFAULT,
    pastArtistCount = null,
  } = {}
) {
  const unique = dedupeArtistsByName(artistPool || []);
  return buildTimelinePlacement(unique, { futureArtistCount, pastArtistCount });
}

function getArtistGenreAffinity(artist, selectedGenre) {
  const normalizedArtistName = normalizeName(artist?.name);
  const manualGenreArtists = MANUAL_GENRE_ARTIST_SETS[selectedGenre] || new Set();
  if (manualGenreArtists.has(normalizedArtistName)) {
    return 1;
  }

  const knownGenreScores = ARTIST_GENRE_SCORES_BY_NAME.get(normalizedArtistName);
  const knownScore = knownGenreScores ? Number(knownGenreScores[selectedGenre]) : NaN;
  if (Number.isFinite(knownScore)) {
    return knownScore;
  }

  const genreHasCatalog = ZONE3_ARTISTS_BY_GENRE.has(selectedGenre) || manualGenreArtists.size > 0;
  if (genreHasCatalog) {
    return 0;
  }

  const seeded = hashString(`${normalizedArtistName}|${selectedGenre}|anticipated-genre-affinity`);
  return 0.18 + ((seeded % 1000) / 1000) * 0.72;
}

function buildGenreArtistCandidatePool(artistPool, selectedGenre) {
  const byName = new Map();
  dedupeArtistsByName(artistPool || []).forEach((artist) => {
    const key = normalizeName(artist?.name);
    if (!key || byName.has(key)) return;
    byName.set(key, artist);
  });

  const zone3ArtistsForGenre = ZONE3_ARTISTS_BY_GENRE.get(selectedGenre);
  if (zone3ArtistsForGenre) {
    zone3ArtistsForGenre.forEach((artist, normalizedName) => {
      if (byName.has(normalizedName)) {
        const existing = byName.get(normalizedName);
        if (!existing.artworkUrl && artist.artworkUrl) {
          byName.set(normalizedName, {
            ...existing,
            artworkUrl: artist.artworkUrl,
          });
        }
        if ((!existing.albums || existing.albums.length === 0) && artist.albums?.length) {
          byName.set(normalizedName, {
            ...byName.get(normalizedName),
            albums: artist.albums,
          });
        }
      } else {
        byName.set(normalizedName, {
          ...artist,
          color: getArtistColor(artist, selectedGenre),
        });
      }
    });
  }

  (GENRE_MANUAL_ARTIST_FALLBACKS[selectedGenre] || []).forEach((artistName) => {
    const normalizedName = normalizeName(artistName);
    if (!normalizedName || byName.has(normalizedName)) return;
    const artist = {
      id: `manual-${sanitizeArtistKey(artistName)}`,
      name: artistName,
      initials: getArtistInitials(artistName),
    };
    byName.set(normalizedName, {
      ...artist,
      color: getArtistColor(artist, selectedGenre),
    });
  });

  return Array.from(byName.values());
}

function buildGenreMatchedFutureArtists(
  artistPool,
  {
    genre,
    count = FUTURE_ARTIST_COUNT_ANTICIPATED,
  } = {}
) {
  const futureYearStart = MONTH_START_BY_YEAR.get(FUTURE_YEAR);
  if (futureYearStart === undefined) return [];

  const selectedGenre = String(genre || "").trim();
  const uniqueArtists = buildGenreArtistCandidatePool(artistPool, selectedGenre);
  if (!selectedGenre || uniqueArtists.length === 0 || count <= 0) return [];

  const genreKey = selectedGenre.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "genre";
  const rankedArtists = uniqueArtists
    .map((artist) => {
      const artistName = String(artist?.name || "");
      const normalizedArtistName = normalizeName(artistName);
      const tieBreaker = hashString(`${normalizedArtistName}|${selectedGenre}|anticipated-order`);
      return {
        artist,
        affinity: getArtistGenreAffinity(artist, selectedGenre),
        tieBreaker,
      };
    })
    .sort((left, right) =>
      right.affinity - left.affinity ||
      left.tieBreaker - right.tieBreaker ||
      String(left.artist?.name || "").localeCompare(String(right.artist?.name || ""))
    );

  return rankedArtists
    .slice(0, count)
    .map(({ artist }, index) => {
      const artistKey = sanitizeArtistKey(artist?.name);
      const releaseDaySeed = hashString(`${artistKey}|${selectedGenre}|anticipated-day|${index}`);
      const albumSeed = hashString(`${artistKey}|${selectedGenre}|anticipated-album|${index}`);
      return {
        ...artist,
        id: `anticipated-${genreKey}-${artistKey}-${index}`,
        releaseMonth: futureYearStart + clamp(Math.floor(((index + 1) * 12) / (count + 1)), 0, 11),
        releaseDay: 1 + (releaseDaySeed % 28),
        isAnticipated: true,
        albumName: ANTICIPATED_ALBUM_NAMES[albumSeed % ANTICIPATED_ALBUM_NAMES.length],
      };
    })
    .sort(sortArtistsChronologically);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveArtistCollisions(items, { artistSize, timelineHeight }) {
  const minY = 20;
  const maxY = timelineHeight - artistSize - 16;
  const labelCollisionWidth = 124;
  const labelCollisionHeight = 78;
  const placed = [];

  for (const item of items) {
    const x = item.preferredX;
    const clampedPreferredY = clamp(item.preferredY, minY, maxY);

    let y = clampedPreferredY;
    let attempt = 0;

    while (attempt < 40) {
      const collides = placed.some((p) => {
        const xDelta = Math.abs((x + artistSize / 2) - (p.x + artistSize / 2));
        const yDelta = Math.abs(y - p.y);
        return xDelta < labelCollisionWidth && yDelta < labelCollisionHeight;
      });

      if (!collides) break;

      attempt += 1;
      const yStep = Math.ceil(attempt / 2) * 20;
      const yDirection = attempt % 2 === 0 ? -1 : 1;
      y = clamp(clampedPreferredY + yDirection * yStep, minY, maxY);
    }

    const baselineY = clamp(item.baselineY, minY, maxY);
    placed.push({ ...item, x, y, baselineY, activeY: y });
  }

  return placed;
}

function getArtistsForYear(artists, year) {
  const yearStart = MONTH_START_BY_YEAR.get(year);
  if (yearStart === undefined) return [];
  const yearEnd = yearStart + 12;
  return artists.filter(
    (artist) =>
      !artist.isAnticipated &&
      artist.releaseMonth !== undefined &&
      artist.releaseMonth >= yearStart &&
      artist.releaseMonth < yearEnd
  );
}

function sortArtistsChronologically(a, b) {
  return (
    a.releaseMonth - b.releaseMonth ||
    (a.releaseDay || 0) - (b.releaseDay || 0) ||
    a.name.localeCompare(b.name)
  );
}

function sortArtistsByBaselineRank(a, b) {
  return getBaselineRating(b) - getBaselineRating(a) || a.name.localeCompare(b.name);
}

function getTimelineUserAlbumCount(userKey, year) {
  return 1 + (hashString(`${userKey}-${year}-album-count`) % 4);
}

function selectYearArtistsForLane(
  artists,
  {
    laneKey,
    year,
    targetCount,
    blockedArtistNames = new Set(),
  }
) {
  const blocked = blockedArtistNames;
  const yearArtists = [...artists]
    .sort((a, b) => {
      const aScore = hashString(`${a.id}-${laneKey}-${year}`);
      const bScore = hashString(`${b.id}-${laneKey}-${year}`);
      return aScore - bScore || a.name.localeCompare(b.name);
    });

  if (yearArtists.length === 0 || targetCount <= 0) return [];

  const selected = [];
  const selectedNames = new Set();

  for (const artist of yearArtists) {
    const key = normalizeName(artist.name);
    if (!key || blocked.has(key) || selectedNames.has(key)) continue;
    selected.push(artist);
    selectedNames.add(key);
    if (selected.length >= targetCount) break;
  }

  if (selected.length < targetCount) {
    for (const artist of yearArtists) {
      const key = normalizeName(artist.name);
      if (!key || selectedNames.has(key)) continue;
      selected.push(artist);
      selectedNames.add(key);
      if (selected.length >= targetCount) break;
    }
  }

  return selected.sort(sortArtistsChronologically);
}

function getTimelineUserYearArtistsDiverse(artists, userKey, year, blockedArtistNames = new Set()) {
  const blocked = blockedArtistNames;
  const targetCount = getTimelineUserAlbumCount(userKey, year);
  const yearArtists = getArtistsForYear(artists, year);
  return selectYearArtistsForLane(yearArtists, {
    laneKey: userKey,
    year,
    targetCount,
    blockedArtistNames: blocked,
  });
}

function getRandomFutureLaneArtists(artists, laneKey, targetCount, blockedArtistNames = new Set()) {
  if (!Array.isArray(artists) || artists.length === 0 || targetCount <= 0) return [];
  const blocked = blockedArtistNames;
  const ranked = [...artists].sort((a, b) => {
    const aScore = hashString(`${a.id}-${laneKey}-future`);
    const bScore = hashString(`${b.id}-${laneKey}-future`);
    return aScore - bScore || a.name.localeCompare(b.name);
  });

  const selected = [];
  const selectedNames = new Set();
  for (const artist of ranked) {
    const key = normalizeName(artist?.name);
    if (!key || blocked.has(key) || selectedNames.has(key)) continue;
    selected.push(artist);
    selectedNames.add(key);
    if (selected.length >= targetCount) break;
  }

  if (selected.length < targetCount) {
    for (const artist of ranked) {
      const key = normalizeName(artist?.name);
      if (!key || selectedNames.has(key)) continue;
      selected.push(artist);
      selectedNames.add(key);
      if (selected.length >= targetCount) break;
    }
  }

  return selected;
}

function getPreferredAlbumArtworkUrl(artist, albumName) {
  const fromCache = getAlbumArtworkForArtistAlbum(artist?.name, albumName);
  if (fromCache) return fromCache;

  const normalizedAlbumName = normalizeName(albumName);
  if (normalizedAlbumName) {
    const byAlbumName = (artist?.albums || []).find(
      (album) =>
        normalizeName(album?.title) === normalizedAlbumName &&
        String(album?.artworkUrl || "").trim()
    );
    if (byAlbumName?.artworkUrl) {
      return String(byAlbumName.artworkUrl).trim();
    }
  }

  const firstAlbumArtwork = (artist?.albums || []).find(
    (album) => String(album?.artworkUrl || "").trim()
  );
  if (firstAlbumArtwork?.artworkUrl) {
    return String(firstAlbumArtwork.artworkUrl).trim();
  }

  return String(artist?.artworkUrl || "").trim() || null;
}

function getTopArtistAlbumDetails(artist, year) {
  const artistAlbumTitles = getArtistAlbumTitles(artist);
  let albumName = null;
  if (artistAlbumTitles.length > 0) {
    const albumIndex = hashString(`${artist.name}-${year}`) % artistAlbumTitles.length;
    albumName = artistAlbumTitles[albumIndex];
  } else {
    const idx = hashString(`${artist.name}-${year}`) % TOP_ALBUM_NAMES.length;
    albumName = TOP_ALBUM_NAMES[idx];
  }

  return {
    albumName,
    albumArtworkUrl: getPreferredAlbumArtworkUrl(artist, albumName),
  };
}

function enrichAnticipatedArtist(artist, waitingArtistIds) {
  if (!artist?.isAnticipated) return artist;

  const month = ZONE1_MONTHS[artist.releaseMonth];
  const releaseDate = artist.releaseDate || (
    month ? `${month.fullName} ${artist.releaseDay}, ${month.year}` : "Coming soon"
  );
  const waitersCount = artist.waitersCount ?? (
    500 + (hashString(`${normalizeName(artist.name)}-${artist.releaseMonth}-${artist.releaseDay}`) % 9501)
  );

  return {
    ...artist,
    releaseDate,
    waitersCount,
    isWaiting: waitingArtistIds.has(String(artist.id)),
  };
}

function TopAlbumArt({ artist, albumName, albumArtworkUrl, size, usePlaceholder = false }) {
  const artistColor = getArtistColor(artist, albumName || "album");
  const resolvedArtworkUrl = String(usePlaceholder ? "" : (albumArtworkUrl || artist?.artworkUrl || "")).trim();
  if (resolvedArtworkUrl) {
    return (
      <div
        className="top-artist-album-art"
        style={{
          width: size,
          height: size,
        }}
      >
        <img
          src={resolvedArtworkUrl}
          alt={`${albumName || "Album"} cover`}
          className="top-artist-album-img"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const h = hashString((albumName || "album") + artist.name);
  const rng = makeRng(h);
  const r2 = Math.floor(rng() * 45 + 10);
  const g2 = Math.floor(rng() * 45 + 10);
  const b2 = Math.floor(rng() * 45 + 10);
  const c2 = `rgb(${r2},${g2},${b2})`;
  const angle = Math.floor(rng() * 360);
  const cx = 20 + rng() * 60;
  const cy = 15 + rng() * 70;
  const hasCircle = rng() > 0.4;
  const hasLine = rng() > 0.5;

  return (
    <div
      className="top-artist-album-art"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(${angle}deg, ${artistColor} 0%, ${c2} 50%, #080808 100%)`,
      }}
    >
      <div
        className="top-artist-album-radial"
        style={{
          background: `radial-gradient(circle at ${cx}% ${cy}%, rgba(255,255,255,0.1) 0%, transparent 55%)`,
        }}
      />
      {hasCircle && (
        <div
          className="top-artist-album-circle"
          style={{ left: `${cx - 18}%`, top: `${cy - 18}%` }}
        />
      )}
      {hasLine && (
        <div
          className="top-artist-album-line"
          style={{
            top: `${40 + rng() * 25}%`,
            opacity: 0.03 + rng() * 0.04,
          }}
        />
      )}
    </div>
  );
}

function TopArtistLaneDot({
  artist,
  albumName,
  albumArtworkUrl,
  x,
  y,
  albumTop,
  size,
  laneIndex = 0,
  isSelected,
  isFutureAlbum = false,
  waitersCount = 0,
  isWaiting = false,
  onClick,
  onToggleWait,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const artistColor = getArtistColor(artist, albumName || "");
  const hasArtistImage = Boolean(artist.artworkUrl) && !imageFailed;
  const waitButtonLabel = isWaiting ? "Stop waiting" : "Wait for release";
  const waitCountCompact = `${formatWaitersCount(waitersCount)} waiting`;
  const handleWaitClick = (event) => {
    event.stopPropagation();
    onToggleWait?.();
  };

  return (
    <>
      <div
        className={`artist-dot top-artist-lane-dot ${isSelected ? "selected" : ""}`}
        style={{
          "--lane-index": laneIndex,
          left: x,
          top: y,
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${artistColor} 0%, ${artistColor}bb 100%)`,
          borderColor: isSelected ? "#A4A2A0" : "#282B29",
          boxShadow: isSelected ? `0 8px 24px ${artistColor}66` : "0 2px 8px rgba(0,0,0,0.4)",
        }}
        onClick={onClick}
      >
        {hasArtistImage ? (
          <img
            src={artist.artworkUrl}
            alt={artist.name}
            className="artist-photo"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="artist-initials">{artist.initials}</span>
        )}
      </div>

      <div
        className={`artist-name-label top-artist-lane-label ${isSelected ? "selected" : ""}`}
        style={{ "--lane-index": laneIndex, left: x + size / 2, top: y + size + 4 }}
      >
        {artist.name}
      </div>

      <div
        className="top-artist-album-wrapper"
        style={{
          "--lane-index": laneIndex,
          left: x + size / 2 - TOP_ARTISTS_ALBUM_SIZE / 2,
          top: albumTop,
        }}
        onClick={onClick}
      >
        <TopAlbumArt
          artist={artist}
          albumName={albumName}
          albumArtworkUrl={albumArtworkUrl}
          size={TOP_ARTISTS_ALBUM_SIZE}
          usePlaceholder={isFutureAlbum}
        />
        {isFutureAlbum && (
          <div className="top-artist-future-actions">
            <span className="top-artist-future-count-pill">{waitCountCompact}</span>
          </div>
        )}
        <div className="top-artist-album-name">{albumName}</div>
      </div>

      {isFutureAlbum && (
        <button
          type="button"
          className={`wait-toggle-icon-button top-artist-future-bell ${isWaiting ? "is-active" : ""}`}
          style={{ left: x + size - 2, top: y - 6 }}
          aria-label={waitButtonLabel}
          title={waitButtonLabel}
          onClick={handleWaitClick}
        >
          <BellIcon checked={isWaiting} />
        </button>
      )}
    </>
  );
}

export default function PersonalTimeline({
  selectedArtist,
  setSelectedArtist,
  hoveredArtist,
  setHoveredArtist,
  onReady,
}) {
  const monthWidth = 112;
  const personalTimelineHeight = 240;
  const artistSize = 38;
  const scrollRef = useRef(null);
  const didInitialScrollRef = useRef(false);
  const topAlbumsExitTimeoutRef = useRef(null);

  const [activeViewTab, setActiveViewTab] = useState("timeline");
  const [friendTimelines, setFriendTimelines] = useState([]);
  const [renderedFriendTimelines, setRenderedFriendTimelines] = useState([]);
  const [waitingArtistIds, setWaitingArtistIds] = useState(() => new Set());
  const [volumeActive, setVolumeActive] = useState(false);
  const [genreActive, setGenreActive] = useState(false);
  const [zone1Volume, setZone1Volume] = useState(1600);
  const [zone1Genre, setZone1Genre] = useState("Hip-Hop");
  const [visibleYear, setVisibleYear] = useState(CURRENT_TIMELINE_YEAR);
  const [cacheReadyArtists, setCacheReadyArtists] = useState(() =>
    dedupeArtistsByName(getCacheReadyTimelineArtists())
  );
  const [albumArtworkVersion, setAlbumArtworkVersion] = useState(0);

  const showTopArtistsLane = activeViewTab === "topAlbums";
  const showAnticipatedAlbums = activeViewTab === "mostAnticipated";
  const topAlbumsLaneCount = showTopArtistsLane ? (2 + friendTimelines.length) : 0;
  const timelineHeight = showTopArtistsLane
    ? topAlbumsLaneCount * TOP_ARTISTS_LANE_HEIGHT + (topAlbumsLaneCount - 1) * TOP_ARTISTS_LANE_GAP
    : personalTimelineHeight;

  useEffect(() => {
    return () => {
      if (topAlbumsExitTimeoutRef.current) {
        clearTimeout(topAlbumsExitTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      loadCacheReadyArtists(),
      loadAlbumArtworkCache(),
    ])
      .then(([, loadedArtwork]) => {
        if (!isMounted) return;
        setCacheReadyArtists(dedupeArtistsByName(getCacheReadyTimelineArtists()));
        if (loadedArtwork) {
          setAlbumArtworkVersion((value) => value + 1);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!isMounted) return;
        onReady?.();
      });

    return () => {
      isMounted = false;
    };
  }, [onReady]);

  // Rebuild the timeline artists when image cache or anticipated mode changes.
  const timelineArtists = useMemo(() => {
    const futureCount = showAnticipatedAlbums
      ? FUTURE_ARTIST_COUNT_ANTICIPATED
      : FUTURE_ARTIST_COUNT_DEFAULT;

    const baseTimelineArtists = buildUniqueZone1Artists(cacheReadyArtists, {
      futureArtistCount: futureCount,
      pastArtistCount: null,
    });

    const useGenreMatchedFutureArtists = showAnticipatedAlbums && genreActive;
    const resolvedTimelineArtists = useGenreMatchedFutureArtists
      ? (() => {
        const genreMatchedFutureArtists = buildGenreMatchedFutureArtists(cacheReadyArtists, {
          genre: zone1Genre,
          count: FUTURE_ARTIST_COUNT_ANTICIPATED,
        });
        if (genreMatchedFutureArtists.length === 0) {
          return baseTimelineArtists;
        }
        const nonFutureArtists = baseTimelineArtists.filter((artist) => !artist.isAnticipated);
        return [...nonFutureArtists, ...genreMatchedFutureArtists].sort(sortArtistsChronologically);
      })()
      : baseTimelineArtists;

    return resolvedTimelineArtists.map((artist) => enrichAnticipatedArtist(artist, waitingArtistIds));
  }, [cacheReadyArtists, showAnticipatedAlbums, waitingArtistIds, genreActive, zone1Genre]);

  const topAlbumsArtists = useMemo(() => (
    buildUniqueZone1Artists(cacheReadyArtists, {
      futureArtistCount: FUTURE_ARTIST_COUNT_DEFAULT,
      pastArtistCount: TOP_ARTISTS_POOL_PER_YEAR,
    })
  ), [cacheReadyArtists]);

  const anticipatedReferenceArtists = useMemo(() => (
    buildUniqueZone1Artists(cacheReadyArtists, {
      futureArtistCount: FUTURE_ARTIST_COUNT_ANTICIPATED,
      pastArtistCount: null,
    })
      .map((artist) => enrichAnticipatedArtist(artist, waitingArtistIds))
      .filter((artist) => artist.isAnticipated)
      .sort(sortArtistsChronologically)
  ), [cacheReadyArtists, waitingArtistIds]);

  const futureRandomArtistPool = useMemo(
    () => cacheReadyArtists,
    [cacheReadyArtists]
  );

  const volumeStepBucket = useMemo(() => Math.floor(zone1Volume / 80), [zone1Volume]);
  const showBaseline = volumeActive || genreActive;
  const viewLabel = showTopArtistsLane
    ? `top albums + ${friendTimelines.length > 0 ? `${friendTimelines.length} friend timelines` : "your timeline"}`
    : showAnticipatedAlbums
      ? "most anticipated"
      : getViewLabel(volumeActive, genreActive, zone1Volume, zone1Genre);

  const handleAddFriendTimeline = useCallback((friend) => {
    if (!friend) return;
    setFriendTimelines((existing) => {
      if (existing.length >= MAX_FRIEND_TIMELINES) return existing;
      if (existing.some((item) => String(item.id) === String(friend.id))) return existing;
      const nextTimelines = [...existing, friend];
      setRenderedFriendTimelines(nextTimelines);
      return nextTimelines;
    });
  }, []);

  const handleRemoveFriendTimeline = useCallback((friendId) => {
    setFriendTimelines((existing) => {
      const nextTimelines = existing.filter((friend) => String(friend.id) !== String(friendId));
      setRenderedFriendTimelines(nextTimelines);
      return nextTimelines;
    });
  }, []);

  const handleToggleWait = useCallback((artistId) => {
    setWaitingArtistIds((existing) => {
      const nextWaitingIds = new Set(existing);
      const id = String(artistId);
      if (nextWaitingIds.has(id)) {
        nextWaitingIds.delete(id);
      } else {
        nextWaitingIds.add(id);
      }
      return nextWaitingIds;
    });
  }, []);

  // Initial scroll
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    if (!scrollRef.current || activeViewTab === "mostAnticipated") return;

    const timelineMonthIndex = getMiddleMonthIndex(CURRENT_TIMELINE_YEAR, ZONE1_CURRENT_MONTH_INDEX);
    scrollRef.current.scrollLeft = getCenteredMonthScrollLeft(
      timelineMonthIndex,
      monthWidth,
      scrollRef.current.clientWidth
    );
    didInitialScrollRef.current = true;
  }, [activeViewTab, monthWidth]);

  // Tab toggles also control timeline focus.
  const handleViewTabChange = useCallback((id) => {
    const canToggleBackToTimeline = id === "topAlbums" || id === "mostAnticipated";
    const nextViewId = (canToggleBackToTimeline && activeViewTab === id) ? "timeline" : id;

    if (topAlbumsExitTimeoutRef.current) {
      clearTimeout(topAlbumsExitTimeoutRef.current);
      topAlbumsExitTimeoutRef.current = null;
    }

    if (nextViewId === "topAlbums") {
      setRenderedFriendTimelines(friendTimelines);
    } else if (activeViewTab === "topAlbums") {
      topAlbumsExitTimeoutRef.current = setTimeout(() => {
        setRenderedFriendTimelines([]);
        topAlbumsExitTimeoutRef.current = null;
      }, TOP_ALBUMS_VIEW_TRANSITION_MS);
    }

    setActiveViewTab(nextViewId);

    if (nextViewId !== "topAlbums") {
      setFriendTimelines([]);
    }

    if (!scrollRef.current) return;

    const scrollToMonthCenter = (monthIndex) => {
      const left = getCenteredMonthScrollLeft(
        monthIndex,
        monthWidth,
        scrollRef.current.clientWidth
      );
      scrollRef.current.scrollTo({
        left,
        behavior: "smooth",
      });
    };

    if (nextViewId === "mostAnticipated") {
      scrollToMonthCenter(getMiddleMonthIndex(FUTURE_YEAR, SEPARATOR_INDEX));
    } else if (nextViewId === "timeline" || nextViewId === "topAlbums") {
      scrollToMonthCenter(getMiddleMonthIndex(CURRENT_TIMELINE_YEAR, ZONE1_CURRENT_MONTH_INDEX));
    }
  }, [activeViewTab, friendTimelines, monthWidth]);

  // Track visible year on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const centerX = scrollRef.current.scrollLeft + scrollRef.current.clientWidth / 2;
        const month = ZONE1_MONTHS[Math.floor(centerX / monthWidth)];
        if (month) setVisibleYear(month.year);
      }
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const timelineWidth = ZONE1_MONTHS.length * monthWidth;

  // Build timeline positions with a dedicated future pass to avoid duplicates.
  const laidOutArtists = useMemo(() => {
    // Keep future artists out of the main pass so they do not render twice.
    const futureArtists = dedupeArtistsByName(timelineArtists.filter((a) => a.isAnticipated));
    const futureIds = new Set(futureArtists.map((a) => a.id));

    // Normal artists go through standard layout
    const normalArtists = timelineArtists.filter((a) => !futureIds.has(a.id));

    const positionCandidates = normalArtists
      .filter((artist) => artist && artist.releaseMonth !== undefined)
      .map((artist) => {
        const preferredX = getXPosition(artist.releaseMonth, artist.releaseDay, monthWidth, artistSize);
        const baselineRating = getBaselineRating(artist);
        const baselineY = getYPosition(baselineRating, personalTimelineHeight, artistSize);
        const activeRating = getActiveRating(artist, {
          volumeActive,
          genreActive,
          volumeStepBucket,
          genre: zone1Genre,
        });
        const preferredY = getYPosition(activeRating, personalTimelineHeight, artistSize);
        return { artist, preferredX, preferredY, baselineY };
      })
      .sort((a, b) => a.preferredX - b.preferredX || a.preferredY - b.preferredY);

    const normalPlaced = resolveArtistCollisions(positionCandidates, {
      artistSize,
      timelineHeight: personalTimelineHeight,
      timelineWidth,
    });

    // In anticipated mode, place future artists in a top-aligned row.
    if (showAnticipatedAlbums && futureArtists.length > 0) {
      const futureStartIndex = ZONE1_MONTHS.findIndex((m) => m.isFuture);
      const futureMonthCount = ZONE1_MONTHS.filter((m) => m.isFuture).length;

      if (futureStartIndex >= 0 && futureMonthCount > 0) {
        const futureStartX = futureStartIndex * monthWidth;
        const futureWidth = futureMonthCount * monthWidth;
        const spacing = futureWidth / futureArtists.length;
        const startOffset = spacing / 2;

        const futurePlaced = futureArtists.map((artist, i) => {
          const cx = futureStartX + startOffset + i * spacing;
          const x = cx - artistSize / 2;
          return {
            artist,
            preferredX: x,
            preferredY: 14,
            baselineY: 14,
            x,
            y: 14,
            activeY: 14,
          };
        });

        return [...normalPlaced, ...futurePlaced];
      }
    }

    // In non-anticipated mode, future artists go through normal layout too
    if (!showAnticipatedAlbums) {
      const futureSeed = futureArtists.map((a) => normalizeName(a.name)).sort().join("|");
      const futureRng = makeRng(hashString(`${futureSeed}|future-normal-layout`));
      const futureCandidates = futureArtists
        .filter((a) => a.releaseMonth !== undefined)
        .map((artist) => {
          const preferredX = getXPosition(artist.releaseMonth, artist.releaseDay, monthWidth, artistSize);
          const baselineRating = getBaselineRating(artist);
          const baselineY = getYPosition(baselineRating, personalTimelineHeight, artistSize);
          const scatteredRating = 0.38 + futureRng() * 0.45;
          const preferredY = getYPosition(scatteredRating, personalTimelineHeight, artistSize);
          return { artist, preferredX, preferredY, baselineY };
        });

      if (futureCandidates.length > 0) {
        const allCandidates = [...positionCandidates, ...futureCandidates]
          .sort((a, b) => a.preferredX - b.preferredX || a.preferredY - b.preferredY);
        return resolveArtistCollisions(allCandidates, {
          artistSize,
          timelineHeight: personalTimelineHeight,
          timelineWidth,
        });
      }
    }

    return normalPlaced;
  }, [
    timelineArtists,
    volumeActive,
    genreActive,
    volumeStepBucket,
    zone1Genre,
    artistSize,
    personalTimelineHeight,
    timelineWidth,
    showAnticipatedAlbums,
    monthWidth,
  ]);

  const topAlbumTimelineLanes = useMemo(() => {
    const topArtistsByYear = new Map();
    const topArtistNamesByYear = new Map();
    const personalArtistsByYear = new Map();
    const personalArtistNamesByYear = new Map();
    const friendAssignedNamesByYear = new Map();
    const futureAssignedNames = new Set();

    PAST_YEARS.forEach((year) => {
      const yearArtists = getArtistsForYear(topAlbumsArtists, year).sort(sortArtistsByBaselineRank);
      const topArtists = selectYearArtistsForLane(yearArtists, {
        laneKey: "top-albums",
        year,
        targetCount: TOP_ARTISTS_PER_YEAR,
      });
      topArtistsByYear.set(year, topArtists);
      topArtistNamesByYear.set(
        year,
        new Set(topArtists.map((artist) => normalizeName(artist.name)).filter(Boolean))
      );

      const personalArtists = getTimelineUserYearArtistsDiverse(
        topAlbumsArtists,
        "you",
        year,
        topArtistNamesByYear.get(year)
      );
      personalArtistsByYear.set(year, personalArtists);
      personalArtistNamesByYear.set(
        year,
        new Set(personalArtists.map((artist) => normalizeName(artist.name)).filter(Boolean))
      );
    });

    const topArtistsLanePlacements = [];
    PAST_YEARS.forEach((year) => {
      const yearStart = MONTH_START_BY_YEAR.get(year);
      if (yearStart === undefined) return;

      const rankedArtists = topArtistsByYear.get(year) || [];
      if (!rankedArtists.length) return;

      const slotWidth = (12 * monthWidth) / (rankedArtists.length + 1);
      rankedArtists.forEach((artist, index) => {
        const centerX = yearStart * monthWidth + slotWidth * (index + 1);
        const { albumName, albumArtworkUrl } = getTopArtistAlbumDetails(artist, year);
        topArtistsLanePlacements.push({
          artist: {
            ...artist,
            albumName,
            albumArtworkUrl,
          },
          x: centerX - artistSize / 2,
        });
      });
    });

    const futureYearStart = MONTH_START_BY_YEAR.get(FUTURE_YEAR);
    const futureSlotCenters = [];
    if (futureYearStart !== undefined && anticipatedReferenceArtists.length > 0) {
      const slotWidth = (12 * monthWidth) / (anticipatedReferenceArtists.length + 1);
      anticipatedReferenceArtists.forEach((artist, index) => {
        const centerX = futureYearStart * monthWidth + slotWidth * (index + 1);
        const anticipatedId = String(artist.id);
        topArtistsLanePlacements.push({
          artist: {
            ...artist,
            id: anticipatedId,
            color: getArtistColor(artist, `anticipated-top-${index}`),
            albumName: artist.albumName || ANTICIPATED_ALBUM_NAMES[index % ANTICIPATED_ALBUM_NAMES.length],
            albumArtworkUrl: null,
            isAnticipated: true,
            isFutureAlbum: true,
            waitersCount: artist.waitersCount,
            isWaiting: waitingArtistIds.has(anticipatedId),
          },
          x: centerX - artistSize / 2,
        });
        futureSlotCenters.push(centerX);
        const topFutureName = normalizeName(artist.name);
        if (topFutureName) futureAssignedNames.add(topFutureName);
      });
    }

    const buildFutureLanePlacements = (laneKey) => {
      if (futureSlotCenters.length === 0) return [];

      const futureCountRange = TOP_ARTISTS_FUTURE_MAX - TOP_ARTISTS_FUTURE_MIN + 1;
      const targetCount = TOP_ARTISTS_FUTURE_MIN + (
        hashString(`${laneKey}-${FUTURE_YEAR}-future-count`) % futureCountRange
      );

      const allSlotIndexes = futureSlotCenters.map((_, index) => index);
      const slotIndexes = shuffleWithRng(
        allSlotIndexes,
        makeRng(hashString(`${laneKey}-${FUTURE_YEAR}-future-slots`))
      )
        .slice(0, Math.min(targetCount, allSlotIndexes.length))
        .sort((a, b) => a - b);

      const randomArtists = getRandomFutureLaneArtists(
        futureRandomArtistPool,
        laneKey,
        slotIndexes.length,
        futureAssignedNames
      );

      return slotIndexes.map((slotIndex, index) => {
        const template = anticipatedReferenceArtists[slotIndex] || anticipatedReferenceArtists[index] || null;
        const artist = randomArtists[index] || template || futureRandomArtistPool[index] || {
          id: `fallback-${laneKey}-${slotIndex}`,
          name: "Unknown Artist",
          initials: "UA",
          artworkUrl: null,
        };
        const artistNameKey = normalizeName(artist?.name);
        if (artistNameKey) futureAssignedNames.add(artistNameKey);

        const releaseMonth = template?.releaseMonth ?? (futureYearStart + slotIndex);
        const releaseDay = template?.releaseDay ?? (1 + (hashString(`${laneKey}-${slotIndex}-day`) % 28));
        const month = ZONE1_MONTHS[releaseMonth];
        const releaseDate = template?.releaseDate || (
          month ? `${month.fullName} ${releaseDay}, ${month.year}` : "Coming soon"
        );
        const baseWaiters = template?.waitersCount ?? (
          700 + (hashString(`${laneKey}-${slotIndex}-base-waiters`) % 4500)
        );
        const waitersScaleRng = makeRng(hashString(`${laneKey}-${slotIndex}-waiters-scale`));
        const waitersCount = Math.max(
          80,
          Math.round(baseWaiters * (0.42 + waitersScaleRng() * 0.18))
        );
        const albumName = ANTICIPATED_ALBUM_NAMES[
          hashString(`${laneKey}-${artist?.name}-${slotIndex}`) % ANTICIPATED_ALBUM_NAMES.length
        ];
        const anticipatedId = `anticipated-${laneKey}-${artistNameKey || "artist"}-${FUTURE_YEAR}-${slotIndex}`;

        return {
          artist: {
            ...artist,
            id: anticipatedId,
            color: getArtistColor(artist, `${laneKey}-${slotIndex}`),
            albumName,
            albumArtworkUrl: null,
            isAnticipated: true,
            isFutureAlbum: true,
            releaseMonth,
            releaseDay,
            releaseDate,
            waitersCount,
            isWaiting: waitingArtistIds.has(anticipatedId),
          },
          x: futureSlotCenters[slotIndex] - artistSize / 2,
        };
      });
    };

    const personalTopArtistsPlacements = [];
    PAST_YEARS.forEach((year) => {
      const yearStart = MONTH_START_BY_YEAR.get(year);
      if (yearStart === undefined) return;

      const personalArtists = personalArtistsByYear.get(year) || [];
      if (!personalArtists.length) return;

      const slotWidth = (12 * monthWidth) / (personalArtists.length + 1);
      personalArtists.forEach((artist, index) => {
        const centerX = yearStart * monthWidth + slotWidth * (index + 1);
        const { albumName, albumArtworkUrl } = getTopArtistAlbumDetails(artist, `${year}-you`);
        personalTopArtistsPlacements.push({
          artist: {
            ...artist,
            albumName,
            albumArtworkUrl,
          },
          x: centerX - artistSize / 2,
        });
      });
    });
    personalTopArtistsPlacements.push(...buildFutureLanePlacements("you"));

    const lanes = [
      {
        id: "top-albums",
        label: "Top Albums",
        placements: topArtistsLanePlacements,
      },
      {
        id: "you",
        label: "Me",
        placements: personalTopArtistsPlacements,
        avatar: "M",
        avatarSrc: YOU_AVATAR_SRC,
        color: "#D39A3B",
        avatarOnly: true,
      },
    ];

    renderedFriendTimelines.forEach((friend) => {
      const friendPlacements = [];
      PAST_YEARS.forEach((year) => {
        const yearStart = MONTH_START_BY_YEAR.get(year);
        if (yearStart === undefined) return;

        const blockedNames = new Set([
          ...(topArtistNamesByYear.get(year) || new Set()),
          ...(personalArtistNamesByYear.get(year) || new Set()),
          ...(friendAssignedNamesByYear.get(year) || new Set()),
        ]);

        const existingFriendNamesForYear = new Set(
          friendPlacements
            .filter((placement) => {
              const releaseMonth = placement?.artist?.releaseMonth;
              if (releaseMonth === undefined) return false;
              const month = ZONE1_MONTHS[releaseMonth];
              return month?.year === year;
            })
            .map((placement) => normalizeName(placement?.artist?.name))
            .filter(Boolean)
        );

        existingFriendNamesForYear.forEach((name) => blockedNames.add(name));

        const yearArtists = getTimelineUserYearArtistsDiverse(
          topAlbumsArtists,
          String(friend.id),
          year,
          blockedNames
        );

        if (!yearArtists.length) return;

        const slotWidth = (12 * monthWidth) / (yearArtists.length + 1);
        yearArtists.forEach((artist, index) => {
          const centerX = yearStart * monthWidth + slotWidth * (index + 1);
          const { albumName, albumArtworkUrl } = getTopArtistAlbumDetails(artist, `${year}-${friend.id}`);
          friendPlacements.push({
            artist: {
              ...artist,
              albumName,
              albumArtworkUrl,
            },
            x: centerX - artistSize / 2,
          });

          const normalizedName = normalizeName(artist.name);
          if (normalizedName) {
            if (!friendAssignedNamesByYear.has(year)) {
              friendAssignedNamesByYear.set(year, new Set());
            }
            friendAssignedNamesByYear.get(year).add(normalizedName);
          }
        });
      });

      friendPlacements.push(...buildFutureLanePlacements(String(friend.id)));

      lanes.push({
        id: String(friend.id),
        label: friend.name,
        placements: friendPlacements,
        avatar: friend.avatar,
        avatarSrc: friend.avatarSrc || null,
        color: friend.color,
        avatarOnly: true,
      });
    });

    return lanes;
  }, [
    renderedFriendTimelines,
    topAlbumsArtists,
    anticipatedReferenceArtists,
    futureRandomArtistPool,
    waitingArtistIds,
    albumArtworkVersion,
    monthWidth,
    artistSize,
  ]);

  const yearMarkers = useMemo(() => {
    const markers = [];
    let currentYear = null;
    ZONE1_MONTHS.forEach((month, index) => {
      if (month.year !== currentYear) {
        markers.push({ year: month.year, startIndex: index, isFuture: month.isFuture });
        currentYear = month.year;
      }
    });
    return markers;
  }, []);

  return (
    <div className="personal-timeline">
      <Zone1Header
        activeViewTab={activeViewTab}
        onViewTabChange={handleViewTabChange}
        volumeActive={volumeActive}
        onVolumeActiveChange={setVolumeActive}
        genreActive={genreActive}
        onGenreActiveChange={setGenreActive}
        zone1Volume={zone1Volume}
        onVolumeChange={setZone1Volume}
        zone1Genre={zone1Genre}
        onGenreChange={setZone1Genre}
        friendTimelines={friendTimelines}
        availableFriendTimelines={AVAILABLE_ZONE1_FRIENDS}
        maxFriendTimelines={MAX_FRIEND_TIMELINES}
        onAddFriendTimeline={handleAddFriendTimeline}
        onRemoveFriendTimeline={handleRemoveFriendTimeline}
        tabInfoModals={ZONE1_TAB_INFO_MODALS}
      />

      <div className="personal-timeline-container">
        <div className={`year-panel ${showTopArtistsLane ? "lane-labels-mode" : ""}`}>
          <div className={`year-panel-view year-panel-year-view ${!showTopArtistsLane ? "is-active" : ""}`}>
            <span className="year-text">{visibleYear}</span>
          </div>

          <div className={`year-panel-view year-panel-lanes-view ${showTopArtistsLane ? "is-active" : ""}`}>
            <div className="year-panel-month-spacer" />
            <div className="timeline-lane-labels" style={{ height: timelineHeight }}>
              {topAlbumTimelineLanes.map((lane, laneIndex) => {
                const rowTop = laneIndex * (TOP_ARTISTS_LANE_HEIGHT + TOP_ARTISTS_LANE_GAP);
                const laneLabelLines = String(lane.label || "").split(/\s+/).filter(Boolean);
                return (
                  <span
                    key={`lane-label-${lane.id}`}
                    className={`timeline-lane-label ${lane.avatarOnly ? "avatar-only" : ""}`}
                    style={{
                      "--lane-index": laneIndex,
                      top: rowTop + TOP_ARTISTS_LANE_HEIGHT / 2,
                    }}
                  >
                    {lane.avatarOnly ? (
                      <>
                        <span
                          className="zone1-pinned-avatar timeline-lane-avatar"
                          style={{
                            background: `linear-gradient(135deg, ${lane.color}, ${lane.color}88)`,
                            boxShadow: `0 0 10px ${lane.color}44`,
                          }}
                        >
                          {lane.avatarSrc ? (
                            <img
                              src={lane.avatarSrc}
                              alt={lane.label}
                              className="zone1-pinned-avatar-img"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            lane.avatar
                          )}
                        </span>
                        <span className="timeline-lane-label-stack">
                          {laneLabelLines.map((line, lineIndex) => (
                            <span key={`${lane.id}-line-${lineIndex}`} className="timeline-lane-label-line">
                              {line}
                            </span>
                          ))}
                        </span>
                      </>
                    ) : (
                      <span className="timeline-lane-label-stack">
                        {laneLabelLines.map((line, lineIndex) => (
                          <span key={`${lane.id}-line-${lineIndex}`} className="timeline-lane-label-line">
                            {line}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="personal-timeline-scroll" ref={scrollRef}>
          <div className="personal-months-header">
            {ZONE1_MONTHS.map((month, i) => (
              <div
                key={`${month.fullName}-${month.year}-${i}`}
                className={`personal-month-cell ${month.isYearStart ? "year-start" : ""}`}
              >
                <span
                  className={`personal-month-name ${i === ZONE1_CURRENT_MONTH_INDEX ? "active" : ""} ${month.isFuture ? "future" : ""}`}
                >
                  {month.name}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`personal-dots-area ${showTopArtistsLane ? "top-artists-expanded" : ""}`}
            style={{ height: timelineHeight, width: timelineWidth }}
          >
            {ZONE1_MONTHS.map((month, i) => (
              <div
                key={i}
                className={`personal-column-bg ${i % 2 === 0 ? "even" : ""} ${month.isFuture ? "future-column" : ""}`}
                style={{ left: i * monthWidth, width: monthWidth }}
              />
            ))}

            <div className={`zone1-view-layer zone1-timeline-layer ${!showTopArtistsLane ? "is-active" : ""}`}>
              {yearMarkers.map((marker) => (
                <div
                  key={`timeline-year-${marker.year}`}
                  className={`year-marker ${marker.isFuture ? "future" : ""}`}
                  style={{ left: marker.startIndex * monthWidth }}
                >
                  <div className="year-marker-line" />
                  <div className="year-marker-label">{marker.year}</div>
                </div>
              ))}

              {laidOutArtists.map((item) => {
                const { artist, x, baselineY, activeY } = item;
                const isSelected = selectedArtist?.id === artist.id;
                const isHovered = hoveredArtist?.id === artist.id;

                return (
                  <ArtistDot
                    key={artist.id}
                    artist={artist}
                    x={x}
                    baselineY={baselineY}
                    activeY={activeY}
                    artistSize={artistSize}
                    timelineHeight={timelineHeight}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    zone1Filter={showBaseline ? "volume" : "yourTimeline"}
                    showAnticipatedAlbums={showAnticipatedAlbums}
                    onClick={() => setSelectedArtist(isSelected ? null : artist)}
                    onHover={() => setHoveredArtist(artist)}
                    onLeave={() => setHoveredArtist(null)}
                    onToggleWait={() => handleToggleWait(artist.id)}
                  />
                );
              })}
            </div>

            <div className={`zone1-view-layer zone1-top-albums-layer ${showTopArtistsLane ? "is-active" : ""}`}>
              {yearMarkers.map((marker) => (
                <div
                  key={`top-albums-year-${marker.year}`}
                  className={`year-marker top-albums-year-marker ${marker.isFuture ? "future" : ""}`}
                  style={{ left: marker.startIndex * monthWidth }}
                >
                  <div className="year-marker-line" />
                  <div className="year-marker-label">{marker.year}</div>
                </div>
              ))}

              {topAlbumTimelineLanes.map((lane, laneIndex) => {
                const rowTop = laneIndex * (TOP_ARTISTS_LANE_HEIGHT + TOP_ARTISTS_LANE_GAP);
                return (
                  <div
                    key={`lane-bg-${lane.id}`}
                    className="top-artists-lane-bg"
                    style={{
                      "--lane-index": laneIndex,
                      top: rowTop,
                      height: TOP_ARTISTS_LANE_HEIGHT,
                    }}
                  />
                );
              })}

              <div className="top-artists-lane-tag">Top Albums</div>

              {topAlbumTimelineLanes.map((lane, laneIndex) => {
                if (laneIndex === 0) return null;
                const rowTop = laneIndex * (TOP_ARTISTS_LANE_HEIGHT + TOP_ARTISTS_LANE_GAP);
                return (
                  <div
                    key={`lane-divider-${lane.id}`}
                    className="top-artists-lane-divider"
                    style={{
                      "--lane-index": laneIndex,
                      top: rowTop - Math.ceil(TOP_ARTISTS_LANE_GAP / 2),
                    }}
                  />
                );
              })}

              {topAlbumTimelineLanes.map((lane, laneIndex) => {
                const rowTop = laneIndex * (TOP_ARTISTS_LANE_HEIGHT + TOP_ARTISTS_LANE_GAP);
                return lane.placements.map(({ artist, x }) => {
                  const isSelected = selectedArtist?.id === artist.id;
                  return (
                    <TopArtistLaneDot
                      key={`${lane.id}-${artist.id}-${x}`}
                      artist={artist}
                      albumName={artist.albumName}
                      albumArtworkUrl={artist.albumArtworkUrl}
                      x={x}
                      y={rowTop + TOP_ARTISTS_LANE_DOT_Y}
                      albumTop={rowTop + TOP_ARTISTS_ALBUM_TOP}
                      size={artistSize}
                      laneIndex={laneIndex}
                      isSelected={isSelected}
                      isFutureAlbum={artist.isFutureAlbum === true}
                      waitersCount={artist.waitersCount}
                      isWaiting={artist.isWaiting === true}
                      onClick={() => setSelectedArtist(isSelected ? null : artist)}
                      onToggleWait={() => handleToggleWait(artist.id)}
                    />
                  );
                });
              })}
            </div>

            <div className="timeline-separator" style={{ left: SEPARATOR_INDEX * monthWidth }}>
              <div className="separator-line" />
              <div className="separator-label">Now</div>
            </div>

            <div
              className="view-indicator"
              style={{ top: 8 }}
            >
              ★ {viewLabel}
              {showBaseline && <span className="baseline-hint"> — baseline dot</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
