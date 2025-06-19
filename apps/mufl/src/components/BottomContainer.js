import React, { useRef, useState, useEffect } from "react";
import QueueLine from "./QueueLine";
import ArtistPool from "./ArtistPool";
import Widget from "./Widget";
import InfoIconModal from "./InfoIconModal";

import { getAvatarForUser } from "../utils/avatarService";

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

// Pure SVG Music Note Icon (no external dependencies)
const PureMusicNoteIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
  </svg>
);

// Pure SVG Album Icon
const PureAlbumIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  </svg>
);

// Pure SVG User Icon
const PureUserIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
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
  poolArtists = [],
  roomArtists = [],
  onPoolUpdate = null
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
            icon: <PureUserIcon size={18} color="#a9b6fc" />,
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
    const randomDigits = Math.floor(Math.random() * 9000) + 1000;
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
  
  const [selectedArtistsForWidget, setSelectedArtistsForWidget] = useState([]);
  const [countdown, setCountdown] = useState(20);
  const [isPoolActive, setIsPoolActive] = useState(false);

  useEffect(() => {
    if (activeTab === "Pool") {
      setIsPoolActive(true);
      setCountdown(20);
    } else {
      setIsPoolActive(false);
    }
  }, [activeTab]);
  
  const handleArtistSelect = (artist, isSelected) => {
    if (isSelected) {
      setSelectedArtistsForWidget(prev => {
        if (prev.some(a => a.id === artist.id)) {
          return prev;
        }
        return [...prev, {
          id: artist.id,
          name: artist.name,
          image: artist.image,
          isRoomArtist: artist.isRoomArtist || false,
          otherUsers: Math.floor(Math.random() * 5)
        }];
      });
    } else {
      setSelectedArtistsForWidget(prev => 
        prev.filter(a => a.id !== artist.id)
      );
    }
  };
  
  useEffect(() => {
    if (!isPoolActive || !isExpanded) return;
  
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev > 0) {
          return prev - 1;
        }
        setSelectedArtistsForWidget([]);
        return 20;
      });
      
    }, 1000);
    
    return () => clearInterval(id);
  }, [isPoolActive, isExpanded]);

  useEffect(() => {
    if (activeTab === "Chat" && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

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
    
    if (!isExpanded) {
      onToggleExpand(true);
    }
  };

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

  const getLeftSwipesBadgeCount = () => {
    return leftSwipeSongs.length;
  };

  const getRightSwipesBadgeCount = () => {
    return rightSwipeSongs.length;
  };

  const getPoolTabLabel = () => {
    return "POOL";
  };

  // COMPLETELY IMAGE-FREE swipe content renderer - ONLY SVGs
// UPDATED: renderSwipeContent function - Use avatar service instead of SVG
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
              {/* PURE SVG Song Icon - NO IMAGES AT ALL */}
              <div className="song-icon">
                <PureMusicNoteIcon size={20} className="text-purple-400" />
              </div>
              
              {/* Song Info */}
              <div className="song-info">
                <h4 className="song-title">{song.track || song.title}</h4>
                <p className="song-artist">{song.artist}</p>
              </div>

              {/* Middle Section - User Info with REAL AVATAR from service */}
              <div className="middle-section">
                <div className="by-label">By:</div>
                <div className="user-container">
                  <div className="user-avatar">
                    {/* UPDATED: Use real avatar image from assets folder */}
                    <img 
                      src={getAvatarForUser(song.recommendedBy?.userId || 1)} 
                      alt={`${song.recommendedBy?.username || "user"} avatar`}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        // Fallback to a default image if the avatar fails to load
                        e.target.src = '/assets/users/assets2/image1.png';
                      }}
                    />
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
            
            {/* Pool tab with synchronized countdown and artist selection */}
            {activeTab === "Pool" && (
              <ArtistPool
                poolArtists={poolArtists}
                roomArtists={roomArtists}
                countdown={countdown}
                onPoolUpdate={onPoolUpdate}
                onArtistSelect={handleArtistSelect}
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
                      <div className="chat-user-avatar mr-2">
                        <PureUserIcon size={14} className="text-blue-400" />
                      </div>
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
      
{/* Enhanced Styles for Design 3 and Full Width - IMAGE-FREE VERSION */}
<style>{`

/* ---------- structural wrapper ---------- */
.bottom-container{
  position:fixed;left:0;right:0;bottom:0;margin:0 auto;
  width:100%;max-width:800px;
  display:flex;flex-direction:column;
  background:linear-gradient(to bottom,#1a1a1a,#000);
  border:1px solid rgba(255,255,255,.08);
  border-top-left-radius:1.5rem;border-top-right-radius:1.5rem;
  box-shadow:0 -10px 25px -5px rgba(0,0,0,.5);
  overflow:hidden;z-index:30;padding:0 18px;box-sizing:border-box;
  transition:height .3s ease;
}

/* Expanded height scales with viewport, but never overwhelms the screen  */
.bottom-container.expanded{height:clamp(300px,52vh,380px);}
@media(max-width:768px){.bottom-container.expanded{height:clamp(250px,58vh,340px);}}

/* Collapsed "grab-bar" */
.bottom-container.collapsed{height:64px;}

/* ---------- tab bar ---------- */
.tab-navigation{
  position:relative;                    /* makes arrow absolute-pos reference */
  display:flex;align-items:center;width:100%;height:60px;
  border-bottom:1px solid rgba(255,255,255,.08);
  padding-inline:0;
  backdrop-filter:blur(6px);
}

/* buttons live in their own scrollable row so text never squashes arrow */
/* ---------- buttons row ---------- */
.tab-buttons{
  display:flex;
  flex:1;                         /* let the row fill the whole bar */
  gap:8px;
  overflow-x:auto;
  scrollbar-width:none;
  padding-right:52px;             /* leave room for the arrow button */
  justify-content:space-between;  /* spread tabs edge-to-edge */
  flex-wrap:nowrap;
}

/* On narrow screens keep the original scrollable layout */
@media (max-width:640px){
  .tab-buttons{
    justify-content:flex-start;
  }
}

.tab-buttons::-webkit-scrollbar{display:none;}

/* ---------- individual tab buttons ---------- */
/* ---------- individual tab buttons (wider, nicer) ---------- */
/* ---------- individual tab buttons – bigger, like TopComponent ---------- */
.tab-button{
  /* layout */
  flex:1 1 0;                         /* equal slice for every tab          */
  min-width:0;                        /* allow text to shrink if necessary  */
  display:flex;align-items:center;justify-content:center;
  /* visuals */
  position:relative;border:none;background:none;cursor:pointer;user-select:none;
  font-weight:700;                    /* bolder like the top tabs           */
  font-size:15px;                     /* ↑ size                             */
  letter-spacing:.06em;               /* match “tracking-wider” feel        */
  text-transform:uppercase;
  padding:10px 0;                     /* taller click area                  */
  color:#cfcfcf;                      /* slightly lighter gray              */
  line-height:1;transition:color .15s,transform .15s;
}
.tab-button:hover,
.tab-button.active{
  color:#ffffff;
  transform:translateY(-1px);         /* subtle lift on hover/active        */
}
.tab-button.active::after{
  content:"";
  position:absolute;left:12%;right:12%;bottom:-4px;height:2px;
  background:#22c55e;                 /* slim green accent bar              */
  border-radius:1px;
}

/* highlight for “POOL” when room artists exist */
.tab-button.enhanced{color:#4ade80;}
.tab-button.enhanced:hover{color:#22c55e;}
/* —— mobile tweaks (≤ 640 px) —— */
@media (max-width:640px){
  /* keep the tab bar scrollable */
  .tab-button{
    flex:0 0 auto;
    font-size:12px;
    padding:8px 12px;
  }

  /* ───────── swipe-card layout ───────── */
  .song-card-design3{
    flex-direction:column;            /* stack everything vertically      */
    padding:12px;
  }
  .song-icon{
    width:34px;height:34px;
    margin:0 0 10px 0;                /* icon above the text              */
  }
  .song-info{
    margin-right:0;                   /* reset the old gap                */
    margin-bottom:8px;                /* space beneath title/artist       */
  }

  /* user info now forms a small row */
  .middle-section{
    flex-direction:row;
    justify-content:flex-start;
    margin:0 0 8px 0;
    min-width:0;
  }
  .by-label{font-size:10px;margin-right:6px;}
  .user-container{
    flex-direction:row;align-items:center;gap:6px;
  }
  .user-avatar{width:22px;height:22px;border-width:1px;}
  .user-name{font-size:11px;}

  /* arrows + vote counts: full-width row */
  .indicators-container{
    width:100%;
    justify-content:space-between;    /* stretch counts edge-to-edge      */
    gap:6px;
  }
  .separator{display:none;}           /* hide the thin divider            */
}



/* ---------- collapse / expand arrow ---------- */
.expand-collapse-button{
  position:absolute;right:8px;top:50%;
  width:34px;height:34px;
  display:flex;align-items:center;justify-content:center;
  border-radius:50%;border:none;background:transparent;color:#fff;
  transform:translateY(-50%);transition:background .15s;
  flex-shrink:0;                         /* ensures arrow never shrinks away */
}
.expand-collapse-button:hover{background:rgba(255,255,255,.08);}
.expand-collapse-button svg{transition:transform .3s;}
.expand-collapse-button svg.rotate-180{transform:rotate(180deg);}

/* ---------- content pane ---------- */
.content-area{
  flex:1;padding:16px 4px;height:calc(100% - 60px);overflow:hidden;position:relative;
}

/* ---------- swipe-content lists ---------- */
.swipe-content{height:100%;overflow-y:auto;
  scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.28) transparent;}
.swipe-header{display:flex;align-items:center;margin-bottom:14px;
  font-size:17px;font-weight:500;color:#fff;}

/* ---------- song cards (image-free design-3) ---------- */
.song-card-design3{
  display:flex;align-items:stretch;margin-bottom:10px;padding:14px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);
  border-radius:12px;transition:transform .15s,background .15s;
}
.song-card-design3:hover{background:rgba(255,255,255,.07);transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.2);}
.song-icon{display:flex;align-items:center;justify-content:center;
  width:42px;height:42px;margin-right:14px;flex-shrink:0;
  background:rgba(75,85,99,.3);border:1px solid rgba(147,51,234,.3);border-radius:8px;}
.song-info{flex:1;min-width:0;margin-right:12px;}
.song-title{font-size:14px;font-weight:500;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;}
.song-artist{font-size:12px;color:#a0a0a0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

.middle-section{display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 18px;min-width:58px;}
.by-label{font-size:9px;color:#666;margin-bottom:1px;}
.user-container{display:flex;flex-direction:column;align-items:center;gap:3px;}
.user-avatar{width:26px;height:26px;border-radius:50%;overflow:hidden;background:rgba(59,130,246,.25);border:2px solid rgba(59,130,246,.3);}
.user-name{font-size:10px;color:#ccc;text-align:center;max-width:56px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

.indicators-container{display:flex;align-items:center;gap:4px;}
.separator{width:1px;height:24px;background:rgba(255,255,255,.12);}

/* ---------- very small screens (≤ 390 px) ---------- */
@media(max-width:390px){
  .tab-button{font-size:10px;padding:5px 8px;}
  .tab-navigation{height:56px;}
  .bottom-container.collapsed{height:60px;}
}

/* Widget – tiny-screen tweaks only */
@media (max-width:480px){
  .widget-left  { min-height: 55%; }        /* list or artist view  */
  .widget-right { max-height: 45%; }        /* personal queue       */
  .widget-left h3,
  .widget-right h3         { font-size:13px; }
  .widget-left .text-sm,
  .widget-right .text-sm   { font-size:12px; }
}

@media (max-width:640px) {
  .widget-left .p-3 { padding:8px; }
  .widget-left h3.text-sm   { font-size:14px; }
  .widget-left p.text-xs    { font-size:12px; }
  .widget-left input        { font-size:14px; }
  .widget-left .w-12.h-12   { width:48px; height:48px; }
  .widget-right .p-3        { padding:8px; }
  .widget-right h3.text-sm  { font-size:14px; }
}

@media (max-width:480px) {
  /* 1) compress the header (artist image + name) */
  .widget-left > .flex.items-center {
    padding:6px 10px;            /* was p-3 => now p-1.5/2.5 */
  }
  .widget-left .w-12.h-12 {
    width:36px; height:36px;     /* shrink the profile circle */
  }
  .widget-left h3.text-sm {
    font-size:14px;              /* a tad smaller name */
  }
  .widget-left p.text-xs {
    font-size:11px;              /* shrink “Popular songs” label */
  }

  /* 2) compress the search bar */
  .widget-left > .border-b > .relative {
    padding:6px 10px;            /* was p-3 */
  }
  .widget-left input {
    padding-top:6px;             /* was py-2 */
    padding-bottom:6px;
    font-size:14px;              /* slightly smaller text */
  }
}
/* ─── Chat tab: desktop tweaks ───────────────────────── */
@media (min-width: 768px) {
  .chat-content {
    height: 100%;                  /* fill the content area */
    overflow-y: auto;              /* scroll when it overflows */
    padding: 16px;                 /* comfy padding */
    display: flex;
    flex-direction: column;
    gap: 12px;                     /* space between messages */
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
  }
  .chat-content::-webkit-scrollbar {
    width: 6px;
  }
  .chat-content::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
  }
  .chat-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-message {
    background: rgba(255,255,255,0.05); /* subtle bubble */
    padding: 12px 16px;
    border-radius: 8px;
    transition: background .2s;
  }
  .chat-message:hover {
    background: rgba(255,255,255,0.1);
  }
}
/* ─── Chat tab: mobile refinements ───────────────────────── */
@media (max-width: 640px) {
  .chat-content {
    padding: 8px;               /* tighten the overall gutter */
    gap: 10px;                  /* space between each message */
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
  }
  .chat-content::-webkit-scrollbar {
    width: 4px;
  }
  .chat-content::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 2px;
  }

  .chat-message {
    background: rgba(255,255,255,0.06); /* light bubble */
    padding: 10px 12px;                 /* roomy yet compact */
    border-radius: 8px;                 /* softer corners */
    font-size: 14px;                    /* slightly smaller text */
    line-height: 1.3;
    transition: background .2s;
  }
  .chat-message:hover {
    background: rgba(255,255,255,0.1);
  }
}


`}</style>
    </div>
  );
};

export default BottomContainer;