import React, { useState, useEffect, useRef } from 'react';
import './TopBar.css';

function getUserSVG(shortStr) {
  const svg = `
    <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="25" fill="#CCC" />
      <text x="50%" y="50%" font-size="14" fill="#000" dominant-baseline="middle" text-anchor="middle">
        ${shortStr}
      </text>
    </svg>
  `;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}
function TopBar({ 
  roomTitle, 
  userCount: initialUserCount, 
  radarArtists: initialRadarArtists, 
  minutes, 
  onBack, 
  staticUsers = [] ,
  onUserIconClick,
}) {
  // State for user list (real + placeholder)
  const [allUsers, setAllUsers] = useState([...staticUsers]);
  const [dynamicUserCount, setDynamicUserCount] = useState(initialUserCount || staticUsers.length);

  useEffect(() => {
    // Whenever `staticUsers` changes in the parent (e.g. on Next Room),
    // update TopBar’s internal user list and dynamic count.
    setAllUsers([...staticUsers]);
    setDynamicUserCount(staticUsers.length);
  }, [staticUsers]);
  
  // For toggling user list and menu
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Join message + fade out
  const [joinMessage, setJoinMessage] = useState(null);
  const joinTimeoutRef = useRef(null);

  // Radar artists (with timesPicked)
  const [radarArtists, setRadarArtists] = useState(initialRadarArtists || []);

  // For the random “arrow moves” – storing each artist’s current arrow
  // E.g. { "ArtistName": { direction: 'up2', visible: true } }
  const [artistArrows, setArtistArrows] = useState({});

  const toggleUserList = () => setIsUserListOpen((prev) => !prev);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  /*************************************
   * USER SIMULATION
   *************************************/
  function getRandomInterval() {
    return Math.floor(Math.random() * (9 - 4 + 1) + 4) * 1000; 
  }
  function createRandomUser() {
    const randomId = Math.floor(Math.random() * 100000);
    const shortId = randomId.toString().slice(0, 3); // e.g. "342"
    
    return {
      id: `newUser-${randomId}`,
      username: `user${randomId}`,
      // Use the short ID in "Uxxx" form
      profileImage: getUserSVG(`U${shortId}`),  // <— updated
    };
  }
  
  function simulateNewUser() {
    const newUser = createRandomUser();
    // Add user & increment count
    setAllUsers((prev) => [...prev, newUser]);
    setDynamicUserCount((prev) => prev + 1);
    // Show join message
    setJoinMessage(`${newUser.username} joined`);
    // Clear existing timeout, fade out after 3s
    if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
    joinTimeoutRef.current = setTimeout(() => setJoinMessage(null), 3000);

    // Optionally increment random artist timesPicked
    if (radarArtists.length > 0) {
      const randomIndex = Math.floor(Math.random() * radarArtists.length);
      handleArtistMove(radarArtists[randomIndex], 'up');  // Force an “up” so it matches “joined”
    }
  }

  // Kick off user simulation on mount
  useEffect(() => {
    let intervalId;
    function scheduleNext() {
      intervalId = setTimeout(() => {
        simulateNewUser();
        scheduleNext();
      }, getRandomInterval());
    }
    scheduleNext();
    return () => clearTimeout(intervalId);
  }, []);

  /*************************************
   * RADAR ARTIST UPDATES
   *************************************/
  useEffect(() => {
    // If initialRadarArtists prop changes externally, update local state
    setRadarArtists(initialRadarArtists || []);
  }, [initialRadarArtists]);

  // Randomly shuffle or move timesPicked every 4 seconds
  useEffect(() => {
    const artistInterval = setInterval(() => {
      if (!radarArtists.length) return;
      // pick random # of artists to move (1 to 3)
      const movesCount = Math.floor(Math.random() * 3) + 1;
      const updated = [...radarArtists];

      for (let i = 0; i < movesCount; i++) {
        const randomIndex = Math.floor(Math.random() * updated.length);
        const randomArtist = updated[randomIndex];

        // Randomly decide an up or down move, and by how much (1–3)
        const direction = Math.random() < 0.5 ? 'down' : 'up';
        const magnitude = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3

        handleArtistMove(randomArtist, direction, magnitude);
      }
    }, 4000); // every 4s

    return () => clearInterval(artistInterval);
  }, [radarArtists]);

  // Helper to increment or decrement timesPicked + set arrow
  function handleArtistMove(artist, direction, magnitude = 1) {
    if (!artist) return;
    setRadarArtists((prev) =>
      prev.map((item) => {
        if (item.name !== artist.name) return item;
        // up => + timesPicked, down => - timesPicked
        const newTimes = direction === 'up'
          ? (item.timesPicked || 0) + magnitude
          : Math.max(0, (item.timesPicked || 0) - magnitude);

        return { ...item, timesPicked: newTimes };
      })
    );

    // e.g. 'up1', 'up2', 'up3', 'down1', 'down2', 'down3'
    const arrowKey = direction + magnitude;
    setArtistArrows((prev) => ({
      ...prev,
      [artist.name]: {
        direction: arrowKey,
        visible: true,
      },
    }));

    // Hide arrow after a short delay (2.5s)
    setTimeout(() => {
      setArtistArrows((prev) => ({
        ...prev,
        [artist.name]: {
          ...prev[artist.name],
          visible: false,
        },
      }));
    }, 2500);
  }

  /*************************************
   * USER LIST & PLACEHOLDERS
   *************************************/
  // Add placeholders if user array is smaller than dynamicUserCount
  const displayedUsers = [...allUsers];
  while (displayedUsers.length < dynamicUserCount) {
    displayedUsers.push({
      id: `placeholder-${displayedUsers.length}`,
      username: `User ${displayedUsers.length + 1}`,
      profileImage: 'https://via.placeholder.com/50',
    });
  }

  // Shuffle + slice for pyramid
  const realArtists = radarArtists.filter((a) => a && a.name && a.image);
  const pyramidArtists = [...realArtists].sort(() => Math.random() - 0.5).slice(0, 6);

  return (
    <div className="top-container">
      {/* BACK BUTTON */}
      <button className="playingScreen-back-btn" onClick={onBack}>
        ← Back
      </button>

      {/* ROOM TITLE */}
      <h1 className="room-title">{roomTitle}</h1>

      {/* ACTIONS: Users & Menu */}
      <div className="top-actions">
        {/* Display dynamic user count; show join message if present */}
        <div className="user-btn-wrapper">
          <button className="user-btn" onClick={toggleUserList}>
            {dynamicUserCount} Users
          </button>
          {joinMessage && (
            <div className="join-message">
              {joinMessage}
            </div>
          )}
        </div>

        {/* Menu Button */}
        <button className="menu-btn" onClick={toggleMenu}>
          Menu
        </button>
      </div>

      {/* ROOM DURATION */}
      <span className="room-duration">{minutes} min</span>

      {/* Expanded User List */}
      {isUserListOpen && (
        <div className="expanded-user-list">
          {displayedUsers.map((user) => (
            <div key={user.id} className="user-item">
              <img
                src={user.profileImage}
                alt={user.username}
                className="user-avatar"
                onClick={() => onUserIconClick?.(user)}

              />
              <span className="user-name">{user.username}</span>
            </div>
          ))}
        </div>
      )}

      {/* Menu Popup for “Most Popular” or “Pyramid” */}
      {isMenuOpen && (
        <div className="menu-popup-unique">
          <div className="menu-popup-unique-header">
            <h3>Most Popular Artists by # of Right Swipes</h3>
            <button onClick={toggleMenu}>X</button>
          </div>
          <div className="menu-popup-unique-content">
            <div className="menu-row-unique">
              <span className="row-number-unique">1</span>
              <div className="menu-artist-unique">
                <img
                  src={pyramidArtists[0]?.image || 'fallback.jpg'}
                  alt={pyramidArtists[0]?.name || 'Unknown'}
                  className="menu-artist-image-unique"
                />
                <span className="menu-artist-name-unique">{pyramidArtists[0]?.name}</span>
              </div>
            </div>

            <div className="separator-line"></div>

            <div className="menu-row-unique">
              <span className="row-number-unique">2</span>
              {pyramidArtists.slice(1, 3).map((artist, idx) => (
                <div key={idx} className="menu-artist-unique">
                  <img
                    src={artist.image || 'fallback.jpg'}
                    alt={artist.name || 'Unknown'}
                    className="menu-artist-image-unique"
                  />
                  <span className="menu-artist-name-unique">{artist.name}</span>
                </div>
              ))}
            </div>

            <div className="separator-line"></div>

            <div className="menu-row-unique">
              <span className="row-number-unique">3</span>
              {pyramidArtists.slice(3, 6).map((artist, idx) => (
                <div key={idx} className="menu-artist-unique">
                  <img
                    src={artist.image || 'fallback.jpg'}
                    alt={artist.name || 'Unknown'}
                    className="menu-artist-image-unique"
                  />
                  <span className="menu-artist-name-unique">{artist.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Radar Section */}
      <div className="radar-wrapper">
        <button
          className="radar-nav left"
          onClick={() =>
            document.querySelector('.radar-row')?.scrollBy({ left: -200, behavior: 'smooth' })
          }
        >
          &lt;
        </button>
        <div className="radar-container">
          <div className="radar-row">
            {radarArtists.map((artist, idx) => {
              const arrowInfo = artistArrows[artist.name] || {};
              const arrowClass = arrowInfo.visible ? arrowInfo.direction : '';

              return (
                <div key={idx} className="radar-artist-container">
                  <img
                    src={artist.image || 'fallback.jpg'}
                    alt={artist.name}
                    className="radar-artist"
                  />
                  <span className="radar-artist-name">{artist.name}</span>
                  <span
                    className="radar-artist-number"
                    title="# of times selected"
                  >
                    {artist.timesPicked || 0}
                  </span>
                  {/* Arrow overlay (only if arrowInfo.visible) */}
                  {arrowInfo.visible && (
                    <div className={`move-arrow ${arrowClass}`}>
                      {
                        arrowClass.includes('up')
                          ? `↑${arrowClass.replace('up','')}`
                          : `↓${arrowClass.replace('down','')}`
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <button
          className="radar-nav right"
          onClick={() =>
            document.querySelector('.radar-row')?.scrollBy({ left: 200, behavior: 'smooth' })
          }
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

export default TopBar;
