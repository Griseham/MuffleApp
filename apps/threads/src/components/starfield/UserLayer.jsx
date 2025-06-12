// UserLayer.jsx - Renders user and friend avatars with boundary circles
import React, { useMemo, useContext } from "react";
import styles from "../styles";
import { generateFriends, TOTAL_WIDTH, TOTAL_HEIGHT, friendColors } from "../utils";
import { StarfieldContext } from "../context/Context";
import { getAvatarForUser } from '../utils/avatarService';

export default function UserLayer({ snapToFriend }) {
  const { isFullscreen } = useContext(StarfieldContext);
  
  // Generate friends with deterministic positioning - use useMemo instead of useState
  const friends = useMemo(() => generateFriends(), []);
  
  // Generate static avatar ids that don't change when scrolling - use useMemo with empty dependency array
  const avatarIds = useMemo(() => {
    return {
      you: 111, // Fixed avatar ID for "You"
      friends: [
        222, // Fixed avatar ID for Friend 1
        333, // Fixed avatar ID for Friend 2
        444  // Fixed avatar ID for Friend 3
      ]
    };
  }, []); // Empty dependency array ensures this never changes
  
  return (
    <>
      {/* Center user (For You) circle with enhanced boundary */}
      <React.Fragment>
        {/* Boundary circle - enhanced with higher opacity for visibility */}
        <div style={{
          ...styles.forYouBoundaryCircle,
          left: TOTAL_WIDTH / 2 - 600,
          top: TOTAL_HEIGHT / 2 - 600,
          width: 1200,
          height: 1200,
          borderColor: 'rgba(255, 255, 255, 0.2)', // More visible boundary
          boxShadow: '0 0 80px rgba(255, 255, 255, 0.1)' // Add glow effect
        }}/>
        
        {/* "For You" label above the user profile picture */}
        <div style={{
          ...(isFullscreen ? styles.forYouLabelFS : styles.forYouLabelWindowed),
          ...styles.forYouLabel,
          left: TOTAL_WIDTH / 2,
          top: TOTAL_HEIGHT / 2 - (isFullscreen ? 120 : 100), // Move higher up
          transform: 'translateX(-50%)', // Center horizontally above the avatar
        }}>
          Your For You
        </div>
        
        {/* User icon with avatar */}
        <div style={{
          position: "absolute",
          left: TOTAL_WIDTH / 2 - (isFullscreen ? 45 : 30),
          top: TOTAL_HEIGHT / 2 - (isFullscreen ? 45 : 30),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: isFullscreen ? 90 : 60,
          zIndex: 100
        }}>
          <div style={{
            ...(isFullscreen ? styles.avatarWrapperFS : styles.avatarWrapperWindowed),
            ...styles.avatarWrapper
          }}>
            <img 
              src={getAvatarForUser(avatarIds.you)}
              alt="Your avatar"
              style={styles.avatarImg}
            />
          </div>
          <div style={{
            ...styles.friendText,
            ...(isFullscreen ? styles.friendTextFS : styles.friendTextWindowed)
          }}>
            You
          </div>
        </div>
      </React.Fragment>

      {/* Friend icons */}
      {friends.map((f, idx) => {
        const fc = friendColors[f.id % friendColors.length];
        return (
          <React.Fragment key={f.id}>
            {/* Boundary circle with enhanced visibility */}
            <div style={{
              ...styles.boundaryCircle,
              left: f.x - 600,
              top: f.y - 600,
              width: 1200,
              height: 1200,
              borderColor: `rgba(${fc.replace('#', '').match(/../g).map(h => parseInt(h, 16)).join(',')}, 0.4)`,
              boxShadow: `0 0 80px rgba(${fc.replace('#', '').match(/../g).map(h => parseInt(h, 16)).join(',')}, 0.15)` // Add glow effect
            }}/>
            
            {/* Friend label above the friend profile picture */}
            <div style={{
              ...(isFullscreen ? styles.friendLabelFS : styles.friendLabelWindowed),
              ...styles.friendLabel,
              left: f.x,
              top: f.y - (isFullscreen ? 120 : 100), // Move higher up
              transform: 'translateX(-50%)', // Center horizontally above the avatar
              color: fc
            }}>
              Friend {f.id + 1}'s For You
            </div>
            
            {/* Friend icon with avatar */}
            <div 
              style={{
                ...styles.friendIconWrapper,
                ...(isFullscreen ? styles.friendIconWrapperFS : styles.friendIconWrapperWindowed),
                left: f.x - (isFullscreen ? 45 : 30),
                top: f.y - (isFullscreen ? 45 : 30),
                cursor: "pointer" // Add cursor pointer to indicate it's clickable
              }}
              onClick={() => snapToFriend(f.id, friends)} // Add click handler to snap to friend
            >
              <div style={{
                ...(isFullscreen ? styles.avatarWrapperFS : styles.avatarWrapperWindowed),
                ...styles.avatarWrapper,
                borderColor: fc
              }}>
                <img 
                  src={getAvatarForUser(avatarIds.friends[idx])}
                  alt={`Friend ${f.id + 1}'s avatar`}
                  style={styles.avatarImg}
                />
              </div>
              <div style={{
                ...styles.friendText,
                ...(isFullscreen ? styles.friendTextFS : styles.friendTextWindowed)
              }}>
                Friend {f.id + 1}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
}