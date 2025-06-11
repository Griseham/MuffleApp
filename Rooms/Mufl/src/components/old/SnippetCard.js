import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import './SnippetCard.css';

function SnippetCard({
  track,
  onZoneHover,
  onDragStart,
  onDragEnd,
  onSwipeLeft,
  onSwipeRight,
  onUserIconClick,
}) {
  const [zone, setZone] = useState('0');

  // Original movement config from your "old code"
  const [{ x, y, scale, opacity }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 0.8,
    opacity: 0,
    config: { tension: 200, friction: 18 },
  }));

  const HORIZONTAL_THRESHOLD = 80;
  const VERTICAL_THRESHOLD = 80;
  const FLING_VELOCITY = 1.2;

  // Reset animation when the track changes
  useEffect(() => {
    if (track) {
      api.set({ x: 0, y: 0, scale: 0.8, opacity: 0 });
      api.start({ scale: 1, opacity: 1 });
      setZone('0');
    }
  }, [track, api]);

  // Main drag logic (from your old code)
  const bind = useDrag(
    ({ first, last, movement: [mx, my], velocity: [vx, vy], down }) => {
      if (first) onDragStart?.();

      // Real-time movement of the snippet
      api.start({ x: mx, y: my, immediate: down });

      // Determine zone
      let newZone = '0';
      if (mx > HORIZONTAL_THRESHOLD) {
        if (my < -VERTICAL_THRESHOLD) newZone = '+1';
        else if (Math.abs(my) <= VERTICAL_THRESHOLD) newZone = '+2';
        else newZone = '+3';
      } else if (mx < -HORIZONTAL_THRESHOLD) {
        if (my < -VERTICAL_THRESHOLD) newZone = '-1';
        else if (Math.abs(my) <= VERTICAL_THRESHOLD) newZone = '-2';
        else newZone = '-3';
      }
      setZone(newZone);
      onZoneHover?.(newZone);

      if (last) {
        onZoneHover?.('0'); // Reset overlay

        let finalDirection = null;
        if (newZone.startsWith('+')) finalDirection = 'right';
        else if (newZone.startsWith('-')) finalDirection = 'left';
        else if (Math.abs(my) > VERTICAL_THRESHOLD)
          finalDirection = my < 0 ? 'up' : 'down';

        const speed = Math.sqrt(vx * vx + vy * vy);
        const isFling = speed > FLING_VELOCITY && finalDirection;

        if (isFling) {
          // fling off-screen
          let finalProps = {};
          if (finalDirection === 'left') finalProps = { x: -1000, y: 0 };
          else if (finalDirection === 'right') finalProps = { x: 1000, y: 0 };
          else if (finalDirection === 'up') finalProps = { x: 0, y: -600 };
          else finalProps = { x: 0, y: 600 };

          api.start({
            ...finalProps,
            opacity: 0,
            scale: 0.9,
            onRest: () => {
              // Trigger swipe handlers
              if (finalDirection === 'left' && onSwipeLeft) {
                onSwipeLeft(newZone);
              } else if (finalDirection === 'right' && onSwipeRight) {
                onSwipeRight(newZone);
              }

              // Reset for next snippet
              api.set({ x: 0, y: 0, scale: 0.8, opacity: 0 });
              setZone('0');
            },
          });
        } else {
          // Non-fling => snap back to center
          if (finalDirection === 'left' && onSwipeLeft) {
            onSwipeLeft(newZone);
          } else if (finalDirection === 'right' && onSwipeRight) {
            onSwipeRight(newZone);
          }

          api.start({ x: 0, y: 0, scale: 1, opacity: 1 });
          setZone('0');
        }

        // Ensure onDragEnd is only triggered once
        if (onDragEnd) onDragEnd(newZone);
      }
    },
    {
      preventScrollOnSwipe: true,
      // For touch devices, recommended to set touchAction: 'none' 
      // so tiny taps won't become scroll gestures
      // We’ll handle a separate approach for the user icon
    }
  );

  if (!track) {
    return (
      <div className="snippet-card empty-snippet">
        <p>No track currently playing</p>
      </div>
    );
  }

  // Display text for the push/pull zone
  let zoneMessage = '';
  if (zone === '+1') zoneMessage = 'Push Forward >>1 in Queue';
  else if (zone === '+2') zoneMessage = 'Push Forward >>2 in Queue';
  else if (zone === '+3') zoneMessage = 'Push Forward >>3 in Queue';
  else if (zone === '-1') zoneMessage = 'Push Back <<1 in Queue';
  else if (zone === '-2') zoneMessage = 'Push Back <<2 in Queue';
  else if (zone === '-3') zoneMessage = 'Push Back <<3 in Queue';

  return (
    <div className="snippet-container">
      {/* Add touchAction: 'none' here to fix the console warning */}
      <animated.div
        {...bind()}
        className={`snippet-card zone-${zone}`}
        style={{
          touchAction: 'none', // prevents default scrolling on touch
          x,
          y,
          scale,
          opacity,
        }}
      >
        {/* User Icon - no drag binding so clicks open user modal */}
        <div
          className="snippet-user-icon"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            if (onUserIconClick && track.user) {
              onUserIconClick(track.user);
            }
          }}
        >
          <img
            src={
              track.user?.profileImage || 'https://via.placeholder.com/50?text=A'
            }
            alt={track.user?.username || 'Placeholder User'}
          />
        </div>

        <div className="snippet-art-container">
          <img className="snippet-art" src={track.artwork} alt="Album Art" />
        </div>

        <div className="snippet-content">
          <h3 className="snippet-title">{track.title}</h3>
          <p className="snippet-artist">{track.artist}</p>
          <div className="snippet-hashtags">
            {track.hashtags?.map((tag, i) => (
              <span key={i}>#{tag} </span>
            ))}
          </div>

          {track.previewUrl && (
            <audio style={{ marginTop: '10px' }} src={track.previewUrl} controls />
          )}
        </div>

        {zone !== '0' && (
          <div className="zone-message">{zoneMessage}</div>
        )}
      </animated.div>
    </div>
  );
}

export default SnippetCard;
