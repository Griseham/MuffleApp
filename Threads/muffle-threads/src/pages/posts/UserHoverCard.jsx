import React from 'react';
import { BadgeCheck } from 'lucide-react';

// Main UserHoverCard component with clean design
const UserHoverCard = ({ user, onUserClick, avatarSrc }) => {
  // Default user data if not provided
  const defaultUser = {
    username: 'musiclover',
    displayName: 'Music Lover',
    verified: false,
    createdAt: 'Jan 2023',
    following: 217,
    followers: 118,
    discoveryPercent: 5,
    genres: [
      { name: 'Rock', percent: 35, color: '#f56c42' },
      { name: 'Pop', percent: 25, color: '#1db954' },
      { name: 'Hip-Hop', percent: 15, color: '#3b82f6' }
    ]
  };

  const userData = user || defaultUser;

  // Render a horizontal progress bar for genres
  const HorizontalBar = ({ genre, maxWidth = 160 }) => {
    return (
      <div style={{ marginBottom: '10px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '12px',
        }}>
          <span style={{ color: 'white' }}>{genre.name}</span>
          <span style={{ color: '#9CA3AF' }}>{genre.percent}%</span>
        </div>
        <div style={{ 
          height: '4px', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div 
            style={{
              height: '100%',
              width: `${genre.percent}%`,
              backgroundColor: genre.color,
              borderRadius: '2px',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed z-50 w-72 bg-black border border-gray-700 rounded-xl shadow-xl" 
      onClick={(e) => {
        e.stopPropagation(); // Prevent clicks inside the card from bubbling
      }}
    >
      {/* User info */}
      <div className="p-4">
        {/* User header with avatar and follow button */}
        <div className="flex items-center gap-3">
          {/* User avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden">
            <img 
              src={userData.avatar || avatarSrc || "/threads/assets/user.png"} 
              alt={`${userData.displayName}'s avatar`} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Follow button */}
          <button 
            className="ml-auto bg-white hover:bg-gray-200 text-black font-semibold rounded-full px-4 py-1.5 text-sm"
            onClick={(e) => e.stopPropagation()} // Stop propagation for this button
          >
            Follow
          </button>
        </div>

        {/* Username and verification */}
        <div className="mt-3">
          <div className="flex items-center">
            <h3 className="text-white font-bold text-lg">{userData.displayName}</h3>
            {userData.verified && (
              <BadgeCheck size={18} className="text-blue-500 ml-1" />
            )}
          </div>
          <p className="text-gray-400 text-sm">@{userData.username}</p>
        </div>

        {/* Account creation */}
        <div className="mt-2 text-gray-400 text-sm">
          Joined {userData.createdAt}
        </div>

        {/* Genre visualization - HORIZONTAL BARS */}
        <div className="mt-4">
          {userData.genres.map((genre, index) => (
            <HorizontalBar key={index} genre={genre} />
          ))}
        </div>

        {/* Discovery percentage */}
        <div className="mt-4 bg-gray-900 rounded-lg p-3">
          <div className="text-white text-sm font-semibold">
            Discovered {userData.discoveryPercent}% of music
          </div>
        </div>
        
        {/* Following/Followers */}
        <div className="flex gap-4 mt-4 text-sm border-t border-gray-800 pt-4">
          <div>
            <span className="font-bold text-white">{userData.following}</span>
            <span className="text-gray-400"> Following</span>
          </div>
          <div>
            <span className="font-bold text-white">{userData.followers}</span>
            <span className="text-gray-400"> Followers</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// This is the wrapper that makes any avatar clickable and shows the hover card
const UserAvatarWithHoverCard = ({ user, avatarSrc, size = 48, onUserClick }) => {
  const [showHoverCard, setShowHoverCard] = React.useState(false);
  const [hoverTimeout, setHoverTimeout] = React.useState(null);
  const [hoverPosition, setHoverPosition] = React.useState({ top: 0, left: 0 });
  const avatarRef = React.useRef(null);
  
  // Generate random genres if not provided
  const generateRandomGenres = () => {
    const genreOptions = [
      { name: 'Rock', color: '#f56c42' },
      { name: 'Pop', color: '#1db954' },
      { name: 'Hip-Hop', color: '#3b82f6' },
      { name: 'Electronic', color: '#FF9500' },
      { name: 'R&B', color: '#8338EC' },
      { name: 'Jazz', color: '#06D6A0' },
      { name: 'Metal', color: '#FF47DA' },
      { name: 'Classical', color: '#3A86FF' },
      { name: 'K-Pop', color: '#FF758F' },
      { name: 'Lo-Fi', color: '#FF6B35' }
    ];
    
    // Shuffle and pick 3 random genres
    const shuffled = [...genreOptions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    // Assign random percentages (20-45%)
    return selected.map(genre => ({
      ...genre,
      percent: Math.floor(Math.random() * (45 - 20 + 1)) + 20
    }));
  };
  
  // Enhance user object with required fields
  const enhancedUser = React.useMemo(() => ({
    ...user,
    displayName: user.displayName || user.author || user.username || 'User',
    username: user.username || user.author || 'user',
    verified: Math.random() > 0.7, // 30% chance of being verified
    createdAt: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][Math.floor(Math.random() * 6)] + ' ' + (2021 + Math.floor(Math.random() * 4)),
    following: user.following || Math.floor(Math.random() * 500) + 50,
    followers: user.followers || Math.floor(Math.random() * 300) + 20,
    discoveryPercent: user.discoveryPercent || Math.floor(Math.random() * 15) + 1,
    genres: user.genres || generateRandomGenres()
  }), [user]);
  
  const calculatePosition = React.useCallback(() => {
    if (!avatarRef.current) return { top: 0, left: 0 };
    
    const rect = avatarRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = rect.bottom + window.scrollY + 10; // 10px below the avatar
    let left = rect.left + window.scrollX;
    
    // Check if card would go off the right edge
    if (left + 288 > viewportWidth) { // 288px = card width (272px) + some margin
      left = Math.max(0, viewportWidth - 288);
    }
    
    // Check if card would go off the bottom edge
    // Approximate card height is 350px for the new design
    if (top + 350 > viewportHeight + window.scrollY) {
      // Position above the avatar if there's not enough space below
      top = rect.top + window.scrollY - 350 - 10; // 10px above the avatar
      
      // If still off screen (not enough space above either), position at the top
      if (top < window.scrollY) {
        top = window.scrollY + 10;
      }
    }
    
    return { top, left };
  }, []);
  
  const handleMouseEnter = React.useCallback((e) => {
    // Stop propagation to prevent postcard from capturing this event
    e.stopPropagation();
    
    // Cancel any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    const timeout = setTimeout(() => {
      setHoverPosition(calculatePosition());
      setShowHoverCard(true);
    }, 300); // Delay before showing the hover card
    setHoverTimeout(timeout);
  }, [calculatePosition, hoverTimeout]);
  
  const handleMouseLeave = React.useCallback((e) => {
    // Stop propagation to prevent postcard from capturing this event
    e.stopPropagation();
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    // Add a small delay before hiding to allow movement to the card
    const timeout = setTimeout(() => {
      setShowHoverCard(false);
    }, 100);
    setHoverTimeout(timeout);
  }, [hoverTimeout]);
  
  const navigateToProfile = React.useCallback((e) => {
    // Stop propagation to prevent postcard from capturing this event
    e.stopPropagation();
    
    // Navigate to user profile
    if (onUserClick) {
      onUserClick(enhancedUser);
    } else {
      console.log(`Navigating to ${enhancedUser.username}'s profile`);
    }
  }, [enhancedUser, onUserClick]);
  
  React.useEffect(() => {
    // Clean up timeout on unmount
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);
  
  return (
    <div 
      className="relative" 
      onClick={(e) => e.stopPropagation()} // Stop propagation at the wrapper level too
    >
      <div 
        ref={avatarRef}
        className="cursor-pointer rounded-full overflow-hidden"
        style={{ width: `${size}px`, height: `${size}px` }}
        onClick={navigateToProfile}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img 
          src={avatarSrc || "/threads/assets/user.png"} 
          alt={`${enhancedUser.displayName}'s avatar`}
          className="w-full h-full object-cover" 
        />
      </div>
      
      {showHoverCard && (
        <div 
          className="fixed z-50"
          style={{
            top: `${hoverPosition.top}px`,
            left: `${hoverPosition.left}px`
          }}
          onMouseEnter={(e) => {
            e.stopPropagation(); // Stop propagation
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
            }
            setShowHoverCard(true);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <UserHoverCard 
            user={enhancedUser} 
            onUserClick={onUserClick}
            avatarSrc={avatarSrc}
          />
        </div>
      )}
    </div>
  );
};

export { UserAvatarWithHoverCard as ClickableUserAvatar };
export default UserHoverCard;