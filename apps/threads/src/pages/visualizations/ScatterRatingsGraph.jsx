// ScatterRatingsGraph.jsx
import React, { useMemo, useState } from "react";

export default function ScatterRatingsGraph({ scatter = [], isEnlarged = false }) {
  const [hoveredUser, setHoveredUser] = useState(null);

  // Dimensions based on enlarged state
  const width = isEnlarged ? 500 : 280;
  const height = isEnlarged ? 320 : 220;

  // Get the maximum rating count from data
  const maxRatings = Math.max(...scatter.map((item) => item?.ratingCount || 0), 100);
  const positionedScatter = useMemo(() => {
    const placed = [];

    return scatter.map((user, idx) => {
      let x = ((user.ratingCount || 0) / maxRatings) * 100;
      let y = 100 - (user.average || 0);
      let attempts = 0;

      while (
        placed.some((point) => Math.abs(point.x - x) < 3.2 && Math.abs(point.y - y) < 4.5) &&
        attempts < 20
      ) {
        const ring = Math.floor(attempts / 6) + 1;
        const angleDeg = ((attempts * 59) + (idx * 23)) % 360;
        const angleRad = (angleDeg * Math.PI) / 180;
        x = x + (Math.cos(angleRad) * (1.8 * ring));
        y = y + (Math.sin(angleRad) * (2.2 * ring));
        x = Math.max(1, Math.min(99, x));
        y = Math.max(1, Math.min(99, y));
        attempts += 1;
      }

      placed.push({ x, y });
      return {
        ...user,
        _plotX: x,
        _plotY: y,
      };
    });
  }, [scatter, maxRatings]);

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        padding: isEnlarged ? "20px" : "16px",
        position: "relative",
        boxSizing: "border-box",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Chart area */}
      <div
        style={{
          position: "relative",
          height: isEnlarged ? "calc(100% - 50px)" : "calc(100% - 40px)",
          marginLeft: isEnlarged ? "35px" : "30px",
          marginBottom: isEnlarged ? "25px" : "20px",
          borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Y-axis labels */}
        {(isEnlarged ? [0, 25, 50, 75, 100] : [0, 50, 100]).map((val) => (
          <div
            key={`y-${val}`}
            style={{
              position: "absolute",
              left: isEnlarged ? "-30px" : "-26px",
              top: `${100 - val}%`,
              transform: "translateY(-50%)",
              fontSize: isEnlarged ? "11px" : "10px",
              color: "#64748b",
            }}
          >
            {val}
          </div>
        ))}

        {/* X-axis labels */}
        {(isEnlarged ? [0, 25, 50, 75, 100] : [0, 50, 100]).map((val) => (
          <div
            key={`x-${val}`}
            style={{
              position: "absolute",
              bottom: isEnlarged ? "-20px" : "-18px",
              left: `${val}%`,
              transform: "translateX(-50%)",
              fontSize: isEnlarged ? "11px" : "10px",
              color: "#64748b",
            }}
          >
            {Math.round((val * maxRatings) / 100)}
          </div>
        ))}

        {/* Horizontal grid lines */}
        {[25, 50, 75].map((y) => (
          <div
            key={`hgrid-${y}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${100 - y}%`,
              height: "1px",
              background: "rgba(255, 255, 255, 0.04)",
            }}
          />
        ))}

        {/* Vertical grid lines */}
        {[25, 50, 75].map((x) => (
          <div
            key={`vgrid-${x}`}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: 0,
              bottom: 0,
              width: "1px",
              background: "rgba(255, 255, 255, 0.04)",
            }}
          />
        ))}

        {/* Data points */}
        {positionedScatter.map((user, idx) => {
          const isHovered = hoveredUser === idx;
          const size = isEnlarged ? 32 : 26;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredUser(idx)}
              onMouseLeave={() => setHoveredUser(null)}
              style={{
                position: "absolute",
                left: `${user._plotX}%`,
                top: `${user._plotY}%`,
                transform: "translate(-50%, -50%)",
                cursor: "pointer",
                zIndex: isHovered ? 10 : 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
              }}
            >
              {/* Avatar or circle */}
              {user.userAvatar ? (
                <img
                  src={user.userAvatar}
                  alt={user.username || "User"}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: isHovered
                      ? "2px solid #8b5cf6"
                      : "2px solid rgba(139, 92, 246, 0.3)",
                    boxShadow: isHovered
                      ? "0 0 12px rgba(139, 92, 246, 0.5)"
                      : "0 2px 6px rgba(0, 0, 0, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: "50%",
                    background: isHovered
                      ? "rgba(139, 92, 246, 0.3)"
                      : "rgba(255, 255, 255, 0.08)",
                    border: isHovered
                      ? "2px solid #8b5cf6"
                      : "1px solid rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isHovered ? "#a78bfa" : "#fff",
                    fontSize: isEnlarged ? "13px" : "11px",
                    fontWeight: "500",
                    boxShadow: isHovered
                      ? "0 0 12px rgba(139, 92, 246, 0.5)"
                      : "0 2px 6px rgba(0, 0, 0, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {user.username ? user.username.charAt(0).toUpperCase() : "?"}
                </div>
              )}

              {/* Username label */}
              <span
                style={{
                  fontSize: isEnlarged ? "10px" : "9px",
                  color: isHovered ? "#a78bfa" : "#64748b",
                  fontWeight: isHovered ? "600" : "400",
                  maxWidth: isEnlarged ? "60px" : "50px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
              >
                {user.username || "User"}
              </span>

              {/* Tooltip on hover */}
              {isHovered && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderRadius: isEnlarged ? "10px" : "8px",
                    padding: isEnlarged ? "10px 14px" : "8px 12px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    zIndex: 20,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#fff",
                      marginBottom: "6px",
                      fontSize: isEnlarged ? "13px" : "11px",
                    }}
                  >
                    {user.username || "User"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: isEnlarged ? "12px" : "10px",
                      fontSize: isEnlarged ? "12px" : "10px",
                    }}
                  >
                    <span style={{ color: "#a78bfa" }}>
                      {user.ratingCount || 0} ratings
                    </span>
                    <span style={{ color: "#64748b" }}>
                      avg {user.average || 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X-axis label */}
      <div
        style={{
          position: "absolute",
          bottom: isEnlarged ? "6px" : "4px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: isEnlarged ? "11px" : "10px",
          color: "#64748b",
          fontWeight: "500",
        }}
      >
        Number of Ratings
      </div>

      {/* Y-axis label */}
      <div
        style={{
          position: "absolute",
          left: isEnlarged ? "6px" : "4px",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          fontSize: isEnlarged ? "11px" : "10px",
          color: "#64748b",
          fontWeight: "500",
          whiteSpace: "nowrap",
        }}
      >
        Rating Value
      </div>
    </div>
  );
}
