// components/Ruler.js - Shared ruler component for both volume and similarity modes
// This component ensures consistent behavior across modes

import React, { useMemo } from 'react';
import Tick from './Tick';
import { getBandParams } from './radioUtils';

export default function Ruler({ value, mode, stepPx }) {
  // Get the right constants for the current mode
  const { MIN, MAX, BAND, TICK } = getBandParams(mode);

  /* ---------- Identical ticks logic for both modes ---------- */
  const bandIndex = Math.floor((value - MIN) / BAND);
  const bandCenter = bandIndex * BAND + MIN + BAND / 2;
  
  // Generate ticks for display - ensure they're fixed within bands
  const ticks = useMemo(() => {
    const result = [];
    
    // First generate all band boundary ticks (these stay perfectly fixed)
    const totalBands = Math.ceil((MAX - MIN) / BAND);
    for (let b = 0; b <= totalBands; b++) {
      const bandTick = MIN + (b * BAND);
      // Add band boundaries as major fixed ticks
      result.push(bandTick);
    }
    
    // Then add minor ticks within the current band
    const bandStart = bandIndex * BAND + MIN;
    const bandEnd = bandStart + BAND;
    
    // Add several minor ticks in current and adjacent bands
    const prevBandStart = Math.max(MIN, bandStart - BAND);
    const nextBandEnd = Math.min(MAX, bandEnd + BAND);
    
    // Add ticks within the current and adjacent bands
    for (let t = prevBandStart; t <= nextBandEnd; t += TICK) {
      // Skip band boundaries as we've already added them
      if (!result.includes(t)) {
        result.push(t);
      }
    }
    
    return result.sort((a, b) => a - b);
  }, [bandIndex, MIN, MAX, BAND, TICK]);

  return (
    <div className="rt-ticks-container">
      {ticks.map((tick) => (
        <Tick 
          key={tick} 
          tick={tick} 
          center={bandCenter}
          isActive={mode === 'similarity'}
          activeSection={mode}
          stepPx={stepPx}
        />
      ))}
    </div>
  );
}