// components/radioUtils.js - Combined utilities with unified constants

import { useState, useEffect, useMemo } from 'react';

// ────────────────────────────────────────────────────────── 
// SINGLE SOURCE OF TRUTH • DO NOT DUPLICATE 
// ────────────────────────────────────────────────────────── 
export const RADIO_CONST = {
  volume: {
    MIN: 0,
    MAX: 3200,
    BAND: 300,
    TICK: 25
  },
  similarity: {
    MIN: -1000,
    MAX: 1000,
    BAND: 333.333,           // (MAX‑MIN)/6
    TICK: 25
  }
};

// Convenience
export const getBandParams = mode => RADIO_CONST[mode];

// Other constants still needed
export const STEP_PX = 10; // Pixels between ticks for volume mode
export const VISIBLE_TICK_RADIUS = 15; // Reduced to show fixed window of ticks
export const ROTARY_DEG_PER_UNIT = 5; // How many degrees to rotate per unit value
export const DRAG_GAIN = 2; // How many units to change per degree of rotation
export const MIN_FREQUENCY = 200;
export const MAX_FREQUENCY = 3200;

// For backward compatibility
export const MIN_VOLUME = RADIO_CONST.volume.MIN;
export const MAX_VOLUME = RADIO_CONST.volume.MAX;
export const BAND_SIZE = RADIO_CONST.volume.BAND;
export const MIN_SIMILARITY = RADIO_CONST.similarity.MIN;
export const MAX_SIMILARITY = RADIO_CONST.similarity.MAX;
export const SIMILARITY_BANDS = 6;
export const SIMILARITY_BAND_SIZE = RADIO_CONST.similarity.BAND;

// Utility functions - originally from radioMath.js

// Format numbers for display, ensuring negative signs are positioned correctly
// and rounding to integers to avoid floating point issues
export const formatNumber = (n) => {
  // Round to integer
  const rounded = Math.round(n);
  return rounded < 0 ? `-${Math.abs(rounded)}` : `${rounded}`;
};

// Clamp value to min/max range
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Snap to nearest multiple of 5
export const snap = (n) => Math.round(Math.round(n) / 5) * 5;

// Calculate translation position based on active section
export const translateFor = (active, volume, similarity) => {
  // Return a non-zero offset for proper centering
  if (active === 'volume') {
    return -Math.round(similarity) * STEP_PX;
  } else {
    return -Math.round(volume) * STEP_PX;
  }
};

// Generate ticks array for fixed window around center value
export const getFixedWindowTicks = (center, radius = VISIBLE_TICK_RADIUS) => {
  const ticks = [];
  const centerRounded = Math.round(center);
  const step = 25; // Larger step size for less dense ticks
  
  // Generate ticks within the fixed window with larger step
  for (let i = centerRounded - radius * step; i <= centerRounded + radius * step; i += step) {
    ticks.push(i);
  }
  
  return ticks;
};

// Handle angle calculation for rotary dial - using integers
export const calculateRotaryAngle = (startAngle, newAngle) => {
  let deltaAngle = Math.round(newAngle - startAngle);
  
  // Handle crossing the -180/180 boundary
  if (deltaAngle > 180) deltaAngle -= 360;
  if (deltaAngle < -180) deltaAngle += 360;
  
  // No clamp - pointer capture already prevents accidental jumps
  // If needed, a much wider limit could be used like ±45 degrees
  return deltaAngle;
};

// Get color based on similarity value
export const getColorForSimilarity = (sim) => {
  if (sim < 30) return '#FF3D5A'; // Neon red
  if (sim < 60) return '#00F5FF'; // Cyan
  return '#52FF00'; // Neon green
};

// Utility function to convert hex color to RGB
export const hexToRgb = (hex) => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r},${g},${b}`;
};

// Calculate progress percentage
export const calculateProgressPercentage = (activeSection, volume, similarity) => {
  return activeSection === 'volume'
    ? Math.min(100, (Math.round(volume) / RADIO_CONST.volume.MAX) * 100)
    : Math.min(100, ((Math.round(similarity) - RADIO_CONST.similarity.MIN) / (RADIO_CONST.similarity.MAX - RADIO_CONST.similarity.MIN)) * 100);
};

// Convert pixels to units for scroll calculations
export const pxToUnits = (activeSection) => {
  // This controls scroll sensitivity
  const baseFactor = 0.1; // Lower = less units per pixel = more stable

  if (activeSection === 'volume') {
    return baseFactor;
  } else {
    // Ultra-low factor for similarity to make scrolling extremely slow
    return baseFactor * 0.0022; // 3x slower than before (450x slower than volume)
  }
};

// Return px-per-unit for any section, given visible ruler width
export const getStepPx = (activeSection, visibleWidth) =>
  activeSection === 'volume'
    ? STEP_PX                      // 10 px as before
    : visibleWidth / (RADIO_CONST.similarity.MAX - RADIO_CONST.similarity.MIN); // ~6.4 px for similarity mode

// Map similarity range to frequency range
export const mapSimilarityToFrequency = (similarity) => {
  // Normalize similarity to 0-1 range
  const normalizedSim = (similarity - RADIO_CONST.similarity.MIN) / 
                        (RADIO_CONST.similarity.MAX - RADIO_CONST.similarity.MIN);
  
  // Map to frequency range
  return MIN_FREQUENCY + normalizedSim * (MAX_FREQUENCY - MIN_FREQUENCY);
};

// Generate frequency points for similarity mode - ENHANCED
// Updated generateFrequencyPoints function for radioUtils.js

// Generate frequency points for similarity mode - OPTIMIZED
export const generateFrequencyPoints = (normalizedSim, count = 12) => {
  const points = [];
  
  // Track positions to avoid overcrowding
  const takenPositions = [];
  
  // Generate points around the normalized position
  for (let i = 0; i < count * 2; i++) { // Try more points than needed to ensure we get enough
    // Random absolute position inside the band - keep a little padding (5%)
    const pointPosition = 0.05 + Math.random() * 0.90; // 0.05-0.95 range
    
    // Map to frequency value - ensure we get good distribution of values
    // Use modulus to create some clustering of values in different ranges
    let freqValue;
    if (i % 4 === 0) {
      // Lower range frequencies (200-800)
      freqValue = Math.round(200 + pointPosition * 600);
    } else if (i % 4 === 1) {
      // Mid range frequencies (800-1600)
      freqValue = Math.round(800 + pointPosition * 800);
    } else if (i % 4 === 2) {
      // Higher range frequencies (1600-3200)
      freqValue = Math.round(1600 + pointPosition * 1600);
    } else {
      // Full range with bias toward higher frequencies
      freqValue = Math.round(MIN_FREQUENCY + Math.pow(pointPosition, 0.8) * (MAX_FREQUENCY - MIN_FREQUENCY));
    }
    
    // Skip if too close to existing points (adjusted spacing for balanced density)
    if (takenPositions.some(pos => Math.abs(pos - pointPosition) < 0.07)) continue;
    
    // Add to tracking
    takenPositions.push(pointPosition);
    
    // Generate color based on frequency with more varied colors
    // const freqPercent = (freqValue - MIN_FREQUENCY) / (MAX_FREQUENCY - MIN_FREQUENCY) * 100;
    let color;
    
    if (freqValue < 800) {
      // Redder for low frequencies
      color = '#FF3D5A';
    } else if (freqValue < 1600) {
      // Cyan for mid frequencies
      color = '#00F5FF';
    } else if (freqValue < 2400) {
      // Yellow-green for higher mid
      color = '#AAFF00';
    } else {
      // Bright green for highest
      color = '#52FF00';
    }
    
    // Point is active if it's closest to current position
    const distance = Math.abs(pointPosition - normalizedSim);
    
    points.push({
      freq: freqValue,
      position: pointPosition,
      color,
      isActive: false, // Will be set true for closest point later
      distance,
      // Add size property for similarity mode - vary by frequency
      size: Math.floor(42 + (freqValue / MAX_FREQUENCY) * 10) // 42-52 size range - more compact
    });
    
    // Stop once we have enough points
    if (takenPositions.length >= count) break;
  }
  
  // Sort by position
  points.sort((a, b) => a.position - b.position);
  
  // Mark the closest point to current similarity as active
  if (points.length > 0) {
    // Find point with minimum distance to the current similarity
    points.forEach(p => {
      p.distance = Math.abs(p.position - normalizedSim);
    });
    
    const minDistance = Math.min(...points.map(p => p.distance));
    const closestPoint = points.find(p => p.distance === minDistance);
    if (closestPoint) {
      closestPoint.isActive = true;
    }
  }
  
    // ─── MOBILE THROTTLE ────────────────────────────────
    const maxBoxes = (typeof window !== 'undefined' && window.innerWidth < 500) ? 9 : 14; // 5 on phones, 8 on larger screens
    const visiblePoints = points.slice(0, maxBoxes);
    return visiblePoints;
};

// Hook to generate fixed window of ticks around center - originally from useTicks.js
export const useTicks = (active, volume, similarity) => {
  // Get center value based on active section
  const center = active === 'volume' ? Math.round(similarity) : Math.round(volume);
  
  // Return fixed window of ticks around center
  return useMemo(() => 
    getFixedWindowTicks(center), 
    [center]
  );
};

// Hook to calculate translation for ticks container - originally from useTicks.js
export const useTranslate = (active, volume, similarity) => {
  // Calculate proper non-zero offset for translation
  return useMemo(() => 
    translateFor(active, volume, similarity), 
    [active, volume, similarity]
  );
};

// Custom hook that returns a debounced value after the specified delay - originally from useDebounce.js
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Update debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes or component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};