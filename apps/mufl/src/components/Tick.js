// components/Tick.js - Tick component with consistent display across modes

import React from 'react';
import { formatNumber, SIMILARITY_BAND_SIZE, MIN_SIMILARITY, getBandParams } from './radioUtils';

const Tick = React.memo(
  ({ tick, center, isActive, activeSection, stepPx }) => {
    const offset = (tick - center) * stepPx;

    /* ----- major / medium rules ----- */
    // Get band parameters for current mode
    const { MIN, MAX, BAND } = getBandParams(activeSection);
    
    // Major ticks at band boundaries for both modes
    const bandStart = Math.floor((tick - MIN) / BAND) * BAND + MIN;
    const isMajor = tick === bandStart || // Band start
                    (activeSection === 'volume' && tick % 100 === 0) || // Every 100 for volume
                    (activeSection === 'similarity' && tick === MAX); // Max boundary
    
    // Medium ticks at regular intervals
    const isMedium = !isMajor && (
      activeSection === 'similarity' 
        ? (tick - MIN) % 100 === 0 
        : tick % 25 === 0
    );

    const tickHeight = isMajor ? '100%' : isMedium ? '65%' : '40%';

    /* ----- color helpers ----- */
    const getColor = () => {
      if (!isActive) return 'var(--rt-tick-dim)';
      if (activeSection === 'similarity') {
        if (tick < -500) return 'var(--rt-neon-red)';
        if (tick < 0) return 'var(--rt-neon-cyan)';
        return 'var(--rt-neon-green)';
      }
      return 'var(--rt-tick)';
    };

    return (
      <div
        className="rt-tick"
        data-major={isMajor}
        data-medium={isMedium}
        data-minor={!isMajor && !isMedium}
        data-sim-neg={activeSection==='similarity' && tick<0}

        style={{
          left: `calc(50% + ${offset}px)`,
          backgroundColor: getColor(),
          height: tickHeight,
          opacity: isMajor ? 1 : isMedium ? 0.8 : 0.5
        }}
      >
        {/* always label MAJOR ticks in both modes */}
        {isMajor && (
          <span
            className={`rt-tick-label ${
              activeSection === 'similarity' ? 'sim-label' : ''
            }`}
          >
            {formatNumber(tick)}
          </span>
        )}
      </div>
    );
    
  },
);

export default Tick;