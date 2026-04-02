import { useMemo, useRef, useEffect, useState } from "react";
import { hashString, mulberry32 } from "./seed";
import {
  ZONE1_MONTHS,
  ZONE1_PAST_YEARS,
  ZONE1_CURRENT_MONTH_INDEX,
  ZONE1_CURRENT_TIMELINE_YEAR,
} from "./timelineBounds";

const MONTH_WIDTH = 100;
const ARTIST_SIZE = 40;
const ALBUM_SIZE = 140;
const CIRCLE_TOP = 14;
const ALBUM_TOP = 60;
const LANE_HEIGHT = 224;
const LANE_GAP = 18;
const TOP_ALBUM_COUNT = 5;

const PAST_YEARS = ZONE1_PAST_YEARS;

const MONTH_START_BY_YEAR = (() => {
  const starts = new Map();
  ZONE1_MONTHS.forEach((month, index) => {
    if (!starts.has(month.year)) starts.set(month.year, index);
  });
  return starts;
})();

const TOP_ARTIST_NAMES = [
  "Drake", "Rihanna", "The Weeknd", "Doja Cat", "Ariana Grande",
  "Olivia Rodrigo", "Post Malone", "Lana Del Rey", "Dua Lipa",
  "Kendrick Lamar", "Metro Boomin", "J. Cole", "Nicki Minaj", "Adele",
  "Bruno Mars", "Childish Gambino", "Future", "SZA", "Bad Bunny",
  "Tyler, The Creator", "Playboi Carti", "Don Toliver", "21 Savage",
  "Beyoncé", "Travis Scott", "Khalid", "Frank Ocean", "Billie Eilish",
  "Lil Uzi Vert", "Rosalía", "Ed Sheeran", "Harry Styles",
  "Justin Bieber", "Kanye West", "Cardi B", "Lorde", "Miley Cyrus",
  "Karol G", "Peso Pluma",
];

const TOP_ROW_ALBUM_NAMES = [
  "Midnight Sessions", "Neon Dreams", "Velvet Horizon", "Dark Paradise",
  "Golden Hour", "Electric Soul", "Phantom Waves", "Crystal Memory",
  "Silk & Steel", "Shadow Dance", "Lunar Phase", "Ember Glow",
  "Sonic Bloom", "Violet Haze", "Iron Butterfly", "Ocean Floor",
  "Star Residue", "Glass Cathedral", "Thunder Rose", "Binary Sunset",
];

const USER_ROW_ALBUM_NAMES = [
  "Smoke Signals", "Northbound", "City Halo", "Glass Tides",
  "Soft Static", "Silver Motel", "Parallel Lights", "Low Moon",
  "Paper Suns", "Rose Engine", "Velour Echo", "Chrome Sunday",
  "Heat Mirage", "Winter Relay", "Golden Static", "Cascade Theory",
  "Quiet Fever", "Citrus Bloom", "Second Nature", "Night Circuit",
  "Echo Harbor", "After Image", "Blue Motel", "Signal Fade",
];

const ARTIST_COLORS = [
  "#8B6914", "#9B2335", "#6B2D5B", "#D4507A", "#C490A0",
  "#7B4B8A", "#8A7A5A", "#4A6B7A", "#D4436B", "#5A3E2B",
  "#3A4A6B", "#5B6B4A", "#E05B9A", "#7A6B5B", "#B8860B",
  "#4A5A3B", "#3B4B6A", "#6B5B8A", "#9A4A3B", "#5A8A4A",
  "#8A3B4A", "#4B6A5A", "#6A3B3B", "#C4943B", "#4A3B5A",
  "#6A5B4A", "#3A5B6B", "#4A6A3B", "#8A3B5A", "#8A5A4B",
  "#B87333", "#7B5B8A", "#5B4A3B", "#6A4B5A", "#B84A5A",
  "#3A6B6A", "#8A6A5A", "#5B8A7A", "#9A6A3B",
];

const USER_LANES = [
  { id: "you", label: "You", avatar: "Y", color: "#D39A3B" },
  { id: "alex", label: "Alex", avatar: "A", color: "#85C1E9" },
  { id: "jordan", label: "Jordan", avatar: "J", color: "#C9B1FF" },
  { id: "sam", label: "Sam", avatar: "S", color: "#7DD3C0" },
];

function toInitials(name) {
  const clean = String(name || "").trim();
  if (!clean) return "??";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function shuffleList(items, rng) {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

function getAlbumName(pool, laneId, year, artistName, index) {
  const albumIdx = hashString(`${laneId}-${year}-${artistName}-${index}`) % pool.length;
  return pool[albumIdx];
}

function getRankValue(laneId, year, artistName) {
  return 5 + (hashString(`${laneId}-${year}-${artistName}-rank`) % 89);
}

function getArtistColor(name) {
  const index = TOP_ARTIST_NAMES.indexOf(name);
  const colorIdx = (index >= 0 ? index : hashString(name)) % ARTIST_COLORS.length;
  return ARTIST_COLORS[colorIdx];
}

function buildLaneArtist(name, { laneId, year, index, albumPool, includeRank = false }) {
  return {
    id: `${laneId}-${year}-${index}-${name}`,
    name,
    initials: toInitials(name),
    color: getArtistColor(name),
    albumName: getAlbumName(albumPool, laneId, year, name, index),
    rank: includeRank ? getRankValue(laneId, year, name) : null,
    year,
    artworkUrl: null,
  };
}

function buildTopAlbumsForYear(year) {
  const rng = mulberry32(hashString(`top-lane-${year}`));
  const names = shuffleList(TOP_ARTIST_NAMES, rng).slice(0, TOP_ALBUM_COUNT);
  return names.map((name, index) =>
    buildLaneArtist(name, {
      laneId: "top-albums",
      year,
      index,
      albumPool: TOP_ROW_ALBUM_NAMES,
    })
  );
}

function getDistinctUserCounts(year) {
  const orderedCounts = shuffleList([1, 2, 3, 4], mulberry32(hashString(`user-counts-${year}`)));
  return USER_LANES.reduce((acc, lane, index) => {
    acc[lane.id] = orderedCounts[index % orderedCounts.length];
    return acc;
  }, {});
}

function buildUserAlbumsForYear(year, topAlbums) {
  const blockedNames = new Set(topAlbums.map((artist) => artist.name));
  const availableNames = TOP_ARTIST_NAMES.filter((name) => !blockedNames.has(name));
  const countsByLane = getDistinctUserCounts(year);
  const pool = shuffleList(availableNames, mulberry32(hashString(`user-pool-${year}`)));
  let cursor = 0;

  return USER_LANES.reduce((acc, lane) => {
    const count = countsByLane[lane.id];
    const laneNames = pool.slice(cursor, cursor + count);
    cursor += count;

    acc[lane.id] = laneNames.map((name, index) =>
      buildLaneArtist(name, {
        laneId: lane.id,
        year,
        index,
        albumPool: USER_ROW_ALBUM_NAMES,
        includeRank: true,
      })
    );
    return acc;
  }, {});
}

function getCenteredMonthScrollLeft(monthIndex, monthWidth, viewportWidth) {
  const monthCenterX = (monthIndex + 0.5) * monthWidth;
  return Math.max(0, monthCenterX - viewportWidth / 2);
}

function AlbumArtPlaceholder({ artist, size, showRank }) {
  const h = hashString(artist.albumName + artist.name);
  const rng = mulberry32(h);
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
      {showRank && <div className="top-artist-rank-badge">#{artist.rank}</div>}
    </div>
  );
}

function TopArtistItem({
  artist,
  x,
  y,
  albumTop,
  laneIndex,
  selectedArtist,
  setSelectedArtist,
  hoveredArtist,
  setHoveredArtist,
  showRank,
}) {
  const isHovered = hoveredArtist?.id === artist.id;
  const isSelected = selectedArtist?.id === artist.id;
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = Boolean(artist.artworkUrl) && !imgFailed;

  return (
    <>
      <div
        className="top-artist-item"
        onMouseEnter={() => setHoveredArtist(artist)}
        onMouseLeave={() => setHoveredArtist(null)}
        onClick={() => setSelectedArtist(isSelected ? null : artist)}
      >
        <div
          className={`artist-dot top-artist-lane-dot ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
          style={{
            "--lane-index": laneIndex,
            left: x,
            top: y,
            width: ARTIST_SIZE,
            height: ARTIST_SIZE,
            background: `linear-gradient(135deg, ${artist.color} 0%, ${artist.color}bb 100%)`,
            borderColor: isSelected ? "#A4A2A0" : isHovered ? "#554E48" : "#282B29",
            boxShadow: isSelected
              ? `0 8px 24px ${artist.color}66`
              : "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {hasImage ? (
            <img
              src={artist.artworkUrl}
              alt={artist.name}
              className="artist-photo"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="artist-initials">{artist.initials}</span>
          )}
        </div>

        <div
          className={`artist-name-label top-artist-lane-label ${isSelected ? "selected" : ""}`}
          style={{ "--lane-index": laneIndex, left: x + ARTIST_SIZE / 2, top: y + ARTIST_SIZE + 4 }}
        >
          {artist.name}
        </div>

        <div
          className={`top-artist-album-wrapper ${isHovered ? "hovered" : ""}`}
          style={{
            "--lane-index": laneIndex,
            left: x + ARTIST_SIZE / 2 - ALBUM_SIZE / 2,
            top: albumTop,
          }}
        >
          <AlbumArtPlaceholder artist={artist} size={ALBUM_SIZE} showRank={showRank} />
          <div className="top-artist-album-name">{artist.albumName}</div>
        </div>
      </div>
    </>
  );
}

export default function TopArtistsView({
  selectedArtist,
  setSelectedArtist,
  hoveredArtist,
  setHoveredArtist,
}) {
  const scrollRef = useRef(null);
  const [visibleYear, setVisibleYear] = useState(ZONE1_CURRENT_TIMELINE_YEAR);

  const laneDefinitions = useMemo(() => {
    const lanes = [
      { id: "top-albums", label: "Top Albums", placements: [] },
      ...USER_LANES.map((lane) => ({
        ...lane,
        placements: [],
        avatarOnly: true,
      })),
    ];

    PAST_YEARS.forEach((year) => {
      const yearStartIndex = MONTH_START_BY_YEAR.get(year) ?? 0;
      const topAlbums = buildTopAlbumsForYear(year);
      const userAlbumsByLane = buildUserAlbumsForYear(year, topAlbums);

      const yearLaneArtists = [
        { laneId: "top-albums", artists: topAlbums },
        ...USER_LANES.map((lane) => ({
          laneId: lane.id,
          artists: userAlbumsByLane[lane.id] || [],
        })),
      ];

      yearLaneArtists.forEach(({ laneId, artists }) => {
        if (!artists.length) return;
        const slotWidth = (12 * MONTH_WIDTH) / (artists.length + 1);
        const lane = lanes.find((item) => item.id === laneId);
        if (!lane) return;

        artists.forEach((artist, index) => {
          const centerX = yearStartIndex * MONTH_WIDTH + slotWidth * (index + 1);
          lane.placements.push({
            artist,
            x: centerX - ARTIST_SIZE / 2,
          });
        });
      });
    });

    return lanes;
  }, []);

  const laneCount = laneDefinitions.length;
  const timelineHeight = laneCount * LANE_HEIGHT + (laneCount - 1) * LANE_GAP;
  const timelineWidth = ZONE1_MONTHS.length * MONTH_WIDTH;

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft = getCenteredMonthScrollLeft(
      ZONE1_CURRENT_MONTH_INDEX,
      MONTH_WIDTH,
      scrollRef.current.clientWidth
    );
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const centerX = scrollRef.current.scrollLeft + scrollRef.current.clientWidth / 2;
      const month = ZONE1_MONTHS[Math.floor(centerX / MONTH_WIDTH)];
      if (month) setVisibleYear(month.year);
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, []);

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
    <div className="personal-timeline-container">
      <div className="year-panel lane-labels-mode">
        <div className="year-panel-view year-panel-lanes-view is-active">
          <div className="year-panel-month-spacer" />
          <div className="timeline-lane-labels" style={{ height: timelineHeight }}>
            {laneDefinitions.map((lane, laneIndex) => {
              const rowTop = laneIndex * (LANE_HEIGHT + LANE_GAP);
              const laneLabelLines = String(lane.label || "").split(/\s+/).filter(Boolean);

              return (
                <span
                  key={`lane-label-${lane.id}`}
                  className={`timeline-lane-label ${lane.avatarOnly ? "avatar-only" : ""}`}
                  style={{
                    "--lane-index": laneIndex,
                    top: rowTop + LANE_HEIGHT / 2,
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
                        {laneLabelLines.map((line, index) => (
                          <span key={`${lane.id}-line-${index}`} className="timeline-lane-label-line">
                            {line}
                          </span>
                        ))}
                      </span>
                    </>
                  ) : (
                    <span className="timeline-lane-label-stack">
                      {laneLabelLines.map((line, index) => (
                        <span key={`${lane.id}-line-${index}`} className="timeline-lane-label-line">
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
          className="personal-dots-area top-artists-expanded"
          style={{ height: timelineHeight, width: timelineWidth }}
        >
          {ZONE1_MONTHS.map((month, i) => (
            <div
              key={i}
              className={`personal-column-bg ${i % 2 === 0 ? "even" : ""} ${month.isFuture ? "future-column" : ""}`}
              style={{ left: i * MONTH_WIDTH, width: MONTH_WIDTH }}
            />
          ))}

          <div className="zone1-view-layer zone1-top-albums-layer is-active">
            {laneDefinitions.map((lane, laneIndex) => {
              const rowTop = laneIndex * (LANE_HEIGHT + LANE_GAP);
              const dividerTop = rowTop + LANE_HEIGHT + LANE_GAP / 2;
              return (
                <div key={`lane-bg-${lane.id}`}>
                  <div
                    className="top-artists-lane-bg"
                    style={{
                      "--lane-index": laneIndex,
                      top: rowTop,
                      height: LANE_HEIGHT,
                    }}
                  />
                  {lane.id === "top-albums" && (
                    <div
                      className="top-artists-lane-tag"
                      style={{ top: rowTop + 6 }}
                    >
                      {visibleYear}
                    </div>
                  )}
                  {laneIndex < laneDefinitions.length - 1 && (
                    <div
                      className="top-artists-lane-divider"
                      style={{
                        "--lane-index": laneIndex,
                        top: dividerTop,
                      }}
                    />
                  )}
                </div>
              );
            })}

            {yearMarkers.map((marker) => (
              <div
                key={marker.year}
                className={`year-marker ${marker.isFuture ? "future" : ""}`}
                style={{ left: marker.startIndex * MONTH_WIDTH }}
              >
                <div className="year-marker-line" />
                <div className="year-marker-label">{marker.year}</div>
              </div>
            ))}

            {laneDefinitions.flatMap((lane, laneIndex) => {
              const rowTop = laneIndex * (LANE_HEIGHT + LANE_GAP);
              return lane.placements.map(({ artist, x }) => (
                <TopArtistItem
                  key={artist.id}
                  artist={artist}
                  x={x}
                  y={rowTop + CIRCLE_TOP}
                  albumTop={rowTop + ALBUM_TOP}
                  laneIndex={laneIndex}
                  selectedArtist={selectedArtist}
                  setSelectedArtist={setSelectedArtist}
                  hoveredArtist={hoveredArtist}
                  setHoveredArtist={setHoveredArtist}
                  showRank={lane.id !== "top-albums"}
                />
              ));
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
