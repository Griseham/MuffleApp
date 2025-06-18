import React, { useState } from "react";
import { UserIcon, VolumeIcon } from "./Icons/Icons";
import { getAvatarForUser } from "../utils/avatarService";

// UserHoverCard component that doesn't rely on position prop
const UserHoverCard = ({ user, userData, className = "" }) => {
  const [genresExpanded, setGenresExpanded] = useState(false);
  
  // Default styling for genres - static data
  const defaultGenres = [
    { name: 'Rock', percent: 35, color: '#f56c42' },
    { name: 'Pop', percent: 25, color: '#1db954' },
    { name: 'Hip-Hop', percent: 15, color: '#3b82f6' },
    { name: 'Other', percent: 25, color: '#9ca3af' }
  ];

  // Use arrow data from userData if available, otherwise use defaults
  const positiveArrows = userData?.arrowCounts?.positive ? [
    { direction: 'positive', strength: 3, count: userData.arrowCounts.positive.three },
    { direction: 'positive', strength: 2, count: userData.arrowCounts.positive.two },
    { direction: 'positive', strength: 1, count: userData.arrowCounts.positive.one }
  ] : [
    { direction: 'positive', strength: 3, count: 42 },
    { direction: 'positive', strength: 2, count: 78 },
    { direction: 'positive', strength: 1, count: 123 }
  ];
  
  const negativeArrows = userData?.arrowCounts?.negative ? [
    { direction: 'negative', strength: 1, count: userData.arrowCounts.negative.one },
    { direction: 'negative', strength: 2, count: userData.arrowCounts.negative.two },
    { direction: 'negative', strength: 3, count: userData.arrowCounts.negative.three }
  ] : [
    { direction: 'negative', strength: 1, count: 56 },
    { direction: 'negative', strength: 2, count: 34 },
    { direction: 'negative', strength: 3, count: 19 }
  ];

  // Calculate percentages for the bars
  const totalPositive = positiveArrows.reduce((sum, arrow) => sum + arrow.count, 0);
  const totalNegative = negativeArrows.reduce((sum, arrow) => sum + arrow.count, 0);
  const totalAll = totalPositive + totalNegative;
  const positivePercent = totalAll > 0 ? Math.round((totalPositive / totalAll) * 100) : 70;
  const negativePercent = 100 - positivePercent;

  // Safely extract user info
  const displayName = userData?.displayName || user?.name || "User";
  const verified = userData?.verified || false;
  const createdAt = userData?.createdAt || "Jan 2023";
  const following = userData?.following || 250;
  const followers = userData?.followers || 120;
  const discoveryPercent = userData?.discoveryPercent || 8;
  const volume = user?.volume || userData?.volume || 0;
  const avatar = user?.avatar || userData?.avatar || getAvatarForUser(1);

  // Simple progress bar component
  const HorizontalBar = ({ genre }) => (
    <div className="mb-3">
      <div className="flex justify-between mb-1 text-xs">
        <span className="text-white">{genre.name}</span>
        <span className="text-gray-400">{genre.percent}%</span>
      </div>
      <div className="h-1 bg-gray-800 rounded overflow-hidden">
        <div 
          className="h-full rounded"
          style={{
            width: `${genre.percent}%`,
            backgroundColor: genre.color
          }}
        />
      </div>
    </div>
  );

  // Arrow button component
  const ArrowWithCount = ({ direction, strength, count }) => {
    const color = direction === 'positive' ? 'text-green-500' : 'text-red-500';
    
    return (
      <div className="flex items-center">
        <div className={`flex-shrink-0 w-7 h-7 rounded bg-gray-900/80 flex items-center justify-center border border-gray-800 ${color}`}>
          {direction === 'positive' && (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              {strength === 1 && <path d="M19 12L14 7M19 12L14 17" />}
              {strength === 2 && (
                <>
                  <path d="M19 12L14 7M19 12L14 17" />
                  <path d="M15 12L10 7M15 12L10 17" />
                </>
              )}
              {strength === 3 && (
                <>
                  <path d="M19 12L14 7M19 12L14 17" />
                  <path d="M15 12L10 7M15 12L10 17" />
                  <path d="M11 12L6 7M11 12L6 17" />
                </>
              )}
            </svg>
          )}
          {direction === 'negative' && (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              {strength === 1 && <path d="M5 12L10 7M5 12L10 17" />}
              {strength === 2 && (
                <>
                  <path d="M5 12L10 7M5 12L10 17" />
                  <path d="M9 12L14 7M9 12L14 17" />
                </>
              )}
              {strength === 3 && (
                <>
                  <path d="M5 12L10 7M5 12L10 17" />
                  <path d="M9 12L14 7M9 12L14 17" />
                  <path d="M13 12L18 7M13 12L18 17" />
                </>
              )}
            </svg>
          )}
        </div>
        <div className={`ml-1 text-xs font-medium ${color}`}>
          {count}
        </div>
      </div>
    );
  };

  // Main render - removed position styling since it's handled by the parent
  return (
    <div className={`bg-black border border-gray-800 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm ${className}`}>
      <div className="p-4">
        {/* User header with actual avatar */}
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 rounded-full bg-gray-900 overflow-hidden flex items-center justify-center">
            {/* Use actual user avatar */}
            <img 
              src={avatar} 
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback icon - hidden by default */}
            <div className="w-full h-full hidden items-center justify-center">
              <UserIcon className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          
          <div className="ml-3">
            <div className="flex items-center">
              <h3 className="text-white font-bold text-base">{displayName}</h3>
              {verified && (
                <svg className="w-4 h-4 ml-1 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              )}
            </div>
            <div className="text-sm text-gray-400">
              Joined {createdAt}
            </div>
          </div>
          
          <div className="ml-auto flex items-center text-sm text-green-500">
            <VolumeIcon className="w-4 h-4 mr-1" />
            <span>{volume}</span>
          </div>
        </div>

        {/* Discovery percentage with expandable genres */}
        <div className="mb-3">
          <div 
            className="bg-gray-900 rounded-lg p-2 cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => setGenresExpanded(!genresExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="text-white text-sm font-medium">
                Discovered {discoveryPercent}% of music
              </div>
              <svg 
                className={`w-5 h-5 text-white transition-transform ${genresExpanded ? 'rotate-180' : ''}`} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          
          {/* Expandable genres */}
          {genresExpanded && (
            <div className="mt-2 p-3 bg-gray-900/40 rounded-lg border border-gray-800 animate-fadeIn">
              {defaultGenres.map((genre, index) => (
                <HorizontalBar key={index} genre={genre} />
              ))}
            </div>
          )}
        </div>
        
        {/* Music Ratings */}
        <div className="bg-gray-900/40 p-3 rounded-lg mb-3">
          {/* Positive Arrows */}
          <div className="mb-3 pb-2 border-b border-gray-800">
            <div className="flex space-x-4 mb-2">
              {positiveArrows.map((arrow, index) => (
                <div key={index} className="flex-1">
                  <ArrowWithCount 
                    direction={arrow.direction} 
                    strength={arrow.strength} 
                    count={arrow.count}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="h-1 flex-1 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-green-500 rounded" style={{ width: `${positivePercent}%` }} />
              </div>
              <span className="text-green-500 text-xs font-medium ml-2">{positivePercent}%</span>
            </div>
          </div>
          
          {/* Negative Arrows */}
          <div>
            <div className="flex space-x-4 mb-2">
              {negativeArrows.map((arrow, index) => (
                <div key={index} className="flex-1">
                  <ArrowWithCount 
                    direction={arrow.direction} 
                    strength={arrow.strength} 
                    count={arrow.count}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="h-1 flex-1 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-red-500 rounded" style={{ width: `${negativePercent}%` }} />
              </div>
              <span className="text-red-500 text-xs font-medium ml-2">{negativePercent}%</span>
            </div>
          </div>
        </div>
        
        {/* Following/Followers - improved spacing */}
        <div className="flex items-center justify-between text-sm border-t border-gray-800 pt-4 pb-1">
          <div className="mr-4">
            <span className="font-bold text-white">{following}</span>
            <span className="text-gray-400"> Following</span>
          </div>
          <div className="mr-4">
            <span className="font-bold text-white">{followers}</span>
            <span className="text-gray-400"> Followers</span>
          </div>
          <button className="bg-white hover:bg-gray-200 text-black font-bold rounded-full py-1.5 px-4 text-sm transition-colors ml-auto">
            Follow
          </button>
        </div>
      </div>
      
      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UserHoverCard;