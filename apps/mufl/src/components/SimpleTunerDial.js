// SimpleTunerDial.js - Click-to-arm circular dial for quick volume/similarity preview + commit
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SimpleTunerDial.css';

// Constants
const MAX_VOLUME = 3200;
const MIN_SIMILARITY = -1000;
const MAX_SIMILARITY = 1000;

// Icons
const VolumeIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SimilarityIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="9" r="4" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2"/>
    <circle cx="15" cy="15" r="4" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2"/>
  </svg>
);

const ChevronIcon = ({ size = 14, color = "currentColor", direction = "down" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: direction === 'up' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
  >
    <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SimpleTunerDial = ({
  volume,
  similarity,
  onVolumeChange,
  onSimilarityChange,
  onCommit,
  onExpandClick,
  isExpanded = false,
  showExpandButton = true,
  disabled = false,
  dialLocked = false,
  size = 100
}) => {
  const [angle, setAngle] = useState(0);

  // Armed = user clicked the dial once and can now move mouse to preview values.
  const [isArmed, setIsArmed] = useState(false);

  const dialRef = useRef(null);
  const rafRef = useRef(null);

  // Keep the dial angle in sync when parent values change.
  useEffect(() => {
    const volNorm = volume / MAX_VOLUME;
    const simNorm = (similarity - MIN_SIMILARITY) / (MAX_SIMILARITY - MIN_SIMILARITY);
    const avgNorm = (volNorm + (1 - simNorm)) / 2;
    setAngle((avgNorm - 0.5) * 270);
  }, [volume, similarity]);

  const updateFromClientPoint = useCallback((clientX, clientY) => {
    if (!dialRef.current) return;

    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    const newAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
    const clamped = Math.max(-135, Math.min(135, newAngle));

    setAngle(clamped);

    const norm = (clamped + 135) / 270;

    const newVol = Math.round(norm * MAX_VOLUME);
    const newSim = Math.round((1 - norm) * (MAX_SIMILARITY - MIN_SIMILARITY) + MIN_SIMILARITY);

    onVolumeChange?.(newVol);
    onSimilarityChange?.(newSim);
  }, [onVolumeChange, onSimilarityChange]);

  // Smooth mouse move (no stutter).
  const handleMouseMove = useCallback((e) => {
    if (!isArmed || disabled || dialLocked) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      updateFromClientPoint(e.clientX, e.clientY);
    });
  }, [isArmed, disabled, dialLocked, updateFromClientPoint]);

  // Touch move (armed only).
  const handleTouchMove = useCallback((e) => {
    if (!isArmed || disabled || dialLocked) return;
    const touch = e.touches?.[0];
    if (!touch) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      updateFromClientPoint(touch.clientX, touch.clientY);
    });
  }, [isArmed, disabled, dialLocked, updateFromClientPoint]);

  // Click to arm / click again to commit.
  const handleDialClick = useCallback(() => {
    if (disabled || dialLocked) return;

    const nextArmed = !isArmed;
    setIsArmed(nextArmed);

    if (!nextArmed) {
      onCommit?.({ volume, similarity });
    }
  }, [disabled, dialLocked, isArmed, onCommit, volume, similarity]);

  // If expanded tuner opens, auto-disarm the simple dial.
  useEffect(() => {
    if (dialLocked && isArmed) setIsArmed(false);
  }, [dialLocked, isArmed]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // SVG helpers
  const createArc = (startAngle, endAngle, radius) => {
    const cx = size / 2;
    const cy = size / 2;

    const start = {
      x: cx + radius * Math.sin(startAngle * Math.PI / 180),
      y: cy - radius * Math.cos(startAngle * Math.PI / 180)
    };
    const end = {
      x: cx + radius * Math.sin(endAngle * Math.PI / 180),
      y: cy - radius * Math.cos(endAngle * Math.PI / 180)
    };

    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const arcRadius = size * 0.38;
  const indicatorLength = size * 0.32;
  const simColor = similarity >= 0 ? 'var(--similarity-positive)' : 'var(--similarity-negative)';

  return (
    <div className={`simple-tuner-dial ${disabled ? 'disabled' : ''} ${dialLocked ? 'dial-locked' : ''}`}>
      <div className="simple-tuner-dial__content">
        {/* Volume */}
        <div className="simple-tuner-dial__value simple-tuner-dial__value--volume">
          <div className="simple-tuner-dial__value-header">
            <VolumeIcon size={14} color="var(--primary)" />
            <span className="simple-tuner-dial__value-label">VOLUME</span>
          </div>
          <span className="simple-tuner-dial__value-number simple-tuner-dial__value-number--volume">
            {volume}
          </span>
        </div>

        {/* Dial */}
        <div className="simple-tuner-dial__dial-wrapper">
          <div
            ref={dialRef}
            className={`simple-tuner-dial__dial ${isArmed ? 'armed' : ''}`}
            style={{ width: size, height: size }}
            onClick={handleDialClick}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%' }}>
              {/* Background track */}
              <path
                d={createArc(-135, 135, arcRadius)}
                fill="none"
                stroke="var(--border-dark, #222)"
                strokeWidth="10"
                strokeLinecap="round"
              />

              {/* Volume arc */}
              <path
                d={createArc(-135, angle, arcRadius)}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="10"
                strokeLinecap="round"
                className="simple-tuner-dial__arc--volume"
              />

              {/* Similarity arc */}
              <path
                d={createArc(angle, 135, arcRadius)}
                fill="none"
                stroke={simColor}
                strokeWidth="10"
                strokeLinecap="round"
                className="simple-tuner-dial__arc--similarity"
              />

              {/* Center circle */}
              <circle
                cx={size/2}
                cy={size/2}
                r={size*0.22}
                fill="var(--bg-medium, #121212)"
                stroke="var(--border-dark, #222)"
                strokeWidth="2"
              />

              {/* Indicator */}
              <line
                x1={size/2}
                y1={size/2}
                x2={size/2 + indicatorLength * Math.sin(angle * Math.PI / 180)}
                y2={size/2 - indicatorLength * Math.cos(angle * Math.PI / 180)}
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                className="simple-tuner-dial__indicator"
              />

              <circle cx={size/2} cy={size/2} r="4" fill="#fff"/>
            </svg>

            <div className="simple-tuner-dial__hint">
              {dialLocked
                ? 'Expanded tuner active'
                : isArmed
                  ? 'Click again to load'
                  : 'Click dial to tune'}
            </div>
          </div>

          {/* Expand / Hide (optional per screen) */}
          {showExpandButton && (
            <button
              className="simple-tuner-dial__expand-btn"
              onClick={onExpandClick}
              type="button"
              disabled={disabled}
            >
              {isExpanded ? 'Hide' : 'Expand'} tuner
              <ChevronIcon size={12} direction={isExpanded ? 'up' : 'down'} color="currentColor"/>
            </button>
          )}
        </div>

        {/* Similarity */}
        <div className="simple-tuner-dial__value simple-tuner-dial__value--similarity">
          <div className="simple-tuner-dial__value-header">
            <span className="simple-tuner-dial__value-label">SIMILARITY</span>
            <SimilarityIcon size={14} color={simColor}/>
          </div>
          <span
            className="simple-tuner-dial__value-number simple-tuner-dial__value-number--similarity"
            style={{ color: simColor }}
          >
            {similarity}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimpleTunerDial;
