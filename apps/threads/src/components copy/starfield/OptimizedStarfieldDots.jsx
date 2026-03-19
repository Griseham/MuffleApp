import React, { useRef, useMemo, useEffect, useState } from "react";
import {
  buildSpatialHash,
  HASH_SIZE,
  TOTAL_WIDTH,
  TOTAL_HEIGHT
} from "./extendedStarfieldUtils";

/**
 * OptimizedStarfieldDots - A more efficient version of StarfieldInteractiveDots
 * that implements viewport culling and DOM node reuse to reduce DOM node count.
 */
export default function OptimizedStarfieldDots({
  scrollPos,
  containerDimensions,
  isFullscreen,
  onDotClick,
  posts = []
}) {
  const dotsRef = useRef(null);
  const hashRef = useRef(null);
  const postsRef = useRef(posts);
  
  // Track which dots are currently rendered
  const [visibleDots, setVisibleDots] = useState([]);
  
  // Viewport margin - how much extra to render outside the visible area
  // This prevents "pop-in" when scrolling quickly
  const VIEWPORT_MARGIN = 1000; // pixels

  // Update dots when posts change
  useEffect(() => {
    console.log("Posts passed to OptimizedStarfieldDots:", posts.length);
    
    // Skip regeneration if it's the first render with empty posts
    if (posts.length > 0) {
      postsRef.current = posts;
      dotsRef.current = null; // Force re-generation of dots
    }
  }, [posts]);

  // 1) Build 7,500 big, clickable dots - same as original
  if (!dotsRef.current) {
    const DOT_COUNT = 7500; 
    const COLORS = [
      "#FFFFFF", // White
      "#FFD700", // Gold
      "#ADFF2F", // Green-yellow
      "#FF69B4", // Pink
      "#87CEFA", // Light blue
      "#FFB6C1", // Light pink
      "#9370DB", // Medium purple
      "#00CED1", // Dark turquoise
      "#3CB371", // Medium sea green
      "#FF6347", // Tomato
      "#4169E1", // Royal Blue
    ];
    
    // Create a grid to ensure even distribution across the entire starfield
    const GRID_SIZE = Math.ceil(Math.sqrt(DOT_COUNT));
    const CELL_WIDTH = TOTAL_WIDTH / GRID_SIZE;
    const CELL_HEIGHT = TOTAL_HEIGHT / GRID_SIZE;
    
    const dots = [];
    const postsToUse = postsRef.current;
    console.log("Generating dots with posts:", postsToUse.length);
    
    // Default post to use when no posts are available
    const defaultPost = {
      id: "default-post",
      title: "Default Thread",
      author: "StarField User",
      createdUtc: Date.now() / 1000,
      postType: "thread",
      ups: Math.floor(Math.random() * 100),
      selftext: "This is a default thread in the starfield. Click to view more details."
    };
    
    // Generate dots in a grid pattern to ensure coverage of the entire starfield
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        // Add some randomness within each grid cell
        const x = (j * CELL_WIDTH) + (Math.random() * CELL_WIDTH);
        const y = (i * CELL_HEIGHT) + (Math.random() * CELL_HEIGHT);
        
        // Skip stars that would appear in UserAvatarLayer areas
        const inCircle = (() => {
          // Check if point is within any For You circle
          const centerPoint = { x: TOTAL_WIDTH / 2, y: TOTAL_HEIGHT / 2 };
          const friendRadius = TOTAL_WIDTH * 0.3; // 30% of the way to the edge
          const friendCenters = [
            { x: centerPoint.x + friendRadius * Math.cos(Math.PI/4), y: centerPoint.y + friendRadius * Math.sin(Math.PI/4) },
            { x: centerPoint.x + friendRadius * Math.cos(3*Math.PI/4), y: centerPoint.y + friendRadius * Math.sin(3*Math.PI/4) },
            { x: centerPoint.x + friendRadius * Math.cos(5*Math.PI/4), y: centerPoint.y + friendRadius * Math.sin(5*Math.PI/4) }
          ];
          
          // Check if within main circle
          const mainRadius = 600;
          const dx1 = x - centerPoint.x;
          const dy1 = y - centerPoint.y;
          if (dx1*dx1 + dy1*dy1 < mainRadius*mainRadius) return true;
          
          // Check if within any friend circle
          return friendCenters.some(center => {
            const dx = x - center.x;
            const dy = y - center.y; 
            return (dx*dx + dy*dy < mainRadius*mainRadius);
          });
        })();
        
        // Skip this star if it's in a UserAvatarLayer circle
        if (inCircle) continue;
        
        // Add some variety to the stars
        const size = 10 + Math.random() * 30; // Vary size between 10-40px
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const glow = Math.floor(Math.random() * 20) + 5; // Random glow between 5-25px
        
        // Get a random post from the posts array or use default
        // Most stars will point to the same few posts for simplicity
        const postIndex = Math.floor(Math.random() * Math.min(postsToUse.length, 5)); // 0-4 or less
        const post = postsToUse.length > 0 ? postsToUse[postIndex] : defaultPost;
        
        // Generate a reasonable thread name based on post
        const threadName = post.title || `Thread-${dots.length}`;
        
        // Assign a genre based on post type or random
        const genreOptions = ["Rock", "Pop", "Hip-Hop", "Electronic", "R&B", "Jazz", "Metal", "Classical", "K-Pop"];
        const genre = post.postType === "groupchat" ? "Social" : 
                     post.postType === "news" ? "News" : 
                     genreOptions[Math.floor(Math.random() * genreOptions.length)];
        
        dots.push({
          id: `dot-${dots.length}`,
          x: x,
          y: y,
          // Fields for StarInfoPanel - connected to actual post
          name: threadName,
          genre: genre,
          post: post, // Connect to actual post object
          isInteractive: true,
          // Visual styling with variety
          size: size,
          backgroundColor: color,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          boxShadow: `0 0 ${glow}px ${color}`
        });
        
        // Break if we've reached our target count
        if (dots.length >= DOT_COUNT) break;
      }
      if (dots.length >= DOT_COUNT) break;
    }
    
    dotsRef.current = dots;
    hashRef.current = buildSpatialHash(dots);
  }

  // Create a click handler that includes screen position
  const handleDotClick = (e, dot) => {
    e.stopPropagation();
    
    // Get screen coordinates for the dot
    const rect = e.target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    console.log("CLICKED dot:", dot);
    console.log("Dot has post:", !!dot.post);
    
    // Pass both the dot and its screen position
    onDotClick(dot, { x, y });
  };

  // Compute which dots should be visible in the current viewport
  // This memoization ensures we only recalculate when scrolling or resizing
  const computeVisibleDots = useMemo(() => {
    if (!dotsRef.current || !containerDimensions) {
      return [];
    }
    
    // Calculate viewport boundaries with margin
    const viewportLeft = scrollPos.left - VIEWPORT_MARGIN;
    const viewportTop = scrollPos.top - VIEWPORT_MARGIN;
    const viewportWidth = (isFullscreen ? window.innerWidth : containerDimensions.width) + (VIEWPORT_MARGIN * 2);
    const viewportHeight = (isFullscreen ? window.innerHeight : containerDimensions.height) + (VIEWPORT_MARGIN * 2);
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;
    
    // Filter dots to those in the viewport
    const dotsInViewport = dotsRef.current.filter(dot => {
      return (
        dot.x >= viewportLeft && 
        dot.x <= viewportRight && 
        dot.y >= viewportTop && 
        dot.y <= viewportBottom
      );
    });
    
    console.log(`Rendering ${dotsInViewport.length} of ${dotsRef.current.length} dots (${Math.round(dotsInViewport.length / dotsRef.current.length * 100)}%)`);
    
    return dotsInViewport;
  }, [scrollPos, containerDimensions, isFullscreen]);

  // Update visible dots when the computed set changes
  useEffect(() => {
    setVisibleDots(computeVisibleDots);
  }, [computeVisibleDots]);

  // 2) Only render dots that are in or near the viewport
  return visibleDots.map(d => (
    <div
      key={d.id}
      onClick={e => handleDotClick(e, d)}
      style={{
        position: "absolute",
        left:        d.x,
        top:         d.y,
        width:       d.size,
        height:      d.size,
        transform:   "translate(-50%, -50%)", // center on x/y
        borderRadius:d.borderRadius,
        backgroundColor: d.backgroundColor,
        border:      d.border,
        boxShadow:   d.boxShadow,
        cursor:      "pointer",
        pointerEvents:"auto",
        zIndex:      1000,                    // above avatars & constellations
      }}
    />
  ));
}