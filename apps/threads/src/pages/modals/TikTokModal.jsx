// src/components/TikTokModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { FiArrowLeft, FiHeart, FiMessageCircle, FiBookmark, FiShare, FiArrowUp, FiArrowDown, FiPlay, FiPause } from "react-icons/fi";
import { getAvatarSrc } from '../posts/postCardUtils';
import { Music, Headphones, Users } from 'lucide-react';

export default function TikTokModal({ 
  snippets = [], 
  comments = [], 
  onClose, 
  audioRef, 
  isPlaying, 
  activeSnippet, 
  playOrPauseSnippet, 
  onUserRate, 
  startIndex = 0, 
  threadTitle = "Thread" 
}) {
  // Generate consistent engagement values based on snippet ID
  const getEngagementValues = (snippetId) => {
    if (!snippetId) return { likes: 50, comments: 2, bookmarks: 14 };
    
    // Create a simple hash from the snippet ID for consistent values
    let hash = 0;
    const idStr = snippetId.toString();
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate consistent values using the hash
    const likes = Math.abs(hash % 200) + 50; // 50-249
    const commentsCount = Math.abs(hash % 20) + 2; // 2-21
    const bookmarks = Math.abs(hash % 20) + 14; // 14-33
    
    return { likes, comments: commentsCount, bookmarks };
  };
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [loading, setLoading] = useState(false);
  const [modalIsPlaying, setModalIsPlaying] = useState(false);
  const [currentSnippetId, setCurrentSnippetId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(25);
  const [likedSnippets, setLikedSnippets] = useState(new Set());
  const [isHovering, setIsHovering] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  
  const containerRef = useRef(null);
  const modalRef = useRef(null);
  
  // Lock background scroll while modal is open and cleanup audio on unmount
  useEffect(() => {
    return () => {
      // Stop audio when modal is closed/unmounted
      if (audioRef.current && modalIsPlaying) {
        audioRef.current.pause();
        setModalIsPlaying(false);
        setAudioProgress(0);
      }
    };
  }, [modalIsPlaying]);

  // Add minimal required animations
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes modalAppear {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      
      .modal-wrapper {
        animation: modalAppear 0.2s ease-out forwards;
      }
      
      .track-container {
        transition: opacity 0.15s ease;
      }
      
      .play-button {
        transition: transform 0.2s ease;
      }
      
      .play-button:hover {
        transform: scale(1.05);
      }
      
      .rating-bar {
        transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .rating-marker {
        transition: all 0.3s ease;
      }
    `;
    
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Track audio progress
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        const progress = (audio.currentTime / audio.duration) * 30 || 0;
        setAudioProgress(progress);
      };
      
      const handleEnded = () => {
        setModalIsPlaying(false);
        setAudioProgress(0);
        
        // Auto-advance to next snippet
        if (currentIndex < snippets.length - 1) {
          setTimeout(() => handleSwipe("up"), 500);
        }
      };
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentIndex, snippets.length, audioRef]);
  
  // Handle swiping to change snippets
  const handleSwipe = (direction) => {
    // Stop current audio when switching songs
    if (audioRef.current && modalIsPlaying) {
      audioRef.current.pause();
      setModalIsPlaying(false);
      setAudioProgress(0);
    }
    
    if (direction === "up" && currentIndex < snippets.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentSnippetId(null);
    } else if (direction === "down" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentSnippetId(null);
    }
    
    // Simple fade transition
    if (containerRef.current) {
      containerRef.current.style.opacity = '0';
      setTimeout(() => {
        containerRef.current.style.opacity = '1';
      }, 150);
    }
  };
  
  // Handle play/pause of snippet
  const togglePlay = (snippetId) => {
    const currentSnippet = snippets[currentIndex];
    if (!currentSnippet) return;
    
    const previewUrl = currentSnippet.snippetData?.attributes?.previews?.[0]?.url || 
                       currentSnippet.previewUrl || 
                       "/backend/public/HeartShapedBox.mp3";
    
    if (snippetId === currentSnippetId && modalIsPlaying) {
      audioRef.current?.pause();
      setModalIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current.src = previewUrl;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setCurrentSnippetId(snippetId);
          setModalIsPlaying(true);
          setAudioProgress(0);
        })
        .catch(err => {
          setModalIsPlaying(false);
        });
    }
  };
  
  // Handle closing modal with audio cleanup
  const handleClose = () => {
    // Stop audio before closing
    if (audioRef.current && modalIsPlaying) {
      audioRef.current.pause();
      setModalIsPlaying(false);
      setAudioProgress(0);
    }
    
    // Call parent's onClose
    if (onClose) {
      onClose();
    }
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') {
        handleSwipe('down');
      } else if (e.key === 'ArrowDown') {
        handleSwipe('up');
      } else if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === ' ') {
        if (currentSnippet?.commentId) {
          togglePlay(currentSnippet.commentId);
        }
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, snippets, handleClose]);
  
  // Get current snippet
  const currentSnippet = snippets[currentIndex] || null;
  
  // Toggle favorite state for current snippet
  const toggleFavorite = () => {
    if (!currentSnippet) return;
    
    setLikedSnippets(prev => {
      const newLiked = new Set(prev);
      const snippetId = currentSnippet.commentId || currentSnippet.id;
      if (newLiked.has(snippetId)) {
        newLiked.delete(snippetId);
      } else {
        newLiked.add(snippetId);
      }
      return newLiked;
    });
  };
  
  // Check if current snippet is liked
  const isCurrentSnippetLiked = currentSnippet ? 
    likedSnippets.has(currentSnippet.commentId || currentSnippet.id) : false;
  
  // Handle navigation to thread
  const goToThread = () => {
    handleClose();
  };
  
  // When user clicks the rating bar to rate a song
  const handleRatingClick = (e) => {
    if (!currentSnippet) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const fraction = 1 - (y / height);
    const newRating = Math.round(fraction * 100);
    
    
    // Call the onUserRate function if provided
    if (onUserRate) {
      onUserRate(currentSnippet, newRating);
    }
  };
  
  // For hover preview
  const handleRatingHover = (e) => {
    if (!currentSnippet || currentSnippet.didRate) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const fraction = 1 - (y / height);
    const hoverValue = Math.round(fraction * 100);
    
    setIsHovering(true);
    setHoverRating(hoverValue);
  };
  
  // Convert rating to fraction
  const toFraction = (val) => {
    return Math.max(0, Math.min(val, 100)) / 100;
  };
  
  // Get snippet comment data
  const getSnippetCommentData = (snippet) => {
    if (!snippet || !comments) return { author: 'Unknown', text: 'Great recommendation!' };
    
    const comment = comments.find(c => c.id === snippet.commentId);
    if (comment) {
      return {
        author: comment.author || snippet.author || 'Unknown',
        text: comment.body || 'Great recommendation!'
      };
    }
    
    return {
      author: snippet.author || 'Unknown',
      text: 'Great recommendation!'
    };
  };
  
  // Get avatar for comment author
  const getCommentAvatar = (snippet) => {
    const commentData = getSnippetCommentData(snippet);
    return snippet.snippetAuthorAvatar || getAvatarSrc({ author: commentData.author });
  };
  
  // Render left sidebar with navigation arrows
  const renderLeftSidebar = () => {
    return (
      <div style={styles.leftSidebar}>
        <button 
          onClick={() => handleSwipe("down")} 
          disabled={currentIndex === 0}
          style={{
            ...styles.navButton,
            opacity: currentIndex === 0 ? 0.3 : 1
          }}
        >
          <FiArrowUp size={24} />
        </button>
        
        <div style={styles.pageIndicator}>
          {currentIndex + 1}/{snippets.length}
        </div>
        
        <button 
          onClick={() => handleSwipe("up")} 
          disabled={currentIndex === snippets.length - 1}
          style={{
            ...styles.navButton,
            opacity: currentIndex === snippets.length - 1 ? 0.3 : 1
          }}
        >
          <FiArrowDown size={24} />
        </button>
      </div>
    );
  };
  
  // Render right sidebar with rating bar
  const renderRightSidebar = () => {
    if (!currentSnippet) return null;
    
    const displayedUserRating = Math.round(
      isHovering && !currentSnippet.didRate ? hoverRating : (currentSnippet.userRating || 0)
    );
    
    return (
      <div style={styles.rightSidebar}>
        {/* Rating bar container - twice as long */}
        <div style={{
          height: "280px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}>
          <div 
            style={{
              width: "20px",
              height: "240px",
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              borderRadius: "10px",
              position: "relative",
              overflow: "hidden",
              cursor: currentSnippet?.didRate ? "default" : "pointer",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
            }}
            onClick={handleRatingClick}
            onMouseMove={handleRatingHover}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Rating fill - show hover effect or actual rating */}
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                width: "100%",
                height: `${displayedUserRating}%`,
                backgroundImage: "linear-gradient(to top, #1d4ed8, #3b82f6)",
                borderRadius: "9px",
                transition: "height 0.3s ease-out",
                opacity: currentSnippet.userRating > 0 || isHovering ? 1 : 0,
              }}
            />
          </div>
        </div>
        
        {/* User Count - directly below the bar */}
        {currentSnippet.didRate && (
          <div style={{
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            borderRadius: "8px",
            padding: "12px 8px",
            marginBottom: "16px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginBottom: "4px",
            }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2C9.79 2 8 3.79 8 6c0 2.21 1.79 4 4 4s4-1.79 4-4c0-2.21-1.79-4-4-4zM4 20v-2c0-2.21 3.58-4 8-4s8 1.79 8 4v2H4z"
                  fill="#ffffff"
                />
              </svg>
              <span style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#ffffff",
              }}>
                {currentSnippet?.totalRatings || Math.floor(Math.random() * 500) + 50}
              </span>
            </div>
            <div style={{
              fontSize: "12px",
              color: "#ffffff",
              textAlign: "center",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Users Rated
            </div>
          </div>
        )}
        
        {/* Your Rating and Average Rating - below the user count */}
        {currentSnippet.didRate && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            {/* Your Rating */}
            <div style={{
              backgroundColor: "rgba(30, 39, 50, 0.8)",
              borderRadius: "8px",
              padding: "12px 8px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}>
              <div style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#3b82f6",
                textAlign: "center",
                marginBottom: "4px",
                lineHeight: "1",
              }}>
                {displayedUserRating}
              </div>
              <div style={{
                fontSize: "12px",
                color: "#ffffff",
                textAlign: "center",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Your Rating
              </div>
            </div>
            
            {/* Average Rating */}
            <div style={{
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "8px",
              padding: "12px 8px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}>
              <div style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#60a5fa",
                textAlign: "center",
                marginBottom: "4px",
                lineHeight: "1",
              }}>
                {Math.round(currentSnippet.avgRating || Math.floor(Math.random() * 85) + 15)}
              </div>
              <div style={{
                fontSize: "12px",
                color: "#ffffff",
                textAlign: "center",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Avg Rating
              </div>
            </div>
          </div>
        )}
        
        {/* Show rating hint when not rated yet */}
        {(currentSnippet.userRating > 0 || isHovering) && !currentSnippet.didRate && (
          <div style={{
            backgroundColor: "rgba(30, 39, 50, 0.8)",
            borderRadius: "8px",
            padding: "12px 8px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}>
            <div style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#3b82f6",
              textAlign: "center",
              marginBottom: "4px",
              lineHeight: "1",
            }}>
              {displayedUserRating}
            </div>
            <div style={{
              fontSize: "12px",
              color: "#ffffff",
              textAlign: "center",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Rate
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Don't render if no snippets
  if (!snippets || snippets.length === 0) {
    return (
      <div style={styles.overlay} onClick={handleClose}>
        <div 
          ref={modalRef}
          className="modal-wrapper"
          style={styles.modalWrapper} 
          onClick={e => e.stopPropagation()}
        >
          <div style={styles.phoneContainer}>
            <div style={styles.header}>
              <FiArrowLeft size={22} color="#fff" style={styles.backButton} onClick={handleClose} />
              <div style={styles.threadTitle}>No snippets available</div>
            </div>
            <div style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              flexDirection: "column",
              gap: "16px"
            }}>
              <Music size={48} color="#3b82f6" />
              <p>No music snippets found in this thread</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get current snippet data
  const commentData = currentSnippet ? getSnippetCommentData(currentSnippet) : null;
  const isThisSnippetPlaying = currentSnippet && 
    currentSnippetId === (currentSnippet.commentId || currentSnippet.id) && modalIsPlaying;
  
  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div 
        ref={modalRef}
        className="modal-wrapper"
        style={styles.modalWrapper} 
        onClick={e => e.stopPropagation()}
      >
        {/* Left sidebar with navigation arrows */}
        {renderLeftSidebar()}
        
        {/* Phone container (center column) */}
        <div style={styles.phoneContainer}>
          {/* Header */}
          <div style={styles.header}>
            <FiArrowLeft size={22} color="#fff" style={styles.backButton} onClick={handleClose} />
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flex: 1,
              gap: '8px'
            }}>
              <div style={styles.threadTitle} onClick={goToThread}>
                {threadTitle || "TikTok View"}
              </div>
              
            </div>
          </div>
          
          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
            </div>
          ) : (
            <div 
              ref={containerRef}
              className="track-container"
              style={styles.contentContainer}
              onTouchStart={(e) => {
                window.touchStartY = e.touches[0].clientY;
              }}
              onTouchEnd={(e) => {
                const touchEndY = e.changedTouches[0].clientY;
                const diff = window.touchStartY - touchEndY;
                
                if (Math.abs(diff) > 50) {
                  handleSwipe(diff > 0 ? "up" : "down");
                }
              }}
            >
              {/* Track Container with album art or placeholder */}
<div
  style={{
    ...styles.trackImageContainer,
    backgroundColor: currentSnippet?.albumColor || "#1e2732"
  }}
  onClick={() => togglePlay(currentSnippet?.commentId)}
>
  {(() => {
    // prefer the already-formatted artwork URL, then fall back to raw snippetData
    const raw =
      currentSnippet?.artwork ||
      currentSnippet?.artworkUrl ||
      currentSnippet?.snippetData?.attributes?.artwork?.url;
    const artworkUrl =
      raw?.includes("{w}") && raw?.includes("{h}")
        ? raw.replace("{w}", "400").replace("{h}", "400")
        : raw;

    return artworkUrl ? (
      <img
        src={artworkUrl}
        alt="Album artwork"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: "8px",
          backgroundColor: "rgba(15, 23, 42, 0.5)"
        }}
        onError={e => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/threads/assets/placeholder.jpg";
        }}
      />
    ) : (
      <Music size={80} color="#3b82f6" />
    );
  })()}

  <div
    style={{
      ...styles.playButton,
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)"
    }}
    className="play-button"
  >
    {isThisSnippetPlaying ? (
      <FiPause size={32} color="#fff" />
    ) : (
      <FiPlay size={32} color="#fff" style={{ marginLeft: "3px" }} />
    )}
  </div>
</div>

              
              {/* Genre tag - now between artwork and song info */}
              <div style={styles.genreContainer}>
                <div style={styles.genreTag}>
                  {currentSnippet?.genre || "#music"}
                </div>
              </div>
              
              {/* Track Info & Artist */}
              <div style={styles.trackInfoContainer}>
                <div style={styles.trackTitle}>
                  {currentSnippet?.snippetData?.attributes?.name || "Unknown Track"}
                </div>
                <div style={styles.artistName}>
                  {currentSnippet?.snippetData?.attributes?.artistName || "Unknown Artist"}
                </div>
              </div>
              
              {/* Progress bar - thicker and limited to 30% */}
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${Math.min(isThisSnippetPlaying ? audioProgress : 25, 30)}%` 
                  }} />
                </div>
                
                <div style={styles.progressTimes}>
  <span>0:{String(Math.floor(isThisSnippetPlaying ? (audioProgress / 30 * 30) : 0)).padStart(2, '0')}</span>
  <span>0:30</span>
</div>
              </div>
              
              {/* Comment - restyled with correct avatar */}
              <div style={styles.commentContainer}>
                <img 
                  src={getCommentAvatar(currentSnippet)}
                  alt="User" 
                  style={styles.userAvatar} 
                />
                <div style={styles.commentContent}>
                  <div style={styles.commentAuthor}>{commentData?.author || "Unknown"}</div>
                  <div style={styles.commentText}>{commentData?.text || "Great recommendation!"}</div>
                </div>
              </div>
              
              {/* Engagement icons - restyled */}
              <div style={styles.engagementContainer}>
                <div style={styles.engagementItem} onClick={toggleFavorite}>
                  <FiHeart 
                    size={24} 
                    style={{ fill: isCurrentSnippetLiked ? "#ff5252" : "none", color: "#fff" }}
                  />
                  <span style={styles.engagementCount}>
                    {getEngagementValues(currentSnippet?.commentId || currentSnippet?.id).likes}
                  </span>
                </div>
                <div style={styles.engagementItem}>
                  <FiMessageCircle size={24} color="#fff" />
                  <span style={styles.engagementCount}>
                    {getEngagementValues(currentSnippet?.commentId || currentSnippet?.id).comments}
                  </span>
                </div>
                <div style={styles.engagementItem}>
                  <FiBookmark size={24} color="#fff" />
                  <span style={styles.engagementCount}>
                    {getEngagementValues(currentSnippet?.commentId || currentSnippet?.id).bookmarks}
                  </span>
                </div>
                <div style={styles.engagementItem}>
                  <FiShare size={24} color="#fff" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right sidebar with rating bar */}
        {renderRightSidebar()}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '5vh 0',
    overflowY: 'auto',
    zIndex: 25000,
  },

  modalWrapper: {
    display: 'flex',
    gap: '16px',
    width: '100%',
    maxWidth: '520px',
    height: '700px',  // Fixed height to prevent resizing
    borderRadius: '16px',
    overflow: 'hidden',
  },
  phoneContainer: {
    flex: '1 1 auto',
    height: '100%',  // Take full height
    overflowY: 'auto',
    backgroundColor: '#1e2732',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
  },
  
  // Left sidebar styles
  leftSidebar: {
    width: "50px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  
  navButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "rgba(30, 39, 50, 0.8)",
    border: "2px solid #fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    color: "#fff",
    transition: "all 0.2s ease",
  },
  
  pageIndicator: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    padding: "4px 0",
  },
  
  // Right sidebar with advanced rating bar
  rightSidebar: {
    width: "100px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    paddingLeft: "10px",  // Add padding to push content more to the right
  },
  
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 12px",
    position: "relative",
    backgroundColor: "rgba(30, 39, 50, 0.95)",
  },
  
  backButton: {
    cursor: "pointer",
    zIndex: 5,
  },
  
  threadTitle: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "600",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "pointer",
    maxWidth: "300px",
  },
  
  loadingContainer: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "50px 0",
  },
  
  loadingSpinner: {
    width: "30px",
    height: "30px",
    border: "3px solid rgba(255, 255, 255, 0.1)",
    borderTop: "3px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  
  contentContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "10px 15px",
    position: "relative",
    opacity: 1,
    transition: "opacity 0.15s ease",
    minHeight: "600px",  // Ensure consistent minimum height
    maxHeight: "600px",  // Prevent expansion
    overflow: "hidden"   // Hide overflow to prevent spilling
  },
  
  trackImageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: "1/1",
    backgroundColor: "#1e2732",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "10px",
    overflow: "hidden",
  },
  
  playButton: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "2px solid rgba(255, 255, 255, 0.8)",
  },
  
  // Genre container (between artwork and song info)
  genreContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "10px",
  },
  
  genreTag: {
    display: "inline-block",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: "14px",
    fontSize: "13px",
    backgroundColor: "rgba(30, 39, 50, 0.6)",
  },
  
  trackInfoContainer: {
    marginBottom: "15px",
    textAlign: "center",
  },
  
  trackTitle: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  
  artistName: {
    color: "#fff",
    fontSize: "16px",
    opacity: 0.9,
  },
  
  progressContainer: {
    marginBottom: "20px",
  },
  
  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  
  progressFill: {
    height: "100%",
    backgroundColor: "#3a86ff",
    borderRadius: "4px",
    transition: "width 0.1s linear"
  },
  
  progressTimes: {
    display: "flex",
    justifyContent: "space-between",
    color: "#fff",
    fontSize: "12px",
    marginTop: "6px",
    opacity: 0.8,
  },
  
  // Restyled comment container
  commentContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "20px",
    padding: "12px",
    backgroundColor: "rgba(15, 24, 35, 0.7)",
    borderRadius: "12px",
    minHeight: "80px",  // Fixed minimum height to prevent layout shifts
    maxHeight: "100px", // Maximum height to prevent overflow
  },
  
  userAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(255, 255, 255, 0.2)",
  },
  
  commentContent: {
    flex: 1,
  },
  
  commentAuthor: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: "15px",
    marginBottom: "4px",
  },
  
  commentText: {
    color: "#ddd",
    fontSize: "14px",
    lineHeight: 1.4,
    display: "-webkit-box",
    WebkitLineClamp: 3,  // Limit to 3 lines
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxHeight: "4.2em",  // 3 lines × 1.4 line-height
  },
  
  // Restyled engagement container
  engagementContainer: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: "auto",
    marginBottom: "15px",
    padding: "15px 10px",
    backgroundColor: "rgba(15, 24, 35, 0.7)",
    borderRadius: "12px",
  },
  
  engagementItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
  },
  
  engagementCount: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
  },
};