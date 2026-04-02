import { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { DEFAULT_AVATAR_SRC, getAvatarSrcFromNumber } from "./avatarAssets";

const CARD_WIDTH = 300;
const DEFAULT_GENRES = [
  { name: "Rock", percent: 35, color: "#f56c42" },
  { name: "Pop", percent: 25, color: "#1db954" },
  { name: "Hip-Hop", percent: 15, color: "#3b82f6" },
  { name: "Other", percent: 25, color: "#9ca3af" },
];
const JOIN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function hashStringToInt(value) {
  let hash = 2166136261;
  const text = String(value ?? "");

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function normalizeAvatarSource(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const isRelativePath =
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../");

  if (isRelativePath) {
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      if (typeof window !== "undefined" && url.origin === window.location.origin) {
        return trimmed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function getAvatarForUser(user) {
  const directAvatar = normalizeAvatarSource(user?.avatar);
  if (directAvatar) return directAvatar;

  const derivedAvatar = normalizeAvatarSource(user?.__avatarSrc);
  if (derivedAvatar) return derivedAvatar;

  const seed = user?.id ?? user?.name ?? user?.username ?? "user";
  const avatarNumber = (hashStringToInt(seed) % 999) + 1;
  return getAvatarSrcFromNumber(avatarNumber);
}

function deriveCreatedAt(seed) {
  const month = JOIN_MONTHS[seed % JOIN_MONTHS.length];
  const year = 2018 + (seed % 8);
  return `${month} ${year}`;
}

function buildGenreRows(user, userData, seed) {
  if (Array.isArray(userData?.genres) && userData.genres.length > 0) {
    return userData.genres;
  }

  const genrePoints = user?.__stats?.genrePoints;
  if (genrePoints && typeof genrePoints === "object") {
    const entries = Object.entries(genrePoints)
      .filter(([, value]) => Number.isFinite(value) && value > 0)
      .sort((a, b) => b[1] - a[1]);

    if (entries.length > 0) {
      const topEntries = entries.slice(0, 4);
      const total = topEntries.reduce((sum, [, value]) => sum + value, 0) || 1;
      const palette = ["#1db954", "#3b82f6", "#f56c42", "#9ca3af"];

      return topEntries.map(([name, value], index) => ({
        name,
        percent: Math.max(5, Math.round((value / total) * 100)),
        color: palette[index] || "#9ca3af",
      }));
    }
  }

  return DEFAULT_GENRES.map((genre, index) => {
    const variance = ((seed >> (index * 3)) % 11) - 5;
    return {
      ...genre,
      percent: clamp(genre.percent + variance, 8, 52),
    };
  });
}

function buildTimelineUserCardData(user, userData = {}) {
  const displayName = userData.displayName || user?.displayName || user?.name || user?.username || "User";
  const seed = hashStringToInt(displayName || user?.id || "user");
  const stats = user?.__stats || {};
  const followersBase = typeof stats.albumsRatedCount === "number" ? stats.albumsRatedCount * 11 : 400 + (seed % 3200);
  const followers = userData.followers ?? followersBase;
  const following = userData.following ?? (90 + (seed % 650));
  const discoveryPercent =
    userData.discoveryPercent ??
    clamp(
      typeof stats.albumsRatedCount === "number"
        ? Math.round((stats.albumsRatedCount / 650) * 100)
        : 10 + (seed % 72),
      4,
      99
    );

  return {
    displayName,
    verified: userData.verified ?? Boolean(user?.isYou || user?.isPinnedFriend),
    createdAt: userData.createdAt || deriveCreatedAt(seed),
    following,
    followers,
    discoveryPercent,
    avatar: normalizeAvatarSource(userData.avatar) || getAvatarForUser(user),
    genres: buildGenreRows(user, userData, seed),
  };
}

const UserHoverCard = ({ user, userData, className = "" }) => {
  const [genresExpanded, setGenresExpanded] = useState(false);
  const cardData = buildTimelineUserCardData(user, userData);

  return (
    <div className={`uhcCard ${className}`}>
      <div className="uhcInner">
        <div className="uhcHeader">
          <div className="uhcAvatarWrap">
            <img
              src={cardData.avatar}
              alt={cardData.displayName}
              className="uhcAvatar"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (DEFAULT_AVATAR_SRC) {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_AVATAR_SRC;
                }
              }}
            />
          </div>

          <div className="uhcIdentity">
            <div className="uhcNameRow">
              <h3 className="uhcName">{cardData.displayName}</h3>
              {cardData.verified && (
                <svg
                  className="uhcVerified"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-label="Verified"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
            <div className="uhcMeta">Joined {cardData.createdAt}</div>
          </div>
        </div>

        <div className="uhcSection">
          <button
            type="button"
            className="uhcDiscoveryButton"
            onClick={() => setGenresExpanded((value) => !value)}
          >
            <span className="uhcDiscoveryText">
              Discovered {cardData.discoveryPercent}% of music
            </span>
            <svg
              className={`uhcCaret ${genresExpanded ? "isOpen" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {genresExpanded && (
            <div className="uhcGenresPanel">
              {cardData.genres.map((genre, index) => (
                <div key={`${genre.name}-${index}`} className="uhcGenreRow">
                  <div className="uhcGenreTop">
                    <span>{genre.name}</span>
                    <span className="uhcGenrePercent">{genre.percent}%</span>
                  </div>
                  <div className="uhcGenreTrack">
                    <div
                      className="uhcGenreFill"
                      style={{
                        width: `${genre.percent}%`,
                        backgroundColor: genre.color || "#9ca3af",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="uhcFooter">
          <div className="uhcCountBlock">
            <span className="uhcCountValue">{cardData.following.toLocaleString()}</span>
            <span className="uhcCountLabel">Following</span>
          </div>
          <div className="uhcCountBlock">
            <span className="uhcCountValue">{cardData.followers.toLocaleString()}</span>
            <span className="uhcCountLabel">Followers</span>
          </div>
          <button className="uhcFollowButton" type="button">
            Follow
          </button>
        </div>
      </div>

      <style>{`
        .uhcCard {
          width: ${CARD_WIDTH}px;
          background: rgba(18, 22, 28, 0.96);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          color: #ffffff;
          overflow: hidden;
          transform: translateY(4px) scale(0.98);
          animation: uhcEnter 160ms ease-out forwards;
          font-family: inherit;
          font-size: var(--overlay-font-size-sm);
        }

        .uhcInner {
          padding: 14px;
        }

        .uhcHeader {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .uhcAvatarWrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          background: #121821;
          border: 2px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .uhcAvatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .uhcIdentity {
          margin-left: 10px;
          min-width: 0;
        }

        .uhcNameRow {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .uhcName {
          margin: 0;
          font-size: var(--overlay-font-size-md);
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .uhcVerified {
          width: 14px;
          height: 14px;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .uhcMeta {
          margin-top: 2px;
          font-size: var(--overlay-font-size-xs);
          color: #9ca3af;
        }

        .uhcSection {
          margin-bottom: 12px;
        }

        .uhcDiscoveryButton {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          background: rgba(17, 24, 39, 0.8);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 10px;
          cursor: pointer;
          transition: background 140ms ease, border-color 140ms ease;
          font-family: inherit;
        }

        .uhcDiscoveryButton:hover {
          background: rgba(31, 41, 55, 0.92);
          border-color: rgba(255, 255, 255, 0.14);
        }

        .uhcDiscoveryText {
          font-size: var(--overlay-font-size-sm);
          font-weight: 600;
          text-align: left;
        }

        .uhcCaret {
          width: 16px;
          height: 16px;
          color: #ffffff;
          flex-shrink: 0;
          transition: transform 140ms ease;
        }

        .uhcCaret.isOpen {
          transform: rotate(180deg);
        }

        .uhcGenresPanel {
          margin-top: 8px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(17, 24, 39, 0.42);
          padding: 10px;
          animation: uhcFadeIn 160ms ease-out;
        }

        .uhcGenreRow {
          margin-bottom: 9px;
        }

        .uhcGenreRow:last-child {
          margin-bottom: 0;
        }

        .uhcGenreTop {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: var(--overlay-font-size-xs);
        }

        .uhcGenrePercent {
          color: #9ca3af;
        }

        .uhcGenreTrack {
          height: 4px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          overflow: hidden;
        }

        .uhcGenreFill {
          height: 100%;
          border-radius: 999px;
        }

        .uhcFooter {
          border-top: 1px solid rgba(255, 255, 255, 0.09);
          padding-top: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .uhcCountBlock {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .uhcCountValue {
          font-size: var(--overlay-font-size-md);
          font-weight: 700;
          line-height: 1;
          color: #ffffff;
          font-variant-numeric: tabular-nums;
        }

        .uhcCountLabel {
          font-size: var(--overlay-font-size-xs);
          color: #9ca3af;
          line-height: 1;
        }

        .uhcFollowButton {
          margin-left: auto;
          border-radius: 999px;
          border: none;
          background: #ffffff;
          color: #0f172a;
          font-size: var(--overlay-font-size-sm);
          font-weight: 700;
          cursor: pointer;
          padding: 7px 14px;
          transition: background 140ms ease;
          font-family: inherit;
        }

        .uhcFollowButton:hover {
          background: #e5e7eb;
        }

        @keyframes uhcEnter {
          to {
            transform: translateY(0) scale(1);
          }
        }

        @keyframes uhcFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export const UserHoverTarget = ({
  user,
  userData,
  children,
  className = "",
  style,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 });
  const targetRef = useRef(null);
  const hideTimer = useRef(null);

  const updateCardPosition = useCallback(() => {
    if (!targetRef.current) return;

    const rect = targetRef.current.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 8;
    const left = clamp(rect.left + window.scrollX, 16, window.scrollX + window.innerWidth - CARD_WIDTH - 16);
    setCardPos({ top, left });
  }, []);

  const showCard = useCallback(() => {
    if (disabled) return;
    updateCardPosition();
    clearTimeout(hideTimer.current);
    setVisible(true);
  }, [disabled, updateCardPosition]);

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), 150);
  }, []);

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  useEffect(() => {
    if (!visible) return undefined;

    const handleWindowChange = () => updateCardPosition();
    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);

    return () => {
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [visible, updateCardPosition]);

  return (
    <>
      <div
        ref={targetRef}
        className={className}
        style={style}
        onMouseEnter={showCard}
        onMouseLeave={scheduleHide}
        onFocus={showCard}
        onBlur={scheduleHide}
      >
        {children}
      </div>

      {visible &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "absolute",
              top: cardPos.top,
              left: cardPos.left,
              zIndex: 99999,
            }}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
          >
            <UserHoverCard user={user} userData={userData} />
          </div>,
          document.body
        )}
    </>
  );
};

export const ClickableUserAvatar = ({
  user,
  userData,
  avatarSrc,
  size = 40,
  onUserClick,
  className = "",
}) => {
  const displayName = user?.displayName || user?.name || userData?.displayName || "User";
  const resolvedAvatar = normalizeAvatarSource(avatarSrc) || getAvatarForUser({ ...user, __avatarSrc: avatarSrc });

  return (
    <UserHoverTarget
      user={{ ...user, __avatarSrc: resolvedAvatar }}
      userData={userData}
      className={className}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUserClick?.(user);
        }}
        aria-label={displayName}
        style={{
          width: size,
          height: size,
          borderRadius: "999px",
          overflow: "hidden",
          background: "#121821",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <img
          src={resolvedAvatar}
          alt={displayName}
          referrerPolicy="no-referrer"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            if (DEFAULT_AVATAR_SRC) {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_AVATAR_SRC;
            }
          }}
        />
      </button>
    </UserHoverTarget>
  );
};

export default UserHoverCard;
