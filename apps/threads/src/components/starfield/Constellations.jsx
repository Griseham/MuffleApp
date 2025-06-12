// ConstellationManager.jsx - Manages constellation rendering
import React, { useContext } from "react";
import { TOTAL_WIDTH, TOTAL_HEIGHT } from "../utils";
import ConstellationOverlay from "../ConstellationOverlay";
import { StarfieldContext } from "../context/Context";

export default function Constellations() {
  const { artists, handleConstellationNodeClick } = useContext(StarfieldContext);
  
  // Validate artist coordinates
  const validatedArtists = artists.map((artist) => {
    // First, ensure coordinates exist
    if (!artist.coordinate || typeof artist.coordinate.x !== 'number' || typeof artist.coordinate.y !== 'number') {
      // Assign a default coordinate at the center
      return {
        ...artist,
        coordinate: { 
          x: TOTAL_WIDTH / 2, 
          y: TOTAL_HEIGHT / 2 
        }
      };
    }
    
    // Preserve the constellationIndex property for proper navigation
    // This ensures the ConstellationOverlay knows which constellation to display
    const constellationIndex = artist.constellationIndex !== undefined ? 
      artist.constellationIndex : 0;
      
    return {
      ...artist,
      constellationIndex
    };
  });
  
  return (
    <>
      {validatedArtists && validatedArtists.length > 0 ? (
        <ConstellationOverlay 
          artists={validatedArtists}
          onNodeClick={handleConstellationNodeClick}
        />
      ) : (
        <text
          x={TOTAL_WIDTH / 2}
          y={TOTAL_HEIGHT / 2 + 300}
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize="24"
          style={{ 
            pointerEvents: "none",
            position: "absolute"
          }}
        >
          Search for an artist to see constellations
        </text>
      )}
    </>
  );
}