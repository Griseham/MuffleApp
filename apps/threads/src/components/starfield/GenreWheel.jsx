// GenreWheel.jsx - Manages the wheel positioning and transitions
import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import ModernGenreWheel from "../ModernGenreWheel";
import InfoIconModal from "../InfoIconModal";
import { generateArcSets } from "../genreUtils";
import { GENRE_CHANGE_THRESHOLD, TOTAL_WIDTH, TOTAL_HEIGHT } from "../utils";
import { StarfieldContext } from "../context/Context";
import { Music, Compass, Stars } from "lucide-react";

export default function GenreWheel({ forcedGenres = null }) {
  const { 
    scrollPos,
    isFullscreen,
    containerDimensions,
    isScrolling 
  } = useContext(StarfieldContext);
  
  const requestRef = useRef(null);
  
  // Generate arc sets with 20 different combinations - generated once
  const [arcSets] = useState(() => generateArcSets(20));
  
  // Track the current arc set and its transition
  const [currentArcs, setCurrentArcs] = useState(arcSets[0]);
  const [targetArcs, setTargetArcs] = useState(arcSets[0]);
  const [arcTransition, setArcTransition] = useState(1); // 0 to 1, where 1 is fully transitioned
  
  // Track the last position to calculate distance moved
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
  // VERY SIMPLE - Two states:
  // 1. If forcedGenres is set, show single genre with a nice animation
  // 2. On user scroll, clear forcedGenres and go back to normal multiple genres
  
  // 1. Handle forced genres (from clicking in FeedInfoDisplay)
  useEffect(() => {
    if (forcedGenres) {
      console.log("Showing forced genre:", forcedGenres);
      
      // Smoothly transition to the forced genre
      setCurrentArcs(forcedGenres);
      setTargetArcs(forcedGenres);
      setArcTransition(1);
    }
  }, [forcedGenres]);
  
  // 2. Clear forcedGenres when user scrolls
  const [isInForcedMode, setIsInForcedMode] = useState(false);
  
  useEffect(() => {
    // Keep track if we're in forced mode or not
    if (forcedGenres && !isInForcedMode) {
      setIsInForcedMode(true);
    }
    
    // If we detect scrolling while in forced mode, go back to normal
    if (isScrolling && isInForcedMode) {
      console.log("User scrolled - returning to normal genre display");
      setIsInForcedMode(false);
    }
  }, [forcedGenres, isScrolling, isInForcedMode]);
  
  // 3. Normal updates based on position (when not in forced mode)
  useEffect(() => {
    // Skip if we're showing a forced genre
    if (isInForcedMode) return;
    if (isScrolling) return;
    
    // Calculate the current viewport center
    const cw = isFullscreen ? window.innerWidth : containerDimensions.width;
    const ch = isFullscreen ? window.innerHeight : containerDimensions.height;
    const cx = scrollPos.left + cw / 2;
    const cy = scrollPos.top + ch / 2;
    
    // Calculate distance moved from last position check
    const dx = scrollPos.left - lastPosition.x;
    const dy = scrollPos.top - lastPosition.y;
    const distanceMoved = Math.sqrt(dx * dx + dy * dy);
    
    // Update genres if we've moved enough
    if (distanceMoved > GENRE_CHANGE_THRESHOLD) {
      // Update last position
      setLastPosition({ x: scrollPos.left, y: scrollPos.top });
      
      // Pick a new set of arcs based on position
      const screenX = Math.floor(cx / 100);
      const screenY = Math.floor(cy / 100);
      const arcIndex = Math.abs((screenX * 7 + screenY * 13) % arcSets.length);
      
      // Start a transition to the new arc set
      setCurrentArcs(prevArcs => arcTransition === 1 ? prevArcs : targetArcs);
      setTargetArcs(arcSets[arcIndex]);
      setArcTransition(0);
    }
  }, [
    scrollPos, 
    isScrolling,
    isFullscreen, 
    containerDimensions, 
    lastPosition, 
    arcSets, 
    arcTransition, 
    targetArcs,
    isInForcedMode
  ]);
  
  // Animate arc transitions
  useEffect(() => {
    if (arcTransition < 1) {
      const animate = () => {
        setArcTransition(prev => {
          const next = prev + 0.06; // Faster transition (increased from 0.03)
          if (next >= 1) {
            return 1;
          } else {
            requestRef.current = requestAnimationFrame(animate);
            return next;
          }
        });
      };
      
      requestRef.current = requestAnimationFrame(animate);
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      };
    }
  }, [arcTransition < 1]); // Only depend on whether animation should be running
  
  // Calculate the distance from center for wheel effects
  const distanceFromCenter = useMemo(() => {
    const centerX = TOTAL_WIDTH / 2;
    const centerY = TOTAL_HEIGHT / 2;
    const centerWorldX = scrollPos.left + (isFullscreen ? window.innerWidth : containerDimensions.width) / 2;
    const centerWorldY = scrollPos.top + (isFullscreen ? window.innerHeight : containerDimensions.height) / 2;
    
    return Math.sqrt(
      Math.pow(centerWorldX - centerX, 2) + 
      Math.pow(centerWorldY - centerY, 2)
    );
  }, [scrollPos, isFullscreen, containerDimensions]);
  
  // Set a proper wheel size that fits well within the starfield
  const wheelSize = useMemo(() => {
    return isFullscreen ? 300 : 280; // Balanced size that's visible but not too dominant
  }, [isFullscreen]);
  
  // Handle genre selection
  const handleGenreSelect = (genre) => {
    console.log("Genre selected in wheel:", genre);
    
    // Set the selected genre and mark as showing single genre
    setSelectedGenre(genre);
    setShowingSingleGenre(true);
    setHasResetAfterSingleGenre(false);
    
    // Create a single-genre wheel
    const singleGenreWheel = [{
      genre: genre.genre,
      color: genre.color,
      fraction: 1
    }];
    
    // Update the current and target arcs
    setCurrentArcs(singleGenreWheel);
    setTargetArcs(singleGenreWheel);
    setArcTransition(1);
  };
  
  return (
    <div
      style={{
        position: "absolute",
        position: "sticky",
        left:     "50%",
        top:      "50%",
        transform: arcTransition < 1
          ? `translate(-50%,-50%) scale(${0.95 + Math.sin(arcTransition * Math.PI) * 0.15})`
          : "translate(-50%,-50%)",
        width:    wheelSize,
        height:   wheelSize,
        zIndex:   9998,
        pointerEvents: "auto",      // wheel remains clickable
        filter:   "drop-shadow(0 0 30px rgba(0,0,0,0.7))",
        willChange: "transform",
        transition: "transform 0.3s ease-out, opacity 0.3s ease-out"
      }}
    >
      {/* Add InfoIconModal at the top of the wheel */}
  
{/* Adjusted InfoIconModal position to ensure visibility */}
<div style={{ 
  position: "absolute", 
  top: "-40px", // Moved up slightly
  left: "50%", 
  transform: "translateX(-50%)",
  zIndex: 10000, // Higher z-index to ensure it appears on top
  width: "100%",
  display: "flex", 
  justifyContent: "center",
  pointerEvents: "auto" // Ensure click events work
}}>
 <InfoIconModal
  title="Genre & Discovery"
  modalId="genre-wheel-info"
  steps={[
    {
      icon: <Music size={20} color="#a9b6fc" />,
      title: "Genre Wheel",
      content: "The wheel showcases different genres of music for the threads in that specific part of the starfield.",
    },
    {
      icon: <Music size={20} color="#a9b6fc" />,
      title: "Hover",
      content: "Hovering over a genre will reveal the number of users active in the threads of that genre. This lets the user know which genres are trending.",
    },
    {
      icon: <Music size={20} color="#a9b6fc" />,
      title: "Discovered Count",
      content: "The discovered artists count reveals how many different artists have been promoted in that part of the starfield and how many of them you've already discovered.",
    },
    {
      icon: <Stars size={20} color="#a9b6fc" />,
      title: "Artist Distribution",
      content: "Different parts of the starfield will have a varying number of artists, correlating with the threads in that location.",
    },
    {
      icon: <Stars size={20} color="#a9b6fc" />,
      title: "What Counts as Discovered",
      content: "Discovered artists represent the artists you follow or have discovered while using the app.",
    },
    {
      icon: <Stars size={20} color="#a9b6fc" />,
      title: "Discovery Threshold",
      content: "To discover an artist, you must have heard at least 2 of their songs while using the app.",
    },
    {
      icon: <Stars size={20} color="#a9b6fc" />,
      title: "Closer to For You",
      content: "The closer you are to the For You circle, the more artists you've already discovered and you can find more similar ones.",
    },
    {
      icon: <Stars size={20} color="#a9b6fc" />,
      title: "Explore Farther",
      content: "Or scroll far away to find something completely unfamiliar to you.",
    }
  ]}
  iconSize={24}
  buttonText="Info"
/>

</div>
      
      <ModernGenreWheel
        genres={targetArcs}
        isFullscreen={isFullscreen}
        distanceFromCenter={distanceFromCenter}
        isScrolling={isScrolling}
        onGenreSelect={handleGenreSelect}
      />
    </div>
  );
}