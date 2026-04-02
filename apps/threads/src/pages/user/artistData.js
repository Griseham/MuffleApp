import cachedArtistImages from "../../backend/cached_artist_images.json";

const DEFAULT_DISCOVERY_ARTIST_IMAGE = "/assets/default-artist.png";
const cachedPostModules = import.meta.glob("../../cached_posts/*.json", { eager: true });

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

const cachedArtistsWithImages = Object.values(cachedArtistImages || {})
  .map((entry) => ({
    name: String(entry?.artistName || entry?.requestName || "").trim(),
    imageUrl: String(entry?.imageUrl || "").trim(),
    genre: "Music",
  }))
  .filter((entry) => entry.name && hasUsableImageUrl(entry.imageUrl));

const cachedSnippetArtists = Object.values(cachedPostModules)
  .flatMap((moduleValue) => {
    const payload = moduleValue?.default || moduleValue;
    const snippets = Array.isArray(payload?.snippets) ? payload.snippets : [];
    return snippets.map((snippet) => ({
      name: String(snippet?.artistName || "").trim(),
      imageUrl: String(snippet?.artworkUrl || "").trim(),
      genre: "Music",
    }));
  })
  .filter((entry) => entry.name && hasUsableImageUrl(entry.imageUrl));

const mergeUniqueArtists = (candidates = []) => {
  const seen = new Set();
  const merged = [];

  candidates.forEach((candidate) => {
    const name = String(candidate?.name || "").trim();
    if (!name) return;

    const normalized = normalizeArtistName(name);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);

    const slotGenre = slotGenreByName.get(normalized);
    merged.push({
      name,
      genre: String(slotGenre || candidate?.genre || "Music"),
      imageUrl: hasUsableImageUrl(candidate?.imageUrl)
        ? String(candidate.imageUrl).trim()
        : DEFAULT_DISCOVERY_ARTIST_IMAGE,
    });
  });

  return merged;
};

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

const buildDiscoveryArtists = (minimumCount = 0) => {
  const mergedArtists = mergeUniqueArtists([
    ...cachedArtistsWithImages,
    ...cachedSnippetArtists,
    ...DISCOVERY_ARTIST_SLOTS.map((slot) => ({
      ...slot,
      imageUrl: DEFAULT_DISCOVERY_ARTIST_IMAGE,
    })),
  ]);

  let syntheticIndex = 1;
  while (mergedArtists.length < minimumCount) {
    mergedArtists.push({
      name: `Discovery Artist ${syntheticIndex}`,
      genre: "Music",
      imageUrl: DEFAULT_DISCOVERY_ARTIST_IMAGE,
    });
    syntheticIndex += 1;
  }

  return mergedArtists.map((selectedArtist, index) => {
    return {
      id: `artist${index + 1}`,
      name: selectedArtist?.name || `Discovery Artist ${index + 1}`,
      genre: selectedArtist?.genre || "Music",
      imageUrl: selectedArtist?.imageUrl || DEFAULT_DISCOVERY_ARTIST_IMAGE,
    };
  });
};

const buildDiscoveryTimeline = (artists = []) => {
  let artistIndex = 0;

  return DISCOVERY_DAY_BLUEPRINTS.map((blueprint) => {
    const visibleCount = Math.min(6, Math.max(4, Number(blueprint.visibleCount) || 4));
    const plusCount = Math.max(0, Number(blueprint.plusCount) || 0);
    const totalArtistsForDay = visibleCount + plusCount;

    const artistIds = artists
      .slice(artistIndex, artistIndex + totalArtistsForDay)
      .map((artist) => artist.id);
    artistIndex += totalArtistsForDay;

    return {
      daysAgo: blueprint.daysAgo,
      label: blueprint.label,
      visibleCount,
      plusCount,
      artistIds,
      genreStats: blueprint.genreStats,
    };
  });
};

const totalDiscoveryArtistsNeeded = DISCOVERY_DAY_BLUEPRINTS.reduce(
  (sum, day) => sum + day.visibleCount + day.plusCount,
  0
);
const discoveryArtists = buildDiscoveryArtists(totalDiscoveryArtistsNeeded);

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
