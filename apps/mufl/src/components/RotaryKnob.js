import React, { useRef, useState, useCallback } from 'react';
import { clamp, ROTARY_DEG_PER_UNIT, DRAG_GAIN } from './radioUtils';
import './RadioTuner.css';          // re-use existing knob styles

// Local constant
const step = 1;                    // 1 unit per wheel "tick" or arrow-press

export default function RotaryKnob({
  value,
  min,
  max,
  onChange,
  renderCenter,   // render prop for the little number in the middle
  handleColor,
  onSelectChange,    // fires only when the knob is disarmed
  onKnobToggle,      // ← NEW  armed ⇢ bool  (true = armed, false = idle)
}) {

  // 🆕 whether knob is "armed" for input
  const [selected, setSelected] = useState(false);
  
  /* ------------------------------------------------------------
   * Fire parent callbacks *after* this component has re-rendered.
   * This eliminates the "setState during render" warning.
   * ---------------------------------------------------------- */
    React.useEffect(() => {
        // call the *latest* refs – we don’t care if the
        // function object itself changed since last render
        onKnobToggle?.(selected);
    
      if (!selected) onSelectChange?.();
      }, [selected]);
  
  const hitRef           = useRef(null);
  const lastCursorAngle  = useRef(0);
  const [dragging, setDragging] = useState(false);

  /* -------------------------------------------------- wheel */
  const handleWheel = useCallback(e => {
    if (!selected) return;         // ← only when clicked
    if (e.cancelable) e.preventDefault();
    const delta = e.deltaY > 0 ? -step : step;
    onChange(clamp(value + delta, min, max));
  }, [value, min, max, onChange, selected]);

  /* -------------------------------------------------- pointer */
  const getAngle = (e, rect) =>
    Math.atan2(e.clientY - (rect.top + rect.height / 2),
               e.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI;

  const startDrag = useCallback(e => {
    if (!selected) return;         // ← only when selected
    
    // If it's already in dragging mode, just update the angle but don't capture again
    if (dragging) {
      const rect = hitRef.current.getBoundingClientRect();
      lastCursorAngle.current = getAngle(e, rect);
      return;
    }
    
    // Otherwise, start a new drag
    const rect = hitRef.current.getBoundingClientRect();
    lastCursorAngle.current = getAngle(e, rect);
    setDragging(true);
    hitRef.current.setPointerCapture(e.pointerId);
  }, [selected, dragging]);

  const drag = useCallback(e => {
    // When selected, allow dragging even without mouse button down
    if (!selected) return;
    
    if (e.cancelable) e.preventDefault();
    const rect    = hitRef.current.getBoundingClientRect();
    const angle   = getAngle(e, rect);
    
    // Skip if this is the first move after entering the area
    if (!lastCursorAngle.current && !dragging) {
      lastCursorAngle.current = angle;
      setDragging(true);
      return;
    }
    
    let delta = angle - lastCursorAngle.current;

    // cross the ±180 boundary smoothly
    if (delta > 180)  delta -= 360;
    if (delta < -180) delta += 360;

    // Apply strong dampening for smoother control
    const dampening = 0.3; // Lower = more dampening, less sensitivity

    lastCursorAngle.current = angle;
    onChange(clamp(value + delta * DRAG_GAIN * dampening, min, max));
  }, [selected, dragging, value, min, max, onChange]);

  const endDrag = useCallback(e => {
    if (!selected) return;
    setDragging(false);
    hitRef.current.releasePointerCapture(e.pointerId);
  }, [selected]);

  /* -------------------------------------------------- keyboard */
  const handleKey = useCallback(e => {
    if (!selected) return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const delta = e.key === 'ArrowUp' ? step : -step;
    onChange(clamp(value + delta, min, max));
  }, [value, min, max, onChange, selected]);

  /* -------------------------------------------------- render */
  return (
    <div className="rt-knob-zone">
      <div
        className="rt-dial"
        style={{ transform: `rotate(${value * ROTARY_DEG_PER_UNIT}deg)` }}   /* Remove modulus to let dial spin freely */
      >
        <div 
          className="rt-dial-handle" 
          style={{ backgroundColor: handleColor || 'var(--rt-led-on)' }} 
        />
      </div>

      {/* tiny label inside the dial */}
      <div className="rt-dial-center">{renderCenter?.()}</div>

      {/* invisible "hit" circle that does all the work */}
      <div
        ref={hitRef}
        className={`rt-hit ${selected ? 'selected' : ''}`}
        onClick={e => {
          e.stopPropagation();
          setSelected(prev => !prev);   // **just** flip the local flag
        }}
        
        onWheel={handleWheel}
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={endDrag}
        onPointerEnter={() => { if (selected) lastCursorAngle.current = 0; }} // Reset when cursor enters
        onPointerLeave={() => { if (selected) setDragging(false); }} // Stop dragging when cursor leaves
        onKeyDown={handleKey}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}