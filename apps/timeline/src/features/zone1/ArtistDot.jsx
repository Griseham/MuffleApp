import { useState } from "react";
import { EXTENDED_TIMELINE_MONTHS } from "../../backend/timelineMockData";
import { BellIcon } from "../Icons";
import { hashString, mulberry32 } from "./seed";

function AnticipatedAlbumArt({ artist, size }) {
  const h = hashString((artist.albumName || "album") + artist.name);
  const rng = mulberry32(h);
  const c1 = artist.color;
  const r2 = Math.floor(rng() * 45 + 10);
  const g2 = Math.floor(rng() * 45 + 10);
  const b2 = Math.floor(rng() * 45 + 10);
  const c2 = `rgb(${r2},${g2},${b2})`;
  const angle = Math.floor(rng() * 360);
  const cx = 20 + rng() * 60;
  const cy = 15 + rng() * 70;
  const hasCircle = rng() > 0.4;
  const hasLine = rng() > 0.5;

  return (
    <div
      className="anticipated-album-art"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 50%, #080808 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${cx}% ${cy}%, rgba(255,255,255,0.1) 0%, transparent 55%)`,
        }}
      />
      {hasCircle && (
        <div
          style={{
            position: "absolute",
            left: `${cx - 18}%`,
            top: `${cy - 18}%`,
            width: "42%",
            height: "42%",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.04)",
            background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
          }}
        />
      )}
      {hasLine && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${40 + rng() * 25}%`,
            height: 1,
            background: `rgba(255,255,255,${(0.03 + rng() * 0.04).toFixed(3)})`,
          }}
        />
      )}
    </div>
  );
}

export default function ArtistDot({
  artist,
  x,
  baselineY,
  activeY,
  artistSize,
  isSelected,
  isHovered,
  zone1Filter,
  showAnticipatedAlbums,
  onClick,
  onHover,
  onLeave,
  onToggleWait,
}) {
  const dotSize = 7;
  const dotLeft = x + artistSize / 2 - dotSize / 2;
  const dotTop = baselineY + artistSize / 2 - dotSize / 2;
  const centerX = x + artistSize / 2;
  const lineLength = Math.abs(activeY - baselineY);
  const showBaseline = zone1Filter !== "yourTimeline";
  const monthLabel = EXTENDED_TIMELINE_MONTHS[artist.releaseMonth];
  const imageStateKey = `${artist.id}-${artist.artworkUrl || ""}`;
  const [failedImageKey, setFailedImageKey] = useState(null);
  const hasArtistImage = Boolean(artist.artworkUrl) && failedImageKey !== imageStateKey;

  // Check if this is an anticipated artist
  const isAnticipated = artist.isAnticipated === true;
  const isWaiting = artist.isWaiting === true;

  // Show album art for anticipated artists when mode is active
  const showAlbumArt = showAnticipatedAlbums && isAnticipated;

  // In anticipated album mode, keep artists pinned to the top row.
  const effectiveY = showAlbumArt ? 14 : activeY;
  const albumSize = 140;
  const nameY = effectiveY + artistSize + 4;
  const albumY = nameY + 18;

  // Determine if tooltip should show below (if artist is near the top)
  const showTooltipBelow = effectiveY < 80;

  // Format waiter count
  const formatWaitersCount = (count) => {
    if (!count) return "0";
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`.replace('.0K', 'K');
    }
    return count.toString();
  };

  const waitButtonLabel = isWaiting ? "Stop waiting" : "Wait for release";
  const waitCountCompact = `${formatWaitersCount(artist.waitersCount)} waiting`;
  const handleWaitClick = (event) => {
    event.stopPropagation();
    onToggleWait?.();
  };

  return (
    <div>
      {/* Baseline dashed line — only in normal timeline mode, not album mode */}
      {!showAlbumArt && showBaseline && lineLength > 0 && (
        <svg
          style={{
            position: "absolute",
            left: centerX - 1,
            top: Math.min(baselineY, activeY) + artistSize / 2,
            width: 2,
            height: lineLength,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <line
            x1="1"
            y1="0"
            x2="1"
            y2={lineLength}
            stroke={artist.color}
            strokeWidth="2"
            strokeDasharray="3 3"
            opacity="0.4"
          />
        </svg>
      )}

      {!showAlbumArt && showBaseline && (
        <div
          className="baseline-dot"
          style={{ left: dotLeft, top: dotTop, width: dotSize, height: dotSize }}
        />
      )}

      {/* Artist circle */}
      <div
        className={`artist-dot ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""} ${isAnticipated ? "anticipated" : ""} ${isWaiting ? "waiting" : ""}`}
        style={{
          left: x,
          top: effectiveY,
          width: artistSize,
          height: artistSize,
          background: `linear-gradient(135deg, ${artist.color} 0%, ${artist.color}bb 100%)`,
          borderColor: isSelected ? "#A4A2A0" : isHovered ? "#554E48" : isAnticipated ? "#6B8E8E" : "#282B29",
          boxShadow: isSelected 
            ? `0 8px 24px ${artist.color}66` 
            : isAnticipated 
              ? "0 0 0 3px rgba(107, 142, 142, 0.25)" 
              : "0 2px 8px rgba(0,0,0,0.4)",
          borderWidth: isWaiting ? "3px" : "2px",
        }}
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        {hasArtistImage ? (
          <img
            src={artist.artworkUrl}
            alt={artist.name}
            className="artist-photo"
            loading="lazy"
            onError={() => setFailedImageKey(imageStateKey)}
          />
        ) : (
          <span className="artist-initials">{artist.initials}</span>
        )}

        {/* Anticipated artist badge — only show when NOT in album art mode */}
        {isAnticipated && !showAlbumArt && (
          <>
            <div className="waiter-badge">
              {formatWaitersCount(artist.waitersCount)}
            </div>
            <div className="future-line" />
          </>
        )}

        {/* Tooltip for anticipated artists */}
        {isHovered && !isSelected && isAnticipated && !showAlbumArt && (
          <div className={`artist-tooltip anticipated-tooltip ${showTooltipBelow ? "tooltip-below" : ""}`}>
            <div className="tooltip-name">{artist.name}</div>
            <div className="tooltip-date-anticipated">{artist.releaseDate}</div>
            <div className="tooltip-waiters-row">
              <div className="mini-avatars">
                <div className="mini-avatar" style={{ background: "#6B8E8E" }}>
                  {isWaiting ? "Y" : "M"}
                </div>
                <div className="mini-avatar" style={{ background: "#8B7355" }}>J</div>
                <div className="mini-avatar" style={{ background: "#7B6B8E" }}>K</div>
                <div className="mini-avatar" style={{ background: "#8E6B7A" }}>+</div>
              </div>
              <div className="waiters-text">
                <strong>{(artist.waitersCount || 0).toLocaleString()}</strong> waiting
              </div>
            </div>
            <button
              type="button"
              className="tooltip-cta" 
              onClick={handleWaitClick}
            >
              {isWaiting ? "✓ You're waiting" : "→ Wait for this"}
            </button>
          </div>
        )}

        {/* Regular tooltip for past artists */}
        {isHovered && !isSelected && !isAnticipated && (
          <div className={`artist-tooltip ${showTooltipBelow ? "tooltip-below" : ""}`}>
            <div className="tooltip-name">{artist.name}</div>
            <div className="tooltip-date">
              {monthLabel?.fullName} {artist.releaseDay}
            </div>
          </div>
        )}
      </div>

      {/* Name label */}
      <div
        className={`artist-name-label ${isSelected ? "selected" : ""}`}
        style={{ left: centerX, top: nameY }}
      >
        {artist.name}
      </div>

      {isAnticipated && (
        <button
          type="button"
          className={`wait-toggle-icon-button artist-wait-bell ${isWaiting ? "is-active" : ""}`}
          style={{ left: x + artistSize - 2, top: effectiveY - 6 }}
          aria-label={waitButtonLabel}
          title={waitButtonLabel}
          onClick={handleWaitClick}
        >
          <BellIcon checked={isWaiting} />
        </button>
      )}

      {/* Album art — shown below name for anticipated artists in album mode */}
      {showAlbumArt && (
        <div
          className={`anticipated-album-wrapper ${isHovered ? "hovered" : ""}`}
          style={{
            position: "absolute",
            left: centerX - albumSize / 2,
            top: albumY,
            zIndex: 8,
          }}
        >
          <AnticipatedAlbumArt artist={artist} size={albumSize} />
          <div className="anticipated-album-actions">
            <span className="anticipated-count-pill">{waitCountCompact}</span>
          </div>
          <div className="anticipated-album-name">
            {artist.albumName || "Untitled"}
          </div>
        </div>
      )}
    </div>
  );
}
