import { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { getAvatarForUser } from "../utils/avatarService";
import {
  CURRENT_USER_AVATAR,
  CURRENT_USER_DISPLAY_NAME,
  isCurrentUserAuthor,
} from "../../utils/currentUser";

const UserHoverCard = ({ user, userData, className = "" }) => {
  const [genresExpanded, setGenresExpanded] = useState(false);

  const defaultGenres = [
    { name: "Rock", percent: 35, color: "#f56c42" },
    { name: "Pop", percent: 25, color: "#1db954" },
    { name: "Hip-Hop", percent: 15, color: "#3b82f6" },
    { name: "Other", percent: 25, color: "#9ca3af" },
  ];

  const rawDisplayName = userData?.displayName || user?.displayName || user?.name || "User";
  const isCurrentUser = isCurrentUserAuthor(user) || isCurrentUserAuthor(userData) || isCurrentUserAuthor(rawDisplayName);
  const displayName = isCurrentUser ? CURRENT_USER_DISPLAY_NAME : rawDisplayName;
  const verified = userData?.verified || false;
  const createdAt = userData?.createdAt || "Jan 2023";
  const following = userData?.following || 250;
  const followers = userData?.followers || 120;
  const discoveryPercent = userData?.discoveryPercent || 8;
  const avatar = user?.avatar || userData?.avatar || (isCurrentUser ? CURRENT_USER_AVATAR : getAvatarForUser(1));
  const genres =
    Array.isArray(userData?.genres) && userData.genres.length > 0
      ? userData.genres
      : defaultGenres;

  return (
    <div className={`uhcCard ${className}`}>
      <div className="uhcInner">
        <div className="uhcHeader">
          <div className="uhcAvatarWrap">
            <img
              src={avatar}
              alt={displayName}
              className="uhcAvatar"
              onError={(e) => {
                e.currentTarget.src = "/assets/default-avatar.png";
              }}
            />
          </div>

          <div className="uhcIdentity">
            <div className="uhcNameRow">
              <h3 className="uhcName">{displayName}</h3>
              {verified && (
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
            <div className="uhcMeta">Joined {createdAt}</div>
          </div>
        </div>

        <div className="uhcSection">
          <button
            type="button"
            className="uhcDiscoveryButton"
            onClick={() => setGenresExpanded((v) => !v)}
          >
            <span className="uhcDiscoveryText">
              Discovered {discoveryPercent}% of music
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
              {genres.map((genre, index) => (
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
            <span className="uhcCountValue">{following}</span>
            <span className="uhcCountLabel">Following</span>
          </div>
          <div className="uhcCountBlock">
            <span className="uhcCountValue">{followers}</span>
            <span className="uhcCountLabel">Followers</span>
          </div>
          <button className="uhcFollowButton" type="button">
            Follow
          </button>
        </div>
      </div>

      <style>{`
        .uhcCard {
          width: 300px;
          background: rgba(18, 22, 28, 0.96);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          color: #ffffff;
          overflow: hidden;
          transform: translateY(4px) scale(0.98);
          animation: uhcEnter 160ms ease-out forwards;
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
          font-size: 15px;
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
          font-size: 12px;
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
        }

        .uhcDiscoveryButton:hover {
          background: rgba(31, 41, 55, 0.92);
          border-color: rgba(255, 255, 255, 0.14);
        }

        .uhcDiscoveryText {
          font-size: 13px;
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
          font-size: 12px;
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
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
          color: #ffffff;
        }

        .uhcCountLabel {
          font-size: 11px;
          color: #9ca3af;
          line-height: 1;
        }

        .uhcFollowButton {
          margin-left: auto;
          border-radius: 999px;
          border: none;
          background: #ffffff;
          color: #0f172a;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 7px 14px;
          transition: background 140ms ease;
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

export const ClickableUserAvatar = ({
  user,
  userData,
  avatarSrc,
  size = 40,
  onUserClick,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const hideTimer = useRef(null);

  const rawDisplayName = user?.displayName || user?.name || "User";
  const isCurrentUser = isCurrentUserAuthor(user) || isCurrentUserAuthor(rawDisplayName);
  const displayName = isCurrentUser ? CURRENT_USER_DISPLAY_NAME : rawDisplayName;
  const resolvedAvatar = avatarSrc || user?.avatar || (isCurrentUser ? CURRENT_USER_AVATAR : getAvatarForUser(user));

  const showCard = useCallback(() => {
    if (!btnRef.current) return;

    const rect = btnRef.current.getBoundingClientRect();
    const cardWidth = 300;
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX;

    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));
    top = Math.max(8, top);

    setCardPos({ top, left });
    clearTimeout(hideTimer.current);
    setVisible(true);
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), 150);
  }, []);

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onUserClick) onUserClick(user);
  };

  return (
    <>
      <div
        ref={btnRef}
        className={className}
        style={{ position: "relative", display: "inline-block" }}
        onMouseEnter={showCard}
        onMouseLeave={scheduleHide}
      >
        <button
          type="button"
          onClick={handleClick}
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
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.src = "/assets/default-avatar.png";
            }}
          />
        </button>
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

export default UserHoverCard;
