import cachedArtistImages from "../../backend/cached_artist_images.json";
import cachedAlbumArtworks from "../../backend/cached_album_artworks.json";

const DEFAULT_DISCOVERY_ARTIST_IMAGE = "/assets/default-artist.png";

const DISCOVERY_ARTIST_SLOTS = [
  { name: "Tame Impala", genre: "Psychedelic Rock" },
  { name: "Kendrick Lamar", genre: "Hip-Hop" },
  { name: "Dua Lipa", genre: "Pop" },
  { name: "Radiohead", genre: "Alternative Rock" },
  { name: "Tyler, The Creator", genre: "Hip-Hop" },
  { name: "Billie Eilish", genre: "Pop" },
  { name: "Bonobo", genre: "Electronic" },
  { name: "Thundercat", genre: "Jazz" },
  { name: "Flume", genre: "Electronic" },
  { name: "Frank Ocean", genre: "R&B" },
  { name: "SZA", genre: "R&B" },
  { name: "Khruangbin", genre: "Funk" },
  { name: "FKA twigs", genre: "Electronic" },
  { name: "Jorja Smith", genre: "R&B" },
  { name: "Jamie xx", genre: "Electronic" },
  { name: "Hiatus Kaiyote", genre: "Neo-Soul" },
  { name: "Anderson .Paak", genre: "Hip-Hop" },
  { name: "Floating Points", genre: "Electronic" },
  { name: "Beach House", genre: "Dream Pop" },
  { name: "Four Tet", genre: "Electronic" },
  { name: "Solange", genre: "R&B" },
  { name: "BadBadNotGood", genre: "Jazz" },
  { name: "Little Dragon", genre: "Electronic" },
  { name: "King Krule", genre: "Alternative" },
  { name: "Kamasi Washington", genre: "Jazz" },
];

const normalizeArtistName = (name = "") =>
  String(name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const hasUsableImageUrl = (url = "") => {
  const value = String(url || "").trim();
  if (!value) return false;
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  );
};

const slotGenreByName = new Map(
  DISCOVERY_ARTIST_SLOTS.map((slot) => [normalizeArtistName(slot.name), slot.genre])
);

const createCachedArtistPool = () => {
  const entriesByName = new Map();

  const upsertEntry = ({ name, imageUrl, sourceRank, genre = "Music" }) => {
    const cleanName = String(name || "").trim();
    const normalizedName = normalizeArtistName(cleanName);
    const cleanImageUrl = String(imageUrl || "").trim();

    if (!normalizedName || !cleanName || !hasUsableImageUrl(cleanImageUrl)) {
      return;
    }

    const slotGenre = slotGenreByName.get(normalizedName);
    const nextEntry = {
      name: cleanName,
      imageUrl: cleanImageUrl,
      genre: String(slotGenre || genre || "Music"),
      sourceRank: Number.isFinite(sourceRank) ? sourceRank : 999,
    };

    const current = entriesByName.get(normalizedName);
    if (!current || nextEntry.sourceRank < current.sourceRank) {
      entriesByName.set(normalizedName, nextEntry);
    }
  };

  Object.values(cachedArtistImages || {}).forEach((entry) => {
    upsertEntry({
      name: entry?.artistName || entry?.requestName,
      imageUrl: entry?.imageUrl,
      sourceRank: 1,
      genre: "Music",
    });
  });

  Object.values(cachedAlbumArtworks || {}).forEach((entry) => {
    const artworkUrl = entry?.artworkUrl;
    upsertEntry({
      name: entry?.requestArtistName,
      imageUrl: artworkUrl,
      sourceRank: 2,
      genre: "Music",
    });
    upsertEntry({
      name: entry?.matchedArtistName,
      imageUrl: artworkUrl,
      sourceRank: 3,
      genre: "Music",
    });
  });

  return Array.from(entriesByName.values()).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
};

const cachedArtistPool = createCachedArtistPool();
const cachedArtistByName = new Map(
  cachedArtistPool.map((artist) => [normalizeArtistName(artist.name), artist])
);

const DISCOVERY_DAY_BLUEPRINTS = [
  {
    daysAgo: 1,
    label: "Yesterday",
    visibleCount: 5,
    plusCount: 0,
    genreStats: [
      { name: "music", percentage: "+0.00056%" },
      { name: "pop", percentage: "+0.04%" },
      { name: "jazz", percentage: "+0.03%" },
    ],
  },
  {
    daysAgo: 3,
    label: "3 days ago",
    visibleCount: 4,
    plusCount: 0,
    genreStats: [
      { name: "music", percentage: "+0.00042%" },
      { name: "hip-hop", percentage: "+0.05%" },
      { name: "r&b", percentage: "+0.02%" },
    ],
  },
  {
    daysAgo: 5,
    label: "5 days ago",
    visibleCount: 6,
    plusCount: 7,
    genreStats: [
      { name: "music", percentage: "+0.00038%" },
      { name: "pop", percentage: "+0.02%" },
      { name: "dream pop", percentage: "+0.01%" },
    ],
  },
  {
    daysAgo: 7,
    label: "7 days ago",
    visibleCount: 5,
    plusCount: 0,
    genreStats: [
      { name: "music", percentage: "+0.00056%" },
      { name: "alternative", percentage: "+0.04%" },
      { name: "funk", percentage: "+0.02%" },
    ],
  },
  {
    daysAgo: 10,
    label: "10 days ago",
    visibleCount: 6,
    plusCount: 5,
    genreStats: [
      { name: "music", percentage: "+0.00031%" },
      { name: "electronic", percentage: "+0.05%" },
      { name: "downtempo", percentage: "+0.03%" },
    ],
  },
  {
    daysAgo: 12,
    label: "12 days ago",
    visibleCount: 4,
    plusCount: 0,
    genreStats: [
      { name: "music", percentage: "+0.00062%" },
      { name: "jazz", percentage: "+0.07%" },
      { name: "r&b", percentage: "+0.03%" },
    ],
  },
  {
    daysAgo: 15,
    label: "15 days ago",
    visibleCount: 6,
    plusCount: 9,
    genreStats: [
      { name: "music", percentage: "+0.00035%" },
      { name: "r&b", percentage: "+0.06%" },
      { name: "soul", percentage: "+0.02%" },
    ],
  },
  {
    daysAgo: 18,
    label: "18 days ago",
    visibleCount: 5,
    plusCount: 0,
    genreStats: [
      { name: "music", percentage: "+0.00037%" },
      { name: "electronic", percentage: "+0.06%" },
      { name: "ambient", percentage: "+0.04%" },
    ],
  },
  {
    daysAgo: 21,
    label: "3 weeks ago",
    visibleCount: 6,
    plusCount: 6,
    genreStats: [
      { name: "music", percentage: "+0.00044%" },
      { name: "hip-hop", percentage: "+0.07%" },
      { name: "rap", percentage: "+0.05%" },
    ],
  },
  {
    daysAgo: 28,
    label: "4 weeks ago",
    visibleCount: 4,
    plusCount: 0,
    genreStats: [
      { name: "music", percentage: "+0.00051%" },
      { name: "pop", percentage: "+0.08%" },
      { name: "dance", percentage: "+0.04%" },
    ],
  },
];

const buildDiscoveryArtists = () => {
  const selectedArtists = [];
  const selectedNames = new Set();

  const tryAddArtist = (candidate) => {
    const normalizedName = normalizeArtistName(candidate?.name || "");
    if (!normalizedName || selectedNames.has(normalizedName)) {
      return false;
    }

    selectedNames.add(normalizedName);
    selectedArtists.push({
      name: candidate?.name || "Unknown Artist",
      genre: String(candidate?.genre || "Music"),
      imageUrl: candidate?.imageUrl || DEFAULT_DISCOVERY_ARTIST_IMAGE,
    });
    return true;
  };

  // Honor the discovery slot intent, but only when the slot artist exists in cache.
  DISCOVERY_ARTIST_SLOTS.forEach((slot) => {
    const cachedMatch = cachedArtistByName.get(normalizeArtistName(slot.name));
    if (cachedMatch) {
      tryAddArtist({
        ...cachedMatch,
        genre: slot.genre || cachedMatch.genre,
      });
    }
  });

  // Fill remaining discovery artists with any cached artists we have available.
  cachedArtistPool.forEach((cachedArtist) => {
    tryAddArtist(cachedArtist);
  });

  return selectedArtists.map((selectedArtist, index) => ({
    id: `artist${index + 1}`,
    name: selectedArtist?.name || `Discovery Artist ${index + 1}`,
    genre: selectedArtist?.genre || "Music",
    imageUrl: selectedArtist?.imageUrl || DEFAULT_DISCOVERY_ARTIST_IMAGE,
  }));
};

const buildDiscoveryTimeline = (artists = []) => {
  if (!Array.isArray(artists) || artists.length === 0) {
    return [];
  }

  const dayPlans = DISCOVERY_DAY_BLUEPRINTS.map((blueprint, index) => {
    const targetVisibleCount = Math.min(6, Math.max(4, Number(blueprint.visibleCount) || 4));
    const isPriorityDay =
      blueprint.label === "15 days ago" || blueprint.label === "3 weeks ago";

    return {
      blueprint,
      index,
      isPriorityDay,
      targetVisibleCount,
      minimumVisibleCount: isPriorityDay ? targetVisibleCount : Math.min(4, targetVisibleCount),
      assignedVisibleCount: 0,
    };
  });

  const selectedDayIndices = new Set();
  let remainingArtists = artists.length;

  dayPlans
    .filter((dayPlan) => dayPlan.isPriorityDay)
    .forEach((dayPlan) => {
      if (remainingArtists >= dayPlan.minimumVisibleCount) {
        selectedDayIndices.add(dayPlan.index);
        dayPlan.assignedVisibleCount = dayPlan.minimumVisibleCount;
        remainingArtists -= dayPlan.minimumVisibleCount;
      }
    });

  dayPlans
    .filter((dayPlan) => !dayPlan.isPriorityDay)
    .forEach((dayPlan) => {
      if (remainingArtists >= dayPlan.minimumVisibleCount) {
        selectedDayIndices.add(dayPlan.index);
        dayPlan.assignedVisibleCount = dayPlan.minimumVisibleCount;
        remainingArtists -= dayPlan.minimumVisibleCount;
      }
    });

  let expanded = true;
  while (remainingArtists > 0 && expanded) {
    expanded = false;

    dayPlans.forEach((dayPlan) => {
      if (!selectedDayIndices.has(dayPlan.index) || remainingArtists <= 0) {
        return;
      }

      if (dayPlan.assignedVisibleCount < dayPlan.targetVisibleCount) {
        dayPlan.assignedVisibleCount += 1;
        remainingArtists -= 1;
        expanded = true;
      }
    });
  }

  let artistCursor = 0;

  return dayPlans
    .filter((dayPlan) => selectedDayIndices.has(dayPlan.index))
    .map((dayPlan) => {
      const assignedCount = dayPlan.assignedVisibleCount;
      const artistIds = artists
        .slice(artistCursor, artistCursor + assignedCount)
        .map((artist) => artist.id)
        .filter(Boolean);
      artistCursor += assignedCount;

      const sourceBlueprint = dayPlan.blueprint;
      return {
        daysAgo: sourceBlueprint.daysAgo,
        label: sourceBlueprint.label,
        visibleCount: artistIds.length,
        plusCount: Math.max(0, Number(sourceBlueprint.plusCount) || 0),
        artistIds,
        genreStats: sourceBlueprint.genreStats,
      };
    })
    .filter((day) => day.artistIds.length > 0);
};

const discoveryArtists = buildDiscoveryArtists();

const artistData = {
  artists: discoveryArtists,
  discoveryTimeline: buildDiscoveryTimeline(discoveryArtists),

  // Find artist by ID
  getArtist: function(id) {
    return this.artists.find((artist) => artist.id === id);
  },

  // Get a specific day's discovery data
  getDiscoveryDay: function(daysAgo) {
    return this.discoveryTimeline.find((day) => day.daysAgo === daysAgo);
  },

  // Get all discovery days
  getAllDiscoveryDays: function() {
    return this.discoveryTimeline;
  },
};

export default artistData;
