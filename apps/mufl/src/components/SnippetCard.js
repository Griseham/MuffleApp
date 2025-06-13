import React, { useState, useEffect, useRef } from "react";
import { UserIcon, PlayIcon, PauseIcon, BookmarkIcon, VolumeIcon } from "./Icons/Icons";
import InfoIconModal from "./InfoIconModal";
import UserHoverCard from "./UserHoverCard";

const GENRES = ["Rock", "Pop", "R&B", "Jazz", "Hip-Hop"];
const GENRE_COLORS = {
  Rock: "text-red-400",
  Pop: "text-blue-400",
  "R&B": "text-purple-400",
  Jazz: "text-yellow-400",
  "Hip-Hop": "text-green-400",
};

// Fallback mock snippets for when no real data is available
const FALLBACK_SNIPPETS = [
  { id: 1, track: "Loading Songs...", artist: "Please wait", color: "#1DB954", artworkUrl: null },
  { id: 2, track: "Fetching from Apple Music", artist: "Almost ready", color: "#E91E63", artworkUrl: null },
  { id: 3, track: "Building your queue", artist: "Just a moment", color: "#FF9800", artworkUrl: null }
];

// Info content for the InfoIconModal
const snippetCardInfoSteps = [
  {
    title: "SnippetCard",
    content: "As soon as you join a room, a song recommendation will play"
  },
  {
    title: "Swiping & Queue Control",
    content: `Swiping left or right will push the snippet backwards or forwards in the queue, so the best songs may show up first.

The user can assign different values to their swipes, increasing engagement. 

For example, swiping left by clicking the icon with the 2 left arrows, pushes that song back in queue by 2. 

However this doesn't mean that the song will be pushed back behind 2 songs from just one vote. (Logic will be updated after playtesting).`
  },
  {
    title: "Listening Tracking & Points",
    content: `The app tracks how long the user listened to the snippet before swiping on it

Listening to a song reveals a modal to the right of the card, giving the user volume and genre points.

The longer the user listens to the song, the more points they gain

This is meant to work as an instant gratification for the user so they keep discovering new music

Instead of simply skipping past a song you don't like, the user still gets points for listening`
  },
  {
    title: "Social Strategy",
    content: `Users with high points in certain genres likely listen and recommend songs from those genres

If you find a user with a high volume and a lot of points in your favorite genre, you might want to follow them for their song recommendations.

Especially if you've liked multiple of their song recommendations while being a room with them

This also encourages users to have a higher volume and a lot of points, as it attracts users to your music taste and you can use that to promote your favorite underrated artists.`
  },
  {
    title: "User Information",
    content: `On top of the card will be the user who shared it and an optional message attached.

The user may or may not stay anonymous to eliminate bias`
  }
];

const defaultPreviewUrl = "";

// Pure SVG Music Icon Component
const PureMusicIcon = ({ size = 80, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </svg>
);

// Pure SVG Album Icon Component 
const PureAlbumIcon = ({ size = 80, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3" fill={color}/>
  </svg>
);

// Pure SVG User Icon Component
const PureUserIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const SnippetCard = ({ 
  onSwipe = () => {}, 
  currentSong = null,
  isLoading = false,
  songsQueue = [],
  currentIndex = 0
}) => {
  // Animation states
  const [direction, setDirection] = useState(null);
  const [animation, setAnimation] = useState(false);
  const [upVotes, setUpVotes] = useState({ 1: 0, 2: 0, 3: 0 });
  const [downVotes, setDownVotes] = useState({ 1: 0, 2: 0, 3: 0 });
  
  // New state for showing the clicked arrow in the center
  const [centerArrow, setCenterArrow] = useState(null);
  
  // User modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalPosition, setUserModalPosition] = useState({ top: 100, left: 100 });
  
  // Original states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [animItems, setAnimItems] = useState([]);
  const [animValues, setAnimValues] = useState({});
  const animTimers = useRef([]);

  // Audio playback state
  const audioRef = useRef(null);
  const [audioError, setAudioError] = useState(false);

  // Ref for user avatar element
  const userAvatarRef = useRef(null);

  // UPDATED: Get the current card - STATIC PLACEHOLDER DATA ONLY
  const getCurrentCard = () => {
    // Always return static placeholder data - no API calls
    return {
      id: 'placeholder-1',
      track: 'Sample Song Title',
      artist: 'Sample Artist Name',
      album: 'Sample Album',
      previewUrl: defaultPreviewUrl, // No preview available
      color: '#1DB954',
      isFromRoomArtist: false
    };
  };

  const currentCard = getCurrentCard();

  // Handle audio playback and reset states when song changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsPlaying(false);
    setAudioError(false);
    setIsBookmarked(false); // Reset bookmark state for new song
    
    // Load new audio if preview URL is available
    if (currentCard.previewUrl && audioRef.current) {
      audioRef.current.src = currentCard.previewUrl;
      audioRef.current.load();
    }
  }, [currentCard.id, currentSong]);

  // Handle voting and card animation
  const handleVote = (type, strength) => {
    if (animation || isLoading) return;
    
    // Stop audio if playing
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Get user data to include in swipe
    const userData = generateUserData(currentCard);
    
    // UPDATED: Create enhanced song data with user information - NO ARTWORK
    const enhancedSong = {
      ...currentCard,
      // REMOVED: artworkUrl, image references
      album: currentCard.album,
      // Add user information that will be preserved in left/right tabs
      recommendedBy: {
        userId: userData.userId,
        username: userData.username,
        timeAgo: userData.timeAgo,
        comment: userData.comment
      }
    };
    
    // Update vote counts
    if (type === 'up') {
      setUpVotes(prev => ({
        ...prev,
        [strength]: prev[strength] + 1
      }));
    } else {
      setDownVotes(prev => ({
        ...prev,
        [strength]: prev[strength] + 1
      }));
    }
    
    // Set the center arrow
    setCenterArrow({ type, strength });
    
    // Start animation after a brief delay to show the center arrow
    setTimeout(() => {
      setDirection(type);
      setAnimation(true);
      
      // Trigger stats animation
      triggerAnimation();
      
      // Reset animation state after animation completes
      setTimeout(() => {
        setAnimation(false);
        setCenterArrow(null);
        // Reset vote counts for next card
        setUpVotes({ 1: 0, 2: 0, 3: 0 });
        setDownVotes({ 1: 0, 2: 0, 3: 0 });
        onSwipe(enhancedSong, type, strength);

      }, 350);
    }, 800); // Show the center arrow for 800ms before starting the slide animation
  };

  // Get animation class
  const getAnimationClass = () => {
    if (!animation) return '';
    
    return direction === 'up' 
      ? 'animate-slide-right' 
      : 'animate-slide-left';
  };

  const triggerAnimation = () => {
    // random integer 1 – 9
    const volPoints = Math.floor(Math.random() * 9) + 1;
    const genreCount = Math.floor(Math.random() * 2) + 2;
    const shuffledGenres = [...GENRES].sort(() => 0.5 - Math.random());
    const pickedGenres = shuffledGenres.slice(0, genreCount);

    const genreItems = pickedGenres.map((genre) => ({
      id: genre,
      label: genre,
      target: parseFloat((Math.random() * 0.00999).toFixed(5)),
      type: "genre",
    }));

    const items = [
      { id: "volume", label: "Volume", target: volPoints, type: "volume" },
      ...genreItems,
    ];

    setAnimItems(items);
    setAnimValues(
      items.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {})
    );
    setShowAnim(true);

    items.forEach((item) => {
      const duration = 1500;
      const steps = 30;
      const interval = duration / steps;
      let count = 0;
      const timer = setInterval(() => {
        count++;
        setAnimValues((prev) => {
          const newValue = prev[item.id] + item.target / steps;
          
          const clamped = 
            item.type === "volume"
              ? Math.min(Number(newValue.toFixed(2)), item.target)
              : Math.min(Number(newValue.toFixed(6)), item.target);
              
          return { ...prev, [item.id]: clamped };
        });
        if (count >= steps) clearInterval(timer);
      }, interval);
      animTimers.current.push(timer);
    });

    const hideTimer = setTimeout(() => {
      setShowAnim(false);
      setAnimItems([]);
      animTimers.current = [];
    }, 1800);
    animTimers.current.push(hideTimer);
  };

  const handlePlay = () => {
    if (!currentCard.previewUrl || audioError) {
      // No preview available, just trigger animation
      triggerAnimation();
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            triggerAnimation();
          })
          .catch((error) => {
            setAudioError(true);
            triggerAnimation(); // Still show animation even if audio fails
          });
      }
    }
  };

  // Handle audio events
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = () => {
    setAudioError(true);
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      animTimers.current.forEach((t) => clearInterval(t) || clearTimeout(t));
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Render Arrow for center display
  const renderCenterArrow = (type, strength) => {
    const color = type === 'up' ? 'text-[#1DB954]' : 'text-red-400';
    return (
      <div className={`w-20 h-20 ${color} animate-scale-in-out flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
          {type === 'up' ? (
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

  // UPDATED: Static user data generation - no dynamic API calls
  const generateUserData = (song) => {
    // Always return the same static user data for consistency
    return { 
      userId: 1,
      username: "music_lover", 
      timeAgo: "2m ago", 
      comment: "Perfect vibe for today"
    };
  };

  const userData = generateUserData(currentCard);

  // Function to generate extended user data for the modal
  const generateExtendedUserData = (userData) => {
    // Generate additional data for the modal based on user ID
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const randomMonth = months[userData.userId % months.length];
    const randomYear = 2020 + (userData.userId % 4);
    
    const discoveryPercent = Math.max(1, Math.min(15, Math.floor(20 - (userData.userId / 2))));
    const following = Math.floor(50 + (userData.userId * 50) + Math.random() * 200);
    const followers = Math.floor(20 + (userData.userId * 30) + Math.random() * 150);
    const verified = userData.userId <= 5; // First 5 users are verified
    
    return {
      displayName: userData.username,
      verified: verified,
      createdAt: `${randomMonth} ${randomYear}`,
      following: following,
      followers: followers,
      discoveryPercent: discoveryPercent,
      volume: 1000 + (userData.userId * 200),
      arrowCounts: {
        positive: {
          one: 60 + Math.floor(Math.random() * 60),
          two: 30 + Math.floor(Math.random() * 40),
          three: 5 + Math.floor(Math.random() * 30)
        },
        negative: {
          one: 20 + Math.floor(Math.random() * 30),
          two: 5 + Math.floor(Math.random() * 20),
          three: 2 + Math.floor(Math.random() * 15)
        }
      }
    };
  };

  // Function to calculate modal position
  const calculateModalPosition = () => {
    if (!userAvatarRef.current) return { top: 100, left: 100 };
    
    const rect = userAvatarRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    // Modal dimensions (approximate)
    const modalHeight = 400;
    const modalWidth = 280;
    
    // Position above the avatar by default
    let top = rect.top - modalHeight - 20;
    let left = rect.left + (rect.width / 2) - (modalWidth / 2);
    
    // If modal would be off the top, position it below
    if (top < 20) {
      top = rect.bottom + 20;
    }
    
    // Keep modal within screen bounds
    if (left + modalWidth > windowWidth - 20) {
      left = windowWidth - modalWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }
    
    return { top, left };
  };

  // Handle user avatar click
  const handleUserAvatarClick = () => {
    if (showUserModal) {
      setShowUserModal(false);
    } else {
      const position = calculateModalPosition();
      setUserModalPosition(position);
      setShowUserModal(true);
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Don't close if clicking on user avatar or modal
      if (e.target.closest('.user-avatar-clickable') || e.target.closest('.user-modal')) {
        return;
      }
      setShowUserModal(false);
    };

    if (showUserModal) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [showUserModal]);

  // UPDATED: Generate dynamic SVG artwork based on song data
  const generateSongArtwork = (song) => {
    // Create a unique hash from song data
    const songString = `${song.track}-${song.artist}`;
    let hash = 0;
    for (let i = 0; i < songString.length; i++) {
      hash = songString.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Color palettes based on song color
    const getGradientColors = (baseColor) => {
      const colorMap = {
        '#1DB954': ['#1DB954', '#14A085', '#0F7B8A'], // Green theme
        '#E91E63': ['#E91E63', '#C2185B', '#AD1457'], // Pink theme  
        '#FF9800': ['#FF9800', '#F57C00', '#E65100'], // Orange theme
        '#9C27B0': ['#9C27B0', '#7B1FA2', '#6A1B9A'], // Purple theme
        '#2196F3': ['#2196F3', '#1976D2', '#1565C0'], // Blue theme
      };
      
      return colorMap[baseColor] || ['#666666', '#555555', '#444444'];
    };
    
    const colors = getGradientColors(song.color);
    const patternType = Math.abs(hash) % 4; // 4 different patterns
    
    return (
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <defs>
          <linearGradient id={`grad-${song.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: colors[0], stopOpacity: 1}} />
            <stop offset="50%" style={{stopColor: colors[1], stopOpacity: 0.8}} />
            <stop offset="100%" style={{stopColor: colors[2], stopOpacity: 1}} />
          </linearGradient>
          <radialGradient id={`radial-${song.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{stopColor: colors[0], stopOpacity: 0.8}} />
            <stop offset="100%" style={{stopColor: colors[2], stopOpacity: 1}} />
          </radialGradient>
        </defs>
        
        {/* Background */}
        <rect width="200" height="200" fill={`url(#grad-${song.id})`} />
        
        {/* Pattern based on hash */}
        {patternType === 0 && (
          // Circular pattern
          <>
            <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
            <circle cx="100" cy="100" r="20" fill="white" opacity="0.6" />
          </>
        )}
        
        {patternType === 1 && (
          // Wave pattern
          <>
            <path d="M0,100 Q50,50 100,100 T200,100" stroke="white" strokeWidth="3" fill="none" opacity="0.4" />
            <path d="M0,120 Q50,70 100,120 T200,120" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
            <path d="M0,80 Q50,30 100,80 T200,80" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
          </>
        )}
        
        {patternType === 2 && (
          // Geometric pattern
          <>
            <polygon points="100,40 140,80 140,120 100,160 60,120 60,80" fill="white" opacity="0.3" />
            <polygon points="100,60 120,80 120,120 100,140 80,120 80,80" fill="white" opacity="0.4" />
            <circle cx="100" cy="100" r="15" fill="white" opacity="0.6" />
          </>
        )}
        
        {patternType === 3 && (
          // Music note pattern
          <>
            <ellipse cx="70" cy="140" rx="12" ry="8" fill="white" opacity="0.5" />
            <ellipse cx="130" cy="120" rx="12" ry="8" fill="white" opacity="0.5" />
            <rect x="77" y="80" width="3" height="60" fill="white" opacity="0.5" />
            <rect x="137" y="60" width="3" height="60" fill="white" opacity="0.5" />
            <path d="M80,80 Q120,60 140,60" stroke="white" strokeWidth="3" fill="none" opacity="0.5" />
          </>
        )}
        
        {/* Overlay gradient for depth */}
        <rect width="200" height="200" fill={`url(#radial-${song.id})`} opacity="0.3" />
      </svg>
    );
  };

  return (
    <div className="flex justify-center relative p-8">
      {/* Hidden audio element for preview playback */}
      {currentCard.previewUrl && (
        <audio 
          ref={audioRef}
          onEnded={handleAudioEnded}
          onError={handleAudioError}
          preload="metadata"
        />
      )}
      
      {/* Main Card Container */}
      <div className={`w-80 flex flex-col items-center relative ${getAnimationClass()}`}>
        {/* User Header with Avatar */}
        <div className="flex w-full items-center mb-3 px-1">
          <div 
            ref={userAvatarRef}
            className="user-avatar-clickable mr-3 flex h-12 w-12 items-center justify-center rounded-full overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)] cursor-pointer hover:ring-2 hover:ring-[#1DB954] transition-all"
            onClick={handleUserAvatarClick}
          >
            {/* PURE SVG user placeholder - NO IMAGES */}
            <PureUserIcon size={24} className="text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <p className="text-base font-medium text-white">{userData.username}</p>
              <span className="ml-2 text-sm text-gray-500">· {userData.timeAgo}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{userData.comment}</p>
          </div>
        </div>

        {/* Info Icon - Positioned above and to the right of the snippet card */}
        <div className="absolute -top-2 right-0 z-30">
          <InfoIconModal
            title="SnippetCard Guide"
            steps={snippetCardInfoSteps}
            iconSize={18}
            iconColor="#FFA500"
            showButtonText={false}
            sidePanel={true}
            modalId="snippetcard-modal"
          />
        </div>

        {/* Snippet Card + Side Arrows */}
        <div className="relative w-full mb-6">
          {/* Snippet Card */}
          <div className="flex w-full select-none flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a1a] to-black shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
            <div className="relative h-96 w-full flex items-center justify-center bg-black/40 border border-white/10">
              {/* UPDATED: Simple album art placeholder - restored original design */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  {/* Original music icon placeholder - larger size */}
                  <div className="text-gray-500">
                    <PureMusicIcon size={80} color="currentColor" />
                  </div>
                </div>
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/30" />
              </div>
              
              {/* Gradient overlay matching card color */}
              <div 
                className="absolute inset-0 opacity-40"
                style={{ 
                  background: `linear-gradient(to bottom, transparent 0%, ${currentCard.color}20 70%, ${currentCard.color}60 100%)` 
                }}
              />

              {/* Room Artist Badge */}
              {currentCard.isFromRoomArtist && (
                <div className="absolute top-3 left-3 z-10">
                  <div className="flex items-center bg-yellow-500/90 text-black px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Room Artist
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
                  <div className="text-white text-center">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">Loading songs...</p>
                  </div>
                </div>
              )}
              
              {/* Center Arrow Display */}
              {centerArrow && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
                  {renderCenterArrow(centerArrow.type, centerArrow.strength)}
                </div>
              )}
              
              {/* Control Buttons */}
              <div className="absolute top-0 right-0 flex h-full flex-col justify-between py-4 pr-4 z-10">
                <button
                  onClick={() => setIsBookmarked((b) => !b)}
                  disabled={isLoading}
                  className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors backdrop-blur-sm ${
                    isBookmarked
                      ? "border border-[#1DB954] bg-[#1DB954]/30 text-[#1DB954]"
                      : "border border-gray-800 bg-gray-900/80 text-gray-400 hover:text-white"
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <BookmarkIcon size={18} filled={isBookmarked} />
                </button>

                <button
                  onClick={handlePlay}
                  disabled={isLoading}
                  className={`flex h-11 w-11 items-center justify-center rounded-md border border-gray-800 bg-gray-900/80 text-[#1DB954] transition-colors hover:bg-gray-800 backdrop-blur-sm relative ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {/* RESTORED: Original play button design */}
                  {audioError || !currentCard.previewUrl ? (
                    <PureMusicIcon size={19} color="currentColor" />
                  ) : isPlaying ? (
                    <PauseIcon size={19} />
                  ) : (
                    <PlayIcon size={19} />
                  )}
                  
                  {/* Small indicator if no preview is available */}
                  {(audioError || !currentCard.previewUrl) && !isLoading && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                  )}
                </button>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-800">
                <div 
                  className="h-full w-1/3 transition-all duration-300"
                  style={{ backgroundColor: currentCard.color }}
                ></div>
              </div>
            </div>

            {/* Song Info */}
            <div className="px-4 py-4 bg-black/70 backdrop-blur-sm border-t border-white/10">
              <h3 
                className="text-xl font-bold truncate transition-all duration-300"
                style={{ color: currentCard.color }}
              >
                {currentCard.track}
              </h3>
              <p className="text-base text-gray-300 truncate mt-1">{currentCard.artist}</p>
              {currentCard.album && (
                <p className="text-sm text-gray-400 truncate mt-0.5">{currentCard.album}</p>
              )}
            </div>
          </div>

          {/* Left Arrows (negative) - Only show if not loading */}
          {!isLoading && (
            <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 flex flex-col gap-3">
              <button 
                onClick={() => handleVote('down', 1)}
                className="w-14 h-12 rounded-md bg-gradient-to-b from-[#1a1a1a] to-black flex items-center justify-center border border-white/10 text-red-400 hover:bg-black/70 transition-colors shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)] relative backdrop-blur-sm"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12L10 7M5 12L10 17" />
                </svg>
                
                {downVotes[1] > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-400 text-white text-xs flex items-center justify-center font-bold border border-black">
                    {downVotes[1]}
                  </div>
                )}
              </button>
              
              <button 
                onClick={() => handleVote('down', 2)}
                className="w-14 h-12 rounded-md bg-gradient-to-b from-[#1a1a1a] to-black flex items-center justify-center border border-white/10 text-red-400 hover:bg-black/70 transition-colors shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)] relative backdrop-blur-sm"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12L10 7M5 12L10 17" />
                  <path d="M9 12L14 7M9 12L14 17" />
                </svg>
                
                {downVotes[2] > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-400 text-white text-xs flex items-center justify-center font-bold border border-black">
                    {downVotes[2]}
                  </div>
                )}
              </button>
              
              <button 
                onClick={() => handleVote('down', 3)}
                className="w-14 h-12 rounded-md bg-gradient-to-b from-[#1a1a1a] to-black flex items-center justify-center border border-white/10 text-red-400 hover:bg-black/70 transition-colors shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)] relative backdrop-blur-sm"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12L10 7M5 12L10 17" />
                  <path d="M9 12L14 7M9 12L14 17" />
                  <path d="M13 12L18 7M13 12L18 17" />
                </svg>
                
                {downVotes[3] > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-400 text-white text-xs flex items-center justify-center font-bold border border-black">
                    {downVotes[3]}
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Right Arrows (positive) - Only show if not loading */}
          {!isLoading && (
            <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 flex flex-col gap-3">
              <button 
                onClick={() => handleVote('up', 1)}
                className="w-14 h-12 rounded-md bg-gradient-to-b from-[#1a1a1a] to-black flex items-center justify-center border border-white/10 text-[#1DB954] hover:bg-black/70 transition-colors shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)] relative backdrop-blur-sm"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12L14 7M19 12L14 17" />
                </svg>
                
                {upVotes[1] > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#1DB954] text-white text-xs flex items-center justify-center font-bold border border-black">
                    {upVotes[1]}
                  </div>
                )}
              </button>
              
              <button 
                onClick={() => handleVote('up', 2)}
                className="w-14 h-12 rounded-md bg-gradient-to-b from-[#1a1a1a] to-black flex items-center justify-center border border-white/10 text-[#1DB954] hover:bg-black/70 transition-colors shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)] relative backdrop-blur-sm"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12L14 7M19 12L14 17" />
                  <path d="M15 12L10 7M15 12L10 17" />
                </svg>
                
                {upVotes[2] > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#1DB954] text-white text-xs flex items-center justify-center font-bold border border-black">
                    {upVotes[2]}
                  </div>
                )}
              </button>
              
              <button 
                onClick={() => handleVote('up', 3)}
                className="w-14 h-12 rounded-md bg-gradient-to-b from-[#1a1a1a] to-black flex items-center justify-center border border-white/10 text-[#1DB954] hover:bg-black/70 transition-colors shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)] relative backdrop-blur-sm"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12L14 7M19 12L14 17" />
                  <path d="M15 12L10 7M15 12L10 17" />
                  <path d="M11 12L6 7M11 12L6 17" />
                </svg>
                
                {upVotes[3] > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#1DB954] text-white text-xs flex items-center justify-center font-bold border border-black">
                    {upVotes[3]}
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Zone controls spacer */}
        <div className="relative w-full">
          <div className="h-11"></div>
        </div>
      </div>

      {/* Animation popup */}
      {showAnim && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full ml-8">
          <div className="bg-gray-900/90 rounded-lg p-4 border border-gray-800 shadow-lg backdrop-blur-sm">
            {animItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center ${index > 0 ? 'mt-2' : ''}`}
              >
                {item.type === 'volume' ? (
                  <>
                    <VolumeIcon
                      size={16}
                      className="text-[#1DB954] mr-2"
                    />
                    <span className="text-base font-bold text-[#1DB954]">
                      +{animValues[item.id].toFixed(1)}
                    </span>
                  </>
                ) : (
                  <>
                    <div className={`w-4 h-4 rounded-full mr-2 ${GENRE_COLORS[item.id]}`}>
                      <div className="w-full h-full rounded-full border-2 border-current" />
                    </div>
                    <span className={`text-sm font-medium ${GENRE_COLORS[item.id]}`}>
                      {item.label}
                    </span>
                    <span className={`ml-2 text-sm font-bold ${GENRE_COLORS[item.id]}`}>
                      +{(animValues[item.id] * 100).toFixed(3)}%
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div 
          className="fixed z-[1000] user-modal"
          style={{
            top: userModalPosition.top,
            left: userModalPosition.left
          }}
        >
          <UserHoverCard 
            user={{
              id: userData.userId,
              name: userData.username,
              volume: 1000 + (userData.userId * 200)
            }}
            userData={generateExtendedUserData(userData)}
            className="w-72"
          />
        </div>
      )}
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes slideLeft {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-100%); opacity: 0; }
        }
        
        @keyframes slideRight {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes scaleInOut {
          0% { transform: scale(0.5); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-slide-left {
          animation: slideLeft 300ms ease-out forwards;
        }
        
        .animate-slide-right {
          animation: slideRight 300ms ease-out forwards;
        }
        
        .animate-scale-in-out {
          animation: scaleInOut 400ms ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SnippetCard;