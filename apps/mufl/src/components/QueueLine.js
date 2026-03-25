import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VolumeIcon } from "./Icons/Icons";
import UserHoverCard from "./UserHoverCard";
import { getAvatarForUser } from "../utils/avatarService";

// Trend indicator component
const TrendIcon = ({ trend, change }) => {
  if (trend === 'up') return (
    <div className="ql-trend ql-trend--up">
      <svg className="ql-trend__icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
      <span className="ql-trend__value">+{change}</span>
    </div>
  );
  if (trend === 'down') return (
    <div className="ql-trend ql-trend--down">
      <svg className="ql-trend__icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      <span className="ql-trend__value">-{change}</span>
    </div>
  );
  return <span className="ql-trend ql-trend--stable">—</span>;
};

// Chevron icon for expand/collapse
const ChevronIcon = ({ isExpanded }) => (
  <svg 
    className={`ql-row__chevron ${isExpanded ? 'is-expanded' : ''}`}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const QueueLine = ({ qlUsers }) => {
  // Track which user is expanded
  const [expandedId, setExpandedId] = useState(null);
  
  // Track which user is hovered for the hover card
  const [hoveredUserId, setHoveredUserId] = useState(null);

  // Generate consistent avatar assignments for each user ID
  const getUserAvatar = useCallback((userId) => {
    return getAvatarForUser(userId);
  }, []);

  const buildUsers = useCallback((incomingUsers = []) => (
    incomingUsers.slice(0, 8).map((user, index) => ({
      ...user,
      score: 100 - (index * 8) + Math.random() * 10,
      trend: 'stable',
      lastPosition: index + 1,
      position: index + 1,
      avatar: getUserAvatar(user.id),
      rightSwipes: Math.floor(Math.random() * 100) + 20,
      leftSwipes: Math.floor(Math.random() * 30),
      queued: Math.floor(Math.random() * 50) + 10,
      approvalRate: Math.floor((Math.random() * 30) + 70)
    }))
  ), [getUserAvatar]);

  // State for users with ranking logic
  const [users, setUsers] = useState(() => 
    buildUsers(Array.isArray(qlUsers) ? qlUsers : [])
  );

  useEffect(() => {
    setUsers(buildUsers(Array.isArray(qlUsers) ? qlUsers : []));
    setExpandedId(null);
    setHoveredUserId(null);
  }, [buildUsers, qlUsers]);

  // Logic to move users around and calculate trends
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          const scoreChange = (Math.random() - 0.5) * 15;
          const newScore = Math.max(0, Math.min(100, user.score + scoreChange));
          
          return {
            ...user,
            score: newScore,
            lastPosition: user.position
          };
        });
        
        const sortedUsers = [...updatedUsers].sort((a, b) => b.score - a.score);
        
        return sortedUsers.map((user, index) => {
          const newPosition = index + 1;
          const oldPosition = user.lastPosition;
          
          let trend = 'stable';
          let change = 0;
          if (newPosition < oldPosition) {
            trend = 'up';
            change = oldPosition - newPosition;
          } else if (newPosition > oldPosition) {
            trend = 'down';
            change = newPosition - oldPosition;
          }
          
          return {
            ...user,
            position: newPosition,
            trend,
            change
          };
        });
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Create unique random data for each user (for UserHoverCard)
  const generateRandomUserData = (user) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const randomMonth = months[Math.floor(Math.random() * months.length)];
    const randomYear = 2020 + Math.floor(Math.random() * 4);
    const discoveryPercent = Math.max(1, Math.min(15, Math.floor(20 - (user.id / 2))));
    const volumeFactor = user.volume / 1000;
    const following = Math.floor(50 + (Math.random() * 400) + volumeFactor * 100);
    const followers = Math.floor(20 + (Math.random() * 300) + volumeFactor * 200);
    const verifiedThreshold = 1800;
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
      avatar: user.avatar,
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

  const staticUserDataRef = useRef({});

  const staticUserData = useMemo(() => users.map((user) => {
    const cached = staticUserDataRef.current[user.id];

    if (!cached) {
      staticUserDataRef.current[user.id] = {
        id: user.id,
        name: user.name,
        volume: user.volume,
        avatar: user.avatar,
        userData: generateRandomUserData(user)
      };
      return staticUserDataRef.current[user.id];
    }

    staticUserDataRef.current[user.id] = {
      ...cached,
      id: user.id,
      name: user.name,
      volume: user.volume,
      avatar: user.avatar,
      userData: {
        ...cached.userData,
        displayName: user.name,
        volume: user.volume,
        avatar: user.avatar
      }
    };

    return staticUserDataRef.current[user.id];
  }), [users]);

  // Handle row click to expand/collapse
  const handleRowClick = (userId) => {
    setExpandedId(expandedId === userId ? null : userId);
  };

  const hoveredUser = staticUserData.find((user) => user.id === hoveredUserId);

  return (
    <div className="ql-compact">
      <div className="ql-compact__list">
        {users.map((user, index) => {
          const isExpanded = expandedId === user.id;
          
          return (
            <div key={user.id} className="ql-row-wrapper">
                <div 
                  className={`ql-row ${isExpanded ? 'is-expanded' : ''} ${index === 0 ? 'is-first' : ''}`}
                  onClick={() => handleRowClick(user.id)}
                >
                {/* Rank & Trend */}
                <div className="ql-row__rank-section">
                  <span className={`ql-row__rank ${
                    index === 0 ? 'is-gold' : 
                    index === 1 ? 'is-silver' : 
                    index === 2 ? 'is-bronze' : ''
                  }`}>
                    #{index + 1}
                  </span>
                  <TrendIcon trend={user.trend} change={user.change || 0} />
                </div>
                
                {/* Avatar */}
                <div
                  className="ql-row__avatar-wrap"
                  onMouseEnter={() => setHoveredUserId(user.id)}
                  onMouseLeave={() => setHoveredUserId(null)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className={`ql-row__avatar ${
                      hoveredUserId === user.id ? 'is-selected' : ''
                    } ${
                      index === 0 ? 'is-gold' : 
                      index === 1 ? 'is-silver' : 
                      index === 2 ? 'is-bronze' : ''
                    }`}
                  >
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="ql-row__avatar-img"
                      onError={(e) => {
                        e.target.src = getAvatarForUser(1);
                      }}
                    />
                  </div>
                  {hoveredUserId === user.id && hoveredUser && (
                    <div className="ql-row__hovercard">
                      <UserHoverCard 
                        user={hoveredUser} 
                        userData={hoveredUser.userData}
                        className="w-72"
                      />
                    </div>
                  )}
                </div>
                
                {/* Name */}
                <p className="ql-row__name">{user.name}</p>
                
                {/* Volume */}
                <span className="ql-row__volume">
                  <VolumeIcon className="ql-row__volume-icon" />
                  {user.volume}
                </span>
                
                {/* Chevron */}
                <ChevronIcon isExpanded={isExpanded} />
              </div>
              
              {/* Expanded Stats */}
              {isExpanded && (
                <div className="ql-row__expanded">
                  <div className="ql-row__stats">
                    <div className="ql-row__stat">
                      <span className="ql-row__stat-label">Swipes: </span>
                      <span className="ql-row__stat-value is-positive">+{user.rightSwipes}</span>
                      <span className="ql-row__stat-divider"> / </span>
                      <span className="ql-row__stat-value is-negative">-{user.leftSwipes}</span>
                    </div>
                    <div className="ql-row__stat">
                      <span className="ql-row__stat-label">Queued: </span>
                      <span className="ql-row__stat-value is-queued">{user.queued}</span>
                    </div>
                    <div className="ql-row__stat">
                      <span className="ql-row__stat-label">Rate: </span>
                      <span className="ql-row__stat-value is-rate">{user.approvalRate}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hover card rendered per-avatar */}
    </div>
  );
};

export default QueueLine;
