// Container.jsx - Main container component for the starfield
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { throttle, performanceConfig } from "../utils";
import styles from "../styles";
import { TOTAL_WIDTH, TOTAL_HEIGHT } from "../utils";
import Background from "./Background";
import Dots from "./Dots";
import UserLayer from "./UserLayer";
import GenreWheel from "./GenreWheel";
import Controls from "./Controls";
import Constellations from "./Constellations";
import StarPanel from "./StarPanel";
import NodePanel from "./NodePanel";
import { useNavigation } from "../hooks/useNavigation";
import { useSelection } from "../hooks/useSelection";
import { StarfieldContext } from "../context/Context";
import { useContext } from "react";
import GlobalModalContext from "../context/GlobalModalContext";
// ⬅️  REPLACEMENT
// add the Info icon so we can show it on every slide
import { Info } from "lucide-react";
import InfoIconModal from "../InfoIconModal";


export default function Container({ onLoadFeed, onViewThread, activeFilters = [], posts = [], initialArtists = [],  jumpGenre = null,
  onJumpComplete = () => {}, }) {
  // Use global modal context to sync with app-wide modal state
  const globalModalContext = useContext(GlobalModalContext);
  // Create refs for container elements
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  
  // Container dimensions state for responsive behavior
  const [containerDimensions, setContainerDimensions] = useState({
    width: window.innerWidth,
    height: 800 // Match the starfield container height in CSS
  });
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastFullscreenPosition, setLastFullscreenPosition] = useState({ left: 0, top: 0 });

  // Scroll position state
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Feed related states
  const [feedButtonDisabled, setFeedButtonDisabled] = useState(false);
  const [feedLoaded, setFeedLoaded] = useState(false);

  // Track constellation indices for each artist
  const [artistConstellations, setArtistConstellations] = useState({});
  
  // Use global modal state if available, otherwise use local state
  const [localOpenModalId, setLocalOpenModalId] = useState(null);
  
  // Modal management functions - use global context if available
  const openModal = useCallback((modalId) => {
    if (globalModalContext) {
      globalModalContext.openModal(modalId);
    } else {
      setLocalOpenModalId(modalId);
    }
  }, [globalModalContext]);
  
  const closeModal = useCallback(() => {
    if (globalModalContext) {
      globalModalContext.closeModal();
    } else {
      setLocalOpenModalId(null);
    }
  }, [globalModalContext]);
  
  const isModalOpen = useCallback((modalId) => {
    if (globalModalContext) {
      return globalModalContext.isModalOpen(modalId);
    } else {
      return localOpenModalId === modalId;
    }
  }, [globalModalContext, localOpenModalId]);
  
  const openModalId = globalModalContext ? globalModalContext.openModalId : localOpenModalId;
  
  // Selection states
  const { 
    selectedStar, 
    setSelectedStar,
    selectedNode, 
    setSelectedNode,
    selectedArtist, 
    setSelectedArtist,
    handleStarClick,
    handleConstellationNodeClick
  } = useSelection();
  
  // Navigation functionality
  const { 
    snapToOrigin, 
    snapToFriend, 
    snapToArtist,
    handleNavigateConstellation,
    friends // Get friends from the navigation hook
  } = useNavigation(containerRef, containerDimensions, isFullscreen, scrollPos);
  
  // Artists state - MODIFIED to not use localStorage
  // Always start fresh with initialArtists
  const [artists, setArtists] = useState(initialArtists);
  
  // Initialize constellation indices for artists
  useEffect(() => {
    if (!artists || artists.length === 0) return;
    
    const indices = {};
    artists.forEach(artist => {
      if (artist && artist.id) {
        // Default to showing the first constellation (index 0)
        // Keep existing index if present
        indices[artist.id] = artist.constellationIndex !== undefined 
          ? artist.constellationIndex 
          : (artistConstellations[artist.id] || 0);
      }
    });
    
    setArtistConstellations(indices);
  }, [artists]);
  
  // Handle artist management
  const handleAddArtist = useCallback((artist) => {
    if (!artist || !artist.id) {
      console.error("Invalid artist object:", artist);
      return;
    }
    
    setArtists(prevArtists => {
      if (prevArtists.some(a => a.id === artist.id)) {
        console.log("Artist already exists:", artist.name);
        return prevArtists;
      }
      
      console.log("Adding artist:", artist.name);
      // Add constellation index when adding a new artist
      return [...prevArtists, { 
        ...artist, 
        constellationIndex: 0 // Start with first constellation
      }];
    });
  }, []);
  
  const handleRemoveArtist = useCallback((artistToRemove) => {
    setArtists(prevArtists => prevArtists.filter(artist => artist.id !== artistToRemove.id));
    
    // Remove from constellation indices
    setArtistConstellations(prev => {
      const updated = { ...prev };
      delete updated[artistToRemove.id];
      return updated;
    });
    
    // If this artist was selected, deselect it
    if (selectedArtist && selectedArtist.id === artistToRemove.id) {
      setSelectedArtist(null);
    }
  }, [selectedArtist]);
  
  // Enhanced handleSelectArtist to better handle constellation indices
  const handleSelectArtist = useCallback((artist, constellationIndex = undefined) => {
    // Use provided constellation index or get from state or default to 0
    const nextIndex = constellationIndex !== undefined 
      ? constellationIndex 
      : (artistConstellations[artist.id] || 0);
    
    console.log(`Selecting artist ${artist.name} with constellation index: ${nextIndex}`);
    
    // Update constellation index for this artist
    setArtistConstellations(prev => ({
      ...prev,
      [artist.id]: nextIndex
    }));
    
    // Create artist object with the constellation index
    const artistWithIndex = {
      ...artist,
      constellationIndex: nextIndex
    };
    
    // Update selected artist state
    setSelectedArtist(artistWithIndex);
    
    // Calculate position based on constellation index
    let targetX = artist.coordinate ? artist.coordinate.x : TOTAL_WIDTH / 2;
    let targetY = artist.coordinate ? artist.coordinate.y : TOTAL_HEIGHT / 2;
    
    // Apply large offsets for different constellations
    if (nextIndex === 1) {
      targetX -= 8000;
      targetY -= 2000;
    } else if (nextIndex === 2) {
      targetX += 8000;
      targetY += 5000;
    }
    
    // Snap to this constellation position
    if (containerRef.current) {
      const cw = isFullscreen ? window.innerWidth : containerDimensions.width;
      const ch = isFullscreen ? window.innerHeight : containerDimensions.height;
      
      containerRef.current.scrollTo({
        left: targetX - cw / 2,
        top: targetY - ch / 2,
        behavior: 'smooth'
      });
    }
  }, [isFullscreen, containerDimensions, artistConstellations]);
  
  // Handle cycling to the next constellation for an artist
  const handleCycleConstellation = useCallback((artist) => {
    // Get current index
    const currentIndex = artistConstellations[artist.id] || 0;
    // Calculate next index (cycle through 0, 1, 2)
    const nextIndex = (currentIndex + 1) % 3;
    
    console.log(`Cycling constellation for ${artist.name} from ${currentIndex} to ${nextIndex}`);
    
    // Select the artist with the new index
    handleSelectArtist(artist, nextIndex);
  }, [handleSelectArtist, artistConstellations]);
  
  // Measure container on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setContainerDimensions({ width: window.innerWidth, height: 800 });
    };
    
    // Set initial size
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set initial scroll position to center on the For You circle
  useEffect(() => {
    if (containerRef.current && containerDimensions.width > 0) {
      // For You circle is at the center of the starfield
      const forYouCenterX = TOTAL_WIDTH / 2;
      const forYouCenterY = TOTAL_HEIGHT / 2;
      
      // Calculate viewport dimensions
      const cw = isFullscreen ? window.innerWidth : containerDimensions.width;
      const ch = isFullscreen ? window.innerHeight : containerDimensions.height;
      
      // Calculate scroll position to center the For You circle in viewport
      const initialScrollLeft = forYouCenterX - cw / 2;
      const initialScrollTop = forYouCenterY - ch / 2;
      
      // Set initial scroll position
      containerRef.current.scrollLeft = initialScrollLeft;
      containerRef.current.scrollTop = initialScrollTop;
      
      // Update scroll state
      setScrollPos({ left: initialScrollLeft, top: initialScrollTop });
    }
  }, [containerDimensions.width, isFullscreen]); // Re-run when dimensions change
  
  // Fullscreen logic
  useEffect(() => {
    function handleFullscreenChange() {
      if (document.fullscreenElement === wrapperRef.current) {
        setIsFullscreen(true);
        
        // Restore position after short delay to let resize complete
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = lastFullscreenPosition.left;
            containerRef.current.scrollTop = lastFullscreenPosition.top;
            setScrollPos({
              left: lastFullscreenPosition.left,
              top: lastFullscreenPosition.top
            });
          }
        }, 100);
      } else {
        setIsFullscreen(false);
        
        // Same for exiting fullscreen
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = lastFullscreenPosition.left;
            containerRef.current.scrollTop = lastFullscreenPosition.top;
            setScrollPos({
              left: lastFullscreenPosition.left,
              top: lastFullscreenPosition.top
            });
          }
        }, 100);
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [lastFullscreenPosition]);
  
  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Store current position before entering fullscreen
      setLastFullscreenPosition({
        left: containerRef.current?.scrollLeft || 0,
        top: containerRef.current?.scrollTop || 0
      });
      wrapperRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);
  
  // Calculate viewport dimensions based on fullscreen state
  const { cw, ch, centerWorldX, centerWorldY, displayedX, displayedY } = useCallback(() => {
    const cw = isFullscreen ? window.innerWidth : containerDimensions.width;
    const ch = isFullscreen ? window.innerHeight : containerDimensions.height;
    const centerWorldX = scrollPos.left + cw / 2;
    const centerWorldY = scrollPos.top + ch / 2;
    
    // Calculate grid coordinates for display
    const displayedX = Math.round((centerWorldX / TOTAL_WIDTH) * 100);
    const displayedY = Math.round((centerWorldY / TOTAL_HEIGHT) * 100);
    
    return { cw, ch, centerWorldX, centerWorldY, displayedX, displayedY };
  }, [scrollPos, isFullscreen, containerDimensions])();
  
  // Create throttled scroll handler using useCallback and useMemo for stable reference
  const handleScrollRaw = useCallback(() => {
    if (!containerRef.current) return;
    
    const left = containerRef.current.scrollLeft;
    const top = containerRef.current.scrollTop;
    
    setScrollPos({ left, top });
    setIsScrolling(true);
    
    // Enable feed button if it was disabled
    if (feedButtonDisabled) {
      setFeedButtonDisabled(false);
    }
    
    // Reset feed loaded state when scrolling
    if (feedLoaded) {
      setFeedLoaded(false);
    }
  }, [feedButtonDisabled, feedLoaded]);
  
  // Throttle scroll handler using the configured interval for performance
  const handleScroll = useMemo(() => {
    const throttled = throttle(handleScrollRaw, performanceConfig.scrolling.throttleInterval);
    
    return () => {
      throttled();
      
      // Use requestAnimationFrame for the isScrolling state update
      // This ensures it's synced to the browser's render cycle
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          // Add a timeout to mark scrolling as done after the configured timeout
          const scrollTimeout = setTimeout(() => {
            setIsScrolling(false);
          }, performanceConfig.scrolling.scrollingTimeout);
          
          return () => clearTimeout(scrollTimeout);
        });
      }
    };
  }, [handleScrollRaw]);

  const [forcedGenres, setForcedGenres] = useState(null);

useEffect(() => {
  if (!jumpGenre || !containerRef.current) return;

  // 1. pick a random viewport origin
  const cw = isFullscreen
    ? window.innerWidth
    : containerDimensions.width;
  const ch = isFullscreen
    ? window.innerHeight
    : containerDimensions.height;
  const left = Math.random() * (TOTAL_WIDTH - cw);
  const top  = Math.random() * (TOTAL_HEIGHT - ch);

  containerRef.current.scrollTo({ left, top, behavior: 'smooth' });

  // 2. lock the wheel
  setForcedGenres([{ genre: jumpGenre, color: '#1DB954', fraction: 1 }]);

  // 3. clear the flag in Home
  onJumpComplete();
}, [jumpGenre]);

  
  // "Load Feed" handler
  const loadFeed = useCallback(() => {
    // Set loading state
    setFeedButtonDisabled(true);
    
    // Exit fullscreen if active
    if (isFullscreen) {
      document.exitFullscreen();
    }
    
    // Call parent callback with coordinates
    onLoadFeed?.({ 
      x: displayedX, 
      y: displayedY
    });
    
    // Set feed as loaded
    setFeedLoaded(true);
    
    // Re-enable button after a delay
    setTimeout(() => setFeedButtonDisabled(false), 1000);
  }, [displayedX, displayedY, isFullscreen, onLoadFeed]);
  
  // View thread handler
  const handleViewThread = useCallback((post) => {
    // Close star info panel
    setSelectedStar(null);
    
    // Call parent's handler
    if (onViewThread && post) {
      console.log("Starfield navigating to post:", post);
      console.log("Post ID:", post.id, "Post Type:", post.postType);
      
      // Ensure the post has all necessary properties
      const enhancedPost = {
        ...post,
        // Ensure required properties exist
        id: post.id || `starfield_${Date.now()}`,
        title: post.title || 'Starfield Post',
        author: post.author || 'Unknown',
        postType: post.postType || 'thread',
        createdUtc: post.createdUtc || Date.now() / 1000,
        ups: post.ups || 0,
        num_comments: post.num_comments || 0
      };
      
      onViewThread(enhancedPost);
    }
  }, [onViewThread]);
  
  // Prepare artists with constellation indices
  const processedArtists = artists.map(artist => {
    // Get the constellation index for this artist
    const constellationIndex = artistConstellations[artist.id] !== undefined
      ? artistConstellations[artist.id]
      : (artist.constellationIndex || 0);
      
    // Return artist with constellation index
    return {
      ...artist,
      constellationIndex
    };
  });
  
  // Create context value for child components
  const contextValue = {
    isFullscreen,
    containerDimensions,
    scrollPos,
    isScrolling,
    selectedStar,
    setSelectedStar,
    selectedNode,
    setSelectedNode,
    selectedArtist,
    setSelectedArtist,
    artists: processedArtists,
    setArtists,
    artistConstellations,
    posts,
    handleStarClick,
    handleConstellationNodeClick,
    handleViewThread,
    handleCycleConstellation,
    displayedX,
    displayedY,
    // Modal state management
    openModalId,
    openModal,
    closeModal,
    isModalOpen
  };
  
  return (
    <StarfieldContext.Provider value={contextValue}>
      <div style={styles.container}>
        <div style={styles.wrapper} ref={wrapperRef}>
<div style={{ position: "absolute", top: 16, left: 16, zIndex: 9999 }}>
  <InfoIconModal
    title="Starfield"
    modalId="starfield-info"
    iconSize={20}
    steps={[
      {
        icon: <Info size={20} color="#a9b6fc" />,
        title: "Clickable Stars",
        content:
          "Every colored star is clickable and represents active threads, group chats, news and tweets."
      },
      {
        icon: <Info size={20} color="#a9b6fc" />,
        title: "Threads",
        content:
          "A thread is a post started by a user to share music recommendations with the community."
      },
      {
        icon: <Info size={20} color="#a9b6fc" />,
        title: "For-You Circle",
        content:
          "The for you circle in the middle of the starfield, contains all the threads in your For You Feed."
      },
      {
        icon: <Info size={20} color="#a9b6fc" />,
        title: "Distance & Familiarity",
        content:
          "The farther you travel from the For-You circle, the less familiar the music will be to you."
      },
      {
        icon: <Info size={20} color="#a9b6fc" />,
        title: "Exploring Genres",
        content:
          "You can scroll far away and still find your favorite genres, but you’ll only see artists you’ve yet to discover."
      },
      {
        icon: <Info size={20} color="#a9b6fc" />,
        title: "Discovery Progress",
        content:
          "The more artist you discover, the more you’ll be able to know about each part of the starfield"
      },
      {
        icon: <Info size={20} color="#a9b6fc" />,
        title: "How to ‘Discover’",
        content:
          "To discover an artist, you must have heard at least 2 of their songs while using the app."
      }
    ]}
  />
</div>


          {/* Coordinates and load feed button in fullscreen mode */}
          {isFullscreen && (
  <div style={{ position: "relative", ...styles.fsCoords }}>
    <div>{displayedX}, {displayedY}</div>
    <button
      onClick={loadFeed}
      disabled={feedButtonDisabled}
      style={{
        ...styles.loadFeedBtn,
        ...(feedButtonDisabled ? styles.loadFeedBtnDisabled : {})
      }}
    >
      Load Feed
    </button>

    <div style={{
      position: "absolute",
      top:  0,
      right: 0,
      zIndex: 9999
    }}>
      
    </div>
  </div>
)}


          
      {/* Coordinates and Load Feed panel in windowed mode */}
      {!isFullscreen && (
  <div
    style={{
      position: "relative",
      ...styles.windowedCoords,
      transform: "translateX(-50%) scale(1.3333)",
      transformOrigin: "top center",
    }}
  >
    <div>{displayedX}, {displayedY}</div>
    <button
      onClick={loadFeed}
      disabled={feedButtonDisabled}
      style={{
        ...styles.loadFeedBtn
      }}
    >
      Load Feed
    </button>

    <div style={{
      position: "absolute",
      top:  0,
      right: 0,
      zIndex: 9999
    }}>
      <InfoIconModal
        title="Load Feed Info"
        modalId="load-feed-info"
        iconSize={16}
        buttonText={false}
        steps={[
          {
            icon: <Info size={18} color="#a9b6fc" />,
            title: "How Load Feed Works",
            content:
              "Scroll anywhere in the starfield then click Load Feed to load the threads in that location"
          }
        
        ]}
      />
    </div>
  </div>
)}


          
          {/* Scrollable starfield container */}
          <div
            ref={containerRef}
            style={isFullscreen ? styles.starfieldFS : styles.starfieldNormal}
            onScroll={handleScroll}
          >
<GenreWheel forcedGenres={forcedGenres} />

            {/* Decorative dust background */}
            <Background />
            
            <div
              style={{
                position : "relative",
                width    : TOTAL_WIDTH,
                height   : TOTAL_HEIGHT
              }}
            >
              {/* Using the optimized version that only renders stars in viewport */}
              <Dots
                scrollPos={scrollPos}
                containerDimensions={containerDimensions}
                isFullscreen={isFullscreen}
                onDotClick={handleStarClick}
                posts={posts}
              />
              
              {/* User avatars, friend circles and boundaries */}
              <UserLayer snapToFriend={snapToFriend} friends={friends} />
              
              {/* Artist constellations */}
              <Constellations />
              
              {/* Information panels for selected elements */}
              {selectedStar && (
                <StarPanel 
                  star={selectedStar} 
                  onClose={() => setSelectedStar(null)} 
                  onViewThread={handleViewThread}
                />
              )}
              
              {selectedNode && (
                <NodePanel 
                  node={selectedNode} 
                  onClose={() => setSelectedNode(null)} 
                />
              )}
            </div>
          </div>
          
          {/* Navigation controls */}
          <Controls 
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            snapToOrigin={snapToOrigin}
            snapToFriend={snapToFriend}
            snapToArtist={snapToArtist}
            artists={processedArtists}
            onAddArtist={handleAddArtist}
            onRemoveArtist={handleRemoveArtist}
            onSelectArtist={handleSelectArtist}
            selectedArtist={selectedArtist}
            handleCycleConstellation={handleCycleConstellation}
            onNavigateConstellation={handleNavigateConstellation}
            artistConstellations={artistConstellations}
          />
        </div>
      </div>
    </StarfieldContext.Provider>
  );
}