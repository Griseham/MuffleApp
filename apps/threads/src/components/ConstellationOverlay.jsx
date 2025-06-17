import React, { useMemo } from "react";
import { TOTAL_WIDTH, TOTAL_HEIGHT } from "./utils";

/**
 * Generates multiple constellation patterns for an artist
 * - Each artist has 3 different constellation patterns at different locations
 */
function generateArtistConstellations(artist) {
  if (!artist || !artist.id) return [];

  // Use artist ID to seed the random generation for consistency
  const seed = artist.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Function to get deterministic but seemingly random number
  const seededRandom = (index) => {
    const value = Math.sin(seed + index) * 10000;
    return value - Math.floor(value);
  };

  // Ensure coordinate exists
  const baseCoordinate = artist.coordinate || { x: TOTAL_WIDTH / 2, y: TOTAL_HEIGHT / 2 };
  
  // Calculate positions for each constellation
  const positions = [];
  
  // Position 0: Original position
  positions.push(baseCoordinate);
  
  // Position 1: Far left
  positions.push({
    x: baseCoordinate.x - 8000,
    y: baseCoordinate.y - 2000
  });
  
  // Position 2: Far right
  positions.push({
    x: baseCoordinate.x + 8000,
    y: baseCoordinate.y + 5000
  });
  
  const constellations = [];
  const color = getArtistColor(artist);
  
  // Create 3 different constellation types
  
  // CONSTELLATION TYPE 1: Standard (5-7 stars)
  {
    const index = 0;
    const center = positions[index];
    const nodeCount = 5 + (seed % 3); // 5-7 stars
    const radius = 400 + (seed % 200); // 400-600px
    const nodes = [];
    const lines = [];
    
    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      const angle = seededRandom(i * 50) * Math.PI * 2;
      const distance = (0.2 + seededRandom(i + 100) * 0.8) * radius;
      
      const nodeX = center.x + Math.cos(angle) * distance;
      const nodeY = center.y + Math.sin(angle) * distance;
      
      const nodeSize = i === 0 ? 4 : 2 + seededRandom(i + 300) * 2;
      
      nodes.push({
        id: `${artist.id}-0-node-${i}`,
        x: nodeX,
        y: nodeY,
        artist: artist,
        nodeIndex: i,
        constellationIndex: index,
        size: nodeSize
      });
    }
    
    // Create lines (connect nodes sequentially)
    for (let i = 0; i < nodes.length - 1; i++) {
      lines.push({
        id: `${artist.id}-0-line-${i}`,
        x1: nodes[i].x,
        y1: nodes[i].y,
        x2: nodes[i + 1].x,
        y2: nodes[i + 1].y
      });
    }
    
    // Add some branches (1-2)
    const branchCount = 1 + (seed % 2);
    for (let i = 0; i < branchCount; i++) {
      if (nodes.length < 4) continue; // Skip if not enough nodes
      
      const startIndex = 1 + Math.floor(seededRandom(i * 100) * (nodes.length - 3));
      const endIndex = startIndex + 2;
      
      if (endIndex < nodes.length) {
        lines.push({
          id: `${artist.id}-0-branch-${i}`,
          x1: nodes[startIndex].x,
          y1: nodes[startIndex].y,
          x2: nodes[endIndex].x,
          y2: nodes[endIndex].y
        });
      }
    }
    
    constellations.push({
      artistId: artist.id,
      artistName: artist.name,
      index: index,
      nodes,
      lines,
      center,
      radius,
      color
    });
  }
  
  // CONSTELLATION TYPE 2: Small (2-3 stars)
  {
    const index = 1;
    const center = positions[index];
    const nodeCount = 2 + (seed % 2); // 2-3 stars
    const radius = 200 + (seed % 100); // 200-300px
    const nodes = [];
    const lines = [];
    
    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      const angle = seededRandom(i * 70 + 1000) * Math.PI * 2;
      const distance = (0.3 + seededRandom(i + 200) * 0.7) * radius;
      
      const nodeX = center.x + Math.cos(angle) * distance;
      const nodeY = center.y + Math.sin(angle) * distance;
      
      // Small constellation has slightly larger stars for visibility
      const nodeSize = i === 0 ? 5 : 3 + seededRandom(i + 400) * 2;
      
      nodes.push({
        id: `${artist.id}-1-node-${i}`,
        x: nodeX,
        y: nodeY,
        artist: artist,
        nodeIndex: i,
        constellationIndex: index,
        size: nodeSize
      });
    }
    
    // Create simple lines (just connect nodes sequentially)
    for (let i = 0; i < nodes.length - 1; i++) {
      lines.push({
        id: `${artist.id}-1-line-${i}`,
        x1: nodes[i].x,
        y1: nodes[i].y,
        x2: nodes[i + 1].x,
        y2: nodes[i + 1].y
      });
    }
    
    constellations.push({
      artistId: artist.id,
      artistName: artist.name,
      index: index,
      nodes,
      lines,
      center,
      radius,
      color
    });
  }
  
  // CONSTELLATION TYPE 3: Large (5 stars, more spread out)
  {
    const index = 2;
    const center = positions[index];
    const nodeCount = 5; // Always 5 stars
    const radius = 600 + (seed % 200); // 600-800px (larger than standard)
    const nodes = [];
    const lines = [];
    
    // Generate nodes with more spacing
    for (let i = 0; i < nodeCount; i++) {
      const angle = seededRandom(i * 60 + 2000) * Math.PI * 2;
      const distance = (0.4 + seededRandom(i + 300) * 0.6) * radius;
      
      const nodeX = center.x + Math.cos(angle) * distance;
      const nodeY = center.y + Math.sin(angle) * distance;
      
      const nodeSize = i === 0 ? 4 : 2 + seededRandom(i + 500) * 2;
      
      nodes.push({
        id: `${artist.id}-2-node-${i}`,
        x: nodeX,
        y: nodeY,
        artist: artist,
        nodeIndex: i,
        constellationIndex: index,
        size: nodeSize
      });
    }
    
    // Create more interesting pattern - make a loop
    for (let i = 0; i < nodes.length; i++) {
      const nextIndex = (i + 1) % nodes.length;
      lines.push({
        id: `${artist.id}-2-line-${i}`,
        x1: nodes[i].x,
        y1: nodes[i].y,
        x2: nodes[nextIndex].x,
        y2: nodes[nextIndex].y
      });
    }
    
    constellations.push({
      artistId: artist.id,
      artistName: artist.name,
      index: index,
      nodes,
      lines,
      center,
      radius,
      color
    });
  }
  
  return constellations;
}

/**
 * Generates a color based on artist genres
 */
function getArtistColor(artist) {
  if (!artist.genres || artist.genres.length === 0) {
    // Simple astronomy-inspired color palette
    const colors = [
      "#88CCFF", // Blue star
      "#FFCC66", // Yellow star
      "#FF6666", // Red star
      "#FFFFFF", // White star
      "#AADDFF"  // Light blue star
    ];
    
    const hash = artist.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
  
  // Map common genres to simpler star-like colors
  const genreColors = {
    rock: "#FF6666", // Red
    metal: "#FF4444", // Bright red
    pop: "#FFCCFF", // Pink-white
    hip: "#FFAA66", // Orange-ish
    rap: "#FFAA44", // Brighter orange
    electronic: "#88CCFF", // Blue
    techno: "#66BBFF", // Bright blue
    house: "#AADDFF", // Light blue
    dance: "#99CCFF", // Blue-white
    indie: "#DDDDFF", // Pale blue
    jazz: "#FFCC66", // Yellow
    classical: "#FFFFCC", // Pale yellow
    folk: "#CCFFCC", // Pale green
    country: "#DDFF99", // Yellow-green
    r_b: "#FFCC99", // Peach
    soul: "#FFBB88", // Light orange
    blues: "#99FFFF", // Cyan
    reggae: "#CCFF99", // Light green
    latin: "#FFFFAA", // Light yellow
  };
  
  // Find the first matching genre
  for (const genre of artist.genres || []) {
    for (const [key, color] of Object.entries(genreColors)) {
      if (genre.toLowerCase().includes(key)) {
        return color;
      }
    }
  }
  
  return "#FFFFFF"; // Default to white like a star
}

/**
 * Enhanced ConstellationOverlay component that renders artist constellations
 */
export default function ConstellationOverlay({ artists = [], onNodeClick }) {
  // Generate all constellation data
  const allConstellations = useMemo(() => {
    if (!artists || artists.length === 0) return [];
    
    
    // Create a map of artists by ID for faster lookup
    const artistMap = {};
    artists.forEach(artist => {
      if (artist && artist.id) {
        artistMap[artist.id] = artist;
      }
    });
    
    // Generate constellations for each artist
    const constellations = [];
    Object.values(artistMap).forEach(artist => {
      try {
        const artistConstellations = generateArtistConstellations(artist);
        constellations.push(...artistConstellations);
      } catch (error) {
      }
    });
    
    return constellations;
  }, [artists]);
  
  // FIXED: Always render all constellations - we don't need to filter them
  // The navigation buttons control where the user is viewing, not which constellations exist
  
  if (allConstellations.length === 0) return null;
  
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        pointerEvents: "none",
        zIndex: 300,
      }}
      viewBox={`0 0 ${TOTAL_WIDTH} ${TOTAL_HEIGHT}`}
    >
      <defs>
        {/* Simple star glow filter - subtle */}
        <filter id="starGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Render ALL constellations for all artists, not just the "selected" one */}
      {allConstellations.map((constellation) => (
        <g key={`${constellation.artistId}-${constellation.index}`}>
          {/* Constellation lines */}
          {constellation.lines.map((line, idx) => (
            <line
              key={`${constellation.artistId}-${constellation.index}-line-${idx}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={constellation.color}
              strokeWidth="1"
              strokeOpacity="0.6"
              style={{ pointerEvents: "none" }}
            />
          ))}
          
          {/* Constellation stars */}
          {constellation.nodes.map((node) => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={constellation.color}
              filter="url(#starGlow)"
              style={{ 
                pointerEvents: "auto", 
                cursor: "pointer"
              }}
              onClick={() => onNodeClick(node)}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}