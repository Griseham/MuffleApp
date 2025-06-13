import React, { useState, useRef, useEffect } from "react";
import { VolumeIcon } from "./Icons/Icons";
import UserHoverCard from "./UserHoverCard";

// Trend arrow components - Smaller sizes
const UpArrow = ({ className = "" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" className={`text-green-400 fill-current ${className}`}>
    <path d="M7 14L12 9L17 14H7Z" />
  </svg>
);

const DownArrow = ({ className = "" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" className={`text-red-400 fill-current ${className}`}>
    <path d="M17 10L12 15L7 10H17Z" />
  </svg>
);

const StableIcon = ({ className = "" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" className={`text-gray-500 ${className}`}>
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Pure SVG User Avatar Component with Dynamic Colors
const PureUserAvatar = ({ userId, size = 48, className = "" }) => {
  // Generate consistent colors based on user ID
  const getUserColor = (id) => {
    const colors = [
      { bg: 'bg-gradient-to-br from-blue-500 to-blue-700', icon: 'text-blue-100' },
      { bg: 'bg-gradient-to-br from-green-500 to-green-700', icon: 'text-green-100' },
      { bg: 'bg-gradient-to-br from-purple-500 to-purple-700', icon: 'text-purple-100' },
      { bg: 'bg-gradient-to-br from-red-500 to-red-700', icon: 'text-red-100' },
      { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-700', icon: 'text-yellow-100' },
      { bg: 'bg-gradient-to-br from-pink-500 to-pink-700', icon: 'text-pink-100' },
      { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-700', icon: 'text-indigo-100' },
      { bg: 'bg-gradient-to-br from-orange-500 to-orange-700', icon: 'text-orange-100' },
      { bg: 'bg-gradient-to-br from-teal-500 to-teal-700', icon: 'text-teal-100' },
      { bg: 'bg-gradient-to-br from-cyan-500 to-cyan-700', icon: 'text-cyan-100' },
      { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-700', icon: 'text-emerald-100' },
      { bg: 'bg-gradient-to-br from-violet-500 to-violet-700', icon: 'text-violet-100' },
      { bg: 'bg-gradient-to-br from-rose-500 to-rose-700', icon: 'text-rose-100' },
      { bg: 'bg-gradient-to-br from-lime-500 to-lime-700', icon: 'text-lime-100' },
      { bg: 'bg-gradient-to-br from-amber-500 to-amber-700', icon: 'text-amber-100' },
    ];
    
    return colors[(id - 1) % colors.length];
  };

  const userColor = getUserColor(userId);
  const iconSize = Math.floor(size * 0.5); // Icon is 50% of container size

  return (
    <div 
      className={`w-${size === 48 ? '12' : '10'} h-${size === 48 ? '12' : '10'} rounded-full ${userColor.bg} flex items-center justify-center shadow-lg ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        className={userColor.icon}
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  );
};

const QueueLine = ({ qlUsers }) => {
  // Track which user is selected (clicked)
  const [selectedUser, setSelectedUser] = useState(null);
  // Position for the modal
  const [cardPosition, setCardPosition] = useState({ top: 100, left: 100 });
  
  // Store references to user elements for positioning
  const userRefs = useRef({});
  // Reference to the container element for boundary checking
  const containerRef = useRef(null);

  // State for users with ranking logic - COMPLETELY AVATAR-FREE
  const [users, setUsers] = useState(() => 
    qlUsers.slice(0, 8).map((user, index) => ({ 
      ...user, 
      score: 100 - (index * 8) + Math.random() * 10, // Initial scores based on volume order
      trend: 'stable', 
      lastPosition: index + 1,
      position: index + 1
    }))
  );

  // Logic to move users around and calculate trends
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          // Randomly adjust scores to create movement
          const scoreChange = (Math.random() - 0.5) * 15; // -7.5 to +7.5
          const newScore = Math.max(0, Math.min(100, user.score + scoreChange));
          
          return {
            ...user,
            score: newScore,
            lastPosition: user.position
          };
        });
        
        // Sort by score to get new positions
        const sortedUsers = [...updatedUsers].sort((a, b) => b.score - a.score);
        
        // Update positions and calculate trends
        return sortedUsers.map((user, index) => {
          const newPosition = index + 1;
          const oldPosition = user.lastPosition;
          
          let trend = 'stable';
          if (newPosition < oldPosition) trend = 'up';
          else if (newPosition > oldPosition) trend = 'down';
          
          return {
            ...user,
            position: newPosition,
            trend
          };
        });
      });
    }, 3000); // Update every 3 seconds
    
    return () => clearInterval(interval);
  }, []);

  // UPDATED: Create unique random data for each user - NO AVATAR SERVICE
  const generateRandomUserData = (user) => {
    // Each month has an equal chance
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const randomMonth = months[Math.floor(Math.random() * months.length)];
    
    // Years between 2020 and 2023
    const randomYear = 2020 + Math.floor(Math.random() * 4);
    
    // Generate custom discovery percent based on user ID (lower IDs have higher discovery)
    const discoveryPercent = Math.max(1, Math.min(15, Math.floor(20 - (user.id / 2))));
    
    // Generate following/followers with some correlation to volume
    const volumeFactor = user.volume / 1000;
    const following = Math.floor(50 + (Math.random() * 400) + volumeFactor * 100);
    const followers = Math.floor(20 + (Math.random() * 300) + volumeFactor * 200);
    
    // Verification status (higher volume users more likely to be verified)
    const verifiedThreshold = 1800; // Users with volume above this are more likely verified
    const baseVerifyChance = user.volume > verifiedThreshold ? 0.7 : 0.3;
    const verified = Math.random() < baseVerifyChance;
    
    return {
      displayName: user.name,
      verified: verified,
      createdAt: `${randomMonth} ${randomYear}`,
      following: following,
      followers: followers,
      discoveryPercent: discoveryPercent,
      volume: user.volume,
      // Generate unique arrow counts for each user
      arrowCounts: {
        positive: {
          one: 80 + Math.floor(Math.random() * 80),
          two: 40 + Math.floor(Math.random() * 60),
          three: 10 + Math.floor(Math.random() * 50)
        },
        negative: {
          one: 30 + Math.floor(Math.random() * 40),
          two: 10 + Math.floor(Math.random() * 30),
          three: 5 + Math.floor(Math.random() * 20)
        }
      }
    };
  };

  // UPDATED: Create static user data with unique values for each user - NO AVATAR SERVICE
  const staticUserData = useRef(users.map(user => ({
    id: user.id,
    name: user.name,
    volume: user.volume,
    userData: generateRandomUserData(user)
  }))).current;

  // Function to calculate a safe position for the modal
  const calculateSafePosition = (userElement) => {
    if (!userElement) return { top: 100, left: 100 };
    
    const rect = userElement.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    
    // Get window dimensions
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    // Modal dimensions (approximate)
    const modalHeight = 400; // Approximate modal height
    const modalWidth = 280; // Approximate modal width
    
    // Calculate initial position (centered above the user)
    let top = rect.top - modalHeight - 20;
    let left = rect.left + (rect.width / 2) - (modalWidth / 2);
    
    // If the modal would be off the top of the screen, position it below the user
    if (top < 20) {
      top = rect.bottom + 20;
    }
    
    // Make sure the modal doesn't go off the right side
    if (left + modalWidth > windowWidth - 20) {
      left = windowWidth - modalWidth - 20;
    }
    
    // Make sure the modal doesn't go off the left side
    if (left < 20) {
      left = 20;
    }
    
    // Make sure the modal is visible in the container
    if (top + modalHeight > containerRect.top + containerRect.height) {
      top = containerRect.top + containerRect.height - modalHeight - 20;
    }
    
    // Ensure minimum top position
    if (top < 20) {
      top = 20;
    }
    
    return { top, left };
  };

  // Handle click on user circle
  const handleUserClick = (userId, index) => {
    // Find the user in our static data
    const user = staticUserData.find(u => u.id === userId);
    if (!user) return;
    
    // Calculate position based on user element
    const userElement = userRefs.current[`user-${index}`];
    if (userElement) {
      // Calculate a safe position for the modal
      setCardPosition(calculateSafePosition(userElement));
      
      // If clicking the same user, close the modal
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(null);
      } else {
        // Set the newly selected user
        setSelectedUser(user);
      }
    }
  };

  // This will create a global click handler to close the modal when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // If we're clicking a user circle, let the circle's click handler manage it
      if (e.target.closest('.user-circle')) return;
      
      // If we're clicking on the modal, don't close it
      if (e.target.closest('.user-modal')) return;
      
      // Otherwise, close the modal
      setSelectedUser(null);
    };

    // Only add the listener if a user is selected
    if (selectedUser) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [selectedUser]);

  return (
    <div className="ql-content relative" ref={containerRef}>
      {/* Grid of user profiles - Scaled down for better fit */}
      <div className="grid grid-cols-4 gap-x-6 gap-y-6 px-3 pt-2 pb-2">
        {users.map((user, index) => (
          <div 
            key={user.id}
            className="flex flex-col items-center relative"
            ref={el => userRefs.current[`user-${index}`] = el}
          >
            {/* Rank Badge - Smaller */}
            <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center z-10 ${
              index === 0 ? 'bg-yellow-500 text-black' :
              index === 1 ? 'bg-gray-300 text-black' :
              index === 2 ? 'bg-amber-600 text-white' :
              'bg-gray-600 text-white'
            }`}>
              {index + 1}
            </div>
            
            {/* Volume Badge - Smaller and repositioned */}
            <div className="absolute -bottom-2 -left-2 py-0.5 px-1.5 rounded text-xs flex items-center justify-center bg-black border border-gray-800 z-10">
              <VolumeIcon className="w-3 h-3 mr-1 text-[#1DB954]" />
              <span className="text-gray-300 font-medium text-xs">{user.volume}</span>
            </div>
            
            {/* UPDATED: User Circle with Pure SVG avatar - NO MORE IMAGE REFERENCES */}
            <div 
              className={`user-circle rounded-full overflow-hidden shadow-md transition cursor-pointer relative ${
                selectedUser?.id === user.id ? 'ring-[#1DB954] ring-2' : 
                index === 0 ? 'ring-2 ring-yellow-500 hover:ring-yellow-400' :
                index === 1 ? 'ring-2 ring-gray-300 hover:ring-gray-200' :
                index === 2 ? 'ring-2 ring-amber-600 hover:ring-amber-500' :
                'ring-1 ring-gray-800 hover:ring-[#1DB954]'
              }`}
              onClick={() => handleUserClick(user.id, index)}
            >
              {/* Pure SVG User Avatar with dynamic colors */}
              <PureUserAvatar userId={user.id} size={48} />
            </div>
            
            {/* Username - Smaller text */}
            <p className="text-xs text-gray-400 mt-2 truncate w-full text-center font-medium max-w-16">
              {user.name}
            </p>
            
            {/* Trend Arrow with Position Change - Smaller arrows */}
            <div className="mt-1 flex items-center justify-center gap-1">
              {user.trend === 'up' && (
                <div className="flex items-center">
                  <UpArrow className="animate-bounce w-3.5 h-3.5" />
                  <span className="text-xs text-green-400 ml-0.5 font-medium">+{user.lastPosition - user.position}</span>
                </div>
              )}
              {user.trend === 'down' && (
                <div className="flex items-center">
                  <DownArrow className="animate-bounce w-3.5 h-3.5" />
                  <span className="text-xs text-red-400 ml-0.5 font-medium">-{user.position - user.lastPosition}</span>
                </div>
              )}
              {user.trend === 'stable' && <StableIcon className="w-3.5 h-3.5" />}
            </div>
          </div>
        ))}
      </div>

      {/* Selected user modal (from click) */}
      {selectedUser && (
        <div 
          className="scale-110 origin-bottom fixed z-[1000] user-modal"
          style={{
            top: cardPosition.top,
            left: cardPosition.left
          }}
        >
          <UserHoverCard 
            user={selectedUser} 
            userData={selectedUser.userData}
            className="w-72"
          />
        </div>
      )}
    </div>
  );
};

export default QueueLine;