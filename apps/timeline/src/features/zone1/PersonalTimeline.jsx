import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { TIMELINE_MONTHS, EXTENDED_TIMELINE_MONTHS, CURRENT_MONTH_INDEX } from "../../backend/timelineMockData";
import { getCacheReadyTimelineArtists } from "../../backend/cacheReadyArtists";
import Zone1Header from "./Zone1Header";
import ArtistDot from "./ArtistDot";
import {
  getActiveRating,
  getBaselineRating,
  getViewLabel,
  getXPosition,
  getYPosition,
} from "./position";

const SEPARATOR_INDEX = TIMELINE_MONTHS.length;
const PAST_YEARS = Array.from(new Set(TIMELINE_MONTHS.map((month) => month.year)));
const CURRENT_TIMELINE_YEAR = TIMELINE_MONTHS[CURRENT_MONTH_INDEX]?.year ?? 2025;
const FUTURE_YEAR = EXTENDED_TIMELINE_MONTHS.find((month) => month.isFuture)?.year ?? (CURRENT_TIMELINE_YEAR + 1);
const FUTURE_ARTIST_COUNT_DEFAULT = 7;
const FUTURE_ARTIST_COUNT_ANTICIPATED = 5;
const TOP_ARTISTS_PER_YEAR = 5;
const MAX_FRIEND_TIMELINES = 3;
const AVAILABLE_ZONE1_FRIENDS = [
  { id: "friend_1", name: "Friend 1", avatar: "1", color: "#85C1E9" },
  { id: "friend_2", name: "Friend 2", avatar: "2", color: "#C9B1FF" },
  { id: "friend_3", name: "Friend 3", avatar: "3", color: "#7DD3C0" },
];
const TOP_ARTISTS_LANE_HEIGHT = 224;
const TOP_ARTISTS_LANE_GAP = 18;
const TOP_ARTISTS_LANE_DOT_Y = 16;
const TOP_ARTISTS_ALBUM_SIZE = 112;
const TOP_ARTISTS_ALBUM_TOP = 78;
const TOP_ALBUMS_VIEW_TRANSITION_MS = 420;
const MONTH_START_BY_YEAR = (() => {
  const starts = new Map();
  EXTENDED_TIMELINE_MONTHS.forEach((month, index) => {
    if (!starts.has(month.year)) starts.set(month.year, index);
  });
  return starts;
})();

function getMiddleMonthIndex(year, fallbackIndex) {
  const monthIndexes = [];
  for (let i = 0; i < EXTENDED_TIMELINE_MONTHS.length; i += 1) {
    if (EXTENDED_TIMELINE_MONTHS[i].year === year) monthIndexes.push(i);
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

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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
  {
    futureArtistCount = FUTURE_ARTIST_COUNT_DEFAULT,
    pastArtistCount = null,
  } = {}
) {
  const unique = dedupeArtistsByName(getCacheReadyTimelineArtists());
  return buildTimelinePlacement(unique, { futureArtistCount, pastArtistCount });
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

function getTimelineUserYearArtists(artists, userKey, year) {
  const yearArtists = getArtistsForYear(artists, year)
    .sort((a, b) => {
      const aScore = hashString(`${a.id}-${userKey}-${year}`);
      const bScore = hashString(`${b.id}-${userKey}-${year}`);
      return aScore - bScore || a.name.localeCompare(b.name);
    });

  return yearArtists
    .slice(0, getTimelineUserAlbumCount(userKey, year))
    .sort(sortArtistsChronologically);
}

function getTopArtistAlbumName(artist, year) {
  const artistAlbumTitles = getArtistAlbumTitles(artist);
  if (artistAlbumTitles.length > 0) {
    const albumIndex = hashString(`${artist.name}-${year}`) % artistAlbumTitles.length;
    return artistAlbumTitles[albumIndex];
  }
  const idx = hashString(`${artist.name}-${year}`) % TOP_ALBUM_NAMES.length;
  return TOP_ALBUM_NAMES[idx];
}

function enrichAnticipatedArtist(artist, waitingArtistIds) {
  if (!artist?.isAnticipated) return artist;

  const month = EXTENDED_TIMELINE_MONTHS[artist.releaseMonth];
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

function TopAlbumArtPlaceholder({ artist, albumName, size }) {
  const h = hashString((albumName || "album") + artist.name);
  const rng = makeRng(h);
  const c1 = artist.color;
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
        background: `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 50%, #080808 100%)`,
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
  x,
  y,
  albumTop,
  size,
  laneIndex = 0,
  isSelected,
  isHovered,
  onClick,
  onHover,
  onLeave,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasArtistImage = Boolean(artist.artworkUrl) && !imageFailed;

  return (
    <>
      <div
        className={`artist-dot top-artist-lane-dot ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
        style={{
          "--lane-index": laneIndex,
          left: x,
          top: y,
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${artist.color} 0%, ${artist.color}bb 100%)`,
          borderColor: isSelected ? "#A4A2A0" : isHovered ? "#554E48" : "#282B29",
          boxShadow: isSelected ? `0 8px 24px ${artist.color}66` : "0 2px 8px rgba(0,0,0,0.4)",
        }}
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        {hasArtistImage ? (
          <img
            src={artist.artworkUrl}
            alt={artist.name}
            className="artist-photo"
            loading="lazy"
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
        className={`top-artist-album-wrapper ${isHovered ? "hovered" : ""}`}
        style={{
          "--lane-index": laneIndex,
          left: x + size / 2 - TOP_ARTISTS_ALBUM_SIZE / 2,
          top: albumTop,
        }}
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        <TopAlbumArtPlaceholder artist={artist} albumName={albumName} size={TOP_ARTISTS_ALBUM_SIZE} />
        <div className="top-artist-album-name">{albumName}</div>
      </div>
    </>
  );
}

export default function PersonalTimeline({
  selectedArtist,
  setSelectedArtist,
  hoveredArtist,
  setHoveredArtist,
}) {
  const monthWidth = 100;
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

  // Rebuild the timeline artists when image cache or anticipated mode changes.
  const timelineArtists = useMemo(() => {
    const futureCount = showAnticipatedAlbums
      ? FUTURE_ARTIST_COUNT_ANTICIPATED
      : FUTURE_ARTIST_COUNT_DEFAULT;
    return buildUniqueZone1Artists({
      futureArtistCount: futureCount,
      pastArtistCount: null,
    }).map((artist) => enrichAnticipatedArtist(artist, waitingArtistIds));
  }, [showAnticipatedAlbums, waitingArtistIds]);

  const topAlbumsArtists = useMemo(() => (
    buildUniqueZone1Artists({
      futureArtistCount: FUTURE_ARTIST_COUNT_DEFAULT,
      pastArtistCount: TOP_ARTISTS_PER_YEAR,
    })
  ), []);

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

    const timelineMonthIndex = getMiddleMonthIndex(CURRENT_TIMELINE_YEAR, CURRENT_MONTH_INDEX);
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
      scrollToMonthCenter(getMiddleMonthIndex(CURRENT_TIMELINE_YEAR, CURRENT_MONTH_INDEX));
    }
  }, [activeViewTab, friendTimelines, monthWidth]);

  // Track visible year on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const centerX = scrollRef.current.scrollLeft + scrollRef.current.clientWidth / 2;
        const month = EXTENDED_TIMELINE_MONTHS[Math.floor(centerX / monthWidth)];
        if (month) setVisibleYear(month.year);
      }
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const timelineWidth = EXTENDED_TIMELINE_MONTHS.length * monthWidth;

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
      const futureStartIndex = EXTENDED_TIMELINE_MONTHS.findIndex((m) => m.isFuture);
      const futureMonthCount = EXTENDED_TIMELINE_MONTHS.filter((m) => m.isFuture).length;

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

  const topArtistsLanePlacements = useMemo(() => {
    const placements = [];
    PAST_YEARS.forEach((year) => {
      const yearStart = MONTH_START_BY_YEAR.get(year);
      if (yearStart === undefined) return;

      const rankedArtists = getArtistsForYear(topAlbumsArtists, year)
        .sort(sortArtistsByBaselineRank)
        .slice(0, TOP_ARTISTS_PER_YEAR);

      if (!rankedArtists.length) return;

      const slotWidth = (12 * monthWidth) / (rankedArtists.length + 1);
      rankedArtists.forEach((artist, index) => {
        const centerX = yearStart * monthWidth + slotWidth * (index + 1);
        placements.push({
          artist: {
            ...artist,
            albumName: getTopArtistAlbumName(artist, year),
          },
          x: centerX - artistSize / 2,
        });
      });
    });

    return placements;
  }, [topAlbumsArtists, monthWidth, artistSize]);

  const personalTopArtistsPlacements = useMemo(() => {
    const placements = [];
    PAST_YEARS.forEach((year) => {
      const yearStart = MONTH_START_BY_YEAR.get(year);
      if (yearStart === undefined) return;

      const personalArtists = getTimelineUserYearArtists(topAlbumsArtists, "you", year);

      if (!personalArtists.length) return;

      const slotWidth = (12 * monthWidth) / (personalArtists.length + 1);
      personalArtists.forEach((artist, index) => {
        const centerX = yearStart * monthWidth + slotWidth * (index + 1);
        placements.push({
          artist: {
            ...artist,
            albumName: artist.albumName || getTopArtistAlbumName(artist, year),
          },
          x: centerX - artistSize / 2,
        });
      });
    });

    return placements;
  }, [topAlbumsArtists, monthWidth, artistSize]);

  const topAlbumTimelineLanes = useMemo(() => {
    const lanes = [
      {
        id: "top-albums",
        label: "Top Albums",
        placements: topArtistsLanePlacements,
      },
      {
        id: "you",
        label: "You",
        placements: personalTopArtistsPlacements,
        avatar: "Y",
        color: "#D39A3B",
        avatarOnly: true,
      },
    ];

    renderedFriendTimelines.forEach((friend) => {
      const friendPlacements = [];
      PAST_YEARS.forEach((year) => {
        const yearStart = MONTH_START_BY_YEAR.get(year);
        if (yearStart === undefined) return;

        const yearArtists = getTimelineUserYearArtists(
          topAlbumsArtists,
          String(friend.id),
          year
        );

        if (!yearArtists.length) return;

        const slotWidth = (12 * monthWidth) / (yearArtists.length + 1);
        yearArtists.forEach((artist, index) => {
          const centerX = yearStart * monthWidth + slotWidth * (index + 1);
          friendPlacements.push({
            artist: {
              ...artist,
              albumName: getTopArtistAlbumName(artist, `${year}-${friend.id}`),
            },
            x: centerX - artistSize / 2,
          });
        });
      });

      lanes.push({
        id: String(friend.id),
        label: friend.name,
        placements: friendPlacements,
        avatar: friend.avatar,
        color: friend.color,
        avatarOnly: true,
      });
    });

    return lanes;
  }, [
    topArtistsLanePlacements,
    personalTopArtistsPlacements,
    renderedFriendTimelines,
    topAlbumsArtists,
    monthWidth,
    artistSize,
  ]);

  const yearMarkers = useMemo(() => {
    const markers = [];
    let currentYear = null;
    EXTENDED_TIMELINE_MONTHS.forEach((month, index) => {
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
                          {lane.avatar}
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
            {EXTENDED_TIMELINE_MONTHS.map((month, i) => (
              <div
                key={`${month.fullName}-${month.year}-${i}`}
                className={`personal-month-cell ${month.isYearStart ? "year-start" : ""}`}
              >
                <span
                  className={`personal-month-name ${i === CURRENT_MONTH_INDEX ? "active" : ""} ${month.isFuture ? "future" : ""}`}
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
            {EXTENDED_TIMELINE_MONTHS.map((month, i) => (
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
                  const isHovered = hoveredArtist?.id === artist.id;
                  return (
                    <TopArtistLaneDot
                      key={`${lane.id}-${artist.id}-${x}`}
                      artist={artist}
                      albumName={artist.albumName}
                      x={x}
                      y={rowTop + TOP_ARTISTS_LANE_DOT_Y}
                      albumTop={rowTop + TOP_ARTISTS_ALBUM_TOP}
                      size={artistSize}
                      laneIndex={laneIndex}
                      isSelected={isSelected}
                      isHovered={isHovered}
                      onClick={() => setSelectedArtist(isSelected ? null : artist)}
                      onHover={() => setHoveredArtist(artist)}
                      onLeave={() => setHoveredArtist(null)}
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
