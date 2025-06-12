// StarInfoPanel.jsx - Displays information about a selected star
import React, { useContext, useState, useEffect, useRef } from "react";
import styles from "../styles";
import { getAvatarSrc } from "../utils";
import { StarfieldContext } from "../context/Context";
import { Info, Heart, MessageCircle, Volume2 } from 'lucide-react';

export default function StarPanel({ star, onClose, onViewThread }) {
  const { isFullscreen, containerDimensions } = useContext(StarfieldContext);
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const panelRef = useRef(null);
  
  // Set up dimensions
  const panelWidth = isFullscreen ? 400 : 320;
  const panelHeight = 350; // Approximate panel height
  
  // Use star's original coordinates in the starfield
  const starX = star.x;
  const starY = star.y;
  
  // Calculate panel position to display to the right of the star when possible
  // This will be relative to the starfield, not the viewport
  let panelX = starX + panelWidth/4 + 20;
  let panelY = starY;
  
  useEffect(() => {
    // Mark panel as mounted for animation
    setIsPanelMounted(true);
    
    // Cleanup
    return () => {
      setIsPanelMounted(false);
    };
  }, []);
  
  const panelStyle = {
    ...(isFullscreen ? styles.starInfoPanelFS : styles.starInfoPanelWindowed),
    ...styles.starInfoPanel,
    transformOrigin: 'center',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 15px rgba(120, 170, 255, 0.2)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: `${panelWidth}px`,
    width: '100%',
    position: 'absolute', // Use absolute instead of fixed positioning
    // Position the panel relative to the starfield, not the viewport
    left: `${panelX}px`,
    top: `${panelY}px`,
    // Use transform to center the panel 
    transform: isPanelMounted ? 'translate(-50%, -50%)' : 'translate(-50%, -60%)',
    zIndex: 9999,
    opacity: isPanelMounted ? 1 : 0,
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease'
  };
  
  return (
    <div
      ref={panelRef}
      style={panelStyle}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          ...(isFullscreen ? styles.closeButtonFS : styles.closeButtonWindowed),
          ...styles.closeButton,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)',
          transition: 'all 0.2s ease'
        }}
      >
        ✕
      </button>
      
      {/* Info Icon in top right - styled like other info icons */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '50px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setHasBeenClicked(true)}
          className="star-info-icon-button"
          aria-label="Information"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(169, 182, 252, 0.15)',
            border: '1px solid rgba(169, 182, 252, 0.3)',
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(169, 182, 252, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(169, 182, 252, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(169, 182, 252, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(169, 182, 252, 0.3)';
          }}
        >
          <Info size={14} color="#a9b6fc" />
        </button>
      </div>

      {star.post ? (
        // Enhanced thread preview
        <>
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <img 
              src={getAvatarSrc(star.post.id)}
              alt="User avatar"
              style={{ 
                width: "50px", 
                height: "50px", 
                borderRadius: "50%",
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
              }}
            />
            <div>
              <div style={{ 
                fontWeight: "bold", 
                fontSize: '1rem',
                color: '#ffffff' 
              }}>
                {star.post.author || "Anonymous"}
              </div>
              <div style={{ 
                fontSize: "0.8rem", 
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: '4px'
              }}>
                {new Date(star.post.createdUtc * 1000).toLocaleString()}
              </div>
            </div>
          </div>
          
          <h3 style={{
            ...(isFullscreen ? styles.threadPreviewTitleFS : styles.threadPreviewTitleWindowed),
            ...styles.threadPreviewTitle,
            fontSize: isFullscreen ? '1.4rem' : '1.2rem',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            {star.post.title}
          </h3>
          
          {star.post.imageUrl && (
            <div style={{
              marginBottom: '15px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)'
            }}>
              <img 
                src={star.post.imageUrl}
                alt="Post visual"
                style={{
                  ...styles.threadPreviewImage,
                  width: '100%',
                  height: 'auto',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  maxHeight: '180px'
                }}
              />
            </div>
          )}
          
          {/* Post content preview */}
          {star.post.selftext && (
            <div style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '15px',
              lineHeight: '1.4',
              maxHeight: '80px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              position: 'relative'
            }}>
              {star.post.selftext.substring(0, 140)}
              {star.post.selftext.length > 140 && '...'}
              
              {/* Gradient fade for text overflow */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '30px',
                background: 'linear-gradient(to bottom, rgba(20, 30, 50, 0), rgba(20, 30, 50, 1))',
              }}></div>
            </div>
          )}
          
          {/* Interaction stats */}
          <div style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '15px',
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            {/* Volume indicator with larger value - fixed value based on post ID */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(15, 24, 35, 0.7)',
              padding: '6px 12px',
              borderRadius: '12px',
              color: 'white'
            }}>
              <Volume2 size={18} />
              <span style={{ 
                fontWeight: '700', 
                fontSize: '18px',
                color: '#10b981' 
              }}>
                {/* Use a fixed value based on post ID to avoid changing on scroll */}
                {star.post.id ? (parseInt(star.post.id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 3500) + 800 : 2544}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Heart size={18} fill={'none'} />
              <span>
                {/* Fixed value that won't change when scrolling */}
                {star.post.ups || star.post.id ? 
                  (parseInt(star.post.id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 5000) + 500 : 2461}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <MessageCircle size={18} />
              <span>
                {/* Fixed value that won't change when scrolling */}
                {star.post.num_comments || star.post.id ? 
                  (parseInt(star.post.id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 100) + 10 : 10}
              </span>
            </div>
            
            {/* Post type badge - shorter height and correct colors by type */}
            <div style={{
              marginLeft: 'auto',
              backgroundColor: getPostTypeColor(star.post.postType),
              color: isLightColor(getPostTypeColor(star.post.postType)) ? '#000' : '#fff',
              padding: '7px 12px', // Reduced vertical padding to make it shorter
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              lineHeight: '1.2',
              display: 'inline-block',
              textAlign: 'center',
              maxWidth: '100px' // Limit maximum width
            }}>
              {formatPostType(star.post.postType)}
            </div>
          </div>
          
          <button
            onClick={() => onViewThread(star.post)}
            style={{
              ...styles.viewThreadButton,
              backgroundColor: '#4673ff',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              boxShadow: '0 4px 12px rgba(70, 115, 255, 0.3)',
              marginTop: '5px'
            }}
          >
            {star.post.postType === 'groupchat' ? 'Join Group Chat' :
             star.post.postType === 'news' ? 'View News' :
             star.post.postType === 'parameter' ? 'View Parameter Thread' :
             'View Thread'}
          </button>
        </>
      ) : (
        // Star info only (no post data)
        <>
          <div style={{ 
            marginBottom: "1rem", 
            fontWeight: "bold", 
            fontSize: isFullscreen ? "1.5rem" : "1.1rem",
            color: '#ffffff',
            textAlign: 'center'
          }}>
            Star #{star.id}
          </div>
          <div style={{ 
            marginBottom: "1rem", 
            display: "flex", 
            alignItems: "center",
            justifyContent: 'center' 
          }}>
            <div style={{
              width: isFullscreen ? 60 : 40,
              height: isFullscreen ? 60 : 40,
              borderRadius: "50%",
              backgroundColor: star.color,
              marginRight: 12,
              boxShadow: `0 0 20px ${star.color}`,
              animation: 'pulseStar 2s infinite alternate'
            }}></div>
            <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Color: {star.color}</span>
          </div>
          <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)' }}>
            Size: {star.size.toFixed(1)}
          </div>
        </>
      )}
      
      {/* Styles for animations */}
      <style jsx>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulseStar {
          from { opacity: 0.7; transform: scale(1); }
          to { opacity: 1; transform: scale(1.1); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Helper functions for post type colors
function getPostTypeColor(postType) {
  const typeColors = {
    thread: "#1d9bf0",
    news: "#FF9500",
    groupchat: "#FF69B4",
    parameter: "#ADFF2F",
    tweet: "#FFB6C1"
  };
  
  return typeColors[postType] || "#6c757d";
}

function isLightColor(color) {
  // Simple check if color is light (for determining text color)
  return ['#FF9500', '#ADFF2F'].includes(color);
}

function formatPostType(postType) {
  if (!postType) return "Post";
  
  const formattedTypes = {
    thread: "Thread",
    news: "News",
    groupchat: "GroupChat",
    parameter: "Parameter",
    tweet: "Tweet"
  };
  
  return formattedTypes[postType] || postType;
}