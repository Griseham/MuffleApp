import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Pause,
  Users,
  Activity,
  Music,
  BarChart3
} from 'lucide-react';
import InfoIconModal from '../../components/InfoIconModal';
import { toApiOriginUrl } from '../../utils/api';
import { ClickableUserAvatar } from '../posts/UserHoverCard';
import {
  CURRENT_USER_AVATAR,
  CURRENT_USER_DISPLAY_NAME,
  CURRENT_USER_USERNAME,
  isCurrentUserAuthor,
} from '../../utils/currentUser';

const NEWS_GOLD = '#e8d5a8';
const NEWS_GOLD_DEEP = '#c4a86a';


function authorToAvatar(author) {
  if (!author) {
    return '/assets/default-avatar.png';
  }
  if (isCurrentUserAuthor(author)) {
    return CURRENT_USER_AVATAR;
  }
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `/assets/image${(Math.abs(hash) % 1000) + 1}.png`;
}
function buildCommentUser(comment) {
  const isCurrentUser = isCurrentUserAuthor(comment);
  const displayName = isCurrentUser
    ? CURRENT_USER_DISPLAY_NAME
    : (comment?.displayName || comment?.author || 'Unknown');
  const username =
    isCurrentUser
      ? CURRENT_USER_USERNAME
      : (
        comment?.username ||
        String(displayName)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "")
          .slice(0, 24) ||
        'user'
      );

  return {
    ...comment,
    displayName,
    name: displayName,
    username,
    avatar: isCurrentUser ? CURRENT_USER_AVATAR : (comment?.avatar || authorToAvatar(displayName)),
  };
}

function hashString(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function resolveCommentTimestampMs(comment = {}) {
  const candidates = [
    comment?.createdUtc,
    comment?.created_utc,
    comment?.createdAt,
    comment?.created_at,
    comment?.timestamp,
  ];

  for (const candidate of candidates) {
    if (Number.isFinite(candidate) && candidate > 0) {
      return candidate > 1e12 ? candidate : candidate * 1000;
    }

    if (typeof candidate === 'string' && candidate.trim()) {
      const asNumber = Number(candidate);
      if (Number.isFinite(asNumber) && asNumber > 0) {
        return asNumber > 1e12 ? asNumber : asNumber * 1000;
      }

      const parsed = Date.parse(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function buildFallbackTimestamp(comment = {}) {
  const seedBase = `${comment?.id || 'comment'}:${comment?.author || comment?.displayName || 'user'}`;
  const fallbackMinutesAgo = 5 + (Math.abs(hashString(seedBase)) % (72 * 60));
  const totalMinutes = Math.max(1, Math.round(fallbackMinutesAgo));

  if (totalMinutes < 60) return `${totalMinutes}m ago`;
  if (totalMinutes < 24 * 60) return `${Math.floor(totalMinutes / 60)}h ago`;
  return `${Math.floor(totalMinutes / (24 * 60))}d ago`;
}

function formatCommentTimestamp(comment = {}) {
  const resolvedMs = resolveCommentTimestampMs(comment);
  if (resolvedMs) {
    return new Date(resolvedMs).toLocaleString();
  }
  return buildFallbackTimestamp(comment);
}

const ThreadCommentCard = ({
  comment,
  snippet,
  isPlaying,
  activeSnippet,
  onPlayPause,
  onRate,
  onRatingPause,
  onUserClick,
  isFirstSnippet, // Add this prop
  isNewsThread = false, // Add news thread prop
  snippetsLoading = false, // NEW: Loading state for snippets
  usernameDotColor = null,
  isParameterTheme = false,
  isMobileViewport = null,
  isCompactPhoneViewport = null,
}) => {
  const commentUser = buildCommentUser(comment);
  const isOwnComment = isCurrentUserAuthor(comment);

  // State for interaction
  const [hoveredAction, setHoveredAction] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() =>
    typeof isMobileViewport === 'boolean'
      ? isMobileViewport
      : (typeof window !== 'undefined' ? window.innerWidth <= 480 : false)
  );
  const [isCompactPhone, setIsCompactPhone] = useState(() =>
    typeof isCompactPhoneViewport === 'boolean'
      ? isCompactPhoneViewport
      : (typeof window !== 'undefined' ? window.innerWidth <= 390 : false)
  );
  useEffect(() => {
    const hasMobileProp = typeof isMobileViewport === 'boolean';
    const hasCompactProp = typeof isCompactPhoneViewport === 'boolean';

    if (typeof window === 'undefined') {
      if (hasMobileProp) setIsMobile(isMobileViewport);
      if (hasCompactProp) setIsCompactPhone(isCompactPhoneViewport);
      return undefined;
    }

    const syncViewportFlags = () => {
      setIsMobile(hasMobileProp ? isMobileViewport : window.innerWidth <= 480);
      setIsCompactPhone(hasCompactProp ? isCompactPhoneViewport : window.innerWidth <= 390);
    };

    syncViewportFlags();

    if (hasMobileProp && hasCompactProp) {
      return undefined;
    }

    const handleResize = () => {
      if (!hasMobileProp) setIsMobile(window.innerWidth <= 480);
      if (!hasCompactProp) setIsCompactPhone(window.innerWidth <= 390);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCompactPhoneViewport, isMobileViewport]);

  // Mobile rating slider states
  const [ratingExpanded, setRatingExpanded] = useState(false);
  const [mobileSliderRating, setMobileSliderRating] = useState(50);
  const [mobileHasRated, setMobileHasRated] = useState(false);
  const [mobileMyRating, setMobileMyRating] = useState(null);
  const sliderTrackRef = useRef(null);
  const mobileInlineTrackRef = useRef(null);
  const [mobileInlinePreviewRating, setMobileInlinePreviewRating] = useState(null);

  // Snippet states
  const [localUserRating, setLocalUserRating] = useState(0);
  const [ratedTimestamp, setRatedTimestamp] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Local progress timer
  const [localElapsedSeconds, setLocalElapsedSeconds] = useState(0);
  const timeIntervalRef = useRef(null);

  // Use stable primitive keys so effects don't retrigger on every render
  const snippetKey = snippet?.commentId || snippet?.id;
  const snippetIdStr = snippetKey?.toString() ?? "";
  const activeSnippetIdStr = activeSnippet?.snippetId?.toString() ?? "";
  const activeElapsedSeconds = activeSnippet?.elapsedSeconds ?? 0;

  // Helper to ensure artwork URL is properly formatted (replace {w}, {h} templates)
  const getFormattedArtworkUrl = (snippet) => {
    if (!snippet) return "/assets/default-artist.png";
    
    // Try multiple sources for artwork URL
    const rawUrl = 
      snippet.artworkUrl || 
      snippet.artwork || 
      snippet.snippetData?.attributes?.artwork?.url ||
      snippet.artistImage ||
      "/assets/default-artist.png";
    
    if (!rawUrl || rawUrl === "/assets/default-artist.png") {
      return "/assets/default-artist.png";
    }
    
    // Replace Apple Music template placeholders
    let formattedUrl = rawUrl
      .replace('{w}', '300')
      .replace('{h}', '300')
      .replace('{f}', 'jpg');
    
    // If it's a cached media path, prepend the API base
    if (formattedUrl.startsWith('/cached_media/')) {
      formattedUrl = toApiOriginUrl(formattedUrl);
    }
    
    return formattedUrl;
  };

  // Get the properly formatted artwork URL
  const formattedArtwork = snippet ? getFormattedArtworkUrl(snippet) : null;

  const likeCount = Number.isFinite(comment?.likeCount)
    ? comment.likeCount
    : (Number.isFinite(comment?.likes) ? comment.likes : 0);
  const replyCount = Array.isArray(comment?.replies)
    ? comment.replies.length
    : (Number.isFinite(comment?.commentCount) ? comment.commentCount : (Number.isFinite(comment?.replies) ? comment.replies : 0));

  // Basic user/timestamp
  const timestamp = formatCommentTimestamp(comment);

  // Initialize/sync local rating from snippet (primitive deps only)
  useEffect(() => {
    const next = snippet?.userRating || 0;
    setLocalUserRating((prev) => (prev === next ? prev : next));
  }, [snippet?.id, snippet?.userRating]);

  // Get the current progress percentage for the progress bar
  const getProgressPercent = () => {
    if (!snippet) return 0;
    
    const snippetId = (snippet.commentId || snippet.id)?.toString();
    const activeId = activeSnippet?.snippetId?.toString();
    
    if (snippetId && activeId && snippetId === activeId && isPlaying) {
      return (localElapsedSeconds / 30) * 100;
    }
    return 0;
  };

  // Sync with the parent component's active snippet state (primitive deps only)
  useEffect(() => {
    if (!snippetIdStr) return;
    const isActive = snippetIdStr === activeSnippetIdStr;
    const next = isActive ? (activeElapsedSeconds || 0) : 0;
    setLocalElapsedSeconds((prev) => (prev === next ? prev : next));
  }, [snippetIdStr, activeSnippetIdStr, activeElapsedSeconds]);

  // Handle the timer interval for the currently playing snippet
  useEffect(() => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    const isActive = snippetIdStr && snippetIdStr === activeSnippetIdStr;

    if (isActive && isPlaying) {
      timeIntervalRef.current = setInterval(() => {
        setLocalElapsedSeconds((prev) => {
          const next = Math.min(prev + 1, 30);
          if (next >= 30 && timeIntervalRef.current) {
            clearInterval(timeIntervalRef.current);
            timeIntervalRef.current = null;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    };
  }, [snippetIdStr, activeSnippetIdStr, isPlaying]);
  
  // Handle rating click
  function handleRatingClick(e) {
    e.stopPropagation();
    // Disable rating for user-inputted songs or already rated songs
    if (!snippet || snippet.didRate || isOwnComment) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const fraction = 1 - y / rect.height;
    const newRating = Math.round(fraction * 100);

    setLocalUserRating(newRating);
    if (onRate) {
      onRate(snippet, newRating);
    }
    // Mark when we rated
    setRatedTimestamp(localElapsedSeconds || 0);

    // If we want the snippet to stop playing once rated:
    if (onRatingPause) {
      onRatingPause(snippet);
    }
  }

  // Handle rating hover
  function handleRatingHover(e) {
    // Disable rating hover for user-inputted songs or already rated songs
    if (!snippet || snippet.didRate || isOwnComment) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const fraction = 1 - y / rect.height;
    const hoverValue = Math.round(fraction * 100);
    setIsHovering(true);
    setHoverRating(hoverValue);
  }

  // Mobile horizontal slider handlers
  function handleMobileSliderPointerDown(e) {
    if (!sliderTrackRef.current) return;
    e.preventDefault();
    sliderTrackRef.current.setPointerCapture(e.pointerId);
    updateMobileSliderFromPointer(e);
  }

  function handleMobileSliderPointerMove(e) {
    if (!sliderTrackRef.current || !sliderTrackRef.current.hasPointerCapture(e.pointerId)) return;
    updateMobileSliderFromPointer(e);
  }

  function handleMobileSliderPointerUp(_e) {
    if (!sliderTrackRef.current) return;
    // Commit rating on release
    const rating = mobileSliderRating;
    setMobileMyRating(rating);
    setMobileHasRated(true);
    setLocalUserRating(rating);
    setRatingExpanded(false);
    if (onRate && snippet) {
      onRate(snippet, rating);
    }
    if (onRatingPause && snippet) {
      onRatingPause(snippet);
    }
    setRatedTimestamp(localElapsedSeconds || 0);
  }

  function updateMobileSliderFromPointer(e) {
    if (!sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setMobileSliderRating(Math.round(pct * 100));
  }

  function clampRating(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function commitMobileRating(nextRawRating) {
    if (!snippet) return;
    const nextRating = clampRating(nextRawRating);
    setMobileMyRating(nextRating);
    setMobileHasRated(true);
    setLocalUserRating(nextRating);
    setMobileSliderRating(nextRating);
    setRatingExpanded(false);
    if (onRate) {
      onRate(snippet, nextRating);
    }
    if (onRatingPause) {
      onRatingPause(snippet);
    }
    setRatedTimestamp(localElapsedSeconds || 0);
  }

  function getInlineRatingFromClientX(clientX) {
    if (!mobileInlineTrackRef.current) return 0;
    const rect = mobileInlineTrackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return clampRating(pct * 100);
  }

  function handleInlineRatingPointerDown(e) {
    if (!mobileInlineTrackRef.current || !snippet || snippet.didRate || isOwnComment) return;
    e.preventDefault();
    const next = getInlineRatingFromClientX(e.clientX);
    setMobileInlinePreviewRating(next);
    setLocalUserRating(next);
    setMobileSliderRating(next);
    mobileInlineTrackRef.current.setPointerCapture(e.pointerId);
  }

  function handleInlineRatingPointerMove(e) {
    if (!mobileInlineTrackRef.current || !snippet || snippet.didRate || isOwnComment) return;
    if (!mobileInlineTrackRef.current.hasPointerCapture(e.pointerId)) return;
    const next = getInlineRatingFromClientX(e.clientX);
    setMobileInlinePreviewRating(next);
    setLocalUserRating(next);
    setMobileSliderRating(next);
  }

  function handleInlineRatingPointerUp(e) {
    if (!mobileInlineTrackRef.current || !snippet || snippet.didRate || isOwnComment) return;
    const next = getInlineRatingFromClientX(e.clientX);
    if (mobileInlineTrackRef.current.hasPointerCapture(e.pointerId)) {
      mobileInlineTrackRef.current.releasePointerCapture(e.pointerId);
    }
    setMobileInlinePreviewRating(null);
    commitMobileRating(next);
  }

  // Sync mobileHasRated when snippet already has a rating
  useEffect(() => {
    if (snippet?.didRate && snippet?.userRating > 0) {
      setMobileHasRated(true);
      setMobileMyRating(snippet.userRating);
    }
  }, [snippet?.didRate, snippet?.userRating]);

  // Displayed rating numbers
  const displayedUserRating = Math.round(
    isHovering && !snippet?.didRate ? hoverRating : localUserRating
  );
  const hasAverageRating = Number.isFinite(snippet?.avgRating);
  const displayedAvgRating = hasAverageRating ? Math.round(snippet.avgRating) : null;
  const totalRatings = Number.isFinite(snippet?.totalRatings) ? snippet.totalRatings : 0;
  const interactionCount = Number.isFinite(comment?.interactionCount) && comment.interactionCount > 0
    ? Math.round(comment.interactionCount)
    : Math.max(0, Math.round((likeCount * 0.7) + (replyCount * 2.5) + (totalRatings * 0.45)));

  // Play/pause button
  function handlePlayPause(e) {
    e.preventDefault();
    e.stopPropagation();
    if (onPlayPause && snippet) {
      // If starting a new snippet, reset local progress
      const isDifferentSnippet =
        activeSnippet &&
        activeSnippet.snippetId?.toString() !== (snippet.commentId || snippet.id)?.toString();
      if (!isPlaying || isDifferentSnippet) {
        setLocalElapsedSeconds(0);
      }
      onPlayPause(snippet);
    }
  }

  // Is this snippet playing?
  const isThisSnippetPlaying =
    activeSnippet &&
    snippet &&
    activeSnippet.snippetId?.toString() === (snippet.commentId || snippet.id)?.toString() &&
    isPlaying;
  const hasPreview = Boolean(snippet?.previewUrl);
  const avatarSize = isMobile ? (isCompactPhone ? 38 : 42) : 48;
  const headerGap = isMobile ? (isCompactPhone ? 10 : 12) : 16;
  const mobileContentOffset = isMobile ? avatarSize + headerGap : 0;
  const mobileExpandedWidth = isMobile ? `calc(100% + ${mobileContentOffset}px)` : "100%";
  const isMobileRatingLocked = Boolean(snippet?.didRate || isOwnComment);
  const mobileInlineRatingValue = clampRating(
    mobileInlinePreviewRating ??
      (mobileHasRated && Number.isFinite(mobileMyRating) ? mobileMyRating : localUserRating)
  );
  const mobileInlineTrackLabel = isOwnComment
    ? "Your comment"
    : isMobileRatingLocked || mobileHasRated
      ? `Rated ${mobileInlineRatingValue}`
      : "Slide to rate";
  const mobileTimestamp = isMobile
    ? (() => {
        const resolvedMs = resolveCommentTimestampMs(comment);
        if (!resolvedMs) return timestamp;
        return new Date(resolvedMs).toLocaleDateString(undefined, {
          month: 'numeric',
          day: 'numeric',
          year: '2-digit',
        });
      })()
    : timestamp;
  const isNewsTheme = Boolean(isNewsThread) && !isParameterTheme;
  const cardBorderColor = isParameterTheme
    ? "1px solid rgba(0, 196, 180, 0.12)"
    : (isNewsTheme ? "1px solid rgba(232, 213, 168, 0.2)" : "1px solid rgba(255, 255, 255, 0.07)");
  const cardBackground = isNewsTheme ? "rgba(232, 213, 168, 0.04)" : "rgba(255, 255, 255, 0.03)";
  const topAccentGradient = isParameterTheme
    ? "linear-gradient(90deg, #00C4B4, #5eead4, #0d9488)"
    : (isNewsTheme
      ? "linear-gradient(90deg, rgba(232, 213, 168, 0.9), rgba(196, 168, 106, 0.95), rgba(232, 213, 168, 0.75))"
      : "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)");
  const metaTextColor = isNewsTheme ? "rgba(232, 213, 168, 0.72)" : "#94a3b8";
  const bodyTextColor = isNewsTheme ? "rgba(246, 236, 210, 0.92)" : "#e2e8f0";
  const actionBaseColor = isNewsTheme ? "rgba(232, 213, 168, 0.8)" : "#94a3b8";
  const accentActionColor = isNewsTheme ? NEWS_GOLD : "#6366f1";
  const likeActionColor = isNewsTheme ? NEWS_GOLD_DEEP : "#ec4899";

  if (!comment) {
    return null;
  }

  // Glassmorphic Editorial Design
  return (
    <div 
      className="thread-comment-card"
      style={{
      padding: isMobile ? (isCompactPhone ? "14px 12px" : "16px 14px") : "24px",
      backgroundColor: cardBackground,
      backgroundImage: "none",
      borderRadius: isMobile ? "16px" : "20px",
      marginBottom: isMobile ? "12px" : "16px",
      border: cardBorderColor,
      boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
      backdropFilter: "blur(12px)",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Subtle gradient accent at top — indigo to pink glassmorphic */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: topAccentGradient,
        zIndex: 1,
        borderTopLeftRadius: isMobile ? "16px" : "20px",
        borderTopRightRadius: isMobile ? "16px" : "20px",
        opacity: 0.7,
      }} />
      {isParameterTheme && (
        <>
          <div style={{
            position: "absolute",
            top: "-110px",
            right: "-80px",
            width: "260px",
            height: "260px",
            background: "radial-gradient(circle, rgba(0, 196, 180, 0.12) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }} />
          <div style={{
            position: "absolute",
            bottom: "-70px",
            left: "-60px",
            width: "220px",
            height: "220px",
            background: "radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }} />
        </>
      )}

      {/* Header with user info */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: `${headerGap}px`,
        marginBottom: isMobile ? "10px" : "16px",
        position: "relative",
        zIndex: 1,
      }}>
        <div onClick={(e) => e.stopPropagation()}>
          <ClickableUserAvatar
            user={commentUser}
            avatarSrc={commentUser.avatar}
            size={avatarSize}
            onUserClick={onUserClick}
          />
        </div>
        
        <div style={{
          flex: 1,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? "8px" : 0,
            marginBottom: isMobile ? "6px" : "4px",
            flexWrap: isMobile ? "nowrap" : "nowrap",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "6px" : "8px",
              minWidth: 0,
              flex: 1,
            }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onUserClick) onUserClick(commentUser);
                }}
                style={{
                  fontSize: isMobile ? "14px" : "17px",
                  fontWeight: "600",
                  color: isNewsTheme ? "#fff8e9" : "#f1f5f9",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  minWidth: 0,
                  textAlign: "left",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {commentUser.displayName}
              </button>
              {usernameDotColor && (
                <span
                  aria-hidden="true"
                  style={{
                    width: isMobile ? "7px" : "9px",
                    height: isMobile ? "7px" : "9px",
                    borderRadius: "50%",
                    backgroundColor: usernameDotColor,
                    boxShadow: `0 0 10px ${usernameDotColor}`,
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
            <div style={{
              fontSize: isMobile ? "12px" : "14px",
              color: metaTextColor,
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginTop: isMobile ? "1px" : 0,
            }}>
              {mobileTimestamp}
            </div>
          </div>
          
          <div style={{
            fontSize: isMobile ? "14px" : "15px",
            lineHeight: isMobile ? "1.5" : "1.6",
            color: bodyTextColor,
            marginBottom: isMobile ? "12px" : "20px",
            paddingRight: isMobile ? "0" : "20px",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}>
            {comment.body || ''}
          </div>

          {/* Loading skeleton for snippet - show when loading and no snippet yet */}
          {!isNewsThread && snippetsLoading && !snippet && (
            <div style={{
              display: "flex",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderRadius: isMobile ? "14px" : "16px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              marginBottom: isMobile ? "12px" : "16px",
              ...(isMobile ? {
                width: mobileExpandedWidth,
                marginLeft: `-${mobileContentOffset}px`,
              } : null),
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}>
              {/* Skeleton album art */}
              <div style={{
                width: "140px",
                height: "140px",
                backgroundColor: "rgba(99, 102, 241, 0.08)",
                position: "relative",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <div style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Music size={24} color="rgba(99, 102, 241, 0.5)" />
                </div>
              </div>
              
              {/* Skeleton content */}
              <div style={{
                flex: 1,
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}>
                {/* Skeleton title */}
                <div>
                  <div style={{
                    height: "20px",
                    width: "60%",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "4px",
                    marginBottom: "8px",
                  }} />
                  <div style={{
                    height: "16px",
                    width: "40%",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "4px",
                    marginBottom: "12px",
                  }} />
                </div>
                
                {/* Skeleton progress bar */}
                <div style={{
                  marginBottom: "12px",
                }}>
                  <div style={{
                    width: "100%",
                    height: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "2px",
                  }} />
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "6px",
                  }}>
                    <div style={{
                      height: "12px",
                      width: "20px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "2px",
                    }} />
                    <div style={{
                      height: "12px",
                      width: "20px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "2px",
                    }} />
                  </div>
                </div>
                
                {/* Skeleton rating info */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{
                    height: "28px",
                    width: "80px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "20px",
                  }} />
                  <div style={{
                    display: "flex",
                    gap: "16px",
                  }}>
                    <div style={{
                      height: "40px",
                      width: "50px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "4px",
                    }} />
                    <div style={{
                      height: "40px",
                      width: "50px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "4px",
                    }} />
                  </div>
                </div>
              </div>
              
              {/* Skeleton rating bar */}
              <div style={{
                width: "50px",
                borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                padding: "8px 0",
              }}>
                <div style={{
                  width: "16px",
                  height: "80px",
                  backgroundColor: "rgba(99, 102, 241, 0.08)",
                  borderRadius: "8px",
                }} />
              </div>
              
              {/* Add pulse animation via style tag */}
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.6; }
                }
              `}</style>
            </div>
          )}

          {/* Song snippet section - with larger side album art */}
          {!isNewsThread && snippet && (
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderRadius: isMobile ? "14px" : "16px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              marginBottom: isMobile ? "12px" : "16px",
              ...(isMobile ? {
                width: mobileExpandedWidth,
                marginLeft: `-${mobileContentOffset}px`,
              } : null),
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)"
            }}>
              {/* Album art + song info row on mobile */}
              {isMobile ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isCompactPhone ? "9px" : "10px",
                  padding: isCompactPhone ? "10px" : "11px",
                }}>
                  {/* Small album art on mobile */}
                  <div style={{
                    width: isCompactPhone ? "50px" : "54px",
                    height: isCompactPhone ? "50px" : "54px",
                    backgroundColor: "#0a0e1a",
                    borderRadius: "10px",
                    overflow: "hidden",
                    flexShrink: 0,
                    position: "relative",
                  }}>
                    {formattedArtwork && formattedArtwork !== "/assets/default-artist.png" ? (
                      <img 
                        src={formattedArtwork}
                        alt="Album artwork"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/assets/default-artist.png";
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                      }}>
                        <Music size={24} color="#6366f1" />
                      </div>
                    )}
                    {!isFirstSnippet && (
                      <button
                        type="button"
                        onClick={handlePlayPause}
                        disabled={!hasPreview}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: isCompactPhone ? "28px" : "30px",
                          height: isCompactPhone ? "28px" : "30px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(99, 102, 241, 0.85)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          cursor: hasPreview ? "pointer" : "not-allowed",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                          opacity: hasPreview ? 1 : 0.55,
                        }}
                      >
                        {isThisSnippetPlaying ? (
                          <Pause size={16} color="#ffffff" />
                        ) : (
                          <Play size={16} color="#ffffff" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Song title + artist */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      marginBottom: "2px",
                    }}>
                      <Music size={11} color="#6366f1" />
                      <div style={{
                        fontSize: isCompactPhone ? "13px" : "14px",
                        fontWeight: "600",
                        color: "#ffffff",
                        lineHeight: 1.25,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {snippet.name || 'Unknown track'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: isCompactPhone ? "11px" : "12px",
                      color: "#94a3b8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {snippet.artistName || 'Unknown artist'}
                    </div>
                    {!hasPreview && !isFirstSnippet && (
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                        Preview unavailable
                      </div>
                    )}
                  </div>
                </div>
              ) : (
              <>
              {/* Large album art on left — DESKTOP */}
              <div style={{
                width: "140px",
                height: "140px",
                backgroundColor: "#0a0e1a",
                position: "relative",
                flexShrink: 0
              }}>
                {/* Display actual album artwork if available */}
                {formattedArtwork && formattedArtwork !== "/assets/default-artist.png" ? (
                  <img 
                    src={formattedArtwork}
                    alt="Album artwork"
                    onError={(e) => {
                      
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/assets/default-artist.png";
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}>
                    <Music size={40} color="#6366f1" />
                  </div>
                )}
                
                {!isFirstSnippet && (
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    disabled={!hasPreview}
                    title={hasPreview ? "Play preview" : "Preview unavailable"}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "54px",
                      height: "54px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(99, 102, 241, 0.85)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "none",
                      cursor: hasPreview ? "pointer" : "not-allowed",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
                      transition: "transform 0.2s",
                      opacity: hasPreview ? 1 : 0.55,
                    }}
                  >
                    {isThisSnippetPlaying ? (
                      <Pause size={28} color="#ffffff" />
                    ) : (
                      <Play size={28} color="#ffffff" />
                    )}
                  </button>
                )}
              </div>
              
              {/* Song details and controls */}
              <div style={{
                flex: 1,
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}>
                {/* Song title and artist */}
                <div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px"
                  }}>
                    <Music size={14} color="#6366f1" />
                    <div style={{
                      fontSize: "17px",
                      fontWeight: "600",
                      color: "#ffffff",
                    }}>
                      {snippet.name || 'Unknown track'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "14px",
                    color: "#94a3b8",
                    marginBottom: "12px",
                  }}>
                    {snippet.artistName || 'Unknown artist'}
                  </div>
                  {!hasPreview && !isFirstSnippet && (
                    <div style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginBottom: "12px",
                    }}>
                      Preview unavailable.
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                <div style={{
                  marginBottom: "12px",
                }}>
                  <div style={{
                    width: "100%",
                    height: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "2px",
                    overflow: "hidden",
                    position: "relative",
                  }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${getProgressPercent()}%`,
                        background: "linear-gradient(to right, #6366f1, #8b5cf6)",
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    color: "#94a3b8",
                    marginTop: "6px",
                  }}>
                    <span>{isThisSnippetPlaying ? `${localElapsedSeconds}s` : '0s'}</span>
                    <span>30s</span>
                  </div>
                </div>
                
                {/* Rating info */}
                {/* Rating info */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}}>

  {/* 1) Total users on far left */}
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }}>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      padding: "6px 10px",
      borderRadius: "20px",
    }}>
      <Users size={14} color="#6366f1" />
      <span style={{ fontSize: "13px", color: "#e2e8f0" }}>
        {totalRatings > 0 ? `${totalRatings} users` : "No ratings yet"}
      </span>
    </div>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      padding: "6px 10px",
      borderRadius: "20px",
    }}>
      <Activity size={14} color="#38bdf8" />
      <span style={{ fontSize: "13px", color: "#e2e8f0" }}>
        {interactionCount} interactions
      </span>
    </div>
  </div>

  {/* 2) Avg and Your Rating grouped on the right */}
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "24px",    // spacing between Avg and Your
  }}>
    {/* Average rating */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{
        fontSize: "22px",
        fontWeight: "600",
        color: "#6366f1",
      }}>
        {displayedAvgRating ?? "—"}
      </div>
      <div style={{
        fontSize: "12px",
        color: "#94a3b8",
      }}>
        Avg Rating
      </div>
    </div>

    {/* Your rating (stays in that spot) */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{
        fontSize: "22px",
        fontWeight: "600",
        color: "#6366f1",
      }}>
        {displayedUserRating}
      </div>
      <div style={{
        fontSize: "12px",
        color: "#94a3b8",
      }}>
        {snippet.didRate ? "Your Rating" : "Rate"}
      </div>
    </div>
  </div>
</div>


              </div>

              {/* Rating bar on the right */}
              {/* Rating bar on the right */}
<div style={{
  position: "relative",           // <-- allow absolute children
  width: "50px",
  borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255, 255, 255, 0.02)",
  padding: "8px 0",
}}>
  {/* info icon */}
  <div style={{
    position: "absolute",
    top: "4px",
    right: "-8px",
    zIndex: 2,
  }}>
{isFirstSnippet && (
      <InfoIconModal
        modalId={`thread-comment-rating-bar-info-${comment?.id || 'unknown'}`}
        title="Vertical Rating Bar"
        iconSize={28}
        showButtonText={false}
        steps={[
          {
            icon: <BarChart3 size={18} color="#a9b6fc" />,
            title: "Rate While Listening",
            content: "While listening to a snippet, use this bar to give the song a rating out of 100"
          },
          {
            icon: <Users size={18} color="#a9b6fc" />,
            title: "See Community Stats",
            content: "Then see the average and the amount of users who rated that song"
          },
          {
            icon: <Music size={18} color="#a9b6fc" />,
            title: "Listen Time Matters",
            content: "The app tracks how long you've listened, so the more you listen, the more impactful your rating will be."
          }
        ]}
      />
    )}
  </div>

  {/* your existing bar */}
  <div style={{
    height: "100px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}>
    <div 
      style={{
        width: "16px",
        height: "80%",
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        borderRadius: "8px",
        position: "relative",
        overflow: "hidden",
        cursor: (snippet?.didRate || isOwnComment) ? "default" : "pointer",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
      onClick={handleRatingClick}
      onMouseMove={handleRatingHover}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: `${(isHovering && !snippet.didRate ? hoverRating : localUserRating)}%`,
          backgroundImage: "linear-gradient(to top, #6366f1, #8b5cf6)",
          borderRadius: "7px",
        }}
      />
    </div>
  </div>

  {ratedTimestamp !== null && (
    <div style={{
      fontSize: "12px",
      color: "#94a3b8",
      textAlign: "center",
    }}>
      Rated at {ratedTimestamp}s
    </div>
  )}
</div>

              </>
              )}

              {/* Mobile: progress bar + stats row inside snippet container */}
              {isMobile && (
                <>
                  {/* Progress bar on mobile */}
                  <div style={{ padding: "0 12px 8px" }}>
                    <div style={{
                      width: "100%",
                      height: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "2px",
                      overflow: "hidden",
                      position: "relative",
                    }}>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${getProgressPercent()}%`,
                          background: "linear-gradient(to right, #6366f1, #8b5cf6)",
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: isCompactPhone ? "10px" : "11px",
                      color: "#64748b",
                      marginTop: "4px",
                    }}>
                      <span>{isThisSnippetPlaying ? `${localElapsedSeconds}s` : '0s'}</span>
                      <span>30s</span>
                    </div>
                  </div>

                  {/* Me / Avg / Ratings row — always visible on mobile */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: isCompactPhone ? "7px 10px" : "8px 12px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                    background: "rgba(99, 102, 241, 0.04)",
                  }}>
                    <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: isCompactPhone ? "10px" : "11px",
                        color: "#64748b",
                        marginBottom: "2px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}>Me</div>
                      <div style={{
                        fontSize: isCompactPhone ? "15px" : "16px",
                        fontWeight: "700",
                        color: "#818cf8",
                      }}>
                        {mobileHasRated ? mobileMyRating : "—"}
                      </div>
                    </div>
                    <div style={{ width: "1px", background: "rgba(255, 255, 255, 0.06)" }} />
                    <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: isCompactPhone ? "10px" : "11px",
                        color: "#64748b",
                        marginBottom: "2px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}>Avg</div>
                      <div style={{
                        fontSize: isCompactPhone ? "15px" : "16px",
                        fontWeight: "700",
                        color: "#e2e8f0",
                      }}>
                        {displayedAvgRating ?? "—"}
                      </div>
                    </div>
                    <div style={{ width: "1px", background: "rgba(255, 255, 255, 0.06)" }} />
                    <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: isCompactPhone ? "10px" : "11px",
                        color: "#64748b",
                        marginBottom: "2px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}>Ratings</div>
                      <div style={{
                        fontSize: isCompactPhone ? "15px" : "16px",
                        fontWeight: "700",
                        color: "#e2e8f0",
                      }}>
                        {totalRatings > 0 ? totalRatings : "—"}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: isCompactPhone ? "8px 10px 10px" : "9px 12px 11px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                    background: "rgba(99, 102, 241, 0.03)",
                  }}>
                    <div
                      ref={mobileInlineTrackRef}
                      onPointerDown={handleInlineRatingPointerDown}
                      onPointerMove={handleInlineRatingPointerMove}
                      onPointerUp={handleInlineRatingPointerUp}
                      onPointerCancel={handleInlineRatingPointerUp}
                      style={{
                        width: "100%",
                        height: isCompactPhone ? "26px" : "28px",
                        position: "relative",
                        cursor: isMobileRatingLocked ? "default" : "pointer",
                        touchAction: "none",
                        userSelect: "none",
                        display: "flex",
                        alignItems: "center",
                        opacity: isMobileRatingLocked ? 0.85 : 1,
                      }}
                    >
                      <div style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        height: "6px",
                        borderRadius: "999px",
                        background: "rgba(255, 255, 255, 0.09)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }} />
                      <div style={{
                        position: "absolute",
                        left: 0,
                        height: "6px",
                        borderRadius: "999px",
                        width: `${mobileInlineRatingValue}%`,
                        backgroundImage: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%)",
                        boxShadow: "0 0 10px rgba(99, 102, 241, 0.35)",
                        transition: "width 0.08s linear",
                      }} />
                      <div style={{
                        position: "absolute",
                        left: `${mobileInlineRatingValue}%`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: isCompactPhone ? "16px" : "18px",
                        height: isCompactPhone ? "16px" : "18px",
                        borderRadius: "50%",
                        background: "linear-gradient(180deg, #a5b4fc, #6366f1)",
                        border: "2px solid rgba(255,255,255,0.9)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                        transition: "left 0.08s linear",
                      }} />
                    </div>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "4px",
                    }}>
                      <span style={{
                        fontSize: isCompactPhone ? "10px" : "11px",
                        color: "#7c8ba3",
                        letterSpacing: "0.03em",
                      }}>
                        {mobileInlineTrackLabel}
                      </span>
                      <span style={{
                        fontSize: isCompactPhone ? "11px" : "12px",
                        fontWeight: "700",
                        color: "#c7d2fe",
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {mobileInlineRatingValue}
                      </span>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}
          
          {/* Actions row */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: isNewsTheme ? "1px solid rgba(232, 213, 168, 0.16)" : "1px solid rgba(255, 255, 255, 0.06)",
            paddingTop: isMobile ? "10px" : "14px",
            ...(isMobile ? {
              width: mobileExpandedWidth,
              marginLeft: `-${mobileContentOffset}px`,
              paddingLeft: isCompactPhone ? "2px" : "4px",
              paddingRight: isCompactPhone ? "2px" : "4px",
            } : null),
          }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: hoveredAction === 'comment' ? '#ffffff' : actionBaseColor,
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: isMobile ? "8px 6px" : "8px 12px",
                borderRadius: "8px",
                transition: "color 0.2s ease",
                minWidth: isMobile ? (isCompactPhone ? "48px" : "52px") : "auto",
                justifyContent: "center",
              }}
              onMouseEnter={() => setHoveredAction('comment')}
              onMouseLeave={() => setHoveredAction(null)}
            >
              <MessageCircle size={18} />
              <span>{replyCount}</span>
            </button>
            
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: isLiked || hoveredAction === 'like' ? likeActionColor : actionBaseColor,
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: isMobile ? "8px 6px" : "8px 12px",
                borderRadius: "8px",
                transition: "color 0.2s ease",
                minWidth: isMobile ? (isCompactPhone ? "48px" : "52px") : "auto",
                justifyContent: "center",
              }}
              onMouseEnter={() => setHoveredAction('like')}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart
                size={18}
                fill={isLiked ? likeActionColor : "none"}
              />
              <span>{likeCount}</span>
            </button>
            
            {/* Share button — desktop only */}
            {!isMobile && (
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: hoveredAction === 'share' ? '#ffffff' : actionBaseColor,
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={() => setHoveredAction('share')}
                onMouseLeave={() => setHoveredAction(null)}
              >
                <Share2 size={18} />
              </button>
            )}

            {/* Rate button — mobile only, replaces Share */}
            {isMobile && snippet && (
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: mobileHasRated
                    ? accentActionColor
                    : ratingExpanded
                      ? (isNewsTheme ? '#f3dfb8' : '#a5b4fc')
                      : hoveredAction === 'rate' ? '#ffffff' : actionBaseColor,
                  backgroundColor: ratingExpanded || mobileHasRated
                    ? (isNewsTheme ? "rgba(232, 213, 168, 0.12)" : "rgba(99, 102, 241, 0.1)")
                    : "transparent",
                  border: "none",
                  cursor: (mobileHasRated || isOwnComment) ? "default" : "pointer",
                  padding: isMobile ? "8px 6px" : "8px 12px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                  fontSize: isMobile ? "13px" : "14px",
                  minWidth: isMobile ? (isCompactPhone ? "48px" : "52px") : "auto",
                  justifyContent: "center",
                }}
                onMouseEnter={() => setHoveredAction('rate')}
                onMouseLeave={() => setHoveredAction(null)}
                onClick={() => {
                  if (!mobileHasRated && !snippet.didRate && !isOwnComment) {
                    setRatingExpanded(!ratingExpanded);
                  }
                }}
              >
                <span>{mobileHasRated ? mobileMyRating : 'Rate'}</span>
              </button>
            )}
            
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: isSaved || hoveredAction === 'bookmark' ? accentActionColor : actionBaseColor,
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: isMobile ? "8px 6px" : "8px 12px",
                borderRadius: "8px",
                transition: "color 0.2s ease",
                minWidth: isMobile ? (isCompactPhone ? "48px" : "52px") : "auto",
                justifyContent: "center",
              }}
              onMouseEnter={() => setHoveredAction('bookmark')}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => setIsSaved(!isSaved)}
            >
              <Bookmark
                size={18}
                fill={isSaved ? accentActionColor : "none"}
              />
            </button>
          </div>

          {/* Expandable horizontal rating slider — mobile only */}
          {isMobile && snippet && ratingExpanded && !mobileHasRated && (
            <div style={{
              marginTop: "10px",
              padding: "14px",
              background: "rgba(0, 0, 0, 0.25)",
              borderRadius: "12px",
              border: "1px solid rgba(99, 102, 241, 0.12)",
              width: mobileExpandedWidth,
              marginLeft: `-${mobileContentOffset}px`,
            }}>
              {/* Rating value display */}
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                marginBottom: "10px",
              }}>
                <span style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#6366f1",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}>{mobileSliderRating}</span>
              </div>

              {/* Horizontal slider track */}
              <div
                ref={sliderTrackRef}
                onPointerDown={handleMobileSliderPointerDown}
                onPointerMove={handleMobileSliderPointerMove}
                onPointerUp={handleMobileSliderPointerUp}
                onPointerCancel={handleMobileSliderPointerUp}
                style={{
                  width: "100%",
                  height: "32px",
                  position: "relative",
                  cursor: "pointer",
                  touchAction: "none",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Track background */}
                <div style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: "6px",
                  borderRadius: "3px",
                  background: "rgba(255, 255, 255, 0.06)",
                }} />
                {/* Filled track */}
                <div style={{
                  position: "absolute",
                  left: 0,
                  height: "6px",
                  borderRadius: "3px",
                  width: `${mobileSliderRating}%`,
                  backgroundImage: "linear-gradient(to right, #6366f1, #8b5cf6)",
                  boxShadow: "0 0 12px rgba(99, 102, 241, 0.3)",
                  transition: "width 0.05s linear",
                }} />
                {/* Thumb */}
                <div style={{
                  position: "absolute",
                  left: `${mobileSliderRating}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundImage: "linear-gradient(to top, #6366f1, #8b5cf6)",
                  border: "2px solid #fff",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4), 0 0 16px rgba(99, 102, 241, 0.35)",
                }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadCommentCard;
