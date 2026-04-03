// src/components/TikTokModal.jsx - Design 1: Horizontal Stats Layout
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiArrowLeft, FiHeart, FiMessageCircle, FiBookmark, FiShare, FiPlay, FiPause } from "react-icons/fi";
import { getAvatarSrc } from '../posts/postCardUtils';
import { Music, Users, ChevronUp, ChevronDown } from 'lucide-react';
import InfoIconModal from '../../components/InfoIconModal';
import { toApiOriginUrl } from "../../utils/api";

function normalizeMediaUrl(url = "") {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/cached_media/")) {
    return toApiOriginUrl(trimmed);
  }
  return trimmed;
}

function formatArtworkUrl(url, size = 400) {
  const normalizedUrl = normalizeMediaUrl(url);
  if (!normalizedUrl) return "";

  return normalizedUrl
    .replace("{w}x{h}", `${size}x${size}`)
    .replace("{w}", String(size))
    .replace("{h}", String(size))
    .replace("{f}", "jpg");
}

export default function TikTokModal({ 
  snippets = [], 
  comments = [], 
  onClose, 
  audioRef, 
  onUserRate, 
  startIndex = 0, 
  isInitialLoading = false,
  threadTitle = "Thread",
  onNavigateToThread,
  titleInfoModalTitle = "",
  titleInfoSteps = []
}) {
  const hasTitleInfo = Array.isArray(titleInfoSteps) && titleInfoSteps.length > 0;

  const getStableHash = (value) => {
    if (!value) return 0;
    let hash = 0;
    const str = String(value);
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  // Generate consistent engagement values based on snippet ID
  const getEngagementValues = (snippetId) => {
    if (!snippetId) return { likes: 50, comments: 2, bookmarks: 14 };

    const hash = getStableHash(snippetId);
    const likes = Math.abs(hash % 200) + 50;
    const commentsCount = Math.abs(hash % 20) + 2;
    const bookmarks = Math.abs(hash % 20) + 14;
    
    return { likes, comments: commentsCount, bookmarks };
  };

  // Keep side-panel rating stats stable before real values exist.
  const getStableRatingFallbacks = (snippetId) => {
    if (!snippetId) {
      return { totalRated: 120, avgRating: 64 };
    }

    const hash = Math.abs(getStableHash(`rating:${snippetId}`));
    const totalRated = (hash % 500) + 50; // 50-549
    const avgRating = ((Math.floor(hash / 11) % 71) + 20); // 20-90
    return { totalRated, avgRating };
  };

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [loading] = useState(false);
  const [modalIsPlaying, setModalIsPlaying] = useState(false);
  const [currentSnippetId, setCurrentSnippetId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(25);
  const [likedSnippets, setLikedSnippets] = useState(new Set());
  const [isHovering, setIsHovering] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  
  const containerRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, []);
  
  // Lock background scroll while modal is open and cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current && modalIsPlaying) {
        audioRef.current.pause();
        setModalIsPlaying(false);
        setAudioProgress(0);
      }
    };
  }, [modalIsPlaying]);

  // Add animations
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes overlayFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes modalAppear {
        from { opacity: 0; transform: translateY(8px) scale(0.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      
      @keyframes slideUp {
        0% { opacity: 1; transform: translateY(0); }
        50% { opacity: 0; transform: translateY(-30px); }
        51% { opacity: 0; transform: translateY(30px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideDown {
        0% { opacity: 1; transform: translateY(0); }
        50% { opacity: 0; transform: translateY(30px); }
        51% { opacity: 0; transform: translateY(-30px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fadeScale {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3); }
        50% { box-shadow: 0 8px 48px rgba(99, 102, 241, 0.5); }
      }

      @keyframes indeterminateBar {
        0% { transform: translateX(-60%); }
        100% { transform: translateX(160%); }
      }
      
      .modal-wrapper {
        animation: modalAppear 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        will-change: transform, opacity;
      }
      
      .content-animate-up {
        animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      
      .content-animate-down {
        animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      
      .content-animate-fade {
        animation: fadeScale 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      
      .play-button {
        transition: all 0.2s ease;
      }
      
      .play-button:hover {
        transform: translate(-50%, -50%) scale(1.08);
      }
      
      .play-button:active {
        transform: translate(-50%, -50%) scale(0.95);
      }
      
      .play-button.playing {
        animation: pulseGlow 2s ease-in-out infinite;
      }
      
      .nav-btn {
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .nav-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
      
      .nav-btn:active:not(:disabled) {
        transform: translateY(0) scale(0.95);
      }
      
      .rating-bar-fill {
        transition: height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .stat-card {
        transition: all 0.2s ease;
      }
      
      .stat-card:hover {
        transform: translateX(2px);
      }
      
      .engagement-btn {
        transition: all 0.2s ease;
      }
      
      .engagement-btn:hover {
        transform: scale(1.1);
      }
      
      .engagement-btn:active {
        transform: scale(0.95);
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
    if (isAnimating) return;
    
    if (audioRef.current && modalIsPlaying) {
      audioRef.current.pause();
      setModalIsPlaying(false);
      setAudioProgress(0);
    }
    
    const canGoUp = direction === "up" && currentIndex < snippets.length - 1;
    const canGoDown = direction === "down" && currentIndex > 0;
    
    if (!canGoUp && !canGoDown) return;
    
    setIsAnimating(true);
    setSlideDirection(direction);
    
    setTimeout(() => {
      if (direction === "up") {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(prev => prev - 1);
      }
      setCurrentSnippetId(null);
      
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection(null);
      }, 50);
    }, 200);
  };
  
  // Handle play/pause of snippet
  const togglePlay = (snippetId) => {
    const currentSnippet = snippets[currentIndex];
    if (!currentSnippet || !audioRef.current) return;

    const currentCommentId = currentSnippet?.commentId || currentSnippet?.id;
    const relatedComment = comments.find((comment) => comment?.id === currentCommentId);
    const relatedCommentSnippet = relatedComment?.snippet || {};

    const previewUrl = normalizeMediaUrl(
      currentSnippet.snippetData?.attributes?.previews?.[0]?.url ||
      currentSnippet.previewUrl ||
      relatedCommentSnippet?.snippetData?.attributes?.previews?.[0]?.url ||
      relatedCommentSnippet?.previewUrl ||
      ""
    );

    if (!previewUrl) {
      
      setModalIsPlaying(false);
      return;
    }

    if (snippetId === currentSnippetId && modalIsPlaying) {
      audioRef.current.pause();
      setModalIsPlaying(false);
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;

    audioRef.current.src = previewUrl;
    audioRef.current.load();
    audioRef.current.play()
      .then(() => {
        setCurrentSnippetId(snippetId);
        setModalIsPlaying(true);
        setAudioProgress(0);
      })
      .catch(_err => {
        
        setModalIsPlaying(false);
        setCurrentSnippetId(null);
        setAudioProgress(0);
      });
  };
  
  // Handle closing modal with audio cleanup
  const handleClose = () => {
    if (audioRef.current && modalIsPlaying) {
      audioRef.current.pause();
      setModalIsPlaying(false);
      setAudioProgress(0);
    }
    
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
        const snippetId = currentSnippet?.commentId || currentSnippet?.id;
        if (snippetId) {
          togglePlay(snippetId);
        }
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, snippets, handleClose]);
  
  // Get current snippet
  const currentSnippet = snippets[currentIndex] || null;
  const currentSnippetCommentId = currentSnippet?.commentId || currentSnippet?.id || null;
  const currentRelatedComment = currentSnippetCommentId
    ? comments.find((comment) => comment?.id === currentSnippetCommentId)
    : null;
  const currentRelatedCommentSnippet = currentRelatedComment?.snippet || null;
  const currentSnippetTrackTitle =
    currentSnippet?.snippetData?.attributes?.name ||
    currentSnippet?.songName ||
    currentSnippet?.name ||
    currentRelatedCommentSnippet?.snippetData?.attributes?.name ||
    currentRelatedCommentSnippet?.songName ||
    currentRelatedCommentSnippet?.name ||
    "Unknown Track";
  const currentSnippetArtistName =
    currentSnippet?.snippetData?.attributes?.artistName ||
    currentSnippet?.artistName ||
    currentRelatedCommentSnippet?.snippetData?.attributes?.artistName ||
    currentRelatedCommentSnippet?.artistName ||
    "Unknown Artist";
  const currentArtworkUrl = formatArtworkUrl(
    currentSnippet?.snippetData?.attributes?.artwork?.url ||
    currentSnippet?.artworkUrl ||
    currentSnippet?.artwork ||
    currentRelatedCommentSnippet?.snippetData?.attributes?.artwork?.url ||
    currentRelatedCommentSnippet?.artworkUrl ||
    currentRelatedCommentSnippet?.artwork ||
    "",
    400
  );
  const canNavigateToThread =
    typeof onNavigateToThread === "function" &&
    !!currentSnippet?.postId &&
    !["parameter", "news"].includes(String(currentSnippet?.postType || "").toLowerCase());
  
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

    if (onNavigateToThread && currentSnippet?.postId) {
      onNavigateToThread(currentSnippet.postId, currentSnippet);
    }
  };
  
  // When user clicks the rating bar to rate a song
  const handleRatingClick = (e) => {
    if (!currentSnippet) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const fraction = 1 - (y / height);
    const newRating = Math.round(fraction * 100);
    
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
  
  // Get snippet comment data
  const getSnippetCommentData = (snippet) => {
    if (!snippet || !comments) return { author: 'Unknown', text: 'Great recommendation!' };
    
    const comment = comments.find(c => c.id === snippet.commentId);
    if (comment) {
      return {
        author: comment.author || snippet.author || 'Unknown',
        text: comment.body || snippet.text || 'Great recommendation!'
      };
    }
    
    return {
      author: snippet.author || 'Unknown',
      text: snippet.text || 'Great recommendation!'
    };
  };
  
  // Get avatar for comment author
  const getCommentAvatar = (snippet) => {
    const commentData = getSnippetCommentData(snippet);
    return snippet.snippetAuthorAvatar || getAvatarSrc({ author: commentData.author });
  };
  
  // Render side panel with navigation and rating - Design 1 Layout
  const renderSidePanel = () => {
    if (!currentSnippet) return null;
    
    const displayedUserRating = Math.round(
      isHovering && !currentSnippet.didRate ? hoverRating : (currentSnippet.userRating || 0)
    );
    const snippetId = currentSnippet?.commentId || currentSnippet?.id;
    const fallbackRatings = getStableRatingFallbacks(snippetId);
    const totalRated =
      Number.isFinite(currentSnippet?.totalRatings) && currentSnippet.totalRatings > 0
        ? Math.round(currentSnippet.totalRatings)
        : fallbackRatings.totalRated;
    const avgRating =
      Number.isFinite(currentSnippet?.avgRating) && currentSnippet.avgRating > 0
        ? Math.round(currentSnippet.avgRating)
        : fallbackRatings.avgRating;
    
    return (
      <div style={styles.sidePanel}>
        {/* Navigation */}
        <div style={styles.navSection}>
          <button 
            onClick={() => handleSwipe("down")} 
            disabled={currentIndex === 0 || isAnimating}
            className="nav-btn"
            style={{
              ...styles.navButton,
              opacity: currentIndex === 0 ? 0.3 : 1,
              cursor: currentIndex === 0 || isAnimating ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronUp size={22} color="#fff" />
          </button>
          
          <div style={styles.pageIndicator}>
            {currentIndex + 1}/{snippets.length}
          </div>
          
          <button 
            onClick={() => handleSwipe("up")} 
            disabled={currentIndex === snippets.length - 1 || isAnimating}
            className="nav-btn"
            style={{
              ...styles.navButton,
              opacity: currentIndex === snippets.length - 1 ? 0.3 : 1,
              cursor: currentIndex === snippets.length - 1 || isAnimating ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronDown size={22} color="#fff" />
          </button>
        </div>

        {/* Rating Bar */}
        <div style={styles.ratingBarSection}>
          <span style={styles.ratingLabel}>Rating</span>
          <div 
            style={styles.ratingBarContainer}
            onClick={handleRatingClick}
            onMouseMove={handleRatingHover}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div
              className="rating-bar-fill"
              style={{
                ...styles.ratingBarFill,
                height: `${displayedUserRating}%`,
                opacity: currentSnippet.userRating > 0 || isHovering ? 1 : 0.3,
              }}
            />
            {/* Tick marks */}
            {[25, 50, 75].map(mark => (
              <div key={mark} style={{
                position: 'absolute',
                bottom: `${mark}%`,
                left: 0,
                right: 0,
                height: '1px',
                background: 'rgba(255,255,255,0.1)',
              }} />
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsSection}>
          {/* Total Rated */}
          <div className="stat-card" style={styles.statCard}>
            <div style={styles.statIcon}>
              <Users size={14} color="#818cf8" />
            </div>
            <span style={styles.statValue}>{totalRated}</span>
            <span style={styles.statLabel}>rated</span>
          </div>
          
          {/* Your Rating */}
          <div className="stat-card" style={{
            ...styles.statCard,
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}>
            <span style={{ ...styles.statValue, color: '#22c55e' }}>
              {currentSnippet.didRate ? displayedUserRating : '--'}
            </span>
            <span style={{ ...styles.statLabel, color: '#22c55e' }}>you</span>
          </div>
          
          {/* Average */}
          <div className="stat-card" style={{
            ...styles.statCard,
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
          }}>
            <span style={{ ...styles.statValue, color: '#fbbf24' }}>{avgRating}</span>
            <span style={{ ...styles.statLabel, color: '#fbbf24' }}>avg</span>
          </div>
        </div>
        
        {/* Hover Rating Preview */}
        {isHovering && !currentSnippet.didRate && (
          <div style={styles.ratingPreview}>
            <span style={styles.ratingPreviewValue}>{hoverRating}</span>
            <span style={styles.ratingPreviewLabel}>Click to rate</span>
          </div>
        )}
      </div>
    );
  };
  
  // Don't render if no snippets
  if (!snippets || snippets.length === 0) {
    return createPortal(
      <div style={styles.overlay} onClick={handleClose}>
        <div 
          ref={modalRef}
          className="modal-wrapper"
          style={styles.modalWrapper} 
          onClick={e => e.stopPropagation()}
        >
          <div style={styles.mainPanel}>
            <div style={styles.header}>
              <div style={styles.backButton} onClick={handleClose}>
                <FiArrowLeft size={18} color="#888" />
              </div>
              <span style={styles.headerText}>
                {isInitialLoading ? "Loading songs..." : "No snippets available"}
              </span>
              <div style={styles.headerRightSlot}>
                {hasTitleInfo ? (
                  <InfoIconModal
                    title={titleInfoModalTitle || "Information"}
                    iconSize={14}
                    showButtonText={false}
                    steps={titleInfoSteps}
                  />
                ) : (
                  <div style={styles.headerRightSpacer} />
                )}
              </div>
            </div>
            <div style={styles.emptyState}>
              {isInitialLoading ? (
                <>
                  <div style={styles.loadingSpinner}></div>
                  <div style={styles.loadingBarTrack}>
                    <div style={styles.loadingBarFill} />
                  </div>
                  <p style={styles.emptyStateText}>Pulling fresh previews...</p>
                </>
              ) : (
                <>
                  <Music size={48} color="#6366f1" />
                  <p style={styles.emptyStateText}>No music snippets found in this thread</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }
  
  // Get current snippet data
  const commentData = currentSnippet ? getSnippetCommentData(currentSnippet) : null;
  const isThisSnippetPlaying = currentSnippet && 
    currentSnippetId === (currentSnippet.commentId || currentSnippet.id) && modalIsPlaying;
  
  // Determine animation class
  const getAnimationClass = () => {
    if (!isAnimating) return '';
    return slideDirection === 'up' ? 'content-animate-up' : 'content-animate-down';
  };
  
  return createPortal(
    <div style={styles.overlay} onClick={handleClose}>
      <div 
        ref={modalRef}
        className="modal-wrapper"
        style={styles.modalWrapper} 
        onClick={e => e.stopPropagation()}
      >
        {/* Main Content Panel */}
        <div style={styles.mainPanel}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.backButton} onClick={handleClose}>
              <FiArrowLeft size={18} color="#888" />
            </div>
            <div
              style={{
                ...styles.headerTitleContainer,
                cursor: canNavigateToThread ? "pointer" : "default",
                opacity: canNavigateToThread ? 1 : 0.9,
              }}
              onClick={canNavigateToThread ? goToThread : undefined}
            >
              {canNavigateToThread && <span style={styles.headerArrow}>←</span>}
              <span style={styles.headerText}>
                {currentSnippet?.threadTitle || threadTitle || "TikTok View"}
              </span>
            </div>
            <div style={styles.headerRightSlot}>
              {hasTitleInfo ? (
                <InfoIconModal
                  title={titleInfoModalTitle || "Information"}
                  iconSize={14}
                  showButtonText={false}
                  steps={titleInfoSteps}
                />
              ) : (
                <div style={styles.headerRightSpacer} />
              )}
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
            </div>
          ) : (
            <div 
              ref={containerRef}
              className={getAnimationClass()}
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
              {/* Album Art Container */}
              <div 
                style={styles.albumArtContainer}
                onClick={() => togglePlay(currentSnippet?.commentId || currentSnippet?.id)}
              >
                {/* Gradient Background Effect */}
                <div style={styles.albumArtGradient} />
                
                {/* Album Artwork */}
                {currentArtworkUrl ? (
                  <img 
                    src={currentArtworkUrl}
                    alt="Album artwork"
                    style={styles.albumArtImage}
                  />
                ) : (
                  <div style={styles.albumArtPlaceholder}>
                    <Music size={60} color="rgba(99, 102, 241, 0.3)" />
                  </div>
                )}
                
                {/* Play Button */}
                <div 
                  className={`play-button ${isThisSnippetPlaying ? 'playing' : ''}`}
                  style={styles.playButton}
                >
                  {isThisSnippetPlaying ? 
                    <FiPause size={28} color="#fff" /> : 
                    <FiPlay size={28} color="#fff" style={{ marginLeft: "3px" }} />
                  }
                </div>
              </div>
              
              {/* Song Info */}
              <div style={styles.songInfoContainer}>
                <div style={styles.genreTag}>
                  {currentSnippet?.genre || "#music"}
                </div>
                <h2 style={styles.trackTitle}>
                  {currentSnippetTrackTitle}
                </h2>
                <p style={styles.artistName}>
                  {currentSnippetArtistName}
                </p>
              </div>
              
              {/* Progress Bar */}
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${Math.min(isThisSnippetPlaying ? audioProgress : 0, 100)}%` 
                  }} />
                </div>
                <div style={styles.progressTimes}>
                  <span>0:{String(Math.floor(isThisSnippetPlaying ? (audioProgress / 30 * 30) : 0)).padStart(2, '0')}</span>
                  <span>0:30</span>
                </div>
              </div>
              
              {/* Comment Card */}
              <div style={styles.commentCard}>
                <img 
                  src={getCommentAvatar(currentSnippet)}
                  alt="User" 
                  style={styles.commentAvatar} 
                />
                <div style={styles.commentContent}>
                  <span style={styles.commentAuthor}>{commentData?.author || "Unknown"}</span>
                  <p style={styles.commentText}>{commentData?.text || "Great recommendation!"}</p>
                </div>
              </div>
              
              {/* Engagement Actions */}
              <div style={styles.engagementContainer}>
                <button 
                  className="engagement-btn"
                  style={styles.engagementButton} 
                  onClick={toggleFavorite}
                >
                  <FiHeart 
                    size={20} 
                    style={{ 
                      fill: isCurrentSnippetLiked ? "#ef4444" : "none", 
                      color: isCurrentSnippetLiked ? "#ef4444" : "#666" 
                    }}
                  />
                  <span style={{ 
                    ...styles.engagementCount,
                    color: isCurrentSnippetLiked ? "#ef4444" : "#666"
                  }}>
                    {getEngagementValues(currentSnippet?.commentId || currentSnippet?.id).likes}
                  </span>
                </button>
                
                <button className="engagement-btn" style={styles.engagementButton}>
                  <FiMessageCircle size={20} color="#666" />
                  <span style={styles.engagementCount}>
                    {getEngagementValues(currentSnippet?.commentId || currentSnippet?.id).comments}
                  </span>
                </button>
                
                <button className="engagement-btn" style={styles.engagementButton}>
                  <FiBookmark size={20} color="#666" />
                  <span style={styles.engagementCount}>
                    {getEngagementValues(currentSnippet?.commentId || currentSnippet?.id).bookmarks}
                  </span>
                </button>
                
                <button className="engagement-btn" style={styles.engagementButton}>
                  <FiShare size={20} color="#666" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Side Panel - Navigation + Rating */}
        {renderSidePanel()}
      </div>
    </div>,
    document.body
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    overscrollBehavior: 'contain',
    animation: 'overlayFade 140ms ease-out forwards',
    willChange: 'opacity',
    zIndex: 25000,
  },

  modalWrapper: {
    display: 'flex',
    gap: '16px',
    maxWidth: '580px',
    width: '100%',
    alignItems: 'stretch',
  },

  // Main Content Panel
  mainPanel: {
    flex: 1,
    background: '#0d0d12',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
  },

  // Header
  header: {
    padding: '16px 20px',
    background: 'linear-gradient(180deg, rgba(30, 30, 40, 0.8) 0%, transparent 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },

  headerTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    flex: 1,
    justifyContent: 'center',
  },

  headerArrow: {
    color: '#555',
    fontSize: '14px',
  },

  headerText: {
    color: '#888',
    fontSize: '13px',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerRightSlot: {
    width: '36px',
    minWidth: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerRightSpacer: {
    width: '36px',
    height: '36px',
  },

  // Content Container
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 20px 20px',
    overflowY: 'auto',
  },

  // Album Art
  albumArtContainer: {
    width: '100%',
    aspectRatio: '1/1',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #1a1a25 0%, #0d0d12 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: '16px',
    cursor: 'pointer',
  },

  albumArtGradient: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },

  albumArtImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '20px',
  },

  albumArtPlaceholder: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
  },

  // Song Info
  songInfoContainer: {
    textAlign: 'center',
    marginBottom: '16px',
  },

  genreTag: {
    display: 'inline-block',
    background: 'rgba(99, 102, 241, 0.1)',
    color: '#818cf8',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    marginBottom: '10px',
    border: '1px solid rgba(99, 102, 241, 0.15)',
  },

  trackTitle: {
    color: '#fff',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },

  artistName: {
    color: '#666',
    fontSize: '14px',
    margin: 0,
  },

  // Progress Bar
  progressContainer: {
    marginBottom: '16px',
  },

  progressBar: {
    height: '4px',
    background: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '2px',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #818cf8)',
    borderRadius: '2px',
    transition: 'width 0.1s linear',
  },

  progressTimes: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
    color: '#444',
    fontSize: '11px',
  },

  // Comment Card
  commentCard: {
    display: 'flex',
    gap: '10px',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '14px',
    marginBottom: '16px',
    border: '1px solid rgba(255, 255, 255, 0.03)',
  },

  commentAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },

  commentContent: {
    flex: 1,
    minWidth: 0,
  },

  commentAuthor: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    display: 'block',
    marginBottom: '2px',
  },

  commentText: {
    color: '#888',
    fontSize: '12px',
    margin: 0,
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  // Engagement
  engagementContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '12px 0',
    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
    marginTop: 'auto',
  },

  engagementButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
  },

  engagementCount: {
    color: '#666',
    fontSize: '11px',
    fontWeight: '500',
  },

  // Side Panel - Design 1 Layout
  sidePanel: {
    width: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 12px',
    background: 'rgba(15, 15, 20, 0.95)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },

  // Navigation Section
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },

  navButton: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  pageIndicator: {
    color: '#888',
    fontSize: '13px',
    fontWeight: '600',
  },

  // Rating Bar Section
  ratingBarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },

  ratingLabel: {
    color: '#888',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },

  ratingBarContainer: {
    width: '12px',
    height: '120px',
    background: 'rgba(99, 102, 241, 0.15)',
    borderRadius: '6px',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  },

  ratingBarFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    background: 'linear-gradient(to top, #6366f1, #818cf8)',
    borderRadius: '6px',
  },

  // Stats Section
  statsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },

  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },

  statIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
  },

  statLabel: {
    color: '#888',
    fontSize: '10px',
    textTransform: 'uppercase',
  },

  // Rating Preview
  ratingPreview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '8px 12px',
    background: 'rgba(99, 102, 241, 0.15)',
    borderRadius: '10px',
    border: '1px solid rgba(99, 102, 241, 0.25)',
  },

  ratingPreviewValue: {
    color: '#818cf8',
    fontSize: '24px',
    fontWeight: '700',
  },

  ratingPreviewLabel: {
    color: '#888',
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '50px 0',
  },

  loadingSpinner: {
    width: '30px',
    height: '30px',
    border: '3px solid rgba(99, 102, 241, 0.1)',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  loadingBarTrack: {
    width: '220px',
    height: '8px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: '14px',
    border: '1px solid rgba(255,255,255,0.06)',
  },

  loadingBarFill: {
    width: '50%',
    height: '100%',
    borderRadius: '999px',
    background: 'rgba(99, 102, 241, 0.75)',
    animation: 'indeterminateBar 900ms ease-in-out infinite',
    willChange: 'transform',
  },

  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    padding: '40px',
  },

  emptyStateText: {
    color: '#666',
    fontSize: '14px',
    textAlign: 'center',
    margin: 0,
  },
};
