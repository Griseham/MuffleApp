// NavigationControls.jsx - Navigation buttons with constellation cycling
import React, { useMemo, useState, useEffect } from "react";
import styles from "../styles";
import EnhancedArtistFilterBar from "../EnhancedArtistFilterBar";
import { friendColors } from "../utils";
import { Info } from "lucide-react";
import InfoIconModal from "../InfoIconModal";
import { getAvatarForUser } from '../../utils/avatarService';


export default function Controls({
  isFullscreen,
  toggleFullscreen,
  snapToOrigin,
  snapToFriend,
  snapToArtist,
  artists,
  onAddArtist,
  onRemoveArtist,
  onSelectArtist,
  selectedArtist
}) {
  // Generate fixed avatar IDs for friends that won't change
  const friendAvatars = useMemo(() => [222, 333, 444], []);
  
  // Track which constellation is currently shown for each artist
  const [artistConstellations, setArtistConstellations] = useState({});
  
  // Initialize constellation indices when artists change
  useEffect(() => {
    if (!artists || artists.length === 0) return;
    
    const initialIndices = {};
    artists.forEach(artist => {
      if (artist && artist.id) {
        // Default to showing the first constellation (index 0)
        initialIndices[artist.id] = artistConstellations[artist.id] || 0;
      }
    });
    
    setArtistConstellations(initialIndices);
  }, [artists]);
  
  // Handle artist button click - cycles through constellations
  const handleArtistClick = (artist) => {
    // Get current constellation index
    const currentIndex = artistConstellations[artist.id] || 0;
    // Calculate next index (cycle through 0, 1, 2)
    const nextIndex = (currentIndex + 1) % 3;
    
    // Cycling constellation
    
    // Update the state
    setArtistConstellations(prev => ({
      ...prev,
      [artist.id]: nextIndex
    }));
    
    // Calculate position based on constellation index - with MUCH larger offsets
    // This needs to match the offsets in ConstellationOverlay
    const offsetX = nextIndex === 1 ? -8000 : nextIndex === 2 ? 8000 : 0;
    const offsetY = nextIndex === 1 ? -2000 : nextIndex === 2 ? 5000 : 0;
    
    // Create a modified artist object with constellation offset and index
    const artistWithOffset = {
      ...artist,
      coordinate: artist.coordinate || { x: 30000, y: 30000 },
      constellationIndex: nextIndex
    };
    
    // First update the state for the artist
    if (onSelectArtist) {
      onSelectArtist(artistWithOffset);
    }
    
    // Create position for navigation
    const navigationPosition = {
      ...artistWithOffset,
      coordinate: {
        x: (artist.coordinate ? artist.coordinate.x : 30000) + offsetX,
        y: (artist.coordinate ? artist.coordinate.y : 30000) + offsetY
      }
    };
    
    // Snap to the new constellation position
    snapToArtist(navigationPosition);
  };
  
  // Get button background color based on constellation index
  const getButtonStyle = (artist) => {
    const index = artistConstellations[artist.id] || 0;
    const isSelected = selectedArtist && selectedArtist.id === artist.id;
    
    // Base button style
    const baseStyle = {
      ...styles.navButton,
      marginBottom: "4px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "0.8rem",
      visibility: "visible",
      opacity: 1,
      position: "relative",
      transition: "background-color 0.3s ease"
    };
    
    // Add constellation indicator colors
    const constellationColors = [
      "rgba(60, 60, 100, 0.7)", // Default - first constellation
      "rgba(80, 60, 120, 0.8)", // Second constellation - slightly purple
      "rgba(100, 60, 140, 0.9)" // Third constellation - more purple
    ];
    
    // Add selected highlight if this is the selected artist
    if (isSelected) {
      return {
        ...baseStyle,
        backgroundColor: constellationColors[index],
        borderLeft: "3px solid #1DB954", // Spotify green indicator
        paddingLeft: "10px"
      };
    }
    
    return {
      ...baseStyle,
      backgroundColor: constellationColors[index]
    };
  };
  
  // Generate artist buttons for nav panel
  const artistButtons = artists && artists.length > 0 ? (
    <div style={{ 
      marginTop: "10px", 
      borderTop: "1px solid rgba(255,255,255,0.1)", 
      paddingTop: "10px",
      display: "block",
      visibility: "visible",
      opacity: 1
    }}>
      <div style={{ 
        fontSize: "0.8rem", 
        color: "#aaa", 
        marginBottom: "8px", 
        textAlign: "center",
        visibility: "visible"
      }}>
        Artist Constellations
      </div>
      {artists.map((artist) => (
        <button
          key={artist.id}
          onClick={() => handleArtistClick(artist)}
          style={getButtonStyle(artist)}
        >
          {/* Artist avatar */}
          {artist.imageUrl ? (
            <img 
              src={artist.imageUrl} 
              alt={artist.name}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />
          ) : (
            <div style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "#1DB954", // Spotify green
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              color: "white",
              fontWeight: "bold"
            }}>
              {artist.name[0]}
            </div>
          )}
          
          {/* Artist name with constellation indicator */}
          <span style={{ flex: 1 }}>{artist.name}</span>
          
          {/* Constellation indicator */}
          <span style={{
            fontSize: "0.65rem",
            backgroundColor: "rgba(0,0,0,0.3)",
            borderRadius: "4px",
            padding: "1px 4px",
            marginLeft: "4px"
          }}>
            {(artistConstellations[artist.id] || 0) + 1}/3
          </span>
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
    
      {/* Navigation buttons with forced visibility */}
      <div style={{
        ...styles.navBtns,
        display: "flex", // Force display
        visibility: "visible", // Force visibility
        opacity: 1, // Force opacity
      }}>
        <button
          onClick={toggleFullscreen}
          style={styles.navButton}
        >
          {isFullscreen ? "Exit" : "Fullscreen"}
        </button>
        <button
          onClick={snapToOrigin}
          style={styles.navButton}
        >
          For You
        </button>
        
        {/* Friend buttons - Using fixed avatar IDs */}
        {/* Friend buttons - Using fixed avatar IDs */}
{[0, 1, 2].map((fid) => {
  // For Friend 1 only, wrap in a relative container + InfoIconModal
  if (fid === 0) {
    return (
      <div
        key={fid}
        style={{ position: "relative", display: "inline-flex", alignItems: "center", marginRight: "8px" }}
      >
        <button
          onClick={() => snapToFriend(fid)}
          style={{
            ...styles.friendButton
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            overflow: "hidden",
            border: `2px solid ${friendColors[fid % friendColors.length]}`,
          }}>
            <img
              src={getAvatarForUser(friendAvatars[fid])}
              alt={`Friend ${fid + 1}`}
              style={styles.avatarImg}
            />
          </div>
          Friend {fid + 1}
        </button>

        {/* Info icon modal on top‐right of Friend 1 */}
        <div style={{
          position: "absolute",
          top: -4,
          right: -4,
          zIndex: 9999
        }}>
          <InfoIconModal
            title="Friend 1 Info"
            iconSize={12}
            buttonText={false}  /* only show the ℹ icon */
            steps={[
              {
                icon: <Info size={14} color="#a9b6fc" />,
                title: "Friends",
                content:
                  "Visit your friend’s “For you” page and see their music taste and the threads on their feed."
              }
            
            ]}
          />
        </div>
      </div>
    );
  }

  // For Friend 2 and Friend 3, leave as-is
  return (
    <button
      key={fid}
      onClick={() => snapToFriend(fid)}
      style={{
        ...styles.friendButton,
        marginRight: "8px"
      }}
    >
      <div style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        overflow: "hidden",
        border: `2px solid ${friendColors[fid % friendColors.length]}`,
      }}>
        <img
          src={getAvatarForUser(friendAvatars[fid])}
          alt={`Friend ${fid + 1}`}
          style={styles.avatarImg}
        />
      </div>
      Friend {fid + 1}
    </button>
  );
})}

        
        {/* Artist navigation buttons with cycling functionality */}
        {artistButtons}
      </div>
      
      {/* Artist filter bar */}
      <EnhancedArtistFilterBar
        onAddArtist={onAddArtist}
        onRemoveArtist={onRemoveArtist}
        onSelectArtist={onSelectArtist}
        activeArtists={artists}
        isFullscreen={isFullscreen}
      />
    </>
  );
}