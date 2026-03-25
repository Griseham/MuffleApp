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

const formatSimilarity = (n) => {
  const num = Number.isFinite(Number(n)) ? Number(n) : 0;
  return String(num);
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

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

// Artist Avatar with Bottom Arc and Volume Indicator
const ArtistAvatar = ({ name, image, volume = 50, count = 0, accentColor = "#60a5fa" }) => {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  // Bottom half arc calculation (180 degrees)
  const halfCircumference = Math.PI * 38;
  const strokeDashoffset = halfCircumference - (volume / 100) * halfCircumference;

  return (
    <div className="playing-top__avatar-wrapper">
      {/* Volume badge on top */}
      <div className="playing-top__volume-badge">
        <VolumeIcon volume={volume} color="#f5f7fb" size={12} />
      </div>
      
      {/* SVG for bottom arc */}
      <svg 
        className="playing-top__avatar-arc" 
        width="84" 
        height="84" 
        viewBox="0 0 84 84"
      >
        <defs>
          <linearGradient id="arcGradientBlue" x1="0%" y1="100%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <filter id="arcGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Bottom half arc background */}
        <path
          d="M 4 42 A 38 38 0 0 0 80 42"
          fill="none"
          stroke="rgba(96,165,250,0.15)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Bottom half arc progress */}
        <path
          d="M 4 42 A 38 38 0 0 0 80 42"
          fill="none"
          stroke="url(#arcGradientBlue)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={halfCircumference}
          strokeDashoffset={strokeDashoffset}
          filter="url(#arcGlow)"
        />
      </svg>
      
      {/* Avatar circle */}
      <div className="playing-top__avatar">
        {hasValidImageUrl(image) ? (
          <img className="playing-top__avatar-img" src={image} alt={name || "Artist"} />
        ) : (
          <div className="playing-top__avatar-fallback">{initials || "?"}</div>
        )}
      </div>

      <div className="playing-top__artist-count-badge">
        {count}
      </div>
    </div>
  );
};

const RadarGrid = ({ artists, accentColor }) => {
  return (
    <div className="playing-top__radar-scroll">
      <div className="playing-top__radar-grid">
        {artists.map((a, idx) => (
          <div key={a.radarKey || a.roomArtistKey || a.id || `${a.name}-${idx}`} className="playing-top__artist">
            <ArtistAvatar 
              name={a.name} 
              image={a.image} 
              volume={a.volume ?? 50} 
              count={a.rightSwipes ?? 0}
              accentColor={accentColor}
            />
            <div className="playing-top__artist-name" title={a.name}>
              {a.name || "Unknown"}
            </div>
          </div>
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
  return (
    <div className="playing-top__picks-scroll">
      {picks.length === 0 ? (
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

              <div className="middle-section">
                <div className="by-label">By:</div>
                <div className="user-container">
                  <div className="user-avatar">
                    <div className="user-avatar-fallback">
                      {(song.recommendedBy?.username || "you")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  </div>
                  <div className="user-name">
                    {song.recommendedBy?.username || "you"}
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

const TabButton = ({ active, onClick, label, infoId, infoTitle, infoText }) => {
  return (
    <button
      type="button"
      className={`playing-top__tab ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      <span className="playing-top__tab-label">{label}</span>
      <InfoIconModal
        title={infoTitle}
        modalId={infoId}
        steps={[
          {
            title: infoTitle,
            content: infoText,
          },
        ]}
        iconSize={14}
        iconColor="#FFA500"
        showButtonText={false}
        sidePanel={true}
      />
    </button>
  );
};

export default function PlayingTopComponent({
  onBack = null,
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
  yourPicks = [],
  previewRooms = [],
  previewRoomsLoading = false,
  onEnterPreviewRoom = () => {},

  tunerVolume = 0,
  tunerSimilarity = 0,
  onTunerVolumeChange = () => {},
  onTunerSimilarityChange = () => {},
}) {
  const PREVIEW_SWAP_MS = 110;
  const PREVIEW_ENTER_MS = 140;
  const PREVIEW_CLOSE_MS = 140;
  const accentColor = "#60a5fa";
  const [isTunerModalOpen, setIsTunerModalOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

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

  const handleDragStart = useCallback((e) => {
    isDragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX, y: clientY, ox: dragOffset.x, oy: dragOffset.y };

    const handleDragMove = (ev) => {
      if (!isDragging.current) return;
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      setDragOffset({
        x: dragStart.current.ox + (cx - dragStart.current.x),
        y: dragStart.current.oy + (cy - dragStart.current.y),
      });
    };

    const handleDragEnd = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);
  }, [dragOffset]);

  useEffect(() => () => {
    clearPreviewTransition();
  }, [clearPreviewTransition]);

  useEffect(() => {
    if (previewIndex < previewRooms.length) return;
    setPreviewIndex(0);
  }, [previewIndex, previewRooms.length]);

  const previewRoom = useMemo(() => {
    if (!previewRooms.length) return null;
    return previewRooms[previewIndex] || previewRooms[0] || null;
  }, [previewRooms, previewIndex]);

  const previewRoomName = previewRoom?.name || roomName;

  const previewArtists = useMemo(() => {
    const sourceArtists = previewRoom?.artists || [];

    return [...sourceArtists]
      .sort((a, b) => (b.count ?? b.picks ?? 0) - (a.count ?? a.picks ?? 0))
      .slice(0, 8)
      .map((artist, idx) => ({
        id: artist?.roomArtistKey || artist?.id || `${artist?.name || "artist"}-${idx}`,
        name: artist?.name || "ARTIST",
        image: artist?.image || artist?.imageUrl || artist?.artworkUrl || "",
        picks: artist?.count ?? artist?.picks ?? 0,
        barsPct: clamp(Math.round(((artist?.volume ?? 0) / 6) * 100), 0, 100),
      }));
  }, [previewRoom]);

  const radarArtists = useMemo(() => {
    const base = (poolArtists?.length ? poolArtists : roomArtists) || [];
    return base.slice(0, 18).map((a, idx) => ({
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
    setPreviewIndex(0);
    setIsTunerModalOpen(true);
  };

  const nextPreviewRoom = () => {
    if (shufflePhase || isClosingPreview || previewRooms.length <= 1) return;

    clearPreviewTransition();
    setShufflePhase("out");

    previewTransitionRef.current.swapTimer = window.setTimeout(() => {
      setPreviewIndex((prev) => (prev + 1) % previewRooms.length);
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
    clearPreviewTransition();
    setIsTunerModalOpen(false);
    setShufflePhase(null);
    setIsClosingPreview(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const enterPreviewRoom = () => {
    if (isClosingPreview || !previewRoom) return;
    clearPreviewTransition();
    setIsClosingPreview(true);
    window.setTimeout(() => {
      onEnterPreviewRoom(previewRoom);
      closePreview();
    }, PREVIEW_CLOSE_MS);
  };

  const handleTabClick = (tab) => {
    if (tab === activeTab) {
      onToggleExpand(!isExpanded);
      return;
    }

    setActiveTab(tab);
    if (!isExpanded) onToggleExpand(true);
  };

  return (
    <section className="playing-top" style={{ "--top-accent": accentColor }}>
      <div className="playing-top__panel">
        <div className="playing-top__header">
          <div className="playing-top__left">
            {typeof onBack === "function" && (
              <button
                type="button"
                className="playing-top__backbtn"
                onClick={onBack}
              >
                Back
              </button>
            )}
            <div className="playing-top__room">{roomName}</div>
            <div className="playing-top__room-meta">
              <span className="playing-top__room-pill">
                {roomUsers} online
              </span>
              <span className="playing-top__room-pill">
                {roomMinutes}m ({roomDuration}m)
              </span>
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
                className="playing-top__collapse"
                onClick={() => onToggleExpand(!isExpanded)}
                aria-label={isExpanded ? "Collapse top panel" : "Expand top panel"}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                <span className={`playing-top__chev ${isExpanded ? "is-up" : ""}`}>⌃</span>
              </button>
            </div>
          </div>
        </div>

        <div className="playing-top__tabs">
          <TabButton
            active={activeTab === "tuner"}
            onClick={() => handleTabClick("tuner")}
            label="TUNER"
            infoId="playing-top-tuner"
            infoTitle="Tuner"
            infoText="Click dial to arm. Move to preview. Click again to load a tuned room preview."
          />

          <TabButton
            active={activeTab === "radar"}
            onClick={() => handleTabClick("radar")}
            label="RADAR"
            infoId="playing-top-radar"
            infoTitle="Radar"
            infoText="Shows top artists in the room by right swipes. The arc shows their volume (popularity)."
          />

          <TabButton
            active={activeTab === "yourPicks"}
            onClick={() => handleTabClick("yourPicks")}
            label={`YOUR PICKS${yourPicks.length ? ` (${yourPicks.length})` : ""}`}
            infoId="playing-top-yourpicks"
            infoTitle="Your Picks"
            infoText="Shows songs you added from the Widget and how they performed (later)."
          />
        </div>

        {isExpanded && (
          <div className="playing-top__content">
            {activeTab === "tuner" ? (
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
                  size={108}
                />

                <div className="playing-top__tuner-subtext">
                  Click dial → move mouse → click again to load preview.
                </div>
              </div>
            ) : activeTab === "radar" ? (
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
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
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
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  style={{ cursor: "grab" }}
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
                  
                  <div className="tuner-modal__stack-label">{previewRoomName}</div>
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
                
                {/* Bubble Cloud Artists */}
                {(() => {
                  const sorted = previewArtists;
                  const maxPicks = Math.max(...sorted.map((a) => a.picks ?? 1), 1);
                  const showLoadingState = previewRoomsLoading && !sorted.length;

                  return (
                    <>
                      <div className="tuner-modal__bubble-info">
                        {showLoadingState
                          ? "Loading tuned rooms..."
                          : `${sorted.length} artists · sorted by picks`}
                      </div>
                      {showLoadingState ? (
                        <div className="tuner-modal__bubble-cloud tuner-modal__bubble-cloud--loading">
                          {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={`loading-${idx}`} className="tuner-modal__bubble tuner-modal__bubble--skeleton">
                              <div className="tuner-modal__bubble-orb-wrap">
                                <div className="tuner-modal__bubble-vol-badge tuner-modal__bubble-vol-badge--skeleton" />
                                <div className="tuner-modal__bubble-orb tuner-modal__bubble-orb--skeleton">
                                  <div className="tuner-modal__bubble-media tuner-modal__bubble-media--skeleton" />
                                  <div className="tuner-modal__bubble-pick-badge tuner-modal__bubble-pick-badge--skeleton" />
                                </div>
                              </div>
                              <span className="tuner-modal__bubble-name tuner-modal__bubble-name--skeleton" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="tuner-modal__bubble-cloud">
                          {sorted.map((a, idx) => {
                            const hue = hueFromName(a.name);
                            const scale = 0.6 + ((a.picks ?? 0) / maxPicks) * 0.4;
                            const bubbleSize = Math.round(38 + scale * 16);
                            const initials = getInitials(a.name);

                            return (
                              <div
                                key={a.id || idx}
                                className="tuner-modal__bubble"
                              >
                                <div className="tuner-modal__bubble-orb-wrap">
                                  <div className="tuner-modal__bubble-vol-badge">
                                    <VolumeIcon
                                      volume={a.barsPct ?? 50}
                                      size={11}
                                      color="#f5f7fb"
                                    />
                                  </div>

                                  <div
                                    className="tuner-modal__bubble-orb"
                                    style={{
                                      width: bubbleSize + 6,
                                      height: bubbleSize + 6,
                                      borderColor: `hsla(${hue}, 40%, 58%, 0.4)`,
                                      background: "linear-gradient(180deg, rgba(28,30,36,0.98), rgba(14,16,20,0.98))",
                                      boxShadow: "0 12px 22px rgba(0,0,0,0.28)",
                                    }}
                                  >
                                    <div className="tuner-modal__bubble-media">
                                      {hasValidImageUrl(a.image) ? (
                                        <img
                                          className="tuner-modal__bubble-img"
                                          src={a.image}
                                          alt={a.name}
                                        />
                                      ) : (
                                        <span
                                          className="tuner-modal__bubble-initials"
                                          style={{
                                            fontSize: Math.round(9 + scale * 3),
                                            color: "#f2f4f8",
                                          }}
                                        >
                                          {initials || "?"}
                                        </span>
                                      )}
                                    </div>

                                    <div
                                      className="tuner-modal__bubble-pick-badge"
                                      style={{
                                        background: "rgba(10, 12, 18, 0.94)",
                                        borderColor: "rgba(255,255,255,0.24)",
                                      }}
                                    >
                                      {a.picks ?? 0}
                                    </div>
                                  </div>
                                </div>

                                <span className="tuner-modal__bubble-name" title={a.name}>
                                  {a.name}
                                </span>
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
