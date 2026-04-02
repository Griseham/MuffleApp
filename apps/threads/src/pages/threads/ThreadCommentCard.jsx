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
  snippetsLoading = false // NEW: Loading state for snippets
}) => {
  const commentUser = buildCommentUser(comment);
  const isOwnComment = isCurrentUserAuthor(comment);

  // State for interaction
  const [hoveredAction, setHoveredAction] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Snippet states
  const [localUserRating, setLocalUserRating] = useState(0);
  const [ratedTimestamp, setRatedTimestamp] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Local progress timer
  const [localElapsedSeconds, setLocalElapsedSeconds] = useState(0);
  const timeIntervalRef = useRef(null);

  // Use stable primitive keys so effects don't retrigger on every render
  const snippetIdStr = snippet?.id?.toString() ?? "";
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
  const timestamp = comment?.createdUtc
    ? new Date(comment.createdUtc * 1000).toLocaleString()
    : "";

  // Initialize/sync local rating from snippet (primitive deps only)
  useEffect(() => {
    const next = snippet?.userRating || 0;
    setLocalUserRating((prev) => (prev === next ? prev : next));
  }, [snippet?.id, snippet?.userRating]);

  // Get the current progress percentage for the progress bar
  const getProgressPercent = () => {
    if (!snippet) return 0;
    
    const snippetId = snippet.id?.toString();
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
        activeSnippet.snippetId?.toString() !== snippet.id?.toString();
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
    activeSnippet.snippetId?.toString() === snippet.id?.toString() &&
    isPlaying;
  const hasPreview = Boolean(snippet?.previewUrl);

  if (!comment) {
    return null;
  }

  // Glassmorphic Editorial Design
  return (
    <div 
      className="thread-comment-card"
      style={{
      padding: "24px",
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      backgroundImage: "none",
      borderRadius: "20px",
      marginBottom: "16px",
      border: "1px solid rgba(255, 255, 255, 0.07)",
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
        background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)",
        zIndex: 1,
        borderTopLeftRadius: "20px",
        borderTopRightRadius: "20px",
        opacity: 0.7,
      }} />

      {/* Header with user info */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "16px",
      }}>
        <div onClick={(e) => e.stopPropagation()}>
          <ClickableUserAvatar
            user={commentUser}
            avatarSrc={commentUser.avatar}
            size={48}
            onUserClick={onUserClick}
          />
        </div>
        
        <div style={{
          flex: 1,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onUserClick) onUserClick(commentUser);
              }}
              style={{
                fontSize: "17px",
                fontWeight: "600",
                color: "#f1f5f9",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              {commentUser.displayName}
            </button>
            <div style={{
              fontSize: "14px",
              color: "#94a3b8",
            }}>
              {timestamp || "Unknown time"}
            </div>
          </div>
          
          <div style={{
            fontSize: "15px",
            lineHeight: "1.6",
            color: "#e2e8f0",
            marginBottom: "20px",
            paddingRight: "20px"
          }}>
            {comment.body || ''}
          </div>

          {/* Loading skeleton for snippet - show when loading and no snippet yet */}
          {!isNewsThread && snippetsLoading && !snippet && (
            <div style={{
              display: "flex",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              marginBottom: "16px",
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
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              marginBottom: "16px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)"
            }}>
              {/* Large album art on left */}
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
                      console.log("ThreadCommentCard: Image failed to load:", formattedArtwork);
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
                  {!hasPreview && (
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

            </div>
          )}
          
          {/* Actions row */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            paddingTop: "14px",
          }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: hoveredAction === 'comment' ? '#ffffff' : '#94a3b8',
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "8px",
                transition: "color 0.2s ease",
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
                color: isLiked || hoveredAction === 'like' ? '#ec4899' : '#94a3b8',
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "8px",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={() => setHoveredAction('like')}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart
                size={18}
                fill={isLiked ? "#ec4899" : "none"}
              />
              <span>{likeCount}</span>
            </button>
            
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: hoveredAction === 'share' ? '#ffffff' : '#94a3b8',
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
            
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: isSaved || hoveredAction === 'bookmark' ? '#6366f1' : '#94a3b8',
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "8px",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={() => setHoveredAction('bookmark')}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => setIsSaved(!isSaved)}
            >
              <Bookmark
                size={18}
                fill={isSaved ? "#6366f1" : "none"}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadCommentCard;
