import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfoIconModal from "./InfoIconModal";
import SimpleTunerDial from "./SimpleTunerDial";

const padSigned4 = (n) => {
  const num = Number.isFinite(Number(n)) ? Number(n) : 0;
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  return `${sign}${String(abs).padStart(4, "0")}`;
};

const formatFreq = (n) => {
  const num = Number.isFinite(Number(n)) ? Number(n) : 0;
  const sign = num < 0 ? "-" : "";
  return `${sign}${Math.abs(num)}`;
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const randomIntInRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const normalizePreviewArtist = (artist, index = 0) => {
  const name = String(artist?.name || "").trim();
  if (!name) return null;

  return {
    id:
      artist?.roomArtistKey ||
      artist?.id ||
      `${name.toLowerCase().replace(/\s+/g, "-")}-${index}`,
    name,
    image: artist?.image || artist?.imageUrl || artist?.artworkUrl || artist?.picture || artist?.img || "",
    barsPct:
      Number.isFinite(Number(artist?.volume))
        ? clamp(Math.round((Number(artist.volume) / 6) * 100), 0, 100)
        : randomIntInRange(25, 100),
  };
};

const hasValidImageUrl = (url) =>
  typeof url === "string" &&
  url.startsWith("http") &&
  !url.includes("placeholder") &&
  !url.includes("picsum");

const hueFromName = (name) => {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
};

const getInitials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const MusicNoteIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M9 18V5l12-2v13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6" cy="18" r="3" strokeWidth="2" />
    <circle cx="18" cy="16" r="3" strokeWidth="2" />
  </svg>
);

const TunerInfoIcon = ({ size = 20, color = "#FFA500" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <path d="M12 12L17 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.9" fill={color} />
    <path d="M6.5 16.5L8.5 14.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const RadarInfoIcon = ({ size = 20, color = "#FFA500" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <circle cx="12" cy="12" r="5.5" stroke={color} strokeWidth="1.5" opacity="0.9" />
    <circle cx="12" cy="12" r="2" fill={color} />
    <circle cx="16.5" cy="8" r="1.3" fill={color} />
  </svg>
);

const SnippetInfoIcon = ({ size = 20, color = "#FFA500" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 14V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 16V8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 18V6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M15 15V9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M18 13V11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.4" opacity="0.65" />
  </svg>
);

const ExpandCollapseIcon = ({ isExpanded }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`playing-bottom-dock__chevron ${isExpanded ? "is-expanded" : ""}`}
    style={isExpanded ? undefined : { transform: "rotate(180deg)" }}
  >
    <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Volume Bar Icon Component - 4 bars that match the arc progress
const VolumeIcon = ({ volume, color = "#60a5fa", size = 14 }) => {
  const activeBars = Math.ceil((volume / 100) * 4);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: size }}>
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          style={{
            width: Math.max(2, size / 5),
            height: `${20 + bar * 20}%`,
            borderRadius: 1,
            background: bar <= activeBars ? color : "rgba(255,255,255,0.2)",
            transition: "background 0.3s ease"
          }}
        />
      ))}
    </div>
  );
};

const SwipeIndicators = ({ type, counts = {}, userVote }) => {
  const baseColor = type === "left" ? "text-red-400" : "text-green-400";
  const highlightColor = "text-white";

  const safeCounts = {
    1: counts?.[1] || 0,
    2: counts?.[2] || 0,
    3: counts?.[3] || 0,
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center ${userVote === 1 ? highlightColor : baseColor} ${
          userVote === 1 ? "font-bold" : ""
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 ${userVote === 1 ? "drop-shadow-lg" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          {type === "left" ? (
            <path d="M5 12L10 7M5 12L10 17" />
          ) : (
            <path d="M19 12L14 7M19 12L14 17" />
          )}
        </svg>
        <span className={`text-sm ml-1 ${userVote === 1 ? "font-bold" : ""}`}>
          {safeCounts[1]}
        </span>
      </div>

      <div
        className={`flex items-center ${userVote === 2 ? highlightColor : baseColor} ${
          userVote === 2 ? "font-bold" : ""
        }`}
      >
        <svg
          viewBox="0 0 28 24"
          className={`w-7 h-5 ${userVote === 2 ? "drop-shadow-lg" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          {type === "left" ? (
            <>
              <path d="M5 12L10 7M5 12L10 17" />
              <path d="M13 12L18 7M13 12L18 17" />
            </>
          ) : (
            <>
              <path d="M20 12L15 7M20 12L15 17" />
              <path d="M12 12L7 7M12 12L7 17" />
            </>
          )}
        </svg>
        <span className={`text-sm ml-1 ${userVote === 2 ? "font-bold" : ""}`}>
          {safeCounts[2]}
        </span>
      </div>

      <div
        className={`flex items-center ${userVote === 3 ? highlightColor : baseColor} ${
          userVote === 3 ? "font-bold" : ""
        }`}
      >
        <svg
          viewBox="0 0 36 24"
          className={`w-8 h-5 ${userVote === 3 ? "drop-shadow-lg" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          {type === "left" ? (
            <>
              <path d="M5 12L10 7M5 12L10 17" />
              <path d="M13 12L18 7M13 12L18 17" />
              <path d="M21 12L26 7M21 12L26 17" />
            </>
          ) : (
            <>
              <path d="M23 12L18 7M23 12L18 17" />
              <path d="M15 12L10 7M15 12L10 17" />
              <path d="M7 12L2 7M7 12L2 17" />
            </>
          )}
        </svg>
        <span className={`text-sm ml-1 ${userVote === 3 ? "font-bold" : ""}`}>
          {safeCounts[3]}
        </span>
      </div>
    </div>
  );
};

// Glassmorphic Artist Card for Radar ribbon
const ArtistCard = ({ name, image, volume = 50, count = 0, accentColor = "#60a5fa" }) => {
  const initials = getInitials(name);
  const hue = hueFromName(name);
  const pct = volume / 100;

  return (
    <div className="playing-top__artist-card" style={{
      "--card-hue": hue,
    }}>
      {/* Volume bar at top of card */}
      <div className="playing-top__artist-card-volbar">
        <div
          className="playing-top__artist-card-volbar-fill"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      {/* Avatar */}
      <div className="playing-top__artist-card-avatar">
        {hasValidImageUrl(image) ? (
          <img className="playing-top__artist-card-img" src={image} alt={name || "Artist"} />
        ) : (
          <div className="playing-top__artist-card-initials">
            {initials || "?"}
          </div>
        )}
        <div className="playing-top__artist-card-count">
          {count}
        </div>
      </div>

      {/* Name */}
      <span className="playing-top__artist-card-name" title={name}>
        {name || "Unknown"}
      </span>
    </div>
  );
};

const RadarGrid = ({ artists, accentColor }) => {
  return (
    <div className="playing-top__radar-scroll">
      <div className="playing-top__radar-ribbon">
        {artists.map((a, idx) => (
          <ArtistCard
            key={a.radarKey || a.roomArtistKey || a.id || `${a.name}-${idx}`}
            name={a.name}
            image={a.image}
            volume={a.volume ?? 50}
            count={a.rightSwipes ?? 0}
            accentColor={accentColor}
          />
        ))}
      </div>
      {artists.length === 0 && (
        <div className="playing-top__empty">
          No artists yet. (Pool will populate this.)
        </div>
      )}
    </div>
  );
};

const YourPicks = ({ picks }) => {
  const isEmpty = picks.length === 0;

  return (
    <div className={`playing-top__picks-scroll${isEmpty ? " is-empty" : ""}`}>
      {isEmpty ? (
        <div className="playing-top__empty">
          No picks yet — songs you add from the Widget will show up here.
        </div>
      ) : (
        <div className="playing-top__picks-list">
          {picks.map((song, index) => (
            <div key={`${song.id}-${index}`} className="song-card-design3">
              <div className="song-icon">
                {song.artworkUrl || song.image ? (
                  <img
                    src={song.artworkUrl || song.image}
                    alt={`${song.track} by ${song.artist}`}
                    className="song-icon-img"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}

                <div
                  className="song-icon-fallback"
                  style={{
                    display: song.artworkUrl || song.image ? "none" : "flex",
                  }}
                >
                  <MusicNoteIcon width={18} height={18} className="text-gray-400" />
                </div>
              </div>

              <div className="song-info">
                <h4 className="song-title">{song.track || song.title}</h4>
                <p className="song-artist">{song.artist}</p>
              </div>

              <div className="song-recommender-compact" title="Added by Me">
                <div className="song-recommender-compact__avatar">
                  {song.recommendedBy?.avatar ? (
                    <img
                      src={song.recommendedBy.avatar}
                      alt="Me"
                      className="song-recommender-compact__avatar-img"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="song-recommender-compact__avatar-fallback"
                    style={{ display: song.recommendedBy?.avatar ? "none" : "flex" }}
                  >
                    M
                  </div>
                </div>
                <span className="song-recommender-compact__name">Me</span>
              </div>

              <div className="middle-section">
                <div className="by-label">By:</div>
                <div className="user-container">
                  <div className="user-avatar">
                    {song.recommendedBy?.avatar ? (
                      <img
                        src={song.recommendedBy.avatar}
                        alt={song.recommendedBy?.username || "Me"}
                        className="user-avatar-img"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="user-avatar-fallback"
                      style={{ display: song.recommendedBy?.avatar ? "none" : "flex" }}
                    >
                      {(song.recommendedBy?.username || "Me")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  </div>
                  <div className="user-name">
                    {song.recommendedBy?.username || "Me"}
                  </div>
                </div>
              </div>

              <div className="indicators-container">
                <SwipeIndicators
                  type="left"
                  counts={song.leftCounts || { 1: 0, 2: 0, 3: 0 }}
                  userVote={
                    song.userVoteDirection === "left"
                      ? song.userVoteStrength
                      : null
                  }
                />

                <div className="separator"></div>

                <SwipeIndicators
                  type="right"
                  counts={song.rightCounts || { 1: 0, 2: 0, 3: 0 }}
                  userVote={
                    song.userVoteDirection === "right"
                      ? song.userVoteStrength
                      : null
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TabButton = ({
  active,
  onClick,
  label,
  infoId,
  infoTitle,
  infoText,
  infoIcon = null,
  showInfo = true,
  tabKey,
  tabRef = null,
  onMovePrevious = null,
  onMoveNext = null,
  onMoveFirst = null,
  onMoveLast = null,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onMovePrevious?.();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      onMoveNext?.();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      onMoveFirst?.();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      onMoveLast?.();
    }
  };

  return (
    <div
      ref={tabRef}
      className={`playing-top__tab ${active ? "is-active" : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      id={`playing-top-tab-${tabKey}`}
      role="tab"
      tabIndex={active ? 0 : -1}
      aria-selected={active}
      aria-controls={`playing-top-panel-${tabKey}`}
    >
      <span className="playing-top__tab-label">{label}</span>
      {showInfo && (
        <span
          className="playing-top__tab-info"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <InfoIconModal
            title={infoTitle}
            modalId={infoId}
            steps={[
              {
                icon: infoIcon || undefined,
                title: infoTitle,
                content: infoText,
              },
            ]}
            iconSize={14}
            iconColor="#FFA500"
            showButtonText={false}
            sidePanel={true}
          />
        </span>
      )}
    </div>
  );
};

const VALID_TOP_TABS = ["tuner", "radar", "yourPicks"];

export default function PlayingTopComponent({
  onBack = null,
  onResetToSelection = null,
  onNextRoom = () => {},
  roomName = "----",
  volume = 0,
  similarity = 0,
  roomUsers = 0,
  roomMinutes = 30,
  roomDuration = 40,

  activeTab = "tuner",
  setActiveTab = () => {},
  isExpanded = true,
  onToggleExpand = () => {},

  roomArtists = [],
  poolArtists = [],
  previewArtistPool = [],
  yourPicks = [],
  previewRooms = [],
  previewRoomsLoading = false,
  onEnterPreviewRoom = () => {},

  tunerVolume = 0,
  tunerSimilarity = 0,
  onTunerVolumeChange = () => {},
  onTunerSimilarityChange = () => {},
  isMobileView = false,
}) {
  const PREVIEW_SWAP_MS = 110;
  const PREVIEW_ENTER_MS = 140;
  const PREVIEW_CLOSE_MS = 140;
  const accentColor = "#60a5fa";
  const [isTunerModalOpen, setIsTunerModalOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewShuffleToken, setPreviewShuffleToken] = useState(0);
  const resolvedActiveTab = VALID_TOP_TABS.includes(activeTab) ? activeTab : "tuner";

  // On PlayingScreen: header should always show the real room numbers.
  // Tuner values only change inside the dial + preview modal.
  const displayedVolume = volume;
  const displayedSimilarity = similarity;
  const [shufflePhase, setShufflePhase] = useState(null);
  const [isClosingPreview, setIsClosingPreview] = useState(false);

  // Drag support for modal
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const dragListenersRef = useRef({ moveHandler: null, endHandler: null });
  const enterPreviewTimerRef = useRef(null);
  const topTabRefs = useRef({});
  const previewTransitionRef = useRef({
    swapTimer: null,
    settleTimer: null,
    rafId: null,
  });

  const clearPreviewTransition = useCallback(() => {
    const transitionState = previewTransitionRef.current;

    if (transitionState.swapTimer) {
      window.clearTimeout(transitionState.swapTimer);
      transitionState.swapTimer = null;
    }

    if (transitionState.settleTimer) {
      window.clearTimeout(transitionState.settleTimer);
      transitionState.settleTimer = null;
    }

    if (transitionState.rafId) {
      window.cancelAnimationFrame(transitionState.rafId);
      transitionState.rafId = null;
    }
  }, []);

  const clearEnterPreviewTimer = useCallback(() => {
    if (enterPreviewTimerRef.current) {
      window.clearTimeout(enterPreviewTimerRef.current);
      enterPreviewTimerRef.current = null;
    }
  }, []);

  const clearDragListeners = useCallback(() => {
    const { moveHandler, endHandler } = dragListenersRef.current;
    if (moveHandler) {
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("touchmove", moveHandler);
    }
    if (endHandler) {
      window.removeEventListener("mouseup", endHandler);
      window.removeEventListener("touchend", endHandler);
    }
    dragListenersRef.current = { moveHandler: null, endHandler: null };
  }, []);

  const focusTopTab = useCallback((tab) => {
    const tabNode = topTabRefs.current[tab];
    if (tabNode && typeof tabNode.focus === "function") {
      tabNode.focus();
    }
  }, []);

  const requestTopTabFocus = useCallback((tab) => {
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => focusTopTab(tab));
      return;
    }
    focusTopTab(tab);
  }, [focusTopTab]);

  useEffect(() => {
    if (activeTab === resolvedActiveTab) return;
    setActiveTab(resolvedActiveTab);
  }, [activeTab, resolvedActiveTab, setActiveTab]);

  const handleDragStart = useCallback((e) => {
    if (isMobileView) return;

    clearDragListeners();
    isDragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX, y: clientY, ox: dragOffset.x, oy: dragOffset.y };

    const handleDragMove = (ev) => {
      if (!isDragging.current) return;
      if (ev.type === "touchmove" && ev.cancelable) {
        ev.preventDefault();
      }
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      setDragOffset({
        x: dragStart.current.ox + (cx - dragStart.current.x),
        y: dragStart.current.oy + (cy - dragStart.current.y),
      });
    };

    const handleDragEnd = () => {
      isDragging.current = false;
      clearDragListeners();
    };

    dragListenersRef.current = {
      moveHandler: handleDragMove,
      endHandler: handleDragEnd,
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);
  }, [clearDragListeners, dragOffset, isMobileView]);

  useEffect(() => () => {
    clearPreviewTransition();
    clearEnterPreviewTimer();
    clearDragListeners();
  }, [clearDragListeners, clearEnterPreviewTimer, clearPreviewTransition]);

  useEffect(() => {
    if (previewIndex < previewRooms.length) return;
    setPreviewIndex(0);
  }, [previewIndex, previewRooms.length]);

  const previewRoom = useMemo(() => {
    if (!previewRooms.length) return null;
    return previewRooms[previewIndex] || previewRooms[0] || null;
  }, [previewRooms, previewIndex]);

  const previewRoomName = previewRoom?.name || roomName;
  const previewRoomUsers = previewRoom?.users ?? previewRoom?.userCount ?? previewRoom?.listeners ?? roomUsers;
  const rawPreviewMinutes = Number(previewRoom?.minutes);
  const rawPreviewDuration = Number(previewRoom?.totalMinutes);
  const previewRoomDuration =
    Number.isFinite(rawPreviewDuration) && rawPreviewDuration > 0
      ? Math.round(rawPreviewDuration)
      : roomDuration;
  const previewRoomMinutes = Number.isFinite(rawPreviewMinutes)
    ? clamp(Math.round(rawPreviewMinutes), 0, previewRoomDuration)
    : Math.min(roomMinutes, previewRoomDuration);

  const previewArtists = useMemo(() => {
    const roomSource = Array.isArray(previewRoom?.artists) ? previewRoom.artists : [];
    const extraSource = Array.isArray(previewArtistPool) ? previewArtistPool : [];
    const seenNames = new Set();
    const roomArtistsFirst = [];
    const fallbackArtists = [];

    roomSource.forEach((artist, idx) => {
      const normalized = normalizePreviewArtist(artist, idx);
      if (!normalized) return;
      const key = normalized.name.toLowerCase();
      if (seenNames.has(key)) return;
      seenNames.add(key);
      roomArtistsFirst.push(normalized);
    });

    extraSource.forEach((artist, idx) => {
      const normalized = normalizePreviewArtist(artist, roomSource.length + idx);
      if (!normalized) return;
      const key = normalized.name.toLowerCase();
      if (seenNames.has(key)) return;
      seenNames.add(key);
      fallbackArtists.push(normalized);
    });

    const combinedArtists = [...roomArtistsFirst, ...fallbackArtists];

    return combinedArtists
      .slice(0, 8)
      .map((artist, idx) => {
        const stableId = artist.id || `${artist.name}-${idx}`;
        const picksSeed = hueFromName(`${previewShuffleToken}:${stableId}`);

        return {
          ...artist,
          id: stableId,
          picks: 10 + (picksSeed % 21),
        };
      });
  }, [previewRoom, previewArtistPool, previewShuffleToken]);

  const radarArtists = useMemo(() => {
    const prioritizedArtists = [
      ...(Array.isArray(roomArtists) ? roomArtists : []),
      ...(Array.isArray(poolArtists) ? poolArtists : []),
    ];
    const seen = new Set();
    const uniqueArtists = [];

    prioritizedArtists.forEach((artist) => {
      const key = String(artist?.id || artist?.roomArtistKey || artist?.name || "").trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      uniqueArtists.push(artist);
    });

    return uniqueArtists.slice(0, 18).map((a, idx) => ({
      id: a.id,
      radarKey: a.roomArtistKey || `${a.id || a.name || "artist"}-${idx}`,
      name: a.name,
      image: a.image,
      // Show 1-4 lit bars and a compact room count for radar badges
      volume: ((a.volumeBars ?? (Math.floor(Math.random() * 4) + 1)) / 4) * 100,
      rightSwipes: a.rightSwipes ?? (Math.floor(Math.random() * 29) + 7),
    }));
  }, [poolArtists, roomArtists]);

  const openPreview = () => {
    if (!previewRooms.length && !previewRoomsLoading) return;
    clearEnterPreviewTimer();
    setPreviewIndex(0);
    setPreviewShuffleToken((prev) => prev + 1);
    setIsTunerModalOpen(true);
  };

  const nextPreviewRoom = () => {
    if (shufflePhase || isClosingPreview || previewRooms.length <= 1) return;

    clearPreviewTransition();
    setShufflePhase("out");

    previewTransitionRef.current.swapTimer = window.setTimeout(() => {
      setPreviewIndex((prev) => (prev + 1) % previewRooms.length);
      setPreviewShuffleToken((prev) => prev + 1);
      previewTransitionRef.current.swapTimer = null;

      previewTransitionRef.current.rafId = window.requestAnimationFrame(() => {
        previewTransitionRef.current.rafId = null;
        setShufflePhase("in");

        previewTransitionRef.current.settleTimer = window.setTimeout(() => {
          previewTransitionRef.current.settleTimer = null;
          setShufflePhase(null);
        }, PREVIEW_ENTER_MS);
      });
    }, PREVIEW_SWAP_MS);
  };

  const closePreview = () => {
    clearEnterPreviewTimer();
    clearDragListeners();
    isDragging.current = false;
    clearPreviewTransition();
    setIsTunerModalOpen(false);
    setShufflePhase(null);
    setIsClosingPreview(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const enterPreviewRoom = () => {
    if (isClosingPreview || !previewRoom) return;
    const roomToEnter = previewRoom;
    clearEnterPreviewTimer();
    clearPreviewTransition();
    setIsClosingPreview(true);
    enterPreviewTimerRef.current = window.setTimeout(() => {
      enterPreviewTimerRef.current = null;
      onEnterPreviewRoom(roomToEnter);
      closePreview();
    }, PREVIEW_CLOSE_MS);
  };

  const handleTabClick = (tab) => {
    if (tab === resolvedActiveTab) {
      onToggleExpand(!isExpanded);
      return;
    }

    setActiveTab(tab);
    if (!isExpanded) onToggleExpand(true);
  };

  const handleRelativeTopTabMove = useCallback((fromTab, direction) => {
    const currentIndex = VALID_TOP_TABS.indexOf(fromTab);
    if (currentIndex < 0) return;

    const nextIndex = (currentIndex + direction + VALID_TOP_TABS.length) % VALID_TOP_TABS.length;
    const nextTab = VALID_TOP_TABS[nextIndex];
    setActiveTab(nextTab);
    if (!isExpanded) onToggleExpand(true);
    requestTopTabFocus(nextTab);
  }, [isExpanded, onToggleExpand, requestTopTabFocus, setActiveTab]);

  const handleBoundaryTopTabMove = useCallback((boundary) => {
    const nextTab = boundary === "last"
      ? VALID_TOP_TABS[VALID_TOP_TABS.length - 1]
      : VALID_TOP_TABS[0];
    setActiveTab(nextTab);
    if (!isExpanded) onToggleExpand(true);
    requestTopTabFocus(nextTab);
  }, [isExpanded, onToggleExpand, requestTopTabFocus, setActiveTab]);

  const mobileInfoSteps = useMemo(
    () => [
      {
        icon: <TunerInfoIcon size={20} color="#FFA500" />,
        title: "Top Panel: Tuner",
        content: `Browse other rooms to join while currently in a room.

In the full app, joining a new room probably should not get rid of your recommendations in an old room.

But for this prototype, joining a room starts fresh.`,
      },
      {
        icon: <RadarInfoIcon size={20} color="#FFA500" />,
        title: "Top Panel: Radar",
        content: `The radar shows the top artists in this room.

Their number represents how many users in this room selected that artist in their selection screen.

The bar at their top tells you how well their songs are doing in this room.`,
      },
      {
        icon: <SnippetInfoIcon size={20} color="#FFA500" />,
        title: "Now Playing Snippet",
        content: `This is the main snippet you're rating.

Left/Right goes into the bottom dock tabs.`,
      },
      {
        title: "Bottom Dock Tabs",
        content: `Left: Songs you swiped left on, plus who recommended them and how others rated them.

QL: Top users move up/down as songs get pushed forward/back in the main queue.

Pool: Pick artists to feed the widget. Pool refreshes continuously in the background.

Widget: Use selected artists to search/pick songs and add snippets into the main queue.

Right: Songs you swiped right on, plus who recommended them and how others rated them.`,
      },
    ],
    []
  );

  return (
    <section className="playing-top" style={{ "--top-accent": accentColor }}>
      <div className="playing-top__panel">
        <div className="playing-top__mobile-guide">
          <InfoIconModal
            title="Playing Screen Guide"
            modalId="playing-mobile-guide-modal"
            steps={mobileInfoSteps}
            iconSize={18}
            iconColor="#FFA500"
            showButtonText={false}
            sidePanel={true}
            buttonClassName="playing-top__mobile-guide-button"
            ariaLabel="Open playing screen guide"
          />
        </div>
        <div className="playing-top__header">
          <div className="playing-top__left">
            {(typeof onResetToSelection === "function" || typeof onBack === "function") && (
              <div className="playing-top__nav">
                {typeof onResetToSelection === "function" && (
                  <button
                    type="button"
                    className="playing-top__backbtn playing-top__backbtn--reset"
                    onClick={onResetToSelection}
                    aria-label="Back to selection and clear picks"
                    title="Back to selection"
                  >
                    <span className="playing-top__backbtn-icon playing-top__backbtn-icon--double" aria-hidden="true">‹‹</span>
                  </button>
                )}
                {typeof onBack === "function" && (
                  <button
                    type="button"
                    className="playing-top__backbtn"
                    onClick={onBack}
                  >
                    <span className="playing-top__backbtn-icon" aria-hidden="true">←</span>
                    <span className="playing-top__backbtn-label">Back</span>
                  </button>
                )}
              </div>
            )}
            <div className="playing-top__room-row">
              <div className="playing-top__room">{roomName}</div>
              <div className="playing-top__room-meta">
                <span className="playing-top__room-pill">
                  <span className="playing-top__room-pill-value">{roomUsers}</span>
                  <span className="playing-top__room-pill-label">online</span>
                </span>
                <span className="playing-top__room-pill">
                  <span className="playing-top__room-pill-value">{roomMinutes}m</span>
                  <span className="playing-top__room-pill-label">of {roomDuration}m</span>
                </span>
              </div>
            </div>
          </div>

          <div className="playing-top__right">
            <div className="playing-top__metrics">
              <div className="playing-top__metric">
                <span className="playing-top__metric-main">{padSigned4(displayedVolume)}</span>
                <span className="playing-top__dot">·</span>
                <span className="playing-top__metric-sub">
                  {formatFreq(displayedSimilarity)}
                </span>
              </div>

              <button
                type="button"
                className="playing-bottom-dock__toggle"
                onClick={() => onToggleExpand(!isExpanded)}
                aria-label={isExpanded ? "Collapse top panel" : "Expand top panel"}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                <ExpandCollapseIcon isExpanded={isExpanded} />
              </button>
            </div>
          </div>
        </div>

        <div className="playing-top__tabs" role="tablist" aria-orientation="horizontal" aria-label="Top playing tabs">
          <TabButton
            active={resolvedActiveTab === "tuner"}
            onClick={() => handleTabClick("tuner")}
            tabKey="tuner"
            tabRef={(node) => {
              topTabRefs.current.tuner = node;
            }}
            onMovePrevious={() => handleRelativeTopTabMove("tuner", -1)}
            onMoveNext={() => handleRelativeTopTabMove("tuner", 1)}
            onMoveFirst={() => handleBoundaryTopTabMove("first")}
            onMoveLast={() => handleBoundaryTopTabMove("last")}
            label="TUNER"
            infoId="playing-top-tuner"
            infoTitle="Tuner"
            infoIcon={<TunerInfoIcon size={20} color="#FFA500" />}
            infoText={`Browse other rooms to join while currently in a room.
In the full app, joining a new room probably should not get rid of your recommendations in an old room. But for this prototype, joining a room starts fresh.`}
          />

          <TabButton
            active={resolvedActiveTab === "radar"}
            onClick={() => handleTabClick("radar")}
            tabKey="radar"
            tabRef={(node) => {
              topTabRefs.current.radar = node;
            }}
            onMovePrevious={() => handleRelativeTopTabMove("radar", -1)}
            onMoveNext={() => handleRelativeTopTabMove("radar", 1)}
            onMoveFirst={() => handleBoundaryTopTabMove("first")}
            onMoveLast={() => handleBoundaryTopTabMove("last")}
            label="RADAR"
            infoId="playing-top-radar"
            infoTitle="Radar"
            infoIcon={<RadarInfoIcon size={20} color="#FFA500" />}
            infoText={`The radar shows the top artists in this room.
Their number represents how many users in this room selected that artist in their selection screen.
The bar at their top tells you how well their songs are doing in this room.`}
          />

          <TabButton
            active={resolvedActiveTab === "yourPicks"}
            onClick={() => handleTabClick("yourPicks")}
            tabKey="yourPicks"
            tabRef={(node) => {
              topTabRefs.current.yourPicks = node;
            }}
            onMovePrevious={() => handleRelativeTopTabMove("yourPicks", -1)}
            onMoveNext={() => handleRelativeTopTabMove("yourPicks", 1)}
            onMoveFirst={() => handleBoundaryTopTabMove("first")}
            onMoveLast={() => handleBoundaryTopTabMove("last")}
            label={`YOUR PICKS${yourPicks.length ? ` (${yourPicks.length})` : ""}`}
            showInfo={false}
          />
        </div>

        {isExpanded && (
          <div
            className="playing-top__content"
            id={`playing-top-panel-${resolvedActiveTab}`}
            role="tabpanel"
            aria-labelledby={`playing-top-tab-${resolvedActiveTab}`}
          >
            {resolvedActiveTab === "tuner" ? (
              <div className="playing-top__tuner-wrap">
                <SimpleTunerDial
                  volume={clamp(tunerVolume, 0, 3200)}
                  similarity={clamp(tunerSimilarity, -1000, 1000)}
                  onVolumeChange={onTunerVolumeChange}
                  onSimilarityChange={onTunerSimilarityChange}
                  // second click triggers onCommit inside SimpleTunerDial
                  onCommit={openPreview}
                  showExpandButton={false}
                  // keep the expand button present but no-op for now
                  onExpandClick={() => {}}
                  isExpanded={false}
                  disabled={false}
                  dialLocked={false}
                  size={100}
                  desktopHintText="Click dial to tune"
                  mobileInstructionSteps={[
                    "1) Click dial",
                    "2) Press and hold to tune",
                    "3) Click again to select",
                  ]}
                />
              </div>
            ) : resolvedActiveTab === "radar" ? (
              <RadarGrid artists={radarArtists} accentColor={accentColor} />
            ) : (
              <YourPicks picks={yourPicks} />
            )}
          </div>
        )}
      </div>

      {/* Modal rendered OUTSIDE the panel to avoid overflow:hidden clipping */}
      {isTunerModalOpen && (
        <div
          className="tuner-modal__backdrop"
          onClick={closePreview}
          role="presentation"
        >
          <div
            className="tuner-modal__stack-container"
            ref={dragRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="false"
            aria-label="Tuned Room Preview"
            style={{
              transform: `translate(var(--tuner-modal-anchor-x, 0), var(--tuner-modal-anchor-y, -50%)) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
              transition: isDragging.current ? "none" : "transform 0.15s ease",
            }}
          >
            {/* Drag handle */}
            <div
              className="tuner-modal__drag-handle"
              onMouseDown={isMobileView ? undefined : handleDragStart}
              onTouchStart={isMobileView ? undefined : handleDragStart}
            />
            <div
              className={[
                "tuner-modal__stack",
                shufflePhase === "out" ? "stack-shuffle-out" : "",
                shufflePhase === "in" ? "stack-shuffle-in" : "",
                isClosingPreview ? "stack-closing" : "",
              ].join(" ")}
            >
              {/* back plates (visual only) */}
              <div className="tuner-modal__stack-layer tuner-modal__stack-layer--back" />
              <div className="tuner-modal__stack-layer tuner-modal__stack-layer--mid" />

              {/* main card (interactive) */}
              <div
                className={[
                  "tuner-modal__stack-main",
                  shufflePhase === "out" ? "is-shuffling" : "",
                  shufflePhase === "in" ? "is-entering" : "",
                  isClosingPreview ? "is-closing" : "",
                ].join(" ")}
              >
                {/* Header - also draggable */}
                <div
                  className="tuner-modal__stack-header"
                  onMouseDown={isMobileView ? undefined : handleDragStart}
                  onTouchStart={isMobileView ? undefined : handleDragStart}
                  style={{ cursor: isMobileView ? "default" : "grab" }}
                >
                  <button
                    type="button"
                    className="tuner-modal__stack-close"
                    onClick={closePreview}
                    aria-label="Close"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                  
                  <div className="tuner-modal__stack-room-label">Room</div>
                  <div className="tuner-modal__stack-label">{String(previewRoomName || "").toUpperCase()}</div>
                  <div className="tuner-modal__stack-metrics">
                    <span className="tuner-modal__stack-vol">
                      {padSigned4(previewRoom?.volume ?? tunerVolume)}
                    </span>
                    <span className="tuner-modal__stack-dot">·</span>
                    <span className="tuner-modal__stack-freq">
                      {formatFreq(previewRoom?.similarity ?? tunerSimilarity)}
                    </span>
                  </div>
                </div>
                
                {/* Artist List Rows */}
                {(() => {
                  const sorted = previewArtists;
                  const showLoadingState = previewRoomsLoading && !sorted.length;

                  return (
                    <>
                      <div className="tuner-modal__bubble-info">
                        {showLoadingState
                          ? "Loading tuned rooms..."
                          : `${previewRoomUsers} users · ${previewRoomMinutes}m of ${previewRoomDuration}m`}
                      </div>
                      {showLoadingState ? (
                        <div className="tuner-modal__artist-list tuner-modal__artist-list--loading">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <div key={`loading-${idx}`} className="tuner-modal__artist-row tuner-modal__artist-row--skeleton">
                              <div className="tuner-modal__artist-row-avatar tuner-modal__artist-row-avatar--skeleton" />
                              <div className="tuner-modal__artist-row-name tuner-modal__artist-row-name--skeleton" />
                              <div className="tuner-modal__artist-row-picks tuner-modal__artist-row-picks--skeleton" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="tuner-modal__artist-list">
                          {sorted.map((a, idx) => {
                            const hue = hueFromName(a.name);
                            const initials = getInitials(a.name);

                            return (
                              <div
                                key={a.id || idx}
                                className="tuner-modal__artist-row"
                              >
                                <div
                                  className="tuner-modal__artist-row-avatar"
                                  style={{
                                    borderColor: `hsla(${hue}, 40%, 58%, 0.4)`,
                                  }}
                                >
                                  {hasValidImageUrl(a.image) ? (
                                    <img
                                      className="tuner-modal__artist-row-img"
                                      src={a.image}
                                      alt={a.name}
                                    />
                                  ) : (
                                    <span className="tuner-modal__artist-row-initials">
                                      {initials || "?"}
                                    </span>
                                  )}
                                </div>

                                <span className="tuner-modal__artist-row-name" title={a.name}>
                                  {a.name}
                                </span>

                                <div className="tuner-modal__artist-row-right">
                                  <VolumeIcon
                                    volume={a.barsPct ?? 50}
                                    size={12}
                                    color="rgba(255,255,255,0.55)"
                                  />
                                  <span className="tuner-modal__artist-row-picks">
                                    {a.picks ?? 0}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
                
                {/* Footer Actions */}
                <div className="tuner-modal__stack-footer">
                  <button
                    type="button"
                    className="tuner-modal__stack-next"
                    onClick={nextPreviewRoom}
                    disabled={previewRoomsLoading || !!shufflePhase || isClosingPreview || previewRooms.length <= 1}
                  >
                    Next Room
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="tuner-modal__stack-enter"
                    onClick={enterPreviewRoom}
                    disabled={previewRoomsLoading || !previewRoom || isClosingPreview}
                  >
                    Enter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
