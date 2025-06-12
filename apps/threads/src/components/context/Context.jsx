// StarfieldContext.js - Enhanced context for starfield state and navigation
import { createContext } from "react";

// Create context with default values
export const StarfieldContext = createContext({
  // Viewport and UI states
  isFullscreen: false,
  containerDimensions: { width: 800, height: 800 },
  scrollPos: { left: 0, top: 0 },
  isScrolling: false,
  
  // Selection states
  selectedStar: null,
  setSelectedStar: () => {},
  selectedNode: null,
  setSelectedNode: () => {},
  selectedArtist: null,
  setSelectedArtist: () => {},
  
  // Data
  artists: [],
  setArtists: () => {},
  posts: [],
  
  // Handlers
  handleStarClick: () => {},
  handleConstellationNodeClick: () => {},
  handleViewThread: () => {},
  
  // Coordinates for display
  displayedX: 50,
  displayedY: 50,
  
  // Constellation navigation
  handleNavigateConstellation: () => {},
  visibleConstellations: {},
  
  // Modal state management
  openModalId: null,
  openModal: () => {},
  closeModal: () => {},
  isModalOpen: () => false
});