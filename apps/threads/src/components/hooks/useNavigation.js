// useNavigation.js - Hook for navigating between constellations
import { useCallback, useEffect, useState } from "react";
import { TOTAL_WIDTH, TOTAL_HEIGHT, generateFriends } from "../utils";

export function useNavigation(containerRef, containerDimensions, isFullscreen, scrollPos) {
  // Generate friend positions with a stable reference
  const [friends] = useState(() => generateFriends());
  
  /**
   * Snap to the center of the starfield
   */
  const snapToOrigin = useCallback(() => {
    if (!containerRef.current) return;
    
    const cw = isFullscreen ? window.innerWidth : containerDimensions.width;
    const ch = isFullscreen ? window.innerHeight : containerDimensions.height;
    
    const centerX = TOTAL_WIDTH / 2;
    const centerY = TOTAL_HEIGHT / 2;
    
    containerRef.current.scrollTo({
      left: centerX - cw / 2,
      top: centerY - ch / 2,
      behavior: 'smooth'
    });
  }, [containerRef, isFullscreen, containerDimensions]);
  
  /**
   * Snap to a friend's position
   */
  const snapToFriend = useCallback((friendIndex) => {
    if (!containerRef.current || !friends[friendIndex]) return;
    
    const friend = friends[friendIndex];
    const cw = isFullscreen ? window.innerWidth : containerDimensions.width;
    const ch = isFullscreen ? window.innerHeight : containerDimensions.height;
    
    containerRef.current.scrollTo({
      left: friend.x - cw / 2,
      top: friend.y - ch / 2,
      behavior: 'smooth'
    });
  }, [containerRef, friends, isFullscreen, containerDimensions]);
  
  /**
   * Snap to an artist's constellation
   */
  const snapToArtist = useCallback((artist, constellationIndex = 0) => {
    if (!containerRef.current || !artist || !artist.coordinate) return;
    
    // Calculate position based on constellation index
    // This will be enhanced with the actual coordinates from the constellation generator
    // For now, we'll use a simple offset based on the index
    const offsetX = constellationIndex === 1 ? -2000 : constellationIndex === 2 ? 1000 : 0;
    const offsetY = constellationIndex === 1 ? -500 : constellationIndex === 2 ? 500 : 0;
    
    const targetX = artist.coordinate.x + offsetX;
    const targetY = artist.coordinate.y + offsetY;
    
    const cw = isFullscreen ? window.innerWidth : containerDimensions.width;
    const ch = isFullscreen ? window.innerHeight : containerDimensions.height;
    
    containerRef.current.scrollTo({
      left: targetX - cw / 2,
      top: targetY - ch / 2,
      behavior: 'smooth'
    });
  }, [containerRef, isFullscreen, containerDimensions]);
  
  /**
   * Navigate to a specific constellation of an artist
   */
  const handleNavigateConstellation = useCallback((artist, constellationIndex) => {
    if (!artist) return;
    
    // Use the snapToArtist function with the constellation index
    snapToArtist(artist, constellationIndex);
  }, [snapToArtist]);
  
  return {
    snapToOrigin,
    snapToFriend,
    snapToArtist,
    handleNavigateConstellation,
    friends
  };
}