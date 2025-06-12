import React, { useRef, useState, useEffect } from "react";
import { UserIcon, PlayIcon, PauseIcon, MusicNoteIcon, AlbumIcon } from "./Icons/Icons";
import QueueLine from "./QueueLine";
import ArtistPool from "./ArtistPool";
import Widget from "./Widget";
import InfoIconModal from "./InfoIconModal";
import { getAvatarForUser } from "../utils/avatarService"; // Import avatar service

// Swipe icon components
const LeftSwipeIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 7L5 12L10 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RightSwipeIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M14 7L19 12L14 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Updated SwipeIndicators component - Design 3 style (single row)
const SwipeIndicators = ({ type, counts, userVote }) => {
  // Color coding: red for left, green for right
  const baseColor = type === 'left' ? 'text-red-400' : 'text-green-400';
  const highlightColor = 'text-white';
  
  // Ensure counts exist for all levels (1, 2, 3)
  const safeCounts = {
    1: counts[1] || 0,
    2: counts[2] || 0,
    3: counts[3] || 0
  };
    
  return (
    <div className="flex items-center gap-3">
      {/* Single Arrow */}
      <div className={`flex items-center ${
        userVote === 1 ? highlightColor : baseColor
      } ${userVote === 1 ? 'font-bold' : ''}`}>
        <svg viewBox="0 0 24 24" className={`w-5 h-5 ${userVote === 1 ? 'filter drop-shadow' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
          {type === 'left' ? (
            <path d="M5 12L10 7M5 12L10 17" />
          ) : (
            <path d="M19 12L14 7M19 12L14 17" />
          )}
        </svg>
        <span className={`text-sm ml-1 ${userVote === 1 ? 'font-bold' : ''}`}>{safeCounts[1]}</span>
      </div>
      
      {/* Double Arrow */}
      <div className={`flex items-center ${
        userVote === 2 ? highlightColor : baseColor
      } ${userVote === 2 ? 'font-bold' : ''}`}>
        <svg viewBox="0 0 28 24" className={`w-7 h-5 ${userVote === 2 ? 'filter drop-shadow' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
          {type === 'left' ? (
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
        <span className={`text-sm ml-1 ${userVote === 2 ? 'font-bold' : ''}`}>{safeCounts[2]}</span>
      </div>
      
      {/* Triple Arrow */}
      <div className={`flex items-center ${
        userVote === 3 ? highlightColor : baseColor
      } ${userVote === 3 ? 'font-bold' : ''}`}>
        <svg viewBox="0 0 36 24" className={`w-8 h-5 ${userVote === 3 ? 'filter drop-shadow' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
          {type === 'left' ? (
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
        <span className={`text-sm ml-1 ${userVote === 3 ? 'font-bold' : ''}`}>{safeCounts[3]}</span>
      </div>
    </div>
  );
};

const BottomContainer = ({ 
  activeTab, 
  setActiveTab, 
  qlUsers, 
  messages, 
  isChatActive, 
  toggleChatActive,
  isExpanded = false,
  onToggleExpand = () => {},
  leftSwipeSongs = [],
  rightSwipeSongs = [],
  onSongFromWidget = () => {},
  poolArtists = [], // NEW: Dynamic pool artists from room
  roomArtists = [],   // NEW: Original room artists
  onPoolUpdate = null // NEW: Callback for pool updates
}) => {
  const chatContainerRef = useRef(null);
  const [widgetSelectedArtist, setWidgetSelectedArtist] = useState(null);
 
  // Content for info modals
  const getInfoContent = (tabName) => {
    switch(tabName) {
      case 'Left':
        return [{
          icon: <LeftSwipeIcon size={18} color="#a9b6fc" />,
          title: "Left Tab",
          color: 'rgba(239, 68, 68, 0.1)',
          iconBg: 'rgba(239, 68, 68, 0.2)',
          content: "The left tab shows the song snippets you swiped left on as well as the user who recommended it and the other ratings it got."
        }];
      
      case 'Right':
        return [{
          icon: <RightSwipeIcon size={18} color="#a9b6fc" />,
          title: "Right Tab",
          color: 'rgba(34, 197, 94, 0.1)',
          iconBg: 'rgba(34, 197, 94, 0.2)',
          content: "The right tab shows the song snippets you swiped right on as well as the user who recommended it and the other ratings it got."
        }];
      
      case 'QL':
        return [
          {
            icon: <UserIcon size={18} color="#a9b6fc" />,
            title: "Queue Line Rankings",
            color: 'rgba(59, 130, 246, 0.1)',
            iconBg: 'rgba(59, 130, 246, 0.2)',
            content: "As users push songs forwards and backwards in the queue, the users who recommended those songs will have rankings. The top 8 users are displayed in the queue line tab and you can see them moving up and down in rankings in real time."
          },
          {
            icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#a9b6fc" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>,
            title: "User Details & Incentives",
            color: 'rgba(59, 130, 246, 0.1)',
            iconBg: 'rgba(59, 130, 246, 0.2)',
            content: "Click on a user and see how many total swipes they gained while in this room. You can also see their top genres and how much music they've discovered while using the app. This is meant to incentive users to commit to one room for a while."
          }
        ];
      
      case 'Pool':
        return [{
          icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#a9b6fc" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
          title: "Artist Pool",
          color: 'rgba(168, 85, 247, 0.1)',
          iconBg: 'rgba(168, 85, 247, 0.2)',
          content: "Use the pool to pick artists to add to the widget, to then recommend a song from those artists. The pool refreshes every 20 seconds and you can see other users pick their artists in real time."
        }];
      
      case 'Widget':
        return [
          {
            icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#a9b6fc" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
            title: "Widget Overview",
            color: 'rgba(34, 197, 94, 0.1)',
            iconBg: 'rgba(34, 197, 94, 0.2)',
            content: "The widget has two parts. The left part shows the artists you selected from the pool and you can click on them, search up one of their songs and add it to the main queue as a 30 second snippet."
          },
          {
            icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#a9b6fc" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
            title: "Personal Queue",
            color: 'rgba(34, 197, 94, 0.1)',
            iconBg: 'rgba(34, 197, 94, 0.2)',
            content: "Before it reaches the main queue, where other users will listen to it, it stays in the right part, your personal queue, for around 10 seconds or so. That way, you can add multiple songs to your queue and arrange them as they reach the main queue or change your mind and get rid of them."
          }
        ];
      
      default:
        return [];
    }
  };

  const generateRandomMessage = () => {
    // Generate random 4-digit number for username
    const randomDigits = Math.floor(Math.random() * 9000) + 1000; // Ensures 4 digits (1000-9999)
    
    // Lorem ipsum phrases for message content
    const loremPhrases = [
      "Lorem ipsum dolor sit amet",
      "Consectetur adipiscing elit",
      "Sed do eiusmod tempor incididunt",
      "Ut labore et dolore magna aliqua",
      "Enim ad minim veniam",
      "Quis nostrud exercitation ullamco",
      "Duis aute irure dolor",
      "In reprehenderit in voluptate",
      "Velit esse cillum dolore",
      "Eu fugiat nulla pariatur",
      "Excepteur sint occaecat cupidatat",
      "Non proident sunt in culpa",
      "Qui officia deserunt mollit",
      "Anim id est laborum",
      "Sed ut perspiciatis unde",
      "Omnis iste natus error",
      "Sit voluptatem accusantium",
      "Doloremque laudantium totam",
      "Rem aperiam eaque ipsa",
      "Quae ab illo inventore"
    ];
    
    const randomPhrase = loremPhrases[Math.floor(Math.random() * loremPhrases.length)];
    
    return {
      username: `user${randomDigits}`,
      text: randomPhrase
    };
  };

  // Always start with exactly 3 messages
  const initialChatMessages = [
    generateRandomMessage(),
    generateRandomMessage(),
    generateRandomMessage()
  ];

  const [chatMessages, setChatMessages] = useState(initialChatMessages);

  // Mock data for queued songs in Widget
  const queuedSongs = [
    { id: 1, title: "song1", artist: "artist1", votes: { "-3": 0, "-2": 1, "-1": 2, "+1": 3, "+2": 2, "+3": 0 } },
    { id: 2, title: "song2", artist: "artist2", votes: { "-3": 1, "-2": 0, "-1": 0, "+1": 1, "+2": 2, "+3": 1 } },
    { id: 3, title: "song3", artist: "artist3", votes: { "-3": 0, "-2": 0, "-1": 1, "+1": 2, "+2": 1, "+3": 0 } },
    { id: 4, title: "song4", artist: "artist1", votes: { "-3": 0, "-2": 0, "-1": 0, "+1": 4, "+2": 3, "+3": 2 } },
    { id: 5, title: "song5", artist: "artist2", votes: { "-3": 1, "-2": 1, "-1": 0, "+1": 0, "+2": 1, "+3": 0 } },
    { id: 6, title: "song6", artist: "artist3", votes: { "-3": 0, "-2": 0, "-1": 0, "+1": 5, "+2": 3, "+3": 1 } },
    { id: 7, title: "song7", artist: "artist1", votes: { "-3": 2, "-2": 1, "-1": 1, "+1": 1, "+2": 0, "+3": 0 } },
    { id: 8, title: "song8", artist: "artist2", votes: { "-3": 0, "-2": 0, "-1": 1, "+1": 3, "+2": 2, "+3": 1 } }
  ];
  
  // NEW: State for widget integration
  const [selectedArtistsForWidget, setSelectedArtistsForWidget] = useState([]);
  
  // UPDATED: Synchronized countdown for artist pool (20 seconds)
  const [countdown, setCountdown] = useState(20);
  const [isPoolActive, setIsPoolActive] = useState(false);

  // Track when Pool tab becomes active to sync countdown
  useEffect(() => {
    if (activeTab === "Pool") {
      setIsPoolActive(true);
      // Reset countdown when Pool tab becomes active for smooth sync
      setCountdown(20);
    } else {
      setIsPoolActive(false);
    }
  }, [activeTab]);
  
  // NEW: Handle artist selection from pool
  const handleArtistSelect = (artist, isSelected) => {
    console.log('🎯 Artist selected in pool:', artist.name, 'Selected:', isSelected);
    
    if (isSelected) {
      // Add to widget selections
      setSelectedArtistsForWidget(prev => {
        // Don't add duplicates
        if (prev.some(a => a.id === artist.id)) {
          return prev;
        }
        return [...prev, {
          id: artist.id,
          name: artist.name,
          image: artist.image,
          isRoomArtist: artist.isRoomArtist || false,
          otherUsers: Math.floor(Math.random() * 5) // Random count for demo
        }];
      });
    } else {
      // Remove from widget selections
      setSelectedArtistsForWidget(prev => 
        prev.filter(a => a.id !== artist.id)
      );
    }
  };
  
  // Countdown logic with widget clearing
  useEffect(() => {
    if (!isPoolActive || !isExpanded) return;
  
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev > 0) {
          return prev - 1;          // 20 → … → 1 → 0
        }
        setSelectedArtistsForWidget([]); // clear widget right at 0
        return 20;                  // restart on next tick
      });
      
    }, 1000);
    
    return () => clearInterval(id);
  }, [isPoolActive, isExpanded]);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    if (activeTab === "Chat" && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  // Reset to 3 messages & then append one every 1.5s when in Chat
  useEffect(() => {
    let intervalId;
    if (activeTab === "Chat") {
      setChatMessages(initialChatMessages);
      intervalId = setInterval(() => {
        setChatMessages(prev => [...prev, generateRandomMessage()]);
      }, 1500);
    }
    return () => clearInterval(intervalId);
  }, [activeTab]);

  const handleTabClick = tab => {
    setActiveTab(tab);
    
    // Auto-expand when clicking on a tab while collapsed
    if (!isExpanded) {
      onToggleExpand(true);
    }
  };

  // Expand/Collapse arrow icon
  const ExpandCollapseIcon = ({ isExpanded }) => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 ${isExpanded ? 'rotate-0' : 'rotate-180'}`}
    >
      <path 
        d="M7 14L12 9L17 14" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );

  // Get badge count for tabs
  const getLeftSwipesBadgeCount = () => {
    return leftSwipeSongs.length;
  };

  const getRightSwipesBadgeCount = () => {
    return rightSwipeSongs.length;
  };

  // NEW: Get pool tab label with artist count
// Get pool tab label 
const getPoolTabLabel = () => {
  return "POOL";
};

  // Enhanced function to render swipe content with proper user avatars
// In BottomContainer.js - Update the renderSwipeContent function (around line 200)

const renderSwipeContent = (songs, type) => {
  const iconComponent = type === 'left' ? LeftSwipeIcon : RightSwipeIcon;
  const tabTitle = type === 'left' ? 'Left Swipes' : 'Right Swipes';
  
  return (
    <div className="swipe-content">
      <h3 className="swipe-header">
        {React.createElement(iconComponent, { size: 20, className: "mr-2" })}
        {tabTitle} ({songs.length})
      </h3>
      
      <div className="overflow-y-auto max-h-[calc(100%-3rem)] px-1">
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <div 
              key={`${song.id}-${index}`} 
              className="song-card-design3"
            >
              {/* Album Art or Song Icon */}
              <div className="song-icon">
                {/* Show album art if available, otherwise show music note icon */}
                {song.artworkUrl || song.image ? (
                  <img 
                    src={song.artworkUrl || song.image} 
                    alt={`${song.track} by ${song.artist}`}
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      // Fallback to music icon if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                {/* Fallback music icon - shown by default if no image, or if image fails */}
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ 
                    display: (song.artworkUrl || song.image) ? 'none' : 'flex' 
                  }}
                >
                  <MusicNoteIcon size={18} className="text-gray-400" />
                </div>
              </div>
              
              {/* Song Info */}
              <div className="song-info">
                <h4 className="song-title">{song.track || song.title}</h4>
                <p className="song-artist">{song.artist}</p>
              </div>

              {/* Middle Section - User Info with Avatar */}
              <div className="middle-section">
                <div className="by-label">By:</div>
                <div className="user-container">
                  <div className="user-avatar">
                    {/* Use real avatar if available from recommendedBy, otherwise fallback */}
                    {song.recommendedBy?.avatar ? (
                      <img 
                        src={song.recommendedBy.avatar} 
                        alt={song.recommendedBy.username}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          // Fallback to default avatar if image fails to load
                          e.target.src = getAvatarForUser(1);
                        }}
                      />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>
                  <span className="user-name">
                    {song.recommendedBy?.username || "user"}
                  </span>
                </div>
              </div>

              {/* Arrow Indicators - Single Row */}
              <div className="indicators-container">
                <SwipeIndicators
                  type="left"
                  counts={song.leftCounts || { 1: 0, 2: 0, 3: 0 }}
                  userVote={song.userVoteDirection === 'left' ? song.userVoteStrength : null}
                />
                
                <div className="separator"></div>
                
                <SwipeIndicators
                  type="right"
                  counts={song.rightCounts || { 1: 0, 2: 0, 3: 0 }}
                  userVote={song.userVoteDirection === 'right' ? song.userVoteStrength : null}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 border border-gray-700/30 rounded-lg bg-gray-900/20">
            No {type} swipes yet. Try swiping songs to the {type}!
          </div>
        )}
      </div>
    </div>
  );
};

  return (
    <div className="w-full pb-4 relative">
      <div className={`bottom-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Tabs with Expand/Collapse Button */}
        <div className="tab-navigation">
          <div className="tab-buttons">
            {/* Left swipe tab with icon and badge */}
            <button
              className={`tab-button ${activeTab === "LeftSwipes" ? "active" : ""} relative`}
              onClick={() => handleTabClick("LeftSwipes")}
            >
              <LeftSwipeIcon size={16} className="inline-block mr-1" />
              LEFT
              {leftSwipeSongs.length > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs text-black">{getLeftSwipesBadgeCount()}</span>
              )}
              {activeTab === "LeftSwipes" && (
                <div className="absolute -top-2 -right-2">
                  <InfoIconModal
                    title="Left Swipes"
                    steps={getInfoContent('Left')}
                    iconSize={14}
                    showButtonText={false}
                    sidePanel={true}
                    modalId="leftSwipes-modal"
                  />
                </div>
              )}
            </button>
            
            {/* QL tab */}
            <button
              className={`tab-button ${activeTab === "QL" ? "active" : ""} relative`}
              onClick={() => handleTabClick("QL")}
            >
              QL
              {activeTab === "QL" && (
                <div className="absolute -top-2 -right-2">
                  <InfoIconModal
                    title="Queue Line"
                    steps={getInfoContent('QL')}
                    iconSize={14}
                    showButtonText={false}
                    sidePanel={true}
                    modalId="queueLine-modal"
                  />
                </div>
              )}
            </button>
            
            {/* Pool tab with dynamic label */}
            <button
              className={`tab-button ${activeTab === "Pool" ? "active" : ""} ${poolArtists.length > 0 ? "enhanced" : ""} relative`}
              onClick={() => handleTabClick("Pool")}
            >
              {getPoolTabLabel()}
              {activeTab === "Pool" && (
                <div className="absolute -top-2 -right-2">
                  <InfoIconModal
                    title="Artist Pool"
                    steps={getInfoContent('Pool')}
                    iconSize={14}
                    showButtonText={false}
                    sidePanel={true}
                    modalId="artistPool-modal"
                  />
                </div>
              )}
            </button>
            
            {/* Chat tab */}
            <button
              className={`tab-button ${activeTab === "Chat" ? "active" : ""}`}
              onClick={() => handleTabClick("Chat")}
            >
              CHAT
            </button>
            
            {/* Widget tab */}
            <button
              className={`tab-button ${activeTab === "Widget" ? "active" : ""} relative`}
              onClick={() => handleTabClick("Widget")}
            >
              WIDGET
              {activeTab === "Widget" && (
                <div className="absolute -top-2 -right-2">
                  <InfoIconModal
                    title="Widget"
                    steps={getInfoContent('Widget')}
                    iconSize={14}
                    showButtonText={false}
                    sidePanel={true}
                    modalId="widget-modal"
                  />
                </div>
              )}
            </button>
            
            {/* Right swipe tab with icon and badge */}
            <button
              className={`tab-button ${activeTab === "RightSwipes" ? "active" : ""} relative`}
              onClick={() => handleTabClick("RightSwipes")}
            >
              <RightSwipeIcon size={16} className="inline-block mr-1" />
              RIGHT
              {rightSwipeSongs.length > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs text-black">{getRightSwipesBadgeCount()}</span>
              )}
              {activeTab === "RightSwipes" && (
                <div className="absolute -top-2 -right-2">
                  <InfoIconModal
                    title="Right Swipes"
                    steps={getInfoContent('Right')}
                    iconSize={14}
                    showButtonText={false}
                    sidePanel={true}
                    modalId="rightSwipes-modal"
                  />
                </div>
              )}
            </button>
          </div>
          
          {/* Expand/Collapse Button */}
          <button 
            className="expand-collapse-button"
            onClick={() => onToggleExpand(!isExpanded)}
            aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
          >
            <ExpandCollapseIcon isExpanded={isExpanded} />
          </button>
        </div>

        {/* Content Area - conditionally rendered based on expansion state */}
        {isExpanded && (
          <div className="content-area">
            {/* Left Swipes Tab Content */}
            {activeTab === "LeftSwipes" && renderSwipeContent(leftSwipeSongs, 'left')}
            
            {/* Right Swipes Tab Content */}
            {activeTab === "RightSwipes" && renderSwipeContent(rightSwipeSongs, 'right')}
            
            {/* QL tab content */}
            {activeTab === "QL" && <QueueLine qlUsers={qlUsers} />}
            
            {/* UPDATED: Pool tab with synchronized countdown and artist selection */}
            {activeTab === "Pool" && (
              <ArtistPool
                poolArtists={poolArtists}
                roomArtists={roomArtists}
                countdown={countdown} // Pass synchronized countdown (20 seconds)
                onPoolUpdate={onPoolUpdate} // Pass callback for pool updates
                onArtistSelect={handleArtistSelect} // NEW: Handle artist selections
              />
            )}
            
            {/* Chat tab content */}
            {activeTab === "Chat" && (
              <div
                className="chat-content"
                ref={chatContainerRef}
              >
                {chatMessages.map((m, i) => (
                  <div key={i} className="chat-message">
                    <div className="flex items-center">
                      <span className="text-white font-medium">{m.username}</span>
                      <span className="text-gray-500 mx-2">•</span>
                      <span className="text-gray-400">{m.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Widget Tab Content - Only real selections from artist pool */}
            {activeTab === 'Widget' && (
              <Widget 
                selectedArtists={selectedArtistsForWidget} 
                queuedSongs={queuedSongs} 
                setWidgetSelectedArtist={setWidgetSelectedArtist} 
                onRemoveArtist={(artistId) => {
                  setSelectedArtistsForWidget(prev => 
                    prev.filter(artist => artist.id !== artistId)
                  );
                }}
                onSongFromWidget={onSongFromWidget}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Enhanced Styles for Design 3 and Full Width */}
      <style jsx>{`
        /* Bottom container centered with playing screen */
        .bottom-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 auto;
  width: 100%;
  max-width: 800px;

  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #1a1a1a, #000000);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition: height 0.3s ease;
  z-index: 30;
  padding: 0 20px;
  box-sizing: border-box;
}

        .bottom-container.expanded {
          min-height: 360px;
          height: 360px;
        }
        
        .bottom-container.collapsed {
          height: 72px;
        }
        
        /* Tab navigation */
        .tab-navigation {
          display: flex;
          width: 100%;
          height: 64px;
          padding: 0 0;                   /* Remove horizontal padding since container has it */
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 10;
          backdrop-filter: blur(5px);
        }
        
        /* Tab buttons container */
        .tab-buttons {
          display: flex;
          justify-content: center;
          flex: 1;
          gap: 12px; /* Reduced gap to fit more buttons */
        }
        
        /* Tab button styling */
        .tab-button {
          position: relative;
          font-size: 12px; /* Slightly smaller font */
          font-weight: bold;
          letter-spacing: 0.05em;
          padding: 8px 10px; /* Reduced padding */
          transition: all 0.2s;
          border: none;
          background: transparent;
          color: #808080;
          cursor: pointer;
          display: flex;
          align-items: center;
          white-space: nowrap; /* Prevent text wrapping */
        }
        
        .tab-button:hover {
          color: white;
        }
        
        .tab-button.active {
          color: white;
        }
        
        .tab-button.active:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 1px;
          background-color: white;
        }
        
        /* Enhanced styling for pool tab when it has room artists */
        .tab-button.enhanced {
          color: #4ade80;
        }
        
        .tab-button.enhanced:hover {
          color: #22c55e;
        }
        
        .tab-button.enhanced.active {
          color: #4ade80;
        }
        
        /* Expand/collapse button */
        .expand-collapse-button {
          background: transparent;
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .expand-collapse-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        /* Content area with fixed height */
        .content-area {
          flex: 1;
          padding: 16px 4px;              /* Reduce horizontal padding since container has it */
          overflow: hidden;
          position: relative;
          height: calc(100% - 64px);
        }
        /* Swipe content styles */
        .swipe-content {
          height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        
        .swipe-header {
          display: flex;
          align-items: center;
          color: white;
          font-size: 18px;
          font-weight: medium;
          margin-bottom: 16px;
        }
        
        /* Design 3 Song Card Layout */
        .song-card-design3 {
          display: flex;
          align-items: stretch;
          margin-bottom: 12px;
          padding: 16px;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.2s;
        }
        
        .song-card-design3:hover {
          background-color: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        

.song-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-right: 16px;
  flex-shrink: 0;
  overflow: hidden; /* Ensure images fit properly within rounded corners */
  position: relative; /* For proper fallback positioning */
}
        
        .song-info {
          flex: 1;
          min-width: 0;
          margin-right: 16px;
        }
        
        .song-title {
          font-weight: medium;
          font-size: 15px;
          color: white;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .song-artist {
          font-size: 13px;
          color: #a0a0a0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Middle section - User info */
        .middle-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 20px;
          min-width: 60px;
        }
        
        .by-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .user-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.1);
          overflow: hidden; /* Ensure images fit properly */
        }
        
        .user-name {
          font-size: 10px;
          color: #888;
          font-weight: 500;
        }
        
        /* Indicators container */
        .indicators-container {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .separator {
          width: 1px;
          height: 30px;
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        /* Chat content styles */
        .chat-content {
          height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        
        .chat-message {
          margin-bottom: 12px;
          padding: 12px 14px;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        /* Filter for glow effect */
        .drop-shadow {
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.3));
        }
        
        /* Scrollbars */
        .chat-content::-webkit-scrollbar-thumb,
        .swipe-content::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        
        .chat-content::-webkit-scrollbar-track,
        .swipe-content::-webkit-scrollbar-track {
          background-color: rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .bottom-container {
            width: calc(100% - 16px);     /* Less margin on mobile */
            max-width: none;
            padding: 0 12px;              /* Less padding on mobile */
          }
          
          .content-area {
            padding: 12px 2px;            /* Even less padding on mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default BottomContainer;