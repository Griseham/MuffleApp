import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Pause,
  Users,
  ArrowUp,
  Music,
  BarChart3
} from 'lucide-react';
import InfoIconModal from '../InfoIconModal';


function authorToAvatar(author) {
  if (!author || author === 'You') {
    return '/assets/user.png';
  }
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `/assets/image${(Math.abs(hash) % 1000) + 1}.png`;
}

function getRandomTimestamp() {
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  
  let timeStr = '';
  if (randomHours > 0) {
    timeStr += `${randomHours}h`;
  }
  if (randomMinutes > 0 || timeStr === '') {
    if (timeStr !== '') timeStr += ' ';
    timeStr += `${randomMinutes}m`;
  }
  return timeStr;
}

const ThreadCommentCard = ({
  comment,
  snippet,
  isPlaying,
  activeSnippet,
  onPlayPause,
  onRate,
  onRatingPause,
  isFirstSnippet, // Add this prop
  isNewsThread = false, // Add news thread prop
  snippetsLoading = false // NEW: Loading state for snippets
}) => {
  // Random timestamp for the comment
  const [randomTime] = useState(() => getRandomTimestamp());

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
      const API_BASE = import.meta.env?.VITE_API_BASE_URL || "http://localhost:4000";
      formattedUrl = `${API_BASE}${formattedUrl}`;
    }
    
    return formattedUrl;
  };

  // Get the properly formatted artwork URL
  const formattedArtwork = snippet ? getFormattedArtworkUrl(snippet) : null;

  // DEBUG: Log snippet artwork when component renders with a snippet
  if (snippet) {
    console.log(`ThreadCommentCard: Rendering snippet for comment ${comment?.id}:`, {
      snippetId: snippet.id,
      songName: snippet.name || snippet.songName,
      rawArtwork: snippet.artwork,
      rawArtworkUrl: snippet.artworkUrl,
      formattedArtwork: formattedArtwork,
    });
  }

  if (!comment) {
    return null;
  }

  // Use consistent stats for likes and replies to prevent re-renders
  const [likeCount] = useState(() => {
    if (comment.likes) return comment.likes;
    // Generate consistent random likes based on comment ID/author
    let hash = 0;
    const seedString = comment.id || comment.author || 'default';
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.floor((Math.abs(hash) % 150) + 5); // 5-154 likes
  });
  
  const [replyCount] = useState(() => {
    if (comment.replies) {
      return typeof comment.replies === 'number' ? comment.replies : comment.replies.length || 0;
    }
    // Generate consistent random replies based on comment ID/author
    let hash = 0;
    const seedString = (comment.id || comment.author || 'default') + '_replies';
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.floor((Math.abs(hash) % 25) + 1); // 1-25 replies
  });

  // Basic user/timestamp
  const username = comment.author
    ? comment.author.toLowerCase().replace(/\s/g, '')
    : 'unknown';
  const timestamp = comment.createdUtc
    ? new Date(comment.createdUtc * 1000).toLocaleString()
    : randomTime;

  // Convert rating [0..100] → fraction [0..1]
  function toFraction(val) {
    return Math.max(0, Math.min(val || 0, 100)) / 100;
  }

  // Local fraction states
  const fracUser = toFraction(
    isHovering && !snippet?.didRate ? hoverRating : localUserRating
  );

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
    if (!snippet || snippet.didRate || comment.author === 'You') return;

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
    if (!snippet || snippet.didRate || comment.author === 'You') return;
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
  const displayedAvgRating = Math.round(snippet?.avgRating || 0);

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

  // Modern Side Album Art Design
  return (
    <div 
      className="thread-comment-card"
      style={{
      padding: "24px",
      backgroundColor: "rgba(15, 23, 42, 0.8)",
      backgroundImage: "linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))",
      borderRadius: "16px",
      marginBottom: "16px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Subtle gradient accent at top */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)",
        zIndex: 1,
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px"
      }} />

      {/* Header with user info */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "16px",
      }}>
        <img
          src={authorToAvatar(comment.author)}
          alt={`${comment.author || 'Unknown'}'s avatar`}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            flexShrink: 0,
          }}
        />
        
        <div style={{
          flex: 1,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}>
            <div style={{
              fontSize: "17px",
              fontWeight: "600",
              color: "#ffffff",
            }}>
              {comment.author || 'Unknown'}
            </div>
            <div style={{
              fontSize: "14px",
              color: "#94a3b8",
            }}>
              {timestamp}
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
              backgroundColor: "rgba(15, 23, 42, 0.5)",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "16px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}>
              {/* Skeleton album art */}
              <div style={{
                width: "140px",
                height: "140px",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
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
                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Music size={24} color="rgba(59, 130, 246, 0.5)" />
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
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
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
              backgroundColor: "rgba(15, 23, 42, 0.5)",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "16px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)"
            }}>
              {/* Large album art on left */}
              <div style={{
                width: "140px",
                height: "140px",
                backgroundColor: "#0f172a",
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
                    <Music size={40} color="#3b82f6" />
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={handlePlayPause}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(59, 130, 246, 0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
                    transition: "transform 0.2s",
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
                    <Music size={14} color="#3b82f6" />
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
                        background: "linear-gradient(to right, #1d4ed8, #3b82f6)",
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
    gap: "10px",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    padding: "6px 10px",
    borderRadius: "20px",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <Users size={14} color="#3b82f6" />
      <span style={{ fontSize: "13px", color: "#e2e8f0" }}>
        {snippet.totalRatings || (() => {
          // Generate consistent random user count for this snippet
          let hash = 0;
          const seedString = snippet.id || snippet.commentId || 'default';
          for (let i = 0; i < seedString.length; i++) {
            hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
          }
          return 10 + Math.floor((Math.abs(hash) % 31)); // 10-40 users
        })()} users
      </span>
    </div>
    <div style={{
      width: "1px",
      height: "14px",
      backgroundColor: "rgba(226, 232, 240, 0.2)",
    }} />
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <BarChart3 size={16} color="#94a3b8" />
      <span style={{ fontSize: "13px", color: "#e2e8f0" }}>
        {(() => {
          // Generate consistent random view count for this snippet (20-500)
          let hash = 0;
          const seedString = `${snippet.id || snippet.commentId || 'default'}_views`;
          for (let i = 0; i < seedString.length; i++) {
            hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
          }
          return 20 + Math.floor((Math.abs(hash) % 481));
        })()}
      </span>
      <span style={{ fontSize: "12px", color: "#94a3b8" }}>interactions</span>
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
        color: "#3b82f6",
      }}>
        {displayedAvgRating}
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
        color: "#3b82f6",
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
  backgroundColor: "rgba(15, 23, 42, 0.4)",
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
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderRadius: "8px",
        position: "relative",
        overflow: "hidden",
        cursor: (snippet?.didRate || comment.author === 'You') ? "default" : "pointer",
        border: "1px solid rgba(255, 255, 255, 0.1)",
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
          backgroundImage: "linear-gradient(to top, #1d4ed8, #3b82f6)",
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
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
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
                color: isSaved || hoveredAction === 'bookmark' ? '#3b82f6' : '#94a3b8',
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
                fill={isSaved ? "#3b82f6" : "none"}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadCommentCard;
