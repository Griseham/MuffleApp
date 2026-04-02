import React, { useMemo, useState, useEffect } from "react";
import { getAppleMusicAlbumArtworks } from "../services/appleMusic";
import { ClickableUserAvatar } from "../pages/posts/UserHoverCard";
import { getAvatarSrc, hashString } from "../pages/posts/postCardUtils";
import InfoIconModal from "./InfoIconModal";
import cachedArtistImages from "../backend/cached_artist_images.json";

/* =========================
   Icons
========================= */
const StarIcon = ({ size = 14, color = "#a9b6fc" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const HeartIcon = ({ size = 14, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "#ff6b9d" : "none"}
    stroke="#ff6b9d"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const VolumeIcon = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const ChevronIcon = ({ size = 14, down = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{
      transform: down ? "rotate(0deg)" : "rotate(180deg)",
      transition: "transform 0.3s ease",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const PlayIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

/* =========================
   Helpers
========================= */
/* =========================
   Real Artist / Song Data (mirrors PostCard's ARTIST_SONG_POOL)
========================= */
const TRACK_KEY_SEP = "|||";
const _trackKey = (song, artist) =>
  `${String(song || "").trim()}${TRACK_KEY_SEP}${String(artist || "").trim()}`;
const normalizeArtistName = (name = "") => String(name || "").trim().toLowerCase();
const hasUsableArtistImage = (imageUrl = "") => {
  const raw = String(imageUrl || "").trim();
  if (!raw) return false;
  const lower = raw.toLowerCase();
  return (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) &&
    !lower.includes("placeholder");
};

const ARTIST_SONG_POOL = {
  "SZA":                [{ song: "Kill Bill", accent: "#818CF8", albumColor: "#1a1030" }, { song: "Good Days", accent: "#818CF8", albumColor: "#130a2a" }],
  "Frank Ocean":        [{ song: "Pink + White", accent: "#60A5FA", albumColor: "#0d1a2e" }, { song: "Ivy", accent: "#60A5FA", albumColor: "#0f1e2e" }],
  "Tyler, The Creator": [{ song: "See You Again", accent: "#F59E0B", albumColor: "#1a150a" }, { song: "November", accent: "#F59E0B", albumColor: "#150e05" }],
  "Kendrick Lamar":     [{ song: "Loyalty", accent: "#EF4444", albumColor: "#1e0a0a" }, { song: "Love", accent: "#EF4444", albumColor: "#200808" }],
  "Beyoncé":            [{ song: "Cuff It", accent: "#D97706", albumColor: "#1a1200" }, { song: "Virgo's Groove", accent: "#D97706", albumColor: "#1c1400" }],
  "Drake":              [{ song: "Passionfruit", accent: "#10B981", albumColor: "#041a12" }],
  "Childish Gambino":   [{ song: "Redbone", accent: "#A78BFA", albumColor: "#160a2a" }, { song: "Heartbeat", accent: "#A78BFA", albumColor: "#120830" }],
  "H.E.R.":             [{ song: "Best Part", accent: "#2EC4B6", albumColor: "#041a18" }],
  "Daniel Caesar":      [{ song: "Best Part", accent: "#2EC4B6", albumColor: "#041a18" }, { song: "Get You", accent: "#2EC4B6", albumColor: "#021510" }],
  "Jorja Smith":        [{ song: "On My Mind", accent: "#34D399", albumColor: "#041410" }],
  "Steve Lacy":         [{ song: "Bad Habit", accent: "#FB923C", albumColor: "#1a0e00" }, { song: "Helmet", accent: "#FB923C", albumColor: "#180c00" }],
  "Brent Faiyaz":       [{ song: "Dead Man Walking", accent: "#C084FC", albumColor: "#160820" }],
  "Summer Walker":      [{ song: "Come Thru", accent: "#F472B6", albumColor: "#1a0410" }, { song: "Over It", accent: "#F472B6", albumColor: "#180216" }],
  "6LACK":              [{ song: "Ex Calling", accent: "#94A3B8", albumColor: "#0e1018" }],
  "Lucky Daye":         [{ song: "I'd Rather", accent: "#FCD34D", albumColor: "#1a1400" }],
  "Ravyn Lenae":        [{ song: "Sticky", accent: "#F9A8D4", albumColor: "#1a0818" }],
  "Ari Lennox":         [{ song: "Shea Butter Baby", accent: "#86EFAC", albumColor: "#041008" }],
  "PARTYNEXTDOOR":      [{ song: "Loyal", accent: "#7DD3FC", albumColor: "#041018" }],
  "Snoh Aalegra":       [{ song: "WHOA", accent: "#C4B5FD", albumColor: "#0e0820" }],
  "Charlotte Day Wilson":[{ song: "Work", accent: "#93C5FD", albumColor: "#06101e" }],
  "Pink Sweat$":        [{ song: "At My Worst", accent: "#FCA5A5", albumColor: "#1a0808" }],
  "UMI":                [{ song: "Love Affair", accent: "#6EE7B7", albumColor: "#031410" }],
  "Masego":             [{ song: "Tadow", accent: "#FDE68A", albumColor: "#1a1200" }],
  "KIRBY":              [{ song: "Die With U", accent: "#DDD6FE", albumColor: "#100e20" }],
  "Raveena":            [{ song: "Stronger", accent: "#FBCFE8", albumColor: "#1a0812" }],
  "Sudan Archives":     [{ song: "Selfish Soul", accent: "#FED7AA", albumColor: "#1a0e04" }],
  "FKA twigs":          [{ song: "Two Weeks", accent: "#F0ABFC", albumColor: "#1a0418" }],
  "James Blake":        [{ song: "Retrograde", accent: "#A5F3FC", albumColor: "#031418" }],
  "Moses Sumney":       [{ song: "Quarrel", accent: "#D9F99D", albumColor: "#0c1004" }],
  "Caroline Polachek":  [{ song: "So Hot You're Hurting My Feelings", accent: "#FEF08A", albumColor: "#1a1600" }],
};

// Flat song pool used by generateUsers — each entry has a real song + artist
const SONG_POOL = (() => {
  const list = [];
  Object.entries(ARTIST_SONG_POOL).forEach(([artistName, songs]) => {
    songs.forEach((s) => {
      list.push({
        title: s.song,
        artist: artistName,
        accent: s.accent,
        albumColor: s.albumColor,
        trackKey: _trackKey(s.song, artistName),
      });
    });
  });
  return list;
})();

// All tracks list for bulk artwork pre-fetch (same shape as PostCard's EXPAND_ALL_TRACKS)
const ALL_TRACKS = SONG_POOL.map((s) => ({ songName: s.title, artistName: s.artist }));

// Default fallback thread titles used when no real cachedPosts are available
const DEFAULT_THREAD_TITLES = [
  { id: null, title: "What song has been living in your head rent free?" },
  { id: null, title: "Underrated albums from the last 5 years?" },
  { id: null, title: "Songs that feel like driving at 2am" },
  { id: null, title: "Best opening tracks of all time?" },
  { id: null, title: "Music that changed your life" },
  { id: null, title: "Songs you accidentally memorised without trying" },
  { id: null, title: "What's your go-to comfort album?" },
  { id: null, title: "Recommend me something I've never heard of" },
  { id: null, title: "Artists who peaked on their debut?" },
  { id: null, title: "Songs that sound happy but are actually sad" },
];

const RenderStars = ({ count, size = 16 }) => {
  const displayCount = Math.min(count, 4);
  const overflow = count > 4 ? count - 4 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {Array.from({ length: displayCount }).map((_, i) => (
        <StarIcon key={i} size={size} />
      ))}
      {overflow > 0 && (
        <span style={{ fontSize: 13, color: "#a5b4fc", marginLeft: 2, fontWeight: 800 }}>
          +{overflow}
        </span>
      )}
    </div>
  );
};

const NAMES = Array.from({ length: 24 }, (_, i) => `User${1343 + i}`);

const getRightPanelUsername = (name, id) =>
  `${String(name || "user").replace(/\s+/g, "").toLowerCase()}${(hashString(`${name}-${id}`) % 900) + 100}`;

const buildRightPanelUser = (user) => {
  const safeName = String(user?.name || "User");
  const safeId = user?.id ?? safeName;
  const seed = hashString(`${safeName}-${safeId}`);
  const avatar = getAvatarSrc({
    id: `right-panel-${safeId}`,
    author: safeName,
  });

  return {
    displayName: safeName,
    username: getRightPanelUsername(safeName, safeId),
    name: safeName,
    avatar,
    following: 100 + (seed % 700),
    followers: 200 + ((seed * 7) % 4800),
  };
};

const generateUsers = (count, threadPosts = []) => {
  const threads = threadPosts.length > 0 ? threadPosts : DEFAULT_THREAD_TITLES;

  const getStars = (seed) => {
    const rand = ((seed * 9301 + 49297) % 233280) / 233280;
    if (rand < 0.35) return 1;
    if (rand < 0.55) return 2;
    if (rand < 0.72) return 3;
    if (rand < 0.96) return 4;
    return 4;
  };

  return Array.from({ length: count })
    .map((_, i) => {
      const name = NAMES[i % NAMES.length];
      const starCount = getStars(i * 13 + 7);
      // Generate songs for this user (one per star), each with a thread reference
      const songs = [];
      for (let s = 0; s < starCount; s++) {
        const base = SONG_POOL[(i * 3 + s * 7) % SONG_POOL.length];
        const thread = threads[(i * 3 + s * 5) % threads.length];
        songs.push({
          ...base,
          threadTitle: thread.title || "Untitled Thread",
          postId: thread.id || null,
        });
      }
      return {
        id: i,
        name,
        volume: 400 + Math.floor(((i * 7919 + 104729) % 2801)),
        stars: starCount,
        likes: 100 + Math.floor(((i * 6271 + 37123) % 301)),
        hue: (i * 35 + 180) % 360,
        songs,
      };
    })
    .sort((a, b) => (b.stars !== a.stars ? b.stars - a.stars : b.likes - a.likes));
};

/* =========================
   Song Carousel
========================= */
const SongCarousel = ({ songs, onNavigateToThread, albumArtworks = {} }) => {
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState(0);
  const [hoveredThread, setHoveredThread] = useState(false);

  // Keep idx in bounds if songs array changes
  const safeIdx = Math.min(idx, songs.length - 1);
  const safeSong = songs[safeIdx];

  const go = (dir) => {
    if (animating || songs.length <= 1) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setIdx((prev) => (prev + dir + songs.length) % songs.length);
      setAnimating(false);
    }, 180);
  };

  const handleThreadClick = (e) => {
    e.stopPropagation();
    if (safeSong.postId && typeof onNavigateToThread === "function") {
      onNavigateToThread(safeSong.postId);
    }
  };

  const artworkUrl = albumArtworks[safeSong.trackKey]?.artworkUrl || null;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: 14,
        padding: "14px 16px",
        marginTop: 8,
      }}
    >
      {/* Main song row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Album art */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            flexShrink: 0,
            background: safeSong.albumColor || `linear-gradient(135deg, hsl(${(safeIdx * 55 + 140) % 360}, 65%, 50%), hsl(${(safeIdx * 55 + 180) % 360}, 65%, 30%))`,
            position: "relative",
            overflow: "hidden",
            boxShadow: artworkUrl
              ? `0 4px 12px rgba(0,0,0,0.4)`
              : `0 4px 12px ${safeSong.accent || "#a5b4fc"}40`,
            transform: animating ? "scale(0.92)" : "scale(1)",
            transition: "transform 0.18s ease",
          }}
        >
          {artworkUrl && (
            <img
              src={artworkUrl}
              alt={`${safeSong.title} artwork`}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          {/* Play icon overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: artworkUrl ? "rgba(0,0,0,0.3)" : "transparent",
            }}
          >
            <PlayIcon size={14} />
          </div>
        </div>

        {/* Song info */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            transform: animating ? `translateX(${direction * -16}px)` : "translateX(0)",
            opacity: animating ? 0 : 1,
            transition: "all 0.18s ease",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "0.01em",
            }}
          >
            {safeSong.title}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
            {safeSong.artist}
          </div>

          {/* Thread title link */}
          {safeSong.threadTitle && (
            <button
              onClick={handleThreadClick}
              onMouseEnter={() => setHoveredThread(true)}
              onMouseLeave={() => setHoveredThread(false)}
              style={{
                marginTop: 6,
                background: "none",
                border: "none",
                padding: 0,
                cursor: safeSong.postId ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: 4,
                maxWidth: "100%",
              }}
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: hoveredThread && safeSong.postId ? "#a5b4fc" : "rgba(165,180,252,0.55)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 140,
                  textDecoration: hoveredThread && safeSong.postId ? "underline" : "none",
                  transition: "color 0.15s",
                }}
              >
                {safeSong.threadTitle}
              </span>
            </button>
          )}
        </div>

        {/* Navigation arrows */}
        {songs.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.7)",
                fontSize: 15,
                fontWeight: 700,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            >
              ←
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); go(1); }}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.7)",
                fontSize: 15,
                fontWeight: 700,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================
   Component
========================= */
export default function RightPanel({
  feedLoaded = false,
  coordinates = { x: 50, y: 50 },
  genres = [],
  artists = [],
  onLoadGenreFeed,
  cachedPosts = [],
  onNavigateToThread,
  onUserClick,
}) {
  const PANEL_WIDTH = 420;
  const COLLAPSED_USER_COUNT = 10;

  const [expandedUsers, setExpandedUsers] = useState(false);
  const [likedUsers, setLikedUsers] = useState(() => new Set());
  const [hoveredGenre, setHoveredGenre] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [albumArtworks, setAlbumArtworks] = useState({});

  // Load real album artworks from the cache (same call PostCard makes)
  useEffect(() => {
    let mounted = true;
    getAppleMusicAlbumArtworks(ALL_TRACKS)
      .then((artworks) => {
        if (mounted && artworks) setAlbumArtworks(artworks);
      })
      .catch((err) => console.error("RightPanel: failed to load album artworks", err));
    return () => { mounted = false; };
  }, []);

  // Build thread list from cachedPosts (same logic as HomeTikTokModal – take first 10 real posts)
  const threadPosts = useMemo(() => {
    const eligible = (cachedPosts || []).filter(p => {
      const t = String(p?.postType || "").toLowerCase();
      return t !== "parameter" && t !== "news" && t !== "groupchat" && !String(p?.id || "").includes("parameter");
    });
    return eligible.slice(0, 10).map(p => ({ id: p.id, title: p.title || "Untitled Thread" }));
  }, [cachedPosts]);

  const allUsers = useMemo(() => generateUsers(50, threadPosts), [threadPosts]);
  const displayUsers = expandedUsers ? allUsers : allUsers.slice(0, COLLAPSED_USER_COUNT);

  const defaultGenres = [
    { name: "Lo-Fi", percentage: 41, color: "#f59e0b", liveUsers: "14.2K" },
    { name: "Afrobeat", percentage: 26, color: "#22c55e", liveUsers: "8.7K" },
    { name: "Synth-Pop", percentage: 16, color: "#ef4444", liveUsers: "21.3K" },
    { name: "Electronic", percentage: 8, color: "#3b82f6", liveUsers: "6.1K" },
  ];

  const defaultArtists = [
    { name: "Mac Miller", genre: "Lo-Fi", recommendations: 1863 },
    { name: "Radiohead", genre: "Electronic", recommendations: 2226 },
    { name: "Kendrick Lamar", genre: "Afrobeat", recommendations: 1863 },
    { name: "The Strokes", genre: "Synth-Pop", recommendations: 2226 },
    { name: "Arctic Monkeys", genre: "Electronic", recommendations: 2589 },
  ];

  const safeGenres = (genres && genres.length ? genres : defaultGenres).slice(0, 6);
  const safeArtists = (artists && artists.length ? artists : defaultArtists).slice(0, 8);
  const cachedArtistsWithImages = useMemo(() => {
    const sourceList = cachedArtistImages && typeof cachedArtistImages === "object"
      ? Object.values(cachedArtistImages)
      : [];

    return sourceList
      .map((entry) => ({
        name: String(entry?.artistName || entry?.requestName || "").trim(),
        imageUrl: String(entry?.imageUrl || "").trim(),
      }))
      .filter((entry) => entry.name && hasUsableArtistImage(entry.imageUrl));
  }, []);

  const cachedArtistByName = useMemo(() => {
    const lookup = new Map();
    cachedArtistsWithImages.forEach((entry) => {
      lookup.set(normalizeArtistName(entry.name), entry);
    });
    return lookup;
  }, [cachedArtistsWithImages]);

  const topArtistsWithImages = useMemo(() => {
    const usedCachedArtistNames = new Set();
    let fallbackIndex = 0;

    const takeFallbackArtist = () => {
      while (fallbackIndex < cachedArtistsWithImages.length) {
        const candidate = cachedArtistsWithImages[fallbackIndex++];
        const normalizedCandidateName = normalizeArtistName(candidate.name);
        if (usedCachedArtistNames.has(normalizedCandidateName)) continue;
        usedCachedArtistNames.add(normalizedCandidateName);
        return candidate;
      }
      return null;
    };

    return safeArtists.map((artist) => {
      const normalizedSourceName = normalizeArtistName(artist?.name);
      const exactCachedMatch = cachedArtistByName.get(normalizedSourceName);
      const fallbackCachedMatch = exactCachedMatch ? null : takeFallbackArtist();
      const chosenCachedArtist = exactCachedMatch || fallbackCachedMatch;

      if (exactCachedMatch) {
        usedCachedArtistNames.add(normalizedSourceName);
      }

      if (!chosenCachedArtist) {
        if (cachedArtistsWithImages.length > 0) {
          const recycled = cachedArtistsWithImages[fallbackIndex % cachedArtistsWithImages.length];
          fallbackIndex += 1;
          return {
            ...artist,
            name: recycled.name,
            imageUrl: recycled.imageUrl,
          };
        }
        return { ...artist, imageUrl: "" };
      }

      return {
        ...artist,
        name: chosenCachedArtist.name,
        imageUrl: chosenCachedArtist.imageUrl,
      };
    });
  }, [safeArtists, cachedArtistByName, cachedArtistsWithImages]);

  const totalPct = safeGenres.reduce((acc, g) => acc + (Number(g.percentage) || 0), 0) || 1;

  const handleGenreClick = (genreName) => {
    if (typeof onLoadGenreFeed === "function") onLoadGenreFeed(genreName);
  };

  const toggleLike = (userId, e) => {
    e.stopPropagation();
    setLikedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleExpandUser = (userId) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  };

  return (
    <div
      style={{
        width: PANEL_WIDTH,
        flexShrink: 0,
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: "rgba(15, 20, 30, 0.9)",
        backdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 32px -8px rgba(0,0,0,0.4)",
        maxHeight: "calc(100vh - 40px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Title */}
      <div
        style={{
          padding: "18px 20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "0.2px" }}>
          Feed stats at ({coordinates?.x ?? 50},{coordinates?.y ?? 50})
        </div>
      </div>

      {!feedLoaded ? (
        <div style={{ padding: "54px 20px", textAlign: "center" }}>
          <div style={{ marginBottom: 12, opacity: 0.3 }}>
            <StarIcon size={36} />
          </div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, fontWeight: 700 }}>
            Load a feed to see
            <br />
            recommendations
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {/* Genres */}
          <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 14,
                fontWeight: 700,
              }}
            >
              Genres
            </div>

            {/* Combined bar */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  height: 10,
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                {safeGenres.map((g, i) => (
                  <div
                    key={`${g.name}-${i}`}
                    onMouseEnter={() => setHoveredGenre(g.name)}
                    onMouseLeave={() => setHoveredGenre(null)}
                    onClick={() => handleGenreClick(g.name)}
                    style={{
                      width: `${((Number(g.percentage) || 0) / totalPct) * 100}%`,
                      background: g.color,
                      cursor: "pointer",
                      transform: hoveredGenre === g.name ? "scaleY(1.35)" : "scaleY(1)",
                      transformOrigin: "center",
                      filter: hoveredGenre === g.name ? "brightness(1.15)" : "brightness(1)",
                      transition: "transform 0.15s, filter 0.15s",
                    }}
                  />
                ))}
              </div>
            </div>

            {safeGenres.map((g, i) => (
              <div
                key={`${g.name}-row-${i}`}
                onMouseEnter={() => setHoveredGenre(g.name)}
                onMouseLeave={() => setHoveredGenre(null)}
                onClick={() => handleGenreClick(g.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  cursor: "pointer",
                  borderBottom: i < safeGenres.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 3, height: 20, borderRadius: 999, background: g.color }} />
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: hoveredGenre === g.name ? g.color : "#fff",
                      transition: "color 0.15s",
                    }}
                  >
                    {hoveredGenre === g.name ? `Focus on ${g.name}` : g.name}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 999, background: "#22c55e" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#22c55e" }}>{g.liveUsers}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top Picks — Clean Grid Design */}
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ padding: "14px 20px 10px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.45)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontWeight: 700,
                    }}
                  >
                    Top Picks
                  </div>
                  <InfoIconModal
                    title="Top Picks"
                    iconSize={14}
                    showButtonText={false}
                    steps={[
                      {
                        title: "Top Picks",
                        content:
                          "As users add song previews within threads in this feed, if one of their recommendations does really well, they gain a star and show up in the top picks.\n\nThis way after we land on a feed, we can listen to the best recommended songs in this location.\n\nThis also puts users in the limelight, gaining them more followers, volume and genre points.",
                      },
                    ]}
                  />
                </div>

                <button
                  onClick={() => setExpandedUsers((s) => !s)}
                  aria-label={expandedUsers ? "Collapse top picks" : "Expand top picks"}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.65)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 2,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.9)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
                >
                  <ChevronIcon size={16} down={!expandedUsers} />
                </button>
              </div>
            </div>

            {/* User list with fade on last item when collapsed */}
            <div style={{ position: "relative" }}>
              {displayUsers.map((u, index) => {
                const isLiked = likedUsers.has(u.id);
                const isExpanded = expandedUserId === u.id;
                const isLastCollapsed =
                  !expandedUsers && index === COLLAPSED_USER_COUNT - 1;
                const rightPanelUser = buildRightPanelUser(u);

                return (
                  <div key={u.id}>
                  <div
                      onClick={() => toggleExpandUser(u.id)}
                      style={{
                        padding: "10px 20px",
                        borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        background: isExpanded
                          ? "rgba(165, 180, 252, 0.04)"
                          : "transparent",
                        opacity: isLastCollapsed ? 0.35 : 1,
                        maskImage: isLastCollapsed
                          ? "linear-gradient(to bottom, black 0%, transparent 100%)"
                          : "none",
                        WebkitMaskImage: isLastCollapsed
                          ? "linear-gradient(to bottom, black 0%, transparent 100%)"
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = isExpanded ? "rgba(165, 180, 252, 0.04)" : "transparent";
                      }}
                    >
                      {/* Top row: avatar + name/volume + (collapsed: stars pill) + chevron */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Avatar */}
                        <div
                          style={{ flexShrink: 0, lineHeight: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ClickableUserAvatar
                            user={rightPanelUser}
                            avatarSrc={rightPanelUser.avatar}
                            size={40}
                            onUserClick={onUserClick}
                          />
                        </div>

                        {/* Name + volume + (collapsed: likes underneath) */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#e2e8f0",
                                letterSpacing: "0.01em",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {u.name}
                            </span>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                color: "#22c55e",
                                fontSize: 13,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              <VolumeIcon size={11} />
                              {u.volume}
                            </span>
                          </div>

                          {/* Collapsed only: likes below name */}
                          {!isExpanded && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                              <button
                                onClick={(e) => toggleLike(u.id, e)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <HeartIcon size={12} filled={isLiked} />
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: isLiked ? "#ff6b9d" : "rgba(255,255,255,0.4)",
                                  }}
                                >
                                  {u.likes + (isLiked ? 1 : 0)}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Collapsed only: stars pill on right */}
                        {!isExpanded && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              padding: "5px 8px",
                              background: "rgba(165, 180, 252, 0.08)",
                              borderRadius: 8,
                            }}
                          >
                            <RenderStars count={u.stars} size={15} />
                          </div>
                        )}

                        {/* Expand chevron */}
                        <ChevronIcon size={14} down={!isExpanded} />
                      </div>

                      {/* Expanded only: stars LEFT + likes RIGHT on a shared second row */}
                      {isExpanded && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 10,
                          }}
                        >
                          {/* Stars — left side, no pill background */}
                          <RenderStars count={u.stars} size={15} />

                          {/* Likes — right side */}
                          <button
                            onClick={(e) => toggleLike(u.id, e)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <HeartIcon size={14} filled={isLiked} />
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: isLiked ? "#ff6b9d" : "rgba(255,255,255,0.4)",
                              }}
                            >
                              {u.likes + (isLiked ? 1 : 0)}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expanded Song Carousel */}
                    <div
                      style={{
                        maxHeight: isExpanded ? 180 : 0,
                        overflow: "hidden",
                        background: isExpanded ? "rgba(165, 180, 252, 0.04)" : "transparent",
                        borderBottom: isExpanded ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      <div style={{ padding: "0 20px 10px 20px" }}>
                        <SongCarousel songs={u.songs} onNavigateToThread={onNavigateToThread} albumArtworks={albumArtworks} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Gradient overlay on bottom when collapsed */}
              {!expandedUsers && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 60,
                    background: "linear-gradient(to top, rgba(15, 20, 30, 0.95) 0%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>

            <button
              onClick={() => setExpandedUsers((s) => !s)}
              style={{
                width: "100%",
                padding: "12px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                color: "rgba(255,255,255,0.45)",
                position: "relative",
                zIndex: 2,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            >
              {expandedUsers
                ? "↑ collapse"
                : `↓ +${Math.max(0, allUsers.length - COLLAPSED_USER_COUNT)} more`}
            </button>
          </div>

          {/* Top Artists */}
          <div style={{ padding: "16px 20px 18px" }}>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 10,
                fontWeight: 700,
              }}
            >
              Top Artists
            </div>

            {topArtistsWithImages.map((a, i) => (
              <div
                key={`${a.name}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: i < topArtistsWithImages.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {a.imageUrl ? (
                    <img
                      src={a.imageUrl}
                      alt={`${a.name} profile`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, hsl(${(i * 45 + 200) % 360}, 60%, 50%), hsl(${(i * 45 + 240) % 360}, 60%, 40%))`,
                      }}
                    />
                  )}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{a.genre}</div>
                  </div>
                </div>

                <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>
                  {Number(a.recommendations || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
