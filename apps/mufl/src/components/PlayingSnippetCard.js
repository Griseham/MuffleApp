import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { PlayIcon, PauseIcon, BookmarkIcon } from "./Icons/Icons";
import InfoIconModal from "./InfoIconModal";
import UserHoverCard from "./UserHoverCard";
import { getAvatarForUser } from "../utils/avatarService";

const FALLBACK = {
  id: "fallback",
  track: "Waiting for a snippet...",
  artist: "Use the Widget to add songs",
  album: "",
  artworkUrl: "",
  image: "",
  previewUrl: "",
  color: "#60a5fa",
  recommendedBy: { username: "system", timeAgo: "", comment: "No song queued yet." },
};

const safeUrl = (url) =>
  typeof url === "string" && url.startsWith("http") ? url : "";

const PREVIEW_DURATION_SECONDS = 30;

// ---- Fake per-snippet user generation (stable per card.id) ----
const LOREM =
  "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua";
const LOREM_WORDS = LOREM.split(" ");

const hashStringToInt = (str = "") => {
  // fast deterministic hash (not crypto)
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
};

const PALETTE = [
  "#22c55e",
  "#06b6d4",
  "#f97316",
  "#eab308",
  "#f43f5e",
  "#a855f7",
  "#3b82f6",
  "#14b8a6",
  "#84cc16",
  "#ef4444",
  "#0ea5e9",
  "#fb7185",
];

const colorFromString = (input = "") => PALETTE[hashStringToInt(input) % PALETTE.length];

const makeFakeUserForSnippet = (snippetId = "fallback") => {
  const h = hashStringToInt(String(snippetId));
  const digits = String(h % 1000).padStart(3, "0");
  const username = `user${digits}`;

  // avatar index range depends on your avatarService; keep it reasonable
  const avatarIndex = (h % 12) + 1;

  const avatarColor = PALETTE[h % PALETTE.length];

  // give the hover card some believable numbers
  const volume = 600 + (h % 2601); // 600..3200
  const followers = 50 + (h % 950);
  const following = 40 + (h % 650);
  const discoveryPercent = 1 + (h % 15);

  const wordStart = h % (LOREM_WORDS.length - 5);
  const comment = LOREM_WORDS.slice(wordStart, wordStart + 5).join(" ");

  return {
    username,
    avatar: getAvatarForUser(avatarIndex),
    avatarColor,
    volume,
    followers,
    following,
    discoveryPercent,
    createdAt: "Jan 2023",
    verified: false,
    comment,
    isSelf: false,
  };
};

// SVG Fallback when no artwork
const ArtworkFallback = ({ accentColor = "#60a5fa" }) => (
  <svg viewBox="0 0 400 400" style={{ width: '100%', height: '100%', display: 'block' }}>
    <defs>
      <linearGradient id="fallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#0f0f1a" />
      </linearGradient>
    </defs>
    <rect fill="url(#fallbackGrad)" width="400" height="400"/>
    <circle cx="200" cy="200" r="120" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.2"/>
    <circle cx="200" cy="200" r="80" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.25"/>
    <circle cx="200" cy="200" r="40" fill={accentColor} opacity="0.3"/>
    <text x="200" y="215" textAnchor="middle" fill="#fff" fontSize="48" fontFamily="system-ui" opacity="0.8">♪</text>
  </svg>
);

// Format seconds to m:ss
const formatTime = (seconds) => {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function PlayingSnippetCard({
  song = null,
  isLoading = false,
  onVote = () => {},
  onToggleBookmark = () => {},
  infoSteps = null,
}) {
  const card = useMemo(() => (song ? song : FALLBACK), [song]);
  const modalId = useId();

  // Cache fake users per snippet so they stay consistent if you loop back
  const fakeUsersRef = useRef({});
  const bookmarkedSnippetsRef = useRef({});
  const voteStartTimeoutRef = useRef(null);
  const voteCompleteTimeoutRef = useRef(null);
  const [isUserHoverOpen, setIsUserHoverOpen] = useState(false);

  const snippetUser = useMemo(() => {
    const recommendedBy = card?.recommendedBy || null;
    const recUsername = recommendedBy?.username?.trim();
    const isYou = (card?.source === "widget") || (recUsername && recUsername.toLowerCase() === "you");

    // If the snippet was added from the Widget ("you"), force the Y badge
    if (isYou) {
      return {
        username: "you",
        avatar: null,
        avatarColor: "#1DB954",
        comment: recommendedBy?.comment || "You added this from the Widget",
        volume: 1200,
        followers: 0,
        following: 0,
        discoveryPercent: 0,
        createdAt: "",
        verified: false,
        isSelf: true,
      };
    }

    // If we have a recommender, lean on that data but keep deterministic colors/avatars
    if (recUsername) {
      const avatarIndex = (hashStringToInt(recUsername) % 12) + 1;
      return {
        username: recUsername,
        avatar: recommendedBy?.avatar || getAvatarForUser(avatarIndex),
        avatarColor: recommendedBy?.avatarColor || colorFromString(recUsername),
        comment: recommendedBy?.comment || "Recommended track",
        volume: recommendedBy?.volume || 800,
        followers: recommendedBy?.followers || 120,
        following: recommendedBy?.following || 80,
        discoveryPercent: recommendedBy?.discoveryPercent || 8,
        createdAt: recommendedBy?.createdAt || "",
        verified: Boolean(recommendedBy?.verified),
        isSelf: false,
      };
    }

    // Fallback: deterministic fake user (legacy behavior)
    const id = String(card?.id || "fallback");
    if (!fakeUsersRef.current[id]) {
      fakeUsersRef.current[id] = makeFakeUserForSnippet(id);
    }
    return fakeUsersRef.current[id];
  }, [card?.id, card?.recommendedBy, card?.source]);

  const [direction, setDirection] = useState(null);
  const [animation, setAnimation] = useState(false);
  const [centerArrow, setCenterArrow] = useState(null);
  const [upVotes, setUpVotes] = useState({ 1: 0, 2: 0, 3: 0 });
  const [downVotes, setDownVotes] = useState({ 1: 0, 2: 0, 3: 0 });

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [artworkFailed, setArtworkFailed] = useState(false);

  // Audio progress tracking
  const [currentTime, setCurrentTime] = useState(0);
  const progressRAF = useRef(null);

  const artworkUrl = safeUrl(card.artworkUrl || card.image);
  const previewUrl = safeUrl(card.previewUrl);
  const accentColor = card.color || "#60a5fa";
  const isFallbackCard = card.id === FALLBACK.id;
  const canVote = !isLoading && !isFallbackCard;
  const canPlay = !isLoading && Boolean(previewUrl);
  const duration = canPlay ? PREVIEW_DURATION_SECONDS : 0;

  const progressScale = duration > 0 ? Math.min(currentTime, duration) / duration : 0;

  // RAF-based progress updater for smooth bar
  const updateProgress = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(Math.min(audioRef.current.currentTime, PREVIEW_DURATION_SECONDS));
      progressRAF.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  const clearVoteTimers = useCallback(() => {
    if (voteStartTimeoutRef.current) {
      clearTimeout(voteStartTimeoutRef.current);
      voteStartTimeoutRef.current = null;
    }
    if (voteCompleteTimeoutRef.current) {
      clearTimeout(voteCompleteTimeoutRef.current);
      voteCompleteTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearVoteTimers();
    setIsPlaying(false);
    setAudioError(false);
    setBookmarked(Boolean(bookmarkedSnippetsRef.current[card?.id]));
    setArtworkFailed(false);
    setDirection(null);
    setAnimation(false);
    setCenterArrow(null);
    setUpVotes({ 1: 0, 2: 0, 3: 0 });
    setDownVotes({ 1: 0, 2: 0, 3: 0 });
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (progressRAF.current) {
      cancelAnimationFrame(progressRAF.current);
    }
  }, [card?.id, clearVoteTimers]);

  // Cleanup timers/RAF on unmount
  useEffect(() => {
    const audioNode = audioRef.current;

    return () => {
      clearVoteTimers();
      if (progressRAF.current) cancelAnimationFrame(progressRAF.current);
      if (audioNode) {
        audioNode.pause();
      }
    };
  }, [clearVoteTimers]);

  const handlePlay = () => {
    if (!previewUrl || !audioRef.current || isLoading) return;

    setAudioError(false);

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (progressRAF.current) cancelAnimationFrame(progressRAF.current);
      return;
    }

    if (audioRef.current.currentTime >= PREVIEW_DURATION_SECONDS) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        progressRAF.current = requestAnimationFrame(updateProgress);
      })
      .catch(() => {
        setAudioError(true);
        setIsPlaying(false);
      });
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    if (progressRAF.current) cancelAnimationFrame(progressRAF.current);
  };

  const handleAudioError = () => {
    setAudioError(true);
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    if (progressRAF.current) cancelAnimationFrame(progressRAF.current);
  };

  const handleBookmark = () => {
    if (isFallbackCard || isLoading) return;
    const next = !bookmarked;
    bookmarkedSnippetsRef.current[card.id] = next;
    setBookmarked(next);
    onToggleBookmark(card, next);
  };

  const getAnimationClass = () => {
    if (!animation) return "";
    return direction === "up" ? "animate-slide-right" : "animate-slide-left";
  };

  const renderCenterArrow = (type, strength) => {
    const colorClass = type === "up" ? "psnippet__centerArrow--up" : "psnippet__centerArrow--down";
    return (
      <div className={`psnippet__centerArrow ${colorClass} animate-scale-in-out`}>
        <svg viewBox="0 0 24 24" className="psnippet__centerArrowSvg" fill="none" stroke="currentColor" strokeWidth="2">
          {type === "up" ? (
            <>
              {strength >= 1 && <path d="M19 12L14 7M19 12L14 17" />}
              {strength >= 2 && <path d="M15 12L10 7M15 12L10 17" />}
              {strength >= 3 && <path d="M11 12L6 7M11 12L6 17" />}
            </>
          ) : (
            <>
              {strength >= 1 && <path d="M5 12L10 7M5 12L10 17" />}
              {strength >= 2 && <path d="M9 12L14 7M9 12L14 17" />}
              {strength >= 3 && <path d="M13 12L18 7M13 12L18 17" />}
            </>
          )}
        </svg>
      </div>
    );
  };

  const handleVote = (type, strength) => {
    if (!canVote || animation || ![1, 2, 3].includes(strength)) return;

    clearVoteTimers();

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (progressRAF.current) cancelAnimationFrame(progressRAF.current);
    }

    if (type === "up") {
      setUpVotes((prev) => ({ ...prev, [strength]: (prev[strength] || 0) + 1 }));
    } else {
      setDownVotes((prev) => ({ ...prev, [strength]: (prev[strength] || 0) + 1 }));
    }

    setCenterArrow({ type, strength });

    voteStartTimeoutRef.current = setTimeout(() => {
      setDirection(type);
      setAnimation(true);

      voteCompleteTimeoutRef.current = setTimeout(() => {
        setAnimation(false);
        setCenterArrow(null);
        setUpVotes({ 1: 0, 2: 0, 3: 0 });
        setDownVotes({ 1: 0, 2: 0, 3: 0 });
        onVote(card, type === "up" ? "up" : "down", strength);
        voteStartTimeoutRef.current = null;
        voteCompleteTimeoutRef.current = null;
      }, 350);
    }, 800);
  };

  const steps = infoSteps || [
    {
      title: "Now Playing",
      content: "This is the main snippet you're rating. Left/Right goes into the bottom dock tabs.",
    },
  ];

  const displayName = snippetUser?.isSelf ? "You" : snippetUser?.username;
  const fallbackLetter = snippetUser?.isSelf
    ? "Y"
    : (snippetUser?.username || "?").slice(0, 1).toUpperCase();
  const avatarBackground = `linear-gradient(135deg, ${snippetUser?.isSelf ? "#1DB954" : snippetUser?.avatarColor || accentColor}, #0f172a)`;

  // ── Offset Stack (Design 5) styles ──
  const styles = {
    wrapper: {
      width: '100%',
      maxWidth: '380px',
      position: 'relative',
    },
    infoIconWrapper: {
      position: 'absolute',
      top: '0',
      right: '0',
      zIndex: 25,
    },
    swipeableContainer: {
      position: 'relative',
    },
    // Header row
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '58px',
      paddingRight: '40px',
    },
    avatarWrap: {
      position: "relative",
      flexShrink: 0,
    },
    avatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
      display: 'grid',
      placeItems: 'center',
      fontSize: '13px',
      fontWeight: '700',
      color: '#fff',
      flexShrink: 0,
      cursor: "pointer",
      overflow: "hidden",
    },
    avatarImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },
    avatarFallback: {
      width: "100%",
      height: "100%",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
    },
    hoverCardWrap: {
      position: "absolute",
      top: "44px",
      left: "-8px",
      zIndex: 9999,
      width: "340px",
    },
    userText: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      flex: 1,
    },
    userRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    username: {
      color: '#fff',
      fontWeight: '600',
      fontSize: '14px',
    },
    comment: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '12px',
      marginTop: '2px',
      maxWidth: '300px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    // ── Offset Stack card structure ──
    offsetOuter: {
      position: 'relative',
      marginTop: '40px', // room for the art to poke above
    },
    bgGlow: {
      position: 'absolute',
      top: '-20px',
      left: '24px',
      right: '24px',
      bottom: '-10px',
      background: accentColor,
      borderRadius: '22px',
      opacity: 0.1,
      filter: 'blur(28px)',
      pointerEvents: 'none',
    },
    mainCard: {
      position: 'relative',
      borderRadius: '20px',
      overflow: 'visible',
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(14, 14, 18, 0.95)',
      backdropFilter: 'blur(20px)',
      padding: '0 16px 16px',
    },

    // Floating artwork — overlaps top edge of card
    floatingArt: {
      width: '75%',
      paddingBottom: '75%',
      margin: '0 auto',
      marginTop: '-40px',
      position: 'relative',
      borderRadius: '14px',
      overflow: 'hidden',
      border: `2px solid rgba(255,255,255,0.08)`,
      boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
      background: '#0a0a0f',
    },
    artInner: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    artImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
    },
    artOverlay: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(0,0,0,0.15)',
    },
    playBtn: {
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(12px)',
      border: '2px solid rgba(255,255,255,0.25)',
      color: '#fff',
      cursor: 'pointer',
      display: 'grid',
      placeItems: 'center',
      transition: 'all 0.2s ease',
      zIndex: 5,
    },
    bookmarkBtn: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      border: bookmarked ? `1px solid ${accentColor}60` : '1px solid rgba(255,255,255,0.12)',
      color: bookmarked ? accentColor : '#fff',
      cursor: 'pointer',
      display: 'grid',
      placeItems: 'center',
      transition: 'all 0.2s ease',
      zIndex: 5,
    },

    // Center arrow overlay on the floating art
    centerOverlay: {
      position: 'absolute',
      inset: 0,
      zIndex: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(6px)',
      borderRadius: '14px',
    },

    // Loading overlay on floating art
    loadingOverlay: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      zIndex: 10,
      borderRadius: '14px',
    },
    spinner: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      border: '3px solid rgba(255, 255, 255, 0.15)',
      borderTopColor: 'rgba(255, 255, 255, 0.9)',
      animation: 'psnippetSpin 0.8s linear infinite',
    },
    loadingText: {
      marginTop: '12px',
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '13px',
      fontWeight: '600',
    },

    // Song info below artwork
    songInfoSection: {
      marginTop: '16px',
      textAlign: 'center',
      padding: '0 4px',
    },
    track: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#fff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    artist: {
      fontSize: '13px',
      color: accentColor,
      marginTop: '3px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    // Duration progress bar
    progressSection: {
      marginTop: '14px',
      padding: '0 8px',
    },
    progressTrack: {
      width: '100%',
      height: '4px',
      borderRadius: '2px',
      background: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    },
    progressFill: {
      display: 'block',
      width: '100%',
      height: '100%',
      borderRadius: '2px',
      background: accentColor,
      transformOrigin: 'left center',
      willChange: 'transform',
      transition: 'transform 0.08s linear',
    },
    progressTimes: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '6px',
    },
    progressTime: {
      fontSize: '10px',
      color: 'rgba(255,255,255,0.3)',
      fontVariantNumeric: 'tabular-nums',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },

    // Accent bottom bar
    accentBar: {
      marginTop: '16px',
      height: '3px',
      background: accentColor,
      opacity: 0.85,
      borderRadius: '0 0 20px 20px',
      marginLeft: '-16px',
      marginRight: '-16px',
      marginBottom: '-16px',
    },

    // Side arrows (unchanged)
    sideContainer: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 20,
    },
    sideBtn: {
      width: '56px',
      height: '48px',
      borderRadius: '12px',
      backdropFilter: 'blur(8px)',
      display: 'grid',
      placeItems: 'center',
      position: 'relative',
      cursor: 'pointer',
      transition: 'transform 0.15s ease, background 0.15s ease',
    },
    sideBtnDown: {
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#ef4444',
    },
    sideBtnUp: {
      background: 'rgba(34, 197, 94, 0.15)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      color: '#22c55e',
    },
    sideIcon: {
      fontSize: '20px',
      fontWeight: '800',
      lineHeight: 1,
    },
    sideBadge: {
      position: 'absolute',
      top: '-8px',
      right: '-8px',
      width: '20px',
      height: '20px',
      borderRadius: '999px',
      display: 'grid',
      placeItems: 'center',
      fontSize: '11px',
      fontWeight: '800',
      color: '#fff',
      border: '1px solid rgba(0,0,0,0.65)',
    },
  };

  return (
    <div style={styles.wrapper}>
      {previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          preload="metadata"
          onEnded={handleEnded}
          onError={handleAudioError}
        />
      )}

      {/* Info icon - stays in place, doesn't swipe */}
      <div style={styles.infoIconWrapper}>
        <InfoIconModal
          title="Snippet"
          steps={steps}
          iconSize={18}
          iconColor="#FFA500"
          showButtonText={false}
          sidePanel={true}
          modalId={`playing-snippet-modal-${modalId}`}
        />
      </div>

      {/* Swipeable container - includes header AND card */}
      <div 
        style={styles.swipeableContainer}
        className={getAnimationClass()}
      >
        {/* Header row - inside the swipeable container */}
        <div style={styles.header}>
          <div
            style={styles.avatarWrap}
            onMouseEnter={() => setIsUserHoverOpen(true)}
            onMouseLeave={() => setIsUserHoverOpen(false)}
          >
            <div
              style={{
                ...styles.avatar,
                background: avatarBackground,
              }}
              aria-label={displayName}
            >
              {snippetUser.avatar ? (
                <img
                  style={styles.avatarImg}
                  src={snippetUser.avatar}
                  alt={displayName}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                style={{
                  ...styles.avatarFallback,
                  display: snippetUser.avatar ? "none" : "flex",
                }}
              >
                {fallbackLetter}
              </div>
            </div>

            {isUserHoverOpen && (
              <div style={styles.hoverCardWrap}>
                <UserHoverCard
                  user={{ name: snippetUser.username, volume: snippetUser.volume, avatar: snippetUser.avatar }}
                  userData={{
                    displayName: snippetUser.username,
                    verified: snippetUser.verified,
                    createdAt: snippetUser.createdAt,
                    following: snippetUser.following,
                    followers: snippetUser.followers,
                    discoveryPercent: snippetUser.discoveryPercent,
                    volume: snippetUser.volume,
                    avatar: snippetUser.avatar,
                  }}
                />
              </div>
            )}
          </div>
          <div style={styles.userText}>
            <div style={styles.userRow}>
              <span style={styles.username}>{displayName}</span>
            </div>
            <div style={styles.comment}>{snippetUser.comment}</div>
          </div>
        </div>

        {/* ── Offset Stack card ── */}
        <div style={styles.offsetOuter}>
          {/* Background glow */}
          <div style={styles.bgGlow} />

          {/* Main card body */}
          <div style={styles.mainCard}>
            {/* Floating artwork — overlaps top edge */}
            <div style={styles.floatingArt}>
              <div style={styles.artInner}>
                {artworkUrl && !artworkFailed ? (
                  <img 
                    style={styles.artImg} 
                    src={artworkUrl} 
                    alt={card.album || `${card.track} artwork`}
                    onError={() => setArtworkFailed(true)}
                  />
                ) : (
                  <ArtworkFallback accentColor={accentColor} />
                )}

                {/* Play overlay */}
                <div style={styles.artOverlay}>
                  <button
                    type="button"
                    style={{
                      ...styles.playBtn,
                      opacity: canPlay ? 1 : 0.4,
                      cursor: canPlay ? 'pointer' : 'not-allowed',
                    }}
                    onClick={handlePlay}
                    disabled={!canPlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    title={!previewUrl ? "No preview available" : audioError ? "Retry preview" : isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
                  </button>
                </div>

                {/* Bookmark */}
                <button
                  type="button"
                  style={styles.bookmarkBtn}
                  onClick={handleBookmark}
                  disabled={isLoading || isFallbackCard}
                  aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
                  aria-pressed={bookmarked}
                  title={bookmarked ? "Remove bookmark" : "Bookmark"}
                >
                  <BookmarkIcon size={16} filled={bookmarked} />
                </button>

                {/* Loading state */}
                {isLoading && (
                  <div style={styles.loadingOverlay}>
                    <div style={styles.spinner} />
                    <div style={styles.loadingText}>Loading...</div>
                  </div>
                )}

                {/* Center arrow animation */}
                {centerArrow && !isLoading && (
                  <div style={styles.centerOverlay}>
                    {renderCenterArrow(centerArrow.type, centerArrow.strength)}
                  </div>
                )}
              </div>
            </div>

            {/* Song info */}
            <div style={styles.songInfoSection}>
              <div style={styles.track} title={card.track}>
                {card.track}
              </div>
              <div style={styles.artist} title={card.artist}>
                {card.artist}
              </div>
            </div>

            {/* Duration progress bar */}
            <div style={styles.progressSection}>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    transform: `scaleX(${progressScale})`,
                  }}
                />
              </div>
              <div style={styles.progressTimes}>
                <span style={styles.progressTime}>{formatTime(currentTime)}</span>
                <span style={styles.progressTime}>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Accent bottom bar */}
            <div style={styles.accentBar} />
          </div>
        </div>
      </div>

      {/* LEFT arrows - outside swipeable container so they don't move */}
      {canVote && (
        <div style={{ ...styles.sideContainer, left: '-70px', top: 'calc(50% + 24px)' }}>
          {[1, 2, 3].map((s) => (
            <button
              key={`down-${s}`}
              type="button"
              style={{ ...styles.sideBtn, ...styles.sideBtnDown }}
              onClick={() => handleVote("down", s)}
              disabled={animation}
              aria-label={`Vote down ${s}`}
            >
              <span style={styles.sideIcon}>
                {s === 1 ? "‹" : s === 2 ? "‹‹" : "‹‹‹"}
              </span>
              {downVotes[s] > 0 && (
                <span style={{ ...styles.sideBadge, background: '#ef4444' }}>
                  {downVotes[s]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* RIGHT arrows - outside swipeable container so they don't move */}
      {canVote && (
        <div style={{ ...styles.sideContainer, right: '-70px', top: 'calc(50% + 24px)' }}>
          {[1, 2, 3].map((s) => (
            <button
              key={`up-${s}`}
              type="button"
              style={{ ...styles.sideBtn, ...styles.sideBtnUp }}
              onClick={() => handleVote("up", s)}
              disabled={animation}
              aria-label={`Vote up ${s}`}
            >
              <span style={styles.sideIcon}>
                {s === 1 ? "›" : s === 2 ? "››" : "›››"}
              </span>
              {upVotes[s] > 0 && (
                <span style={{ ...styles.sideBadge, background: '#22c55e' }}>
                  {upVotes[s]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Keyframes for animations */}
      <style>{`
        @keyframes psnippetSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideLeft {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes slideRight {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes scaleInOut {
          0% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-slide-left { animation: slideLeft 320ms ease-out forwards; }
        .animate-slide-right { animation: slideRight 320ms ease-out forwards; }
        .animate-scale-in-out { animation: scaleInOut 420ms ease-out forwards; }
        .psnippet__centerArrow {
          width: 84px;
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .psnippet__centerArrowSvg {
          width: 100%;
          height: 100%;
        }
        .psnippet__centerArrow--up { color: #22c55e; }
        .psnippet__centerArrow--down { color: #ef4444; }
      `}</style>
    </div>
  );
}
