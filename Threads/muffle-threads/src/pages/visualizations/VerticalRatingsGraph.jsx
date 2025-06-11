// src/components/VerticalRatingsGraph.jsx
import React, { useState } from "react";

/**
 * Enhanced Vertical Ratings Graph Component with improved bar style
 * 
 * props:
 *   ratings => array of { snippetId, userRating, avgRating, userAvatar }
 *   placeholders => integer (max bars)
 */
export default function VerticalRatingsGraph({ ratings = [], placeholders = 6, isEnlarged = false }) {
  // Set a fixed size to ensure visibility - larger when in modal
  const maxHeight = isEnlarged ? 200 : 100; // Height for the bars
  const containerWidth = '100%';
  
  // For enlarged view, add hover state tracking
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  
  // Clamp rating to 0..100 range
  function clamp(val) {
    return Math.max(0, Math.min(100, val || 0));
  }
  
  // Scale rating to pixel height
  function scale(val) {
    return (clamp(val) / 100) * maxHeight;
  }

  // Build array with the correct number of placeholders
  const barData = [];
  for (let i = 0; i < placeholders; i++) {
    if (i < ratings.length) {
      barData.push(ratings[i]);
    } else {
      barData.push(null); // placeholder
    }
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
      width: containerWidth,
      overflow: "visible",
    }}>
      {/* Color legend */}
      <div style={{ 
        display: "flex", 
        gap: "1.5rem", 
        marginBottom: "0.25rem",
        justifyContent: "center",
        width: "100%",
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.5rem",
        }}>
          <div style={{ 
            width: 12, 
            height: 12, 
            backgroundColor: "#8be0ff",
            borderRadius: "2px",
          }} />
          <span style={{ fontSize: "12px", color: "#e7e9ea" }}>You</span>
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.5rem" 
        }}>
          <div style={{ 
            width: 12, 
            height: 12, 
            backgroundColor: "#1d9bf0",
            borderRadius: "2px",
          }} />
          <span style={{ fontSize: "12px", color: "#e7e9ea" }}>Average</span>
        </div>
      </div>

      {/* The bars row */}
      <div style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-end",
        height: `${maxHeight + 35}px`, // Height + space for avatar
        width: "100%",
        justifyContent: "center",
        overflow: "visible",
      }}>
        {barData.map((item, idx) => {
          if (!item) {
            // Placeholder - empty grey bar
            return (
              <div key={`placeholder-${idx}`} style={{ 
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
              }}>
                <div style={{
                  width: "24px",
                  height: `${maxHeight}px`,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Add subtle gradient overlay */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "linear-gradient(135deg, rgba(255,255,255,0.05), transparent)",
                  }}/>
                </div>
                <div style={{ 
                  marginTop: "6px", 
                  width: "28px", 
                  height: "28px",
                  borderRadius: "50%", 
                  backgroundColor: "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div style={{
                    fontSize: "12px",
                    color: "#71767b",
                  }}>
                    ?
                  </div>
                </div>
              </div>
            );
          }

          // Real data bars
          const userH = scale(item.userRating || 0);
          const avgH = scale(item.avgRating || 0);
          
          return (
            <div 
              key={item.snippetId || idx} 
              style={{ 
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
                position: "relative",
              }}
              onMouseEnter={() => isEnlarged && setHoveredBarIndex(idx)}
              onMouseLeave={() => isEnlarged && setHoveredBarIndex(null)}
            >
              {/* Detailed tooltip for enlarged view on hover */}
              {isEnlarged && hoveredBarIndex === idx && (
                <div style={{
                  position: "absolute",
                  bottom: `${maxHeight + 40}px`,
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.85)",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  zIndex: 10,
                  width: "150px",
                  pointerEvents: "none",
                  fontSize: "12px",
                  textAlign: "left",
                }}>
                  <div style={{ 
                    marginBottom: "6px", 
                    fontWeight: "bold",
                    fontSize: "14px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    paddingBottom: "4px",
                  }}>
                    Rating Details
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}>
                    <span>Your rating:</span>
                    <span style={{ color: "#8be0ff", fontWeight: "bold" }}>{item.userRating || 0}</span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}>
                    <span>Avg rating:</span>
                    <span style={{ color: "#1d9bf0", fontWeight: "bold" }}>{item.avgRating || 0}</span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                  }}>
                    <span>Difference:</span>
                    <span style={{ 
                      color: (item.userRating || 0) > (item.avgRating || 0) ? "#4ade80" : "#f87171",
                      fontWeight: "bold" 
                    }}>
                      {((item.userRating || 0) - (item.avgRating || 0)).toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* New sleeker bar design with glass effect */}
              <div style={{
                position: "relative",
                width: isEnlarged ? "32px" : "24px",
                height: `${maxHeight}px`,
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                borderRadius: "6px",
                overflow: "hidden",
                boxShadow: hoveredBarIndex === idx && isEnlarged
                  ? "0 0 12px rgba(139, 224, 255, 0.5)"
                  : "0 2px 6px rgba(0,0,0,0.2)",
                border: hoveredBarIndex === idx && isEnlarged
                  ? "1px solid rgba(139, 224, 255, 0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.2s ease",
                transform: hoveredBarIndex === idx && isEnlarged
                  ? "translateY(-2px) scale(1.05)"
                  : "translateY(0) scale(1)",
              }}>
                {/* User rating value - positioned above bar */}
                {userH > 0 && (
  <div style={{
    position: "absolute",
    top: 2,
    left: 0,
    width: "12px", // Match width of left bar
    textAlign: "center",
    fontSize: "7px",
    color: "#8be0ff", // Match bar color
    fontWeight: "bold",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
    zIndex: 3,
  }}>
    {Math.round(item.userRating || 0)}
  </div>
)}

{avgH > 0 && (
  <div style={{
    position: "absolute",
    top: 2,
    right: 0,
    width: "12px", // Match width of right bar
    textAlign: "center",
    fontSize: "7px",
    color: "#1d9bf0", // Match bar color
    fontWeight: "bold",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
    zIndex: 3,
  }}>
    {Math.round(item.avgRating || 0)}
  </div>
)}
   
              
                {/* User rating bar - left side with glass effect */}
                <div style={{
                  position: "absolute",
                  bottom: 0, 
                  left: 0,
                  width: "12px",
                  height: `${userH}px`,
                  background: "linear-gradient(to right, #8be0ff, #67d1ff)",
                  borderTopLeftRadius: userH === maxHeight ? "6px" : "0",
                  transition: "height 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3)",
                  overflow: "hidden",
                }}>
                  {/* Shine effect */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "40%",
                    background: "linear-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0))",
                  }}/>
                </div>
                
                {/* Average rating bar - right side with glass effect */}
                <div style={{
                  position: "absolute",
                  bottom: 0, 
                  right: 0,
                  width: "12px",
                  height: `${avgH}px`,
                  background: "linear-gradient(to right, #1a88da, #1d9bf0)",
                  borderTopRightRadius: avgH === maxHeight ? "6px" : "0",
                  transition: "height 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2)",
                  overflow: "hidden",
                }}>
               {/* Shine effect */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "40%",
                    background: "linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0))",
                  }}/>
                </div>
                
                {/* Tick marks for scale reference */}
                <div style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "25%",
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}/>
                <div style={{
                  position: "absolute", 
                  left: 0,
                  right: 0,
                  top: "50%",
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}/>
                <div style={{
                  position: "absolute",
                  left: 0, 
                  right: 0,
                  top: "75%", 
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}/>
              </div>
              
              {/* User avatar below the bar - enhanced for enlarged view */}
              <div style={{ 
                marginTop: "8px",
                transition: "transform 0.2s ease",
                transform: hoveredBarIndex === idx && isEnlarged ? "scale(1.2)" : "scale(1)",
              }}>
                {item.userAvatar ? (
                  <img
                    src={item.userAvatar}
                    alt="User"
                    style={{ 
                      width: isEnlarged ? "36px" : "28px", 
                      height: isEnlarged ? "36px" : "28px", 
                      borderRadius: "50%", 
                      objectFit: "cover",
                      boxShadow: hoveredBarIndex === idx && isEnlarged
                        ? "0 0 12px rgba(139, 224, 255, 0.5)"
                        : "0 2px 4px rgba(0,0,0,0.2)",
                      border: isEnlarged 
                        ? "2px solid rgba(255,255,255,0.2)" 
                        : "1px solid rgba(255,255,255,0.1)",
                      transition: "all 0.2s ease",
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: isEnlarged ? "36px" : "28px", 
                    height: isEnlarged ? "36px" : "28px", 
                    borderRadius: "50%", 
                    backgroundColor: "#333",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isEnlarged ? "14px" : "12px",
                    color: "#fff",
                    boxShadow: hoveredBarIndex === idx && isEnlarged
                      ? "0 0 12px rgba(139, 224, 255, 0.5)"
                      : "0 2px 4px rgba(0,0,0,0.2)",
                    border: isEnlarged 
                      ? "2px solid rgba(255,255,255,0.2)" 
                      : "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.2s ease",
                  }}>
                    ?
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}