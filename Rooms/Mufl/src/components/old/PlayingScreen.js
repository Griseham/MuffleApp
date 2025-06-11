import React, { useState, useEffect } from 'react';
import './PlayingScreen.css';

import TrackPanel from './TrackPanel'; 
import ChatPanel from './ChatPanel';
import HistoryPanel from './HistoryPanel';
import SnippetCard from './SnippetCard';
import BottomBar from './BottomBar';
import QueueLine from './QueueLine';
import QueueLineButton from './QueueLine';
import UserModal from './UserModal';


import WidgetPanel  from './WidgetPanel';
import TopBar from './TopBar';
import img1 from './assets/img1.avif';
import img2 from './assets/img2.jpg';
import img3 from './assets/img3.png';
import img4 from './assets/img4.jpeg';
import img5 from './assets/img5.jpg';
import img6 from './assets/img6.jpg';
import img7 from './assets/img7.jpg';
import img8 from './assets/img8.avif';
import img9 from './assets/img9.jpg';
import img10 from './assets/img10.webp';



// place in PlayingScreen.js
const placeholderUsers = Array.from({ length: 10 }, (_, idx) => ({
  id: `placeholder-user-${idx}`,
  username: `User ${idx + 1}`,
  profileImage: 'https://via.placeholder.com/50?text=A',
}));






function mapAppleTrackToSnippet(appleSong) {
  return {
    id: appleSong.id,
    title: appleSong.attributes?.name || 'Unknown Title',
    artist: appleSong.attributes?.artistName || 'Unknown Artist',
    artwork: appleSong.attributes?.artwork?.url
      ? appleSong.attributes.artwork.url
          .replace('{w}', '300')
          .replace('{h}', '300')
      : 'https://via.placeholder.com/300.png?text=No+Art',

    // Here is the important part:
    previewUrl: appleSong.attributes?.previews?.[0]?.url || '',
    
    // If you want hashtags from genreNames or something:
    hashtags: appleSong.attributes?.genreNames || [],
  };
}



  function PlayingScreen({ room, allRooms, onJoinRoom, onBack}) {

    const WIDGET_USER = { 
      id: 'widget-user', 
      username: 'Your Picks', 
      profileImage: 'https://via.placeholder.com/50?text=W' 
    };

    const STATIC_USERS = [
      { id: 'u1', username: 'MusicFan88', profileImage: img1 },
      { id: 'u2', username: 'RockyRoad', profileImage: img2 },
      { id: 'u3', username: 'AdeleFanGirl', profileImage: img3 },
      { id: 'u4', username: 'TheWeekndStan', profileImage: img4 },
      { id: 'u5', username: 'JazzLover', profileImage: img5 },
      { id: 'u6', username: 'HipHopGuru', profileImage: img6 },
      { id: 'u7', username: 'MetalHead90', profileImage: img7 },
      { id: 'u8', username: 'SynthwaveCat', profileImage: img8 },
      { id: 'u9', username: 'FolkForever', profileImage: img9 },
      { id: 'u10', username: 'RnBKing', profileImage: img10 },
      WIDGET_USER,

    ];

    const [currentRoomIndex, setCurrentRoomIndex] = useState(() =>
      allRooms.findIndex((r) => r.id === room.id)
    );

    const [currentRoom, setCurrentRoom] = useState(room);
    const [modalUser, setModalUser] = useState(null);


    
  const [currentIndex, setCurrentIndex] = useState(0);
  const [radarArtists, setRadarArtists] = useState([]);
  const [appleTracks, setAppleTracks] = useState([]);

  const [isQueueLineOpen, setIsQueueLineOpen] = useState(false);

  window.swipeHistory = [];

  const currentTrack = appleTracks[currentIndex] || null;

  const bottomArtists = radarArtists.slice(0, 8);



  const [votesState, setVotesState] = useState({});

  const [userScores, setUserScores] = useState(() =>
    STATIC_USERS.reduce((acc, user) => {
      acc[user.id] = 0;
      return acc;
    }, {})
  );
  
  


  // For snippet off-screen animation

  const [history, setHistory] = useState([]); // History state to store swipe data





  const [zones, setZones] = useState({ '+1': [], '+2': [], '+3': [], '-1': [], '-2': [], '-3': [] });
  const [isZonesOpen, setIsZonesOpen] = useState(false);
  const [leftZonesOpen, setLeftZonesOpen] = useState(false);
  const [rightZonesOpen, setRightZonesOpen] = useState(false);
  const [isTopPanelOpen, setIsTopPanelOpen] = useState(false); // Top panel state
  const [topPanelQueue, setTopPanelQueue] = useState([]); // State for top panel's queue


  const { fetchAppleMusicTracks } = require('../backend/appleMusicService');
  const [pendingNextSnippet, setPendingNextSnippet] = useState(null);


  const toggleQueueLine = () => {
    setIsQueueLineOpen((prev) => !prev);
  };
  
  const toggleTopPanel = () => setIsTopPanelOpen((prev) => !prev);

  function getPlaceholderSVG(index) {
    // If index=1 => shortName = U1, index=2 => U2
    const shortName = `U${index}`;
  
    const svg = `
      <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="25" fill="#CCC" />
        <text x="50%" y="50%" font-size="14" fill="#000" dominant-baseline="middle" text-anchor="middle">
          ${shortName}
        </text>
      </svg>`;
  
    // Convert the SVG string to a base64-encoded data URI
    return 'data:image/svg+xml;base64,' + btoa(svg);
  }

  
  
  function resetRoomData() {
    console.log('[PlayingScreen] Resetting room data...');
  
    // Clear snippet or swipe states
    setSwipeDirection(null);
    setHistory([]);
    setZones({ '+1': [], '+2': [], '+3': [], '-1': [], '-2': [], '-3': [] });
  
    // Clear scoreboard data if you want (but note we also do setUserStats in initPlaceholderUsers)
    // setUserStats({}); // or maybe do it in initPlaceholderUsers
  
    // Clear snippet indexes, track panels, etc.
    setCurrentIndex(0);
  
    // Possibly clear personal queue if you want it reset every new room:
    // setPersonalQueue([]);
    // If you want to keep your widget picks across rooms, remove the above line
  
    // If you have other custom states for track panel or chat panel, reset them here
    // e.g., setIsTrackOpen(true), setIsChatOpen(true), etc. 
  }
  
  function handleNextRoom() {
    const nextIndex = currentRoomIndex + 1;
    if (nextIndex >= allRooms.length) {
      console.warn('No more rooms available.');
      return;
    }
    const next = allRooms[nextIndex];
  
    // 1. Clear everything so leftover snippet doesn't linger
    resetRoomData();       // clears zone states, snippet index, scoreboard (if you want)
    setAppleTracks([]);    // ensures no leftover snippet in array
    setCurrentIndex(0);    // reset snippet pointer
  
    // 2. Switch to next room
    setCurrentRoom(next);
    setCurrentRoomIndex(nextIndex);
  
    // 3. Overwrite active users with placeholders if not first room
    //    or if you ALWAYS want placeholders after the first
    initPlaceholderUsers(); // sets activeUsers to 9 placeholders + widget
  
    // 4. Now actually fetch the new tracks
    //    possibly in a small setTimeout so that setActiveUsers is applied
    setTimeout(() => {
      loadTracksForRoom(next, activeUsers);
    }, 0);
  }
  
  // Example: loadTracksForRoom
  async function loadTracksForRoom(roomData, userArray) {
    if (!roomData || !roomData.artists || !userArray || userArray.length === 0) {
      console.warn('Skipping track load, data not ready');
      return;
    }
  
    try {
      // e.g. fetch the first 3 artists' tracks
      const allFetched = [];
      for (const artist of roomData.artists.slice(0, 3)) {
        const res = await fetch(`.../apple-music/tracks?artistName=${artist.name}`);
        const tracks = await res.json();
        allFetched.push(...tracks);
      }
      const snippetArray = allFetched.slice(0, 10).map(mapAppleTrackToSnippet);
      const withUsers = snippetArray.map((snip, idx) => ({
        ...snip,
        user: userArray[idx % userArray.length],
      }));
      setAppleTracks(withUsers);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Track fetch error:', err);
    }
  }
  
  
  
  

  useEffect(() => {
    if (currentRoom) {
      resetRoomData();
  
      // Only set static users if this is the first room
      if (currentRoomIndex === 0) {
        setUserStats(
          STATIC_USERS.reduce((acc, user) => {
            acc[user.id] = { likes: 0, dislikes: 0 };
            return acc;
          }, {})
        );
        setActiveUsers(STATIC_USERS);
      }
    }
  }, [currentRoom, currentRoomIndex]);
  

const [swipeDirection, setSwipeDirection] = useState(null);
const [userStats, setUserStats] = useState({}); // Start empty
const [activeUsers, setActiveUsers] = useState(STATIC_USERS); 
const [selectedUser, setSelectedUser] = useState(null);

function initPlaceholderUsers() {
  const placeholders = Array.from({ length: 9 }, (_, idx) => {
    const userNum = idx + 1; // e.g. 1..9
    return {
      id: `placeholder-${userNum}`,
      username: `User ${userNum}`,
      profileImage: getPlaceholderSVG(userNum), // ← new line
    };
  });

  // Then push the widget user
  placeholders.push(WIDGET_USER);

 

  setUserStats(
    placeholders.reduce((acc, user) => {
      acc[user.id] = { likes: 0, dislikes: 0 };
      return acc;
    }, {})
  );  setActiveUsers(placeholders);
  setQueueOrder([...placeholders]);

  console.log('[PlayingScreen] initPlaceholderUsers -> setActiveUsers with SVG placeholders + widget');
}



function handleOpenUserModal(user) {
  // If the same user is clicked again, close the modal
  if (modalUser && modalUser.id === user.id) {
    setModalUser(null);
  } else {
    setModalUser(user);
  }
}

// Handler to close the modal
function handleCloseModal() {
  setModalUser(null);
}


function generatePlaceholderUsers(count = 15) {
  const users = [];
  
  for (let i = 1; i <= count; i++) {
    const username = `User ${i}`; // Example: User 1, User 2, ...
    const profileImage = getPlaceholderSVG(i);
    
    users.push({
      id: `placeholder-user-${i}`,
      username,
      profileImage,
    });
  }
  
  return users;
}


function initUsersAndStats() {
  const placeholders = generatePlaceholderUsers(15);
  // Convert them to a userStats object
  const statsObject = placeholders.reduce((acc, user) => {
    acc[user.id] = {
      likes: Math.floor(Math.random() * 10),
      dislikes: Math.floor(Math.random() * 5)
    };
    return acc;
  }, {});

  setActiveUsers(placeholders);  // Make these your activeUsers
  setUserStats(statsObject);     // Pre-populate the scoreboard
}




  const generateRandomMovement = () => {
    const movements = ['>', '>>', '>>>', '<', '<<', '<<<'];
    return Array.from(
      { length: Math.floor(Math.random() * (6 - 4 + 1)) + 4 }, // 4-6 movements
      () => movements[Math.floor(Math.random() * movements.length)]
    );
  };
  
  
  const STATIC_USERS_WITH_MOVEMENT = STATIC_USERS.map(user => ({
    ...user,
    movement: generateRandomMovement().map(value => ({
      value,
      recent: false, // Initialize with no recent movements
    })),
  }));
  
  
  const [queueOrder, setQueueOrder] = useState(STATIC_USERS);

  // Function to update movement when you swipe
  const updateUserMovement = (userId, zone) => {
    const userIndex = queueOrder.findIndex((user) => user.id === userId);
    if (userIndex === -1) return;
  
    const updatedQueue = [...queueOrder];
    const user = updatedQueue[userIndex];
  
    // Extract zone number (absolute value) and determine direction
    const zoneNumber = Math.abs(zone); // Extract positive number
    const direction = zone > 0 ? 'right' : 'left'; // Determine direction
  
    // Set user movement with extracted values
    user.recentZone = {
      zoneNumber,
      direction,
    };
  
    // Update queue order
    updatedQueue.splice(userIndex, 1);
    const newIndex = Math.max(
      0,
      Math.min(updatedQueue.length, userIndex - zone) // Moves based on zone
    );
    updatedQueue.splice(newIndex, 0, user);
  
    setQueueOrder(updatedQueue);
  };
  
  
  
  
  
  
  
  
  
  
  
  useEffect(() => {
    // When room or active users change, load new tracks
    if (currentRoom && activeUsers) {
      setRadarArtists(currentRoom.artists);  // Update radarArtists for context if needed
      loadTracksForRoom();
    }
  }, [currentRoom, activeUsers]);
  

  function handleQueueSong(track) {
    console.log('[PlayingScreen] Adding track from widget to queue:', track);
  
    const snippetWithUser = {
      ...track,
      user: {
        id: 'widget-user',
        username: 'Your Picks',
        profileImage: 'https://via.placeholder.com/50?text=W',
      },
      fromWidget: true,
      previewUrl: track.previewUrl || '',
    };
  
    setAppleTracks((prevTracks) => {
      if (prevTracks.some((t) => t.id === snippetWithUser.id)) {
        console.warn('Track is already in the queue:', snippetWithUser.id);
        return prevTracks;
      }
      const updatedTracks = [...prevTracks];
      updatedTracks.splice(currentIndex + 1, 0, snippetWithUser);
      return updatedTracks;
    });
  
    setTopPanelQueue((prevQueue) => {
      if (prevQueue.some((t) => t.id === snippetWithUser.id)) {
        console.warn('Track is already in the top panel:', snippetWithUser.id);
        return prevQueue;
      }
      return [...prevQueue, snippetWithUser];
    });
  }
  
  
  function onSnippetSwipedRight(zone) {
    if (!currentTrack) return;
    const user = activeUsers.find(u => u.id === currentTrack.user?.id);
    if (!user) return;
  
    setSwipeDirection('right');
    const userId = user.id;

      // Mark widget snippet as processed if applicable
  if (currentTrack.fromWidget) {
    currentTrack.processed = true;
  }
  const direction = 'right'; // ← define direction
  const snippetId = currentTrack.id; // Define snippetId here


    
    const zoneStr = zone.toString();
    const markerValue = zoneStr.startsWith('+') || zoneStr.startsWith('-') ? zoneStr : `+${zoneStr}`;
    const movement = parseInt(zoneStr.replace('+',''), 10);
    
    handleSwipe(`+${zone}`, currentTrack, 'right');
  
    setUserScores(prevScores => {
      const newScore = (prevScores[userId] || 0) + movement;
      const newScores = { ...prevScores, [userId]: newScore };
      
      // Sort queue based on updated scores
      setQueueOrder(prevQueue => {
        const sortedUsers = [...prevQueue].sort((a, b) => (newScores[b.id] || 0) - (newScores[a.id] || 0));
        // Update marker for the swiped user
        return sortedUsers.map(u => 
          u.id === userId ? { ...u, marker: markerValue } : u
        );
      });
  
      return newScores;
    });
  
    setUserStats((prev) => {
      return {
        ...prev,
        [userId]: {
          likes: (prev[userId]?.likes || 0) + (direction === 'right' ? 1 : 0),
          dislikes: (prev[userId]?.dislikes || 0) + (direction === 'left' ? 1 : 0),
        },
      };
    });

    // Update votesState
    const randomVotes = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => {
      const randomUserIndex = Math.floor(Math.random() * activeUsers.length); // Select a random user
      const randomUser = activeUsers[randomUserIndex]; // Get user data
      const randomSymbol = ['>', '>>', '>>>'][Math.floor(Math.random() * 3)]; // Random right swipe symbol
  
      return {
        user: {
          ...randomUser,
          profileImage: getPlaceholderSVG(randomUserIndex + 1), // Use SVG for user image
        },
        symbol: randomSymbol,
        color: 'green',
      };
    });
  
    // Update votesState with multiple votes
    setVotesState((prev) => ({
      ...prev,
      [snippetId]: [...(prev[snippetId] || []), ...randomVotes],
    }));
  
    // Update zones
    setZones((prev) => {
      const updatedZone = [...(prev[zone] || []), currentTrack];
      return { ...prev, [zone]: updatedZone };
    });

 
    
  }
  function onSnippetSwipedLeft(zone) {
    if (!currentTrack) return;
    const user = activeUsers.find(u => u.id === currentTrack.user?.id);
    if (!user) return;
    const direction = 'left'; // ← define direction
    const snippetId = currentTrack.id; // Define snippetId here


    setSwipeDirection('left');
    const userId = user.id;
      // Mark widget snippet as processed if applicable
  if (currentTrack.fromWidget) {
    currentTrack.processed = true;
  }
  
    const zoneStr = zone.toString();
    const markerValue = zoneStr.startsWith('+') || zoneStr.startsWith('-') ? zoneStr : `-${zoneStr}`;
    const movement = parseInt(zoneStr.replace('-',''), 10);
  
    handleSwipe(`-${zone}`, currentTrack, 'left');
  
    setUserScores(prevScores => {
      const newScore = (prevScores[userId] || 0) - movement;
      const newScores = { ...prevScores, [userId]: newScore };
  
      // Sort queue based on updated scores
      setQueueOrder(prevQueue => {
        const sortedUsers = [...prevQueue].sort((a, b) => (newScores[b.id] || 0) - (newScores[a.id] || 0));
        // Update marker for the swiped user
        return sortedUsers.map(u => 
          u.id === userId ? { ...u, marker: markerValue } : u
        );
      });
  
      return newScores;
    });
  
    setUserStats((prev) => {
      return {
        ...prev,
        [userId]: {
          likes: (prev[userId]?.likes || 0) + (direction === 'right' ? 1 : 0),
          dislikes: (prev[userId]?.dislikes || 0) + (direction === 'left' ? 1 : 0),
        },
      };
    });

    // Update votesState
    const randomVotes = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => {
      const randomUserIndex = Math.floor(Math.random() * activeUsers.length); // Select a random user
      const randomUser = activeUsers[randomUserIndex]; // Get user data
      const randomSymbol = ['<', '<<', '<<<'][Math.floor(Math.random() * 3)]; // Random left swipe symbol
  
      return {
        user: {
          ...randomUser,
          profileImage: getPlaceholderSVG(randomUserIndex + 1), // Use SVG for user image
        },
        symbol: randomSymbol,
        color: 'red',
      };
    });
  
    // Update votesState with multiple votes
    setVotesState((prev) => ({
      ...prev,
      [snippetId]: [...(prev[snippetId] || []), ...randomVotes],
    }));
  
    // Update zones
    setZones((prev) => {
      const updatedZone = [...(prev[zone] || []), currentTrack];
      return { ...prev, [zone]: updatedZone };
    });
    
  }
  function generateRandomVotesForSnippet() {
    const uniqueUsers = new Set();
    const randomCount = Math.floor(Math.random() * 3) + 2; // e.g. 2..4
    const votes = [];
  
    for (let i = 0; i < randomCount; i++) {
      let user;
      do {
        user = STATIC_USERS[Math.floor(Math.random() * STATIC_USERS.length)];
      } while (uniqueUsers.has(user.id));
      uniqueUsers.add(user.id);
  
      const symbolOptions = ['<','<<','<<<','>','>>','>>>'];
      const symbol = symbolOptions[Math.floor(Math.random() * symbolOptions.length)];
      const color = ['<','<<','<<<'].includes(symbol) ? 'red' : 'green';
      
      votes.push({ user, symbol, color });
    }
  
    return votes;
  }
  
  
  
  
  
  function handleSwipe(zone, snippet, direction) {
    if (!snippet || zone === '0') return;
  
    const userId = snippet.user.id;
    const signedZone = direction === 'right' ? Math.abs(parseInt(zone)) : -Math.abs(parseInt(zone));
    updateUserMovement(userId, signedZone);
    
    // Log swipe details for debugging
    console.log(`[handleSwipe] Zone: ${signedZone}, Direction: ${direction}, Movement: ${signedZone}`);
    
    if (!snippet.randomVotes) {
      snippet.randomVotes = generateRandomVotesForSnippet();
    }
    // Update zones and history
    setZones((prev) => {
      if (!prev[zone]) prev[zone] = [];
      if (!prev[zone].some((item) => item.id === snippet.id)) {
        return { ...prev, [zone]: [...prev[zone], snippet] };
      }
      return prev;
    });
  
    setHistory((prev) => {
      const isAlreadyInHistory = prev.some(
        (entry) => entry.track.id === snippet.id && entry.zone === signedZone
      );
      if (isAlreadyInHistory) return prev; // Avoid duplicates
    
      return [
        { track: snippet, zone: signedZone, direction },
        ...prev,
      ];
    });
    
    
  }
  
  
  
  
  
  

  useEffect(() => {
    if (swipeDirection) {
      const timer = setTimeout(() => {
        setSwipeDirection(null);
        goToNextSnippet();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [swipeDirection]);

  useEffect(() => {
    if (room && room.artists) {
      setRadarArtists(room.artists); // Set radar artists from room data
    }
  }, [room]);

  useEffect(() => {
    if (room && room.artists) {
      // Sort artists by popularity within the room
      const sortedArtists = room.artists.sort((a, b) => b.roomPopularity - a.roomPopularity);
      setRadarArtists(sortedArtists);
    }
  }, [room]);


  useEffect(() => {
    if (room && room.artists) {
      const totalUsers = room?.userCount || 0;

      // Ensure we have exactly 30 artists, generating placeholders if needed
      const artists = [...room.artists];
      while (artists.length < 30) {
        artists.push({
          name: `Artist ${artists.length + 1}`,
          image: 'https://via.placeholder.com/50?text=A',
        });
      }

      // Assign a random "times picked" number to each artist
      const enhancedArtists = artists.slice(0, 30).map((artist) => ({
        ...artist,
        timesPicked: Math.floor(Math.random() * totalUsers) + 1, // Random from 1 to totalUsers
      }));

      setRadarArtists(enhancedArtists);
    }
  }, [room]);

  useEffect(() => {
    if (!radarArtists || radarArtists.length === 0) return;
  
    async function loadTracks() {
      try {
        let allFetched = [];
        // Fetch tracks logic...
        for (const radArt of radarArtists.slice(0, 3)) {
          const response = await fetch(
            `http://localhost:5001/apple-music/tracks?artistName=${encodeURIComponent(radArt.name)}`
          );
          if (!response.ok) throw new Error(`Error fetching tracks for ${radArt.name}`);
          const tracks = await response.json();
          allFetched.push(...tracks);
        }
  
        // Define and initialize finalFetched
        const finalFetched = allFetched.slice(0, 10);
        const snippetArray = finalFetched.map(mapAppleTrackToSnippet);
  
        const snippetsWithUsers = snippetArray.map((snippet, idx) => ({
          ...snippet,
          user: activeUsers[idx % activeUsers.length],  // Use activeUsers here
        }));
  
        setAppleTracks(prevTracks => {
          const existingIds = new Set(prevTracks.map(t => t.id));
          const newSnippets = snippetsWithUsers.filter(t => !existingIds.has(t.id));
          return [...prevTracks, ...newSnippets];
        });
  
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error loading Apple Music tracks:', error.message);
      }
    }
  
    loadTracks();
  }, [radarArtists, activeUsers]);
  

  
  function moveUserInQueue(userId, distance) {
    setQueueOrder((prev) => {
      const index = prev.findIndex((u) => u.id === userId);
      if (index < 0) return prev; // user not found
  
      const updated = [...prev];
      const [removed] = updated.splice(index, 1);
  
      let newIndex = index - distance;
      newIndex = Math.max(0, Math.min(newIndex, updated.length));
      updated.splice(newIndex, 0, removed);
  
      return updated;
    });
  }
  


  
  // Update handleQueueSong to include the placeholder user:
  
  
  function goToNextSnippet() {
    console.log("Advancing snippet: currentIndex =", currentIndex, "total =", appleTracks.length);
    if (currentIndex < appleTracks.length - 1) {
      const nextSnippet = appleTracks[currentIndex + 1];
      if (nextSnippet.fromWidget && nextSnippet.processed) {
        console.log('[PlayingScreen] Skipping processed widget snippet:', nextSnippet.id);
        setCurrentIndex(prev => prev + 1);
        return;
      }
      setCurrentIndex(prev => prev + 1);
    } else {
      console.warn('[PlayingScreen] End of queue.');
    }
  }
  
  
  
  

  // Collapsible panels (track/chat/history)
  const [isTrackOpen, setIsTrackOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  // Screen-level navigation
  const [currentScreen, setCurrentScreen] = useState('main');
  const showBottomBar = (currentScreen === 'main');

  // Top bar toggles
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  // Scoreboard/widget toggles
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);




  // *** Semicircle Overlays: track whether snippet is dragging, plus the hovered zone
  const [isDraggingSnippet, setIsDraggingSnippet] = useState(false);
  const [highlightedZone, setHighlightedZone] = useState(null);

  const [selectedWidgetArtists, setSelectedWidgetArtists] = useState([]);
const [personalQueue, setPersonalQueue] = useState([]);

  function handleArtistPoolClick(artist) {
    // If the artist is already in the list, remove it; otherwise add it
    setSelectedWidgetArtists((prev) => {
      const isAlready = prev.find((a) => a.id === artist.id);
      if (isAlready) {
        // remove
        return prev.filter((a) => a.id !== artist.id);
      } else {
        // add
        return [...prev, artist];
      }
    });
  }
  
  function handleWidgetToggle() {
    setIsWidgetOpen(!isWidgetOpen);
  }

  function handleZoneHover(zone) {
    // zone might be '+2', '-3', or '0'
    if (zone === '0') {
      setHighlightedZone(null);
    } else {
      setHighlightedZone(zone);
    }
  }

  function handleDragStart() {
    setIsDraggingSnippet(true);
  }
  const [processedSnippet, setProcessedSnippet] = useState(null);

  function handleDragEnd(finalZone) {
    if (!currentTrack) {
      console.warn('handleDragEnd called but currentTrack is undefined!');
      return;
    }
  
    if (!finalZone || finalZone === '0') {
      setIsDraggingSnippet(false);
      setHighlightedZone(null);
      return;
    }
  
    // Update zones only after swipe
    setZones((prevZones) => {
      const zoneSnippets = prevZones[finalZone] || [];
      if (!zoneSnippets.some((item) => item.id === currentTrack.id)) {
        return {
          ...prevZones,
          [finalZone]: [...zoneSnippets, currentTrack],
        };
      }
      return prevZones;
    });
  
    setIsDraggingSnippet(false);
    setHighlightedZone(null);
    console.log(`Snippet added to Zone ${finalZone}`);
  }
  
  
  
  

  // snippet-level swipe actions

  function handleCloseUserModal() {
    setSelectedUser(null);
  }
  function renderZonePanel(zoneKeys, zones, direction) {
    return zoneKeys.map((zone) => (
      <div key={zone} className="zone-section">
        <h4>Zone {zone}</h4>
        {zones[zone]?.map((snippet) => {
          // Ensure random votes are generated once and stored in snippet.randomVotes
          if (!snippet.randomVotes) {
            snippet.randomVotes = generateRandomVotesForSnippet();
          }
  
          const votes = snippet.randomVotes; // Use the stored randomVotes
  
          return (
            <div key={snippet.id} className="snippet-card-small">
              <img
                src={snippet.artwork}
                alt={snippet.title}
                className="snippet-artwork"
              />
              <p>{snippet.title}</p>
  
              {/* Votes Section */}
              <div className="votes-section">
                {votes.map((vote, idx) => (
                  <div key={idx} className="vote-item">
                    <img
                      src={vote.user.profileImage}
                      alt=""
                      className="panel-user-icon"
                    />
                    <span className={`vote-symbol ${vote.color}`}>
                      {vote.symbol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    ));
  }
  
  
  





  return (
    <div className="playing-screen">
      {/* Only render overlays if snippet is dragging */}
      {isDraggingSnippet && (
        <>
          {/* LEFT SEMICIRCLE */}
          <div className="semi-overlay semi-overlay-left">
            <div className={`semi-slice slice-minus1 ${highlightedZone === '-1' ? 'highlighted' : ''}`}>
              <div className="zone-label">Push Back -1</div>
            </div>
            <div className={`semi-slice slice-minus2 ${highlightedZone === '-2' ? 'highlighted' : ''}`}>
              <div className="zone-label">Push Back -2</div>
            </div>
            <div className={`semi-slice slice-minus3 ${highlightedZone === '-3' ? 'highlighted' : ''}`}>
              <div className="zone-label">Push Back -3</div>
            </div>
          </div>
  
          {/* RIGHT SEMICIRCLE */}
          <div className="semi-overlay semi-overlay-right">
            <div className={`semi-slice slice-plus1 ${highlightedZone === '+1' ? 'highlighted' : ''}`}>
              <div className="zone-label">Push Forward +1</div>
            </div>
            <div className={`semi-slice slice-plus2 ${highlightedZone === '+2' ? 'highlighted' : ''}`}>
              <div className="zone-label">Push Forward +2</div>
            </div>
            <div className={`semi-slice slice-plus3 ${highlightedZone === '+3' ? 'highlighted' : ''}`}>
              <div className="zone-label">Push Forward +3</div>
            </div>
          </div>
        </>
      )}
  
      {/* TOP BAR */}
    <TopBar
  roomTitle={currentRoom.name || 'Room'}
  userCount={currentRoom.userCount || 0}
  radarArtists={currentRoom.artists || []}
  minutes={currentRoom.minutes || 0}
  staticUsers={STATIC_USERS}
  onBack={onBack}
  onUserIconClick={handleOpenUserModal}

/>



  
      {/* MAIN SCREEN */}
      {currentScreen === 'main' && (
        <div className="middle-wrapper">
          {/* LEFT COLUMN => Track + Chat */}
          <div className="left-column">
            <TrackPanel
              isOpen={isTrackOpen}
              onToggle={() => setIsTrackOpen(!isTrackOpen)}
              onSwipeLeft={onSnippetSwipedLeft}
              onSwipeRight={onSnippetSwipedRight}
              onUserIconClick={handleOpenUserModal}

              
              userStats={userStats}
              staticUsers={activeUsers} 


            />
            <ChatPanel isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />

          </div>

  
          {/* Zones Overlay */}
{isZonesOpen && (
  <div className="zones-overlay">
    {["-3", "-2", "-1", "+1", "+2", "+3"].map((zone) => (
      <div key={zone} className={`zone-stack zone-${zone}`}>
        <h4>Zone {zone}</h4>
        <div className="snippets">
          {zones[zone]?.map((snippet, idx) => {
            console.log('Rendering snippets for zone:', zone, zones[zone]);
            console.log('Generated key:', `${zone}-${snippet.id}-${idx}`);

            // Get votes for this snippet from votesState
            const votes = votesState[snippet.id] || [];

            return (
              <div key={`${zone}-${snippet.id}-${idx}`} className="snippet-card-small">
                <img src={snippet.artwork} alt={snippet.title} />
                <p>{snippet.title} by {snippet.artist}</p>

                {/* User Icon */}
                {snippet.user && (
                  <img
                    src={snippet.user.profileImage}
                    alt={snippet.user.username}
                    style={{ width: 24, height: 24, borderRadius: '50%' }}
                  />
                )}

                {/* Votes Section */}
                <div className="votes-section">
                  {votes.map((vote, voteIdx) => (
                    <div key={voteIdx} className="vote-item">
                      <img
                        src={vote.user.profileImage}
                        alt={vote.user.username}
                        className="panel-user-icon"
                        style={{ width: 18, height: 18, borderRadius: '50%' }}
                      />
                      <span className={`vote-symbol ${vote.color}`}>
                        {vote.symbol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </div>
)}


    
  
          {/* CENTER COLUMN => snippet */}
          <div className="center-column">
          {leftZonesOpen && (
  <div className="zones-panel left-panel open">
    <h3 className="panel-title">Left Swipes</h3> {/* Panel title */}
    {renderZonePanel(['-1', '-2', '-3'], zones, 'left')}
  </div>
)}



{/* Top Panel */}
{isTopPanelOpen && (
  <div className="top-panel open">
    <div className="top-panel-title">Your Picks</div>
    <div className="top-panel-snippets">
      {topPanelQueue.map((track) => {
        // Generate random votes for each snippet
        const uniqueUsers = new Set();
        const votes = Array.from({ length: Math.floor(Math.random() * 3) + 2 }, () => {
          let user;
          do {
            user = STATIC_USERS[Math.floor(Math.random() * STATIC_USERS.length)];
          } while (uniqueUsers.has(user.id));
          uniqueUsers.add(user.id);

          const symbol = ['<', '<<', '<<<', '>', '>>', '>>>'][Math.floor(Math.random() * 6)];
          const color = ['<', '<<', '<<<'].includes(symbol) ? 'red' : 'green'; // Assign color based on swipe direction
          return { user, symbol, color };
        });

        return (
          <div key={track.id} className="snippet-card-small top-snippet">
            <img
              src={track.artwork || 'https://via.placeholder.com/300'}
              alt={track.title}
              className="snippet-artwork"
            />
            <p className="snippet-title">{track.title}</p>
            <p className="snippet-artist">{track.artist}</p>
            <div className="votes-section">
              {votes.map((vote, idx) => (
                <div key={idx} className="vote-item">
                  <img
                    src={vote.user.profileImage}
                    alt=""
                    className="panel-user-icon"
                  />
                  <span
                    className={`vote-symbol ${vote.color}`}
                  >
                    {vote.symbol}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}


{rightZonesOpen && (
  <div className="zones-panel right-panel open">
    <h3 className="panel-title">Right Swipes</h3> {/* Panel title */}
    {renderZonePanel(['+1', '+2', '+3'], zones, 'right')}
  </div>
)}

    {/* Left Panel Button */}
<button
  className="toggle-zones-btn left-btn"
  onClick={() => setLeftZonesOpen((prev) => !prev)}
>
  Left Swipes
</button>

{/* Top Panel Button */}
<button
  className="toggle-zones-btn top-btn"
  onClick={toggleTopPanel}
>
  Your Picks
</button>

{/* Right Panel Button */}
<button
  className="toggle-zones-btn right-btn"
  onClick={() => setRightZonesOpen((prev) => !prev)}
>
  Right Swipes
</button>
        
  
         

  
            {currentTrack ? (
            <SnippetCard
            track={appleTracks[currentIndex]}
            // note: onZoneHover, onDragStart, onDragEnd can be empty or used if you want overlays
              onZoneHover={handleZoneHover}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
              onSwipeLeft={(zone) => onSnippetSwipedLeft(zone)}
              onSwipeRight={(zone) => onSnippetSwipedRight(zone)}

              

              

              
            />
            
          ) : (
            <div className="snippet-card empty-snippet">
              <p>No track currently playing</p>
            </div>
            
          )}
  
             {/* QUEUE LINE */}
    <div className="queue-line-wrapper">
    </div>
          </div>


          {/* RIGHT COLUMN => Next Room + History */}
<div className="right-column">
<button className="next-room-btn" onClick={handleNextRoom}>
        Next Room →
      </button>
      <div>Placeholder for other panels and functionality</div>
  <HistoryPanel
    isOpen={isHistoryOpen}
    onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
    history={history}
  />
</div>
</div>
)}

<BottomBar
  userStats={userStats} // Pass userStats to BottomBar
  staticUsers={STATIC_USERS} // Pass staticUsers to BottomBar
  bottomArtists={bottomArtists}
  onWidgetClick={handleWidgetToggle}
  handleArtistPoolClick={handleArtistPoolClick}
  widgetCount={selectedWidgetArtists.length} // shows how many selected
  radarArtists={currentRoom.artists || []}
  onUserIconClick={handleOpenUserModal}
  activeUsers={activeUsers} // ← new prop

  



>
<UserModal user={modalUser} onClose={handleCloseModal} />

  {isQueueLineOpen && (
    <QueueLine
      queueOrder={queueOrder}
      moveUserInQueue={(userId, direction) => {
        const userIndex = queueOrder.findIndex((user) => user.id === userId);
        if (userIndex !== -1) {
          const updatedQueue = [...queueOrder];
          const targetIndex = userIndex + direction;
          if (targetIndex >= 0 && targetIndex < updatedQueue.length) {
            [updatedQueue[userIndex], updatedQueue[targetIndex]] = [
              updatedQueue[targetIndex],
              updatedQueue[userIndex],
            ];
            updatedQueue[userIndex].movement = direction;
          }
          setQueueOrder(updatedQueue);
        }
      }}
      onClose={toggleQueueLine}
    />
  )}
<button className="queue-line-btn" onClick={toggleQueueLine}>
  Queue Line
</button>
 </BottomBar>




{isWidgetOpen && (
  <WidgetPanel
  onClose={() => setIsWidgetOpen(false)}
  selectedArtists={selectedWidgetArtists}
  // personalQueue and setPersonalQueue if you want to store queued tracks
  personalQueue={personalQueue}
  setPersonalQueue={setPersonalQueue}
  onQueueSong={handleQueueSong} 

/>
)}

{/* Render the User Modal */}
{selectedUser && (
      <UserModal
        user={selectedUser}
        onClose={handleCloseUserModal}
      />
    )}



</div>
);
}

export default PlayingScreen;