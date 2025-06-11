import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, X, Music, Compass, Stars } from 'lucide-react';
import ReactDOM from 'react-dom';

const ModernGenreWheel = ({ 
  genres = [],
  isFullscreen = false, 
  distanceFromCenter = 0.2,
  isScrolling = false,
  onGenreSelect = () => {}
}) => {
  // Animation refs and state
  const wheelRef = useRef(null);
  const animRef = useRef(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [hoveredGenre, setHoveredGenre] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [prevGenres, setPrevGenres] = useState(genres);
  const [transitionProgress, setTransitionProgress] = useState(1);
  const [wheelOpacity, setWheelOpacity] = useState(1);
  const [pulseState, setPulseState] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showArtistsModal, setShowArtistsModal] = useState(false);
  const [portalContainer, setPortalContainer] = useState(null);
  
  // Calculate wheel dimensions
  const wheelSize = isFullscreen ? 460 : 400;
  const centerX = wheelSize / 2;
  const centerY = wheelSize / 2;
  const outerRadius = (wheelSize / 2) - 15;
  const innerRadius = outerRadius * 0.68; // Wider arcs for better visibility
  const [randomTotalArtists] = useState(Math.floor(Math.random() * 300) + 200); // Random number between 200-500
  const [scrollTrigger, setScrollTrigger] = useState(0);

  // Create portal container for the modal
  useEffect(() => {
    // Create portal container when component mounts
    const container = document.createElement('div');
    container.id = 'info-modal-portal';
    document.body.appendChild(container);
    setPortalContainer(container);
    
    // Cleanup when component unmounts
    return () => {
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, []);
  
  // Ultra-simple wheel animation with no rotation
  useEffect(() => {
    // Cancel any existing animations to avoid conflicts
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    if (isScrolling) {
      // During scrolling, show wheel in a "waiting" state
      // Make wheel appear smaller and slightly faded
      setWheelOpacity(0.7);

      // Store the current genres for comparison when scrolling stops
      const storedGenres = [...genres];

      return () => {
        // When scrolling stops, check if genres changed
        if (JSON.stringify(storedGenres) !== JSON.stringify(genres)) {
          // Start the transition animation
          setTransitionProgress(0);

          // Simple fade-in animation
          const startTime = performance.now();
          const duration = 500; // Quick animation

          const animateFade = (timestamp) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Update opacity
            setWheelOpacity(0.7 + (0.3 * progress));

            // Track progress
            setTransitionProgress(progress);

            if (progress < 1) {
              animRef.current = requestAnimationFrame(animateFade);
            } else {
              // Animation complete
              setWheelOpacity(1);
              setPrevGenres(genres);
              setTransitionProgress(1);
              animRef.current = null;
            }
          };

          animRef.current = requestAnimationFrame(animateFade);
        } else {
          // No genre change, just restore opacity
          setWheelOpacity(1);
        }
      };
    } else {
      // Not scrolling - ensure wheel is fully visible
      setWheelOpacity(1);
    }
  }, [isScrolling, genres, prevGenres]);

  // Inside your isScrolling effect, add this timer to constantly update the scroll trigger
  useEffect(() => {
    if (isScrolling) {
      // Create a timer that updates the scroll trigger every 200ms while scrolling
      const scrollTimer = setInterval(() => {
        setScrollTrigger(prev => prev + 1);
      }, 200);
      
      return () => clearInterval(scrollTimer);
    }
  }, [isScrolling]);
  
  // Simplified genre selection with no animation
  const handleGenreClick = (genre, index) => {
    // Set selected genre and notify parent
    setSelectedGenre(index);
    onGenreSelect(genre);
    
    // Simple timeout to reset selection without animations
    setTimeout(() => {
      setSelectedGenre(null);
    }, 500);
  };
  
  // Calculate and create genre segments
// Replace the existing genreSegments useMemo in ModernGenreWheel.jsx
// This implementation uses Design 5 with center focus for user counts

// First, add this to your imports if you don't already have it
// import { motion } from 'framer-motion';

// Then replace the genreSegments useMemo with this implementation:

const genreSegments = useMemo(() => {
  if (!genres || genres.length === 0) return [];
  
  // Normalize fractions to ensure they sum to 1
  const total = genres.reduce((sum, g) => sum + g.fraction, 0);
  const normalizedGenres = total > 0 
    ? genres.map(g => ({ ...g, fraction: g.fraction / total }))
    : genres;
  
  const segments = [];
  let startAngle = 0;
  const arcGap = 2; // Degrees gap between segments
  
  normalizedGenres.forEach((genre, index) => {
    // Skip tiny segments
    if (genre.fraction < 0.01) return;
    
    const sweepAngle = (genre.fraction * 360) - arcGap;
    if (sweepAngle <= 0) return;
    
    const endAngle = startAngle + sweepAngle;
    const midAngle = startAngle + sweepAngle / 2;
    
    // Calculate points for arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    // Outer arc points
    const outerX1 = centerX + outerRadius * Math.cos(startRad);
    const outerY1 = centerY + outerRadius * Math.sin(startRad);
    const outerX2 = centerX + outerRadius * Math.cos(endRad);
    const outerY2 = centerY + outerRadius * Math.sin(endRad);
    
    // Inner arc points
    const innerX1 = centerX + innerRadius * Math.cos(startRad);
    const innerY1 = centerY + innerRadius * Math.sin(startRad);
    const innerX2 = centerX + innerRadius * Math.cos(endRad);
    const innerY2 = centerY + innerRadius * Math.sin(endRad);
    
    const largeArcFlag = sweepAngle <= 180 ? 0 : 1;
    
    // Create arc path
    const arcPath = [
      `M ${outerX1} ${outerY1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}`,
      `L ${innerX2} ${innerY2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
      `Z`
    ].join(' ');
    
    // Label position - centered in arc
    const labelDistance = (outerRadius + innerRadius) / 2;
    const labelX = centerX + labelDistance * Math.cos(midAngle * Math.PI / 180);
    const labelY = centerY + labelDistance * Math.sin(midAngle * Math.PI / 180);
    
    // Add user count to genre data if it doesn't exist already
    if (!genre.userCount) {
      // Generate consistent random user count between 10K and 50K
      const seed = index + genre.genre.charCodeAt(0);
      genre.userCount = 10000 + Math.floor((seed * 13757) % 40001);
    }
    
    // Determine whether to show label
    const isHovered = hoveredGenre === index;
    const isSelected = selectedGenre === index;
    const isLargeEnough = genre.fraction > 0.05; // Show more labels by default (reduced threshold)
    const showLabel = isLargeEnough || isHovered || isSelected;
    
    // Create 3D extrusion effect
    const extrusionOffset = 4; // extrusion depth
    const extrusionDarkeningFactor = 0.7; // how much darker the extrusion is
    
    // Darken the color for extrusion sides
    const darkenColor = (color, factor) => {
      // Convert hex to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      // Darken
      const delta = 20; // Amount of color variation
      const newR = Math.max(0, Math.min(255, r * factor + (Math.random() - 0.5) * delta));
      const newG = Math.max(0, Math.min(255, g * factor + (Math.random() - 0.5) * delta));
      const newB = Math.max(0, Math.min(255, b * factor + (Math.random() - 0.5) * delta));
      
      // Convert back to hex
      return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
    };
    
    const extrudedColor = darkenColor(genre.color, extrusionDarkeningFactor);
    
    segments.push(
      <g 
        key={`arc-${genre.genre}`}
        className={`genre-segment ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
      >
        {/* Extrusion for 3D effect - only visible on hover/select */}
        {(isHovered || isSelected) && (
          <path
            d={arcPath}
            transform={`translate(${extrusionOffset}, ${extrusionOffset})`}
            fill={extrudedColor}
            opacity={0.7}
          />
        )}
        
        {/* Main arc path */}
        <motion.path
          d={arcPath}
          fill={genre.color}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={0.8}
          initial={{ opacity: 0.85 }}
          animate={{ 
            opacity: isHovered ? 0.95 : isSelected ? 1 : 0.85,
            scale: isSelected ? 1.05 : isHovered ? 1.02 : 1,
            filter: isSelected || isHovered ? 'url(#glow)' : 'none',
            y: isSelected ? -3 : isHovered ? -1 : 0
          }}
          transition={{ duration: 0.2 }}
          style={{
            cursor: 'pointer',
            transformOrigin: `${centerX}px ${centerY}px`
          }}
          onMouseEnter={() => setHoveredGenre(index)}
          onMouseLeave={() => setHoveredGenre(null)}
          onClick={() => handleGenreClick(genre, index)}
        />
        
        {/* Simple genre label text using foreignObject to keep text straight/horizontal */}
      
{/* Simple genre label text using foreignObject to keep text straight/horizontal */}
{showLabel && (
  <foreignObject
    x={labelX - 60} // Increased width to accommodate larger text
    y={labelY - 16} // Adjusted position for better centering
    width={120}    // Wider to fit larger text
    height={32}    // Taller to fit larger text
    style={{
      overflow: 'visible',
      pointerEvents: 'none'
    }}
  >
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      style={{
        textAlign: "center",
        width: "fit-content",
        margin: "0 auto",
        transform: `rotate(${-rotationAngle}deg)`, // Counter-rotate to keep text upright
        transformOrigin: "center center"
      }}
    >
      <span
        style={{
          color: "#FFFFFF",
          fontSize: isFullscreen ? "20px" : "22px", // LARGER font size
          fontWeight: "700", // BOLDER text
          textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 0 3px rgba(0,0,0,0.9)", // Enhanced shadow for better readability
          whiteSpace: "nowrap",
          pointerEvents: "none",
          display: "block",
          letterSpacing: "0.5px" // Slightly increased letter spacing for better readability
        }}
      >
        {genre.genre}
      </span>
    </div>
  </foreignObject>
)}
        
        {/* Expanded info in center on hover */}
        {isHovered && (
          <g>
            {/* Create background circle for center display */}
            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius - 20}
              fill="rgba(0,0,0,0.7)"
              filter="url(#glow)"
            />
            
            <foreignObject
              x={centerX - 100}
              y={centerY - 40}
              width={200}
              height={80}
              style={{
                overflow: 'visible',
                pointerEvents: 'none'
              }}
            >
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  transform: `rotate(${-rotationAngle}deg)`, // Counter-rotate to keep text upright
                  transformOrigin: "center center"
                }}
              >
                <div
                  style={{
                    fontSize: "25px",
                    fontWeight: "700",
                    color: genre.color,
                    marginBottom: "5px",
                    textShadow: "0 2px 4px rgba(0,0,0,0.7)"
                  }}
                >
                  {genre.genre}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <span
                    style={{
                      backgroundColor: genre.color,
                      color: "#000",
                      borderRadius: "12px",
                      padding: "2px 12px",
                      fontWeight: "600",
                      boxShadow: "0 0 10px rgba(0,0,0,0.4)"
                    }}
                  >
                    {genre.userCount >= 1000000 ? 
                      `${(genre.userCount / 1000000).toFixed(1)}M` : 
                      genre.userCount >= 1000 ? 
                        `${(genre.userCount / 1000).toFixed(0)}K` : 
                        genre.userCount
                    }
                  </span>
                  <span style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>active users</span>
                </div>
              </div>
            </foreignObject>
          </g>
        )}
      </g>
    );
    
    // Update start angle for next segment
    startAngle = endAngle + arcGap;
  });
  
  return segments;
}, [genres, hoveredGenre, selectedGenre, centerX, centerY, outerRadius, innerRadius, isFullscreen, handleGenreClick, rotationAngle]);
  // Generate empty artist circles array - artists will be shown in a modal instead
  const generateArtistCircles = () => {
    return []; // Empty array as we're not showing artists in the wheel anymore
  };
  
  // Constants for the artist counts
  const MAX_ARTIST_COUNT = 28;
  
  // Generate a new random total artist count on every scroll position change
  const [dynamicTotalArtists, setDynamicTotalArtists] = useState(randomTotalArtists);
  
  // Update total artists when scrolling/position changes
  useEffect(() => {
    if (isScrolling || scrollTrigger) {
      // Generate a new random total between 200-500
      setDynamicTotalArtists(Math.floor(Math.random() * 300) + 200);
    }
  }, [isScrolling, scrollTrigger]);
  
  // Calculate discovered artists - randomized when scrolling
  const discoveredCount = useMemo(() => {
    if (isScrolling) {
      // Generate a new random number when scrolling
      return Math.min(
        dynamicTotalArtists,
        Math.max(
          0, // Can be 0 when far away
          Math.floor(Math.random() * dynamicTotalArtists)
        )
      );
    } else {
      // When not scrolling, show based on distance
      return Math.min(
        dynamicTotalArtists,
        Math.max(
          0, // Show 0 when too far away
          distanceFromCenter > 5000 ? 0 : Math.floor(dynamicTotalArtists * (1 - distanceFromCenter / 10000))
        )
      );
    }
  }, [isScrolling, distanceFromCenter, dynamicTotalArtists, scrollTrigger]);
  
  // Calculate how many artists to show based on distance
  const distanceThreshold = 15000;
  const distanceRatio = distanceFromCenter / distanceThreshold;
  const artistRatio = Math.pow(1 - distanceRatio, 1.5);
  const artistsToShow = Math.min(
    MAX_ARTIST_COUNT,
    Math.max(0, Math.floor(MAX_ARTIST_COUNT * artistRatio))
  );
  
// You'll also need to update the centerElements useMemo to match the Design 5 style
// This ensures the center display works well with the hover effect
const centerElements = useMemo(() => (
  <g className="wheel-center">
    {/* Center circle with simplified styling */}
    <circle
      cx={centerX}
      cy={centerY}
      r={innerRadius * 0.9}
      fill="rgba(25,25,45,0.3)"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth={1}
    />
    
    {/* Simple loading indicator during scrolling */}
    {isScrolling && (
      <g>
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius * 0.95}
          fill="none"
          stroke="rgba(100,130,255,0.3)"
          strokeWidth={3}
          strokeDasharray="3 6"
          style={{
            animation: "rotateDash 1.5s linear infinite"
          }}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius * 0.95}
          fill="none"
          stroke="rgba(100,130,255,0.1)"
          strokeWidth={6}
        />
      </g>
    )}
    
    {/* Inner decorative elements */}
    <circle
      cx={centerX}
      cy={centerY}
      r={innerRadius * 0.75}
      fill="none"
      stroke="rgba(255,255,255,0.07)"
      strokeWidth={0.8}
      strokeDasharray="2 6"
    />
    
    <circle
      cx={centerX}
      cy={centerY}
      r={innerRadius * 0.6}
      fill="none"
      stroke="rgba(255,255,255,0.05)"
      strokeWidth={0.6}
      strokeDasharray="6 3"
    />
    
    {/* Artist counter in center of wheel - ONLY shown when NOT hovering over a genre */}
    {hoveredGenre === null && (
      <foreignObject
        x={centerX - 100}
        y={centerY - 30}
        width={200}
        height={60}
        style={{
          overflow: 'visible',
          zIndex: 999
        }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: '100%',
            textAlign: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            transform: `rotate(${-rotationAngle}deg)`,
            transformOrigin: 'center center'
          }}
        >
          <div style={{ marginBottom: '4px' }}>Discovered Artists</div>
          <div style={{ 
            fontSize: '18px', 
            color: discoveredCount < 100 ? '#ff9500' : '#1DB954'
          }}>
            {discoveredCount}/{dynamicTotalArtists}
          </div>
        </div>
      </foreignObject>
    )}
    
    {/* Loading animation during scrolling - text in foreignObject to always stay upright */}
    {isScrolling && (
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Spinning circle animation with pulsing effect */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius * 0.4}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1.5}
          strokeDasharray="3 7"
          style={{ animation: "loadingSpin 4s linear infinite" }}
        />

        {/* Small animated dots around the circle */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60 * Math.PI) / 180;
          const dotRadius = innerRadius * 0.4;
          const x = centerX + Math.cos(angle) * dotRadius;
          const y = centerY + Math.sin(angle) * dotRadius;
          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r={3}
              fill="rgba(156, 39, 176, 0.5)"
              style={{
                animation: `discoverBlink ${1 + (i % 3) * 0.2}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          );
        })}

        {/* Using foreignObject to keep text upright regardless of wheel rotation */}
        <foreignObject
          x={centerX - 80}
          y={centerY - 20}
          width={160}
          height={40}
          style={{ overflow: 'visible' }}
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.8)',
              fontSize: isFullscreen ? '15px' : '13px',
              textShadow: '0 1px 3px rgba(0,0,0,0.7)',
              fontWeight: 600,
              textAlign: 'center',
              transform: `rotate(${-rotationAngle}deg)`,
              transformOrigin: 'center center',
              letterSpacing: '0.5px'
            }}
          >
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                background: 'linear-gradient(to right, #ffffff, #a9b6fc, #ffffff)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradient 2s linear infinite',
                backgroundClip: 'text'
              }}
            >
              Discovering...
            </motion.div>
          </div>
        </foreignObject>
      </motion.g>
    )}
  </g>
), [centerX, centerY, innerRadius, isScrolling, isFullscreen, rotationAngle, discoveredCount, dynamicTotalArtists, hoveredGenre]);
  // Adding keyframes for animations at the component level
  useEffect(() => {
    // Add the keyframe animations to the document if they don't exist
    if (!document.getElementById('genre-wheel-keyframes')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'genre-wheel-keyframes';
      styleElement.innerHTML = `
        @keyframes rotateDash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 50; }
        }

        @keyframes loadingPulse {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.03); opacity: 0.9; }
          100% { transform: scale(1); opacity: 0.7; }
        }

        @keyframes wheelPulse {
          0% { opacity: 0.7; transform: scale(0.85); filter: drop-shadow(0 0 3px rgba(100,130,255,0.15)) blur(0.6px); }
          50% { opacity: 0.65; transform: scale(0.82); filter: drop-shadow(0 0 4px rgba(100,130,255,0.2)) blur(1.2px); }
          100% { opacity: 0.7; transform: scale(0.85); filter: drop-shadow(0 0 3px rgba(100,130,255,0.15)) blur(0.6px); }
        }

        @keyframes loadingSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes twinkle {
          0% { opacity: 0.3; }
          100% { opacity: 1; }
        }

        @keyframes discoverBlink {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes gradient {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `;
      document.head.appendChild(styleElement);
    }

    // Clean up on unmount
    return () => {
      const styleElement = document.getElementById('genre-wheel-keyframes');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // NEW: Custom Cosmic Info Icon Button component
  const CosmicInfoButton = ({ onClick }) => (
   // Replace the current info button section with this updated version
// Replace the current info button section in ModernGenreWheel.jsx with this implementation
<div style={{ 
  marginBottom: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  zIndex: 1100 // Higher z-index for the entire container
}}>
  Discovered Artists
  
  {/* Cosmic Info Button with improved click handling */}
  <div 
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setShowInfoModal(true);
    }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: 'rgba(156, 39, 176, 0.3)',
      boxShadow: '0 0 8px rgba(156, 39, 176, 0.3)',
      border: 'none',
      cursor: 'pointer',
      marginLeft: '8px',
      padding: 0,
      position: 'relative',
      zIndex: 1200, // Even higher z-index than parent
      pointerEvents: 'auto' // Explicit pointer events
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'rgba(156, 39, 176, 0.5)';
      e.currentTarget.style.boxShadow = '0 0 12px rgba(156, 39, 176, 0.5)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'rgba(156, 39, 176, 0.3)';
      e.currentTarget.style.boxShadow = '0 0 8px rgba(156, 39, 176, 0.3)';
    }}
  >
    <Info size={16} color="white" />
  </div>
</div>
  );

  return (
    <div 
      ref={wheelRef}
      className="genre-wheel-container"
      style={{
        width: wheelSize,
        height: wheelSize,
        position: 'relative',
        isolation: 'isolate' // Creates a new stacking context
      }}
    >
      <svg
        width={wheelSize}
        height={wheelSize}
        viewBox={`0 0 ${wheelSize} ${wheelSize}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `rotate(${rotationAngle}deg) scale(${isScrolling ? 0.85 : 1})`,
          opacity: wheelOpacity,
          transition: isScrolling
            ? "opacity 0.15s ease, transform 0.15s ease"
            : "opacity 0.6s ease-out, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          filter: isScrolling
            ? "drop-shadow(0 0 4px rgba(100,130,255,0.2)) blur(1px)"
            : "drop-shadow(0 0 8px rgba(100,130,255,0.25))",
          animation: isScrolling ? `pulse 1.5s infinite alternate ease-in-out` : "none",
        }}
        className="wheel-svg"
      >
    
<defs>
  {/* Enhanced glow effect for center display */}
  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="3.5" result="blur" />
    <feComposite in="SourceGraphic" in2="blur" operator="over" />
  </filter>
  
  {/* Center gradient */}
  <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
    <stop offset="10%" stopColor="rgba(40,40,70,0.3)" />
    <stop offset="90%" stopColor="rgba(20,20,40,0.2)" />
  </radialGradient>
  
  {/* Drop shadow for depth */}
  <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
  </filter>
</defs>
        
        {/* Background circle for better contrast */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius + 5}
          fill="rgba(10,10,20,0.2)"
        />
        
        {/* Genre segments with enhanced styling */}
        {genreSegments}
        
      {/* Center area with decorative elements */}
      {centerElements}
        
        {/* Outer decorative ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius + 2}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
          strokeDasharray="3 5"
        />
      </svg>
      {/* Discovered Artists counter outside SVG with info icon */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          left: 0,
          width: '100%',
          textAlign: 'center',
          color: 'white',
          fontWeight: 600,
          fontSize: '14px',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}
      >
        <div style={{ 
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          
          {/* Updated Info Button with golden/yellow color */}
       
        </div>
        
      
      </div>

      {/* NEW: Cosmic Info Modal */}
      {portalContainer && showInfoModal && ReactDOM.createPortal(
        <div className="modal-backdrop" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowInfoModal(false)}
        >
          <div className="modal-content"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(156, 39, 176, 0.3)',
              position: 'relative',
              color: 'white',
              animation: 'modalFadeIn 0.3s ease-out',
              backgroundImage: 'radial-gradient(circle at bottom right, rgba(156, 39, 176, 0.15), transparent 70%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated stars background */}
            <div className="stars-background" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: -1,
              overflow: 'hidden',
              borderRadius: '16px'
            }}>
              {/* Generate 30 stars with random positions and animations */}
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: `${Math.random() * 2 + 1}px`,
                    height: `${Math.random() * 2 + 1}px`,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.7 + 0.3,
                    animation: `twinkle ${1 + Math.random() * 3}s infinite alternate`
                  }}
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowInfoModal(false)}
              className="modal-close-button"
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                padding: '4px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <X size={18} color="white" />
            </button>
            
            {/* Modal heading */}
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#a9b6fc',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Info size={18} style={{ marginRight: '10px' }} />
              About Discovered Artists
            </h3>
            
            {/* Modal content with icons - More visual approach */}
            <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: '14px',
                padding: '10px',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                borderRadius: '12px'
              }}>
                <div style={{
                  backgroundColor: 'rgba(156, 39, 176, 0.2)',
                  padding: '8px',
                  borderRadius: '50%',
                  marginRight: '12px',
                  display: 'flex'
                }}>
                  <Music size={20} color="#a9b6fc" />
                </div>
                <p style={{ margin: 0, flex: 1 }}>
                  Each location in the Starfield has a unique set of artists to discover.
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: '14px',
                padding: '10px',
                backgroundColor: 'rgba(63, 81, 181, 0.1)',
                borderRadius: '12px'
              }}>
                <div style={{
                  backgroundColor: 'rgba(63, 81, 181, 0.2)',
                  padding: '8px',
                  borderRadius: '50%',
                  marginRight: '12px',
                  display: 'flex'
                }}>
                  <Compass size={20} color="#a9b6fc" />
                </div>
                <p style={{ margin: 0, flex: 1 }}>
                  The closer to your origin point, the more familiar artists you'll find.
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '10px',
                backgroundColor: 'rgba(106, 27, 154, 0.1)',
                borderRadius: '12px'
              }}>
                <div style={{
                  backgroundColor: 'rgba(106, 27, 154, 0.2)',
                  padding: '8px',
                  borderRadius: '50%',
                  marginRight: '12px',
                  display: 'flex'
                }}>
                  <Stars size={20} color="#a9b6fc" />
                </div>
                <p style={{ margin: 0, flex: 1 }}>
                  Explore far regions to find new music in your favorite genres.
                </p>
              </div>
            </div>
            
            {/* Modal footer */}
            <div style={{ 
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button 
                onClick={() => setShowInfoModal(false)}
                style={{
                  backgroundColor: '#9c27b0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 20px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(156, 39, 176, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b92fd8';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(156, 39, 176, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#9c27b0';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(156, 39, 176, 0.3)';
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>,
        portalContainer
      )}

      {/* Artists Modal - updated to position under For You title and fix close button */}
      {showArtistsModal && ReactDOM.createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'center',
            padding: '140px 20px 20px 20px', // Top padding to position below For You
          }}
          onClick={() => setShowArtistsModal(false)}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '450px',
              maxHeight: '500px',
              backgroundColor: 'rgba(20, 20, 40, 0.95)',
              borderRadius: '12px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(29, 185, 84, 0.2)',
              border: '1px solid rgba(29, 185, 84, 0.15)',
              zIndex: 2001,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#1DB954', 
                fontSize: '18px',
                fontWeight: '600',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
              }}>Discovered Artists ({discoveredCount}/{dynamicTotalArtists})</h3>
              <button 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(29, 185, 84, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  border: '1px solid rgba(29, 185, 84, 0.3)',
                  color: 'white',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onClick={() => setShowArtistsModal(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(29, 185, 84, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(29, 185, 84, 0.2)';
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Scrollable content - with visible scrollbar */}
            <div style={{
              overflowY: 'auto',
              flex: 1,
              padding: '10px 0',
              maxHeight: '400px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(29, 185, 84, 0.4) rgba(0, 0, 0, 0.1)'
            }}
            className="artist-grid-container" // For custom scrollbar
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '15px'
              }}>
                {/* Calculate how many artists to display */}
                {(() => {
                  // Generate a random number between 24 and 50
                  const displayedCount = Math.min(discoveredCount, Math.floor(Math.random() * 27) + 24);
                  // Remaining count (to be shown as +X more)
                  const remainingCount = discoveredCount - displayedCount;
                  
                  // Create array of displayed artists + filler for remaining
                  const displayElements = [];
                  
                  // Add displayed artist elements
                  for (let i = 0; i < displayedCount; i++) {
                    // Generate a predictable but different avatar for each position
                    const avatarNumber = ((i * 37 + Math.abs(distanceFromCenter)) % 980) + 1;
                    
                    displayElements.push(
                      <div key={`artist-${i}`} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '5px'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          marginBottom: '8px'
                        }}>
                          <img 
                            src={`/assets/image${avatarNumber}.png`}
                            alt={`Artist ${i + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                        <div style={{
                          color: 'white',
                          fontSize: '12px',
                          textAlign: 'center',
                          maxWidth: '80px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          Artist {i + 1}
                        </div>
                      </div>
                    );
                  }
                  
                  // Add the "+X more" element if there are remaining artists
                  if (remainingCount > 0) {
                    displayElements.push(
                      <div key="more-artists" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '5px',
                        cursor: 'pointer'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(29, 185, 84, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: '#1DB954'
                        }}>
                          +{remainingCount}
                        </div>
                        <div style={{
                          color: '#1DB954',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}>
                          More artists
                        </div>
                      </div>
                    );
                  }
                  
                  // Add undiscovered artists (grey circles)
                  const totalToShow = Math.min(50, dynamicTotalArtists);
                  const undiscoveredCount = totalToShow - displayedCount - (remainingCount > 0 ? 1 : 0);
                  
                  for (let i = 0; i < undiscoveredCount; i++) {
                    displayElements.push(
                      <div key={`undiscovered-${i}`} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '5px'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.15)'
                          }}></div>
                        </div>
                        <div style={{
                          color: 'rgba(255, 255, 255, 0.3)',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}>
                          Undiscovered
                        </div>
                      </div>
                    );
                  }
                  
                  return displayElements;
                })()}
              </div>
            </div>
          </div>
        </div>,
        portalContainer
      )}
      
      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .artist-grid-container::-webkit-scrollbar {
          width: 8px;
        }

        .artist-grid-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .artist-grid-container::-webkit-scrollbar-thumb {
          background-color: rgba(29, 185, 84, 0.4);
          border-radius: 4px;
        }

        .artist-grid-container::-webkit-scrollbar-thumb:hover {
          background-color: rgba(29, 185, 84, 0.6);
        }

        @keyframes pulse {
          0% {
            transform: rotate(${rotationAngle}deg) scale(0.85);
            filter: drop-shadow(0 0 3px rgba(100,130,255,0.15)) blur(0.6px);
          }
          50% {
            transform: rotate(${rotationAngle}deg) scale(0.82);
            filter: drop-shadow(0 0 4px rgba(100,130,255,0.2)) blur(1.2px);
          }
          100% {
            transform: rotate(${rotationAngle}deg) scale(0.85);
            filter: drop-shadow(0 0 3px rgba(100,130,255,0.15)) blur(0.6px);
          }
        }
      `}</style>
            
      {/* Enhanced interactive pulse effect on genre selection */}
      {selectedGenre !== null && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          {/* First pulse wave */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0, 0.7, 0],
              scale: [0.8, 1.4, 1.6]
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: wheelSize * 0.85,
              height: wheelSize * 0.85,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(2px)'
            }}
          />
          
          {/* Second pulse wave (delayed) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ 
              opacity: [0, 0.5, 0],
              scale: [0.7, 1.2, 1.5]
            }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: wheelSize * 0.75,
              height: wheelSize * 0.75,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,230,255,0.5) 0%, rgba(200,230,255,0) 70%)',
              transform: 'translate(-50%, -50%)',
              mixBlendMode: 'screen'
            }}
          />
          
          {/* Center bright flash */}
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ 
              opacity: [0, 0.9, 0],
              scale: [0.4, 0.8, 1]
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: wheelSize * 0.5,
              height: wheelSize * 0.5,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 80%)',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(5px)'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ModernGenreWheel;