import React, { useState, useEffect, useRef } from 'react';
import './BottomBar.css';

function BottomBar({
  bottomArtists = [],
  radarArtists = [],
  onLeaderboardClick,
  onWidgetClick,
  widgetCount = 0,
  handleArtistPoolClick,
  userStats = {},
  staticUsers = [],
  children,
  onUserIconClick,
  activeUsers = [],

}) {
  // State
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [artistPool, setArtistPool] = useState([]);
  const [artistOverlays, setArtistOverlays] = useState({});
  const [selectedArtistIds, setSelectedArtistIds] = useState([]);
  const [countdown, setCountdown] = useState(25);

  // Refs to manage intervals/timeouts
  const countdownIntervalRef = useRef(null);
  const overlayTimeoutRef = useRef(null);

  /* -----------------------------------------
   * 1. Initialize the artist pool
   * ----------------------------------------*/
  useEffect(() => {
    if (radarArtists.length > 0) {
      initPool();  
    } else if (bottomArtists.length > 0) {
      setArtistPool([...bottomArtists]);
    }
    return cleanupTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radarArtists]);

  function initPool() {
    const refreshSize = Math.min(radarArtists.length, 8);
    const shuffled = [...radarArtists].sort(() => 0.5 - Math.random());
    setArtistPool(shuffled.slice(0, refreshSize));
    setArtistOverlays({});
    setSelectedArtistIds([]);
  }

  /* -----------------------------------------
   * 2. Once pool is ready, start countdown + overlays
   * ----------------------------------------*/
  useEffect(() => {
    if (artistPool.length === 0) return;

    // 2A. Start the countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // 2B. Schedule the first overlay
    scheduleOverlay();

    // Cleanup on unmount
    return cleanupTimers;
  }, [artistPool]);

  /* -----------------------------------------
   * 3. Refresh the pool when countdown hits 0
   * ----------------------------------------*/
  useEffect(() => {
    if (countdown === 0 && radarArtists.length > 0) {
      randomizePool();
      setCountdown(25); // Reset to 25
    }
  }, [countdown, radarArtists]);

  function randomizePool() {
    const refreshSize = Math.min(radarArtists.length, 8);
    const shuffled = [...radarArtists].sort(() => 0.5 - Math.random());
    setArtistPool(shuffled.slice(0, refreshSize));
    setArtistOverlays({});
    setSelectedArtistIds([]);
  }

  /* -----------------------------------------
   * 4. Overlays: appear ~20% more often
   *  (Old range was 2–5s, new range ~1.6–4s)
   * ----------------------------------------*/
  function scheduleOverlay() {
    if (artistPool.length === 0 || staticUsers.length === 0) return;

    // e.g., random * 2400 + 1600 => range is ~1.6–4.0s
    const interval = Math.random() * 2400 + 1600; 
    overlayTimeoutRef.current = setTimeout(() => {
      const randomArtist = pickRandom(artistPool, 1)[0];
      const randomUser = pickRandom(staticUsers, 1)[0];
      if (!randomArtist || !randomUser) {
        scheduleOverlay();
        return;
      }
      addOverlay(randomArtist.id, randomUser);
      scheduleOverlay(); // chain the next overlay
    }, interval);
  }

  // Add unique overlay to the artist
  function addOverlay(artistId, user) {
    setArtistOverlays((prev) => {
      const existingUsers = prev[artistId] || [];
      // Only add if user not already in the array
      if (existingUsers.some((u) => u.id === user.id)) {
        return prev; // skip duplicates
      }
      return {
        ...prev,
        [artistId]: [...existingUsers, user],
      };
    });
  }

  // Utility to pick random items
  function pickRandom(arr, count) {
    if (!arr || arr.length === 0) return [];
    if (arr.length <= count) return [...arr];
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /* -----------------------------------------
   * 5. Cleanup Timers
   * ----------------------------------------*/
  function cleanupTimers() {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
  }

  /* -----------------------------------------
   * UI Handlers
   * ----------------------------------------*/
  function toggleLeaderboard() {
    setIsLeaderboardOpen((prev) => !prev);
    onLeaderboardClick?.();
  }

  function handleArtistClick(artist) {
    handleArtistPoolClick?.(artist);
    setSelectedArtistIds((prev) => {
      if (!prev.includes(artist.id)) return [...prev, artist.id];
      return prev.filter((id) => id !== artist.id);
    });
  }

  /* -----------------------------------------
   * Rendering
   * ----------------------------------------*/
  return (
    <div className="bottom-container">
      <div className="bottom-bar">
        {/* Leaderboard button */}
        <div className="leaderboard-btn" onClick={toggleLeaderboard}>
          LB
        </div>

        {/* Countdown display */}
        <div className="countdown-timer">
          Refresh in: {countdown}s
        </div>

        {/* Artist pool */}
        <div className="bottom-artist-pool">
          {artistPool.map((artist) => (
            <div
              key={artist.id}
              className="artist-pool-item"
              onClick={() => handleArtistClick(artist)}
              style={{ position: 'relative' }}
            >
              <img
                src={artist.image}
                alt={artist.name}
                className={
                  selectedArtistIds.includes(artist.id) ? 'selected' : ''
                }
              />
              <span className="artist-name">{artist.name}</span>
              {(artistOverlays[artist.id] || []).map((user, index) => (
                <img
                  key={user.id || index}
                  src={user.profileImage}
                  alt={user.username}
                  className="overlay-user"
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: `${index * 12}px`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent parent click
                    onUserIconClick?.(user);
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Widget button */}
        <div className="widget-btn" onClick={onWidgetClick}>
          +
          {widgetCount > 0 && (
            <span className="widget-count-sup">{widgetCount}</span>
          )}
        </div>

        {children}
      </div>

      {/* Leaderboard Panel */}
{isLeaderboardOpen && (
  <div className="leaderboard-panel">
    <div className="leaderboard-header">
      <h3>Leaderboard</h3>
      <button onClick={toggleLeaderboard}>X</button>
    </div>
    <div className="leaderboard-content">
      {activeUsers.map((user) => {
        // Merge userStats if it exists
        const stats = userStats[user.id] || { likes: 0, dislikes: 0 };
        return (
          <div key={user.id} className="leaderboard-user">
            <img
              src={user.profileImage}
              alt={user.username}
              onClick={() => onUserIconClick?.(user)}
            />
            <div className="user-details">
              <p>{user.username}</p>
            </div>
            <div className="user-stats">
              <span className="left-swipe">{stats.dislikes}</span>
              <span className="right-swipe">{stats.likes}</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

    </div>
  );
}

export default BottomBar;
