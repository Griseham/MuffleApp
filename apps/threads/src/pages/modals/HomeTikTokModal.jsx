// src/components/HomeTikTokModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { FiArrowLeft, FiHeart, FiMessageCircle, FiBookmark, FiShare, FiArrowUp, FiArrowDown, FiPlay, FiPause } from "react-icons/fi";
import { getAvatarSrc } from '../posts/postCardUtils';
import InfoIconModal from '../InfoIconModal';
import { Music, Headphones, Users } from 'lucide-react';

export default function HomeTikTokModal({ onClose, cachedPosts = [], onNavigateToThread }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSnippetId, setCurrentSnippetId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(25);
  const [likedSnippets, setLikedSnippets] = useState(new Set()); // Track liked snippets by ID
  const [isHovering, setIsHovering] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const modalRef = useRef(null);
  
  // Lock background scroll while modal is open
  useEffect(() => {
    /* don't lock body scroll – we still close safely via overlay click */
    return () => {};          // nothing to clean up
  }, []);

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
  
  // Load snippets for cached posts on mount
  useEffect(() => {
    async function loadAllSnippets() {
      setLoading(true);
      
      try {
        // Generate minimalistic data - LIMITED TO 8 SONGS
        const genres = ["#hiphop", "#rock", "#pop", "#indie", "#jazz", "#lofi"];
        const comments = [
          "This has been on repeat for me lately!",
          "This artist is so underrated!",
          "How is this one?",
          "Perfect vibe for this thread",
          "The lyrics on this one hit different..."
        ];
        
        // Limit to 8 songs maximum
        const limitedPosts = cachedPosts.slice(0, 8);
        
        // Fake song data
        const fakeSongs = [
          { name: "Midnight Dreams", artist: "Luna Sky", genre: "#indie" },
          { name: "Electric Nights", artist: "Neon Pulse", genre: "#electronic" },
          { name: "Golden Hour", artist: "Sunset Valley", genre: "#pop" },
          { name: "Ocean Waves", artist: "Blue Horizon", genre: "#chillout" },
          { name: "City Lights", artist: "Urban Echo", genre: "#hiphop" },
          { name: "Forest Path", artist: "Nature Sound", genre: "#ambient" },
          { name: "Starlight", artist: "Cosmic Journey", genre: "#synthwave" },
          { name: "Summer Breeze", artist: "Tropical Vibes", genre: "#reggae" }
        ];
        
        // Album art colors - darker versions
        const albumColors = [
          "#c44569", "#218c74", "#2c5282", "#68d391", 
          "#d69e2e", "#b83280", "#3182ce", "#553c9a"
        ];
        
        const placeholderSnippets = limitedPosts.map((post, index) => {
          const songData = fakeSongs[index] || fakeSongs[0];
          return {
            id: `snippet-${index}`,
            postId: post.id,
            threadTitle: post.title || "What song comes to mind?",
            songName: songData.name,
            artistName: songData.artist,
            genre: songData.genre,
            albumColor: albumColors[index] || albumColors[0],
            commentAuthor: post.author || `User${Math.floor(Math.random() * 900 + 100)}`,
            commentText: comments[Math.floor(Math.random() * comments.length)],
            likes: Math.floor(Math.random() * 200) + 50,
            comments: Math.floor(Math.random() * 20) + 2,
            saves: Math.floor(Math.random() * 20) + 2,
            userRating: 0, // Start with no rating
            avgRating: Math.floor(Math.random() * 85) + 15,
            totalRatings: Math.floor(Math.random() * 500) + 50,
            didRate: false,
            // Use same avatar generation as PostCard
            avatar: getAvatarSrc(post)
          };
        });
        
        setSnippets(placeholderSnippets);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
    
    loadAllSnippets();
    
    // Clean up audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [cachedPosts]);
  
  // Track audio progress
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        const progress = (audio.currentTime / audio.duration) * 30 || 0; // Only go up to 30
        setAudioProgress(progress);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
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
  }, [currentIndex, snippets.length]);
  
  // Handle swiping to change snippets
  const handleSwipe = (direction) => {
    // Pause current audio when changing snippets
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    if (direction === "up" && currentIndex < snippets.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentSnippetId(null); // Reset current audio
    } else if (direction === "down" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentSnippetId(null); // Reset current audio
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
    const previewUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; // Dummy URL
    
    if (snippetId === currentSnippetId && isPlaying) {
      // Pause current
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Play new
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current.src = previewUrl;
      audioRef.current.load();
      audioRef.current.play()
        .catch(err => console.error("Error playing audio:", err));
      setCurrentSnippetId(snippetId);
      setIsPlaying(true);
      setAudioProgress(0);
    }
  };
  
  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') {
        handleSwipe('down'); // Previous snippet
      } else if (e.key === 'ArrowDown') {
        handleSwipe('up'); // Next snippet
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        // Space bar toggles play/pause
        if (currentSnippet?.id) {
          togglePlay(currentSnippet.id);
        }
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, snippets, onClose]);
  
  // Get current snippet
  const currentSnippet = snippets[currentIndex] || null;
  
  // Toggle favorite state for current snippet
  const toggleFavorite = () => {
    if (!currentSnippet) return;
    
    setLikedSnippets(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(currentSnippet.id)) {
        newLiked.delete(currentSnippet.id);
      } else {
        newLiked.add(currentSnippet.id);
      }
      return newLiked;
    });
  };
  
  // Check if current snippet is liked
  const isCurrentSnippetLiked = currentSnippet ? likedSnippets.has(currentSnippet.id) : false;
  
  // Handle navigation to thread
  const goToThread = (postId) => {
    // Close the modal first
    onClose();
    
    // Navigate to the thread if navigation function is provided
    if (onNavigateToThread) {
      // Find the post data from cachedPosts
      const post = cachedPosts.find(p => p.id === postId);
      if (post) {
        // Call the navigation function with the full post object
        onNavigateToThread(post);
      } else {
      }
    } else {
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
    
    
    // Update the snippet's rating
    setSnippets(prevSnippets => 
      prevSnippets.map((snippet, idx) => 
        idx === currentIndex 
          ? { 
              ...snippet, 
              userRating: newRating,
              didRate: true,
              // Simulate updating the average
              avgRating: Math.floor((snippet.avgRating * snippet.totalRatings + newRating) / (snippet.totalRatings + 1)),
              totalRatings: snippet.totalRatings + 1
            } 
          : snippet
      )
    );
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
          height: "280px", // Doubled from 140px
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}>
          <div 
            style={{
              width: "20px",
              height: "240px", // Doubled from 120px
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
                {currentSnippet?.totalRatings || 0}
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
                {Math.round(currentSnippet.avgRating || 0)}
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
  
  return (
    <div style={styles.overlay} onClick={onClose}>
      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: "none" }}>
        <source src="" type="audio/mpeg" />
      </audio>
      
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
            <FiArrowLeft size={22} color="#fff" style={styles.backButton} onClick={onClose} />
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flex: 1,
              gap: '8px'
            }}>
              <div style={styles.threadTitle} onClick={() => currentSnippet && goToThread(currentSnippet.postId)}>
                {currentSnippet?.threadTitle || "What song comes to mind?"}
              </div>
              <InfoIconModal
                title="TikTok View"
                iconSize={16}
                showButtonText={false}
                steps={[
                  {
                    icon: <Music size={18} color="#a9b6fc" />,
                    title: "TikTok-Style Music Discovery",
                    content: "Title of the thread where this song recommendations came from, click it  to join the thread."
                  },
                 
                
                ]}
              />
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
              {/* Track Container with colored album art */}
              <div style={{
                ...styles.trackImageContainer,
                backgroundColor: currentSnippet?.albumColor || "#555"
              }} onClick={() => togglePlay(currentSnippet?.id)}>
                <div style={styles.playButton} className="play-button">
                  {isPlaying ? 
                    <FiPause size={32} color="#fff" /> : 
                    <FiPlay size={32} color="#fff" style={{ marginLeft: "3px" }} />}
                </div>
              </div>
              
              {/* Genre tag - now between artwork and song info */}
              <div style={styles.genreContainer}>
                <div style={styles.genreTag}>
                  {currentSnippet?.genre || "#jazz"}
                </div>
              </div>
              
              {/* Track Info & Artist */}
              <div style={styles.trackInfoContainer}>
                <div style={styles.trackTitle}>{currentSnippet?.songName || "Track 1"}</div>
                <div style={styles.artistName}>{currentSnippet?.artistName || "Artist A"}</div>
              </div>
              
              {/* Progress bar - thicker and limited to 30% */}
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${Math.min(isPlaying ? audioProgress : 25, 30)}%` 
                  }} />
                </div>
                
                <div style={styles.progressTimes}>
                  <span>0:44</span>
                  <span>0:30</span>
                </div>
              </div>
              
              {/* Comment - restyled with correct avatar */}
              <div style={styles.commentContainer}>
                <img 
                  src={currentSnippet?.avatar || `https://i.pravatar.cc/100?u=${currentSnippet?.commentAuthor || "user"}`}
                  alt="User" 
                  style={styles.userAvatar} 
                />
                <div style={styles.commentContent}>
                  <div style={styles.commentAuthor}>{currentSnippet?.commentAuthor || "User441"}</div>
                  <div style={styles.commentText}>{currentSnippet?.commentText || "This has been on repeat for me lately!"}</div>
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
                    {isCurrentSnippetLiked ? (currentSnippet?.likes || 244) + 1 : (currentSnippet?.likes || 244)}
                  </span>
                </div>
                <div style={styles.engagementItem}>
                  <FiMessageCircle size={24} color="#fff" />
                  <span style={styles.engagementCount}>
                    {currentSnippet?.comments || 2}
                  </span>
                </div>
                <div style={styles.engagementItem}>
                  <FiBookmark size={24} color="#fff" />
                  <span style={styles.engagementCount}>
                    {currentSnippet?.saves || 14}
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
    inset: 0,                               // covers entire viewport
    backgroundColor: 'rgba(0,0,0,0.9)', // Darker to match playing screen
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',               // short modals still look centered
    padding: '5vh 0',
    overflowY: 'auto',                      // scroll overlay if modal is very tall
    zIndex: 20000,                          // 🔼 now on top of starfield + nav
  },

  modalWrapper: {
    display: 'flex',
    gap: '16px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: 'calc(100vh - 10vh)',        // matches the 5vh top + 5vh bottom padding on overlay
    height: 'auto',
    borderRadius: '16px',
    overflow: 'hidden',                     // prevent internal overflow beyond this box
  },

  phoneContainer: {
    flex: '1 1 auto',
    height: 'auto',
    overflowY: 'auto',                      // scrollable content area for the phone view
    backgroundColor: '#1e2732',             // Match PostCard colors
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
    backgroundColor: "rgba(30, 39, 50, 0.8)", // Match PostCard colors
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
    width: "80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  
  ratingTopLabel: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "5px",
  },
  
  ratingMiddleLabel: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    marginTop: "5px",
  },
  
  ratingBottomLabel: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "10px",
  },
  
  ratingBarContainer: {
    position: "relative",
    width: "24px",
    height: "180px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    overflow: "visible",
    cursor: "pointer",
    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
  },
  
  ratingBarBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: "12px",
    background: "linear-gradient(to top, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))",
  },
  
  userRatingFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "0%", // Will be set dynamically
    backgroundColor: "#3a86ff",
    borderRadius: "12px",
    transition: "height 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s",
  },
  
  avgRatingMarker: {
    position: "absolute",
    left: "-4px",
    right: "-4px",
    transform: "translateY(50%)",
    pointerEvents: "none",
  },
  
  avgMarkerLine: {
    height: "2px",
    backgroundColor: "#4a90e2",
    width: "100%",
    boxShadow: "0 0 4px rgba(74, 144, 226, 0.5)",
  },
  
  ratingLabelsContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: "none",
  },
  
  ratingLabel: {
    position: "absolute",
    transform: "translateY(50%)",
    left: "100%",
    marginLeft: "8px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
    pointerEvents: "none",
  },
  
  ratingValue: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#fff",
  },
  
  ratingType: {
    fontSize: "12px",
    color: "#aaa",
  },
  
  ratingCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#3a86ff",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "16px",
    fontWeight: "bold",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  },
  
  totalRatingsRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#ddd",
    fontSize: "12px",
    marginTop: "5px",
  },
  
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 12px",
    position: "relative",
    backgroundColor: "rgba(30, 39, 50, 0.95)", // Match PostCard header colors
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
    transition: "opacity 0.15s ease"
  },
  
  trackImageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: "1/1",
    backgroundColor: "rgba(30, 39, 50, 0.8)", // Match PostCard colors
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "10px",
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
    backgroundColor: "rgba(30, 39, 50, 0.6)", // Match PostCard colors
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
    height: "8px", // Thicker progress bar
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
    backgroundColor: "rgba(15, 24, 35, 0.7)", // Match PostCard colors
    borderRadius: "12px",
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
  },
  
  // Restyled engagement container
  engagementContainer: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: "auto",
    marginBottom: "15px",
    padding: "15px 10px",
    backgroundColor: "rgba(15, 24, 35, 0.7)", // Match PostCard colors
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