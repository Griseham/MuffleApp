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
  setSelectedStar: () => { /* intentionally empty */ },
  selectedNode: null,
  setSelectedNode: () => { /* intentionally empty */ },
  selectedArtist: null,
  setSelectedArtist: () => { /* intentionally empty */ },
  
  // Data
  artists: [],
  setArtists: () => { /* intentionally empty */ },
  posts: [],
  
  // Handlers
  handleStarClick: () => { /* intentionally empty */ },
  handleConstellationNodeClick: () => { /* intentionally empty */ },
  handleViewThread: () => { /* intentionally empty */ },
  
  // Coordinates for display
  displayedX: 50,
  displayedY: 50,
  
  // Constellation navigation
  handleNavigateConstellation: () => { /* intentionally empty */ },
  visibleConstellations: {},
  
  // Modal state management
  openModalId: null,
  openModal: () => { /* intentionally empty */ },
  closeModal: () => { /* intentionally empty */ },
  isModalOpen: () => false
});