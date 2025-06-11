// utils.js - Core utilities for starfield visualization
// Configuration constants
export const rangeMin = -500;
export const rangeMax = 500;
export const CELL_COUNT = rangeMax - rangeMin + 1;
export const ITEM_SIZE = 60;

export const WINDOWED_WIDTH = 800;
export const WINDOWED_HEIGHT = 800; // Match the starfield container height in CSS

// Optimized star count - increased for better visibility
export const STAR_COUNT = 150000; // Dramatically increased for better visibility
export const DUST_PARTICLE_COUNT = 150;
export const TOTAL_WIDTH = CELL_COUNT * ITEM_SIZE;
export const TOTAL_HEIGHT = TOTAL_WIDTH;


export const GENRE_CHANGE_THRESHOLD = 1200;

export const friendColors = ["#FF6347", "#FFA500", "#1E90FF"];

/**
 * Helper function to generate consistent avatars
 */
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Get avatar source based on ID
 */
export function getAvatarSrc(id) {
  const idStr = id.toString();
  const num = hashString(idStr);
  return `/assets/image${(num % 1000) + 1}.png`;
}

/**
 * Generate random star data with more variety but optimized for performance
 */
export function generateRandomStars(count) {
  const stars = [];
  // Expanded color palette with cosmic colors
  const STAR_COLORS = [
    "#FFFFFF", // White
    "#FFD700", // Gold
    "#ADFF2F", // Green-yellow
    "#FF69B4", // Pink
    "#87CEFA", // Light blue
    "#FFB6C1", // Light pink
    "#EEEEEE", // Light grey
    "#9370DB", // Medium purple
    "#00CED1", // Dark turquoise
    "#3CB371", // Medium sea green
    "#FF6347", // Tomato
    "#4169E1", // Royal Blue
    "#FFA07A", // Light Salmon
    "#20B2AA", // Light Sea Green
    "#FFC0CB", // Pink
  ];
  
  // Ensure very even distribution with grid-based approach
  const gridDivisions = Math.sqrt(count / 4); // approximately square-ish grid cells
  const cellWidth = TOTAL_WIDTH / gridDivisions;
  const cellHeight = TOTAL_HEIGHT / gridDivisions;
  
  // Calculate how many stars per cell to get approximately the desired count
  const cellCount = gridDivisions * gridDivisions;
  const starsPerCell = Math.ceil(count / cellCount);
  
  // Generate stars in each cell with slight randomization
  for (let cellY = 0; cellY < gridDivisions; cellY++) {
    for (let cellX = 0; cellX < gridDivisions; cellX++) {
      const cellLeft = cellX * cellWidth;
      const cellTop = cellY * cellHeight;
      
      // Add multiple stars to each cell
      for (let i = 0; i < starsPerCell; i++) {
        // Random position within this cell
        const x = cellLeft + Math.random() * cellWidth;
        const y = cellTop + Math.random() * cellHeight;
        const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      
        // More variety in star sizes with occasional larger stars
        const isLargeStar = Math.random() < 0.05; // 5% chance for a larger star
        const isClickableStar = Math.random() < 0.3; // 30% of stars will be "clickable" (larger, brighter)
        
        const baseSize = isClickableStar ? 
          (4 + Math.random() * 8) : // Larger size for clickable stars
          (2 + Math.random() * 5); // Regular size for non-clickable stars
          
        const size = isLargeStar ? baseSize * 2.5 : baseSize;
        
        // Only add glow to clickable stars for better performance and visibility
        const hasGlow = isClickableStar || Math.random() < 0.03; // 3% chance for regular stars
        
        stars.push({ 
          id: stars.length, 
          x, 
          y, 
          size, 
          color,
          hasGlow,
          isClickable: isClickableStar,
          pulseSpeed: 0.5 + Math.random() * 2 // Different stars pulse at different rates
        });
      }
    }
  }
  
  // Trim any excess stars to match the requested count
  if (stars.length > count) {
    stars.splice(count, stars.length - count);
  }
  
  return stars;
}

// Cell size for the hash (px) — use smaller grid for more precise lookup
export const HASH_SIZE = 200;

// Build a map  key:"x|y"  ->  array of star indices
export function buildSpatialHash(stars) {
  const hash = new Map();
  stars.forEach((s, i) => {
    const k = `${Math.floor(s.x / HASH_SIZE)}|${Math.floor(s.y / HASH_SIZE)}`;
    (hash.get(k) || hash.set(k, []).get(k)).push(i);
  });
  return hash;
}

/**
 * Generate cosmic dust particles
 */
export function generateCosmicDust(count) {
  const particles = [];
  const DUST_COLORS = [
    "rgba(72, 61, 139, 0.15)", // Dark slate blue
    "rgba(123, 104, 238, 0.1)", // Medium slate blue
    "rgba(148, 0, 211, 0.08)", // Dark violet
    "rgba(75, 0, 130, 0.12)", // Indigo
    "rgba(0, 0, 128, 0.1)", // Navy
    "rgba(25, 25, 112, 0.12)", // Midnight blue
    "rgba(139, 0, 139, 0.08)", // Dark magenta
  ];
  
  // Create a more balanced distribution with quadrant-based approach
  const quadrantCount = Math.floor(count / 4); // Particles per quadrant
  const centerX = TOTAL_WIDTH / 2;
  const centerY = TOTAL_HEIGHT / 2;
  
  // Generate dust in each quadrant
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    for (let i = 0; i < quadrantCount; i++) {
      // Calculate range for this quadrant
      let xRange, yRange;
      
      // Split into 4 quadrants
      if (quadrant === 0) { // Top-left
        xRange = [0, centerX];
        yRange = [0, centerY];
      } else if (quadrant === 1) { // Top-right
        xRange = [centerX, TOTAL_WIDTH];
        yRange = [0, centerY];
      } else if (quadrant === 2) { // Bottom-left
        xRange = [0, centerX];
        yRange = [centerY, TOTAL_HEIGHT];
      } else { // Bottom-right
        xRange = [centerX, TOTAL_WIDTH];
        yRange = [centerY, TOTAL_HEIGHT];
      }
      
      // Generate dust in this quadrant
      const x = xRange[0] + Math.random() * (xRange[1] - xRange[0]);
      const y = yRange[0] + Math.random() * (yRange[1] - yRange[0]);
      const color = DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)];
      const size = 20 + Math.random() * 80; // Larger, cloud-like
      const opacity = 0.05 + Math.random() * 0.15; // Very subtle
      
      particles.push({ 
        id: particles.length, 
        x, 
        y, 
        size, 
        color,
        opacity,
        blur: 10 + Math.random() * 20 // Variable blur
      });
    }
  }
  
  // Add remaining particles randomly
  const remaining = count - particles.length;
  for (let i = 0; i < remaining; i++) {
    const x = Math.random() * TOTAL_WIDTH;
    const y = Math.random() * TOTAL_HEIGHT;
    const color = DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)];
    const size = 20 + Math.random() * 80;
    const opacity = 0.05 + Math.random() * 0.15;
    
    particles.push({ 
      id: particles.length, 
      x, 
      y, 
      size, 
      color,
      opacity,
      blur: 10 + Math.random() * 20
    });
  }
  
  return particles;
}

/**
 * Generate friends with deterministic positioning to avoid missing friend bug
 */
export function generateFriends() {
  const centerX = TOTAL_WIDTH / 2;
  const centerY = TOTAL_HEIGHT / 2;
  const distance = TOTAL_WIDTH * 0.3; // 30% of the way to the edge
  
  return [
    { id: 0, x: centerX + distance * Math.cos(Math.PI/4), y: centerY + distance * Math.sin(Math.PI/4) },
    { id: 1, x: centerX + distance * Math.cos(3*Math.PI/4), y: centerY + distance * Math.sin(3*Math.PI/4) },
    { id: 2, x: centerX + distance * Math.cos(5*Math.PI/4), y: centerY + distance * Math.sin(5*Math.PI/4) }
  ];
}

/**
 * Converts polar coordinates to cartesian
 */
export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Creates an SVG arc path description
 */
export function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
  ].join(" ");
}

/**
 * Linear interpolation helper
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Throttle function to limit the rate at which a function can fire
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle(func, limit) {
  let lastCall = 0;
  let timeoutId = null;
  
  return function(...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);
    
    // Clear pending executions
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // If it's been long enough since the last call, execute immediately
    if (remaining <= 0) {
      lastCall = now;
      return func.apply(this, args);
    }
    
    // Otherwise, schedule execution after the remaining time
    timeoutId = setTimeout(() => {
      lastCall = Date.now();
      timeoutId = null;
      func.apply(this, args);
    }, remaining);
  };
}

/**
 * Debounce function to delay execution until after a period of inactivity
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait) {
  let timeoutId = null;
  
  return function(...args) {
    const context = this;
    
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set a new timeout
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Performance configuration settings for starfield rendering
 * These settings can be adjusted to optimize performance on different devices
 */
export const performanceConfig = {
  // Rendering options
  rendering: {
    // Enable star glow with blur effect (can be expensive on low-end devices)
    enableStarGlow: true,
    
    // Enable dynamic star pulse animation (can skip this to save CPU)
    enableStarPulse: true,
    
    // Enable dust clouds (can be disabled for better performance) 
    enableDustClouds: true,
    
    // Number of stars to render (higher for better visibility)
    starCount: 150000,
    
    // Number of dust particles (lower for better performance)
    dustCount: 150,
    
    // Percentage of stars that should be interactive (clickable)
    // Lower percentage means fewer event listeners and hit testing
    interactiveStarPercentage: 100, // 100% = all stars with posts are clickable
    
    // Enable canvas shadow blur for glow effects (expensive on low-end devices)
    enableShadowBlur: true
  },
  
  // Scroll handling
  scrolling: {
    // Throttle interval for scroll events in milliseconds (higher = better performance)
    throttleInterval: 60, // ~16 fps
    
    // Scrolling timeout - how long to wait after scrolling stops to re-enable effects
    scrollingTimeout: 150
  }
};