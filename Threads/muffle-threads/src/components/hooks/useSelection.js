// useSelection.js - Hook for selection states with constellation navigation
import { useState, useCallback } from "react";

export function useSelection() {
  // Selection states
  const [selectedStar, setSelectedStar] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  
  // Handler for star clicks - include position info for modal positioning
  const handleStarClick = useCallback((star, starDomPosition = null) => {
    // If position is provided, include it with the star
    if (starDomPosition) {
      // Create a copy of the star with absolute coordinates added
      setSelectedStar({
        ...star,
        absoluteX: starDomPosition.x,
        absoluteY: starDomPosition.y
      });
    } else {
      setSelectedStar(star);
    }
    
    // Clear other selections
    setSelectedNode(null);
  }, []);
  
  // Handler for constellation node clicks
  const handleConstellationNodeClick = useCallback((node) => {
    setSelectedNode(node);
    
    // Clear other selections
    setSelectedStar(null);
    
    // Also set the selected artist for this node
    if (node && node.artist) {
      // Store current constellation index with the artist
      setSelectedArtist({
        ...node.artist,
        currentConstellationIndex: node.constellationIndex || 0
      });
    }
  }, []);
  
  // Enhanced setSelectedArtist that preserves constellation index
  const enhancedSetSelectedArtist = useCallback((artist, constellationIndex) => {
    if (artist) {
      // If constellation index is provided, store it with the artist
      if (constellationIndex !== undefined) {
        setSelectedArtist({
          ...artist,
          currentConstellationIndex: constellationIndex
        });
      } else {
        // Use existing index if available, otherwise default to 0
        const existingIndex = selectedArtist && selectedArtist.id === artist.id
          ? (selectedArtist.currentConstellationIndex || 0)
          : 0;
          
        setSelectedArtist({
          ...artist,
          currentConstellationIndex: existingIndex
        });
      }
    } else {
      setSelectedArtist(null);
    }
  }, [selectedArtist]);
  
  return {
    selectedStar,
    setSelectedStar,
    selectedNode,
    setSelectedNode,
    selectedArtist,
    setSelectedArtist: enhancedSetSelectedArtist,
    handleStarClick,
    handleConstellationNodeClick
  };
}