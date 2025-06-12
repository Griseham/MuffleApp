
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import RotaryKnob from "./RotaryKnob";
import "./RadioTuner.css";
import Tick from './Tick';
import InfoIconModal from './InfoIconModal';


// Import utilities from radioUtils
import { 
MIN_VOLUME, 
MAX_VOLUME, 
MIN_SIMILARITY, 
MAX_SIMILARITY, 
BAND_SIZE, 
SIMILARITY_BAND_SIZE,
STEP_PX, 
VISIBLE_TICK_RADIUS,
ROTARY_DEG_PER_UNIT,
DRAG_GAIN,
formatNumber,
clamp,
snap,
calculateRotaryAngle,
getColorForSimilarity,
hexToRgb,
calculateProgressPercentage,
pxToUnits,
mapSimilarityToFrequency,
generateFrequencyPoints,
getStepPx,
getBandParams
} from './radioUtils';

// InfoIconModal Component
const InfoIcon = ({ size = 18, color = "#a9b6fc" }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
  <path d="M12 16v-4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  <path d="M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
</svg>
);

const XIcon = ({ size = 18, color = "white" }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  <path d="M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
</svg>
);

const ArrowLeftIcon = ({ size = 20, color = "white" }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  <path d="M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
</svg>
);

const ArrowRightIcon = ({ size = 20, color = "white" }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  <path d="M12 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
</svg>
);

/* ─── Help content shared by both Info buttons ─── */
const radioHelpSteps = [
  {
    /* Card 1 – Overview */
    title: "Radio",
    content: `This radio helps users navigate and find rooms using Volume and Similarity.
    
Without it, you would have to constantly go back to the previous screen to make more picks in order to find different rooms. 
    `
  },
  {
    /* Card 2 – Volume basics */
    title: "Volume",
    content: `Volume is the number before the decimal point and is based on both the volume of the users in the room and how well the recommendations in the room are being received.

A user’s volume is reflected by the song recommendations they share (judged by other users),  and their engagement throughout the app.

Volume has a range between 0 and 3200 (Subject to change)`
  },
  {
    /* Card 3 – Similarity basics */
    title: "Similarity",
    content: `Similarity, the number to the right of the decimal point and is based on how similar these rooms are to your picks from the selection screen. 

So the similarity score for a room will be relative to each user’s picks

For example, for one user the similarity of the room might be 300 and for you it could be 800. It’s dependent on the artist selections you made to find that room. 

In the future, we might use the user’s data for more accurate similarity if they opt in

Similarity has a range between -1000 and 1000.`
  },
  {
    /* Card 4 – Reading similarity scores */
    title: "Similarity Cont.",
    content: `If the similarity is around 800, more users in that room picked the same artists and those artists have a higher volume (their songs got more positive ratings from users in that room).

If the similarity is around 200, you may or may not see your selected artists at all, but you’ll see related artists to your selected artists.

If the similarity is around -500, you’re getting less and less similar rooms, so the opposite of your selected artists will show. 

This is just for fun, in case the user is curious or wants to find something completely new.`
  },
  {
    /* Card 5 – Volume ↔ Similarity relationship */
    title: "Volume & Similarity",
    content: `Volume and Similarity may have an inverse relationship. 

The higher you tune up the volume, the lower the similarity will be for the rooms; while the higher the similarity, the lower the volume of that room might be. 

This might not always be the case though.

Tuning to a higher volume means being in a room with more positively received recommendations and users who care more about their song picks. 

For example, a user in a low volume room might not be liking any of the songs, so they bring up the volume, sacrificing some similarity.

Tuning to a higher similarity means being a room with users who share more similar taste and artist picks from the previous screen

If a user wants to find a room closer to their picks, they will tune up the similarity, sacrificing some volume`
  },
  {
    /* Card 6 – Mainstream vs. niche examples */
    title: "Cont.",
    content: `Rooms with higher volumes are likely to have more mainstream and popular artists.

So if you pick niche artists and tuned to a high volume number, there will be less similar rooms as less users heard of them.

For example if I chose 4 artists with less than a million monthly listeners on Spotify while tuning to a high volume, I may see room numbers like “1200.190” or  “2100.300”. The 190 and 300 are out of 1000. So those two rooms are 19% and 30% similar to the picks I made. This is because less people have heard of them so less people would select them.

Think of it like this. If there are 50 people in a Hip-Hop room, I can expect 95% of those users to have heard of Drake and 5% to have heard of my favorite artist with around 2 million monthly listeners on spotify.
But instead of them just knowing those artists, they have to be intentionally selected.


However,  it is not impossible to find  high volume rooms with niche artists

For example, my favorite artist with 2 million listeners may have recently made a hit song and everyone wants to find music like it so he’s trending and more people select him. We could then see room numbers like “1221.700” or “2123.800”.`
  }
];

/* ─── Knob-specific help content ─── */
/* ─── Knob-specific help content ─── */
const knobHelpSteps = [
  {
    title: "Rotary Knob",
    content: `Click on the tuner to activate it, then rotate your cursor around it to tune with the moving red line, click again to select a room.

Clicking on a room will load a feed of similar or close rooms with the selected room on top.

It might be slightly buggy`
  }
];





// Frequency-domain constants
const MIN_FREQUENCY = 200;
const MAX_FREQUENCY = 3200;

// simple 120 ms throttle helper
const throttle = (fn, wait = 120) => {
let last = 0;
return (...args) => {
  const now = Date.now();
  if (now - last >= wait) {
    last = now;
    fn(...args);
  }
};
};

// Throttle factory function - moved outside component
const buildThrottler = (onChange) => {
let lastCall = 0;
let timeoutId = null;
const THROTTLE_MS = 200; // Only update external state every 200ms

return (payload) => {
  const now = Date.now();
  const timeSinceLastCall = now - lastCall;
  
  // Clear any pending timeout
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  // If it's been long enough since last call, update immediately
  if (timeSinceLastCall >= THROTTLE_MS) {
    lastCall = now;
    onChange(payload);
  } else {
    // Otherwise, schedule an update for later
    timeoutId = setTimeout(() => {
      lastCall = Date.now();
      onChange(payload);
      timeoutId = null;
    }, THROTTLE_MS - timeSinceLastCall);
  }
};
};

export default function RadioTuner({
initialVolume = 1326,
initialSimilarity = 80, // Updated to 80 as per spec
rulerWidth = 1600,
onChange = () => {},
onKnobToggle,            // ← NEW (optional)
showHeader = true,
showKnob = true,
className = ""
}) {

// State - using rounded initial values
// Ensure initial values are clamped to the valid range
const [volume, setVolume] = useState(clamp(Math.round(initialVolume), MIN_VOLUME, MAX_VOLUME));
const [similarity, setSimilarity] = useState(clamp(Math.round(initialSimilarity), MIN_SIMILARITY, MAX_SIMILARITY));
const [activeSection, setActiveSection] = useState('volume');
const [isDragging, setIsDragging] = useState(false);
const [freqPoints, setFreqPoints] = useState([]);
const [similarityBandFreqPoints, setSimilarityBandFreqPoints] = useState([]); // Fixed frequency points

// Refs
const snapTimer = useRef(null);
const wheelIdle = useRef(null);
const frameRef = useRef(null);
const containerRef = useRef(null);
const rulerRef = useRef(null);
const knobHitRef = useRef(null);
const dragStartX = useRef(0);
const startValueRef = useRef(0);
const lastAngle = useRef(0);
const ticksContainerRef = useRef(null);

// Derived values
const bandIndex = Math.floor(volume / BAND_SIZE);

// centre of the current band (e.g. 0-299 → 150, 300-599 → 450 …)
const bandCenter = bandIndex * BAND_SIZE + BAND_SIZE / 2;

/* ─── Keep similarity ticks locked the same way we do for volume ─── */
const simBandIndex = Math.floor((similarity - MIN_SIMILARITY) / SIMILARITY_BAND_SIZE);
const simBandCenter = simBandIndex * SIMILARITY_BAND_SIZE +
                      MIN_SIMILARITY + SIMILARITY_BAND_SIZE / 2;

const rulerCenter = activeSection === 'volume'
  ? bandCenter
  : simBandCenter;   

// how far should the red bar slide from the middle?
// Calculate position as percent within band (0-100%) to ensure it stays visible
const positionInBand = volume % BAND_SIZE;
const percentThroughBand = (positionInBand / BAND_SIZE);

// Ref to measure the actual display element width
const displayRef = useRef(null);
const [visibleRulerWidth, setVisibleRulerWidth] = useState(600); // fallback

// Use effect to measure the actual pixel width of the display
useEffect(() => {
  const measure = () => {
    if (displayRef.current) {
      setVisibleRulerWidth(displayRef.current.clientWidth);
    }
  };
  
  measure(); // measure immediately
  window.addEventListener('resize', measure);
  return () => window.removeEventListener('resize', measure);
}, []);

// Calculate dynamic pixel-per-unit step size based on active section
const stepPx = getStepPx(activeSection, visibleRulerWidth);

// Calculate how far the red line should move within the visible area
// Map the band position (0-300) to the physical width of the ruler
const redLinePosition = (percentThroughBand - 0.5) * visibleRulerWidth;

/* Slide inside the similarity band instead of the whole range */
const posInSimBand = similarity - (simBandIndex * SIMILARITY_BAND_SIZE + MIN_SIMILARITY);
const percentThroughSim = posInSimBand / SIMILARITY_BAND_SIZE; // 0‑1
const simRedLinePosition = (percentThroughSim - 0.5) * visibleRulerWidth;

// Apply for the active section
const indicatorOffsetPx =
  activeSection === 'volume'
    ? redLinePosition
    : simRedLinePosition;

// Add debouncing for landedPoint updates
const [debouncedPosition, setDebouncedPosition] = useState({
volume: volume % BAND_SIZE,
similarity: (similarity - (MIN_SIMILARITY + simBandIndex * SIMILARITY_BAND_SIZE)) / SIMILARITY_BAND_SIZE
});

// Debounce the position updates
useEffect(() => {
const handler = setTimeout(() => {
  setDebouncedPosition({
    volume: volume % BAND_SIZE,
    similarity: (similarity - (MIN_SIMILARITY + simBandIndex * SIMILARITY_BAND_SIZE)) / SIMILARITY_BAND_SIZE
  });
}, 80); // 80ms debounce delay

return () => {
  clearTimeout(handler);
};
}, [volume, similarity, simBandIndex]);

// Use debounced position for landedPoint calculation
const landedPoint = useMemo(() => {
if (activeSection === 'volume') {
  const pts = freqPoints.filter(p => p.band === bandIndex);
  if (!pts.length) return null;
  return pts.reduce((a,b) =>
    Math.abs(b.pos-debouncedPosition.volume) < Math.abs(a.pos-debouncedPosition.volume) ? b : a);
}
// similarity
const { MIN, BAND } = getBandParams('similarity');
const idx = Math.floor((similarity-MIN)/BAND);
const pts = similarityBandFreqPoints.filter(p => p.bandIndex === idx);
if (!pts.length) return null;
return pts.reduce((a,b) =>
  Math.abs(b.position-debouncedPosition.similarity) < Math.abs(a.position-debouncedPosition.similarity) ? b : a);
}, [activeSection, debouncedPosition, freqPoints, similarityBandFreqPoints, bandIndex, similarity]);
// Generate ticks for display - replacing the external hook
const ticks = useMemo(() => {
  // Use rulerCenter to keep ticks stable while only the indicator moves
  const center = rulerCenter;
  
  const result = [];
  
  // Generate more densely packed ticks for a better ruler experience
  // Ensure they cover the visible area of the ruler
  // Use smaller spacing for similarity mode
  const tickSpacing = activeSection === 'similarity' ? 25 : 5;
  
  // Calculate visible width for the smaller ruler
  // 667px max-width, divided by pixels per unit (STEP_PX)
  // Add more coverage for similarity mode to ensure smoother scrolling
  const buffer = activeSection === 'similarity' ? 2.0 : 1.2;
  const visibleWidthInUnits = Math.ceil(667 / stepPx) * buffer;    
  // Generate ticks for the visible area plus buffer on both sides
  for (let i = center - visibleWidthInUnits/2; i <= center + visibleWidthInUnits/2; i += tickSpacing) {
    result.push(i);
  }
  
  return result;
}, [rulerCenter, activeSection, stepPx]);

// Generate frequency points once on mount or when mode changes
// Updated code for volume mode frequency point generation in RadioTuner.js

// Replace the useEffect for volume frequency points generation with this enhanced version
// Replace the useEffect for volume frequency points generation with this enhanced version
useEffect(() => {
// For similarity mode, points are generated dynamically in a different hook
if (activeSection === 'similarity') return;

const points = [];
const bands = Math.ceil(MAX_VOLUME / BAND_SIZE);

for (let b = 0; b < bands; b++) {
  // Generate 4-6 points per band (increased from 3-5)
  const count = 4 + Math.floor(Math.random() * 3);
  
  // Track positions to avoid overcrowding - similar to similarity mode
  const takenPositions = [];
  
  for (let i = 0; i < count * 2; i++) { // Try more attempts to get good distribution
    // Random position inside the band with some padding
    const inBand = Math.floor(10 + Math.random() * (BAND_SIZE - 20));
    const absPos = b * BAND_SIZE + inBand;
    
    if (absPos <= MAX_VOLUME) {
      // Skip if too close to existing points
      if (takenPositions.some(pos => Math.abs(pos - inBand) < 25)) continue;
      
      // Add to tracking
      takenPositions.push(inBand);
      
      // VOLUME MODE: Generate similarity values (0-1000, no negatives)
      const hash = Math.abs(Math.sin(inBand * 12345) * 10000 % 1);
      const freq = Math.floor(hash * 1000); // 0-999 range
      
      // Add vertical offset for better distribution
      const verticalOffset = i % 2 === 0 ? -15 : 15;
      
      points.push({ 
        band: b, 
        pos: inBand, 
        freq,
        size: 42 + Math.floor(Math.random() * 10), // 42-51 size range
        verticalOffset // Store for use in rendering
      });
      
      // Stop once we have enough points for this band
      if (takenPositions.length >= count) break;
    }
  }
}

setFreqPoints(points);
}, [activeSection]);


// Generate fixed frequency points for similarity mode
// Generate fixed frequency points for similarity mode
// Dynamically regenerate similarity points on-mode and on-value change
useEffect(() => {
if (activeSection !== 'similarity') return;
const { MIN, MAX, BAND: SIZE } = getBandParams('similarity');
// figure out which similarity band we're on
const bandStart = MIN + simBandIndex * SIZE;
const centerValue = bandStart + SIZE / 2;
// normalize the center of that band
const normalized = (centerValue - MIN) / (MAX - MIN);
// generate points once per band, not on every scroll
const points = generateFrequencyPoints(normalized, 12)
  .map(p => ({ ...p, bandIndex: simBandIndex }));
setSimilarityBandFreqPoints(points);
}, [activeSection, simBandIndex]);

const currentBandFreqs = useMemo(() => {
  if (activeSection === 'volume') {
    return freqPoints
      .filter(p => p.band === bandIndex)
      .map(p => p.freq)                     // 0‑99 values
      .sort((a,b)=>a-b);
  }
  // similarity
  const { MIN, BAND } = getBandParams('similarity');
  const idx = Math.floor((similarity-MIN)/BAND);
  return similarityBandFreqPoints
    .filter(p => p.bandIndex === idx)
    .map(p => p.freq)                      // 200‑3200 values
    .sort((a,b)=>a-b);
}, [activeSection, bandIndex, similarity,
    freqPoints, similarityBandFreqPoints]);

// Notify parent only after user finishes interacting

// Keep the notifyParent function for the RotaryKnob component
const notifyParent = useCallback(() => {
// Clear any pending timers
clearTimeout(snapTimer.current);

// Snap values to nearest grid
const snappedVolume = snap(volume);
const snappedSimilarity = snap(similarity);

// Update state with snapped values
setVolume(snappedVolume);
setSimilarity(snappedSimilarity);
}, [volume, similarity]);

// Create throttled onChange function once, not on every render
const throttledOnChange = useMemo(() => buildThrottler(onChange), []);

// Unified effect to notify parent of all state changes
// Unified effect to notify parent of all state changes
// Unified effect to notify parent of all state changes
useEffect(() => {
if (!onChange) return;

// figure out current band & freq list
const { BAND, MIN } = getBandParams(activeSection);
const idx = Math.floor(((activeSection === 'volume' ? volume : similarity) - MIN) / BAND);

const points = activeSection === 'volume'
  ? freqPoints.filter(p => p.band === idx).map(p => p.freq)
  : similarityBandFreqPoints.filter(p => p.bandIndex === idx).map(p => p.freq);

// Snap values for consistency
const snappedVolume = snap(volume);
const snappedSimilarity = snap(similarity);

// Update local state with snapped values
if (volume !== snappedVolume) {
  setVolume(snappedVolume);
}

if (similarity !== snappedSimilarity) {
  setSimilarity(snappedSimilarity);
}

// Handle landed frequency based on mode
let landedFrequency = null;
if (landedPoint) {
  if (activeSection === 'volume') {
    // In volume mode, landed frequency is a similarity value (0-1000)
    landedFrequency = landedPoint.freq;
  } else {
    // In similarity mode, landed frequency is a volume value
    landedFrequency = landedPoint.freq;
  }
}

// Send one consistent payload to parent using throttled function
throttledOnChange({
  activeSection,
  volume: snappedVolume,
  similarity: snappedSimilarity,
  bandIndex: idx,
  bandFreqs: points,
  landedFreq: landedFrequency,
  hasPoint: !!landedPoint
});

}, [volume, similarity, landedPoint, freqPoints, similarityBandFreqPoints, activeSection, throttledOnChange]);

// Wheel handler with extremely fine sensitivity for similarity mode
const handleWheel = useCallback(e => {
  if (e.cancelable) e.preventDefault();
  
  // Ignore very small movements to prevent accidental scrolling
  if (Math.abs(e.deltaY) < 5) return;
  
  if (activeSection === 'volume') {
    // Standard delta for volume
    const delta = e.deltaY > 0 ? -1 : 1;
    
    setVolume(v => {
      const newValue = clamp(Math.round(v) + delta, MIN_VOLUME, MAX_VOLUME);
      return newValue;
    });
  } else {
    // Fine delta for similarity: negative region unchanged; positive region extra slow
 // Fine delta for similarity: negative region unchanged; positive region goes through 5 bands
const baseDelta = e.deltaY > 0 ? -0.016 : 0.016;
const delta = similarity >= 0 ? baseDelta / 5 : baseDelta;

    setSimilarity(s => {
      const newValue = clamp(s + delta, MIN_SIMILARITY, MAX_SIMILARITY);
      return Math.round(newValue * 10) / 10;
    });
  }

}, [activeSection, similarity]);

// Horizontal drag handlers for ruler with throttling
const handlePointerDown = useCallback((e) => {
  // Skip if knob is being dragged or ruler ref doesn't exist
  if (!rulerRef.current || knobHitRef.current?.hasPointerCapture?.(e.pointerId)) return;
  
  // Cancel any pending operations
  cancelAnimationFrame(frameRef.current);
  clearTimeout(wheelIdle.current);
  
  dragStartX.current = e.clientX;
  startValueRef.current = activeSection === 'volume' ? volume : similarity;
  
  setIsDragging(true);
  rulerRef.current.setPointerCapture(e.pointerId);
}, [activeSection, volume, similarity]);

const handlePointerMove = useCallback((e) => {
  // Skip if not dragging ruler, ref missing, or if knob has pointer capture
  if (!isDragging || !rulerRef.current || knobHitRef.current?.hasPointerCapture?.(e.pointerId)) return;
  
  // Prevent default to avoid page scrolling while dragging
  if (e.cancelable) e.preventDefault();
  
  // Use requestAnimationFrame to throttle updates to ~60fps
  cancelAnimationFrame(frameRef.current);
  
  frameRef.current = requestAnimationFrame(() => {
    const deltaX = e.clientX - dragStartX.current;
    
    if (activeSection === 'volume') {
      // Standard sensitivity for volume mode
      const scaleFactor = pxToUnits('volume');
      const newValue = startValueRef.current + deltaX / scaleFactor;
      setVolume(Math.round(clamp(newValue, MIN_VOLUME, MAX_VOLUME)));
    } else {
      // Ultra-fine sensitivity for similarity mode - EXTREMELY SLOW SCROLLING
      // Apply additional scaling factor to make dragging super precise
      // Ultra-fine sensitivity for similarity mode - EXTREMELY SLOW SCROLLING
// Ultra-fine sensitivity: <0 same, ≥0 five times finer
const startSim = startValueRef.current;
const multiplier = startSim >= 0 ? 5 : 1;
const scaleFactor = pxToUnits('similarity') * 30 * multiplier;
const newValue = startSim + deltaX / scaleFactor;

      // Use decimal precision for smoother similarity scrolling
      const preciseValue = clamp(newValue, MIN_SIMILARITY, MAX_SIMILARITY);
      setSimilarity(Math.round(preciseValue * 10) / 10);
    }
  });
}, [isDragging, activeSection]);

const handlePointerUp = useCallback((e) => {
  // Only handle if we were actually dragging the ruler
  if (!isDragging || knobHitRef.current?.hasPointerCapture?.(e.pointerId)) return;
  
  setIsDragging(false);
  
  if (rulerRef.current && rulerRef.current.hasPointerCapture(e.pointerId)) {
    rulerRef.current.releasePointerCapture(e.pointerId);
  }
  
  // Cancel any pending animation frame
  cancelAnimationFrame(frameRef.current);
  
  // Notification handled by consolidated effect
}, [isDragging]);

// Handler for rotary knob interaction
const handleKnobDragStart = useCallback((e) => {
  // Cancel any pending operations
  cancelAnimationFrame(frameRef.current);
  clearTimeout(wheelIdle.current);
  
  setIsDragging(true);
  
  if (knobHitRef.current) {
    const rect = knobHitRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    lastAngle.current = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    
    knobHitRef.current.setPointerCapture(e.pointerId);
  }
}, []);

const handleKnobDragMove = useCallback((e) => {
  if (!isDragging || !knobHitRef.current) return;
  
  // Prevent default to avoid page scrolling
  if (e.cancelable) e.preventDefault();
  
  // Throttle with requestAnimationFrame
  cancelAnimationFrame(frameRef.current);
  
  frameRef.current = requestAnimationFrame(() => {
    const rect = knobHitRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate current angle
    const newAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    
    // Calculate bounded delta angle
    const deltaAngle = calculateRotaryAngle(lastAngle.current, newAngle);
    
    // Update state with rounded values - with reduced sensitivity
    if (activeSection === 'volume') {
      const sensitivity = 0.5; // Reduced sensitivity for more controlled movement
      const newValue = volume + deltaAngle * sensitivity;
      setVolume(Math.round(clamp(newValue, MIN_VOLUME, MAX_VOLUME)));
    } else {
      // Ultra-fine sensitivity for similarity mode - extremely precise control
// Ultra-fine sensitivity: <0 same, ≥0 five times finer
const baseSens = 0.01;
const multiplier = similarity >= 0 ? 1/5 : 1;
const sensitivity = baseSens * multiplier;
const newValue = similarity + deltaAngle * sensitivity;
setSimilarity(Math.round(clamp(newValue, MIN_SIMILARITY, MAX_SIMILARITY) * 10) / 10);

    }
    
    // Update reference angle
    lastAngle.current = newAngle;
  });
}, [isDragging, activeSection, volume, similarity]);

const handleKnobDragEnd = useCallback((e) => {
  if (!isDragging) return;
  
  setIsDragging(false);
  
  if (knobHitRef.current) {
    knobHitRef.current.releasePointerCapture(e.pointerId);
  }
  
  // Cancel any pending animation frame
  cancelAnimationFrame(frameRef.current);
  
  // Notification handled by consolidated effect
}, [isDragging]);

// Cleanup on unmount
useEffect(() => {
  return () => {
    clearTimeout(snapTimer.current);
    clearTimeout(wheelIdle.current);
    cancelAnimationFrame(frameRef.current);
  };
}, []);

// Calculate progress percentage
const progressPercentage = calculateProgressPercentage(activeSection, volume, similarity);

// Prepare frequency points for rendering
// replace everything from "// Prepare frequency points for rendering" down to its closing "}, […]);"
// Replace the frequencyPointsToRender useMemo in RadioTuner.js with this enhanced version

// Optimized frequencyPointsToRender function for RadioTuner.js

// Updated frequencyPointsToRender function for consistent styling in both modes

const frequencyPointsToRender = useMemo(() => {
// pick the right dataset
const pts = activeSection === 'similarity'
  ? similarityBandFreqPoints.filter(p => p.bandIndex === simBandIndex)
  : freqPoints.filter(p => p.band === bandIndex);

// compute where we "landed" in this band
const positionInBand = activeSection === 'similarity'
  ? (similarity - (MIN_SIMILARITY + simBandIndex * SIMILARITY_BAND_SIZE)) / SIMILARITY_BAND_SIZE
  : volume % BAND_SIZE;

// Get vertical offset for either mode
const getVerticalOffset = (pt, idx) => {
  if (activeSection === 'similarity') {
    // Two row pattern for similarity mode
    return idx % 2 === 0 ? -15 : 15;
  } else {
    // Use stored vertical offset for volume mode, or calculate if not present
    return pt.verticalOffset || (idx % 2 === 0 ? -15 : 15);
  }
};

// render each point with consistent styling across both modes
return pts.map((pt, idx) => {
  // position along the ruler
  const leftPercent = activeSection === 'similarity'
    ? pt.position * 100
    : (pt.pos / BAND_SIZE) * 100;

  // distance from the center indicator
  const distance = activeSection === 'similarity'
    ? Math.abs(pt.position - positionInBand)
    : Math.abs(pt.pos - positionInBand);

  // find the minimum distance so we know which to highlight
  const distances = pts.map(p =>
    activeSection === 'similarity'
      ? Math.abs(p.position - positionInBand)
      : Math.abs(p.pos - positionInBand)
  );
  const minDistance = Math.min(...distances);
  
  // red line's position expressed as % of the container width
  const centerPercent = 50 + (indicatorOffsetPx / visibleRulerWidth) * 100;
  // pixel gap between this box and the red line
  const deltaPx = Math.abs((leftPercent - centerPercent) / 100 * visibleRulerWidth);
  // light up only when the gap is under 6 px
  const isActive = deltaPx < 6;
  
  // choose color consistently for both modes
  const color = activeSection === 'similarity'
    ? pt.color
    : getColorForSimilarity(pt.freq);
  
  // Apply consistent styling for both modes
  const boxShadow = isActive 
    ? `0 0 12px ${color}, 0 0 6px ${color}`
    : `0 0 5px rgba(0,0,0,0.4)`;
    
  // Scale effect when close to the indicator
  const scaleEffect = isActive
    ? 'scale(1.1)'
    : 'scale(1)';
    
  // Add vertical offset for better distribution in both modes
  const verticalOffset = getVerticalOffset(pt, idx);

  return (
    <div
      key={`${pt.freq}-${idx}`}
      className={`rt-freq-point ${activeSection === 'similarity' ? 'similarity-point' : 'volume-point'}`}
      style={{ 
        left: `${leftPercent}%`,
        transform: `translate(-50%, calc(-50% + ${verticalOffset}px))`
      }}
    >
      <div
        className={`rt-freq-point-box ${isActive ? 'active' : ''}`}
        style={{
          '--box-glow': isActive ? color : 'transparent',
          borderColor: color,
          boxShadow: boxShadow,
          transform: scaleEffect,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        <span style={{ color }}>{pt.freq}</span>
      </div>
    </div>
  );
});
}, [
activeSection,
freqPoints,
similarityBandFreqPoints,
bandIndex,
simBandIndex,
volume,
similarity,
indicatorOffsetPx,
visibleRulerWidth
]);

// Render
return (
  <div className={`rt-wrapper ${className}`} style={{ '--rt-width': `${rulerWidth}px`, position: 'relative' }}>
    {/* Info Icon Modal for Radio Tuner */}
    <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 50000 }}>
      <InfoIconModal
        title="Radio"
        steps={radioHelpSteps}
        modalId="radio-tuner-modal"
      />
    </div>

    {/* Main digital display */}
    {showHeader && (
      <div className="rt-header">
        <div className="rt-display">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span 
              className={`rt-number ${activeSection === 'volume' ? 'active' : ''}`}
              onClick={() => setActiveSection('volume')}
              style={{ cursor: 'pointer' }}
            >
              {formatNumber(volume)}
            </span>
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'rgba(255, 255, 255, 0.6)', 
              marginTop: '4px',
              fontFamily: 'ui-monospace, monospace'
            }}>
              Volume
            </span>
          </div>
          
          <span className="rt-dot">.</span>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span 
              className={`rt-number ${activeSection === 'similarity' ? 'active similarity-active' : ''} ${similarity < 0 ? 'similarity-negative' : ''}`}
              onClick={() => setActiveSection('similarity')}
              style={{ cursor: 'pointer' }}
            >
              {formatNumber(similarity, 1)}
            </span>
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'rgba(255, 255, 255, 0.6)', 
              marginTop: '4px',
              fontFamily: 'ui-monospace, monospace'
            }}>
              Similarity
            </span>
          </div>
        </div>
      </div>
    )}
    
    {/* Progress bar */}
    <div className="rt-progress-bar">
      <div 
        className={`rt-progress-fill ${activeSection === 'similarity' ? 'similarity-fill' : ''}`}
        style={{ width: `${progressPercentage}%` }}
      ></div>
    </div>
    
    {/* Controls section */}
    <div className="rt-controls">
      {/* Ruler display */}
      <div 
        className="rt-ruler"
        ref={rulerRef}
        role="slider"
        aria-valuemin={activeSection === 'volume' ? MIN_VOLUME : MIN_SIMILARITY}
        aria-valuemax={activeSection === 'volume' ? MAX_VOLUME : MAX_SIMILARITY}
        aria-valuenow={activeSection === 'volume' ? volume : similarity}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <div 
          ref={displayRef}
          className={`rt-frequency-display ${activeSection === 'similarity' ? 'similarity-mode' : ''}`}>
          {/* Fixed-width ticks container with center-relative positioning */}
          <div 
            className={`rt-ticks-container ${activeSection === 'similarity' ? 'similarity-mode' : ''}`}
            ref={ticksContainerRef}
          >
            {ticks.map((tick) => (
              <Tick 
                key={tick} 
                tick={tick} 
                center={rulerCenter}
                isActive={activeSection === 'similarity'}
                activeSection={activeSection}
                stepPx={stepPx}
              />
            ))}
            {/* Render similarity-mode points inside the same moving container */}
            {activeSection === 'similarity' && frequencyPointsToRender}
          </div>
          
          {/* Center line - red in volume mode, cyan in similarity mode */}
          <div
            className={`rt-position-indicator ${activeSection === 'similarity' ? 'similarity-indicator' : ''}`}
            style={{ transform: `translateX(${indicatorOffsetPx}px)` }}
          ></div>
        </div>
        
        {/* Frequency mode visualization in volume mode */}
        {activeSection === 'volume' && (
          <div className="rt-waveform-container">
            {/* Digital waveform background */}
            <div className="rt-waveform">
              {Array.from({ length: 100 }).map((_, i) => {
                const height = 5 + Math.abs(Math.sin(i * 0.2) * 30);
                return (
                  <div 
                    key={i}
                    className="rt-waveform-bar"
                    style={{ height: `${height}%` }}
                  ></div>
                );
              })}
            </div>
            
            {/* Volume-mode frequency points */}
            {frequencyPointsToRender}
          </div>
        )}
      </div>
      
      {/* Find the active frequency for knob color sync */}
      {(() => {
        // Only calculate active frequency for volume mode
        let activeFreq = null;
        let handleColor = null;
        
        if (activeSection === 'volume') {
          const positionInBand = volume % BAND_SIZE;
          const currentBandPoints = freqPoints.filter(pt => pt.band === bandIndex);
          
          if (currentBandPoints.length > 0) {
            // Find the closest frequency point
            const closestPoint = currentBandPoints.reduce((prev, curr) => 
              Math.abs(curr.pos - positionInBand) < Math.abs(prev.pos - positionInBand) ? curr : prev
            );
            
            activeFreq = closestPoint.freq;
            handleColor = getColorForSimilarity(activeFreq);
          }
        } else {
          // For similarity mode, use appropriate color based on value
          handleColor = similarity < 0 ? 
            'var(--rt-led-similarity-negative)' : 
            'var(--rt-led-similarity)';
        }
        
        return (
          showKnob && (
            <div style={{ position: 'relative' }}>
              {/* Tuner Info Icon Modal - Top Right of Knob */}
              <div style={{ position: 'absolute', top: '-10px', right: '-18px', zIndex: 50000 }}>
                <InfoIconModal
                  title="Tuner"
                  steps={knobHelpSteps}
                  showButtonText={false}
                  modalId="knob-tuner-modal"
                />
              </div>
              
              <RotaryKnob
                value={activeSection === 'volume' ? volume : similarity}
                min={activeSection === 'volume' ? MIN_VOLUME : MIN_SIMILARITY}
                max={activeSection === 'volume' ? MAX_VOLUME : MAX_SIMILARITY}
                onChange={(v) => {
                  if (activeSection === 'volume') setVolume(v);
                  else setSimilarity(v);
                }}
                renderCenter={() =>
                  activeSection === 'volume'
                    ? Math.floor(volume / BAND_SIZE) + 1
                    : Math.floor((similarity - MIN_SIMILARITY) / 100) + 1
                }
                handleColor={handleColor}
                onSelectChange={notifyParent}
                onKnobToggle={onKnobToggle}
              />
            </div>
          )
        );
      })()}
    </div>
  </div>
);
}