// src/components/VerticalRatingsGraph.jsx
import React from "react";

/**
 * Bullet Chart Style Ratings Graph Component
 * 
 * props:
 *   ratings => array of { snippetId, userRating, avgRating, userAvatar }
 *   placeholders => integer (max bars)
 *   isEnlarged => boolean (for modal view)
 */
function VerticalRatingsGraph({ ratings = [], placeholders = 6, isEnlarged = false }) {
  const containerWidth = '100%';

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
      width: containerWidth,
      overflow: "visible",
    }}>
      {/* Header with legend */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: isEnlarged ? "16px" : "10px",
        width: "100%",
      }}>
        <div style={{ 
          display: "flex", 
          gap: isEnlarged ? "20px" : "12px",
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "6px",
          }}>
            <div style={{ 
              width: isEnlarged ? 16 : 12, 
              height: isEnlarged ? 8 : 6, 
              backgroundColor: "#8be0ff",
              borderRadius: "2px",
            }} />
            <span style={{ fontSize: isEnlarged ? "13px" : "11px", color: "#e7e9ea" }}>Your Rating</span>
          </div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "6px" 
          }}>
            <div style={{ 
              width: isEnlarged ? 3 : 2, 
              height: isEnlarged ? 16 : 12, 
              backgroundColor: "#1d9bf0",
              borderRadius: "1px",
            }} />
            <span style={{ fontSize: isEnlarged ? "13px" : "11px", color: "#e7e9ea" }}>Average</span>
          </div>
        </div>
      </div>

      {/* Bullet chart rows */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: isEnlarged ? "12px" : "8px",
      }}>
        {barData.map((item, idx) => {
          if (!item) {
            // Placeholder row
            return (
              <div 
                key={`placeholder-${idx}`} 
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isEnlarged ? "12px" : "8px",
                  padding: isEnlarged ? "8px" : "4px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                {/* Placeholder avatar */}
                <div style={{ 
                  width: isEnlarged ? 36 : 28, 
                  height: isEnlarged ? 36 : 28,
                  borderRadius: "50%", 
                  backgroundColor: "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: isEnlarged ? "14px" : "11px", color: "#71767b" }}>?</span>
                </div>
                
                {/* Placeholder bar */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    position: "relative", 
                    height: isEnlarged ? "24px" : "18px", 
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "linear-gradient(135deg, rgba(255,255,255,0.03), transparent)",
                    }}/>
                  </div>
                </div>
                
                {/* Placeholder values */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center",
                  gap: "6px",
                  minWidth: isEnlarged ? "70px" : "50px",
                }}>
                  <span style={{ color: "#71767b", fontSize: isEnlarged ? "12px" : "10px" }}>--</span>
                </div>
              </div>
            );
          }

          // Real data row
          return (
            <div 
              key={item.snippetId || idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: isEnlarged ? "12px" : "8px",
                padding: isEnlarged ? "10px" : "6px",
                borderRadius: "8px",
                backgroundColor: "rgba(255,255,255,0.02)",
                transition: "all 0.2s ease",
                cursor: "pointer",
                border: "1px solid transparent",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = "rgba(139, 224, 255, 0.08)";
                event.currentTarget.style.border = "1px solid rgba(139, 224, 255, 0.2)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)";
                event.currentTarget.style.border = "1px solid transparent";
              }}
            >
              {/* User avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {item.userAvatar ? (
                  <img 
                    src={item.userAvatar} 
                    alt="avatar"
                    style={{ 
                      width: isEnlarged ? 36 : 28, 
                      height: isEnlarged ? 36 : 28, 
                      borderRadius: "50%", 
                      objectFit: "cover",
                      border: "2px solid rgba(139, 224, 255, 0.5)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      transition: "all 0.2s ease",
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: isEnlarged ? 36 : 28, 
                    height: isEnlarged ? 36 : 28, 
                    borderRadius: "50%", 
                    backgroundColor: "#333",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isEnlarged ? "14px" : "11px",
                    color: "#fff",
                    border: "2px solid rgba(139, 224, 255, 0.5)",
                  }}>
                    ?
                  </div>
                )}
              </div>
              
              {/* Bullet bar container */}
              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ 
                  position: "relative", 
                  height: isEnlarged ? "24px" : "18px", 
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: "4px",
                  overflow: "visible",
                }}>
                  {/* Background gradient zones - subtle performance indicators */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "40%",
                    backgroundColor: "rgba(248, 113, 113, 0.08)",
                    borderRadius: "4px 0 0 4px",
                  }} />
                  <div style={{
                    position: "absolute",
                    left: "40%",
                    top: 0,
                    bottom: 0,
                    width: "30%",
                    backgroundColor: "rgba(251, 191, 36, 0.08)",
                  }} />
                  <div style={{
                    position: "absolute",
                    left: "70%",
                    top: 0,
                    bottom: 0,
                    width: "30%",
                    backgroundColor: "rgba(74, 222, 128, 0.08)",
                    borderRadius: "0 4px 4px 0",
                  }} />
                  
                  {/* Your rating bar */}
                  <div style={{
                    position: "absolute",
                    top: isEnlarged ? "6px" : "5px",
                    left: 0,
                    height: isEnlarged ? "12px" : "8px",
                    width: `${item.userRating || 0}%`,
                    background: "linear-gradient(90deg, #8be0ff, #67d1ff)",
                    borderRadius: "2px",
                    transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 0 6px rgba(139, 224, 255, 0.3)",
                  }}>
                    {/* Shine effect */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "50%",
                      background: "linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0))",
                      borderRadius: "2px 2px 0 0",
                    }}/>
                  </div>
                  
                  {/* Average marker line */}
                  <div style={{
                    position: "absolute",
                    left: `${item.avgRating || 0}%`,
                    top: isEnlarged ? "2px" : "2px",
                    bottom: isEnlarged ? "2px" : "2px",
                    width: isEnlarged ? "3px" : "2px",
                    backgroundColor: "#1d9bf0",
                    transform: "translateX(-50%)",
                    boxShadow: "0 0 4px rgba(29, 155, 240, 0.5)",
                    borderRadius: "1px",
                    zIndex: 2,
                  }} />
                  
                  {/* Scale markers (subtle) */}
                  {isEnlarged && [25, 50, 75].map((mark) => (
                    <div 
                      key={mark}
                      style={{
                        position: "absolute",
                        left: `${mark}%`,
                        top: 0,
                        bottom: 0,
                        width: "1px",
                        backgroundColor: "rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </div>
                
              </div>
              
              {/* Values display - Your Rating and Average side by side */}
              <div style={{ 
                display: "flex", 
                alignItems: "center",
                gap: isEnlarged ? "12px" : "8px",
                minWidth: isEnlarged ? "70px" : "55px",
                justifyContent: "flex-end",
              }}>
                {/* Your rating value */}
                <span style={{ 
                  color: "#8be0ff", 
                  fontSize: isEnlarged ? "15px" : "12px", 
                  fontWeight: "bold",
                  minWidth: isEnlarged ? "28px" : "22px",
                  textAlign: "right",
                }}>
                  {item.userRating || 0}
                </span>
                
                {/* Average value */}
                <span style={{ 
                  color: "#1d9bf0", 
                  fontSize: isEnlarged ? "15px" : "12px", 
                  fontWeight: "bold",
                  minWidth: isEnlarged ? "28px" : "22px",
                  textAlign: "right",
                }}>
                  {item.avgRating || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VerticalRatingsGraph;
