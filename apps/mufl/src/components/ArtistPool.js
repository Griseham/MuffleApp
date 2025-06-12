
  import React, { useState, useEffect } from "react";

const ArtistPool = ({ 
poolArtists = [], // Dynamic artists from room + related artists
roomArtists = [], // Original room artists for reference
countdown: externalCountdown = null,
refreshInterval = 20000, // Changed to 20 seconds
onPoolUpdate = null, // Callback to update pool from parent
onArtistSelect = null, // NEW: Callback when user selects an artist
selectedArtists = {}, // NEW: Object with artistId -> array of user objects
currentUserId = "currentUser" // NEW: Current user's ID
}) => {
// State for visible artists, loading, and internal countdown
const [visibleArtists, setVisibleArtists] = useState([]);
const [isRefreshing, setIsRefreshing] = useState(false);
const [internalCountdown, setInternalCountdown] = useState(20); // Changed to 20
const [selectedByCurrentUser, setSelectedByCurrentUser] = useState(new Set()); // Track current user's selections
const [artistUserSelections, setArtistUserSelections] = useState({}); // Persistent user selections per artist
const [lastRefreshTime, setLastRefreshTime] = useState(Date.now()); // Track when pool last refreshed
const [userSelectionTimeouts, setUserSelectionTimeouts] = useState([]); // Track timeouts for cleanup

// Use external countdown if provided, otherwise use internal
const countdown = externalCountdown !== null ? externalCountdown : internalCountdown;

// Helper function to validate if an image URL is real
const hasValidImage = (artist) => {
  return artist.image && 
         artist.image !== 'fallback.jpg' && 
         artist.image !== '/placeholder-200.png' &&
         !artist.image.includes('placeholder') &&
         !artist.image.includes('picsum') && // Remove any placeholder services
         artist.image.startsWith('http'); // Ensure it's a real URL
};

// NEW: Simulate users slowly selecting artists over time
const startUserSelectionSimulation = (artists) => {
  // Clear any existing timeouts first
  userSelectionTimeouts.forEach(timeout => clearTimeout(timeout));
  
  const mockUsers = [
    { id: 'user1', name: 'Alex', initials: 'A', avatar: '/assets/image1.png' },
    { id: 'user2', name: 'Beth', initials: 'B', avatar: '/assets/image2.png' },
    { id: 'user3', name: 'Chris', initials: 'C', avatar: '/assets/image3.png' },
    { id: 'user4', name: 'Dana', initials: 'D', avatar: '/assets/image4.png' },
    { id: 'user5', name: 'Eve', initials: 'E', avatar: '/assets/image5.png' },
    { id: 'user6', name: 'Frank', initials: 'F', avatar: '/assets/image6.png' },
    { id: 'user7', name: 'Grace', initials: 'G', avatar: '/assets/image7.png' },
    { id: 'user8', name: 'Henry', initials: 'H', avatar: '/assets/image8.png' },
  ];
  
  // Only ~60% of artists will get users
  const artistsToGetUsers = artists.filter(() => Math.random() < 0.6);
  
  const events = [];
  
  // Create events for adding users to artists over time
  artistsToGetUsers.forEach(artist => {
    const numUsers = Math.floor(Math.random() * 3) + 1; // 1-3 users per artist
    const shuffledUsers = [...mockUsers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numUsers; i++) {
      const delay = Math.random() * 15000 + 3000; // 3-18 seconds after refresh (within 20-second period)
      events.push({
        delay,
        artistId: artist.id || artist.name,
        user: shuffledUsers[i]
      });
    }
  });
  
  // Sort events by delay
  events.sort((a, b) => a.delay - b.delay);
  
  // Execute events with timeouts
  const timeouts = [];
  events.forEach(event => {
    const timeout = setTimeout(() => {
      setArtistUserSelections(prev => {
        const artistUsers = prev[event.artistId] || [];
        // Don't add duplicate users
        if (artistUsers.some(u => u.id === event.user.id)) {
          return prev;
        }
        
        return {
          ...prev,
          [event.artistId]: [...artistUsers, event.user]
        };
      });
    }, event.delay);
    
    timeouts.push(timeout);
  });
  
  setUserSelectionTimeouts(timeouts);
};

// Cleanup timeouts on unmount
useEffect(() => {
  return () => {
    userSelectionTimeouts.forEach(timeout => clearTimeout(timeout));
  };
}, [userSelectionTimeouts]);

// Get user avatars for an artist (from persistent selections)
const getUsersForArtist = (artistId) => {
  return artistUserSelections[artistId] || [];
};

// Check if current user has selected an artist
const isSelectedByCurrentUser = (artistId) => {
  return selectedByCurrentUser.has(artistId);
};

// Handle artist selection
const handleArtistClick = (artist) => {
  const artistId = artist.id;
  const wasSelected = isSelectedByCurrentUser(artistId);
  
  // Update local state
  const newSelected = new Set(selectedByCurrentUser);
  if (wasSelected) {
    newSelected.delete(artistId);
  } else {
    newSelected.add(artistId);
  }
  setSelectedByCurrentUser(newSelected);
  
  // Call parent callback
  if (onArtistSelect) {
    onArtistSelect(artist, !wasSelected);
  }
};

// Generate artist avatar SVG
const generateArtistSVG = (artist, index) => {
  const gradients = [
    { start: '#667eea', end: '#764ba2' },
    { start: '#f093fb', end: '#f5576c' },
    { start: '#4facfe', end: '#00f2fe' },
    { start: '#fa709a', end: '#fee140' },
    { start: '#a8edea', end: '#fed6e3' },
    { start: '#ffecd2', end: '#fcb69f' },
    { start: '#ff9a9e', end: '#fecfef' },
    { start: '#a18cd1', end: '#fbc2eb' },
    { start: '#fad0c4', end: '#ffd1ff' },
    { start: '#ffeaa7', end: '#fab1a0' }
  ];
  
  const gradient = gradients[index % gradients.length];
  const gradientId = `gradient-${artist.id || index}`;
  
  return (
    <svg className="artist-svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: gradient.start, stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: gradient.end, stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill={`url(#${gradientId})`}/>
      <circle cx="50" cy="35" r="15" fill="white" opacity="0.9"/>
      <path d="M20,75 Q50,55 80,75 L80,85 Q50,65 20,85 Z" fill="white" opacity="0.9"/>
    </svg>
  );
};

// Create a combined pool from both props, filtering for valid images only
const getCombinedArtistPool = () => {
  console.log('=== ArtistPool Debug ===');
  console.log('poolArtists:', poolArtists.length);
  console.log('roomArtists:', roomArtists.length);
  
  let combinedPool = [];
  
  // Add pool artists if available, but only those with valid images
  if (poolArtists.length > 0) {
    const validPoolArtists = poolArtists.filter(hasValidImage);
    console.log(`Filtered pool artists: ${validPoolArtists.length}/${poolArtists.length} have valid images`);
    combinedPool = [...validPoolArtists];
  }
  // If no pool artists, create immediate pool from room artists with valid images
  else if (roomArtists.length > 0) {
    console.log('Creating immediate pool from room artists');
    const validRoomArtists = roomArtists
      .filter(hasValidImage)
      .map((artist, idx) => ({
        ...artist,
        isRoomArtist: true,
        id: artist.id || `room-${idx}`
      }));

    console.log(`Valid room artists: ${validRoomArtists.length}/${roomArtists.length}`);
    combinedPool = [...validRoomArtists];
    
    // If we don't have enough artists, fetch from Apple Music API
    if (combinedPool.length < 10) {
      console.log('Not enough artists with images, will need to fetch from Apple Music API');
      fetchAdditionalArtistsFromAppleMusic(10 - combinedPool.length);
    }
  }
  
  console.log('Combined pool size (with valid images only):', combinedPool.length);
  return combinedPool;
};

// Function to fetch additional artists from Apple Music API
const fetchAdditionalArtistsFromAppleMusic = async (count) => {
  try {
    console.log(`Fetching ${count} additional artists from Apple Music...`);
    setIsRefreshing(true);
    
    const response = await fetch(`/api/apple-music/random-genre-artists?count=${count * 2}`); // Get extra to filter
    if (!response.ok) {
      throw new Error('Failed to fetch from Apple Music API');
    }
    
    const data = await response.json();
    const appleArtists = data.artists || [];
    
    // Filter for artists with valid images and convert to our format
    const validAppleArtists = appleArtists
      .filter(artist => hasValidImage(artist))
      .slice(0, count)
      .map(artist => ({
        id: artist.id,
        name: artist.name,
        image: artist.image,
        isRoomArtist: false
      }));

    console.log(`Added ${validAppleArtists.length} artists from Apple Music`);
    
    // Update the pool via callback to parent if available
    if (onPoolUpdate && validAppleArtists.length > 0) {
      onPoolUpdate(validAppleArtists);
    }
    
  } catch (error) {
    console.error('Error fetching additional artists from Apple Music:', error);
  } finally {
    setIsRefreshing(false);
  }
};

// Function to shuffle and select exactly 10 artists for display (only those with images)
const refreshVisibleArtists = async () => {
  console.log('🔄 Refreshing artist pool...');
  setIsRefreshing(true);
  
  // Clear all user selections when pool refreshes
  setArtistUserSelections({});
  setSelectedByCurrentUser(new Set()); // Clear current user selections
  setLastRefreshTime(Date.now());
  
  // Small delay to show loading animation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const combinedPool = getCombinedArtistPool();
  
  if (combinedPool.length === 0) {
    setVisibleArtists([]);
    setIsRefreshing(false);
    return;
  }

  // Only work with artists that have valid images
  const validArtists = combinedPool.filter(hasValidImage);
  
  if (validArtists.length === 0) {
    console.log('No artists with valid images found');
    setVisibleArtists([]);
    setIsRefreshing(false);
    return;
  }

  // Ensure we always show some room artists if available
  const roomArtistsFromPool = validArtists.filter(artist => artist.isRoomArtist);
  const relatedArtists = validArtists.filter(artist => !artist.isRoomArtist);

  console.log('Valid artists - Room:', roomArtistsFromPool.length, 'Related:', relatedArtists.length);

  // Shuffle both groups
  const shuffledRoomArtists = [...roomArtistsFromPool].sort(() => Math.random() - 0.5);
  const shuffledRelatedArtists = [...relatedArtists].sort(() => Math.random() - 0.5);

  // Select exactly 10 artists: prioritize showing room artists
  let selected = [];
  const DISPLAY_COUNT = 10; // Show exactly 10 artists
  const roomArtistsToShow = Math.min(5, shuffledRoomArtists.length); // Show up to 5 room artists
  
  // Add room artists first
  selected.push(...shuffledRoomArtists.slice(0, roomArtistsToShow));
  
  // Fill remaining slots with related artists
  const remainingSlots = DISPLAY_COUNT - selected.length;
  selected.push(...shuffledRelatedArtists.slice(0, remainingSlots));

  // If we still don't have enough artists, try to fetch more
  if (selected.length < DISPLAY_COUNT && selected.length < validArtists.length) {
    // Add more from whatever we have available
    const remaining = validArtists.filter(artist => !selected.includes(artist));
    selected.push(...remaining.slice(0, DISPLAY_COUNT - selected.length));
  }

  // Final shuffle to mix room and related artists
  const finalSelection = selected.sort(() => Math.random() - 0.5);
  console.log('Final selection:', finalSelection.map(a => ({ 
    name: a.name, 
    hasValidImage: hasValidImage(a), 
    isRoom: a.isRoomArtist,
    imageUrl: a.image 
  })));
  
  setVisibleArtists(finalSelection.slice(0, DISPLAY_COUNT));
  setIsRefreshing(false);
  console.log('✅ Pool refresh complete!');
  
  // Start slowly adding users to artists after refresh
  setTimeout(() => {
    startUserSelectionSimulation(finalSelection.slice(0, DISPLAY_COUNT));
  }, 1000);
};

// Initial load and when pool artists change
useEffect(() => {
  refreshVisibleArtists();
}, [poolArtists, roomArtists]);

// Synchronized countdown and refresh logic
useEffect(() => {
  if (externalCountdown !== null) {
    if (externalCountdown === 0) {
      refreshVisibleArtists();  // fire exactly when bar is empty
    }
    return;
  }
  

  // Internal countdown logic
  const interval = setInterval(() => {
    setInternalCountdown(prev => {
      if (prev > 1) {
        return prev - 1;
      } else {
        // Trigger refresh when countdown hits 0
        refreshVisibleArtists();
        return 20; // Reset to 20
      }
    });
  }, 1000);

  return () => clearInterval(interval);
}, [externalCountdown, poolArtists, roomArtists]);

// Helper function for room artist indicator
const renderRoomIndicator = (isRoomArtist) => {
  if (!isRoomArtist) return null;
  
  return (
    <div className="room-indicator">
      R
    </div>
  );
};

// Helper function to render user avatars with persistent state
const renderUserAvatars = (artistId) => {
  const users = getUsersForArtist(artistId);
  if (users.length === 0) return null;

  return (
    <div className="floating-users">
      {users.slice(0, 4).map((user, index) => (
        <div 
          key={user.id || index} 
          className={`user-avatar user-${(index % 8) + 1}`}
          style={{
            backgroundImage: user.avatar ? `url(${user.avatar})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animationDelay: `${index * 0.2}s` // Stagger the animations
          }}
        >
          {!user.avatar && (user.initials || user.name?.charAt(0) || '?')}
        </div>
      ))}
      {users.length > 4 && (
        <div className="user-avatar user-count" style={{ animationDelay: '0.8s' }}>
          +{users.length - 4}
        </div>
      )}
    </div>
  );
};

// Loading animation component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="relative">
      <div className="w-8 h-8 border-2 border-gray-600 rounded-full"></div>
      <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
  </div>
);

return (
  <div className="pool-content h-full">
    {/* countdown bar - visual only, no text */}
    <div className="w-full h-1 bg-[#333] rounded overflow-hidden mb-4">
      <div
        className="h-full bg-[#1DB954] transition-all duration-1000 ease-linear"
        style={{ width: `${Math.max(0, countdown) / 20 * 100}%` }}
        />
    </div>
    
    <div className="overflow-y-auto h-full">
      {isRefreshing ? (
        /* Refreshing state */
        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
          <LoadingSpinner />
          <p className="text-center mt-3 text-sm">
            Refreshing artists...
          </p>
        </div>
      ) : visibleArtists.length > 0 ? (
        <div className="grid grid-cols-5 gap-x-4 gap-y-6 px-2 pt-1 pb-4">
          {visibleArtists.map((artist, index) => {
            const users = getUsersForArtist(artist.id || artist.name);
            const isSelected = isSelectedByCurrentUser(artist.id);
            const hasUsers = users.length > 0;
            
            return (
              <div 
                key={`${artist.id || index}-${index}`} 
                className="artist-item"
                style={{
                  animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                }}
                onClick={() => handleArtistClick(artist)}
              >
                
                {/* Artist circle with proper spacing for floating users */}
                <div className="relative">
                  <div className={`artist-circle ${
                    artist.isRoomArtist ? 'room-artist' : ''
                  } ${hasUsers ? 'has-users' : ''} ${
                    isSelected ? 'selected-by-current-user' : ''
                  }`}>
                    
                    {/* Room artist indicator */}
                    {renderRoomIndicator(artist.isRoomArtist)}
                    
                    {/* Artist image or SVG */}
                    {hasValidImage(artist) ? (
                      <img 
                        src={artist.image} 
                        alt={artist.name}
                        className="artist-image"
                        onError={(e) => {
                          console.log('Image failed to load for artist:', artist.name, 'URL:', artist.image);
                          // Fallback to SVG
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully for artist:', artist.name);
                        }}
                      />
                    ) : (
                      generateArtistSVG(artist, index)
                    )}
                    
                    {/* Fallback SVG (hidden by default) */}
                    <div className="artist-svg-fallback" style={{ display: 'none' }}>
                      {generateArtistSVG(artist, index)}
                    </div>
                  </div>
                  
                  {/* Floating user avatars */}
                  {renderUserAvatars(artist.id || artist.name)}
                </div>
                
                {/* Artist name */}
                <p className="artist-name">
                  {artist.name}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
          <div className="w-12 h-12 mb-2 bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-center">
            Loading artists with profile pictures...
          </p>
        </div>
      )}
    </div>

    {/* Design 1 Specific Styles */}
    <style jsx>{`
      .artist-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        cursor: pointer;
        padding: 15px 0; /* Reduced padding to fit better */
      }
      
      .artist-circle {
        width: 70px; /* Reduced from 80px */
        height: 70px; /* Reduced from 80px */
        border-radius: 50%;
        overflow: hidden;
        position: relative;
        border: 2px solid #333; /* Reduced border width */
        transition: all 0.3s ease;
        background: #2a2a2a;
      }
      
      .artist-circle.room-artist {
        border-color: #333;
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
      }
      
      .artist-circle.has-users {
        border-color: #4ade80;
        box-shadow: 0 0 20px rgba(74, 222, 128, 0.4);
      }
      
      .artist-circle.selected-by-current-user {
        border-color: #4ade80;
        box-shadow: 0 0 25px rgba(74, 222, 128, 0.6);
        transform: scale(1.05);
      }
      
      .artist-circle:hover {
        transform: scale(1.05);
      }
      
      .artist-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .artist-svg {
        width: 100%;
        height: 100%;
      }
      
      .floating-users {
        position: absolute;
        top: -15px;
        right: -15px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        z-index: 10;
        pointer-events: none; /* Prevent interference with artist clicks */
      }
      
      .user-avatar {
        width: 24px; /* Reduced from 28px */
        height: 24px; /* Reduced from 28px */
        border-radius: 50%;
        border: 2px solid white;
        background: #666;
        animation: slideInRight 0.4s ease-out;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px; /* Reduced font size */
        font-weight: bold;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      
      .user-count {
        background: #4ade80 !important;
        color: black !important;
        font-size: 8px; /* Reduced font size */
      }
      
      .room-indicator {
        position: absolute;
        top: -4px; /* Adjusted position */
        left: -4px; /* Adjusted position */
        width: 16px; /* Reduced from 20px */
        height: 16px; /* Reduced from 20px */
        background: #4ade80;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        font-size: 8px; /* Reduced font size */
        z-index: 5;
        color: black;
        font-weight: bold;
      }
      
      .artist-name {
        font-size: 11px; /* Reduced from 12px */
        color: #ccc;
        margin-top: 6px; /* Reduced margin */
        text-align: center;
        max-width: 70px; /* Adjusted to match circle size */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      /* User avatar color variations */
      .user-avatar.user-1 { background: linear-gradient(135deg, #ff6b6b, #ee5a52); }
      .user-avatar.user-2 { background: linear-gradient(135deg, #4ecdc4, #44a08d); }
      .user-avatar.user-3 { background: linear-gradient(135deg, #45b7d1, #96c93d); }
      .user-avatar.user-4 { background: linear-gradient(135deg, #f9ca24, #f0932b); }
      .user-avatar.user-5 { background: linear-gradient(135deg, #eb4d4b, #6c5ce7); }
      .user-avatar.user-6 { background: linear-gradient(135deg, #a55eea, #26de81); }
      .user-avatar.user-7 { background: linear-gradient(135deg, #fd79a8, #fdcb6e); }
      .user-avatar.user-8 { background: linear-gradient(135deg, #6c5ce7, #a29bfe); }
      
      @keyframes slideInRight {
        0% { 
          transform: translateX(30px); 
          opacity: 0; 
          scale: 0.5;
        }
        50% { 
          scale: 1.2;
        }
        100% { 
          transform: translateX(0); 
          opacity: 1; 
          scale: 1;
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
);
};

export default ArtistPool;