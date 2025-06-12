// ScatterRatingsGraph.jsx
import React, { useState } from "react";

export default function ScatterRatingsGraph({ scatter = [], isEnlarged = false }) {
  // Define the graph dimensions - larger when in modal
  const width = isEnlarged ? 500 : 280;
  const height = isEnlarged ? 320 : 180;
  const padding = { 
    top: isEnlarged ? 30 : 20, 
    right: isEnlarged ? 40 : 30, 
    bottom: isEnlarged ? 40 : 30, 
    left: isEnlarged ? 40 : 30 
  };
  
  // Track hover state for data points
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Clamp value to min-max range
  function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
  }

  // Get the maximum rating count from data or use default
  const maxRatingCount = Math.max(...scatter.map((item) => item?.ratingCount || 0), 1000);

  // Scale x value (rating count) to pixel position
  function scaleX(count) {
    // Use a more appropriate range that matches comment card ratings (200-1000)
    const value = clamp(count || 0, 0, maxRatingCount);
    return (value / maxRatingCount) * innerWidth + padding.left;
  }

  // Scale y value (average rating) to pixel position
  function scaleY(avg) {
    const fraction = clamp((avg || 0) / 100, 0, 1);
    // Invert for SVG coordinates (top is 0)
    return (1 - fraction) * innerHeight + padding.top;
  }

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Now we **directly** use all scatter data, no placeholders
  const dataPoints = scatter;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      }}
    >
      {/* Add animation keyframes */}
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.7;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.8);
              opacity: 0.3;
            }
            100% {
              transform: translate(-50%, -50%) scale(2.2);
              opacity: 0;
            }
          }
        `}
      </style>
      
      {/* Background grid with gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.03), transparent 75%)",
        }}
      />

      {/* Axes and grid lines */}
      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
          <line
            key={`hgrid-${i}`}
            x1={padding.left}
            y1={padding.top + innerHeight * fraction}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight * fraction}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Vertical grid lines */}
{/* Vertical grid lines */}
{[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
          <line
            key={`vgrid-${i}`}
            x1={padding.left + innerWidth * fraction}
            y1={padding.top}
            x2={padding.left + innerWidth * fraction}
            y2={padding.top + innerHeight}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* X axis */}
        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={padding.left + innerWidth}
          y2={padding.top + innerHeight}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
        />

        {/* Y axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerHeight}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
        />

        {/* X axis ticks and labels - more detailed when enlarged */}
        {(isEnlarged ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1]).map((fraction, i) => {
          const tickValue = Math.round(maxRatingCount * fraction);
          return (
            <g key={`xtick-${i}`}>
              <line
                x1={padding.left + innerWidth * fraction}
                y1={padding.top + innerHeight}
                x2={padding.left + innerWidth * fraction}
                y2={padding.top + innerHeight + 5}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
              />
              <text
                x={padding.left + innerWidth * fraction}
                y={padding.top + innerHeight + (isEnlarged ? 20 : 15)}
                textAnchor="middle"
                fill="#aaa"
                fontSize={isEnlarged ? "12px" : "9px"}
              >
                {tickValue}
              </text>
            </g>
          );
        })}

        {/* Y axis ticks and labels - more detailed when enlarged */}
        {(isEnlarged ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1]).map((fraction, i) => {
          const tickValue = Math.round(100 * fraction);
          return (
            <g key={`ytick-${i}`}>
              <line
                x1={padding.left - 5}
                y1={padding.top + innerHeight * (1 - fraction)}
                x2={padding.left}
                y2={padding.top + innerHeight * (1 - fraction)}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
              />
              <text
                x={padding.left - (isEnlarged ? 10 : 8)}
                y={padding.top + innerHeight * (1 - fraction) + 3}
                textAnchor="end"
                fill="#aaa"
                fontSize={isEnlarged ? "12px" : "9px"}
              >
                {tickValue}
              </text>
            </g>
          );
        })}

        {/* Axis labels - enhanced in enlarged view */}
        <text
          x={padding.left + innerWidth / 2}
          y={height - (isEnlarged ? 15 : 5)}
          textAnchor="middle"
          fill="#fff"
          fontSize={isEnlarged ? "14px" : "9px"}
          fontWeight={isEnlarged ? "bold" : "normal"}
        >
          Number of Ratings
        </text>

        <text
          x={isEnlarged ? 15 : 10}
          y={padding.top + innerHeight / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={isEnlarged ? "14px" : "9px"}
          fontWeight={isEnlarged ? "bold" : "normal"}
          transform={`rotate(-90, ${isEnlarged ? 15 : 10}, ${padding.top + innerHeight / 2})`}
        >
          Rating Value
        </text>
      </svg>

      {/* Data points with enhanced interactivity */}
      {dataPoints.map((point, idx) => {
        const xPos = scaleX(point.ratingCount);
        const yPos = scaleY(point.average);
        const isHovered = hoveredPoint === idx;

        return (
          <div
            key={`point-${idx}`}
            style={{
              position: "absolute",
              left: `${xPos}px`,
              top: `${yPos}px`,
              transform: `translate(-50%, -50%) ${isHovered && isEnlarged ? 'scale(1.2)' : 'scale(1)'}`,
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              zIndex: isHovered ? 10 : 5,
            }}
            onMouseEnter={() => setHoveredPoint(idx)}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Enhanced pulse animation for hovered points */}
            {isHovered && isEnlarged && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(139, 224, 255, 0.4)",
                  animation: "pulse 1.5s infinite",
                  zIndex: -1,
                }}
              />
            )}
            
            {/* User avatar */}
            <div style={{ position: "relative" }}>
              {/* Glow effect behind avatar when hovered */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  boxShadow: isHovered && isEnlarged
                    ? "0 0 12px rgba(139, 224, 255, 0.7)"
                    : "0 0 8px rgba(0,0,0,0.5)",
                  zIndex: -1,
                  transition: "box-shadow 0.3s ease",
                }}
              />
              <img
                src={point.userAvatar}
                alt="User avatar"
                style={{
                  width: isEnlarged ? "36px" : "26px",
                  height: isEnlarged ? "36px" : "26px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  boxShadow: isEnlarged 
                    ? "0 3px 8px rgba(0,0,0,0.5)" 
                    : "0 2px 4px rgba(0,0,0,0.3)",
                  border: isHovered && isEnlarged 
                    ? "2px solid rgba(139, 224, 255, 0.7)" 
                    : isEnlarged 
                      ? "2px solid rgba(255,255,255,0.2)"
                      : "none",
                  transition: "all 0.3s ease",
                }}
              />
            </div>

            {/* Enhanced tooltip - more detailed in enlarged view */}
            {(isHovered || !isEnlarged) && (
              <div
                style={{
                  position: "absolute",
                  top: isEnlarged ? "-50px" : "-18px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: isEnlarged ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.7)",
                  color: "#fff",
                  fontSize: isEnlarged ? "12px" : "9px",
                  padding: isEnlarged ? "6px 10px" : "2px 5px",
                  borderRadius: isEnlarged ? "6px" : "3px",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  boxShadow: isEnlarged 
                    ? "0 4px 12px rgba(0,0,0,0.5)" 
                    : "0 1px 3px rgba(0,0,0,0.3)",
                  border: isEnlarged 
                    ? "1px solid rgba(255,255,255,0.15)" 
                    : "none",
                  transition: "all 0.3s ease",
                  zIndex: isHovered ? 11 : 6,
                  backdropFilter: isEnlarged ? "blur(4px)" : "none",
                  width: isHovered && isEnlarged ? "auto" : "auto",
                  maxWidth: isHovered && isEnlarged ? "200px" : "none",
                }}
              >
                {isHovered && isEnlarged ? (
                  <div style={{ padding: "2px" }}>
                    <div style={{ 
                      fontWeight: "bold", 
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      paddingBottom: "4px",
                      marginBottom: "4px", 
                      color: "#8be0ff"
                    }}>
                      User Stats
                    </div>
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column",
                      gap: "4px", 
                      fontSize: "11px",
                      textAlign: "left"
                    }}>
                      <div>
                        <span style={{ color: "#aaa" }}>Rating: </span>
                        <span style={{ color: "#fff", fontWeight: "bold" }}>{point.average}</span>
                      </div>
                      <div>
                        <span style={{ color: "#aaa" }}>Count: </span>
                        <span style={{ color: "#fff", fontWeight: "bold" }}>{point.ratingCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  isEnlarged 
                    ? `Rating: ${point.average || 0} | Count: ${point.ratingCount || 0}` 
                    : (point.average || 0)
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}